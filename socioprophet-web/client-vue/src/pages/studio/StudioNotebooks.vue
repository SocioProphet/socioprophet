<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  loadNotebookAdapters, createNotebookSession, executeCell, loadNotebookReceipts, proposeCell,
  type NbAdapter, type NbSession, type NbOutput, type NbReceipt,
} from "../../services/studioApi";

// a tiny inline bar chart (epistemic-coloured) to demonstrate rich output rendering in the preview
const MINI_SVG = `<svg viewBox="0 0 260 120" width="260" height="120" xmlns="http://www.w3.org/2000/svg">
${[["attested", 52, "#059669"], ["verified", 41, "#14b8a6"], ["derived", 19, "#8b5cf6"], ["observed", 12, "#4a90e2"], ["hypothesis", 4, "#94a1b2"]]
  .map((r, i) => `<rect x="76" y="${8 + i * 22}" width="${(r[1] as number) * 3}" height="16" rx="2" fill="${r[2]}"/><text x="70" y="${20 + i * 22}" text-anchor="end" font-size="10" fill="#64707e" font-family="sans-serif">${r[0]}</text>`).join("")}
</svg>`;

const props = defineProps<{ project: string }>();

interface Cell {
  id: string; code: string; language: string;
  outputs: NbOutput[]; status: "idle" | "running" | "ok" | "error" | "degraded";
  receipt: NbReceipt | null; count: number | null; preview?: boolean;
  // AI-proposed cells: a hypothesis until the user runs it (its receipt then attests it).
  proposed?: boolean; rationale?: string; proposedSource?: "model" | "heuristic";
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
      outputs: [{ type: "execute_result", html: "<table class='df'><tr><th>warrant</th><th>n</th></tr><tr><td>attested</td><td>41</td></tr><tr><td>verified</td><td>52</td></tr><tr><td>derived</td><td>19</td></tr></table>" }],
      receipt: fakeReceipt("value_counts", "ok") },
    { id: uid(), language: "python", status: "ok", count: 3, preview: true,
      code: "import matplotlib.pyplot as plt\ndf['warrant'].value_counts().plot.barh()   # real plots render inline\nplt.show()",
      outputs: [{ type: "display_data", svg: MINI_SVG }],
      receipt: fakeReceipt("plot", "ok") },
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
  // running a proposed cell is the act that attests it: the hypothesis earns a receipt.
  cell.status = "running"; cell.preview = false; cell.proposed = false;
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

// ── attested AI assistant: a model PROPOSES a cell (a hypothesis); running it seals a receipt → attested ──
const assistPrompt = ref("");
const assisting = ref(false);
const assistErr = ref("");
async function propose() {
  const prompt = assistPrompt.value.trim();
  if (!prompt || assisting.value) return;
  assisting.value = true; assistErr.value = "";
  try {
    const p = await proposeCell({ project: props.project, prompt });
    // insert the proposed cell before a trailing empty scratch cell if there is one, else append.
    const cell: Cell = {
      id: uid(), language: "python", status: "idle", count: null, code: p.code, outputs: [], receipt: null,
      proposed: true, rationale: p.rationale, proposedSource: p.source,
    };
    const last = cells.value[cells.value.length - 1];
    if (last && !last.code.trim() && last.status === "idle" && !last.proposed) {
      cells.value.splice(cells.value.length - 1, 0, cell);
    } else {
      cells.value.push(cell);
    }
    assistPrompt.value = "";
  } catch (e) {
    assistErr.value = e instanceof Error ? e.message : "proposal failed";
  } finally {
    assisting.value = false;
  }
}

