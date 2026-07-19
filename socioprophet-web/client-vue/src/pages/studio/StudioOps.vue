<script setup lang="ts">
// The Operations cockpit — the Foundry-Workshop answer: makes the studio's data plane OPERABLE, not just
// callable. Pipelines (run), model registry (promote), data catalog, pay-gated compute (submit an execution),
// and GraphRAG communities — every action proof-carrying and, for compute, entitlement-gated like Databricks/
// Foundry but sovereign + multi-backend.
import { ref, onMounted, watch } from "vue";
import {
  loadPipelines, runPipeline, loadModels, promoteModel, loadCatalog, loadCompute, execute, loadCommunities,
  EPISTEMIC_COLORS,
  type Pipeline, type ModelEntry, type Dataset, type Compute, type Community, type ExecResult,
} from "../../services/studioApi";

const props = defineProps<{ project: string }>();

const pipelines = ref<Pipeline[]>([]);
const models = ref<ModelEntry[]>([]);
const datasets = ref<Dataset[]>([]);
const compute = ref<Compute | null>(null);
const communities = ref<Community[]>([]);
const loading = ref(true);
const err = ref("");
const token = ref("");

async function load() {
  loading.value = true; err.value = "";
  try {
    const [p, m, c, cp, cm] = await Promise.all([
      loadPipelines(props.project), loadModels(props.project), loadCatalog(props.project),
      loadCompute(props.project), loadCommunities(props.project),
    ]);
    pipelines.value = p.pipelines; models.value = m.models; datasets.value = c.datasets;
    compute.value = cp; communities.value = cm.communities;
  } catch (e) { err.value = e instanceof Error ? e.message : "failed to load operations"; }
  finally { loading.value = false; }
}
onMounted(load);
watch(() => props.project, load);

const STAGES = ["none", "staging", "production", "archived"];
const busy = ref(""); const flash = ref("");
function say(msg: string) { flash.value = msg; setTimeout(() => (flash.value = ""), 2600); }

async function doPromote(name: string, version: string, stage: string) {
  busy.value = `${name}:${version}`;
  try { const r = await promoteModel({ project: props.project, name, version, stage }, token.value); say(`${name} v${version} → ${r.stage}`); await load(); }
  catch (e) { say(e instanceof Error ? e.message : "promote failed"); }
  finally { busy.value = ""; }
}
async function doRun(pipeline: string) {
  busy.value = pipeline;
  try { const r = await runPipeline({ project: props.project, pipeline }, token.value); say(`Ran ${pipeline} · ${r.status}`); }
  catch (e) { say(e instanceof Error ? e.message : "run failed"); }
  finally { busy.value = ""; }
}

// compute / execute
const exBackend = ref("mesh-k8s");
const exKind = ref("notebook-cell");
const exRef = ref("");
const exResult = ref<ExecResult | null>(null);
const exBusy = ref(false);
async function submitExec() {
  exBusy.value = true; exResult.value = null;
  try { exResult.value = await execute({ project: props.project, kind: exKind.value, backend: exBackend.value, ref: exRef.value || undefined }, token.value); }
  catch (e) { say(e instanceof Error ? e.message : "execute failed"); }
  finally { exBusy.value = false; }
}

function color(mode?: string): string { return EPISTEMIC_COLORS[mode || "observed"] || "var(--faint)"; }
function kv(o: Record<string, number>): string { return Object.entries(o).map(([k, v]) => `${k}=${v}`).join("  "); }
</script>

