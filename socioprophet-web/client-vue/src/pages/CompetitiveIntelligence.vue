<script setup lang="ts">
// Competitive Intelligence — the "One-Trick Playbook".
// Annealed to the epistemic-Carbon language: SurfaceHeader, shared dark tokens,
// hairline dense rows, 0.56rem uppercase labels, mono numerics, data-ink over chrome.
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import {
  competitiveIntelligenceState as state,
  type IntelCategory,
} from '../features/competitive-intelligence/state';
import { slugify } from '../features/competitive-intelligence/dossiers';

type CategoryFilter = IntelCategory | 'all';

const categoryOptions: Array<{ value: CategoryFilter; label: string }> = [
  { value: 'all', label: `All ${state.apps.length}` },
  { value: 'voice', label: 'Voice & Reading' },
  { value: 'photo', label: 'AI Photo & Media' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'money', label: 'Money & Focus' },
];

const activeCategory = ref<CategoryFilter>('all');

const filteredApps = computed(() =>
  activeCategory.value === 'all'
    ? state.apps
    : state.apps.filter((app) => app.category === activeCategory.value),
);

function scoreTone(score: number): string {
  if (score >= 80) return 'is-high';
  if (score >= 60) return 'is-mid';
  return 'is-low';
}

function appLink(name: string): string {
  return `/professional-intelligence/competitive/${slugify(name)}`;
}
</script>

