<template>
  <section class="ci-page" aria-labelledby="ci-title">
    <header class="ci-hero">
      <div>
        <p class="ci-kicker">Professional Intelligence OS &middot; Competitive Intelligence</p>
        <h1 id="ci-title">{{ state.headline }}</h1>
        <p class="ci-lede">{{ state.lede }}</p>
        <p class="ci-generated">Digest generated: {{ state.generatedAt }}</p>
      </div>
      <div class="ci-scorecard" aria-label="Specimens catalogued">
        <span class="ci-score">{{ state.apps.length }}</span>
        <span class="ci-score-label">specimens ranked</span>
      </div>
    </header>

    <BoundaryNotice
      label="fixture &middot; research digest"
      tone="muted"
      :message="state.sourcing"
      aria-label="Competitive intelligence boundary"
    />

    <section class="ci-card ci-thesis" aria-label="Thesis">
      <h2>The thesis</h2>
      <p>{{ state.thesis }}</p>
    </section>

    <section aria-label="The machine">
      <div class="ci-section-head">
        <div>
          <h2>The machine — six steps around one trick</h2>
          <p>Every specimen runs this loop. The trick is commodity; the loop is the moat.</p>
        </div>
      </div>
      <div class="ci-grid ci-grid--steps">
        <article v-for="step in state.machine" :key="step.index" class="ci-card ci-step">
          <span class="ci-step-n">{{ String(step.index).padStart(2, '0') }}</span>
          <h3>{{ step.name }}</h3>
          <p>{{ step.detail }}</p>
          <p class="ci-step-ex"><b>seen in</b> {{ step.exemplars }}</p>
        </article>
      </div>
    </section>

    <section class="ci-card" aria-label="Ranking">
      <div class="ci-section-head">
        <div>
          <h2>The ranking</h2>
          <p>{{ state.rankingBasis }}</p>
        </div>
        <ModeBadge :label="`${filteredApps.length} shown`" tone="default" />
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
      </div>

      <div class="ci-table-wrap">
        <table class="ci-table">
          <thead>
            <tr>
              <th>#</th>
              <th>App</th>
              <th>Category</th>
              <th>Machine score</th>
              <th>Read</th>
              <th>Headline metric</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in filteredApps" :key="app.name" :class="{ 'ci-row--counter': app.counterExample }">
              <td class="ci-rank">{{ app.rank }}</td>
              <td class="ci-appname">{{ app.name }}</td>
              <td>
                <span :class="`ci-cat ci-cat--${app.category}`">{{ app.categoryLabel }}</span>
              </td>
              <td class="ci-scorecell">
                <div class="ci-scorebar" aria-hidden="true">
                  <span :style="{ width: `${app.score}%` }" :class="scoreClass(app.score)" />
                </div>
                <b>{{ app.score }}</b>
              </td>
              <td class="ci-verdict">{{ app.verdict }}</td>
              <td class="ci-metric">{{ app.metric }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section aria-label="Teardowns">
      <div class="ci-section-head">
        <div>
          <h2>Teardowns</h2>
          <p>The one trick, the surfaces, the paywall, the loop, and the single lesson worth fielding — filtered with the ranking above.</p>
        </div>
      </div>
      <div class="ci-grid ci-grid--apps">
        <article
          v-for="app in filteredApps"
          :key="`card-${app.name}`"
          class="ci-card ci-app"
          :class="{ 'ci-app--counter': app.counterExample }"
        >
          <div class="ci-app-top">
            <h3>{{ app.rank }}. {{ app.name }}</h3>
            <span :class="`ci-cat ci-cat--${app.category}`">{{ app.categoryLabel }}</span>
          </div>
          <p class="ci-trick">{{ app.trick }}</p>
          <dl class="ci-dl">
            <dt>Surfaces</dt>
            <dd>{{ app.surfaces }}</dd>
            <dt>Paywall</dt>
            <dd>{{ app.paywall }}</dd>
            <dt>Loop</dt>
            <dd>{{ app.growthLoop }}</dd>
          </dl>
          <p class="ci-steal">
            <b>{{ app.counterExample ? 'Why it is here' : 'Steal this' }}</b>{{ app.steal }}
          </p>
        </article>
      </div>
    </section>

    <section class="ci-card" aria-label="Surfaces">
      <div class="ci-section-head">
        <div>
          <h2>Surface = job</h2>
          <p>Pick the surface from when the job occurs — whoever holds it owns the muscle memory.</p>
        </div>
      </div>
      <div class="ci-table-wrap">
        <table class="ci-table">
          <thead>
            <tr>
              <th>Surface</th>
              <th>The job it serves</th>
              <th>Exemplars</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in state.surfaces" :key="row.surface">
              <td class="ci-appname">{{ row.surface }}</td>
              <td>{{ row.job }}</td>
              <td class="ci-metric">{{ row.exemplars }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section aria-label="The numbers">
      <div class="ci-section-head">
        <div>
          <h2>What the paywall data says</h2>
          <p>The reliable anchors — RevenueCat aggregate data and the FTC dark-patterns reports.</p>
        </div>
      </div>
      <div class="ci-grid ci-grid--stats">
        <article v-for="stat in state.economics" :key="stat.label" class="ci-card ci-stat">
          <span class="ci-stat-value">{{ stat.value }}</span>
          <p>{{ stat.label }}</p>
          <span class="ci-stat-src">{{ stat.source }}</span>
        </article>
      </div>
    </section>

    <section aria-label="Map to estate">
      <div class="ci-section-head">
        <div>
          <h2>Map to our estate</h2>
          <p>Candidate placements — prompts, not commitments. Each maps a mechanic onto a named surface in the portfolio.</p>
        </div>
      </div>
      <div class="ci-grid ci-grid--two">
        <article v-for="mapping in state.estateMappings" :key="mapping.target" class="ci-card ci-map">
          <span class="ci-map-from">{{ mapping.pattern }}</span>
          <h3>{{ mapping.target }}</h3>
          <p>{{ mapping.detail }}</p>
          <p class="ci-map-to"><b>Field:</b> {{ mapping.field }}</p>
        </article>
      </div>
    </section>

    <section aria-label="Build order">
      <div class="ci-section-head">
        <div>
          <h2>Build order</h2>
          <p>Sequence a single-feature surface like this — winners execute the whole machine, not just step one.</p>
        </div>
      </div>
      <div class="ci-grid ci-grid--two">
        <article v-for="phase in state.checklist" :key="phase.index" class="ci-card ci-phase">
          <div class="ci-phase-head">
            <span class="ci-phase-n">{{ phase.index }}</span>
            <h3>{{ phase.title }}</h3>
            <ModeBadge :label="phase.tag" tone="muted" />
          </div>
          <ul class="ci-list">
            <li v-for="item in phase.items" :key="item">{{ item }}</li>
          </ul>
        </article>
      </div>
    </section>

    <section class="ci-card" aria-label="Honest versus scam">
      <div class="ci-section-head">
        <div>
          <h2>Aggressive-but-fair vs. scammy</h2>
          <p>Each mechanic has an honest form and a deceptive one. Field the left column.</p>
        </div>
      </div>
      <div class="ci-table-wrap">
        <table class="ci-table">
          <thead>
            <tr>
              <th>Legitimately good UX</th>
              <th>FTC-named dark pattern</th>
            </tr>
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

<script setup lang="ts">
import { computed, ref } from 'vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import ModeBadge from '../components/ModeBadge.vue';
import { competitiveIntelligenceState as state, type IntelCategory } from '../features/competitive-intelligence/state';

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

function scoreClass(score: number): string {
  if (score >= 80) return 'ci-scorebar--high';
  if (score >= 60) return 'ci-scorebar--mid';
  return 'ci-scorebar--low';
}
</script>

<style scoped>
.ci-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--text, #f4f4f4);
}

.ci-hero,
.ci-card {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  background: rgba(20, 24, 31, 0.82);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
}

.ci-hero {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.5rem;
}

.ci-kicker {
  margin: 0 0 0.4rem;
  color: var(--accent, #78a9ff);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0.7rem;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.02;
}

h2 {
  margin-bottom: 0.85rem;
  font-size: 1.15rem;
}

h3 {
  font-size: 1.02rem;
  margin-bottom: 0.5rem;
}

.ci-lede,
.ci-generated {
  max-width: 900px;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.55;
}

.ci-generated {
  margin: 0.7rem 0 0;
  font-size: 0.82rem;
}

.ci-scorecard {
  min-width: 180px;
  align-self: stretch;
  display: grid;
  place-content: center;
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(120, 169, 255, 0.22), rgba(213, 30, 115, 0.18));
  text-align: center;
}

.ci-score {
  display: block;
  font-size: 3.2rem;
  font-weight: 800;
  line-height: 1;
}

.ci-score-label {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ci-card {
  padding: 1rem;
}

.ci-thesis p {
  max-width: 900px;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.6;
  font-size: 1.02rem;
}

.ci-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.ci-section-head p {
  color: rgba(255, 255, 255, 0.68);
  margin: 0.25rem 0 0;
  max-width: 820px;
}

.ci-grid {
  display: grid;
  gap: 1rem;
}

.ci-grid--steps {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.ci-grid--apps {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.ci-grid--two {
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
}

.ci-grid--stats {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.ci-step-n {
  font-family: 'SFMono-Regular', ui-monospace, monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent, #78a9ff);
}

.ci-step p,
.ci-map p,
.ci-stat p,
.ci-phase li {
  color: rgba(255, 255, 255, 0.7);
}

.ci-step-ex {
  margin: 0.6rem 0 0;
  font-size: 0.82rem;
}

.ci-step-ex b {
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.72rem;
  margin-right: 0.35rem;
}

.ci-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.ci-chip {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.75);
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.ci-chip:hover {
  border-color: var(--accent, #78a9ff);
}

.ci-chip[aria-pressed='true'] {
  background: var(--accent, #78a9ff);
  border-color: var(--accent, #78a9ff);
  color: #0b0d12;
}

.ci-table-wrap {
  overflow-x: auto;
}

.ci-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

.ci-table th,
.ci-table td {
  padding: 0.7rem 0.55rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
  vertical-align: top;
}

.ci-table th {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ci-rank {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.55);
}

.ci-appname {
  font-weight: 700;
  white-space: nowrap;
}

.ci-scorecell {
  min-width: 120px;
}

.ci-scorecell b {
  font-variant-numeric: tabular-nums;
}

.ci-scorebar {
  height: 0.4rem;
  margin-bottom: 0.35rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.ci-scorebar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent, #78a9ff);
}

.ci-scorebar--high {
  background: #42be65;
}

.ci-scorebar--mid {
  background: #f1c21b;
}

.ci-scorebar--low {
  background: #fa768f;
}

.ci-verdict {
  color: rgba(255, 255, 255, 0.78);
  min-width: 260px;
}

.ci-metric {
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.86rem;
}

.ci-row--counter td {
  background: rgba(241, 194, 27, 0.06);
}

.ci-cat {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.14rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.75);
}

.ci-cat--voice {
  background: rgba(120, 169, 255, 0.16);
  color: #78a9ff;
}

.ci-cat--photo {
  background: rgba(213, 30, 115, 0.18);
  color: #ff77b0;
}

.ci-cat--productivity {
  background: rgba(36, 161, 72, 0.18);
  color: #42be65;
}

.ci-cat--money {
  background: rgba(241, 194, 27, 0.18);
  color: #f1c21b;
}

.ci-app {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ci-app--counter {
  border-color: rgba(241, 194, 27, 0.45);
  background: rgba(241, 194, 27, 0.06);
}

.ci-app-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
}

.ci-app-top h3 {
  margin: 0;
}

.ci-trick {
  margin: 0;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.45;
}

.ci-dl {
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.35rem 0.8rem;
  font-size: 0.86rem;
}

.ci-dl dt {
  font-weight: 700;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  padding-top: 0.1rem;
}

.ci-dl dd {
  margin: 0;
  color: rgba(255, 255, 255, 0.74);
  line-height: 1.4;
}

.ci-steal {
  margin: auto 0 0;
  border-radius: 12px;
  padding: 0.7rem 0.85rem;
  background: rgba(120, 169, 255, 0.1);
  font-size: 0.86rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.86);
}

.ci-app--counter .ci-steal {
  background: rgba(241, 194, 27, 0.1);
}

.ci-steal b {
  display: block;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent, #78a9ff);
  margin-bottom: 0.25rem;
}

.ci-app--counter .ci-steal b {
  color: #f1c21b;
}

.ci-stat-value {
  display: block;
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--accent, #78a9ff);
  line-height: 1;
  margin-bottom: 0.5rem;
}

.ci-stat p {
  margin: 0 0 0.5rem;
  font-size: 0.88rem;
  line-height: 1.45;
}

.ci-stat-src {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.45);
}

.ci-map-from {
  font-size: 0.76rem;
  font-weight: 600;
  color: #42be65;
}

.ci-map h3 {
  margin: 0.4rem 0 0.5rem;
}

.ci-map-to {
  margin: 0.75rem 0 0;
  padding-top: 0.65rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.16);
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.6);
}

.ci-map-to b {
  color: var(--accent, #78a9ff);
}

.ci-phase-head {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.6rem;
}

.ci-phase-head h3 {
  margin: 0;
  flex: 1;
}

.ci-phase-n {
  display: grid;
  place-content: center;
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 999px;
  background: rgba(120, 169, 255, 0.16);
  color: var(--accent, #78a9ff);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.ci-list {
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.9rem;
  line-height: 1.45;
}

.ci-good {
  color: #8fe0a6;
}

.ci-bad {
  color: #f3c66b;
}

.ci-rule {
  margin: 1rem 0 0;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
}

@media (max-width: 760px) {
  .ci-hero {
    flex-direction: column;
  }

  .ci-scorecard {
    min-height: 150px;
  }
}
</style>