<template>
  <div class="ops">
    <div class="obar">
      <span class="cnt">Operations · pipelines · registry · catalog · compute · communities</span>
      <div class="spacer" />
      <input v-model="token" type="password" class="tok" placeholder="write token" title="required for run / promote / execute" />
      <button class="ghost" @click="load" :disabled="loading" title="reload" aria-label="Reload operations">↻</button>
    </div>
    <p v-if="flash" class="flash">{{ flash }}</p>
    <p v-if="err" class="msg err">{{ err }}</p>
    <p v-else-if="loading" class="msg">Loading operations…</p>

    <div v-else class="grid">
      <!-- Pay-gated compute -->
      <section class="card wide" v-if="compute">
        <header class="ch"><span class="ci">⚙</span> Compute<span class="tagline">pay-gated · sovereign · multi-backend</span></header>
        <div class="backends">
          <label v-for="b in compute.backends" :key="b.id" class="backend" :class="{ sel: exBackend === b.id, ent: b.entitled }">
            <input type="radio" name="backend" :value="b.id" v-model="exBackend" />
            <span class="bn">{{ b.id }}<i class="bk">{{ b.kind }}</i></span>
            <span class="bnote">{{ b.note }}</span>
            <span class="bstate" :class="{ on: b.entitled }">{{ b.entitled ? "entitled" : "available" }}</span>
          </label>
        </div>
        <div class="exrow">
          <select v-model="exKind" class="sel-k">
            <option>notebook-cell</option><option>pipeline-step</option><option>job</option><option>query</option>
          </select>
          <input v-model="exRef" class="ref" placeholder="ref (notebook / pipeline id) — optional" />
          <button class="primary" @click="submitExec" :disabled="exBusy">{{ exBusy ? "…" : "Submit run" }}</button>
        </div>
        <div v-if="exResult" class="exres" :class="{ gated: !exResult.ok }">
          <template v-if="exResult.ok">
            ✓ dispatched to <b>{{ exResult.backend }}</b> · receipt <code class="mono">{{ exResult.receipt.correlation_id }}</code>
            <span class="rep">replayable</span>
          </template>
          <template v-else>
            🔒 <b>entitlement required</b> — {{ exResult.message }}
          </template>
        </div>
        <p class="sub">Same pay-gated model as Databricks/Foundry — <b>capability available, runtime provisioned only when entitled</b> — but the compute is sovereign (your mesh) or bring-your-own, and every run emits a governed, replayable receipt.</p>
      </section>

      <!-- Model registry -->
      <section class="card" v-if="models.length">
        <header class="ch"><span class="ci">◈</span> Model registry<span class="score">{{ models.reduce((n, m) => n + m.versions.length, 0) }} versions</span></header>
        <div v-for="m in models" :key="m.name" class="model">
          <div class="mname">{{ m.name }}</div>
          <div v-for="v in m.versions" :key="v.model_id" class="mver">
            <span class="vv">v{{ v.version }}</span>
            <span class="stage" :class="v.stage">{{ v.stage }}</span>
            <span class="mono met">{{ kv(v.metrics) }}</span>
            <span v-if="v.run" class="lineage mono" :title="'produced_by → run'">↳ {{ v.run.split(':').pop() }}</span>
            <select class="promote" :disabled="busy === `${m.name}:${v.version}`"
                    @change="e => doPromote(m.name, v.version, (e.target as HTMLSelectElement).value)">
              <option value="" disabled selected>promote…</option>
              <option v-for="s in STAGES" :key="s" :value="s" :disabled="s === v.stage">{{ s }}</option>
            </select>
          </div>
        </div>
        <p class="sub">Versions carry their <b>producing run</b> (provenance travels with the model); stage transitions are governed events — beats MLflow.</p>
      </section>

      <!-- Pipelines -->
      <section class="card" v-if="pipelines.length">
        <header class="ch"><span class="ci">⛓</span> Pipelines<span class="score">{{ pipelines.length }}</span></header>
        <div v-for="p in pipelines" :key="p.pipeline_id" class="pipe">
          <div class="prow">
            <span class="pname">{{ p.name }}</span>
            <button class="run" @click="doRun(p.name)" :disabled="busy === p.name">▷ Run</button>
          </div>
          <div class="dag">
            <template v-for="(s, i) in p.steps" :key="s.id">
              <span class="step" :title="s.kind">{{ s.id }}</span><span v-if="i < p.steps.length - 1" class="arrow">→</span>
            </template>
          </div>
        </div>
        <p class="sub">A proof-carrying DAG with a governed run ledger; lineage IS the graph — beats Databricks Workflows / Foundry Pipeline Builder.</p>
      </section>

      <!-- Data catalog -->
      <section class="card" v-if="datasets.length">
        <header class="ch"><span class="ci">▤</span> Data catalog<span class="score">{{ datasets.length }}</span></header>
        <table class="cat">
          <tbody>
            <tr v-for="d in datasets" :key="d.id">
              <td class="nm">{{ d.name }}</td>
              <td><span v-if="d.connector" class="pill">{{ d.connector }}</span></td>
              <td class="mono cols">{{ d.columns.join(", ") }}</td>
              <td><span class="epi" :style="{ borderColor: color(d.epistemic_mode), color: color(d.epistemic_mode) }">{{ d.epistemic_mode }}</span></td>
            </tr>
          </tbody>
        </table>
        <p class="sub">Datasets are proof-carrying graph nodes — provenance + epistemic status native, not a bolt-on catalog.</p>
      </section>

      <!-- GraphRAG communities -->
      <section class="card wide" v-if="communities.length">
        <header class="ch"><span class="ci">◍</span> GraphRAG communities<span class="score">{{ communities.length }} · {{ communities[0] ? 'louvain' : '' }}</span></header>
        <div class="comms">
          <div v-for="c in communities" :key="c.community" class="comm">
            <div class="crow"><b>{{ c.size }}</b> nodes
              <span class="mb-bar" v-if="c.size">
                <i v-for="(n, mode) in c.epistemic_distribution" :key="mode" :style="{ width: (n / c.size * 100) + '%', background: color(mode) }" :title="mode + ': ' + n" />
              </span>
            </div>
            <div class="top">{{ c.top_members.map(t => t.label).join(" · ") }}</div>
          </div>
        </div>
        <p class="sub">Communities detected over the <b>proof-carrying</b> graph (deterministic Louvain); each carries its epistemic profile — summaries attach next, frontier-authored.</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.ops { font: 14px/1.5 var(--ui); color: var(--ink); }
