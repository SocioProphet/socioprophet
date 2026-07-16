<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { loadStudio, SECTION_COUNT, type StudioBundle, type StudioSection } from "../services/studioApi";
import StudioGraph from "../components/StudioGraph.vue";

const bundle = ref<StudioBundle | null>(null);
const error = ref("");
const loading = ref(true);
const section = ref<StudioSection>("notebooks");
const query = ref("");
const selected = ref<{ kind: StudioSection; item: Record<string, any> } | null>(null);
// Project scope — every artifact lives in the project's proj- collection, so the agent team already retrieves it.
const project = ref("Untitled project");

const sections: { id: StudioSection; label: string; icon: string; group: string; blurb: string }[] = [
  { id: "notebooks",   label: "Notebooks",     icon: "⬢", group: "Workbench", blurb: "Ray-backed notebooks — authoring + provenance, run as jobs on the fabric." },
  { id: "data",        label: "Data catalog",  icon: "▤", group: "Workbench", blurb: "Governed datasets & tables with lineage and reproduce commands." },
  { id: "models",      label: "Model catalog", icon: "◈", group: "Workbench", blurb: "The model zoo — factsheets, lineage, promote & serve." },
  { id: "tuning",      label: "Tune",          icon: "✳", group: "Workbench", blurb: "LoRA & quantized fine-tunes on the Ray fabric · SAE / circuit probes (roadmap)." },
  { id: "experiments", label: "Experiments",   icon: "⟳", group: "Workbench", blurb: "Reproducible science — provenance + lockfiles, one-click re-run." },
  { id: "extraction",  label: "Extraction",    icon: "⛏", group: "Knowledge engineering", blurb: "Pull knowledge into the project graph — Holmes entities/relations, Sherlock federated search, governed ingest." },
  { id: "ontology",    label: "Ontology",      icon: "⬡", group: "Knowledge engineering", blurb: "The schema & alignment layer — Ontogenesis classes, relations, KKO alignment." },
  { id: "graph",       label: "Graph",         icon: "⧉", group: "Knowledge engineering", blurb: "The project knowledge graph — HellGraph, gremlin/sparql, grounded to your docs." },
  { id: "retrieval",   label: "Retrieval",     icon: "◎", group: "Knowledge engineering", blurb: "Fibered retrieval (PageIndex ⊕ HellGraph) · Graph-RAG · topic & semantic indexes." },
  { id: "generation",  label: "Generation",    icon: "✦", group: "Knowledge engineering", blurb: "Grounded generation & generation-tuning — New-Hope synthesis over the graph." },
];
const groups = computed(() => [...new Set(sections.map((s) => s.group))]);

onMounted(async () => {
  try { bundle.value = await loadStudio(); }
  catch (e) { error.value = e instanceof Error ? e.message : "failed to load studio"; }
  finally { loading.value = false; }
  window.addEventListener("keydown", onKey);
});
onUnmounted(() => window.removeEventListener("keydown", onKey));
function onKey(e: KeyboardEvent) { if (e.key === "Escape") selected.value = null; }

const items = computed<Record<string, any>[]>(() => {
  const b = bundle.value; if (!b) return [];
  const list = (b[section.value] ?? []) as Record<string, any>[];
  const q = query.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter((it) => JSON.stringify(it).toLowerCase().includes(q));
});
const activeMeta = computed(() => sections.find((s) => s.id === section.value)!);
function pick(item: Record<string, any>) { selected.value = { kind: section.value, item }; }

