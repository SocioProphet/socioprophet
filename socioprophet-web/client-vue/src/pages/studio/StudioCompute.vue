<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
import {
  loadComputeRegistry, runCompute, planCompute, EPISTEMIC_COLORS,
  type ComputeKind, type ComputeResultLite, type ComputePlan,
} from "../../services/studioApi";

const props = defineProps<{ project: string }>();

// ── planner: the registry as an agent action space (capabilities → governed plan) ──
const planCaps = ref("");
const plan = ref<ComputePlan | null>(null);
const planning = ref(false);
const planErr = ref("");

async function doPlan() {
  const caps = planCaps.value.split(",").map((c) => c.trim()).filter(Boolean);
  if (!caps.length || planning.value) return;
  planning.value = true; planErr.value = ""; plan.value = null;
  try {
    plan.value = await planCompute({ capabilities: caps, project: props.project });
  } catch (e) {
    planErr.value = e instanceof Error ? e.message : "plan failed";
  } finally {
    planning.value = false;
  }
}
async function runPlan() {
  const p = plan.value?.plan;
  if (!p || running.value) return;
  running.value = true; runErr.value = ""; result.value = null;
  try {
    const res = await runCompute({ kind: "workflow", spec: p.spec as Record<string, unknown>, project: props.project });
    result.value = res;
    if (res.status === "ok" || res.status === "degraded") chain.value.unshift(res);
  } catch (e) {
    runErr.value = e instanceof Error ? e.message : "run failed";
  } finally {
    running.value = false;
  }
}

// ── registry (the catalog: "any compute, one door") ──
const kinds = ref<ComputeKind[]>([]);
const loading = ref(true);
const regErr = ref("");
const selectedKind = ref<string | null>(null);

const selected = computed<ComputeKind | null>(() => kinds.value.find((k) => k.kind === selectedKind.value) ?? null);

onMounted(async () => {
  try {
    const r = await loadComputeRegistry(props.project);
    kinds.value = r.kinds;
    // default the run panel to the first runnable (live + entitled) kind, else the first kind.
    const runnable = r.kinds.find((k) => k.status === "live" && k.entitled);
    pick((runnable ?? r.kinds[0])?.kind ?? null);
  } catch (e) {
    regErr.value = e instanceof Error ? e.message : "registry load failed";
  } finally {
    loading.value = false;
  }
});

// ── epistemic-warrant chip styling — colour off the shared ramp so this reads as the same ink everywhere ──
const EPI_WASH: Record<string, string> = {
  hypothesis: "var(--epi-hypothesis-wash)", observed: "var(--epi-observed-wash)",
  derived: "var(--epi-derived-wash)", verified: "var(--epi-verified-wash)", attested: "var(--epi-attested-wash)",
};
function epiStyle(mode: string) {
  const c = EPISTEMIC_COLORS[mode] || EPISTEMIC_COLORS.unknown;
  return { color: c, background: EPI_WASH[mode] || "var(--sunken)", borderColor: `color-mix(in srgb, ${c} 40%, transparent)` };
}

// ── spec editor — fields driven off the selected kind ──
interface SpecField { key: string; label: string; type: "code" | "text" | "select" | "json"; placeholder?: string; options?: string[]; rows?: number }
const WORKFLOW_EXAMPLE = `[
  { "id": "read",  "kind": "graph-stats", "spec": {} },
  { "id": "cell",  "kind": "notebook",    "spec": { "code": "df.shape" }, "needs": ["read"] }
]`;
function fieldsFor(k: ComputeKind | null): SpecField[] {
  if (!k) return [];
  switch (k.kind) {
    case "notebook": return [{ key: "code", label: "Cell code", type: "code", rows: 5, placeholder: "df = load('apple_2024_breach')  # governed dataset\ndf.shape" }];
    case "spark":    return [{ key: "code", label: "Spark job", type: "code", rows: 5, placeholder: "spark.read.parquet('s3://…').groupBy('cohort').count().show()" }];
    case "graph-query": return [
      { key: "lang", label: "Language", type: "select", options: ["sparql", "cypher", "gremlin"] },
      { key: "query", label: "Query", type: "code", rows: 4, placeholder: "MATCH (n) RETURN n LIMIT 10" },
    ];
    case "graph-stats": return [{ key: "metric", label: "Metric", type: "select", options: ["degree", "centrality", "communities"] }];
    case "inference": return [{ key: "prompt", label: "Prompt", type: "code", rows: 4, placeholder: "Summarize the warrant distribution across the corpus…" }];
    // the composite kind — a DAG of governed sub-computes; each step gets its own receipt.
    case "workflow": return [{ key: "steps", label: "Workflow steps (DAG · id · kind · spec · needs)", type: "json", rows: 8, placeholder: WORKFLOW_EXAMPLE }];
    default: return [{ key: "input", label: "Input", type: "text", placeholder: "spec…" }];
  }
}
const fields = computed(() => fieldsFor(selected.value));
const spec = reactive<Record<string, string>>({});
const backend = ref<string>("");

