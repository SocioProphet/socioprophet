<script setup lang="ts">
// NLP & Information Extraction — a REAL suite workbench. Five live tabs over our own services:
//   Extract   → spaCy NER + dependency relations + claims (ie-engine :8086)
//   Glossary  → salient terms + definitions (ie-engine)
//   Vectors   → embedding similarity (ie-engine)
//   Type System → RDFS/OWL entailment authoring (owl-reasoner :8081)
//   Resolve   → entity resolution → golden records (entity-resolution :8082)
// Extraction can be written into the canonical HellGraph. Sherlock / SynapseIQ / Holmes are surfaced
// as suite tools (deeper wiring pending — they need their own build/boot).
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import { navScopeForPath } from '../config/cockpitNav';
import { extract, toGraph, glossary, vectorize, reason, resolve, verifyClaims, kkoClassify, type Extraction, type Term, type Verdict } from '../services/ieApi';

const route = useRoute();
const router = useRouter();
const scope = computed(() => navScopeForPath(route.path));

const TABS = [
  { id: 'extract', label: 'Extract' }, { id: 'glossary', label: 'Glossary' }, { id: 'vectors', label: 'Vectors' },
  { id: 'types', label: 'Type System' }, { id: 'resolve', label: 'Resolve' },
] as const;
const tab = ref<string>('extract');
const busy = ref(false);
const err = ref('');

const DEMO = 'The Open Data Governance Board opened public comment on July 3, 2026 for a rule requiring model-provenance disclosure. Chair Dana Whitfield said the European Commission is expected to align a parallel framework. Compliance costs are estimated at $4.2M across covered providers, concentrated in Brussels and Washington.';
const text = ref(DEMO);
const ex = ref<Extraction | null>(null);
const wrote = ref<{ nodes: number; edges: number } | null>(null);

const TYPE_COLOR: Record<string, string> = {
  Org: 'var(--violet)', Person: 'var(--info)', Date: 'var(--amber)', Money: 'var(--up)', Place: 'var(--teal)',
  Topic: 'var(--accent)', Concept: 'var(--accent)', Product: 'var(--cyan)', Law: 'var(--ask)', Group: 'var(--violet)',
  Event: 'var(--cyan)', Percent: 'var(--up)', Quantity: 'var(--neutral)',
};
const color = (t: string) => TYPE_COLOR[t] ?? 'var(--neutral)';
const namedEntities = computed(() => (ex.value?.entities ?? []).filter((e) => e.type !== 'Topic'));
const legendTypes = computed(() => [...new Set(namedEntities.value.map((e) => e.type))]);

async function run<T>(fn: () => Promise<T>, set: (v: T) => void) {
  busy.value = true; err.value = '';
  try { set(await fn()); } catch (e) { err.value = e instanceof Error ? e.message : String(e); } finally { busy.value = false; }
}
const runExtract = () => { wrote.value = null; return run(() => extract(text.value), (v) => (ex.value = v)); };
const pushGraph = () => run(() => toGraph(text.value), (g) => { ex.value = g; wrote.value = { nodes: g.nodes_written, edges: g.edges_written }; });
runExtract();

// Holmes — verify the extracted claims against real HellGraph evidence
const verdicts = ref<Record<string, Verdict>>({});
const runVerify = () => run(() => verifyClaims((ex.value?.claims ?? []).map((c) => c.text)),
  (r) => { verdicts.value = Object.fromEntries(r.results.map((v) => [v.claim, v])); });

// SynapseIQ — classify each entity TYPE into the KKO (Peircean) ontology
const kko = ref<Record<string, string>>({});
const runKko = () => run(() => kkoClassify([...new Set(namedEntities.value.map((e) => e.type))]),
  (r) => { kko.value = Object.fromEntries(r.results.map((k) => [k.type, k.kko])); });

// Glossary
const gloss = ref<Term[]>([]);
const runGloss = () => run(() => glossary(text.value), (v) => (gloss.value = v.terms));

// Vectors
const vecText = ref('model provenance disclosure rule\nprovenance of an AI model\nquarterly revenue growth\nEBITDA margin expansion');
const sim = ref<number[][]>([]);
const vecLines = computed(() => vecText.value.split('\n').map((s) => s.trim()).filter(Boolean));
const runVec = () => run(() => vectorize(vecLines.value), (v) => (sim.value = v.similarity));
const heat = (x: number) => `rgba(75,191,115,${(x * 0.9).toFixed(2)})`;

