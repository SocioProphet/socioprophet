<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { loadExperiments, logExperiment, EPISTEMIC_COLORS, type Experiments } from "../../services/studioApi";

const props = defineProps<{ project: string }>();

const data = ref<Experiments | null>(null);
const loading = ref(true);
const err = ref("");

const showLog = ref(false);
const fName = ref("");
const fParams = ref('{"lr": 0.01}');
const fMetrics = ref('{"acc": 0.9}');
const token = ref("");
const logging = ref(false);
const logMsg = ref("");
const logErr = ref("");

async function load() {
  loading.value = true; err.value = "";
  try { data.value = await loadExperiments(props.project); }
  catch (e) { err.value = e instanceof Error ? e.message : "failed to load"; }
  finally { loading.value = false; }
}
onMounted(load);
watch(() => props.project, load);

function parseJson(s: string): Record<string, unknown> {
  try { const o = JSON.parse(s); if (o && typeof o === "object") return o as Record<string, unknown>; throw 0; }
  catch { throw new Error("params/metrics must be valid JSON objects"); }
}

async function submitLog() {
  logging.value = true; logMsg.value = ""; logErr.value = "";
  try {
    if (!fName.value.trim()) throw new Error("name required");
    const run = await logExperiment(
      { project: props.project, name: fName.value.trim(), params: parseJson(fParams.value), metrics: parseJson(fMetrics.value) as Record<string, number>, status: "finished" },
      token.value,
    );
    logMsg.value = `Logged ${run.run_id}`; fName.value = "";
    await load();
  } catch (e) { logErr.value = e instanceof Error ? e.message : "log failed"; }
  finally { logging.value = false; }
}

function color(mode?: string): string { return EPISTEMIC_COLORS[mode || "observed"] || "var(--faint)"; }
function kv(o: Record<string, unknown>): string { return Object.entries(o).map(([k, v]) => `${k}=${v}`).join("  "); }
</script>

<template>
  <div class="xp">
    <div class="xbar">
      <span class="cnt">{{ data?.count ?? 0 }} runs</span>
      <div class="spacer" />
      <button class="run" @click="showLog = !showLog">＋ Log run</button>
      <button class="ghost" @click="load" :disabled="loading" title="reload" aria-label="Reload runs">↻</button>
    </div>

    <div v-if="showLog" class="logbox">
      <div class="lrow">
        <input v-model="fName" placeholder="run name" />
        <input v-model="fParams" class="j mono" placeholder="params JSON" />
        <input v-model="fMetrics" class="j mono" placeholder="metrics JSON" />
        <input v-model="token" type="password" class="tok" placeholder="write token" />
        <button class="primary" @click="submitLog" :disabled="logging">{{ logging ? "…" : "Log" }}</button>
      </div>
      <p v-if="logErr" class="lfeedback err">{{ logErr }}</p>
      <p v-else-if="logMsg" class="lfeedback ok">✓ {{ logMsg }} — persisted as a proof-carrying graph fact</p>
    </div>

    <p v-if="err" class="msg err">{{ err }}</p>
    <p v-else-if="loading" class="msg">Loading runs…</p>
    <p v-else-if="!data?.runs.length" class="msg">No runs yet. Log one — it lands as a fact in the knowledge graph, queryable in the IDE.</p>

    <div v-else class="xscroll">
      <table class="xgrid">
        <thead><tr><th>Run</th><th>Status</th><th>Params</th><th>Metrics</th><th>Epistemic</th><th>When</th></tr></thead>
        <tbody>
          <tr v-for="r in data.runs" :key="r.run_id">
            <td class="nm">{{ r.name }}</td>
            <td><span class="pill" :class="r.status">{{ r.status }}</span></td>
            <td class="mono">{{ kv(r.params) }}</td>
            <td class="mono met">{{ kv(r.metrics) }}</td>
            <td><span class="epi" :style="{ borderColor: color(r.epistemic_mode), color: color(r.epistemic_mode) }">{{ r.epistemic_mode }}</span></td>
            <td class="when">{{ r.created_at }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="data?.runs.length" class="note">Runs are <b>graph facts</b>, not rows in a side DB — query them in the IDE, link them to data/models, and every metric carries its provenance.</p>
  </div>
</template>

<style scoped>
.xp { font: 14px/1.5 var(--ui); color: var(--ink); }
.xp :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: var(--r-1); }
.xbar { display: flex; align-items: center; gap: var(--sp-2); margin-bottom: 10px; }
.xbar .cnt { color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; } .xbar .spacer { flex: 1; }
.run { border: 1px solid var(--accent); background: var(--accent); color: #fff; border-radius: var(--r-2); padding: 6px 14px; font-size: 13px; cursor: pointer; }
.ghost { border: 1px solid var(--hairline-strong); background: var(--surface); color: var(--ink-2); border-radius: var(--r-2); width: 30px; height: 30px; cursor: pointer; }
.mono { font-family: var(--mono); font-size: 12px; }
.logbox { border: 1px solid var(--hairline-strong); border-radius: var(--r-3); background: var(--sunken); padding: 10px 12px; margin-bottom: 12px; }
.lrow { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.lrow input { border: 1px solid var(--hairline-strong); border-radius: var(--r-2); padding: 6px 8px; font-size: 13px; background: var(--surface); color: var(--ink); }
.lrow input.j { flex: 1; min-width: 140px; } .lrow input.tok { width: 120px; }
.lrow button.primary { border: 1px solid var(--accent); background: var(--accent); color: #fff; border-radius: var(--r-2); padding: 6px 14px; font-size: 13px; cursor: pointer; }
.lrow button.primary:disabled { opacity: .6; cursor: default; }
.lfeedback { margin: 8px 0 0; font-size: 12.5px; } .lfeedback.ok { color: var(--ok); } .lfeedback.err { color: var(--fail); }
.msg { color: var(--muted); } .msg.err { color: var(--fail); }
.xscroll { overflow-x: auto; border: 1px solid var(--hairline); border-radius: var(--r-3); }
.xgrid { border-collapse: collapse; width: 100%; font-size: 13px; }
.xgrid th { text-align: left; padding: 8px 12px; background: var(--sunken); border-bottom: 1px solid var(--hairline); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.xgrid td { padding: 8px 12px; border-bottom: 1px solid var(--sunken); white-space: nowrap; }
.xgrid tr:last-child td { border-bottom: 0; }
.xgrid .nm { font-weight: 600; } .xgrid .met { color: var(--ok); }
.pill { font-size: 10.5px; border-radius: var(--pill); padding: 1px 8px; background: var(--hairline); color: var(--muted); }
.pill.finished { background: var(--ok-wash); color: var(--ok); } .pill.running { background: var(--accent-wash); color: var(--accent); } .pill.failed { background: var(--fail-wash); color: var(--fail); }
.epi { font-size: 10.5px; border: 1px solid; border-radius: var(--r-1); padding: 1px 8px; }
.when { color: var(--muted); font-size: 11px; }
.note { color: var(--muted); font-size: 12.5px; margin-top: 8px; } .note b { color: var(--ink); }
</style>