function pick(kind: string | null) {
  selectedKind.value = kind;
  // reset the spec to this kind's field defaults
  for (const key of Object.keys(spec)) delete spec[key];
  for (const f of fieldsFor(selected.value)) spec[f.key] = f.type === "select" ? (f.options?.[0] ?? "") : (f.type === "json" ? (f.placeholder ?? "") : "");
  backend.value = selected.value?.default ?? "";
}

// ── run ──
const running = ref(false);
const runErr = ref("");
const result = ref<ComputeResultLite | null>(null);
// the receipt chain: every sealed run in this session, newest first (the tamper-evident record).
const chain = ref<ComputeResultLite[]>([]);

const canRun = computed(() => !!selected.value && !running.value && fields.value.some((f) => (spec[f.key] ?? "").trim().length > 0 || f.type === "select"));

// the gateway returns the provenance subgraph itself (node/edge arrays); surface it as counts.
const deltaCounts = computed(() => {
  const d = result.value?.graph_delta;
  const n = d?.nodes?.length ?? 0, e = d?.edges?.length ?? 0;
  return (n || e) ? { n, e } : null;
});

// a workflow result carries its per-step summaries — the DAG execution, each step its own receipt.
interface WfStep { id: string; kind: string; backend: string; status: string; epistemic_status: string; receipt?: string | null; memoized?: boolean }
const wfSteps = computed<WfStep[]>(() => {
  const r = result.value;
  if (!r || r.kind !== "workflow") return [];
  const data = r.outputs?.[0]?.data as { steps?: WfStep[] } | undefined;
  return data?.steps ?? [];
});

async function run() {
  const k = selected.value;
  if (!k || running.value) return;
  // a workflow's spec is a parsed DAG; everything else passes its fields straight through.
  let payloadSpec: Record<string, unknown> = { ...spec };
  if (k.kind === "workflow") {
    try {
      const steps = JSON.parse(spec.steps || "[]");
      if (!Array.isArray(steps)) throw new Error("steps must be a JSON array");
      payloadSpec = { steps };
    } catch (e) {
      runErr.value = `workflow steps: ${e instanceof Error ? e.message : "invalid JSON"}`;
      return;
    }
  }
  running.value = true; runErr.value = ""; result.value = null;
  try {
    const res = await runCompute({ kind: k.kind, spec: payloadSpec, project: props.project, backend: backend.value || undefined });
    result.value = res;
    if (res.status === "ok" || res.status === "degraded") chain.value.unshift(res);
  } catch (e) {
    runErr.value = e instanceof Error ? e.message : "run failed";
  } finally {
    running.value = false;
  }
}

function short(id?: string | null) { return id ? String(id).replace(/^sha256:/, "").slice(0, 10) : ""; }
// mime may be a single string or a list (the gateway's ComputeOutput.mime is a list); find an image type.
function imageMime(mime?: string | string[]): string | null {
  const arr = Array.isArray(mime) ? mime : mime ? [mime] : [];
  return arr.find((m) => m.startsWith("image/")) ?? null;
}
function onKey(e: KeyboardEvent) { if (e.key === "Enter" && (e.shiftKey || e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); } }
</script>

