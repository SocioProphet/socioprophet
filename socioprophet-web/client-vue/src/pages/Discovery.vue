<script setup lang="ts">
// Sherlock Discovery — sovereign, ontology-driven search over a corpus (Tantivy/Rust, no JVM),
// integrated with Holmes: any result can be verified against real HellGraph evidence.
// First corpus: the frontier-model-lab competition.
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import { navScopeForPath } from '../config/cockpitNav';
import { search, facets, type Hit, type Facets } from '../services/sherlockApi';
import { verifyClaims, type Verdict } from '../services/ieApi';

const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

const q = ref('sovereign proof-carrying provenance');
const hits = ref<Hit[]>([]);
const total = ref(0);
const fac = ref<Facets | null>(null);
const busy = ref(false);
const err = ref('');
const verdicts = ref<Record<string, Verdict>>({});

async function runSearch() {
  busy.value = true; err.value = ''; verdicts.value = {};
  try { const r = await search(q.value, 12); hits.value = r.hits; total.value = r.total; }
  catch (e) { err.value = e instanceof Error ? e.message : String(e); }
  finally { busy.value = false; }
}
async function verify(h: Hit) {
  busy.value = true;
  try { const r = await verifyClaims([h.title.split('—')[0].trim() + ' ' + h.category]); if (r.results[0]) verdicts.value = { ...verdicts.value, [h.id]: r.results[0] }; }
  catch (e) { err.value = e instanceof Error ? e.message : String(e); }
  finally { busy.value = false; }
}
onMounted(async () => { await runSearch(); try { fac.value = await facets(); } catch { /* facets best-effort */ } });

const EXAMPLES = ['open weight efficient reasoning', 'AI safety interpretability governance', 'multimodal scientific reasoning', 'constitutional harmlessness'];
</script>

<template>
  <section class="dz" aria-label="Discovery search">
    <SurfaceHeader :title="scope && !scope.isPrimary ? scope.label : 'Discovery'" :eyebrow="scope && !scope.isPrimary ? scope.domain : 'Knowledge'">
      <template #badge><span class="dz-pill live">Tantivy · sovereign · no-JVM</span></template>
    </SurfaceHeader>

    <div class="dz-search">
      <span class="dz-glyph">⌕</span>
      <input v-model="q" class="dz-input" placeholder="Search the corpus — ontology-driven, BM25 ranked" @keyup.enter="runSearch" />
      <button class="dz-btn" :disabled="busy" @click="runSearch">{{ busy ? 'Searching…' : 'Search' }}</button>
    </div>
    <div class="dz-ex"><span class="dz-try">Try</span><button v-for="e in EXAMPLES" :key="e" class="dz-chip" @click="q = e; runSearch()">{{ e }}</button>
      <span class="dz-corpus">corpus: frontier-model-lab competition · {{ total }} hits</span></div>
    <p v-if="err" class="dz-err">{{ err }}</p>

    <div class="dz-grid">
      <aside class="dz-facets" v-if="fac">
        <div class="dz-fac"><div class="dz-fac-h">Category</div><div v-for="(n, k) in fac.category" :key="k" class="dz-fac-row" @click="q = String(k); runSearch()"><span>{{ k }}</span><span class="dz-fac-n">{{ n }}</span></div></div>
        <div class="dz-fac"><div class="dz-fac-h">Region</div><div v-for="(n, k) in fac.region" :key="k" class="dz-fac-row"><span>{{ k }}</span><span class="dz-fac-n">{{ n }}</span></div></div>
        <div class="dz-fac"><div class="dz-fac-h">Doc type</div><div v-for="(n, k) in fac.doctype" :key="k" class="dz-fac-row"><span>{{ k }}</span><span class="dz-fac-n">{{ n }}</span></div></div>
      </aside>

      <div class="dz-results">
        <div v-for="h in hits" :key="h.id" class="dz-hit">
          <div class="dz-hit-h">
            <span class="dz-hit-t">{{ h.title }}</span>
            <span class="dz-bm25" title="BM25 relevance">{{ h.bm25.toFixed(2) }}</span>
          </div>
          <div class="dz-hit-meta"><span class="dz-tag">{{ h.doctype }}</span><span class="dz-tag">{{ h.category }}</span><span class="dz-tag">{{ h.region }}</span><span class="dz-tag score">score {{ h.score }}</span></div>
          <p class="dz-snip" v-html="h.snippet || ''"></p>
          <div class="dz-hit-actions">
            <button class="dz-verify" :disabled="busy" @click="verify(h)">🔎 Verify with Holmes</button>
            <span v-if="verdicts[h.id]" class="dz-holmes" :class="verdicts[h.id].verdict">{{ verdicts[h.id].verdict }}<span v-if="verdicts[h.id].evidence_count"> · {{ verdicts[h.id].evidence_count }} evidence</span></span>
          </div>
        </div>
        <p v-if="!busy && !hits.length" class="dz-empty">No matches. Try a broader query.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dz { padding: 1rem 1.25rem; max-width: 1120px; margin: 0 auto; color: var(--text); }