// ── session provenance: the tamper-evident receipt chain across all cells (the moat) ──
const chainOpen = ref(false);
const serverCount = ref<number | null>(null);
const chain = computed<NbReceipt[]>(() => cells.value.filter((c) => c.receipt).map((c) => c.receipt!));
async function toggleChain() {
  chainOpen.value = !chainOpen.value;
  if (chainOpen.value) { const r = await loadNotebookReceipts(props.project); serverCount.value = r.degraded ? null : (r.count ?? null); }
}
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
      <button class="ghost prov-btn" :class="{ on: chainOpen }" @click="toggleChain" title="Tamper-evident receipt chain">⛨ Provenance<span v-if="chain.length" class="cnt2">{{ chain.length }}</span></button>
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
      <div v-for="cell in cells" :key="cell.id" class="cell" :class="[cell.status, { proposed: cell.proposed }]">
        <div class="gutter">
          <button class="run" :title="'Run (⇧⏎)'" @click="run(cell)"><span v-if="cell.status === 'running'" class="spin" />{{ cell.status === 'running' ? '' : '▸' }}</button>
          <span class="cnt">{{ cell.count != null ? '[' + cell.count + ']' : '[ ]' }}</span>
        </div>
        <div class="body">
          <!-- AI proposal: an epistemic hypothesis until the user runs it (its receipt then attests it) -->
          <div v-if="cell.proposed" class="prop">
            <span class="pbadge">✦ proposed · hypothesis</span>
            <span class="psrc" :class="cell.proposedSource">
              {{ cell.proposedSource === 'model' ? 'assistant model' : 'offline heuristic — no model wired' }}
            </span>
            <span class="prat">{{ cell.rationale }}</span>
            <span class="phint">unproven — <b>run it</b> to seal a receipt and attest it ⛨</span>
          </div>
          <textarea class="editor" :class="cell.language" v-model="cell.code" spellcheck="false"
                    :placeholder="'# ' + runtime + ' — ⇧⏎ to run'" rows="2"
                    @keydown="onKey($event, cell)" @input="(e:any)=>{e.target.style.height='auto';e.target.style.height=e.target.scrollHeight+'px'}" />
          <!-- outputs -->
          <div v-if="cell.outputs.length" class="out">
            <template v-for="(o, i) in cell.outputs" :key="i">
              <!-- rich: plots (png/svg) and tables/HTML (DataFrame._repr_html_) — real DS output -->
              <img v-if="o.png" class="rich" :src="'data:image/png;base64,' + o.png" alt="cell output" />
              <div v-else-if="o.svg" class="rich" v-html="o.svg" />
              <div v-else-if="o.html" class="rich htmlout" v-html="o.html" />
              <pre v-else-if="o.type === 'error'" class="oerr">{{ o.ename }}: {{ o.evalue }}</pre>
              <div v-else-if="o.type === 'degraded'" class="odeg">⚠ {{ o.text }}</div>
              <pre v-else class="stream">{{ o.text }}</pre>
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

    <!-- attested AI assistant — Genie-parity, but a proposal is only a HYPOTHESIS until you run it -->
    <div class="assist">
      <span class="amark" aria-hidden="true">✦</span>
      <input class="ainput" v-model="assistPrompt" :disabled="assisting"
             placeholder="Ask the assistant to draft a cell — e.g. ‘load the breach dataset and plot the warrant distribution’"
             @keydown.enter="propose" />
      <button class="apropose" :disabled="assisting || !assistPrompt.trim()" @click="propose">
        <span v-if="assisting" class="spin" />{{ assisting ? 'Proposing…' : '✦ Propose' }}
      </button>
    </div>
    <p class="ahint">
      The assistant <b>proposes</b> a cell as an epistemic <b>hypothesis</b> — a model may propose, but only
      <b>execution</b> (a sealed receipt) makes it real. {{ wired ? 'Backed by the Studio assistant model.' : 'No model wired to this build — proposals come from a deterministic offline heuristic, labelled as such. Never a fabricated model answer.' }}
    </p>
    <p v-if="assistErr" class="note err amsg">assistant: {{ assistErr }}</p>

    <!-- session provenance chain — the tamper-evident record Databricks can't produce -->
    <transition name="slide">
      <aside v-if="chainOpen" class="prov-drawer">
        <button class="x2" @click="chainOpen = false" aria-label="Close">✕</button>
        <div class="pk">Session provenance</div>
        <h3>Tamper-evident receipt chain</h3>
        <p class="pcap">Every cell run is sealed and hash-chained to the one before it. Reorder a cell, edit an output, or forge a result and the chain breaks. This is the record a Databricks notebook can’t produce.</p>
        <div v-if="!chain.length" class="empty2">Run a cell to start the chain.</div>
        <div v-else class="chainlist">
          <div v-for="(r, i) in chain" :key="r.id" class="crow">
            <span class="cdot" :style="{ background: statColor[r.status] || 'var(--idle)' }" />
            <div class="cinfo">
              <div class="cid mono">{{ short(r.id) }}<span class="crt">{{ r.runtime }}</span></div>
              <div class="cmeta"><span class="mono">code {{ short(r.code_sha) }}</span> · <span class="mono">out {{ short(r.outputs_sha) }}</span></div>
              <div v-if="i > 0" class="clink mono">↩ prev {{ short(r.prev || chain[i - 1].id) }}</div>
            </div>
          </div>
        </div>
        <div class="pfoot">
          <span v-if="serverCount != null">✓ server chain: <b>{{ serverCount }}</b> sealed · replayable</span>
          <span v-else>preview chain — runtime not wired</span>
        </div>
      </aside>
    </transition>
  </div>
</template>

