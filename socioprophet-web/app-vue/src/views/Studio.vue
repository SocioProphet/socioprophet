<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { loadStudio, loadReceipts, mintCitation, SECTION_COUNT, EPISTEMIC_COLORS, type StudioBundle, type StudioSection, type Receipts, type Citation } from "../services/studioApi";
import StudioGraph from "../components/StudioGraph.vue";
import StudioDocuments from "../components/StudioDocuments.vue";
import StudioQuery from "../components/StudioQuery.vue";
import StudioExperiments from "../components/StudioExperiments.vue";
import StudioCommons from "../components/StudioCommons.vue";
import StudioOps from "../components/StudioOps.vue";
import StudioCompute from "../components/StudioCompute.vue";
import StudioGovernance from "../components/StudioGovernance.vue";
import StudioNotebooks from "../components/StudioNotebooks.vue";
import LineageStrip from "../components/LineageStrip.vue";

const bundle = ref<StudioBundle | null>(null);
const error = ref("");
const loading = ref(true);
const section = ref<StudioSection>("notebooks");
const query = ref("");
const selected = ref<{ kind: StudioSection; item: Record<string, any> } | null>(null);

// WS#29: verified-compute receipts drawer, opened from the moat strip.
const receiptsOpen = ref(false);
const receiptsData = ref<Receipts | null>(null);
const receiptsErr = ref("");
async function toggleReceipts() {
  receiptsOpen.value = !receiptsOpen.value;
  if (receiptsOpen.value && !receiptsData.value) {
    try { receiptsData.value = await loadReceipts(); }
    catch (e) { receiptsErr.value = e instanceof Error ? e.message : "receipts failed"; }
  }
}