<template>
  <div class="cp">
    <!-- ─────────────── planner: the registry as an agent action space ─────────────── -->
    <section class="planner">
      <div class="pl-head">
        <div>
          <h2>Plan a governed pipeline</h2>
          <p class="sub">Name the <b>capabilities</b> you want and the planner composes a governed workflow over the
            registry — observed reads first, then derivations — as a <b>preview you can run</b>. Planning is free;
            only execution is gated.</p>
        </div>
        <span class="wand" aria-hidden="true">✦</span>
      </div>
      <div class="pl-in">
        <input v-model="planCaps" placeholder="counts, python, embed  —  comma-separated capabilities"
               @keydown.enter="doPlan" />
        <button class="primary" :disabled="!planCaps.trim() || planning" @click="doPlan">
          <span v-if="planning" class="spin" />{{ planning ? 'Planning…' : 'Plan' }}
        </button>
      </div>
      <p v-if="planErr" class="note err">plan: {{ planErr }}</p>

      <div v-if="plan" class="pl-out" :class="{ nope: !plan.runnable }">
        <template v-if="plan.degraded">
          <span class="dwarn">⚠ {{ plan.degraded }}</span>
        </template>
        <template v-else>
          <div class="pl-meta">
            <span class="strat">{{ plan.strategy }}</span>
            <span v-if="plan.warrant_preview" class="epi-chip" :style="epiStyle(plan.warrant_preview)"
                  title="the plan's warrant = its weakest step">
              <i class="dot" :style="{ background: EPISTEMIC_COLORS[plan.warrant_preview] }" />warrant {{ plan.warrant_preview }}
            </span>
            <span class="rn" :class="{ ok: plan.runnable }">{{ plan.runnable ? '✓ runnable' : '✕ not runnable' }}</span>
          </div>
          <ol class="pl-steps">
            <li v-for="(s, i) in plan.steps" :key="s.id" class="pl-step">
              <span class="wf-idx">{{ i + 1 }}</span>
              <span class="wf-id">{{ s.kind }}</span>
              <span class="wf-kind">{{ s.backend }} · satisfies “{{ s.satisfies }}”</span>
              <span class="epi-chip sm" :style="epiStyle(s.epistemic)">{{ s.epistemic }}</span>
              <span v-if="!s.entitled" class="lockmini" title="not entitled">🔒</span>
            </li>
          </ol>
          <div v-if="plan.unmet_capabilities?.length || plan.unmet_entitlements?.length" class="unmet">
            <span v-if="plan.unmet_capabilities?.length">no kind provides: {{ plan.unmet_capabilities.join(', ') }}</span>
            <span v-if="plan.unmet_entitlements?.length">not entitled: {{ plan.unmet_entitlements.join(', ') }}</span>
          </div>
          <button class="primary run-plan" :disabled="!plan.runnable || running" @click="runPlan">
            <span v-if="running" class="spin" />▸ Run this plan
          </button>
        </template>
      </div>
    </section>

    <!-- ─────────────── the catalog: any compute, one door (the hero) ─────────────── -->
    <section class="reg">
      <div class="reg-head">
        <div>
          <h2>Compute registry</h2>
          <p class="sub">Every kind of compute — one governed door. Each declares its backends, capabilities, a
            default <b>epistemic warrant</b>, whether it executes your code, and whether you're entitled. Every run
            returns a proof-carrying receipt.</p>
        </div>
        <span class="door" aria-hidden="true">⛩</span>
      </div>

      <div v-if="loading" class="grid">
        <div v-for="i in 4" :key="i" class="kcard sk"><div class="sk-line w50" /><div class="sk-line w70" /></div>
      </div>
      <p v-else-if="regErr" class="note err">registry: {{ regErr }}</p>

      <div v-else class="grid" role="list">
        <button v-for="k in kinds" :key="k.kind" class="kcard" role="listitem"
                :class="{ on: selectedKind === k.kind, locked: !k.entitled }" @click="pick(k.kind)">
          <div class="krow">
            <span class="kname">{{ k.kind }}</span>
            <span class="ent" :class="{ open: k.entitled }" :title="k.entitled ? 'entitled' : 'not entitled — pay-gated'">
              {{ k.entitled ? '✓ entitled' : '🔒 locked' }}
            </span>
          </div>
          <div class="kmeta">
            <span class="epi-chip" :style="epiStyle(k.epistemic)" :title="'default epistemic warrant: ' + k.epistemic">
              <i class="dot" :style="{ background: EPISTEMIC_COLORS[k.epistemic] }" />{{ k.epistemic }}
            </span>
            <span class="stat" :class="k.status">{{ k.status === 'live' ? '● live' : '○ declared' }}</span>
            <span v-if="k.executes_user_code" class="uc" title="runs your code in a sandbox">▷ user-code</span>
          </div>
          <div class="kback"><span class="klbl">backends</span>
            <span v-for="b in k.backends" :key="b" class="bk" :class="{ def: b === k.default }">{{ b }}</span>
          </div>
          <div class="kcaps">
            <span v-for="c in k.capabilities" :key="c" class="cap">{{ c }}</span>
          </div>
        </button>
      </div>
    </section>

    <!-- ─────────────── run panel ─────────────── -->
    <section v-if="selected" class="run">
      <div class="run-head">
        <h3>Run <span class="rk">{{ selected.kind }}</span></h3>
        <label class="bsel">backend
          <select v-model="backend">
            <option v-for="b in selected.backends" :key="b" :value="b">{{ b }}{{ b === selected.default ? ' · default' : '' }}</option>
          </select>
        </label>
        <span class="epi-chip" :style="epiStyle(selected.epistemic)" :title="'results default to epistemic: ' + selected.epistemic">
          <i class="dot" :style="{ background: EPISTEMIC_COLORS[selected.epistemic] }" />warrant {{ selected.epistemic }}
        </span>
        <div class="sp" />
        <button class="primary" :disabled="!canRun" @click="run">
          <span v-if="running" class="spin" />{{ running ? 'Running…' : '▸ Run' }}
        </button>
      </div>

      <!-- spec editor — fields are driven off the selected kind -->
      <div class="spec">
        <div v-for="f in fields" :key="f.key" class="field" :class="{ wide: f.type === 'code' }">
          <label :for="'f-' + f.key">{{ f.label }}</label>
          <select v-if="f.type === 'select'" :id="'f-' + f.key" v-model="spec[f.key]">
            <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
          </select>
          <textarea v-else-if="f.type === 'code' || f.type === 'json'" :id="'f-' + f.key" v-model="spec[f.key]" class="code"
                    :rows="f.rows || 4" :placeholder="f.placeholder" spellcheck="false" @keydown="onKey" />
          <input v-else :id="'f-' + f.key" v-model="spec[f.key]" :placeholder="f.placeholder" @keydown="onKey" />
        </div>
      </div>
      <p v-if="runErr" class="note err">run: {{ runErr }}</p>

      <!-- ─────────────── result ─────────────── -->
      <div v-if="result" class="res" :class="result.status">
        <!-- entitlement pay-gate / zero-trust grant gate (gateway returns 200 with the typed status) -->
        <div v-if="result.status === 'entitlement_required' || result.status === 'grant_required'" class="paygate">
          <div class="pg-head">
            <span class="lock">🔒</span>
            <b>{{ result.status === 'grant_required' ? 'Capability grant required' : 'Entitlement required' }}</b>
            <span class="code402">{{ result.status === 'grant_required' ? 'zero-trust' : '402' }}</span>
          </div>
          <p>{{ result.message || `“${result.kind}” on ${result.backend} is a provisioned, pay-gated service — the capability is catalogued but no runtime is provisioned for you yet.` }}</p>
          <div class="pg-foot">
            <button class="primary">{{ result.status === 'grant_required' ? 'Request grant' : 'Provision entitlement' }}</button>
          </div>
        </div>

        <!-- honest degraded state (e.g. plane not wired) -->
        <div v-else-if="result.status === 'degraded'" class="degraded">
          <span class="dwarn">⚠ degraded</span>
          <span>{{ result.degraded || 'compute plane not wired' }}</span>
          <span class="dhint">No result is fabricated — wire <code>VITE_STUDIO_API</code> to the Studio BFF to run live.</span>
        </div>

        <!-- ok / error: outputs + epistemic status + receipt -->
        <template v-else>
          <div class="res-head">
            <span class="rstat" :class="result.status">{{ result.status === 'ok' ? '✓ ok' : '✕ error' }}</span>
            <span class="epi-chip" :style="epiStyle(result.epistemic_status)" title="epistemic status of THIS result">
              <i class="dot" :style="{ background: EPISTEMIC_COLORS[result.epistemic_status] }" />{{ result.epistemic_status }}
            </span>
            <span class="rback">{{ result.kind }} · {{ result.backend }}</span>
            <span v-if="deltaCounts" class="gdelta" title="provenance facts written to the project graph (PROV-O)">
              Δ {{ deltaCounts.n }} nodes · {{ deltaCounts.e }} edges</span>
            <span v-if="result.memoized" class="memo" title="served from the content-addressed compute memo — identical inputs, identical sealed proof">⚡ memoized</span>
            <span v-if="result.attestation?.results?.cosign_valid" class="attest"
                  title="zero-trust AttestationBundle: Ed25519 signature over the in-toto statement verifies (cosign-class)">⛨ attested</span>
          </div>

          <div v-if="result.error" class="oerr">{{ result.error }}</div>

          <!-- workflow: the DAG execution — each step is its own governed, sealed compute -->
          <div v-if="wfSteps.length" class="wf">
            <div class="wf-head">⛓ Workflow steps <span class="wf-n">{{ wfSteps.length }}</span></div>
            <ol class="wf-list">
              <li v-for="(s, i) in wfSteps" :key="s.id" class="wf-step" :class="s.status">
                <span class="wf-idx">{{ i + 1 }}</span>
                <span class="wf-id">{{ s.id }}</span>
                <span class="wf-kind">{{ s.kind }} · {{ s.backend }}</span>
                <span class="epi-chip sm" :style="epiStyle(s.epistemic_status)">
                  <i class="dot" :style="{ background: EPISTEMIC_COLORS[s.epistemic_status] }" />{{ s.epistemic_status }}
                </span>
                <span class="wf-stat" :class="s.status">{{ s.status === 'ok' ? '✓' : '✕' }} {{ s.status }}</span>
                <span v-if="s.memoized" class="memo sm" title="step served from the memo">⚡</span>
                <span v-if="s.receipt" class="mono dim wf-rc">⛨ {{ short(s.receipt) }}</span>
              </li>
            </ol>
          </div>

          <div v-if="result.outputs.length && !wfSteps.length" class="out">
            <template v-for="(o, i) in result.outputs" :key="i">
              <div v-if="imageMime(o.mime) && typeof o.data === 'string'" class="rich">
                <img :src="`data:${imageMime(o.mime)};base64,${o.data}`" alt="compute output" />
              </div>
              <pre v-else class="stream">{{ o.text ?? (o.data != null ? JSON.stringify(o.data, null, 2) : '') }}</pre>
            </template>
          </div>
          <p v-else-if="!wfSteps.length" class="empty">No outputs.</p>

          <!-- receipt strip — the moat (reuses the notebook receipt-strip idea) -->
          <div v-if="result.receipt" class="rcpt">
            <span class="seal">⛨ receipt</span>
            <span class="mono">{{ short(result.receipt.id) }}</span>
            <span v-if="result.receipt.signature" class="signed" title="Ed25519-signed by the compute-gateway (in-toto statement)">signed ✓</span>
            <span v-else class="unsigned" title="no signature on this receipt (no signing key configured)">unsigned</span>
            <span v-if="result.receipt.inputs_sha" class="mono dim">in {{ short(result.receipt.inputs_sha) }}</span>
            <span v-if="result.receipt.outputs_sha" class="mono dim">out {{ short(result.receipt.outputs_sha) }}</span>
            <span v-if="result.receipt.prev" class="mono dim">↩ {{ short(result.receipt.prev) }}</span>
            <span class="grow" />
            <span class="replay">replayable</span>
          </div>
        </template>
      </div>

      <!-- session receipt chain — the tamper-evident record of every run -->
      <div v-if="chain.length" class="chain">
        <div class="chain-head">⛨ Session receipt chain <span class="cn">{{ chain.length }}</span></div>
        <div class="crow" v-for="(c, i) in chain" :key="i">
          <span class="cdot" :style="{ background: EPISTEMIC_COLORS[c.epistemic_status] || 'var(--idle)' }" />
          <span class="mono cid">{{ c.receipt ? short(c.receipt.id) : '—' }}</span>
          <span class="ckind">{{ c.kind }} · {{ c.backend }}</span>
          <span class="epi-chip sm" :style="epiStyle(c.epistemic_status)">{{ c.epistemic_status }}</span>
          <span v-if="c.receipt?.signature" class="signed sm">signed ✓</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.cp { font: 14px/1.5 var(--ui); color: var(--ink); display: flex; flex-direction: column; gap: var(--sp-5); }