<style scoped>
.nb { font: 14px/1.5 var(--ui); color: var(--ink); position: relative; }
.prov-btn.on { background: var(--accent-wash); border-color: color-mix(in srgb, var(--accent) 40%, transparent); color: var(--accent-ink); }
.prov-btn .cnt2 { margin-left: 6px; background: var(--epi-attested); color: #fff; border-radius: 999px; padding: 0 6px; font-size: 11px; }

/* rich outputs — plots (png/svg) + tables (DataFrame HTML) */
.rich { max-width: 100%; margin: 4px 0; }
.rich :deep(svg) { max-width: 100%; height: auto; }
.htmlout { overflow-x: auto; }
.htmlout :deep(table) { border-collapse: collapse; font: 12px/1.4 var(--mono); }
.htmlout :deep(th), .htmlout :deep(td) { border: 1px solid var(--hairline); padding: 3px 10px; text-align: right; }
.htmlout :deep(th) { background: var(--sunken); color: var(--muted); font-weight: 600; }

/* provenance chain drawer */
.prov-drawer { position: absolute; top: 0; right: 0; width: 320px; max-height: 100%; overflow: auto; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-3); box-shadow: var(--e-3); padding: 18px 20px; z-index: 20; }
.prov-drawer .x2 { position: absolute; top: 12px; right: 14px; border: 0; background: none; color: var(--muted); cursor: pointer; font-size: 15px; }
.prov-drawer .pk { font-size: 10px; text-transform: uppercase; letter-spacing: .09em; color: var(--muted); }
.prov-drawer h3 { margin: 4px 0 6px; font-size: 15px; }
.prov-drawer .pcap { font-size: 12px; color: var(--muted); margin: 0 0 14px; }
.prov-drawer .empty2 { font-size: 12px; color: var(--faint); padding: 20px 0; text-align: center; }
.chainlist { display: flex; flex-direction: column; gap: 0; }
.crow { display: flex; gap: 10px; position: relative; padding-bottom: 14px; }
.crow::before { content: ""; position: absolute; left: 4px; top: 12px; bottom: -2px; width: 2px; background: var(--epi-attested); opacity: .35; }
.crow:last-child::before { display: none; }
.crow .cdot { width: 10px; height: 10px; border-radius: 999px; margin-top: 2px; flex: 0 0 auto; z-index: 2; }
.crow .cid { font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.crow .crt { font-size: 10px; color: var(--faint); font-weight: 400; text-transform: none; }
.crow .cmeta { font-size: 10.5px; color: var(--muted); margin-top: 2px; }
.crow .clink { font-size: 10px; color: var(--faint); margin-top: 2px; }
.prov-drawer .pfoot { margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--hairline); font-size: 11px; color: var(--muted); }
.prov-drawer .pfoot b { color: var(--epi-attested); }
.slide-enter-active, .slide-leave-active { transition: transform .2s ease, opacity .2s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(14px); opacity: 0; }
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

/* proposed cell — a hypothesis until run. Coloured with the hypothesis ink so it reads as unproven. */
.cell.proposed { border-color: color-mix(in srgb, var(--epi-hypothesis) 55%, var(--hairline)); box-shadow: 0 0 0 3px var(--epi-hypothesis-wash); }
.cell.proposed .gutter .run { color: var(--epi-hypothesis); border-color: color-mix(in srgb, var(--epi-hypothesis) 45%, transparent); }
.prop { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 10px; margin-bottom: 8px; font-size: 11px; }
.prop .pbadge { color: #fff; background: var(--epi-hypothesis); border-radius: var(--r-1); padding: 1px 8px; font-weight: 600; letter-spacing: .02em; }
.prop .psrc { font-family: var(--mono); font-size: 10.5px; border-radius: var(--r-1); padding: 1px 7px; border: 1px solid var(--hairline); color: var(--muted); }
.prop .psrc.model { color: var(--epi-verified); border-color: color-mix(in srgb, var(--epi-verified) 40%, transparent); background: var(--epi-verified-wash); }
.prop .psrc.heuristic { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 35%, transparent); background: var(--warn-wash); }
.prop .prat { color: var(--muted); flex: 1 1 240px; min-width: 0; }
.prop .phint { color: var(--epi-hypothesis); font-weight: 500; }
.prop .phint b { color: var(--epi-attested); }

/* attested AI assistant bar — Genie-parity, proof-carrying */
.assist { display: flex; align-items: center; gap: 10px; margin-top: 16px; padding: 8px 10px 8px 14px;
  background: var(--surface); border: 1px solid var(--hairline-strong); border-radius: var(--r-3);
  box-shadow: 0 0 0 3px var(--epi-hypothesis-wash); }
.assist .amark { color: var(--epi-hypothesis); font-size: 16px; flex: 0 0 auto; }
.assist .ainput { flex: 1; border: 0; background: none; outline: none; color: var(--ink); font: 13px/1.5 var(--ui); min-width: 0; }
.assist .ainput::placeholder { color: var(--faint); }
.assist .ainput:disabled { color: var(--muted); }
.assist .apropose { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 7px; border: 0;
  background: var(--epi-hypothesis); color: #fff; border-radius: var(--r-2); padding: 7px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
.assist .apropose:hover:not(:disabled) { background: color-mix(in srgb, var(--epi-hypothesis) 82%, #000); }
.assist .apropose:disabled { opacity: .55; cursor: default; }
.assist .apropose .spin { border-color: #fff; border-top-color: transparent; }
.ahint { font-size: 11px; color: var(--muted); margin: 8px 2px 0; }
.ahint b { color: var(--ink-2); font-weight: 600; }
.amsg { margin-top: 10px; }
</style>
