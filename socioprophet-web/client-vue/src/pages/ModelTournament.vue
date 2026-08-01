<template>
  <section class="mt-page" aria-labelledby="mt-title">
    <header class="mt-hero">
      <div>
        <p class="mt-kicker">Model Tournament · iSOTA · {{ mode }}</p>
        <h1 id="mt-title">Model Tournament → iSOTA</h1>
        <p class="mt-lede">
          A provider-neutral operating picture for the model tournament: three corpora,
          a fail-closed governance gate, and a Sherlock-weighted leaderboard. Promotion
          into the internal SOTA set is decided by scores on OUR corpora — never by which
          provider ships the most eval tooling.
        </p>
      </div>
      <div class="mt-scorecard" aria-label="Tournament size">
        <span class="mt-score">{{ snapshot.models.length }}</span>
        <span class="mt-score-label">models · {{ evalItems }} eval items</span>
        <span class="mt-seed-chip" v-if="snapshot.illustrativeSeed" title="Scores are illustrative seed data, not measured results.">illustrative seed</span>
      </div>
    </header>

    <BoundaryNotice
      label="provider-neutral"
      tone="warning"
      message="Provider-neutral harness. 'Provider exposes eval tooling' ≠ 'provider wins our workload.' Promotion is decided only by scores on our corpora — Stage 2 (Sherlock) weighted heaviest."
    />

    <RouteStatePanel
      :state="mode === 'live' ? 'ready' : 'mock'"
      :title="mode === 'live' ? 'Live tournament' : 'Fixture tournament'"
      :message="loadError
        ? `Live seam unavailable (${loadError}); showing the fixture tournament. Scores are ILLUSTRATIVE SEED DATA — the harness mechanism, not a measured benchmark result.`
        : 'Scores are ILLUSTRATIVE SEED DATA — the harness mechanism, not a measured benchmark result. Wire VITE_ISOTA_API_BASE to a model-tournament producer for live scores.'"
    />

    <!-- Metric tiles -->
    <section class="mt-tiles" aria-label="Tournament metrics">
      <article class="mt-tile">
        <span class="mt-tile-n">{{ snapshot.models.length }}</span>
        <span class="mt-tile-l">Models</span>
      </article>
      <article class="mt-tile mt-tile--promoted">
        <span class="mt-tile-n">{{ promotedCount }}</span>
        <span class="mt-tile-l">Promoted → iSOTA</span>
      </article>
      <article class="mt-tile mt-tile--rejected">
        <span class="mt-tile-n">{{ rejectedCount }}</span>
        <span class="mt-tile-l">Rejected (Stage 0 gate)</span>
      </article>
      <article class="mt-tile">
        <span class="mt-tile-n">{{ evalItems }}</span>
        <span class="mt-tile-l">Eval items (A+B+C)</span>
      </article>
      <article class="mt-tile">
        <span class="mt-tile-n">{{ AXES.length }}</span>
        <span class="mt-tile-l">Axes</span>
      </article>
    </section>

    <!-- Corpora cards -->
    <section class="mt-corpora" aria-label="Corpora">
      <article
        v-for="corpus in snapshot.corpora"
        :key="corpus.id"
        :class="['mt-corpus', `mt-corpus--${corpus.weight}`]"
      >
        <header>
          <span class="mt-corpus-slot">{{ corpus.slot }}</span>
          <h2>{{ corpus.label }}</h2>
          <span class="mt-corpus-weight">{{ corpus.weight }}</span>
        </header>
        <p class="mt-corpus-desc">{{ corpus.description }}</p>
        <div class="mt-corpus-foot">
          <span class="mt-corpus-count">{{ corpus.itemCount }} items</span>
          <ul class="mt-tags">
            <li v-for="tag in corpus.tags" :key="tag"><code>{{ tag }}</code></li>
          </ul>
        </div>
      </article>
    </section>

    <!-- Stage 0→4 pipeline -->
    <section class="mt-pipeline" aria-label="Tournament pipeline">
      <div class="mt-pipeline-head">
        <h2>Stage 0 → 4 pipeline</h2>
        <button type="button" class="mt-run" :disabled="running" @click="runTournament">
          {{ running ? 'Running…' : 'Run tournament' }}
        </button>
      </div>
      <ol class="mt-stages">
        <li
          v-for="stage in snapshot.stages"
          :key="stage.index"
          :class="['mt-stage', { 'mt-stage--gate': stage.failClosed }]"
        >
          <div class="mt-stage-top">
            <span class="mt-stage-idx">Stage {{ stage.index }}</span>
            <span v-if="stage.failClosed" class="mt-stage-fc">fail-closed</span>
          </div>
          <strong class="mt-stage-label">{{ stage.label }}</strong>
          <span class="mt-stage-count">{{ animatedCounts[stage.index] }}</span>
          <span class="mt-stage-count-l">models reached</span>
          <p class="mt-stage-detail">{{ stage.detail }}</p>
        </li>
      </ol>
    </section>

    <!-- Leaderboard -->
    <section class="mt-board" aria-label="Model leaderboard">
      <h2>Leaderboard <span class="mt-count">Sherlock-weighted composite</span></h2>
      <div class="mt-table-wrap">
        <table class="mt-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Model</th>
              <th>Provider</th>
              <th v-for="axis in BAR_AXES" :key="axis" class="mt-th-axis">{{ axis }}</th>
              <th>Stage</th>
              <th>Composite</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in rankedModels" :key="row.name" :class="`mt-row--${row.verdict}`">
              <td class="mt-rank">{{ i + 1 }}</td>
              <td class="mt-model"><code>{{ row.name }}</code></td>
              <td>{{ row.provider }}</td>
              <td v-for="axis in BAR_AXES" :key="axis" class="mt-axis-cell">
                <span class="mt-bar" :title="`${axis}: ${row.scores[axis].toFixed(2)}`">
                  <span class="mt-bar-fill" :style="{ width: `${Math.round(row.scores[axis] * 100)}%` }"></span>
                </span>
              </td>
              <td class="mt-stage-cell">{{ row.stage }}</td>
              <td class="mt-composite"><code>{{ row.composite.toFixed(3) }}</code></td>
              <td>
                <span :class="['mt-pill', `mt-pill--${row.verdict}`]">{{ verdictLabel(row.verdict) }}</span>
                <p v-if="row.rejectedReason" class="mt-reject-reason">{{ row.rejectedReason }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-foot-note">
        Composite is a Sherlock-weighted blend across the {{ AXES.length }} axes
        ({{ AXES.join(', ') }}), with case-action (Sherlock) weighted heaviest. Scores are
        ILLUSTRATIVE SEED DATA, not measured results.
      </p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import RouteStatePanel from '../components/RouteStatePanel.vue';
import {
  AXES,
  compositeScore,
  demoTournamentSnapshot,
  fetchTournamentSnapshotWithFallback,
  reachedStage,
  type Axis,
  type TournamentMode,
  type TournamentSnapshot,
  type Verdict,
} from '../api/isotaApi';

// Axes surfaced as bars in the leaderboard (the full set of 10 drives the composite).
const BAR_AXES: Axis[] = ['groundedness', 'citation', 'case-action', 'tool-use', 'cost', 'latency'];

const snapshot = ref<TournamentSnapshot>(demoTournamentSnapshot());
const mode = ref<TournamentMode>('fixture');
const loadError = ref<string | undefined>(undefined);

onMounted(async () => {
  const result = await fetchTournamentSnapshotWithFallback();
  snapshot.value = result.snapshot;
  mode.value = result.mode;
  loadError.value = result.error;
  resetCounts();
});

const promotedCount = computed(() => snapshot.value.models.filter((m) => m.verdict === 'promoted').length);
const rejectedCount = computed(() => snapshot.value.models.filter((m) => m.verdict === 'rejected').length);
const evalItems = computed(() => snapshot.value.corpora.reduce((sum, c) => sum + c.itemCount, 0));

const rankedModels = computed(() =>
  snapshot.value.models
    .map((m) => ({ ...m, composite: compositeScore(m.scores) }))
    .sort((a, b) => b.composite - a.composite),
);

// Target funnel counts per stage (models that reached each stage).
const stageTargets = computed(() =>
  snapshot.value.stages.map((stage) => reachedStage(snapshot.value.models, stage.index)),
);

// Initialize from the current targets so the funnel shows real counts on first
// paint (not `undefined`) before any Run-tournament animation.
const animatedCounts = ref<number[]>([...stageTargets.value]);
const running = ref(false);

function resetCounts() {
  animatedCounts.value = stageTargets.value.map(() => 0);
}

// "Run tournament" animates each stage count up to its target funnel value over a
// FIXED number of ticks, so the animation duration stays bounded (~1s) regardless
// of how many models the tournament holds.
const FUNNEL_TICKS = 24;
function runTournament() {
  if (running.value) return;
  running.value = true;
  resetCounts();
  const targets = stageTargets.value;
  let step = 0;
  const timer = setInterval(() => {
    step += 1;
    const fraction = step / FUNNEL_TICKS;
    animatedCounts.value = targets.map((t) => Math.min(t, Math.round(t * fraction)));
    if (step >= FUNNEL_TICKS) {
      clearInterval(timer);
      animatedCounts.value = [...targets];
      running.value = false;
    }
  }, 40);
}

function verdictLabel(v: Verdict): string {
  if (v === 'promoted') return 'promoted';
  if (v === 'rejected') return 'rejected';
  return 'in-tournament';
}
</script>

<style scoped>
.mt-page { display: flex; flex-direction: column; gap: 1.25rem; padding: 1.5rem; max-width: 1180px; margin: 0 auto; }
.mt-hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; }
.mt-kicker { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem; opacity: 0.7; margin: 0; font-family: ui-monospace, monospace; }
.mt-hero h1 { margin: 0.25rem 0; font-size: 1.6rem; }
.mt-lede { margin: 0; max-width: 66ch; opacity: 0.85; line-height: 1.5; }
.mt-scorecard { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
.mt-score { display: block; font-size: 2rem; font-weight: 700; }
.mt-score-label { font-size: 0.75rem; opacity: 0.7; }
.mt-seed-chip { font-size: 0.7rem; font-family: ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(241, 194, 27, 0.55); color: #f1c21b; background: rgba(241, 194, 27, 0.12); border-radius: 999px; padding: 0.1rem 0.55rem; }

.mt-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; }
.mt-tile { border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 12px; padding: 0.85rem 1rem; background: rgba(20, 24, 31, 0.5); display: flex; flex-direction: column; gap: 0.2rem; }
.mt-tile-n { font-size: 1.7rem; font-weight: 700; font-family: ui-monospace, monospace; }
.mt-tile-l { font-size: 0.72rem; opacity: 0.7; }
.mt-tile--promoted { border-color: rgba(36, 161, 72, 0.4); }
.mt-tile--rejected { border-color: rgba(250, 77, 86, 0.4); }

.mt-corpora { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.mt-corpus { border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem; background: rgba(20, 24, 31, 0.5); }
.mt-corpus--heavy { border-color: rgba(45, 122, 246, 0.5); box-shadow: 0 0 0 1px rgba(45, 122, 246, 0.12) inset; }
.mt-corpus header { display: flex; align-items: center; gap: 0.5rem; }
.mt-corpus header h2 { margin: 0; font-size: 1rem; flex: 1; }
.mt-corpus-slot { font-family: ui-monospace, monospace; font-weight: 700; font-size: 0.9rem; width: 1.6rem; height: 1.6rem; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; background: rgba(148, 163, 184, 0.2); }
.mt-corpus-weight { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.75; border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 999px; padding: 0.1rem 0.5rem; }
.mt-corpus--heavy .mt-corpus-weight { color: #6ea8fe; border-color: rgba(45, 122, 246, 0.5); }
.mt-corpus-desc { margin: 0; font-size: 0.85rem; opacity: 0.85; line-height: 1.45; }
.mt-corpus-foot { display: flex; flex-direction: column; gap: 0.4rem; margin-top: auto; }
.mt-corpus-count { font-family: ui-monospace, monospace; font-weight: 600; font-size: 0.8rem; }
.mt-tags { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.35rem; }
.mt-tags code { font-size: 0.68rem; background: rgba(148, 163, 184, 0.18); border-radius: 6px; padding: 0.08rem 0.4rem; }

.mt-pipeline { border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 12px; padding: 1rem; }
.mt-pipeline-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; }
.mt-pipeline-head h2 { margin: 0; font-size: 1rem; }
.mt-run { font-family: inherit; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: 1px solid rgba(45, 122, 246, 0.6); background: rgba(45, 122, 246, 0.15); color: #6ea8fe; border-radius: 8px; padding: 0.4rem 0.9rem; }
.mt-run:disabled { opacity: 0.6; cursor: progress; }
.mt-stages { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
.mt-stage { border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 10px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.3rem; background: rgba(20, 24, 31, 0.5); }
.mt-stage--gate { border-color: rgba(250, 77, 86, 0.4); }
.mt-stage-top { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; }
.mt-stage-idx { font-family: ui-monospace, monospace; font-size: 0.7rem; opacity: 0.7; }
.mt-stage-fc { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.05em; color: #fa4d56; border: 1px solid rgba(250, 77, 86, 0.45); border-radius: 999px; padding: 0.05rem 0.4rem; }
.mt-stage-label { font-size: 0.9rem; }
.mt-stage-count { font-size: 1.8rem; font-weight: 700; font-family: ui-monospace, monospace; line-height: 1; }
.mt-stage-count-l { font-size: 0.68rem; opacity: 0.65; }
.mt-stage-detail { margin: 0.15rem 0 0; font-size: 0.72rem; opacity: 0.72; line-height: 1.4; }

.mt-board { border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 12px; padding: 1rem; }
.mt-board h2 { margin: 0 0 0.75rem; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; }
.mt-count { font-size: 0.7rem; background: rgba(148, 163, 184, 0.2); border-radius: 999px; padding: 0.1rem 0.5rem; font-weight: 400; }
.mt-table-wrap { overflow-x: auto; }
.mt-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.mt-table th, .mt-table td { text-align: left; padding: 0.45rem 0.5rem; border-bottom: 1px solid rgba(148, 163, 184, 0.15); vertical-align: top; }
.mt-table th { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.03em; opacity: 0.7; font-weight: 600; }
.mt-th-axis { white-space: nowrap; }
.mt-rank { font-family: ui-monospace, monospace; opacity: 0.7; }
.mt-model code, .mt-composite code { font-family: ui-monospace, monospace; }
.mt-axis-cell { min-width: 54px; }
.mt-bar { display: block; height: 8px; width: 100%; background: rgba(148, 163, 184, 0.2); border-radius: 999px; overflow: hidden; }
.mt-bar-fill { display: block; height: 100%; background: linear-gradient(90deg, #2d7af6, #6ea8fe); border-radius: 999px; }
.mt-stage-cell { font-family: ui-monospace, monospace; text-align: center; }
.mt-pill { font-size: 0.68rem; font-weight: 600; border-radius: 999px; padding: 0.12rem 0.55rem; white-space: nowrap; }
.mt-pill--promoted { color: #24a148; background: rgba(36, 161, 72, 0.14); border: 1px solid rgba(36, 161, 72, 0.4); }
.mt-pill--rejected { color: #fa4d56; background: rgba(250, 77, 86, 0.14); border: 1px solid rgba(250, 77, 86, 0.4); }
.mt-pill--in-tournament { color: #f1c21b; background: rgba(241, 194, 27, 0.12); border: 1px solid rgba(241, 194, 27, 0.4); }
.mt-reject-reason { margin: 0.3rem 0 0; font-size: 0.68rem; opacity: 0.7; max-width: 26ch; line-height: 1.35; }
.mt-row--rejected { opacity: 0.78; }
.mt-foot-note { margin: 0.85rem 0 0; font-size: 0.72rem; opacity: 0.7; line-height: 1.45; }
</style>