/* ── planner ── */
.planner { border: 1px solid var(--hairline); border-radius: var(--r-3); background: var(--surface); padding: var(--sp-4); }
.pl-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: var(--sp-3); }
.pl-head h2 { font-size: 16px; margin: 0; }
.pl-head .sub { color: var(--muted); font-size: 12.5px; margin: 4px 0 0; max-width: 620px; }
.pl-head .sub b { color: var(--ink-2); }
.pl-head .wand { font-size: 26px; color: var(--accent); opacity: .8; line-height: 1; }
.pl-in { display: flex; gap: 8px; }
.pl-in input { flex: 1; border: 1px solid var(--hairline); border-radius: var(--r-2); background: var(--surface-2);
  color: var(--ink); padding: 8px 12px; font-size: 13px; outline: none; }
.pl-in input:focus { border-color: var(--accent); }
.pl-out { margin-top: var(--sp-3); border: 1px solid var(--hairline); border-radius: var(--r-2); background: var(--ground); padding: var(--sp-3); }
.pl-out.nope { border-color: color-mix(in srgb, var(--warn) 35%, var(--hairline)); }
.pl-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.pl-meta .strat { font-family: var(--mono); font-size: 10.5px; color: var(--muted); background: var(--sunken); border-radius: var(--r-1); padding: 1px 7px; }
.pl-meta .rn { font-size: 11px; font-weight: 700; color: var(--fail); }
.pl-meta .rn.ok { color: var(--ok); }
.pl-steps { list-style: none; margin: 0 0 8px; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.pl-step { display: flex; align-items: center; gap: 10px; font-size: 11.5px; padding: 6px 10px; border: 1px solid var(--hairline);
  border-radius: var(--r-2); background: var(--surface); }
.pl-step .wf-idx { font-family: var(--mono); font-size: 10px; color: var(--faint); width: 14px; }
.pl-step .wf-id { font-weight: 700; color: var(--ink); }
.pl-step .wf-kind { font-family: var(--mono); font-size: 10.5px; color: var(--muted); }
.pl-step .lockmini { margin-left: auto; }
.unmet { display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: var(--warn); margin-bottom: 10px; }
.run-plan { margin-top: 2px; }
.pl-out .dwarn { color: var(--warn); font-weight: 700; background: var(--warn-wash); border-radius: var(--r-1); padding: 2px 8px; font-size: 12px; }

/* shared epistemic-warrant chip (coloured off the ramp) */
.epi-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600;
  padding: 1px 8px 1px 7px; border-radius: var(--r-1); border: 1px solid transparent; white-space: nowrap; }