.ops :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: var(--r-1); }
.obar { display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-3); }
.obar .cnt { color: var(--muted); font-size: 12px; } .obar .spacer { flex: 1; }
.obar .tok { border: 1px solid var(--hairline-strong); border-radius: var(--r-2); padding: 6px 8px; font-size: 13px; width: 130px; background: var(--surface); color: var(--ink); }
.ghost { border: 1px solid var(--hairline-strong); background: var(--surface); color: var(--ink-2); border-radius: var(--r-2); width: 30px; height: 30px; cursor: pointer; }
.flash { background: var(--ok-wash); color: var(--ok); border-radius: var(--r-2); padding: 7px 12px; font-size: 12.5px; margin: 0 0 12px; }
.msg { color: var(--muted); } .msg.err { color: var(--fail); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--sp-3); }
.card { border: 1px solid var(--hairline); border-radius: var(--r-3); padding: var(--sp-3) var(--sp-4); background: var(--surface); }
.card.wide { grid-column: 1 / -1; }
.ch { display: flex; align-items: center; gap: var(--sp-2); font-weight: 600; font-size: 14px; margin-bottom: 10px; }
.ch .ci { color: var(--accent); } .ch .tagline { margin-left: auto; font-size: 10.5px; color: var(--accent); background: var(--accent-wash); border-radius: var(--pill); padding: 2px 9px; font-weight: 500; }
.score { margin-left: auto; font-size: 11px; color: var(--muted); background: var(--sunken); border-radius: var(--pill); padding: 2px 9px; font-variant-numeric: tabular-nums; }
.mono { font-family: var(--mono); font-size: 12px; }
.sub { color: var(--muted); font-size: 12px; margin: 10px 0 0; } .sub b { color: var(--ink); }

/* compute */
.backends { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--sp-2); margin-bottom: 10px; }
.backend { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; gap: 2px 8px; align-items: center;
  border: 1px solid var(--hairline); border-radius: var(--r-3); padding: 8px 10px; cursor: pointer; }