.dz-pill { font-size: .62rem; text-transform: uppercase; letter-spacing: .04em; padding: .1rem .5rem; border-radius: 999px; color: var(--live); border: 1px solid rgba(75,191,115,.4); background: rgba(75,191,115,.12); }
.dz-search { display: flex; align-items: center; gap: .6rem; border: 1px solid var(--line-2); background: var(--surface); border-radius: 12px; padding: .55rem .8rem; margin: 1rem 0 .5rem; }
.dz-glyph { color: var(--accent); font-size: 1.1rem; }
.dz-input { flex: 1; background: transparent; border: 0; color: var(--text); font-size: .95rem; outline: none; }
.dz-btn { background: var(--accent); color: #1a1204; border: 0; border-radius: 8px; padding: .45rem 1rem; font-weight: 700; cursor: pointer; }
.dz-btn:disabled { opacity: .5; cursor: default; }
.dz-ex { display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; margin-bottom: .5rem; }
.dz-try { color: var(--text-3); font-size: .74rem; }
.dz-chip { background: var(--surface-2); border: 1px solid var(--line); color: var(--text-2); border-radius: 999px; padding: .2rem .6rem; font-size: .74rem; cursor: pointer; }
.dz-chip:hover { border-color: var(--accent); color: var(--text); }
.dz-corpus { margin-left: auto; color: var(--text-3); font-size: .72rem; }
.dz-err { color: var(--down); font-size: .82rem; }
.dz-grid { display: grid; grid-template-columns: 210px 1fr; gap: 1rem; margin-top: .5rem; }
.dz-facets { display: flex; flex-direction: column; gap: .8rem; }
.dz-fac { border: 1px solid var(--line-2); border-radius: 12px; background: var(--surface); padding: .6rem .7rem; }
.dz-fac-h { color: var(--text-3); font-size: .64rem; text-transform: uppercase; letter-spacing: .06em; margin-bottom: .35rem; }
.dz-fac-row { display: flex; justify-content: space-between; font-size: .78rem; padding: .15rem 0; color: var(--text-2); cursor: pointer; }
.dz-fac-row:hover { color: var(--text); }
.dz-fac-n { color: var(--text-3); }
.dz-results { display: flex; flex-direction: column; gap: .7rem; }
.dz-hit { border: 1px solid var(--line-2); border-radius: 12px; background: var(--surface); padding: .8rem .9rem; }
.dz-hit-h { display: flex; justify-content: space-between; align-items: baseline; gap: .5rem; }
.dz-hit-t { font-weight: 650; font-size: 1rem; }
.dz-bm25 { color: var(--accent-2); font-weight: 700; font-size: .82rem; }
.dz-hit-meta { display: flex; gap: .35rem; flex-wrap: wrap; margin: .3rem 0; }
.dz-tag { font-size: .64rem; color: var(--text-3); border: 1px solid var(--line); border-radius: 6px; padding: .05rem .4rem; }
.dz-tag.score { color: var(--accent-2); border-color: rgba(216,162,80,.3); }
.dz-snip { font-size: .84rem; color: var(--text-2); line-height: 1.5; margin: .3rem 0; }
.dz-snip :deep(b) { color: var(--text); background: rgba(216,162,80,.22); border-radius: 3px; padding: 0 2px; }
.dz-hit-actions { display: flex; align-items: center; gap: .6rem; margin-top: .4rem; }
.dz-verify { background: var(--surface-2); border: 1px solid var(--line-2); color: var(--text-2); border-radius: 8px; padding: .25rem .6rem; font-size: .72rem; cursor: pointer; }
.dz-verify:hover:not(:disabled) { border-color: var(--accent); color: var(--text); }
.dz-holmes { font-size: .66rem; font-weight: 700; text-transform: uppercase; padding: .1rem .45rem; border-radius: 6px; }
.dz-holmes.supported { color: var(--live); background: rgba(75,191,115,.16); }
.dz-holmes.weakly-supported { color: var(--amber); background: rgba(227,179,65,.16); }
.dz-holmes.unverified, .dz-holmes.unreachable { color: var(--text-3); background: var(--surface-2); }
.dz-empty { color: var(--text-3); font-size: .85rem; }
@media (max-width: 900px) { .dz-grid { grid-template-columns: 1fr; } }
</style>