// Type System (owl-reasoner)
const ttl = ref('@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n@prefix ex: <http://ex/> .\nex:Regulator rdfs:subClassOf ex:Institution .\nex:Institution rdfs:subClassOf ex:Agent .\nex:ODGB a ex:Regulator .');
const ent = ref<{ input: number; entailed: number; rows: any[] } | null>(null);
const runReason = () => run(() => reason(ttl.value, 'rdfs'), (r) => (ent.value = { input: r.input_triples, entailed: r.entailed_triples, rows: r.entailments || [] }));

// Resolve (entity-resolution) — resolve the extracted named entities
const golden = ref<any[]>([]);
const resolveInput = computed(() => namedEntities.value.map((e, i) => ({ id: `e${i}`, name: e.text })));
const runResolve = () => run(() => resolve(resolveInput.value.length ? resolveInput.value : [{ id: 'a', name: 'Acme Corp' }, { id: 'b', name: 'ACME Corporation' }]), (r) => (golden.value = r.golden_records || []));

const SUITE = [
  { label: 'Ontology', to: '/studio?section=ontology' }, { label: 'Entity Resolution', to: '/studio?section=er' },
  { label: 'Graph', to: '/studio?section=graph' }, { label: 'GraphRAG', to: '/studio?section=graphrag' },
];
</script>