.epi-chip .dot { width: 8px; height: 8px; border-radius: var(--pill); flex: 0 0 auto; }
.epi-chip.sm { font-size: 10px; padding: 0 6px; }

/* ── registry ── */
.reg-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: var(--sp-4); }
.reg-head h2 { font-size: 16px; margin: 0; }
.reg-head .sub { color: var(--muted); font-size: 12.5px; margin: 4px 0 0; max-width: 640px; }
.reg-head .sub b { color: var(--ink-2); }
.reg-head .door { font-size: 30px; color: var(--accent); opacity: .8; line-height: 1; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--sp-3); }
.kcard { text-align: left; border: 1px solid var(--hairline); border-radius: var(--r-3); background: var(--surface);
  padding: var(--sp-3) var(--sp-4); cursor: pointer; display: flex; flex-direction: column; gap: 8px;
  transition: border-color .12s, box-shadow .12s; color: inherit; font: inherit; }
.kcard:hover { border-color: var(--hairline-strong); box-shadow: var(--e-1); }
.kcard.on { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-wash); }
.kcard.locked { opacity: .82; }
.krow { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.kname { font-weight: 700; font-size: 14.5px; }
.ent { font-size: 10.5px; font-weight: 600; border-radius: var(--pill); padding: 1px 8px; color: var(--muted);
  border: 1px solid var(--hairline); background: var(--sunken); white-space: nowrap; }
.ent.open { color: var(--ok); border-color: color-mix(in srgb, var(--ok) 40%, transparent); background: var(--ok-wash); }
.kmeta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.stat { font-size: 10.5px; font-weight: 600; border-radius: var(--r-1); padding: 1px 7px; border: 1px solid var(--hairline); }
.stat.live { color: var(--ok); border-color: color-mix(in srgb, var(--ok) 40%, transparent); background: var(--ok-wash); }
.stat.declared { color: var(--muted); background: var(--sunken); }
.uc { font-size: 10px; color: var(--epi-derived); border: 1px solid color-mix(in srgb, var(--epi-derived) 35%, transparent);
  background: var(--epi-derived-wash); border-radius: var(--r-1); padding: 1px 6px; }
.kback { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; font-size: 11px; }
.kback .klbl { color: var(--faint); text-transform: uppercase; letter-spacing: .06em; font-size: 9.5px; margin-right: 2px; }
.bk { font-family: var(--mono); font-size: 10.5px; background: var(--sunken); color: var(--ink-2); border-radius: var(--r-1); padding: 1px 7px; }
.bk.def { color: var(--accent-ink); background: var(--accent-wash); }
.kcaps { display: flex; flex-wrap: wrap; gap: 4px; }
.cap { font-size: 10px; color: var(--muted); background: var(--sunken); border-radius: var(--r-1); padding: 1px 7px; }

/* ── run panel ── */
.run { border: 1px solid var(--hairline); border-radius: var(--r-3); background: var(--surface); padding: var(--sp-4); }
.run-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: var(--sp-3); }
.run-head h3 { font-size: 14px; margin: 0; }
.run-head .rk { font-family: var(--mono); color: var(--accent); font-weight: 700; }
.bsel { font-size: 10.5px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); display: inline-flex; align-items: center; gap: 6px; }
.bsel select, .field select { padding: 4px 8px; font-size: 12px; border: 1px solid var(--hairline); border-radius: var(--r-2);
  background: var(--surface); color: var(--ink); text-transform: none; letter-spacing: 0; }
