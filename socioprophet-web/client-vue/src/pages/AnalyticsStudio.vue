<template>
  <section class="an" aria-label="Analytics studio">
    <header class="an-toolbar">
      <div class="an-title">
        <div>
          <p class="an-eyebrow">{{ scope?.domain ?? 'Maps & Analytics' }}</p>
          <h1>{{ scope?.label ?? 'Analytics' }}</h1>
        </div>
        <span class="an-pill">fixture</span>
      </div>
      <p class="an-sub">Charts drawn over live platform data — markets, economy, social, and behavioral fixtures. No fabricated series.</p>
    </header>

    <!-- Trending infographics: big-stat callouts -->
    <div v-if="mode === 'trending'" class="an-cards">
      <article v-for="c in infographics" :key="c.k" class="an-card">
        <div class="an-card-k">{{ c.k }}</div>
        <div class="an-card-v" :class="c.tone">{{ c.v }}</div>
        <div class="an-card-sub">{{ c.sub }}</div>
        <svg v-if="c.series" class="an-card-spark" viewBox="0 0 160 40" preserveAspectRatio="none">
          <polygon :points="areaPoints(c.series, 160, 40)" fill="rgba(216,162,80,0.16)" />
          <polyline :points="sparkPoints(c.series, 160, 40)" fill="none" stroke="var(--accent)" stroke-width="1.4" />
        </svg>
      </article>
    </div>

    <!-- Chart gallery / builder -->
    <div v-else class="an-body">
      <div ref="listEl" class="an-list" aria-label="Datasets" @keydown="arrowRove($event, listEl, '.an-ds')">
        <p class="an-list-h">Datasets</p>
        <button v-for="d in datasets" :key="d.id" class="an-ds" :class="{ on: d.id === selectedId }" @click="selectedId = d.id">
          <span class="an-ds-chart" :class="d.chart">{{ chartGlyph(d.chart) }}</span>
          <span class="an-ds-n">{{ d.name }}</span>
        </button>
      </div>

      <article v-if="selected" class="an-canvas" aria-label="Chart">
        <div class="an-canvas-h">
          <div><h2>{{ selected.name }}</h2><span class="an-canvas-sub">{{ selected.source }} · {{ selected.chart }} chart</span></div>
          <span class="an-unit" v-if="selected.unit">{{ selected.unit }}</span>
        </div>

        <!-- Bar chart -->
        <div v-if="selected.chart === 'bar'" class="an-bars">
          <div v-for="(p, i) in selected.points" :key="i" class="an-bar-row">
            <span class="an-bar-l">{{ p.label }}</span>
            <div class="an-bar-track">
              <div class="an-bar-fill" :class="p.value >= 0 ? 'pos' : 'neg'" :style="{ width: barW(p.value) + '%' }" />
            </div>
            <span class="an-bar-v" :class="signClass(p.value)">{{ fmt(p.value, selected.unit) }}</span>
          </div>
        </div>

        <!-- Area chart -->
        <div v-else-if="selected.chart === 'area'" class="an-area">
          <svg viewBox="0 0 720 220" preserveAspectRatio="none" role="img" :aria-label="selected.name">
            <defs>
              <linearGradient id="an-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(216,162,80,0.3)" /><stop offset="100%" stop-color="rgba(0,0,0,0)" />
              </linearGradient>
            </defs>
            <polygon :points="areaPoints(selected.series!, 720, 220)" fill="url(#an-grad)" />
            <polyline :points="sparkPoints(selected.series!, 720, 220)" fill="none" stroke="var(--accent)" stroke-width="1.8" />
          </svg>
          <div class="an-area-foot"><span>{{ selected.series![0] }}</span><span>{{ selected.series![selected.series!.length - 1] }}</span></div>
        </div>

        <!-- Donut chart -->
        <div v-else class="an-donut">
          <svg viewBox="0 0 120 120" role="img" :aria-label="selected.name">
            <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="16" />
            <circle v-for="(s, i) in donutArcs" :key="i" cx="60" cy="60" r="45" fill="none" :stroke="s.color" stroke-width="16"
              :stroke-dasharray="`${s.len} ${circ - s.len}`" :stroke-dashoffset="s.offset" transform="rotate(-90 60 60)" />
            <text x="60" y="58" text-anchor="middle" class="an-donut-total">{{ donutTotal }}</text>
            <text x="60" y="72" text-anchor="middle" class="an-donut-cap">signals</text>
          </svg>
          <div class="an-donut-legend">
            <div v-for="(s, i) in selected.segments" :key="i" class="an-leg"><i :style="{ background: s.color }" />{{ s.label }}<b>{{ s.value }}</b><small>{{ pct(s.value) }}%</small></div>
          </div>
        </div>

        <div class="an-boundary">Derived from the platform's typed fixtures · read-only · a live analytics adapter renders the same specs over live data.</div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { navScopeForPath } from '../config/cockpitNav';