<template>
  <section class="ie" aria-label="NLP and information extraction">
    <SurfaceHeader :title="scope && !scope.isPrimary ? scope.label : 'NLP & Information Extraction'" :eyebrow="scope && !scope.isPrimary ? scope.domain : 'Knowledge'">
      <template #badge><span class="ie-pill live">live suite</span></template>
      <template #actions>
        <div class="ie-suite">
          <button v-for="s in SUITE" :key="s.to" class="ie-tool" @click="router.push(s.to)">{{ s.label }}</button>
          <span class="ie-tool live" title="Holmes claim-verifier is live — Verify in the Claims panel">Holmes ✓</span>
          <span class="ie-tool live" title="SynapseIQ language intelligence is live — KKO-type in the Entities panel">SynapseIQ ✓</span>
          <span class="ie-tool pending" title="Sherlock (procybernetica dashboard) — build-out pending">Sherlock</span>
        </div>
      </template>
    </SurfaceHeader>

    <div class="ie-tabs">
      <button v-for="t in TABS" :key="t.id" class="ie-tab" :class="{ on: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
    </div>
    <p v-if="err" class="ie-err">{{ err }}</p>

    <!-- EXTRACT -->
    <div v-show="tab === 'extract'" class="ie-grid">
      <div class="ie-in">
        <div class="ie-in-h">Text · paste anything</div>
        <textarea v-model="text" class="ie-ta" rows="9" spellcheck="false"></textarea>
        <div class="ie-actions">
          <button class="ie-btn primary" :disabled="busy || !text.trim()" @click="runExtract">{{ busy ? 'Extracting…' : 'Extract' }}</button>
          <button class="ie-btn" :disabled="busy || !text.trim()" @click="pushGraph">Extract → HellGraph →</button>
        </div>
        <p v-if="wrote" class="ie-wrote">Wrote <b>{{ wrote.nodes }}</b> nodes · <b>{{ wrote.edges }}</b> edges into the canonical graph.</p>
        <div v-if="ex" class="ie-legend"><span v-for="t in legendTypes" :key="t" class="ie-lg"><i :style="{ background: color(t) }"></i>{{ t }}</span></div>
        <p v-if="ex" class="ie-prov">{{ ex.provenance.model }} · {{ ex.counts.tokens }} tokens · real extraction</p>
      </div>
      <div class="ie-out" v-if="ex">
        <div class="ie-sec">
          <div class="ie-sec-h" style="display:flex;justify-content:space-between;align-items:center">
            <span>Entities <span class="ie-n">{{ namedEntities.length }}</span></span>
            <button class="ie-verify-btn" :disabled="busy" @click="runKko" title="Classify each entity type into the KKO (Peircean) ontology via SynapseIQ">◇ KKO-type via SynapseIQ</button>
          </div>
          <div class="ie-ents"><span v-for="(e, i) in namedEntities" :key="i" class="ie-ent"><span class="ie-etag" :style="{ background: color(e.type) }">{{ e.type }}</span>{{ e.text }}<span v-if="kko[e.type]" class="ie-kko" :title="'KKO: ' + kko[e.type]">{{ kko[e.type] }}</span></span></div>
          <p v-if="Object.keys(kko).length" class="ie-prov">SynapseIQ · entity types classified into the KKO ontology (Particulars / Generals / Possibilities)</p>
        </div>
        <div class="ie-sec" v-if="ex.relations.length">
          <div class="ie-sec-h">Relations <span class="ie-n">{{ ex.relations.length }}</span></div>
          <div v-for="(r, i) in ex.relations" :key="i" class="ie-rel"><span class="ie-rel-e">{{ r.from }}</span><span class="ie-rel-v">{{ r.relation }} →</span><span class="ie-rel-e">{{ r.to }}</span></div>
        </div>
        <div class="ie-sec" v-if="ex.claims.length">
          <div class="ie-sec-h" style="display:flex;justify-content:space-between;align-items:center">
            <span>Claims <span class="ie-n">{{ ex.claims.length }}</span></span>
            <button class="ie-verify-btn" :disabled="busy" @click="runVerify" title="Verify each claim against real HellGraph evidence">🔎 Verify with Holmes</button>
          </div>
          <div v-for="(c, i) in ex.claims" :key="i" class="ie-claim">
            <span class="ie-ctag" :class="c.type.toLowerCase()">{{ c.type }}</span>
            <span class="ie-ctext">{{ c.text }}</span>
            <span v-if="verdicts[c.text]" class="ie-holmes" :class="verdicts[c.text].verdict" :title="'matched: ' + (verdicts[c.text].matched_terms || []).join(', ') + ' · ' + verdicts[c.text].evidence_count + ' evidence facts'">{{ verdicts[c.text].verdict }}</span>
            <span v-else class="ie-verif" :class="c.verifiable ? 'yes' : 'no'">{{ c.verifiable ? 'verifiable' : 'unverifiable' }}</span>
          </div>
          <p v-if="Object.keys(verdicts).length" class="ie-prov">Holmes deduction engine · verdicts grounded in HellGraph evidence (term-matched)</p>
        </div>
      </div>
    </div>

    <!-- GLOSSARY -->
    <div v-show="tab === 'glossary'" class="ie-grid">
      <div class="ie-in">
        <div class="ie-in-h">Derive a glossary from text</div>
        <textarea v-model="text" class="ie-ta" rows="9" spellcheck="false"></textarea>
        <div class="ie-actions"><button class="ie-btn primary" :disabled="busy" @click="runGloss">Derive glossary</button></div>
      </div>
      <div class="ie-out">
        <table class="ie-tbl" v-if="gloss.length"><thead><tr><th>Term</th><th>Type</th><th>×</th><th>Definition (in context)</th></tr></thead>
        <tbody><tr v-for="(t, i) in gloss" :key="i"><td><b>{{ t.term }}</b></td><td><span class="ie-etag sm" :style="{ background: color(t.type) }">{{ t.type }}</span></td><td>{{ t.count }}</td><td class="ie-def">{{ t.definition }}</td></tr></tbody></table>
        <p v-else class="ie-empty">Derive a glossary → salient terms with their in-context definitions.</p>
      </div>
    </div>

    <!-- VECTORS -->
    <div v-show="tab === 'vectors'" class="ie-grid">
      <div class="ie-in">
        <div class="ie-in-h">Texts · one per line</div>
        <textarea v-model="vecText" class="ie-ta" rows="9" spellcheck="false"></textarea>
        <div class="ie-actions"><button class="ie-btn primary" :disabled="busy || vecLines.length < 2" @click="runVec">Vectorize &amp; compare</button></div>
      </div>
      <div class="ie-out">
        <div class="ie-sec" v-if="sim.length">
          <div class="ie-sec-h">Cosine similarity</div>
          <table class="ie-heat"><tbody><tr v-for="(row, i) in sim" :key="i"><td class="ie-hlabel">{{ vecLines[i]?.slice(0, 22) }}</td><td v-for="(v, j) in row" :key="j" :style="{ background: heat(v) }" :title="v.toFixed(2)">{{ v.toFixed(2) }}</td></tr></tbody></table>
        </div>
        <p v-else class="ie-empty">Enter ≥2 lines → real vector similarity between them.</p>
      </div>
    </div>

    <!-- TYPE SYSTEM -->
    <div v-show="tab === 'types'" class="ie-grid">
      <div class="ie-in">
        <div class="ie-in-h">Type system · Turtle (RDFS/OWL)</div>
        <textarea v-model="ttl" class="ie-ta mono" rows="9" spellcheck="false"></textarea>
        <div class="ie-actions"><button class="ie-btn primary" :disabled="busy" @click="runReason">Infer entailments</button></div>
      </div>
      <div class="ie-out">
        <div class="ie-sec" v-if="ent">
          <div class="ie-sec-h">{{ ent.input }} asserted → <b>{{ ent.entailed }}</b> entailed triples</div>
          <div v-for="(r, i) in ent.rows.slice(0, 14)" :key="i" class="ie-rel"><span class="ie-rel-e mono">{{ (r.s || r.subject || '').split(/[#/]/).pop() }}</span><span class="ie-rel-v mono">{{ (r.p || r.predicate || '').split(/[#/]/).pop() }} →</span><span class="ie-rel-e mono">{{ (r.o || r.object || '').split(/[#/]/).pop() }}</span></div>
        </div>
        <p v-else class="ie-empty">Author a type system → owl-reasoner infers the entailed class/instance triples.</p>
      </div>
    </div>

    <!-- RESOLVE -->
    <div v-show="tab === 'resolve'" class="ie-grid">
      <div class="ie-in">
        <div class="ie-in-h">Resolve the extracted entities</div>
        <div class="ie-mentions"><span v-for="(m, i) in resolveInput" :key="i" class="ie-topic">{{ m.name }}</span><span v-if="!resolveInput.length" class="ie-empty">Run Extract first, or a sample pair is used.</span></div>
        <div class="ie-actions"><button class="ie-btn primary" :disabled="busy" @click="runResolve">Resolve → golden records</button></div>
      </div>
      <div class="ie-out">
        <table class="ie-tbl" v-if="golden.length"><thead><tr><th>Golden record</th><th>Members</th></tr></thead>
        <tbody><tr v-for="(g, i) in golden" :key="i"><td><b>{{ g.name || g.canonical || g.id }}</b></td><td>{{ (g.members || g.records || []).length || 1 }}</td></tr></tbody></table>
        <p v-else class="ie-empty">Resolve → entity-resolution clusters mentions into proof-carrying golden records.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ie { padding: 1rem 1.25rem; max-width: 1180px; margin: 0 auto; color: var(--text); }
.ie-pill { font-size: .62rem; text-transform: uppercase; letter-spacing: .05em; padding: .1rem .45rem; border-radius: 999px; border: 1px solid var(--line-2); color: var(--text-2); }
.ie-pill.live { color: var(--live); border-color: rgba(75,191,115,.4); background: rgba(75,191,115,.12); }
.ie-suite { display: flex; gap: .35rem; flex-wrap: wrap; align-items: center; }
.ie-tool { background: var(--surface-2); border: 1px solid var(--line); color: var(--text-2); border-radius: 8px; padding: .25rem .55rem; font-size: .72rem; cursor: pointer; }
.ie-tool:hover { border-color: var(--accent); color: var(--text); }
.ie-tool.pending { cursor: default; opacity: .6; }
.ie-tool.live { cursor: default; color: var(--live); border-color: rgba(75,191,115,.4); background: rgba(75,191,115,.1); }
.ie-verify-btn { background: var(--surface-2); border: 1px solid var(--line-2); color: var(--text-2); border-radius: 8px; padding: .25rem .6rem; font-size: .72rem; cursor: pointer; text-transform: none; letter-spacing: 0; }
.ie-verify-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--text); }
.ie-verify-btn:disabled { opacity: .5; cursor: default; }
.ie-holmes { font-size: .64rem; font-weight: 700; padding: .1rem .45rem; border-radius: 6px; text-transform: uppercase; }
.ie-holmes.supported { color: var(--live); background: rgba(75,191,115,.16); }
.ie-holmes.weakly-supported { color: var(--amber); background: rgba(227,179,65,.16); }
.ie-holmes.unverified, .ie-holmes.unreachable { color: var(--text-3); background: var(--surface-2); }
.ie-kko { font-size: .56rem; font-weight: 700; text-transform: uppercase; color: var(--ask); background: rgba(147,180,255,.14); padding: .05rem .3rem; border-radius: 4px; }
.ie-tabs { display: flex; gap: .3rem; margin: .8rem 0 .5rem; border-bottom: 1px solid var(--line); }
.ie-tab { background: none; border: 0; border-bottom: 2px solid transparent; color: var(--text-2); padding: .45rem .8rem; cursor: pointer; font-size: .86rem; }
.ie-tab.on { color: var(--text); border-bottom-color: var(--accent); }
.ie-err { color: var(--down); font-size: .8rem; }
.ie-grid { display: grid; grid-template-columns: 420px 1fr; gap: 1rem; }
.ie-in-h, .ie-sec-h { color: var(--text-3); font-size: .66rem; text-transform: uppercase; letter-spacing: .06em; margin-bottom: .3rem; }
.ie-ta { width: 100%; background: var(--surface); color: var(--text); border: 1px solid var(--line-2); border-radius: 10px; padding: .6rem .7rem; font-size: .84rem; line-height: 1.5; resize: vertical; outline: none; }
.ie-ta.mono { font-family: var(--font-mono, ui-monospace, monospace); font-size: .78rem; }
.ie-ta:focus { border-color: var(--accent); }
.ie-actions { display: flex; gap: .5rem; margin: .6rem 0; }
.ie-btn { border: 1px solid var(--line-2); background: var(--surface-2); color: var(--text); border-radius: 8px; padding: .45rem .8rem; font-weight: 600; cursor: pointer; font-size: .82rem; }
.ie-btn.primary { background: var(--accent); border-color: var(--accent); color: #1a1204; }
.ie-btn:disabled { opacity: .5; cursor: default; }
.ie-wrote { font-size: .8rem; color: var(--live); } .ie-wrote b { font-weight: 700; }
.ie-legend { display: flex; gap: .7rem; flex-wrap: wrap; margin-top: .6rem; }
.ie-lg { display: inline-flex; align-items: center; gap: .3rem; font-size: .72rem; color: var(--text-2); } .ie-lg i { width: 9px; height: 9px; border-radius: 50%; }
.ie-prov { color: var(--text-3); font-size: .72rem; margin-top: .5rem; }
.ie-out { display: flex; flex-direction: column; gap: 1rem; }
.ie-empty { color: var(--text-3); font-size: .84rem; }
.ie-sec { border: 1px solid var(--line-2); border-radius: 12px; background: var(--surface); padding: .7rem .85rem; }
.ie-n { color: var(--text-3); font-weight: 400; }
.ie-ents { display: flex; flex-wrap: wrap; gap: .4rem; }
.ie-ent { display: inline-flex; align-items: center; gap: .35rem; border: 1px solid var(--line); border-radius: 8px; padding: .2rem .5rem; font-size: .85rem; }
.ie-etag { font-size: .58rem; font-weight: 700; text-transform: uppercase; padding: .05rem .35rem; border-radius: 4px; color: #0b0d11; letter-spacing: .03em; }
.ie-etag.sm { font-size: .55rem; }
.ie-rel { display: flex; align-items: center; gap: .5rem; padding: .25rem 0; font-size: .84rem; border-bottom: 1px solid var(--line); }
.ie-rel-e { color: var(--text); } .ie-rel-v { color: var(--text-3); font-size: .76rem; } .mono { font-family: var(--font-mono, ui-monospace, monospace); }
.ie-claim { display: flex; align-items: center; gap: .5rem; padding: .3rem 0; border-bottom: 1px solid var(--line); font-size: .84rem; }
.ie-ctag { font-size: .58rem; font-weight: 700; padding: .05rem .4rem; border-radius: 4px; }
.ie-ctag.assert { color: var(--live); background: rgba(75,191,115,.14); } .ie-ctag.hedge { color: var(--amber); background: rgba(227,179,65,.14); }
.ie-ctext { flex: 1; color: var(--text-2); } .ie-verif { font-size: .68rem; } .ie-verif.yes { color: var(--live); } .ie-verif.no { color: var(--text-3); }
.ie-tbl { width: 100%; border-collapse: collapse; font-size: .82rem; }
.ie-tbl th { text-align: left; color: var(--text-3); font-weight: 500; border-bottom: 1px solid var(--line-2); padding: .35rem .4rem; }
.ie-tbl td { border-bottom: 1px solid var(--line); padding: .35rem .4rem; vertical-align: top; } .ie-def { color: var(--text-2); }
.ie-heat { border-collapse: collapse; font-size: .72rem; } .ie-heat td { border: 1px solid var(--bg); padding: .25rem .4rem; text-align: center; color: var(--text); min-width: 44px; } .ie-hlabel { text-align: left !important; color: var(--text-3); background: var(--surface) !important; }
.ie-mentions { display: flex; flex-wrap: wrap; gap: .35rem; }
.ie-topic { border: 1px solid var(--line); border-radius: 999px; padding: .15rem .55rem; font-size: .76rem; color: var(--text-2); }
@media (max-width: 900px) { .ie-grid { grid-template-columns: 1fr; } }
</style>