// Cross-links / actions map to the real tritfabric verbs (tune, promote, serve, reproduce). Wired to the BFF next.
const actionsFor: Record<StudioSection, { label: string; hint: string }[]> = {
  notebooks:   [{ label: "Open", hint: "open the notebook" }, { label: "Run as job", hint: "submit to Ray via tritfabric" }, { label: "Share to team", hint: "in the project collection already" }],
  data:        [{ label: "New notebook", hint: "start a notebook on this data" }, { label: "Lineage", hint: "view provenance" }, { label: "Reproduce", hint: "run the reproduce command" }],
  models:      [{ label: "Promote", hint: "tritfabric /v1/promote" }, { label: "Serve", hint: "tritfabric Serve.Deploy" }, { label: "Factsheet", hint: "governance factsheet" }],
  tuning:      [{ label: "Register model", hint: "→ model zoo" }, { label: "Logs", hint: "job status" }, { label: "Cancel", hint: "cancel job" }],
  experiments: [{ label: "Re-run", hint: "reproduce end-to-end" }, { label: "Provenance", hint: "in-toto chain" }, { label: "Publish", hint: "publication artifact" }],
  extraction:  [{ label: "Run extraction", hint: "Holmes/Sherlock → project graph" }, { label: "View in graph", hint: "open the graph" }, { label: "Share to team", hint: "in the project collection" }],
  ontology:    [{ label: "Edit ontology", hint: "Ontogenesis" }, { label: "Align", hint: "map to KKO / project" }, { label: "Apply to graph", hint: "re-type entities" }],
  graph:       [{ label: "Open graph", hint: "HellGraph gremlin/sparql" }, { label: "Query", hint: "graph-RAG" }, { label: "Export", hint: "sub-graph" }],
  retrieval:   [{ label: "Query", hint: "run fibered retrieval" }, { label: "Rebuild index", hint: "re-embed" }, { label: "Use in notebook", hint: "attach retriever" }],
  generation:  [{ label: "Run", hint: "New-Hope grounded synthesis" }, { label: "→ Annotation set", hint: "into the workbench" }, { label: "→ Tune", hint: "generation-tuning" }],
};
</script>

