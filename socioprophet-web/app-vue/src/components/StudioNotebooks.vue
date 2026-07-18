<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  loadNotebookAdapters, createNotebookSession, executeCell,
  type NbAdapter, type NbSession, type NbOutput, type NbReceipt,
} from "../services/studioApi";

const props = defineProps<{ project: string }>();

interface Cell {
  id: string; code: string; language: string;
  outputs: NbOutput[]; status: "idle" | "running" | "ok" | "error" | "degraded";
  receipt: NbReceipt | null; count: number | null; preview?: boolean;
}

const adapters = ref<Record<string, NbAdapter>>({});
const adapter = ref("jupyterlab");
const session = ref<NbSession | null>(null);
const sessionErr = ref("");
const cells = ref<Cell[]>([]);
let seq = 0;
const uid = () => `c${++seq}`;

// governed preview: illustrative cells with real-looking sealed receipts, clearly marked,
// so the surface reads world-class before the runtime is wired (never faked live output).
function seed(): Cell[] {
  return [
    { id: uid(), language: "python", status: "ok", count: 1, preview: true,
      code: "import pandas as pd\ndf = load('apple_2024_breach')   # governed dataset\ndf.shape",
      outputs: [{ type: "execute_result", text: "(899104, 42)" }],
      receipt: fakeReceipt("import…shape", "ok") },
    { id: uid(), language: "python", status: "ok", count: 2, preview: true,
      code: "# state carries across cells — one persistent kernel per session\ndf['warrant'].value_counts()",
      outputs: [{ type: "stream", name: "stdout", text: "attested    41\nverified    52\nderived     19\nobserved    12\nhypothesis   4\nName: warrant, dtype: int64" }],
      receipt: fakeReceipt("value_counts", "ok") },
    { id: uid(), language: "python", status: "idle", count: null, code: "", outputs: [], receipt: null },
  ];
}
function fakeReceipt(tag: string, status: string): NbReceipt {
  return { id: "sha256:" + hash(tag), project: props.project, adapter: adapter.value, language: "python",
           runtime: "python3", code_sha: "sha256:" + hash("c" + tag), outputs_sha: "sha256:" + hash("o" + tag),
           status, actor: "you", prev: null, ts: Date.now() / 1000 };
}
function hash(s: string): string { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(16).padStart(8, "0"); }

const runtime = computed(() => adapters.value[adapter.value]?.kernels?.[0] ?? "python3");
const wired = computed(() => session.value?.status && session.value.status !== "stub");
const stub = computed(() => !wired.value);

onMounted(async () => {
  cells.value = seed();
  try {
    const a = await loadNotebookAdapters();
    adapters.value = a.adapters; adapter.value = a.default;
    session.value = await createNotebookSession({ project: props.project, adapter: adapter.value, name: "Studio notebook" });
  } catch (e) { sessionErr.value = e instanceof Error ? e.message : "session failed"; }
});

async function run(cell: Cell) {
  if (!cell.code.trim()) return;
  cell.status = "running"; cell.preview = false;
  try {
    const r = await executeCell({ project: props.project, code: cell.code, language: cell.language, adapter: adapter.value, session_id: session.value?.id });
    cell.outputs = r.outputs ?? [];
    cell.receipt = r.receipt ?? null;
    cell.status = r.status === "ok" ? "ok" : r.status === "error" ? "error" : "degraded";
    if (r.degraded) cell.outputs = [{ type: "degraded", text: r.degraded }];
    cell.count = cell.status === "ok" || cell.status === "error" ? (maxCount() + 1) : cell.count;
  } catch (e) {
    cell.status = "error"; cell.outputs = [{ type: "error", ename: "RuntimeError", evalue: e instanceof Error ? e.message : "failed" }];
  }
  // append a fresh empty cell if we just ran the last one (Jupyter ergonomics)
  if (cells.value[cells.value.length - 1].id === cell.id) addCell();
}
function maxCount(): number { return cells.value.reduce((m, c) => Math.max(m, c.count ?? 0), 0); }
async function runAll() { for (const c of cells.value) if (c.code.trim()) await run(c); }
function addCell() { cells.value.push({ id: uid(), language: "python", status: "idle", count: null, code: "", outputs: [], receipt: null }); }
function removeCell(id: string) { cells.value = cells.value.filter((c) => c.id !== id); if (!cells.value.length) addCell(); }
function onKey(e: KeyboardEvent, cell: Cell) {
  if (e.key === "Enter" && (e.shiftKey || e.ctrlKey || e.metaKey)) { e.preventDefault(); run(cell); }
}
function short(id?: string | null) { return id ? id.replace("sha256:", "").slice(0, 8) : ""; }
const statColor: Record<string, string> = { ok: "var(--ok)", error: "var(--fail)", running: "var(--run)", degraded: "var(--warn)", idle: "var(--idle)" };
</script>

