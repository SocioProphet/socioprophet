<template>
  <section class="mp" aria-label="Model platform intelligence">
    <header class="mp-head">
      <div>
        <div class="mp-eyebrow">Professional Intelligence · competitive</div>
        <h2 class="mp-title">Model Platform Intelligence</h2>
      </div>
      <span class="mp-pill">SociOS vs watsonx.ai · SageMaker · Seldon</span>
    </header>
    <p class="mp-lede">Where the model board wins — and it's investigable, not asserted. Click a platform to trace the claim to <b>real code</b> in the estate graph and the <b>auto-generated docs</b>.</p>

    <div class="mp-cols">
      <ol class="mp-rank" aria-label="Ranking">
        <li v-for="p in ranking" :key="p.id" :class="{ on: sel === p.id, us: !p.vendor }" @click="sel = p.id" tabindex="0" @keydown.enter="sel = p.id">
          <span class="mp-score">{{ p.score }}</span>
          <span class="mp-body"><span class="mp-name">{{ p.name }}<span v-if="!p.vendor" class="mp-us">ours</span></span>
            <span class="mp-sov">{{ p.sovereignty }}</span>
            <span class="mp-one">{{ p.oneLiner }}</span></span>
        </li>
      </ol>

      <aside class="mp-invest" v-if="investigation">
        <h3 class="mp-ih">Investigate — grounded in code + docs</h3>
        <p class="mp-isum">{{ investigation.summary }}</p>
        <div class="mp-ilab">Code graph <span>live HellGraph · click to open</span></div>
        <div v-for="c in investigation.code" :key="c.path" class="mp-ref code" tabindex="0" role="button"
             :aria-label="`Open ${c.repo}/${c.path} in the live code graph`"
             @click="openCodeGraph(c)" @keydown.enter="openCodeGraph(c)">
          <span class="mp-refmono">{{ c.repo }}/{{ c.path }}<b v-if="c.symbol"> · {{ c.symbol }}()</b></span>
          <span class="mp-reflab">{{ c.label }}</span>
          <span class="mp-refrow">
            <span class="mp-refgraph">◈ open in live code graph</span>
            <a class="mp-refsrc" :href="ghUrl(c.repo, c.path)" target="_blank" rel="noopener" @click.stop>source ↗</a>
          </span>
        </div>
        <div class="mp-ilab">Auto-generated docs</div>
        <a v-for="d in investigation.docs" :key="d.path" class="mp-ref doc" :href="specUrl(d.path)" target="_blank" rel="noopener">
          <span class="mp-refmono">{{ d.path }}</span><span class="mp-reflab">{{ d.title }}</span>
        </a>
        <button class="mp-ask" :disabled="askState === 'loading'" @click="ask">
          {{ askState === 'loading' ? '◈ Asking the live graph…' : '◈ Ask the agent — grounded answer' }}
        </button>
        <div v-if="askState === 'unreachable'" class="mp-askerr">
          Live graph unreachable ({{ askError }}) — the GraphRAG endpoint (hellgraph-service <code>/api/graph/ask</code>) didn't respond. No answer fabricated; wire <code>VITE_HELLGRAPH_BASE</code> / <code>/svc/hellgraph</code> to a running hellgraph-service to answer this live.
        </div>
        <div v-else-if="askState === 'answered' && askResult" class="mp-asknote">
          <p class="mp-askq">Routed to the live GraphRAG endpoint (hellgraph-service <code>/api/graph/ask</code>) over the code + docs graph: <span class="mp-refmono">“{{ investigation.agentQuery }}”</span></p>
          <p v-if="askResult.grounded && askResult.answer" class="mp-askans">{{ askResult.answer }}</p>
          <p v-else-if="askResult.grounded" class="mp-askans muted">
            Grounded in {{ askResult.citations.length }} graph fact(s) but no sovereign LLM is configured server-side to synthesize prose — the citations below ARE the answer.
          </p>
          <p v-else class="mp-askans muted">
            The live graph has nothing grounded for this question yet (0 matching facts) — nothing fabricated. These claims will become live-answerable once the referenced code/docs are ingested into HellGraph.
          </p>
          <ul v-if="askResult.citations.length" class="mp-askcites">
            <li v-for="c in askResult.citations" :key="c.n">[{{ c.n }}] {{ c.fact }}</li>
          </ul>
        </div>
      </aside>
      <aside class="mp-invest" v-else>
        <h3 class="mp-ih">{{ selName }}</h3>
        <p class="mp-isum">A vendor platform — strong where it plays, but not sovereignty-ranked, not one board, and its governance isn't a replayable receipt. Select <b>SociOS Model Board</b> to trace our advantage to code + docs.</p>
      </aside>
    </div>

    <h3 class="mp-mh">Capability matrix</h3>
    <table class="mp-mx">
      <thead><tr><th>Dimension</th><th class="us">SociOS</th><th>watsonx</th><th>SageMaker</th><th>Seldon</th></tr></thead>
      <tbody>
        <tr v-for="r in matrix" :key="r.dim" :class="r.verdict">
          <td class="mp-dim">{{ r.dim }}</td><td class="us">{{ r.sociOS }}</td><td>{{ r.watson }}</td><td>{{ r.sagemaker }}</td><td>{{ r.seldon }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { modelPlatformRanking, capabilityMatrix, investigations, type CodeRef } from '../features/competitive-intelligence/modelPlatforms';
import { askGraphWithFallback, type GraphAskResult } from '../services/hellgraphApi';

const router = useRouter();
const ranking = modelPlatformRanking;
const matrix = capabilityMatrix;
const sel = ref('sociOS');
const investigation = computed(() => investigations[sel.value]);
const selName = computed(() => ranking.find((p) => p.id === sel.value)?.name ?? '');

// ── Code refs → the LIVE HellGraph code-graph view (hellgraph-service via /svc/hellgraph),
// not a plain GitHub blob link. `hg:code/<repo>/<path>` mirrors the `hg:repo/<repo>` convention
// AgenticOS.vue already uses to deep-link into /knowledge/graph. GitHub stays as a secondary
// "source ↗" link — real, always works, just no longer the primary click target.
function codeGraphRoot(c: CodeRef): string { return `hg:code/${c.repo}/${c.path}`; }
function openCodeGraph(c: CodeRef) {
  router.push({ path: '/knowledge/graph', query: { root: codeGraphRoot(c) } });
}

// ── "Ask the agent" → a real grounded NLQ against hellgraph-service POST /api/graph/ask
// (GraphRAG: retrieval-grounded, provenance-cited, fail-open to extractive citations when no
// sovereign LLM is configured, fail-CLOSED to an explicit "unreachable" state on network
// failure). Never fabricates an answer.
type AskState = 'idle' | 'loading' | 'answered' | 'unreachable';
const askState = ref<AskState>('idle');
const askResult = ref<GraphAskResult | null>(null);
const askError = ref('');

async function ask() {
  const inv = investigation.value;
  if (!inv) return;
  askState.value = 'loading';
  askResult.value = null;
  askError.value = '';
  const r = await askGraphWithFallback(inv.agentQuery);
  if (r.mode === 'unreachable') {
    askError.value = r.error ?? 'unreachable';
    askState.value = 'unreachable';
  } else {
    askResult.value = r.result;
    askState.value = 'answered';
  }
}

// Selecting a different platform invalidates the prior answer — ask again explicitly rather
// than showing a stale grounded answer against the newly-selected investigation.
watch(sel, () => { askState.value = 'idle'; askResult.value = null; askError.value = ''; });

const REPO_ORG: Record<string, string> = {
  'agent-machine': 'SourceOS-Linux', 'sourceos-spec': 'SourceOS-Linux', 'prophet-platform': 'SocioProphet',
};
function ghUrl(repo: string, path: string) { return `https://github.com/${REPO_ORG[repo] ?? 'SocioProphet'}/${repo}/blob/main/${path}`; }
function specUrl(path: string) { return `https://github.com/SourceOS-Linux/sourceos-spec/blob/main/${path}`; }
</script>

<style scoped>
.mp { padding: 16px; color: var(--text, #e8edf7); }
.mp-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.mp-eyebrow { font-family: var(--mono, monospace); font-size: 10.5px; color: var(--faint, #586179); letter-spacing: .5px; }
.mp-title { margin: 2px 0 0; font-size: 19px; }
.mp-pill { font-size: 11px; font-family: var(--mono, monospace); color: var(--muted, #8b96b0); border: 1px solid var(--border, #2c3854); border-radius: 12px; padding: 3px 10px; }
.mp-lede { color: var(--muted, #8b96b0); font-size: 13px; max-width: 78ch; }
.mp-cols { display: grid; grid-template-columns: 1.1fr 1fr; gap: 14px; align-items: start; }
@media (max-width: 860px) { .mp-cols { grid-template-columns: 1fr; } }
.mp-rank { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.mp-rank li { display: grid; grid-template-columns: 40px 1fr; gap: 11px; align-items: center; padding: 11px 13px; border: 1px solid var(--border, #2c3854); border-radius: 11px; cursor: pointer; background: var(--panel, #111726); }
.mp-rank li.on { border-color: var(--accent, #4fd0e0); box-shadow: inset 3px 0 0 var(--accent, #4fd0e0); }
.mp-rank li.us { background: color-mix(in srgb, var(--accent, #4fd0e0) 8%, transparent); }
.mp-score { font-family: var(--mono, monospace); font-size: 20px; font-weight: 700; text-align: center; color: var(--accent, #4fd0e0); }
.mp-name { font-weight: 640; display: flex; align-items: center; gap: 8px; }
.mp-us { font-family: var(--mono, monospace); font-size: 9px; font-weight: 700; color: #0a0e18; background: var(--accent, #4fd0e0); border-radius: 4px; padding: 1px 5px; }
.mp-sov { display: block; font-family: var(--mono, monospace); font-size: 10.5px; color: var(--faint, #586179); margin: 1px 0; }
.mp-one { display: block; font-size: 11.5px; color: var(--muted, #8b96b0); }
.mp-invest { border: 1px solid var(--border, #2c3854); border-radius: 12px; padding: 13px 14px; background: var(--panel, #111726); }
.mp-ih { margin: 0 0 5px; font-size: 13px; color: var(--accent, #4fd0e0); }
.mp-isum { color: var(--muted, #8b96b0); font-size: 12px; margin: 0 0 10px; }
.mp-ilab { font-family: var(--mono, monospace); font-size: 10px; color: var(--faint, #586179); text-transform: uppercase; letter-spacing: .5px; margin: 10px 0 6px; display: flex; justify-content: space-between; }
.mp-ilab span { text-transform: none; letter-spacing: 0; }
.mp-ref { display: block; text-decoration: none; color: inherit; border: 1px solid var(--border, #2c3854); border-radius: 8px; padding: 7px 10px; margin-bottom: 5px; cursor: pointer; }
.mp-ref:hover, .mp-ref:focus-visible { border-color: var(--accent, #4fd0e0); outline: none; }
.mp-refmono { display: block; font-family: var(--mono, monospace); font-size: 11px; color: var(--text, #e8edf7); word-break: break-all; }
.mp-refmono b { color: var(--accent, #4fd0e0); font-weight: 600; }
.mp-reflab { display: block; font-size: 11px; color: var(--muted, #8b96b0); margin-top: 2px; }
.mp-refrow { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 5px; }
.mp-refgraph { font-size: 10.5px; font-weight: 650; color: var(--accent, #4fd0e0); }
.mp-refsrc { font-size: 10.5px; color: var(--muted, #8b96b0); text-decoration: none; }
.mp-refsrc:hover { color: var(--text, #e8edf7); text-decoration: underline; }
.mp-ask { margin-top: 10px; width: 100%; border: none; border-radius: 9px; padding: 9px; font: inherit; font-weight: 650; font-size: 12.5px; cursor: pointer; background: var(--accent, #4fd0e0); color: #0a0e18; }
.mp-ask:disabled { opacity: .6; cursor: wait; }
.mp-asknote { font-size: 11.5px; color: var(--muted, #8b96b0); margin: 9px 0 0; }
.mp-askq { margin: 0 0 6px; }
.mp-askans { color: var(--text, #e8edf7); line-height: 1.5; white-space: pre-wrap; margin: 0 0 6px; }
.mp-askans.muted { color: var(--muted, #8b96b0); }
.mp-askcites { margin: 0; padding-left: 16px; font-family: var(--mono, monospace); font-size: 10.5px; color: var(--muted, #8b96b0); }
.mp-askerr { font-size: 11.5px; color: #e0a05a; margin: 9px 0 0; }
.mp-askerr code { font-family: var(--mono, monospace); }
.mp-mh { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--faint, #586179); margin: 22px 0 10px; }
.mp-mx { width: 100%; border-collapse: collapse; font-size: 12px; }
.mp-mx th, .mp-mx td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border, #2c3854); }
.mp-mx th { color: var(--faint, #586179); font-size: 10.5px; text-transform: uppercase; letter-spacing: .4px; }
.mp-mx .us { color: var(--accent, #4fd0e0); }
.mp-mx td.us { font-weight: 600; }
.mp-dim { color: var(--text, #e8edf7); }
.mp-mx tr.lead td.us { color: #43c68a; }
</style>