<template>
  <div class="studio">
    <!-- top command bar -->
    <header class="topbar">
      <div class="brand">⬢ Studio</div>
      <button class="proj" :title="'Project scope — shared with your agent team'">{{ project }} <span class="chev">▾</span></button>
      <div class="search">
        <span class="mag">⌕</span>
        <input v-model="query" :placeholder="`Search ${activeMeta.label.toLowerCase()}…`" aria-label="Search" />
      </div>
      <div class="spacer" />
      <button class="ghost" title="Everything here is in the project's collection — your agent team already reads it.">⤳ Share to agent team</button>
      <button class="primary">＋ New <span class="chev">▾</span></button>
    </header>

    <div class="body">
      <!-- section rail -->
      <aside class="rail">
        <template v-for="g in groups" :key="g">
          <div class="rail-group">{{ g }}</div>
          <button v-for="s in sections.filter((x) => x.group === g)" :key="s.id" :class="{ on: section === s.id }" @click="section = s.id; selected = null">
            <span class="ic">{{ s.icon }}</span>
            <span class="lbl">{{ s.label }}</span>
            <span class="cnt">{{ SECTION_COUNT(bundle, s.id) }}</span>
          </button>
        </template>
        <div class="rail-foot">
          <span v-if="bundle?.stub" class="stub">preview · fabric not yet wired</span>
        </div>
      </aside>

      <!-- main panel -->
      <main class="panel">
        <div class="sec-head" v-if="section !== 'graph'">
          <h1>{{ activeMeta.icon }} {{ activeMeta.label }}</h1>
          <p class="blurb">{{ activeMeta.blurb }}</p>
        </div>

        <!-- Graph section = the provenance-first explorer (KE-2) -->
        <StudioGraph v-if="section === 'graph'" :project="project" />

        <!-- skeletons -->
        <div v-else-if="loading" class="grid">
          <div v-for="i in 4" :key="i" class="card skeleton"><div class="sk-line w60" /><div class="sk-line w40" /></div>
        </div>
        <p v-else-if="error" class="msg err">{{ error }}</p>
        <p v-else-if="!items.length" class="msg empty">Nothing here yet{{ query ? ` for “${query}”` : "" }}.</p>

        <div v-else class="grid">
          <article v-for="it in items" :key="it.id" class="card" :class="{ sel: selected?.item.id === it.id }" @click="pick(it)">
            <!-- notebooks -->
            <template v-if="section === 'notebooks'">
              <div class="row"><span class="name">{{ it.name }}</span><span class="pill" :class="it.status">{{ it.status }}</span></div>
              <div class="sub">{{ it.runtime }} · {{ it.cells }} cells</div>
              <code v-if="it.lastCell" class="mono">{{ it.lastCell }}</code>
              <div class="chips"><span v-for="c in it.collaborators" :key="c" class="chip">{{ c }}</span></div>
            </template>
            <!-- data -->
            <template v-else-if="section === 'data'">
              <div class="row"><span class="name">{{ it.name }}</span><span v-if="it.governed" class="pill ok">governed</span><span v-else class="pill warn">ungoverned</span></div>
              <div class="sub">{{ it.kind }}<span v-if="it.rows"> · {{ it.rows.toLocaleString() }} rows</span><span v-if="it.columns"> · {{ it.columns }} cols</span></div>
              <div v-if="it.lineage" class="lineage">{{ it.lineage.join(" ") }}</div>
            </template>
            <!-- models -->
            <template v-else-if="section === 'models'">
              <div class="row"><span class="name">{{ it.name }}</span><span class="pill" :class="it.stage">{{ it.stage }}</span></div>
              <div class="sub">{{ it.task }}<span v-if="it.base"> · base {{ it.base }}</span><span v-if="it.servable" class="dot ok"> ● servable</span></div>
              <div v-if="it.metrics" class="metrics">
                <span v-for="m in it.metrics" :key="m.name" class="metric">{{ m.name }} <b>{{ m.value }}{{ m.unit || "" }}</b></span>
              </div>
            </template>
            <!-- tuning -->
            <template v-else-if="section === 'tuning'">
              <div class="row"><span class="name">{{ it.name }}</span><span class="pill" :class="it.status">{{ it.status }}</span></div>
              <div class="sub"><span class="method">{{ it.method }}</span> · {{ it.backend }}</div>
              <div v-if="it.progress != null" class="bar"><span :style="{ width: Math.round(it.progress * 100) + '%' }" /></div>
              <div v-if="it.metric" class="sub">{{ it.metric.name }}: <b>{{ it.metric.value }}</b></div>
            </template>
            <!-- experiments -->
            <template v-else-if="section === 'experiments'">
              <div class="row"><span class="name">{{ it.title }}</span><span v-if="it.reproducible" class="pill ok">reproducible</span></div>
              <div class="sub">{{ it.provenance }}</div>
              <div v-if="it.steps" class="prov"><span v-for="st in it.steps" :key="st.label" class="pstep" :title="st.hash">{{ st.label }}</span></div>
            </template>
            <!-- extraction (holmes / sherlock / ingest → graph) -->
            <template v-else-if="section === 'extraction'">
              <div class="row"><span class="name">{{ it.name }}</span><span class="pill" :class="it.status">{{ it.status }}</span></div>
              <div class="sub"><span class="method">{{ it.engine }}</span> · {{ it.kind }} → {{ it.target }}</div>
              <div v-if="it.extracted" class="sub"><b>{{ it.extracted.toLocaleString() }}</b> extracted</div>
            </template>
            <!-- ontology (ontogenesis) -->
            <template v-else-if="section === 'ontology'">
              <div class="row"><span class="name">{{ it.name }}</span><span class="pill" :class="{ ok: it.aligned }">{{ it.kind }}</span></div>
              <div class="sub"><span class="method">{{ it.engine }}</span><span v-if="it.count"> · {{ it.count.toLocaleString() }}</span><span v-if="it.aligned"> · aligned</span></div>
            </template>
            <!-- graph: handled by the StudioGraph explorer at the panel level (provenance-first) -->
            <!-- retrieval (fiber / graph-rag / topic) -->
            <template v-else-if="section === 'retrieval'">
              <div class="row"><span class="name">{{ it.name }}</span><span class="pill" :class="{ ok: it.ready }">{{ it.ready ? 'ready' : 'building' }}</span></div>
              <div class="sub"><span class="method">{{ it.method }}</span> · {{ it.engine }} · scope: {{ it.scope }}</div>
            </template>
            <!-- generation (new-hope) -->
            <template v-else>
              <div class="row"><span class="name">{{ it.name }}</span><span class="pill" :class="it.status">{{ it.status }}</span></div>
              <div class="sub"><span class="method">{{ it.engine }}</span> · {{ it.kind }}<span v-if="it.grounded" class="dot ok"> ● grounded</span></div>
              <div v-if="it.output" class="sub">{{ it.output }}</div>
            </template>
          </article>
        </div>
      </main>

      <!-- detail drawer -->
      <transition name="drawer">
        <aside v-if="selected" class="drawer">
          <button class="close" @click="selected = null" aria-label="Close">✕</button>
          <div class="d-kind">{{ activeMeta.label }}</div>
          <h2>{{ selected.item.name || selected.item.title }}</h2>
          <dl class="meta">
            <template v-for="(v, k) in selected.item" :key="k">
              <div v-if="k !== 'id' && typeof v !== 'object'" class="mrow"><dt>{{ k }}</dt><dd>{{ v }}</dd></div>
            </template>
          </dl>
          <div v-if="selected.item.lineage" class="d-block"><h3>Lineage</h3><div class="lineage">{{ selected.item.lineage.join(" ") }}</div></div>
          <div v-if="selected.item.steps" class="d-block"><h3>Provenance</h3><div class="prov"><span v-for="st in selected.item.steps" :key="st.label" class="pstep">{{ st.label }} · {{ st.hash }}</span></div></div>
          <div class="d-actions">
            <button v-for="a in actionsFor[selected.kind]" :key="a.label" :title="a.hint" :class="{ primary: a.label === actionsFor[selected.kind][0].label }">{{ a.label }}</button>
          </div>
        </aside>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.studio { --line:#e8eaed; --sub:#5f6368; --ink:#202124; --accent:#1a73e8; --accent-bg:#e8f0fe; --card:#fff; --bg:#fafafa;
  display: flex; flex-direction: column; height: 100%; font: 14px/1.5 system-ui, sans-serif; color: var(--ink); }