// WS#35: mint a citable, persistent identifier for the project's knowledge-graph snapshot.
const citeOpen = ref(false);
const citeData = ref<Citation | null>(null);
const citeToken = ref("");
const citeErr = ref("");
const minting = ref(false);
const copied = ref("");
async function mintCite() {
  minting.value = true; citeErr.value = "";
  try { citeData.value = await mintCitation({ project: project.value, kind: "graph", title: `${project.value} — knowledge graph` }, citeToken.value); }
  catch (e) { citeErr.value = e instanceof Error ? e.message : "cite failed"; }
  finally { minting.value = false; }
}
async function copyText(what: string, text: string) {
  try { await navigator.clipboard.writeText(text); copied.value = what; setTimeout(() => (copied.value = ""), 1400); } catch { /* */ }
}

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
  { id: "documents",   label: "Documents",     icon: "▤", group: "Knowledge engineering", blurb: "What was ingested — every document and the linked knowledge it yielded, doc_sha provenance per fact." },
  { id: "query",       label: "Query",         icon: "⌗", group: "Knowledge engineering", blurb: "SPARQL / Cypher / Gremlin over the live kernel — results you can replay (proof-carrying) and whose facts carry epistemic status." },
  { id: "retrieval",   label: "Retrieval",     icon: "◎", group: "Knowledge engineering", blurb: "Fibered retrieval (PageIndex ⊕ HellGraph) · Graph-RAG · topic & semantic indexes." },
  { id: "generation",  label: "Generation",    icon: "✦", group: "Knowledge engineering", blurb: "Grounded generation & generation-tuning — New-Hope synthesis over the graph." },
  { id: "compute",     label: "Compute",       icon: "⛩", group: "Operations", blurb: "The Universal Compute Plane — every kind of compute (notebook · graph · Spark · inference) through ONE governed door. Each run is entitlement-gated, zero-trust grant-checked, sealed into a signed, replayable receipt, and typed by epistemic warrant. Databricks welded one paradigm to one surface; this is the generalization — sovereign + multi-backend + proof-carrying." },
  { id: "operations",  label: "Operations",    icon: "⚙", group: "Operations", blurb: "The operations cockpit — run pipelines, promote models, browse the data catalog, submit pay-gated compute, and inspect GraphRAG communities. Every action proof-carrying; compute entitlement-gated (sovereign + multi-backend)." },
  { id: "governance",  label: "Governance",    icon: "⬡", group: "Operations", blurb: "The governance cockpit — browse the real Ontogenesis ontology (817 classes), invoke SHACL-validated ontology actions (Foundry's crown jewel, beaten), and work the GAIA world-signal promotion membrane where a promotion state IS an epistemic status. One discipline across the knowledge, human & Earth twins." },
  { id: "commons",     label: "Commons",       icon: "◆", group: "Commons", blurb: "The proof-carrying knowledge commons — FAIR+ metadata, sovereign DOIs, immutable preservation, ORCID/OpenAIRE + agent hooks, and epistemic-weighted community curation." },
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
  const list = ((b as Record<string, any>)[section.value] ?? []) as Record<string, any>[];
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
  documents:   [{ label: "View in graph", hint: "the doc's subgraph in the explorer" }, { label: "Provenance", hint: "every fact carries its doc_sha" }],
  ontology:    [{ label: "Edit ontology", hint: "Ontogenesis" }, { label: "Align", hint: "map to KKO / project" }, { label: "Apply to graph", hint: "re-type entities" }],
  graph:       [{ label: "Open graph", hint: "HellGraph gremlin/sparql" }, { label: "Query", hint: "graph-RAG" }, { label: "Export", hint: "sub-graph" }],
  query:       [{ label: "Run", hint: "SPARQL/Cypher/Gremlin over the kernel" }, { label: "Replay", hint: "re-evaluate by query hash" }, { label: "Export", hint: "results + proof" }],
  retrieval:   [{ label: "Query", hint: "run fibered retrieval" }, { label: "Rebuild index", hint: "re-embed" }, { label: "Use in notebook", hint: "attach retriever" }],
  generation:  [{ label: "Run", hint: "New-Hope grounded synthesis" }, { label: "→ Annotation set", hint: "into the workbench" }, { label: "→ Tune", hint: "generation-tuning" }],
  commons:     [{ label: "Cite", hint: "mint a sovereign DOI" }, { label: "Preserve", hint: "seal an immutable version" }, { label: "Export FAIR", hint: "schema.org / DataCite / PROV-O" }],
  compute:     [{ label: "Run compute", hint: "any kind, one governed door" }, { label: "Verify receipts", hint: "signed, replayable chain" }, { label: "Capability registry", hint: "the agent action space" }],
  operations:  [{ label: "Run pipeline", hint: "governed run ledger" }, { label: "Promote model", hint: "staging → production" }, { label: "Submit compute", hint: "entitlement-gated execution" }],
  governance:  [{ label: "Invoke action", hint: "SHACL-validated writeback" }, { label: "Submit signal", hint: "GAIA world-signal" }, { label: "Promote", hint: "the epistemic membrane" }],
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

    <!-- WS#29: the MOAT strip — the proof-carrying identity of the workspace, riding above every section -->
    <div v-if="bundle?.moat" class="moatbar">
      <div class="mb-epi" v-if="bundle.moat.fact_count">
        <span class="mb-lbl">{{ bundle.moat.fact_count }} facts</span>
        <span class="mb-bar" title="epistemic status of the project's facts">
          <i v-for="(n, mode) in bundle.moat.epistemic_distribution" :key="mode"
             :style="{ width: (n / bundle.moat.fact_count * 100) + '%', background: EPISTEMIC_COLORS[mode] || 'var(--faint)' }" :title="mode + ': ' + n" />
        </span>
        <span class="mb-lbl">{{ Math.round(bundle.moat.provenance_coverage * 100) }}% sourced</span>
      </div>
      <div class="spacer" />
      <button class="mb-chip" :class="{ on: bundle.moat.verified_compute }" @click="toggleReceipts" title="verified-compute receipts from the evidence fabric — click to inspect">
        {{ bundle.moat.verified_compute ? '◆ verified compute' : '◇ compute unverified' }}<b v-if="bundle.moat.receipts_recent"> · {{ bundle.moat.receipts_recent }}</b>
      </button>
      <span class="mb-chip" :class="{ on: bundle.moat.governed_writes }" :title="bundle.moat.governed_writes ? 'writes are fail-closed behind a token' : 'writes disabled (fail-closed)'">
        {{ bundle.moat.governed_writes ? '● governed writes' : '○ writes off' }}
      </span>
      <span class="mb-chip" :class="{ on: bundle.moat.read_auth }" :title="bundle.moat.read_auth ? 'reads require sovereign identity' : 'reads open'">
        {{ bundle.moat.read_auth ? '● read-auth' : '○ open reads' }}
      </span>
      <button class="mb-chip on" @click="citeOpen = !citeOpen" title="mint a citable, persistent identifier (DOI) for this knowledge graph — resolves to a proof-carrying record">⎘ Cite</button>
    </div>

    <!-- WS#35: cite / persistent identifier drawer -->
    <div v-if="citeOpen" class="cite">
      <div class="rc-head"><b>Cite this knowledge graph</b><span class="rc-sub">a persistent identifier that resolves to a proof-carrying record — DataCite-compatible</span><button class="rc-x" @click="citeOpen = false" aria-label="Close cite panel">✕</button></div>
      <div v-if="!citeData" class="cite-mint">
        <input v-model="citeToken" type="password" placeholder="write token" />
        <button class="primary" @click="mintCite" :disabled="minting">{{ minting ? "Minting…" : "Mint DOI" }}</button>
        <span v-if="citeErr" class="rc-err">{{ citeErr }}</span>
      </div>
      <div v-else class="cite-out">
        <div class="cite-ids">
          <span class="cid"><b>PID</b> <code class="mono">{{ citeData.pid }}</code></span>
          <span class="cid"><b>DOI</b> <code class="mono">{{ citeData.doi }}</code></span>
          <span class="cid ok">◆ proof-carrying · {{ citeData.content_hash }}</span>
        </div>
        <div class="cite-block">
          <div class="cb-head">Citation <button @click="copyText('cite', citeData.citation)">{{ copied === 'cite' ? '✓ copied' : 'copy' }}</button></div>
          <p class="cb-body">{{ citeData.citation }}</p>
        </div>
        <div class="cite-block">
          <div class="cb-head">BibTeX <button @click="copyText('bib', citeData.bibtex)">{{ copied === 'bib' ? '✓ copied' : 'copy' }}</button></div>
          <pre class="cb-body mono">{{ citeData.bibtex }}</pre>
        </div>
        <p class="cite-note">The identifier is itself a graph fact (epistemic: <b>attested</b>) and resolves to a verifiable record — not a landing page. That's the beat over Zenodo.</p>
      </div>
    </div>

    <!-- verified-compute receipts drawer -->
    <div v-if="receiptsOpen" class="receipts">
      <div class="rc-head"><b>Verified-compute receipts</b><span class="rc-sub">replayable proof-of-work · {{ receiptsData?.services_reachable ?? 0 }} services answering</span><button class="rc-x" @click="receiptsOpen = false" aria-label="Close receipts panel">✕</button></div>
      <div v-if="receiptsErr" class="rc-err">{{ receiptsErr }}</div>
      <div v-else-if="receiptsData" class="rc-list">
        <div v-for="r in receiptsData.receipts" :key="r.service + r.correlation_id" class="rc-row" :title="r.bundle_ref || ''">
          <span class="rc-svc">{{ r.service }}</span>
          <span class="rc-cid mono">{{ r.correlation_id }}</span>
          <span v-if="r.verdict" class="rc-verdict">{{ r.verdict }}</span>
          <span class="rc-when">{{ r.received_at }}</span>
        </div>
        <div v-if="!receiptsData.receipts.length" class="rc-empty">No receipts yet — run an extraction or a graph write.</div>
      </div>
      <div v-else class="rc-empty">Loading…</div>
    </div>

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
        <div class="sec-head" v-if="!['graph', 'notebooks'].includes(section)">
          <h1>{{ activeMeta.icon }} {{ activeMeta.label }}</h1>
          <p class="blurb">{{ activeMeta.blurb }}</p>
        </div>

        <!-- Notebooks = the governed notebook IDE (lattice-forge · receipt-per-cell) (#31) -->
        <StudioNotebooks v-if="section === 'notebooks'" :project="project" />
        <!-- Compute = the Universal Compute Plane: any compute, one governed door → signed receipt + warrant (#848/#853) -->
        <StudioCompute v-else-if="section === 'compute'" :project="project" />
        <!-- Graph section = the provenance-first explorer (KE-2) -->
        <StudioGraph v-else-if="section === 'graph'" :project="project" />
        <StudioDocuments v-else-if="section === 'documents'" :project="project" />
        <!-- Query section = the proof-carrying query IDE (WS#30) -->
        <StudioQuery v-else-if="section === 'query'" :project="project" />
        <!-- Experiments = runs as proof-carrying graph facts (WS#32) -->
        <StudioExperiments v-else-if="section === 'experiments'" :project="project" />
        <!-- Operations = the operable cockpit: pipelines/registry/catalog/compute/communities (WS#45–48/#31) -->
        <StudioOps v-else-if="section === 'operations'" :project="project" />
        <!-- Governance = ontology · typed SHACL-validated actions · GAIA promotion membrane (WS#49–51) -->
        <StudioGovernance v-else-if="section === 'governance'" :project="project" />
        <!-- Commons = the proof-carrying knowledge commons (WS#36–39) -->
        <StudioCommons v-else-if="section === 'commons'" :project="project" />

        <!-- skeletons -->
        <div v-else-if="loading" class="grid">
          <div v-for="i in 4" :key="i" class="card skeleton"><div class="sk-line w60" /><div class="sk-line w40" /></div>
        </div>
        <p v-else-if="error" class="msg err">{{ error }}</p>
        <p v-else-if="!items.length" class="msg empty">Nothing here yet{{ query ? ` for “${query}”` : "" }}.</p>

        <div v-else class="grid">
          <article v-for="it in items" :key="it.id" class="card" :class="{ sel: selected?.item.id === it.id }" @click="pick(it)">
            <!-- data (notebooks/compute render as full-panel components above, never as grid cards) -->
            <template v-if="section === 'data'">
              <div class="row"><span class="name">{{ it.name }}</span><span v-if="it.governed" class="pill ok">governed</span><span v-else class="pill warn">ungoverned</span></div>
              <div class="sub">{{ it.kind }}<span v-if="it.rows"> · {{ it.rows.toLocaleString() }} rows</span><span v-if="it.columns"> · {{ it.columns }} cols</span></div>
              <LineageStrip v-if="it.lineage" :steps="it.lineage" />
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
            <!-- experiments now render via the StudioExperiments panel (WS#32) -->
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
          <div v-if="selected.item.lineage" class="d-block"><h3>Lineage</h3><LineageStrip :steps="selected.item.lineage" title="Lineage" /></div>
          <div v-if="selected.item.steps" class="d-block"><h3>Provenance</h3><LineageStrip :steps="selected.item.steps" title="Provenance" /></div>
          <div class="d-actions">
            <button v-for="a in actionsFor[selected.kind]" :key="a.label" :title="a.hint" :class="{ primary: a.label === actionsFor[selected.kind][0].label }">{{ a.label }}</button>
          </div>
        </aside>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.studio { --line:var(--hairline); --sub:var(--muted); --accent-bg:var(--accent-wash); --card:var(--surface); --bg:var(--ground);
  display: flex; flex-direction: column; height: 100%; font: 14px/1.5 var(--ui); color: var(--ink); background: var(--bg); }

.topbar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid var(--line); }
/* WS#29 moat strip */
.moatbar { display: flex; align-items: center; gap: 12px; padding: 7px 16px; border-bottom: 1px solid var(--line);
  background: var(--card); font-size: 12px; color: var(--sub); }
.moatbar .spacer { flex: 1; }
.mb-epi { display: flex; align-items: center; gap: var(--sp-2); }
.mb-lbl { white-space: nowrap; font-variant-numeric: tabular-nums; }
.mb-bar { display: inline-flex; width: 168px; height: 8px; border-radius: var(--r-1); overflow: hidden; background: var(--sunken); }
.mb-bar i { height: 100%; }
.mb-chip { border: 1px solid var(--line); background: var(--card); color: var(--sub); border-radius: var(--pill);
  padding: 3px 10px; font-size: 11.5px; cursor: default; }
button.mb-chip { cursor: pointer; }
.mb-chip.on { color: var(--ok); border-color: color-mix(in srgb, var(--ok) 40%, transparent); background: var(--ok-wash); }
.mb-chip b { font-weight: 700; }
.receipts, .cite { border-bottom: 1px solid var(--line); background: var(--surface-2); padding: 10px 16px 12px; }
.cite-mint { display: flex; align-items: center; gap: var(--sp-2); margin-top: var(--sp-2); }
.cite-mint input { border: 1px solid var(--line); border-radius: var(--r-2); padding: 6px 8px; font-size: 13px; width: 160px; background: var(--surface); color: var(--ink); }
.cite-mint .primary { border: 1px solid var(--accent); background: var(--accent); color: #fff; border-radius: var(--r-2); padding: 6px 14px; font-size: 13px; cursor: pointer; }
.cite-mint .primary:disabled { opacity: .6; }
.cite-out { margin-top: var(--sp-2); }
.cite-ids { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; margin-bottom: var(--sp-2); }
.cite-ids .cid b { color: var(--sub); font-weight: 600; margin-right: 4px; } .cite-ids .cid code { color: var(--accent); }
.cite-ids .cid.ok { color: var(--ok); }
.cite-block { border: 1px solid var(--line); border-radius: var(--r-2); background: var(--surface); margin-top: var(--sp-2); overflow: hidden; }
.cb-head { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: var(--sunken); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--sub); }
.cb-head button { border: 1px solid var(--line); background: var(--surface); color: var(--ink-2); border-radius: var(--r-2); padding: 2px 8px; font-size: 11px; cursor: pointer; }
.cb-body { margin: 0; padding: 8px 10px; font-size: 12px; white-space: pre-wrap; word-break: break-word; }
.cite-note { color: var(--sub); font-size: 11.5px; margin-top: 8px; } .cite-note b { color: var(--ok); }
.rc-head { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.rc-head .rc-sub { color: var(--sub); font-size: 11.5px; } .rc-head .rc-x { margin-left: auto; border: 0; background: none; cursor: pointer; color: var(--sub); font-size: 14px; }
.rc-err { color: var(--fail); font-size: 12px; margin-top: 6px; }
.rc-list { margin-top: var(--sp-2); display: flex; flex-direction: column; gap: 2px; }
.rc-row { display: grid; grid-template-columns: 160px 1fr auto auto; gap: 10px; align-items: center; font-size: 12px; padding: 4px 8px; border-radius: var(--r-2); }
.rc-row:hover { background: var(--accent-bg); }
.rc-svc { font-weight: 600; color: var(--ink); } .rc-cid { color: var(--sub); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rc-verdict { font-size: 10.5px; font-weight: 700; color: var(--ok); background: var(--ok-wash); border-radius: var(--pill); padding: 1px 8px; }
.rc-when { color: var(--sub); font-size: 11px; white-space: nowrap; }
.rc-empty { color: var(--sub); font-size: 12px; margin-top: 6px; }
.mono { font-family: var(--mono); }
.topbar .brand { font-size: 16px; font-weight: 700; }
.topbar .proj { border: 1px solid var(--line); background: var(--accent-bg); color: var(--accent); border-radius: var(--r-2); padding: 4px 12px; font-size: 13px; cursor: pointer; }
.topbar .chev { opacity: .6; font-size: 10px; }
.topbar .search { flex: 0 1 340px; display: flex; align-items: center; gap: 6px; border: 1px solid var(--line); border-radius: var(--r-2); padding: 5px 12px; background: var(--surface); }
.topbar .search .mag { color: var(--sub); }
.topbar .search input { border: none; outline: none; flex: 1; font-size: 14px; background: none; color: var(--ink); }
.topbar .spacer { flex: 1; }
.topbar button.ghost { border: 1px solid var(--line); background: var(--surface); color: var(--ink-2); border-radius: var(--r-2); padding: 6px 14px; font-size: 13px; cursor: pointer; }
.topbar button.primary { border: none; background: var(--accent); color: #fff; border-radius: var(--r-2); padding: 6px 14px; font-size: 13px; cursor: pointer; }

.body { flex: 1; display: flex; min-height: 0; }
.rail { width: 208px; flex-shrink: 0; border-right: 1px solid var(--line); background: var(--bg); display: flex; flex-direction: column; padding: var(--sp-2); }
.rail button { display: flex; align-items: center; gap: 10px; text-align: left; padding: 7px 12px; border: none; background: none; border-radius: var(--r-2); cursor: pointer; color: var(--ink-2); font-size: 14px; }
.rail button:hover { background: var(--sunken); }
.rail button.on { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
.rail .ic { width: 18px; } .rail .lbl { flex: 1; } .rail .cnt { font-size: 11px; color: var(--sub); background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-1); padding: 0 6px; font-variant-numeric: tabular-nums; }
.rail button.on .cnt { background: var(--surface); }
.rail-foot { margin-top: auto; padding: 10px 8px; }
.rail .stub { font-size: 11px; color: var(--warn); background: var(--warn-wash); border-radius: var(--r-2); padding: 3px 8px; }

.panel { flex: 1; overflow: auto; padding: 20px 24px; min-width: 0; }
.sec-head h1 { font-size: 20px; margin: 0; } .sec-head .blurb { color: var(--sub); margin: 4px 0 16px; max-width: 680px; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--sp-3); }
.card { border: 1px solid var(--line); border-radius: var(--r-3); padding: var(--sp-3) var(--sp-4); background: var(--card); cursor: pointer; transition: box-shadow .12s, border-color .12s; }
.card:hover { box-shadow: var(--e-1); border-color: var(--hairline-strong); }
.card.sel { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-bg); }
.card .row { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-2); }
.card .name { font-weight: 600; }
.card .sub { color: var(--sub); font-size: 12px; margin-top: 4px; }
.card .mono { display: block; font: 11px/1.4 var(--mono); color: var(--ink-2); background: var(--sunken); border-radius: var(--r-2); padding: 5px 8px; margin: var(--sp-2) 0 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.chips, .metrics { display: flex; flex-wrap: wrap; gap: 5px; margin-top: var(--sp-2); }
.chip { font-size: 11px; background: var(--sunken); border-radius: var(--r-2); padding: 1px 8px; color: var(--ink-2); }
.metric { font-size: 12px; color: var(--sub); background: var(--sunken); border-radius: var(--r-2); padding: 1px 8px; } .metric b { color: var(--ink); }
.lineage { font: 11px/1.4 var(--mono); color: var(--sub); margin-top: var(--sp-2); }
.method { text-transform: uppercase; letter-spacing: .04em; font-size: 11px; font-weight: 600; color: var(--accent); }
.bar { height: 5px; background: var(--sunken); border-radius: var(--r-1); margin: 9px 0 5px; overflow: hidden; } .bar span { display: block; height: 100%; background: var(--accent); }
.prov { display: flex; flex-wrap: wrap; gap: 5px; margin-top: var(--sp-2); } .pstep { font: 10px/1.4 var(--mono); background: var(--sunken); border-radius: var(--r-2); padding: 1px 7px; color: var(--ink-2); }
.dot.ok { color: var(--ok); font-size: 11px; }
.stat { font-size: 26px; font-weight: 700; margin-top: 6px; letter-spacing: -0.5px; font-variant-numeric: tabular-nums; }
.rail-group { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: var(--faint); padding: 12px 12px 4px; }

.pill { font-size: 11px; border-radius: var(--r-2); padding: 1px 8px; border: 1px solid var(--line); color: var(--sub); white-space: nowrap; }
.pill.ok, .pill.promoted, .pill.done { border-color: var(--ok); color: var(--ok); }
.pill.running { border-color: var(--accent); color: var(--accent); }
.pill.failed { border-color: var(--fail); color: var(--fail); }
.pill.warn, .pill.staged, .pill.queued, .pill.candidate { border-color: var(--warn); color: var(--warn); }

.msg { color: var(--sub); padding: 10px 2px; } .msg.err { color: var(--fail); }
.skeleton { pointer-events: none; } .sk-line { height: 10px; background: linear-gradient(90deg,var(--sunken),var(--hairline),var(--sunken)); background-size: 200% 100%; border-radius: var(--r-1); margin: 6px 0; animation: sh 1.2s infinite; } .w60 { width: 60%; } .w40 { width: 40%; }
@keyframes sh { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.drawer { width: 340px; flex-shrink: 0; border-left: 1px solid var(--line); background: var(--surface); padding: 18px 20px; overflow: auto; position: relative; }
.drawer .close { position: absolute; top: 12px; right: 14px; border: none; background: none; font-size: 15px; color: var(--sub); cursor: pointer; }
.drawer .d-kind { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: var(--sub); }
.drawer h2 { font-size: 18px; margin: 4px 0 14px; }
.meta { margin: 0 0 14px; } .mrow { display: flex; gap: 10px; padding: 4px 0; border-bottom: 1px solid var(--sunken); } .mrow dt { color: var(--sub); min-width: 96px; font-size: 12px; } .mrow dd { margin: 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; }
.d-block { margin: 12px 0; } .d-block h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--sub); margin: 0 0 6px; }
.d-actions { display: flex; flex-wrap: wrap; gap: var(--sp-2); margin-top: var(--sp-4); }
.d-actions button { border: 1px solid var(--line); background: var(--surface); color: var(--ink-2); border-radius: var(--r-2); padding: 6px 14px; font-size: 13px; cursor: pointer; }
.d-actions button.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
.drawer-enter-active, .drawer-leave-active { transition: transform .18s ease, opacity .18s ease; }
.drawer-enter-from, .drawer-leave-to { transform: translateX(20px); opacity: 0; }

/* a11y: keyboard focus is always visible; motion respects the OS preference */
.studio :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: var(--r-1); }
@media (prefers-reduced-motion: reduce) {
  .sk-line { animation: none; }
  .card { transition: none; }
  .drawer-enter-active, .drawer-leave-active { transition: none; }
}
</style>