<template>
  <div class="nb">
    <!-- runtime toolbar -->
    <header class="nb-bar">
      <div class="nb-title">⬢ {{ session?.name || "Notebook" }}<span class="proj">· {{ project }}</span></div>
      <label class="rt">runtime
        <select v-model="adapter">
          <option v-for="(a, k) in adapters" :key="k" :value="k">{{ k }} · {{ a.kernels[0] }}</option>
        </select>
      </label>
      <span class="kstat"><i :style="{ background: wired ? 'var(--ok)' : 'var(--warn)' }" />{{ wired ? runtime + " · ready" : "runtime not wired" }}</span>
      <div class="sp" />
      <a v-if="session?.url" class="ghost" :href="session.url" target="_blank" rel="noopener">Open JupyterLab ↗</a>
      <button class="ghost" @click="addCell">＋ Cell</button>
      <button class="primary" @click="runAll">▸ Run all</button>
    </header>

    <p v-if="stub" class="note">
      Governed preview — the runtime (lattice-forge) isn’t wired to this build yet. The seeded cells show the
      shape; live runs execute on a <b>persistent per-session kernel</b> and seal a <b>receipt per cell</b> once
      <code>VITE_STUDIO_API</code> points at the Studio BFF.
    </p>
    <p v-if="sessionErr" class="note err">session: {{ sessionErr }}</p>

    <!-- cells -->
    <div class="cells">
      <div v-for="cell in cells" :key="cell.id" class="cell" :class="cell.status">
        <div class="gutter">
          <button class="run" :title="'Run (⇧⏎)'" @click="run(cell)"><span v-if="cell.status === 'running'" class="spin" />{{ cell.status === 'running' ? '' : '▸' }}</button>
          <span class="cnt">{{ cell.count != null ? '[' + cell.count + ']' : '[ ]' }}</span>
        </div>
        <div class="body">
          <textarea class="editor" :class="cell.language" v-model="cell.code" spellcheck="false"
                    :placeholder="'# ' + runtime + ' — ⇧⏎ to run'" rows="2"
                    @keydown="onKey($event, cell)" @input="(e:any)=>{e.target.style.height='auto';e.target.style.height=e.target.scrollHeight+'px'}" />
          <!-- outputs -->
          <div v-if="cell.outputs.length" class="out">
            <template v-for="(o, i) in cell.outputs" :key="i">
              <pre v-if="o.type === 'stream' || o.type === 'execute_result' || o.type === 'display_data'" class="stream">{{ o.text }}</pre>
              <pre v-else-if="o.type === 'error'" class="oerr">{{ o.ename }}: {{ o.evalue }}</pre>
              <div v-else-if="o.type === 'degraded'" class="odeg">⚠ {{ o.text }}</div>
            </template>
          </div>
          <!-- governed receipt strip — the moat, per cell -->
          <div v-if="cell.receipt" class="rcpt" :class="{ prev: cell.preview }">
            <span class="seal">⛨ receipt</span>
            <span class="mono">{{ short(cell.receipt.id) }}</span>
            <span class="dot" :style="{ background: statColor[cell.receipt.status] || 'var(--idle)' }" />{{ cell.receipt.status }}
            <span class="mono dim">code {{ short(cell.receipt.code_sha) }}</span>
            <span class="mono dim">out {{ short(cell.receipt.outputs_sha) }}</span>
            <span v-if="cell.receipt.prev" class="mono dim">↩ {{ short(cell.receipt.prev) }}</span>
            <span v-if="cell.preview" class="tag">preview</span>
            <span class="grow" />
            <span class="replay">replayable</span>
          </div>
        </div>
        <button class="x" title="delete cell" @click="removeCell(cell.id)">✕</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nb { font: 14px/1.5 var(--ui); color: var(--ink); }
