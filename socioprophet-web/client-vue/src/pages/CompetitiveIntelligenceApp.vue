<script setup lang="ts">
// Per-app dossier — drill-down from the Competitive Intelligence ranking.
// Route: /professional-intelligence/competitive/:id  (id = slugify(app.name)).
// Captured features (assessed), a per-step read of the six-part machine, and the
// attack vectors — how we beat them.
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import EmptyState from '../components/EmptyState.vue';
import { competitiveIntelligenceState as state } from '../features/competitive-intelligence/state';
import {
  dossiers,
  machineSteps,
  slugify,
  verdictLabel,
  type FeatureVerdict,
} from '../features/competitive-intelligence/dossiers';

const route = useRoute();
const slug = computed(() => String(route.params.id ?? ''));

const byRank = computed(() => [...state.apps].sort((a, b) => a.rank - b.rank));
const app = computed(() => state.apps.find((a) => slugify(a.name) === slug.value));
const dossier = computed(() => (app.value ? dossiers[slug.value] : undefined));

const position = computed(() => byRank.value.findIndex((a) => a.name === app.value?.name));
const prev = computed(() => (position.value > 0 ? byRank.value[position.value - 1] : undefined));
const next = computed(() =>
  position.value >= 0 && position.value < byRank.value.length - 1
    ? byRank.value[position.value + 1]
    : undefined,
);

function scoreTone(score: number): string {
  if (score >= 80) return 'is-high';
  if (score >= 60) return 'is-mid';
  return 'is-low';
}

// From our perspective: gap = our opening (good), moat = their threat, copyable = take it.
const verdictTone: Record<FeatureVerdict, string> = {
  moat: 'v-moat',
  copyable: 'v-copy',
  commodity: 'v-commodity',
  gap: 'v-gap',
};

function appLink(name: string): string {
  return `/professional-intelligence/competitive/${slugify(name)}`;
}
</script>