<template>
  <section class="ci" aria-labelledby="ci-title">
    <SurfaceHeader title="Competitive Intelligence" eyebrow="Professional Intelligence · one-trick playbook">
      <template #badge><span class="ci-badge">{{ state.apps.length }} ranked · fixture</span></template>
    </SurfaceHeader>

    <p id="ci-title" class="ci-lede">{{ state.lede }}</p>

    <BoundaryNotice
      label="fixture · research digest"
      tone="muted"
      :message="state.sourcing"
      aria-label="Competitive intelligence boundary"
    />

    <p class="ci-thesis"><span class="ci-thesis-mark">Thesis</span>{{ state.thesis }}</p>

    <!-- THE MACHINE -->
    <section class="ci-block" aria-label="The machine">
      <div class="ci-h">
        <h2>The machine — six steps around one trick</h2>
        <p>Every specimen runs this loop. The trick is commodity; the loop is the moat.</p>
      </div>
      <div class="ci-steps">
        <article v-for="step in state.machine" :key="step.index" class="ci-step">
          <span class="ci-step-n">{{ String(step.index).padStart(2, '0') }}</span>
          <div>
            <h3>{{ step.name }}</h3>
            <p>{{ step.detail }}</p>
            <p class="ci-seen"><span>seen in</span> {{ step.exemplars }}</p>
          </div>
        </article>
      </div>
    </section>

    <!-- RANKING -->
    <section class="ci-block" aria-label="Ranking">
      <div class="ci-h">
        <h2>The ranking</h2>
        <p>{{ state.rankingBasis }}</p>
      </div>

      <div class="ci-filters" role="group" aria-label="Filter by category">
        <button
          v-for="option in categoryOptions"
          :key="option.value"
          type="button"
          class="ci-chip"
          :aria-pressed="activeCategory === option.value"
          @click="activeCategory = option.value"
        >
          {{ option.label }}
        </button>
        <span class="ci-count">{{ filteredApps.length }} shown</span>
      </div>

      <div class="ci-tablewrap">
        <table class="ci-table ci-rank-table">
          <thead>
            <tr>
              <th class="ci-num">#</th>
              <th>App</th>
              <th>Category</th>
              <th class="ci-num">Score</th>
              <th>Machine completeness</th>
              <th>Read</th>
              <th>Headline metric</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in filteredApps" :key="app.name" :class="{ 'is-counter': app.counterExample }">
              <td class="ci-num ci-rank">{{ app.rank }}</td>
              <td class="ci-app"><RouterLink class="ci-applink" :to="appLink(app.name)">{{ app.name }}</RouterLink></td>
              <td><span :class="`ci-cat ci-cat--${app.category}`">{{ app.categoryLabel }}</span></td>
              <td class="ci-num ci-scoreval">{{ app.score }}</td>
              <td class="ci-scorecell">
                <span class="ci-scorebar" aria-hidden="true">
                  <span :class="scoreTone(app.score)" :style="{ width: `${app.score}%` }" />
                </span>
              </td>
              <td class="ci-verdict">{{ app.verdict }}</td>
              <td class="ci-metric">{{ app.metric }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TEARDOWNS -->
    <section class="ci-block" aria-label="Teardowns">
      <div class="ci-h">
        <h2>Teardowns</h2>
        <p>The one trick, the surfaces, the paywall, the loop, and the single lesson worth fielding — filtered with the ranking above.</p>
      </div>
      <div class="ci-cards">
        <article
          v-for="app in filteredApps"
          :key="`card-${app.name}`"
          class="ci-cardpane"
          :class="{ 'is-counter': app.counterExample }"
        >
          <div class="ci-cardtop">
            <h3>
              <span class="ci-cardrank">{{ app.rank }}</span>
              <RouterLink class="ci-applink" :to="appLink(app.name)">{{ app.name }}</RouterLink>
            </h3>
            <span :class="`ci-cat ci-cat--${app.category}`">{{ app.categoryLabel }}</span>
          </div>
          <p class="ci-trick">{{ app.trick }}</p>
          <dl class="ci-dl">
            <dt>Surfaces</dt><dd>{{ app.surfaces }}</dd>
            <dt>Paywall</dt><dd>{{ app.paywall }}</dd>
            <dt>Loop</dt><dd>{{ app.growthLoop }}</dd>
          </dl>
          <p class="ci-steal">
            <span class="ci-steal-k">{{ app.counterExample ? 'Why it is here' : 'Steal this' }}</span>{{ app.steal }}
          </p>
          <RouterLink class="ci-dossier" :to="appLink(app.name)">Dossier — features &amp; how we beat them →</RouterLink>
        </article>
      </div>
    </section>

    <!-- SURFACE = JOB -->
    <section class="ci-block" aria-label="Surfaces">
      <div class="ci-h">
        <h2>Surface = job</h2>
        <p>Pick the surface from when the job occurs — whoever holds it owns the muscle memory.</p>
      </div>
      <div class="ci-tablewrap">
        <table class="ci-table">
          <thead>
            <tr><th>Surface</th><th>The job it serves</th><th>Exemplars</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in state.surfaces" :key="row.surface">
              <td class="ci-app">{{ row.surface }}</td>
              <td>{{ row.job }}</td>
              <td class="ci-metric">{{ row.exemplars }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- THE NUMBERS -->
    <section class="ci-block" aria-label="The numbers">
      <div class="ci-h">
        <h2>What the paywall data says</h2>
        <p>The reliable anchors — RevenueCat aggregate data and the FTC dark-patterns reports.</p>
      </div>
      <div class="ci-stats">
        <article v-for="stat in state.economics" :key="stat.label" class="ci-stat">
          <span class="ci-stat-v">{{ stat.value }}</span>
          <p>{{ stat.label }}</p>
          <span class="ci-stat-src">{{ stat.source }}</span>
        </article>
      </div>
    </section>

    <!-- ESTATE -->
    <section class="ci-block" aria-label="Map to estate">
      <div class="ci-h">
        <h2>Map to our estate</h2>
        <p>Candidate placements — prompts, not commitments. Each maps a mechanic onto a named surface in the portfolio.</p>
      </div>
      <div class="ci-maps">
        <article v-for="mapping in state.estateMappings" :key="mapping.target" class="ci-map">
          <span class="ci-map-from">{{ mapping.pattern }}</span>
          <h3>{{ mapping.target }}</h3>
          <p>{{ mapping.detail }}</p>
          <p class="ci-map-to"><span>Field</span>{{ mapping.field }}</p>
        </article>
      </div>
    </section>

    <!-- BUILD ORDER -->
    <section class="ci-block" aria-label="Build order">
      <div class="ci-h">
        <h2>Build order</h2>
        <p>Sequence a single-feature surface like this — winners execute the whole machine, not just step one.</p>
      </div>
      <div class="ci-maps">
        <article v-for="phase in state.checklist" :key="phase.index" class="ci-phase">
          <div class="ci-phase-h">
            <span class="ci-phase-n">{{ phase.index }}</span>
            <h3>{{ phase.title }}</h3>
            <span class="ci-phase-tag">{{ phase.tag }}</span>
          </div>
          <ul class="ci-list">
            <li v-for="item in phase.items" :key="item">{{ item }}</li>
          </ul>
        </article>
      </div>
    </section>

    <!-- HONEST vs SCAM -->
    <section class="ci-block" aria-label="Honest versus scam">
      <div class="ci-h">
        <h2>Aggressive-but-fair vs. scammy</h2>
        <p>Each mechanic has an honest form and a deceptive one. Field the left column.</p>
      </div>
      <div class="ci-tablewrap">
        <table class="ci-table ci-pattern-table">
          <thead>
            <tr><th>Legitimately good UX</th><th>FTC-named dark pattern</th></tr>
          </thead>
          <tbody>
            <tr v-for="(line, i) in state.patterns" :key="i">
              <td class="ci-good">{{ line.good }}</td>
              <td class="ci-bad">{{ line.bad }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="ci-rule">{{ state.patternRule }}</p>
    </section>
  </section>
</template>

<style scoped>
/* Epistemic-Carbon conformance: near-black bg, hairline surfaces, dense rows,
   0.56–0.62rem uppercase labels, mono numerics, muted-gold accent, data-ink over chrome. */
.ci {
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

.ci-badge {
  font-size: 0.56rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: var(--amber);
  background: var(--amber-soft);
  border-radius: 4px;
  padding: 0.05rem 0.32rem;
}

.ci-lede {
  margin: 0;
  max-width: 92ch;
  font-size: var(--fs-base);
  line-height: 1.55;
  color: var(--text-2);
}

.ci-thesis {
  margin: 0;
  max-width: 92ch;
  font-size: var(--fs-md);
  line-height: 1.55;
  color: var(--text);
  border-left: 2px solid var(--accent);
  padding-left: 0.85rem;
}

.ci-thesis-mark {
  display: block;
  font-size: 0.56rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 0.2rem;
}

h2 {
  margin: 0;
  font-size: var(--fs-lg);
  font-weight: 640;
  letter-spacing: -0.01em;
}

h3 {
  margin: 0;
  font-size: var(--fs-base);
  font-weight: 640;
}

.ci-block {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.ci-h {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  border-top: 1px solid var(--line);
  padding-top: 0.9rem;
}

.ci-h p {
  margin: 0;
  font-size: var(--fs-sm);
  color: var(--text-3);
  max-width: 92ch;
  line-height: 1.5;
}

/* machine steps */
.ci-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.ci-step {
  display: flex;
  gap: 0.65rem;
  padding: 0.8rem 0.9rem;
  background: var(--surface);
}

.ci-step-n {
  font-family: var(--mono, ui-monospace), monospace;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent);
  padding-top: 0.15rem;
}

.ci-step p {
  margin: 0.3rem 0 0;
  font-size: var(--fs-sm);
  color: var(--text-3);
  line-height: 1.45;
}

.ci-seen {
  font-size: var(--fs-xs);
  color: var(--text-3);
}

.ci-seen span {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.56rem;
  font-weight: 700;
  color: var(--text-3);
  margin-right: 0.35rem;
}

/* filters */
.ci-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.ci-chip {
  border: 1px solid var(--line-2);
  background: transparent;
  color: var(--text-2);
  border-radius: 999px;
  padding: 0.28rem 0.7rem;
  font-size: var(--fs-xs);
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.14s, background 0.14s, color 0.14s;
}

.ci-chip:hover { border-color: var(--accent); color: var(--text); }
.ci-chip:focus-visible { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.ci-chip[aria-pressed='true'] { background: var(--accent); border-color: var(--accent); color: #17130a; }

.ci-count {
  margin-left: auto;
  font-size: 0.56rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}

/* tables */
.ci-tablewrap {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
}

.ci-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
  font-size: var(--fs-sm);
}

.ci-table th,
.ci-table td {
  padding: 0.5rem 0.65rem;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}

.ci-table tbody tr:last-child td { border-bottom: none; }
.ci-table tbody tr:hover td { background: var(--surface-2); }

.ci-table th {
  font-size: 0.56rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 700;
  color: var(--text-3);
  position: sticky;
  top: 0;
  background: var(--surface-2);
}

.ci-num { text-align: right; font-variant-numeric: tabular-nums; }
.ci-rank-table th.ci-num, .ci-rank-table td.ci-num { width: 1%; white-space: nowrap; }
.ci-rank { color: var(--text-3); font-family: var(--mono, ui-monospace), monospace; }
.ci-app { font-weight: 640; white-space: nowrap; color: var(--text); }
.ci-applink { color: inherit; text-decoration: none; border-bottom: 1px solid transparent; }
.ci-applink:hover { color: var(--accent); border-bottom-color: var(--accent); }
.ci-applink:focus-visible { outline: none; color: var(--accent); }
.ci-scoreval { font-weight: 700; color: var(--text); }

.ci-scorecell { min-width: 130px; width: 130px; }
.ci-scorebar {
  display: block;
  height: 0.3rem;
  margin-top: 0.35rem;
  border-radius: 999px;
  background: var(--line-2);
  overflow: hidden;
}
.ci-scorebar span { display: block; height: 100%; border-radius: inherit; }
.ci-scorebar .is-high { background: var(--up); }
.ci-scorebar .is-mid { background: var(--amber); }
.ci-scorebar .is-low { background: var(--down); }

.ci-verdict { color: var(--text-2); min-width: 240px; line-height: 1.4; }
.ci-metric { color: var(--text-3); font-size: var(--fs-xs); line-height: 1.4; }

tr.is-counter td { background: var(--amber-soft); }
tr.is-counter:hover td { background: var(--amber-soft); }

/* category tags */
.ci-cat {
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  padding: 0.05rem 0.34rem;
  font-size: 0.56rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  color: var(--neutral);
  background: rgba(139, 148, 158, 0.12);
}
.ci-cat--voice { color: var(--info); background: var(--info-soft); }
.ci-cat--photo { color: var(--violet); background: rgba(168, 85, 247, 0.14); }
.ci-cat--productivity { color: var(--teal); background: rgba(45, 212, 191, 0.13); }
.ci-cat--money { color: var(--amber); background: var(--amber-soft); }

/* teardown cards */
.ci-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
  gap: 0.8rem;
}

.ci-cardpane {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: 0.85rem 0.9rem;
}
.ci-cardpane.is-counter { border-color: rgba(227, 179, 65, 0.4); background: var(--amber-soft); }

.ci-cardtop { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
.ci-cardtop h3 { display: flex; align-items: baseline; gap: 0.45rem; }
.ci-cardrank { font-family: var(--mono, ui-monospace), monospace; font-size: var(--fs-xs); color: var(--text-3); }

.ci-trick { margin: 0; font-size: var(--fs-sm); font-weight: 600; color: var(--text); line-height: 1.45; }

.ci-dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 0.3rem 0.7rem; font-size: var(--fs-xs); }
.ci-dl dt { font-size: 0.56rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-3); padding-top: 0.08rem; }
.ci-dl dd { margin: 0; color: var(--text-2); line-height: 1.4; }

.ci-steal {
  margin: auto 0 0;
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.7rem;
  background: var(--accent-soft);
  font-size: var(--fs-xs);
  line-height: 1.45;
  color: var(--text);
}
.ci-cardpane.is-counter .ci-steal { background: rgba(227, 179, 65, 0.12); }
.ci-steal-k { display: block; font-size: 0.54rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; color: var(--accent); margin-bottom: 0.22rem; }
.ci-cardpane.is-counter .ci-steal-k { color: var(--amber); }

.ci-dossier { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: var(--accent); text-decoration: none; }
.ci-dossier:hover { color: var(--accent-2); }
.ci-dossier:focus-visible { outline: none; text-decoration: underline; }

/* stats */
.ci-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.8rem; }
.ci-stat { border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); padding: 0.85rem 0.9rem; }
.ci-stat-v { display: block; font-size: 1.9rem; font-weight: 700; color: var(--accent); line-height: 1; font-variant-numeric: tabular-nums; margin-bottom: 0.45rem; }
.ci-stat p { margin: 0 0 0.45rem; font-size: var(--fs-xs); color: var(--text-2); line-height: 1.45; }
.ci-stat-src { font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-3); }