.nb-bar { display: flex; align-items: center; gap: 12px; padding: 4px 0 12px; flex-wrap: wrap; }
.nb-title { font-size: 15px; font-weight: 600; } .nb-title .proj { color: var(--muted); font-weight: 400; margin-left: 6px; font-size: 13px; }
.rt { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); display: flex; align-items: center; gap: 6px; }
.rt select { width: auto; padding: 4px 8px; font-size: 12px; text-transform: none; letter-spacing: 0; }
.kstat { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); }
.kstat i { width: 8px; height: 8px; border-radius: 999px; }
.nb-bar .sp { flex: 1; }
.nb-bar .ghost { border: 1px solid var(--hairline-strong); background: var(--surface); color: var(--ink); border-radius: var(--r-2); padding: 6px 12px; font-size: 13px; cursor: pointer; text-decoration: none; }
.nb-bar .ghost:hover { background: var(--sunken); }
.nb-bar .primary { border: 0; background: var(--accent); color: #fff; border-radius: var(--r-2); padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
.nb-bar .primary:hover { background: var(--accent-2); }

.note { font-size: 12px; color: var(--warn); background: var(--warn-wash); border: 1px solid color-mix(in srgb, var(--warn) 30%, transparent); border-radius: var(--r-2); padding: 8px 12px; margin: 0 0 14px; }
.note.err { color: var(--fail); background: var(--fail-wash); border-color: color-mix(in srgb, var(--fail) 30%, transparent); }
.note code { font-family: var(--mono); font-size: 11px; }

.cells { display: flex; flex-direction: column; gap: 10px; }
.cell { display: grid; grid-template-columns: 44px 1fr 24px; align-items: start; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-3); position: relative; transition: border-color .15s, box-shadow .15s; }
.cell.running { border-color: var(--run); box-shadow: 0 0 0 3px var(--run-wash); }
.cell.error { border-color: color-mix(in srgb, var(--fail) 50%, var(--hairline)); }
.cell:hover .x { opacity: .6; }
.gutter { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 0; border-right: 1px solid var(--hairline); height: 100%; }
.gutter .run { width: 26px; height: 26px; border: 1px solid var(--hairline-strong); background: var(--surface); border-radius: var(--r-2); cursor: pointer; color: var(--accent); font-size: 12px; display: grid; place-items: center; }
.gutter .run:hover { background: var(--accent-wash); }
.gutter .cnt { font-family: var(--mono); font-size: 10px; color: var(--faint); }
.spin { width: 12px; height: 12px; border: 2px solid var(--run); border-top-color: transparent; border-radius: 999px; animation: sp .7s linear infinite; }
@keyframes sp { to { transform: rotate(360deg); } }

.body { min-width: 0; padding: 8px 12px; }
.editor { width: 100%; border: 0; background: none; resize: none; outline: none; color: var(--ink);
  font: 13px/1.55 var(--mono); padding: 4px 0; overflow: hidden; }
.editor::placeholder { color: var(--faint); }
.out { border-top: 1px solid var(--hairline); margin-top: 8px; padding-top: 8px; }
.out pre { margin: 0; font: 12px/1.5 var(--mono); white-space: pre-wrap; word-break: break-word; }
.out .stream { color: var(--ink-2); }
.out .oerr { color: var(--fail); background: var(--fail-wash); border-radius: var(--r-1); padding: 6px 8px; }
.out .odeg { color: var(--warn); font-size: 12px; }

.rcpt { display: flex; align-items: center; gap: 10px; margin-top: 9px; padding-top: 8px; border-top: 1px dashed var(--hairline); font-size: 11px; color: var(--muted); flex-wrap: wrap; }
.rcpt.prev { opacity: .8; }
.rcpt .seal { color: var(--epi-attested); font-weight: 600; }
.rcpt .mono { font-family: var(--mono); }
.rcpt .dim { color: var(--faint); }
.rcpt .dot { width: 7px; height: 7px; border-radius: 999px; }
.rcpt .tag { background: var(--sunken); border-radius: var(--r-1); padding: 0 6px; color: var(--faint); }
.rcpt .grow { flex: 1; }
.rcpt .replay { color: var(--epi-attested); background: var(--epi-attested-wash); border-radius: var(--r-1); padding: 0 6px; font-weight: 600; }

.cell .x { position: absolute; top: 8px; right: 6px; border: 0; background: none; color: var(--muted); cursor: pointer; opacity: 0; font-size: 12px; transition: opacity .15s; }
.cell .x:hover { opacity: 1 !important; color: var(--fail); }
</style>