.topbar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid var(--line); }
.topbar .brand { font-size: 16px; font-weight: 700; }
.topbar .proj { border: 1px solid var(--line); background: var(--accent-bg); color: var(--accent); border-radius: 16px; padding: 4px 12px; font-size: 13px; cursor: pointer; }
.topbar .chev { opacity: .6; font-size: 10px; }
.topbar .search { flex: 0 1 340px; display: flex; align-items: center; gap: 6px; border: 1px solid var(--line); border-radius: 18px; padding: 5px 12px; }
.topbar .search .mag { color: var(--sub); }
.topbar .search input { border: none; outline: none; flex: 1; font-size: 14px; background: none; }
.topbar .spacer { flex: 1; }
.topbar button.ghost { border: 1px solid var(--line); background: #fff; border-radius: 18px; padding: 6px 14px; font-size: 13px; cursor: pointer; }
.topbar button.primary { border: none; background: var(--accent); color: #fff; border-radius: 18px; padding: 6px 14px; font-size: 13px; cursor: pointer; }

.body { flex: 1; display: flex; min-height: 0; }
.rail { width: 208px; flex-shrink: 0; border-right: 1px solid var(--line); background: var(--bg); display: flex; flex-direction: column; padding: 8px; }
.rail button { display: flex; align-items: center; gap: 10px; text-align: left; padding: 9px 12px; border: none; background: none; border-radius: 8px; cursor: pointer; color: #3c4043; font-size: 14px; }
.rail button:hover { background: #f1f3f4; }
.rail button.on { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
.rail .ic { width: 18px; } .rail .lbl { flex: 1; } .rail .cnt { font-size: 11px; color: var(--sub); background: #fff; border: 1px solid var(--line); border-radius: 9px; padding: 0 6px; }
.rail button.on .cnt { background: #fff; }
.rail-foot { margin-top: auto; padding: 10px 8px; }
.rail .stub { font-size: 11px; color: #b06000; background: #fef7e0; border-radius: 8px; padding: 3px 8px; }

.panel { flex: 1; overflow: auto; padding: 20px 24px; min-width: 0; }
.sec-head h1 { font-size: 20px; margin: 0; } .sec-head .blurb { color: var(--sub); margin: 4px 0 16px; max-width: 680px; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.card { border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; background: var(--card); cursor: pointer; transition: box-shadow .12s, border-color .12s; }
.card:hover { box-shadow: 0 1px 8px rgba(60,64,67,.12); border-color: #dadce0; }
.card.sel { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-bg); }
.card .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.card .name { font-weight: 600; }
.card .sub { color: var(--sub); font-size: 12px; margin-top: 4px; }
.card .mono { display: block; font: 11px/1.4 ui-monospace, monospace; color: #3c4043; background: #f8f9fa; border-radius: 6px; padding: 5px 8px; margin: 8px 0 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.chips, .metrics { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
.chip { font-size: 11px; background: #f1f3f4; border-radius: 8px; padding: 1px 8px; color: #3c4043; }
.metric { font-size: 12px; color: var(--sub); background: #f8f9fa; border-radius: 8px; padding: 1px 8px; } .metric b { color: var(--ink); }
.lineage { font: 11px/1.4 ui-monospace, monospace; color: var(--sub); margin-top: 8px; }
.method { text-transform: uppercase; letter-spacing: .04em; font-size: 11px; font-weight: 600; color: var(--accent); }
.bar { height: 5px; background: #eceff1; border-radius: 3px; margin: 9px 0 5px; overflow: hidden; } .bar span { display: block; height: 100%; background: var(--accent); }
.prov { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; } .pstep { font: 10px/1.4 ui-monospace, monospace; background: #f1f3f4; border-radius: 6px; padding: 1px 7px; color: #3c4043; }
.dot.ok { color: #137333; font-size: 11px; }
.stat { font-size: 26px; font-weight: 700; margin-top: 6px; letter-spacing: -0.5px; }
.rail-group { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: #9aa0a6; padding: 12px 12px 4px; }

.pill { font-size: 11px; border-radius: 8px; padding: 1px 8px; border: 1px solid var(--line); color: var(--sub); white-space: nowrap; }
.pill.ok, .pill.promoted, .pill.done { border-color: #137333; color: #137333; }
.pill.running { border-color: var(--accent); color: var(--accent); }
.pill.failed { border-color: #c5221f; color: #c5221f; }
.pill.warn, .pill.staged, .pill.queued, .pill.candidate { border-color: #b06000; color: #b06000; }

.msg { color: var(--sub); padding: 10px 2px; } .msg.err { color: #c5221f; }
.skeleton { pointer-events: none; } .sk-line { height: 10px; background: linear-gradient(90deg,#f1f3f4,#e8eaed,#f1f3f4); background-size: 200% 100%; border-radius: 5px; margin: 6px 0; animation: sh 1.2s infinite; } .w60 { width: 60%; } .w40 { width: 40%; }
@keyframes sh { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.drawer { width: 340px; flex-shrink: 0; border-left: 1px solid var(--line); background: #fff; padding: 18px 20px; overflow: auto; position: relative; }
.drawer .close { position: absolute; top: 12px; right: 14px; border: none; background: none; font-size: 15px; color: var(--sub); cursor: pointer; }
.drawer .d-kind { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: var(--sub); }
.drawer h2 { font-size: 18px; margin: 4px 0 14px; }
.meta { margin: 0 0 14px; } .mrow { display: flex; gap: 10px; padding: 4px 0; border-bottom: 1px solid #f1f3f4; } .mrow dt { color: var(--sub); min-width: 96px; font-size: 12px; } .mrow dd { margin: 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; }
.d-block { margin: 12px 0; } .d-block h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--sub); margin: 0 0 6px; }
.d-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.d-actions button { border: 1px solid var(--line); background: #fff; border-radius: 16px; padding: 6px 14px; font-size: 13px; cursor: pointer; }
.d-actions button.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
.drawer-enter-active, .drawer-leave-active { transition: transform .18s ease, opacity .18s ease; }
.drawer-enter-from, .drawer-leave-to { transform: translateX(20px); opacity: 0; }
</style>
