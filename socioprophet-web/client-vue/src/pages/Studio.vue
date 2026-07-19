<script setup lang="ts">
// The unified Studio workspace inside the cockpit — a Foundry/Databricks-class shell with
// governed Notebooks + Universal Compute Plane (from app-vue) and the full knowledge-engineering
// bench (Graph Explorer, Query, Analytics, GraphRAG, Resource Browser, Reasoner, Entity Resolution,
// Ontology — from Prophet Studio). One surface, one design system (.studio-scope), reading the
// canonical hellgraph-service / owl-reasoner / entity-resolution backends via /svc/*.
import { ref, computed, watch, markRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import './studio/studio-tokens.css';
import StudioNotebooks from './studio/StudioNotebooks.vue';
import StudioCompute from './studio/StudioCompute.vue';
import GraphExplorer from './studio/GraphExplorer.vue';
import QueryConsole from './studio/QueryConsole.vue';
import Analytics from './studio/Analytics.vue';
import GraphRAG from './studio/GraphRAG.vue';
import ResourceBrowser from './studio/ResourceBrowser.vue';
import Reasoner from './studio/Reasoner.vue';
import EntityResolution from './studio/EntityResolution.vue';
import Ontology from './studio/Ontology.vue';
import StudioExperiments from './studio/StudioExperiments.vue';
import StudioOps from './studio/StudioOps.vue';
import StudioGovernance from './studio/StudioGovernance.vue';
import StudioCommons from './studio/StudioCommons.vue';

type Sec = { id: string; label: string; ic: string; comp: any; sub: string; project?: boolean };
const GROUPS: { group: string; items: Sec[] }[] = [
  { group: 'Workbench', items: [
    { id: 'notebooks', label: 'Notebooks', ic: '⬢', comp: markRaw(StudioNotebooks), project: true, sub: 'Ray-backed governed notebooks — receipt per cell' },
    { id: 'compute', label: 'Compute Plane', ic: '⛩', comp: markRaw(StudioCompute), project: true, sub: 'Universal Compute Plane — one governed, proof-carrying door' },
  ]},
  { group: 'Knowledge engineering', items: [
    { id: 'graph', label: 'Graph Explorer', ic: '⟡', comp: markRaw(GraphExplorer), sub: 'Force-directed graph + provenance inspector' },
    { id: 'query', label: 'Query Console', ic: '⌘', comp: markRaw(QueryConsole), sub: 'SPARQL · Cypher · Gremlin over the live kernel' },
    { id: 'analytics', label: 'Analytics', ic: '📈', comp: markRaw(Analytics), sub: 'PageRank / components on the Rust kernel' },
    { id: 'graphrag', label: 'GraphRAG', ic: '✦', comp: markRaw(GraphRAG), sub: 'Ask the graph, cited answers' },
    { id: 'resource', label: 'Resource Browser', ic: '◈', comp: markRaw(ResourceBrowser), sub: 'Dereferenceable Linked Data' },
  ]},
  { group: 'Reason & Resolve', items: [
    { id: 'reasoner', label: 'Reasoner', ic: '⊢', comp: markRaw(Reasoner), sub: 'RDFS/OWL entailment + proof trees' },
    { id: 'er', label: 'Entity Resolution', ic: '⚭', comp: markRaw(EntityResolution), sub: 'Proof-carrying record linkage' },
    { id: 'ontology', label: 'Ontology', ic: '❖', comp: markRaw(Ontology), sub: 'Docs + TBox graph' },
  ]},
  { group: 'Operations & Governance', items: [
    { id: 'experiments', label: 'Experiments', ic: '⚗', comp: markRaw(StudioExperiments), project: true, sub: 'Runs as proof-carrying graph facts' },
    { id: 'operations', label: 'Operations', ic: '⚙', comp: markRaw(StudioOps), project: true, sub: 'Pipelines · registry · catalog · communities' },
    { id: 'governance', label: 'Governance', ic: '🛡', comp: markRaw(StudioGovernance), project: true, sub: 'Ontology · SHACL actions · GAIA membrane' },
    { id: 'commons', label: 'Commons', ic: '❖', comp: markRaw(StudioCommons), project: true, sub: 'Proof-carrying knowledge commons' },
  ]},
];
const flat = GROUPS.flatMap((g) => g.items);

const route = useRoute();
const router = useRouter();
const project = ref('Untitled project');
const current = ref(sectionFromQuery());
function sectionFromQuery(): string {
  const s = (route.query.section as string) || (route.query.tab === 'compute' ? 'compute' : 'notebooks');
  return flat.some((i) => i.id === s) ? s : 'notebooks';
}
watch(() => route.query.section, () => { current.value = sectionFromQuery(); });
const active = computed(() => flat.find((i) => i.id === current.value) ?? flat[0]);
function go(id: string) { current.value = id; router.replace({ query: { ...route.query, section: id, tab: undefined } }); }
</script>

<template>
  <div class="studio-scope studio-shell">
    <aside class="st-rail">
      <div class="st-brand"><b>Studio</b><small>sovereign data + AI workbench</small></div>
      <nav class="st-nav">
        <template v-for="g in GROUPS" :key="g.group">
          <div class="st-group">{{ g.group }}</div>
          <a v-for="i in g.items" :key="i.id" :class="{ on: current === i.id }" @click="go(i.id)">
            <span class="st-ic">{{ i.ic }}</span>{{ i.label }}
          </a>
        </template>
      </nav>
    </aside>
    <section class="st-main">
      <header class="st-top">
        <div><h1>{{ active.label }}</h1><span class="st-sub">{{ active.sub }}</span></div>
        <span class="pill accent">proof-carrying · sovereign</span>
      </header>
      <div class="st-view">
        <component :is="active.comp" :key="active.id" v-bind="active.project ? { project } : {}" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.studio-shell { display: grid; grid-template-columns: 216px 1fr; height: calc(100vh - 7rem); min-height: 520px; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; background: var(--bg); color: var(--text); }
.st-rail { background: var(--panel); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
.st-brand { padding: .9rem 1rem; border-bottom: 1px solid var(--border); }
.st-brand b { font-size: 1rem; }
.st-brand small { display: block; color: var(--faint); font-size: .62rem; text-transform: uppercase; letter-spacing: .08em; margin-top: .1rem; }
.st-nav { padding: .5rem; overflow-y: auto; flex: 1; }
.st-group { color: var(--faint); font-size: .62rem; text-transform: uppercase; letter-spacing: .09em; padding: .8rem .6rem .25rem; }
.st-nav a { display: flex; align-items: center; gap: .55rem; padding: .45rem .6rem; border-radius: 8px; color: var(--muted); cursor: pointer; font-size: .84rem; user-select: none; }
.st-nav a:hover { background: var(--panel-2); color: var(--text); }
.st-nav a.on { background: #1b2740; color: var(--text); }
.st-ic { width: 16px; text-align: center; opacity: .85; }
.st-main { display: flex; flex-direction: column; overflow: hidden; }
.st-top { display: flex; align-items: center; justify-content: space-between; gap: .8rem; padding: .7rem 1.1rem; border-bottom: 1px solid var(--border); background: var(--panel); }
.st-top h1 { font-size: 1rem; margin: 0; font-weight: 600; }
.st-sub { color: var(--muted); font-size: .8rem; }
.st-view { flex: 1; overflow: auto; padding: 1.1rem 1.2rem; }
</style>
