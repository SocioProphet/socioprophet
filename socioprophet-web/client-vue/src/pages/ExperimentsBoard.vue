<template>
  <section class="xp" aria-label="Experiments and simulations">
    <header class="xp-toolbar">
      <div class="xp-title">
        <div>
          <p v-if="scope && !scope.isPrimary" class="xp-eyebrow">{{ scope.domain }}</p>
          <h1>{{ scope && !scope.isPrimary ? scope.label : 'Experiments' }}</h1>
        </div>
        <span class="xp-pill">fixture</span>
      </div>
      <div class="xp-filters">
        <button v-for="k in kinds" :key="k" class="xp-fbtn" :class="{ on: kind === k }" @click="kind = k">{{ k }}</button>
      </div>
    </header>

    <div class="xp-body">
      <!-- Experiment list -->
      <div ref="listEl" class="xp-list" aria-label="Experiments" @keydown="arrowRove($event, listEl, '.xp-row')">
        <p class="xp-count">{{ results.length }} experiment{{ results.length === 1 ? '' : 's' }}</p>
        <button v-for="x in results" :key="x.id" class="xp-row" :class="{ on: x.id === selectedId }" @click="selectedId = x.id">
          <div class="xp-row-top">
            <span class="xp-kind" :class="x.kind">{{ x.kind }}</span>
            <span class="xp-status" :class="x.status">{{ x.status }}</span>
          </div>
          <div class="xp-row-name">{{ x.name }}</div>
          <div class="xp-row-foot">
            <span class="xp-up" :class="upliftClass(x)">{{ signed(uplift(x)) }}{{ upliftUnit }}</span>
            <span class="xp-n">n={{ x.n.toLocaleString() }}</span>
          </div>
        </button>
      </div>

      <!-- Detail -->
      <article v-if="selected" class="xp-detail" aria-label="Experiment detail">
        <div class="xp-ribbon">
          <span class="xp-ribbon-k">run manifest</span>
          <span>seed {{ selected.seed }} · n={{ selected.n.toLocaleString() }} · {{ selected.subject }}</span>
          <span class="xp-ribbon-as">as of {{ asOfLabel }}</span>
        </div>

        <div class="xp-d-head">
          <div>
            <div class="xp-d-name">{{ selected.name }}</div>
            <div class="xp-d-sub">{{ selected.kind }} · {{ selected.metric }}</div>
          </div>
          <div class="xp-verdict" :class="selected.significant ? 'sig' : 'nsig'">{{ selected.significant ? 'significant' : 'n.s.' }}</div>
        </div>

        <!-- Arm comparison bars -->
        <div class="xp-arms">
          <div v-for="(a, i) in selected.arms" :key="i" class="xp-arm" :class="{ base: a.baseline, best: a.name === bestArm.name }">
            <div class="xp-arm-h"><span class="xp-arm-n">{{ a.name }}<span v-if="a.baseline" class="xp-tag">baseline</span><span v-else-if="a.name === bestArm.name" class="xp-tag win">winner</span></span><span class="xp-arm-s">{{ a.score.toFixed(1) }}</span></div>
            <div class="xp-bar"><div class="xp-bar-fill" :class="{ base: a.baseline, best: a.name === bestArm.name }" :style="{ width: barWidth(a.score) + '%' }" /></div>
          </div>
        </div>

        <!-- Uplift callout -->
        <div class="xp-uplift" :class="upliftClass(selected)">
          <div class="xp-uplift-v">{{ signed(uplift(selected)) }}{{ upliftUnit }}</div>
          <div class="xp-uplift-k">{{ bestArm.name }} vs {{ baselineArm.name }}<br /><small>{{ selected.metric }}</small></div>
        </div>

        <p class="xp-note">{{ selected.note }}</p>
        <div class="xp-boundary">Fixture board · no live runner or model. A live board runner emits the same arms + run manifest.</div>
      </article>
      <div v-else class="xp-detail empty">Select an experiment</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { experiments, asOf, type Experiment, type ExpKind, type Arm } from '../data/experimentsFixture';