import { sparkPoints, areaPoints } from '../utils/sparkline';
import { arrowRove } from '../utils/listKeys';
import { indices } from '../data/marketsFixture';
import { indicators } from '../data/economyFixture';
import { trends, socialSignals } from '../data/socialFixture';
import { cohorts } from '../data/behavioralFixture';

const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));
const mode = computed(() => (route.path === '/analytics/trending-infographics' ? 'trending' : 'gallery'));

interface Point { label: string; value: number }
interface Segment { label: string; value: number; color: string }
interface Dataset { id: string; name: string; source: string; unit: string; chart: 'bar' | 'area' | 'donut'; points?: Point[]; series?: number[]; segments?: Segment[] }

const sentColors = { pos: 'var(--up)', neu: '#8b949e', neg: 'var(--down)' } as const;
const sentiment = computed<Segment[]>(() => {
  const c = { pos: 0, neu: 0, neg: 0 };
  for (const s of socialSignals) c[s.sentiment]++;
  return [
    { label: 'positive', value: c.pos, color: sentColors.pos },
    { label: 'neutral', value: c.neu, color: sentColors.neu },
    { label: 'negative', value: c.neg, color: sentColors.neg },
  ];
});

const datasets = computed<Dataset[]>(() => [
  { id: 'idx', name: 'Index performance', source: 'Markets', unit: '%', chart: 'bar', points: indices.slice(0, 6).map((i) => ({ label: i.symbol, value: Math.round(i.changePct * 1000) / 10 })) },
  { id: 'macro', name: 'Macro indicators', source: 'Economy', unit: '', chart: 'bar', points: indicators.slice(0, 6).map((k) => ({ label: shortLabel(k.name), value: k.value })) },
  { id: 'trend', name: 'Trending volume', source: 'Social', unit: '', chart: 'bar', points: trends.slice(0, 6).map((t) => ({ label: t.topic, value: t.volume })) },
  { id: 'ret', name: 'Cohort retention (D7)', source: 'Behavioral', unit: '%', chart: 'bar', points: cohorts.map((c) => ({ label: c.name, value: c.retentionD7 })) },
  { id: 'spx', name: 'S&P 500 trend', source: 'Markets', unit: 'pts', chart: 'area', series: indices[0]?.series ?? [] },
  { id: 'sent', name: 'Sentiment mix', source: 'Social', unit: '', chart: 'donut', segments: sentiment.value },
]);

const selectedId = ref('idx');
const selected = computed<Dataset | undefined>(() => datasets.value.find((d) => d.id === selectedId.value));
const listEl = ref<HTMLElement | null>(null);

function barW(v: number): number {
  const pts = selected.value?.points ?? [];
  const max = Math.max(...pts.map((p) => Math.abs(p.value)), 1);
  return Math.max(2, (Math.abs(v) / max) * 100);
}
function signClass(v: number): string { return v > 0 ? 'pos' : v < 0 ? 'neg' : 'flat'; }
function fmt(v: number, unit: string): string { const s = v >= 1000 ? v.toLocaleString('en-US') : String(v); return `${v > 0 && unit === '%' ? '+' : ''}${s}${unit === '%' ? '%' : ''}`; }
function shortLabel(name: string): string { return name.replace(/\s*\(.*\)/, ''); }
function chartGlyph(c: string): string { return c === 'bar' ? '▤' : c === 'area' ? '◿' : '◔'; }

// Donut geometry
const circ = 2 * Math.PI * 45;
const donutTotal = computed(() => (selected.value?.segments ?? []).reduce((a, s) => a + s.value, 0));
const donutArcs = computed(() => {
  const segs = selected.value?.segments ?? [];
  const total = donutTotal.value || 1;
  let acc = 0;
  return segs.map((s) => {
    const len = (s.value / total) * circ;
    const offset = -acc;
    acc += len;
    return { color: s.color, len, offset };
  });
});
function pct(v: number): number { return Math.round((v / (donutTotal.value || 1)) * 100); }

// Trending infographics — headline stats pulled from the same fixtures.
const infographics = computed(() => {
  const topTrend = [...trends].sort((a, b) => b.volume - a.volume)[0]!;
  const topMover = [...indices].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0]!;
  const bestCohort = [...cohorts].sort((a, b) => b.retentionD7 - a.retentionD7)[0]!;
  const sent = sentiment.value;
  const leadSent = [...sent].sort((a, b) => b.value - a.value)[0]!;
  const sentTotal = sent.reduce((a, s) => a + s.value, 0) || 1;
  return [
    { k: 'Top trending topic', v: topTrend.topic, sub: `${(topTrend.volume / 1000).toFixed(1)}K mentions · ${topTrend.changePct >= 0 ? '+' : ''}${topTrend.changePct}%`, tone: topTrend.changePct >= 0 ? 'pos' : 'neg', series: undefined as number[] | undefined },
    { k: 'Biggest market move', v: topMover.symbol, sub: `${topMover.name} · ${topMover.changePct >= 0 ? '+' : ''}${(topMover.changePct * 100).toFixed(2)}%`, tone: topMover.changePct >= 0 ? 'pos' : 'neg', series: topMover.series },
    { k: 'Best-retained cohort', v: `${bestCohort.retentionD7}%`, sub: `${bestCohort.name} · D7 retention`, tone: 'pos', series: bestCohort.trend },
    { k: 'Dominant sentiment', v: leadSent.label, sub: `${Math.round((leadSent.value / sentTotal) * 100)}% of tracked signals`, tone: leadSent.label === 'positive' ? 'pos' : leadSent.label === 'negative' ? 'neg' : 'flat', series: undefined },
  ];
});
</script>