.run-head .sp { flex: 1; }
.primary { border: 0; background: var(--accent); color: #fff; border-radius: var(--r-2); padding: 7px 16px; font-size: 13px;
  font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
.primary:hover:not(:disabled) { background: var(--accent-2); }
.primary:disabled { opacity: .5; cursor: default; }

.spec { display: flex; flex-wrap: wrap; gap: var(--sp-3); }
.field { display: flex; flex-direction: column; gap: 5px; }
.field.wide { flex: 1 1 100%; }
.field label { font-size: 10.5px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
.field input, .field .code { border: 1px solid var(--hairline); border-radius: var(--r-2); background: var(--surface-2);
  color: var(--ink); padding: 8px 10px; font-size: 13px; outline: none; }
.field input:focus, .field .code:focus, .field select:focus { border-color: var(--accent); }
.field .code { font: 13px/1.55 var(--mono); resize: vertical; width: 100%; }
.field input::placeholder, .field .code::placeholder { color: var(--faint); }

/* ── result ── */
.res { margin-top: var(--sp-4); border: 1px solid var(--hairline); border-radius: var(--r-3); background: var(--ground); padding: var(--sp-3) var(--sp-4); }
.res.error { border-color: color-mix(in srgb, var(--fail) 45%, var(--hairline)); }
.res-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.rstat { font-size: 11px; font-weight: 700; border-radius: var(--pill); padding: 1px 9px; }
.rstat.ok { color: var(--ok); background: var(--ok-wash); }
.rstat.error { color: var(--fail); background: var(--fail-wash); }
.rback { font-family: var(--mono); font-size: 11px; color: var(--muted); }
.gdelta { font-size: 10.5px; color: var(--epi-attested); background: var(--epi-attested-wash);
  border-radius: var(--r-1); padding: 1px 8px; font-weight: 600; }
.memo { font-size: 10.5px; color: var(--epi-verified); background: var(--epi-verified-wash);
  border-radius: var(--r-1); padding: 1px 8px; font-weight: 600; }
.attest { font-size: 10.5px; color: var(--epi-attested); background: var(--epi-attested-wash);
  border-radius: var(--r-1); padding: 1px 8px; font-weight: 700; }
.out { display: flex; flex-direction: column; gap: 8px; }
.out .stream { margin: 0; font: 12px/1.5 var(--mono); white-space: pre-wrap; word-break: break-word; color: var(--ink-2);
  background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-2); padding: 8px 10px; }
.rich img { max-width: 100%; border-radius: var(--r-2); }
.oerr { color: var(--fail); background: var(--fail-wash); border-radius: var(--r-2); padding: 8px 10px; font: 12px/1.5 var(--mono); }
.empty { color: var(--faint); font-size: 12px; margin: 0; }

.rcpt { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--hairline);
  font-size: 11px; color: var(--muted); flex-wrap: wrap; }