import { navScopeForPath } from '../config/cockpitNav';
import { arrowRove } from '../utils/listKeys';

const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

const kinds = ['all', 'a-b', 'ablation', 'board', 'simulation'] as const;
const kind = ref<(typeof kinds)[number]>('all');
const selectedId = ref<string>(experiments[0]!.id);
const listEl = ref<HTMLElement | null>(null);

const results = computed<Experiment[]>(() =>
  kind.value === 'all' ? experiments : experiments.filter((x) => x.kind === (kind.value as ExpKind)),
);
const selected = computed<Experiment | undefined>(() => experiments.find((x) => x.id === selectedId.value));
watch(results, (r) => { if (!r.some((x) => x.id === selectedId.value) && r[0]) selectedId.value = r[0].id; });

// For a "lower is better" metric (leak rate) the winner is the minimum.
const lowerBetter = computed(() => /lower/i.test(selected.value?.metric ?? ''));
const baselineArm = computed<Arm>(() => selected.value?.arms.find((a) => a.baseline) ?? selected.value!.arms[0]!);
const bestArm = computed<Arm>(() => {
  const arms = selected.value?.arms ?? [];
  return arms.reduce((b, a) => (lowerBetter.value ? (a.score < b.score ? a : b) : (a.score > b.score ? a : b)), arms[0]!);
});
const upliftUnit = 'pp';
function uplift(x: Experiment): number {
  const base = x.arms.find((a) => a.baseline) ?? x.arms[0]!;
  const low = /lower/i.test(x.metric);
  const best = x.arms.reduce((b, a) => (low ? (a.score < b.score ? a : b) : (a.score > b.score ? a : b)), x.arms[0]!);
  const d = low ? base.score - best.score : best.score - base.score;
  return Math.round(d * 10) / 10;
}
function upliftClass(x: Experiment): string { return uplift(x) > 0 ? 'up' : uplift(x) < 0 ? 'down' : 'flat'; }
function barWidth(score: number): number {
  const arms = selected.value?.arms ?? [];
  const max = Math.max(...arms.map((a) => a.score), 1);
  return Math.max(3, (score / max) * 100);
}
function signed(n: number): string { return `${n >= 0 ? '+' : ''}${n}`; }
const asOfLabel = new Date(asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
</script>

<style scoped>
.xp { height: 100%; min-height: 0; display: grid; grid-template-rows: auto 1fr; gap: 0.75rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: var(--text); }
.xp-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.xp-title { display: flex; align-items: baseline; gap: 0.6rem; } .xp-title h1 { margin: 0; font-size: 1.2rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.xp-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.xp-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); background: var(--accent-soft); border-radius: 5px; padding: 0.1rem 0.35rem; }
.xp-filters { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.xp-fbtn { border: 1px solid var(--line-2); background: transparent; color: var(--text-2); border-radius: 8px; padding: 0.3rem 0.6rem; font-size: 0.74rem; cursor: pointer; } .xp-fbtn.on { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

.xp-body { min-height: 0; display: grid; grid-template-columns: minmax(280px, 0.85fr) minmax(420px, 1.4fr); gap: 0.75rem; }
@media (max-width: 1080px) { .xp-body { grid-template-columns: 1fr; } .xp-detail { display: none; } }

.xp-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; }
.xp-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); border-bottom: 1px solid var(--line); }
.xp-row { width: 100%; display: grid; gap: 0.3rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.6rem 0.85rem; cursor: pointer; text-align: left; } .xp-row:hover { background: var(--surface-2); } .xp-row.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.xp-row-top { display: flex; align-items: center; gap: 0.4rem; }
.xp-row-name { font-size: 0.88rem; font-weight: 600; line-height: 1.3; }
.xp-row-foot { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; font-variant-numeric: tabular-nums; }
.xp-up { font-size: 0.82rem; font-weight: 700; } .xp-up.up { color: var(--up); } .xp-up.down { color: var(--down); } .xp-up.flat { color: #8b949e; }
.xp-n { font-size: 0.7rem; color: var(--text-3); }

.xp-kind, .xp-status { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; }
.xp-kind { color: #93c5fd; background: rgba(88, 166, 255, 0.14); }
.xp-status { margin-left: auto; } .xp-status.running { color: var(--accent); background: rgba(216,162,80,0.16); } .xp-status.complete { color: var(--up); background: rgba(75,191,115,0.16); } .xp-status.queued { color: #8b949e; background: rgba(139,148,158,0.16); }

.xp-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 0 1.1rem 1.1rem; }
.xp-detail.empty { display: grid; place-items: center; color: var(--text-3); font-size: 0.85rem; padding: 1.1rem; }
.xp-ribbon { display: flex; align-items: center; gap: 0.6rem; margin: 0 -1.1rem 0.9rem; padding: 0.4rem 1.1rem; background: var(--accent-soft); border-bottom: 1px solid var(--line-2); font-size: 0.7rem; color: var(--text-2); }
.xp-ribbon-k { text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); font-weight: 700; font-size: 0.6rem; } .xp-ribbon-as { margin-left: auto; color: var(--text-3); }
.xp-d-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-top: 0.9rem; }
.xp-d-name { font-size: 1.2rem; font-weight: 640; line-height: 1.3; } .xp-d-sub { font-size: 0.78rem; color: var(--text-3); margin-top: 0.15rem; }
.xp-verdict { flex: 0 0 auto; font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; border-radius: 5px; padding: 0.2rem 0.5rem; } .xp-verdict.sig { color: var(--up); background: rgba(75,191,115,0.16); } .xp-verdict.nsig { color: #8b949e; background: rgba(139,148,158,0.16); }

.xp-arms { margin: 1.1rem 0 0.4rem; display: grid; gap: 0.7rem; }
.xp-arm-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.3rem; font-size: 0.82rem; }
.xp-arm-n { color: var(--text-2); } .xp-arm.best .xp-arm-n { color: var(--text); font-weight: 600; }
.xp-arm-s { font-variant-numeric: tabular-nums; font-weight: 660; }
.xp-tag { font-size: 0.52rem; text-transform: uppercase; letter-spacing: 0.03em; font-weight: 800; border-radius: 3px; padding: 0.05rem 0.3rem; margin-left: 0.4rem; color: #8b949e; background: rgba(139,148,158,0.16); } .xp-tag.win { color: var(--up); background: rgba(75,191,115,0.16); }
.xp-bar { height: 9px; border-radius: 5px; background: rgba(255,255,255,0.06); overflow: hidden; }
.xp-bar-fill { height: 100%; border-radius: 5px; background: var(--text-3); } .xp-bar-fill.base { background: #8b949e; } .xp-bar-fill.best { background: var(--up); }

.xp-uplift { display: flex; align-items: center; gap: 0.85rem; margin-top: 1.1rem; border: 1px solid var(--line-2); border-radius: 12px; padding: 0.85rem 1rem; background: var(--surface-2); }
.xp-uplift-v { font-size: 2rem; font-weight: 760; font-variant-numeric: tabular-nums; } .xp-uplift.up .xp-uplift-v { color: var(--up); } .xp-uplift.down .xp-uplift-v { color: var(--down); } .xp-uplift.flat .xp-uplift-v { color: #8b949e; }
.xp-uplift-k { font-size: 0.82rem; color: var(--text-2); line-height: 1.35; } .xp-uplift-k small { color: var(--text-3); font-size: 0.72rem; }
.xp-note { margin: 1rem 0 0; font-size: 0.86rem; line-height: 1.6; color: var(--text-2); }
.xp-boundary { font-size: 0.72rem; color: var(--text-3); padding-top: 0.7rem; line-height: 1.5; }
</style>
