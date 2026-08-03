<!-- COMPETITIVE INTELLIGENCE · SUPERIORITY BOARDS
     A first-class cockpit surface for the intelligence-superiority comparison boards.
     Per category: rows = litmus features, columns = estate + competitors, cells =
     BEAT/MEET/PARTIAL/GAP with the estate's evidence link, maturity (live/spec) and
     assessment basis (self/certified). Renders ONLY from the benchmark board dataset
     (single source of truth) — live-first, with a bundled fixture fallback so it
     always renders. Scores are never hardcoded in this component. -->
<template>
  <section class="cib-page" aria-labelledby="cib-title">
    <SurfaceHeader
      eyebrow="Professional Intelligence · Competitive"
      title="Superiority Boards"
    >
      <template #badge>
        <ModeBadge
          :label="mode === 'live' ? 'live · benchmark' : 'fixture'"
          :tone="mode === 'live' ? 'success' : 'warning'"
        />
      </template>
    </SurfaceHeader>

    <p id="cib-title" class="cib-lede">
      Head-to-head comparison boards from the intelligence-superiority benchmark contract.
      Each category ranks the estate against competitors on litmus features —
      <b>BEAT / MEET / PARTIAL / GAP</b> — with the estate's evidence, maturity, and whether
      the rank is self-assessed or externally certified.
    </p>

    <RouteStatePanel
      :state="mode === 'live' ? 'ready' : 'mock'"
      :title="mode === 'live' ? 'Live benchmark board dataset' : 'Fixture board dataset'"
      :message="loadError
        ? `Live board producer unavailable (${loadError}); showing the bundled representative fixture. Ranks are self-assessed unless a cell is marked certified.`
        : 'Ranks are self-assessed unless a cell is marked certified; maturity distinguishes live (shipped) from spec (declared). Wire VITE_COMPETITIVE_BOARDS_BASE to the benchmark producer for the live dataset.'"
    />

    <!-- Overall scorecard -->
    <section class="cib-scorecard" aria-label="Overall scorecard">
      <article
        v-for="r in RANK_ORDER"
        :key="r"
        class="cib-score"
        :class="`rank-${r.toLowerCase()}`"
      >
        <span class="cib-score-n">{{ overall[r] }}</span>
        <span class="cib-score-l">{{ r }}</span>
      </article>
      <article class="cib-score cib-score--total">
        <span class="cib-score-n">{{ overallTotal }}</span>
        <span class="cib-score-l">ranked cells</span>
      </article>
      <article class="cib-score cib-score--cats">
        <span class="cib-score-n">{{ dataset.categories.length }}</span>
        <span class="cib-score-l">categories</span>
      </article>
    </section>

    <BoundaryNotice
      label="assessment basis"
      tone="warning"
      :message="dataset.disclaimer"
    />

    <!-- Per-category boards -->
    <div class="cib-boards">
      <BoardTable v-for="board in dataset.categories" :key="board.id" :board="board" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import ModeBadge from '../components/ModeBadge.vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import RouteStatePanel from '../components/RouteStatePanel.vue';
import BoardTable from '../features/competitive-intelligence/boards/BoardTable.vue';
import { RANK_ORDER, tallyDataset, tallyTotal } from '../features/competitive-intelligence/boards/tally';
import { COMPETITIVE_BOARDS_FIXTURE } from '../features/competitive-intelligence/boards/fixture';
import {
  fetchCompetitiveBoardsWithFallback,
  type BoardsMode,
  type CompetitiveBoardsDataset,
} from '../api/competitiveBoardsApi';

// Start from the bundled fixture so the surface paints immediately, then swap in the
// live dataset (or keep the fixture on fallback) once the async load resolves.
const dataset = ref<CompetitiveBoardsDataset>(COMPETITIVE_BOARDS_FIXTURE);
const mode = ref<BoardsMode>('fixture');
const loadError = ref<string | undefined>(undefined);

onMounted(async () => {
  const result = await fetchCompetitiveBoardsWithFallback();
  dataset.value = result.data;
  mode.value = result.mode;
  loadError.value = result.error;
});

const overall = computed(() => tallyDataset(dataset.value));
const overallTotal = computed(() => tallyTotal(overall.value));
</script>

<style scoped>
.cib-page { display: grid; gap: 1rem; padding: 1.25rem 1.5rem 3rem; max-width: 1400px; margin: 0 auto; }
.cib-lede { margin: 0; color: var(--text-2); font-size: var(--fs-base); line-height: 1.6; max-width: 62rem; }

.cib-scorecard { display: flex; gap: 0.65rem; flex-wrap: wrap; }
.cib-score { flex: 1 1 7rem; display: grid; gap: 0.15rem; padding: 0.7rem 0.9rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); }
.cib-score-n { font-size: 1.5rem; font-weight: 800; font-family: var(--mono, 'Roboto Mono', monospace); line-height: 1; }
.cib-score-l { font-size: var(--fs-eyebrow); text-transform: uppercase; letter-spacing: var(--ls-eyebrow); color: var(--text-3); }
.cib-score.rank-beat { border-color: rgba(75, 191, 115, 0.4); }
.cib-score.rank-beat .cib-score-n { color: #6ee7a0; }
.cib-score.rank-meet { border-color: rgba(88, 166, 255, 0.38); }
.cib-score.rank-meet .cib-score-n { color: #8cc0ff; }
.cib-score.rank-partial { border-color: rgba(227, 179, 65, 0.4); }
.cib-score.rank-partial .cib-score-n { color: #f0cf6e; }
.cib-score.rank-gap { border-color: rgba(240, 101, 106, 0.42); }
.cib-score.rank-gap .cib-score-n { color: #ff9ba0; }
.cib-score--total .cib-score-n, .cib-score--cats .cib-score-n { color: var(--accent); }

.cib-boards { display: grid; gap: 1rem; }

@media (prefers-color-scheme: light) {
  .cib-score.rank-beat .cib-score-n { color: #1a7f43; }
  .cib-score.rank-meet .cib-score-n { color: #1a5fb4; }
  .cib-score.rank-partial .cib-score-n { color: #9a6b00; }
  .cib-score.rank-gap .cib-score-n { color: #b3261e; }
}
</style>