.backend.sel { border-color: var(--accent); background: var(--accent-wash); } .backend.ent { }
.backend input { grid-row: 1 / 3; } .bn { font-weight: 600; font-size: 13px; } .bn .bk { font-style: normal; font-size: 10px; color: var(--muted); margin-left: 6px; }
.bnote { grid-column: 2; font-size: 11px; color: var(--muted); } .bstate { grid-column: 2; font-size: 10px; color: var(--warn); } .bstate.on { color: var(--ok); }
.exrow { display: flex; gap: 6px; margin-bottom: 8px; }
.exrow .sel-k { border: 1px solid var(--hairline-strong); border-radius: var(--r-2); padding: 6px 8px; font-size: 13px; background: var(--surface); color: var(--ink); }
.exrow .ref { flex: 1; border: 1px solid var(--hairline-strong); border-radius: var(--r-2); padding: 6px 8px; font-size: 13px; background: var(--surface); color: var(--ink); }
.primary { border: 1px solid var(--accent); background: var(--accent); color: #fff; border-radius: var(--r-2); padding: 6px 14px; font-size: 13px; cursor: pointer; }
.primary:disabled { opacity: .6; }
.exres { font-size: 12.5px; border-radius: var(--r-2); padding: 8px 10px; background: var(--ok-wash); color: var(--ok); }
.exres.gated { background: var(--warn-wash); color: var(--warn); }
.exres .rep { margin-left: 6px; font-size: 10px; background: var(--surface); border-radius: var(--r-2); padding: 1px 6px; }

/* models */
.model { margin-bottom: 8px; } .mname { font-weight: 600; margin-bottom: 3px; }
.mver { display: flex; align-items: center; gap: var(--sp-2); font-size: 12.5px; padding: 3px 0; flex-wrap: wrap; }
.vv { font-weight: 700; color: var(--accent); font-variant-numeric: tabular-nums; }
.stage { font-size: 10px; border-radius: var(--pill); padding: 1px 7px; background: var(--sunken); color: var(--muted); }
.stage.production { background: var(--ok-wash); color: var(--ok); } .stage.staging { background: var(--accent-wash); color: var(--accent); } .stage.archived { background: var(--sunken); color: var(--faint); }
.met { color: var(--ok); font-variant-numeric: tabular-nums; } .lineage { color: var(--muted); }
.promote { margin-left: auto; border: 1px solid var(--hairline-strong); border-radius: var(--r-2); font-size: 11.5px; padding: 2px 6px; background: var(--surface); color: var(--ink); }

/* pipelines */
.pipe { margin-bottom: 8px; } .prow { display: flex; align-items: center; gap: var(--sp-2); }
.pname { font-weight: 600; } .run { margin-left: auto; border: 1px solid var(--accent); background: var(--surface); color: var(--accent); border-radius: var(--r-2); padding: 3px 10px; font-size: 12px; cursor: pointer; }
.dag { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-top: 5px; }
.step { font-size: 11.5px; background: var(--sunken); border-radius: var(--r-2); padding: 2px 9px; } .arrow { color: var(--faint); }

/* catalog */
.cat { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.cat td { padding: 5px 8px; border-bottom: 1px solid var(--sunken); } .cat tr:last-child td { border-bottom: 0; }
.cat .nm { font-weight: 600; } .cat .cols { color: var(--muted); } .pill { font-size: 10px; background: var(--hairline); border-radius: var(--r-2); padding: 1px 7px; color: var(--muted); }
.epi { font-size: 10px; border: 1px solid; border-radius: var(--r-1); padding: 1px 7px; }

/* communities */
.comms { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--sp-3); }
.comm { border: 1px solid var(--hairline); border-radius: var(--r-3); padding: 8px 10px; }
.crow { display: flex; align-items: center; gap: var(--sp-2); font-size: 12.5px; } .crow b { font-size: 16px; font-variant-numeric: tabular-nums; }
.mb-bar { display: flex; height: 7px; flex: 1; border-radius: var(--r-1); overflow: hidden; background: var(--sunken); } .mb-bar i { display: block; height: 100%; }
.top { font-size: 11.5px; color: var(--muted); margin-top: 5px; }
</style>