<template>
  <section class="da" aria-labelledby="da-title">
    <RouterLink class="da-back" to="/professional-intelligence/competitive">← Competitive Intelligence</RouterLink>

    <template v-if="app">
      <SurfaceHeader
        :title="app.name"
        :eyebrow="`Rank #${app.rank} · ${app.categoryLabel}${app.counterExample ? ' · counter-example' : ''}`"
      >
        <template #badge>
          <span class="da-badge">score {{ app.score }}</span>
          <span class="da-badge da-badge--fixture">fixture</span>
        </template>
      </SurfaceHeader>

      <p id="da-title" class="da-trick">{{ app.trick }}</p>
      <p class="da-verdict"><span>Read</span>{{ app.verdict }}</p>

      <!-- machine assessment -->
      <section class="da-block" aria-label="Machine assessment">
        <div class="da-h">
          <h2>How well it runs the machine</h2>
          <p>Per-step assessment of the six-part loop. Low bars are the openings.</p>
        </div>
        <div v-if="dossier" class="da-machine">
          <div v-for="(step, i) in machineSteps" :key="step" class="da-mstep">
            <div class="da-mlabel"><span>{{ String(i + 1).padStart(2, '0') }}</span>{{ step }}</div>
            <div class="da-mbarwrap">
              <span class="da-mbar" aria-hidden="true">
                <span :class="scoreTone(dossier.machineScores[i])" :style="{ width: `${dossier.machineScores[i]}%` }" />
              </span>
              <b class="da-mval">{{ dossier.machineScores[i] }}</b>
            </div>
          </div>
        </div>
      </section>

      <!-- captured features -->
      <section class="da-block" aria-label="Captured features">
        <div class="da-h">
          <h2>Captured features — assessed</h2>
          <p>
            <span class="da-key v-gap">gap / opening</span>
            <span class="da-key v-copy">copyable</span>
            <span class="da-key v-moat">their moat</span>
            <span class="da-key v-commodity">commodity</span>
          </p>
        </div>
        <div v-if="dossier" class="da-tablewrap">
          <table class="da-table">
            <thead>
              <tr><th>Feature</th><th>Assessment</th><th>Verdict</th></tr>
            </thead>
            <tbody>
              <tr v-for="feat in dossier.features" :key="feat.name">
                <td class="da-fname">{{ feat.name }}</td>
                <td class="da-fassess">{{ feat.assessment }}</td>
                <td><span class="da-vtag" :class="verdictTone[feat.verdict]">{{ verdictLabel[feat.verdict] }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- machine facts -->
      <section class="da-block" aria-label="Mechanics">
        <div class="da-facts">
          <div class="da-fact"><span class="da-fact-k">Surfaces</span><p>{{ app.surfaces }}</p></div>
          <div class="da-fact"><span class="da-fact-k">Paywall</span><p>{{ app.paywall }}</p></div>
          <div class="da-fact"><span class="da-fact-k">Growth loop</span><p>{{ app.growthLoop }}</p></div>
          <div class="da-fact"><span class="da-fact-k">Headline metric</span><p>{{ app.metric }}</p></div>
        </div>
      </section>

      <!-- beat them -->
      <section class="da-beat" aria-label="How we beat them">
        <div class="da-beat-h">
          <h2>How we beat them</h2>
          <span class="da-beat-tag">attack vectors</span>
        </div>
        <ol v-if="dossier" class="da-beat-list">
          <li v-for="(move, i) in dossier.beatThem" :key="i">
            <span class="da-beat-n">{{ String(i + 1).padStart(2, '0') }}</span>
            <span>{{ move }}</span>
          </li>
        </ol>
        <p class="da-steal"><span>Steal this</span>{{ app.steal }}</p>
      </section>

      <!-- prev / next -->
      <nav class="da-nav" aria-label="Ranking navigation">
        <RouterLink v-if="prev" class="da-navlink da-navlink--prev" :to="appLink(prev.name)">
          <span>← #{{ prev.rank }}</span><b>{{ prev.name }}</b>
        </RouterLink>
        <span v-else class="da-navspacer" />
        <RouterLink v-if="next" class="da-navlink da-navlink--next" :to="appLink(next.name)">
          <span>#{{ next.rank }} →</span><b>{{ next.name }}</b>
        </RouterLink>
      </nav>
    </template>

    <EmptyState
      v-else
      title="No such specimen"
      :hint="`'${slug}' is not in the catalog. Go back to the ranking.`"
      icon="◇"
    />
  </section>
</template>

<style scoped>
.da {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 1.25rem 2.5rem;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.da-back {
  align-self: flex-start;
  font-size: var(--fs-xs);
  color: var(--text-3);
  text-decoration: none;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
}
.da-back:hover { color: var(--text); border-color: var(--accent); }

.da-badge {
  font-size: 0.56rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 4px;
  padding: 0.05rem 0.32rem;
  font-variant-numeric: tabular-nums;
}
.da-badge--fixture { color: var(--amber); background: var(--amber-soft); }

.da-trick { margin: 0; max-width: 92ch; font-size: var(--fs-md); font-weight: 600; line-height: 1.5; color: var(--text); }
.da-verdict { margin: 0; max-width: 92ch; font-size: var(--fs-sm); color: var(--text-2); line-height: 1.5; }
.da-verdict span { text-transform: uppercase; font-size: 0.54rem; letter-spacing: 0.08em; font-weight: 700; color: var(--text-3); margin-right: 0.45rem; }

h2 { margin: 0; font-size: var(--fs-lg); font-weight: 640; letter-spacing: -0.01em; }

.da-block { display: flex; flex-direction: column; gap: 0.75rem; }
.da-h { display: flex; flex-direction: column; gap: 0.2rem; border-top: 1px solid var(--line); padding-top: 0.9rem; }
.da-h > p { margin: 0; font-size: var(--fs-sm); color: var(--text-3); display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }

/* machine bars */
.da-machine {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 0.5rem 1.5rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: 0.9rem 1rem;
}
.da-mstep { display: flex; flex-direction: column; gap: 0.3rem; }
.da-mlabel { font-size: var(--fs-xs); color: var(--text-2); display: flex; align-items: baseline; gap: 0.4rem; }
.da-mlabel span { font-family: var(--mono, ui-monospace), monospace; font-size: 0.56rem; color: var(--text-3); }
.da-mbarwrap { display: flex; align-items: center; gap: 0.55rem; }
.da-mbar { flex: 1; height: 0.35rem; border-radius: 999px; background: var(--line-2); overflow: hidden; }
.da-mbar span { display: block; height: 100%; border-radius: inherit; }
.da-mbar .is-high { background: var(--up); }
.da-mbar .is-mid { background: var(--amber); }
.da-mbar .is-low { background: var(--down); }
.da-mval { font-size: var(--fs-xs); font-variant-numeric: tabular-nums; color: var(--text-2); width: 1.6rem; text-align: right; }

/* feature table */
.da-tablewrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); }
.da-table { width: 100%; border-collapse: collapse; min-width: 640px; font-size: var(--fs-sm); }
.da-table th, .da-table td { padding: 0.5rem 0.7rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
.da-table tbody tr:last-child td { border-bottom: none; }
.da-table tbody tr:hover td { background: var(--surface-2); }
.da-table th { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; color: var(--text-3); background: var(--surface-2); }
.da-fname { font-weight: 640; white-space: nowrap; color: var(--text); }
.da-fassess { color: var(--text-2); line-height: 1.4; }

.da-vtag, .da-key {
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  padding: 0.05rem 0.36rem;
  font-size: 0.54rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.v-gap { color: var(--up); background: rgba(75, 191, 115, 0.14); }
.v-copy { color: var(--accent); background: var(--accent-soft); }
.v-moat { color: var(--down); background: rgba(240, 101, 106, 0.14); }
.v-commodity { color: var(--neutral); background: rgba(139, 148, 158, 0.14); }

/* facts */
.da-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: var(--radius-sm); overflow: hidden; }
.da-fact { background: var(--surface); padding: 0.7rem 0.85rem; }
.da-fact-k { font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; color: var(--text-3); }
.da-fact p { margin: 0.3rem 0 0; font-size: var(--fs-xs); color: var(--text-2); line-height: 1.45; }

/* beat them */
.da-beat { border: 1px solid var(--accent-soft); border-left: 2px solid var(--accent); border-radius: var(--radius-sm); background: var(--accent-soft); padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.da-beat-h { display: flex; align-items: baseline; gap: 0.6rem; }
.da-beat-tag { font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; color: var(--accent); }
.da-beat-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.55rem; }
.da-beat-list li { display: flex; gap: 0.6rem; font-size: var(--fs-sm); color: var(--text); line-height: 1.5; }
.da-beat-n { font-family: var(--mono, ui-monospace), monospace; font-size: var(--fs-xs); color: var(--accent); font-weight: 700; padding-top: 0.1rem; }
.da-steal { margin: 0; padding-top: 0.65rem; border-top: 1px solid var(--line-2); font-size: var(--fs-xs); color: var(--text-2); line-height: 1.45; }
.da-steal span { text-transform: uppercase; font-size: 0.54rem; letter-spacing: 0.07em; font-weight: 700; color: var(--accent); margin-right: 0.4rem; }

/* prev/next */
.da-nav { display: flex; justify-content: space-between; gap: 0.8rem; border-top: 1px solid var(--line); padding-top: 0.9rem; }
.da-navspacer { flex: 1; }
.da-navlink { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; text-decoration: none; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); padding: 0.6rem 0.8rem; }
.da-navlink:hover { border-color: var(--accent); background: var(--surface-2); }
.da-navlink--next { text-align: right; align-items: flex-end; }
.da-navlink span { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); font-variant-numeric: tabular-nums; }
.da-navlink b { font-size: var(--fs-sm); color: var(--text); }

@media (max-width: 720px) { .da { padding: 0.85rem 0.9rem 2rem; } }
</style>