.rcpt .seal { color: var(--epi-attested); font-weight: 600; }
.rcpt .mono, .mono { font-family: var(--mono); }
.rcpt .dim { color: var(--faint); }
.rcpt .signed, .signed { color: var(--epi-attested); background: var(--epi-attested-wash); border-radius: var(--r-1);
  padding: 0 6px; font-weight: 600; }
.rcpt .unsigned { color: var(--warn); background: var(--warn-wash); border-radius: var(--r-1); padding: 0 6px; }
.rcpt .grow { flex: 1; }
.rcpt .replay { color: var(--epi-attested); background: var(--epi-attested-wash); border-radius: var(--r-1); padding: 0 6px; font-weight: 600; }

/* workflow step chain */
.wf { margin: 4px 0 10px; }
.wf-head { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.wf-head .wf-n { background: var(--epi-derived); color: #fff; border-radius: var(--pill); padding: 0 7px; font-size: 10px; }
.wf-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.wf-step { display: flex; align-items: center; gap: 10px; font-size: 11.5px; padding: 6px 10px; border: 1px solid var(--hairline);
  border-left-width: 3px; border-radius: var(--r-2); background: var(--surface); }
.wf-step.ok { border-left-color: var(--ok); }
.wf-step.error { border-left-color: var(--fail); }
.wf-step.degraded { border-left-color: var(--warn); }
.wf-idx { font-family: var(--mono); font-size: 10px; color: var(--faint); width: 14px; }
.wf-id { font-weight: 700; color: var(--ink); }
.wf-kind { font-family: var(--mono); font-size: 10.5px; color: var(--muted); }
.wf-stat { font-size: 10.5px; font-weight: 600; }
.wf-step.ok .wf-stat { color: var(--ok); }
.wf-step.error .wf-stat { color: var(--fail); }
.wf-rc { margin-left: auto; color: var(--epi-attested); }

/* pay-gate 402 */
.paygate { color: var(--ink); }
.pg-head { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.pg-head .lock { font-size: 16px; }
.pg-head .code402 { margin-left: auto; font-family: var(--mono); font-size: 11px; color: var(--warn);
  background: var(--warn-wash); border-radius: var(--r-1); padding: 1px 8px; font-weight: 700; }
.paygate p { color: var(--muted); font-size: 12.5px; margin: 8px 0 12px; max-width: 560px; }
.pg-foot { display: flex; align-items: center; gap: 12px; }
.pg-foot .price { font-weight: 700; color: var(--ink); }

/* degraded */
.degraded { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; font-size: 12.5px; color: var(--ink-2); }
.degraded .dwarn { color: var(--warn); font-weight: 700; background: var(--warn-wash); border-radius: var(--r-1); padding: 1px 8px; }
.degraded .dhint { color: var(--muted); font-size: 11.5px; flex: 1 1 100%; }
.degraded code { font-family: var(--mono); font-size: 11px; }

/* session chain */
.chain { margin-top: var(--sp-4); }
.chain-head { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.chain-head .cn { background: var(--epi-attested); color: #fff; border-radius: var(--pill); padding: 0 7px; font-size: 10px; }
.crow { display: flex; align-items: center; gap: 10px; padding: 5px 0; border-bottom: 1px solid var(--sunken); font-size: 11.5px; }
.crow:last-child { border-bottom: 0; }
.crow .cdot { width: 9px; height: 9px; border-radius: var(--pill); flex: 0 0 auto; }
.crow .cid { color: var(--ink-2); }
.crow .ckind { color: var(--muted); font-family: var(--mono); font-size: 10.5px; }

/* notes + skeletons */
.note { font-size: 12px; border-radius: var(--r-2); padding: 8px 12px; margin: 8px 0 0; }
.note.err { color: var(--fail); background: var(--fail-wash); border: 1px solid color-mix(in srgb, var(--fail) 30%, transparent); }
.sk { pointer-events: none; }
.sk-line { height: 10px; background: linear-gradient(90deg, var(--sunken), var(--hairline), var(--sunken));
  background-size: 200% 100%; border-radius: var(--r-1); margin: 6px 0; animation: sh 1.2s infinite; }
.w50 { width: 50%; } .w70 { width: 70%; }
@keyframes sh { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.spin { width: 12px; height: 12px; border: 2px solid #fff; border-top-color: transparent; border-radius: var(--pill); animation: spn .7s linear infinite; }
@keyframes spn { to { transform: rotate(360deg); } }

/* a11y */
.cp :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: var(--r-1); }
@media (prefers-reduced-motion: reduce) {
  .sk-line { animation: none; } .spin { animation: none; } .kcard { transition: none; }
}
</style>