/* estate + phases */
.ci-maps { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 0.8rem; }
.ci-map, .ci-phase { border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); padding: 0.85rem 0.9rem; }
.ci-map-from { font-size: 0.6rem; font-weight: 600; color: var(--teal); }
.ci-map h3 { margin: 0.35rem 0 0.4rem; }
.ci-map p { margin: 0; font-size: var(--fs-xs); color: var(--text-3); line-height: 1.5; }
.ci-map-to { margin-top: 0.65rem !important; padding-top: 0.55rem; border-top: 1px solid var(--line); font-size: var(--fs-xs); color: var(--text-2) !important; }
.ci-map-to span { text-transform: uppercase; font-size: 0.54rem; letter-spacing: 0.07em; font-weight: 700; color: var(--accent); margin-right: 0.4rem; }

.ci-phase-h { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.55rem; }
.ci-phase-h h3 { flex: 1; }
.ci-phase-n { display: grid; place-content: center; width: 1.5rem; height: 1.5rem; border-radius: 999px; background: var(--accent-soft); color: var(--accent); font-weight: 700; font-size: var(--fs-xs); font-variant-numeric: tabular-nums; }
.ci-phase-tag { font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }
.ci-list { margin: 0; padding-left: 1rem; display: flex; flex-direction: column; gap: 0.35rem; font-size: var(--fs-xs); color: var(--text-2); line-height: 1.45; }

/* honest vs scam */
.ci-pattern-table td { width: 50%; }
.ci-good { color: #8fe0a6; }
.ci-bad { color: var(--amber); }
.ci-rule { margin: 0; font-size: var(--fs-sm); font-weight: 600; color: var(--text); line-height: 1.5; border-left: 2px solid var(--accent); padding-left: 0.85rem; }

@media (max-width: 720px) {
  .ci { padding: 0.85rem 0.9rem 2rem; }
}
</style>