<style scoped>
.an { height: 100%; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; padding: 0.85rem 1rem 1.5rem; background: var(--bg); color: var(--text); }
.an-toolbar { display: flex; flex-direction: column; gap: 0.3rem; }
.an-title { display: flex; align-items: baseline; gap: 0.6rem; } .an-title h1 { margin: 0; font-size: 1.3rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.an-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.an-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); background: var(--accent-soft); border-radius: 5px; padding: 0.1rem 0.35rem; }
.an-sub { margin: 0; font-size: 0.8rem; color: var(--text-3); }

.an-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.85rem; }
.an-card { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); padding: 0.9rem 1rem; }
.an-card-k { font-size: 0.64rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); }
.an-card-v { font-size: 1.8rem; font-weight: 720; letter-spacing: -0.02em; margin: 0.3rem 0 0.1rem; } .an-card-v.pos { color: var(--up); } .an-card-v.neg { color: var(--down); } .an-card-v.flat { color: var(--text); }
.an-card-sub { font-size: 0.78rem; color: var(--text-2); }
.an-card-spark { width: 100%; height: 40px; margin-top: 0.6rem; display: block; }

.an-body { min-height: 0; flex: 1; display: grid; grid-template-columns: minmax(220px, 0.6fr) minmax(360px, 1.6fr); gap: 0.75rem; }
@media (max-width: 900px) { .an-body { grid-template-columns: 1fr; } }
.an-list { border: 1px solid var(--line-2); border-radius: 12px; overflow: hidden; align-self: start; }
.an-list-h { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); border-bottom: 1px solid var(--line); }
.an-ds { width: 100%; display: flex; align-items: center; gap: 0.6rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.6rem 0.85rem; cursor: pointer; text-align: left; } .an-ds:last-child { border-bottom: none; } .an-ds:hover { background: var(--surface-2); } .an-ds.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.an-ds-chart { width: 1.4rem; height: 1.4rem; display: grid; place-items: center; border-radius: 6px; background: rgba(255,255,255,0.05); color: var(--text-2); font-size: 0.8rem; } .an-ds.on .an-ds-chart { color: var(--accent); }
.an-ds-n { font-size: 0.86rem; }

.an-canvas { border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem 1.1rem; min-height: 0; }
.an-canvas-h { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; } .an-canvas-h h2 { margin: 0; font-size: 1.15rem; } .an-canvas-sub { font-size: 0.74rem; color: var(--text-3); text-transform: capitalize; }
.an-unit { font-size: 0.72rem; color: var(--text-3); border: 1px solid var(--line); border-radius: 5px; padding: 0.1rem 0.4rem; }

.an-bars { display: grid; gap: 0.6rem; }
.an-bar-row { display: grid; grid-template-columns: 9rem 1fr 4.5rem; align-items: center; gap: 0.7rem; }
.an-bar-l { font-size: 0.8rem; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.an-bar-track { height: 16px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; }
.an-bar-fill { height: 100%; border-radius: 5px; } .an-bar-fill.pos { background: linear-gradient(90deg, rgba(216,162,80,0.85), rgba(216,162,80,0.5)); } .an-bar-fill.neg { background: linear-gradient(90deg, rgba(240,101,106,0.7), rgba(240,101,106,0.45)); }
.an-bar-v { font-size: 0.8rem; font-variant-numeric: tabular-nums; text-align: right; } .an-bar-v.pos { color: var(--up); } .an-bar-v.neg { color: var(--down); } .an-bar-v.flat { color: var(--text-2); }

.an-area svg { width: 100%; height: 220px; display: block; }
.an-area-foot { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-3); font-variant-numeric: tabular-nums; margin-top: 0.3rem; }

.an-donut { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; padding: 0.5rem 0; }
.an-donut svg { width: 160px; height: 160px; }
.an-donut-total { fill: var(--text); font-size: 20px; font-weight: 700; } .an-donut-cap { fill: var(--text-3); font-size: 8px; text-transform: uppercase; letter-spacing: 0.08em; }
.an-donut-legend { display: grid; gap: 0.5rem; }
.an-leg { display: flex; align-items: center; gap: 0.5rem; font-size: 0.84rem; text-transform: capitalize; color: var(--text-2); } .an-leg i { width: 11px; height: 11px; border-radius: 3px; } .an-leg b { color: var(--text); font-variant-numeric: tabular-nums; } .an-leg small { color: var(--text-3); }

.an-boundary { font-size: 0.72rem; color: var(--text-3); padding-top: 0.9rem; margin-top: 0.9rem; border-top: 1px solid var(--line); line-height: 1.5; }
</style>
