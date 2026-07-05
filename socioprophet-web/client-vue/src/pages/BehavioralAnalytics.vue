<template>
  <section class="ba" aria-label="Behavioral analytics">
    <header class="ba-toolbar">
      <div class="ba-title">
        <div>
          <p v-if="scope && !scope.isPrimary" class="ba-eyebrow">{{ scope.domain }}</p>
          <h1>{{ scope && !scope.isPrimary ? scope.label : 'Behavioral Analytics' }}</h1>
        </div>
        <span class="ba-pill">fixture</span>
      </div>
      <div class="ba-agg">
        <span class="ba-agg-k">Tracked</span><span class="ba-num">{{ totalUsers.toLocaleString() }}</span>
        <span class="ba-agg-k">Cohorts</span><span class="ba-num">{{ cohorts.length }}</span>
      </div>
    </header>

    <div class="ba-body">
      <!-- Cohort list -->
      <div ref="listEl" class="ba-list" aria-label="Cohorts" @keydown="arrowRove($event, listEl, '.ba-row')">
        <p class="ba-count">{{ cohorts.length }} cohorts</p>
        <button v-for="c in cohorts" :key="c.id" class="ba-row" :class="{ on: c.id === selectedId }" @click="selectedId = c.id">
          <div class="ba-row-name">{{ c.name }}</div>
          <div class="ba-row-metrics">
            <span class="ba-mini"><b>{{ fmtNum(c.size) }}</b><small>users</small></span>
            <span class="ba-mini"><b :class="retClass(c.retentionD7)">{{ c.retentionD7 }}%</b><small>D7</small></span>
            <span class="ba-mini"><b>{{ c.engagement }}</b><small>eng</small></span>
          </div>
        </button>
      </div>

      <!-- Detail -->
      <article v-if="selected" class="ba-detail" aria-label="Cohort detail">
        <div class="ba-d-head">
          <div>
            <div class="ba-d-name">{{ selected.name }}</div>
            <div class="ba-d-sub">{{ selected.size.toLocaleString() }} users · avg session {{ selected.avgSessionMin }}m</div>
          </div>
          <div class="ba-kpis">
            <div class="ba-kpi"><span>Retention D7</span><strong :class="retClass(selected.retentionD7)">{{ selected.retentionD7 }}%</strong></div>
            <div class="ba-kpi"><span>Engagement</span><strong>{{ selected.engagement }}</strong></div>
          </div>
        </div>

        <!-- Funnel -->
        <div class="ba-block">
          <div class="ba-block-h">Conversion funnel</div>
          <div class="ba-funnel">
            <div v-for="(f, i) in selected.funnel" :key="i" class="ba-fstep">
              <div class="ba-fstep-h"><span>{{ f.step }}</span><span class="ba-fstep-c">{{ f.count.toLocaleString() }} <small>{{ pctOf(f.count) }}%</small></span></div>
              <div class="ba-fbar"><div class="ba-fbar-fill" :style="{ width: pctOf(f.count) + '%' }" /></div>
              <span v-if="i > 0" class="ba-fstep-conv" :class="convClass(selected.funnel[i - 1]!.count, f.count)">{{ stepConv(selected.funnel[i - 1]!.count, f.count) }}%</span>
            </div>
          </div>
        </div>

        <!-- Weekly-active trend -->
        <div class="ba-block">
          <div class="ba-block-h">Weekly active <span class="ba-trend-v">{{ selected.trend[selected.trend.length - 1]!.toLocaleString() }}</span></div>
          <svg class="ba-trend" viewBox="0 0 700 90" preserveAspectRatio="none" role="img" aria-label="weekly active trend">
            <polygon :points="areaPoints(selected.trend, 700, 90)" fill="rgba(216,162,80,0.16)" />
            <polyline :points="sparkPoints(selected.trend, 700, 90)" fill="none" stroke="var(--accent)" stroke-width="1.6" />
          </svg>
        </div>

        <!-- Top events -->
        <div class="ba-block">
          <div class="ba-block-h">Top events</div>
          <div class="ba-events">
            <div v-for="(e, i) in selected.events" :key="i" class="ba-erow">
              <span class="ba-ename">{{ e.name }}</span>
              <span class="ba-ecount">{{ e.count.toLocaleString() }}</span>
              <span class="ba-echg" :class="e.changePct > 0 ? 'up' : e.changePct < 0 ? 'down' : 'flat'">{{ signed(e.changePct) }}%</span>
            </div>
          </div>
        </div>

        <div class="ba-signals">
          <span v-for="(s, i) in selected.signals" :key="i" class="ba-sig" :class="s.tone">{{ s.label }}</span>
        </div>
        <p class="ba-note">{{ selected.note }}</p>
        <div class="ba-boundary">Aggregate-only · no per-user PII · fixture data. A live product-analytics adapter swaps in behind this shape.</div>
      </article>
      <div v-else class="ba-detail empty">Select a cohort</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { cohorts, type Cohort } from '../data/behavioralFixture';
import { sparkPoints, areaPoints } from '../utils/sparkline';
import { navScopeForPath } from '../config/cockpitNav';
import { arrowRove } from '../utils/listKeys';

const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

const selectedId = ref<string>(cohorts[0]!.id);
const selected = computed<Cohort | undefined>(() => cohorts.find((c) => c.id === selectedId.value));
const listEl = ref<HTMLElement | null>(null);
const totalUsers = cohorts.reduce((a, c) => a + c.size, 0);

function pctOf(count: number): number {
  const top = selected.value?.funnel[0]?.count ?? 1;
  return Math.round((count / top) * 100);
}
function stepConv(prev: number, cur: number): number { return Math.round((cur / prev) * 100); }
function convClass(prev: number, cur: number): string { const c = cur / prev; return c >= 0.8 ? 'up' : c >= 0.5 ? 'flat' : 'down'; }
function retClass(r: number): string { return r >= 60 ? 'up' : r >= 35 ? 'flat' : 'down'; }
function fmtNum(n: number): string { return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n); }
function signed(n: number): string { return `${n >= 0 ? '+' : ''}${n}`; }
</script>

<style scoped>
.ba { height: 100%; min-height: 0; display: grid; grid-template-rows: auto 1fr; gap: 0.75rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: var(--text); }
.ba-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.ba-title { display: flex; align-items: baseline; gap: 0.6rem; } .ba-title h1 { margin: 0; font-size: 1.2rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.ba-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.ba-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); background: var(--accent-soft); border-radius: 5px; padding: 0.1rem 0.35rem; }
.ba-agg { display: flex; align-items: center; gap: 0.5rem; font-size: 0.72rem; color: var(--text-3); } .ba-agg-k { text-transform: uppercase; letter-spacing: 0.05em; } .ba-agg .ba-num { color: var(--text); font-variant-numeric: tabular-nums; margin-right: 0.4rem; }

.ba-body { min-height: 0; display: grid; grid-template-columns: minmax(260px, 0.75fr) minmax(420px, 1.5fr); gap: 0.75rem; }
@media (max-width: 1080px) { .ba-body { grid-template-columns: 1fr; } .ba-detail { display: none; } }

.ba-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; }
.ba-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); border-bottom: 1px solid var(--line); }
.ba-row { width: 100%; display: grid; gap: 0.4rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.65rem 0.85rem; cursor: pointer; text-align: left; } .ba-row:hover { background: var(--surface-2); } .ba-row.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.ba-row-name { font-size: 0.9rem; font-weight: 600; }
.ba-row-metrics { display: flex; gap: 1rem; }
.ba-mini { display: flex; align-items: baseline; gap: 0.25rem; font-variant-numeric: tabular-nums; } .ba-mini b { font-size: 0.9rem; } .ba-mini small { font-size: 0.62rem; color: var(--text-3); text-transform: uppercase; }
.ba-mini b.up { color: var(--up); } .ba-mini b.down { color: var(--down); } .ba-mini b.flat { color: var(--text); }

.ba-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem 1.1rem; }
.ba-detail.empty { display: grid; place-items: center; color: var(--text-3); font-size: 0.85rem; }
.ba-d-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.ba-d-name { font-size: 1.2rem; font-weight: 640; } .ba-d-sub { font-size: 0.78rem; color: var(--text-3); margin-top: 0.15rem; }
.ba-kpis { display: flex; gap: 0.5rem; }
.ba-kpi { border: 1px solid var(--line); border-radius: 9px; padding: 0.4rem 0.7rem; background: var(--surface-2); text-align: right; } .ba-kpi span { display: block; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); } .ba-kpi strong { font-size: 1.1rem; font-variant-numeric: tabular-nums; } .ba-kpi strong.up { color: var(--up); } .ba-kpi strong.down { color: var(--down); } .ba-kpi strong.flat { color: var(--text); }

.ba-block { margin-top: 1.1rem; }
.ba-block-h { display: flex; align-items: baseline; gap: 0.5rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); margin-bottom: 0.6rem; } .ba-trend-v { color: var(--text); font-size: 0.9rem; letter-spacing: 0; text-transform: none; font-variant-numeric: tabular-nums; }
.ba-funnel { display: grid; gap: 0.55rem; }
.ba-fstep { position: relative; }
.ba-fstep-h { display: flex; align-items: baseline; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.25rem; } .ba-fstep-c { font-variant-numeric: tabular-nums; color: var(--text-2); } .ba-fstep-c small { color: var(--text-3); font-size: 0.7rem; margin-left: 0.2rem; }
.ba-fbar { height: 18px; border-radius: 5px; background: rgba(255,255,255,0.05); overflow: hidden; }
.ba-fbar-fill { height: 100%; border-radius: 5px; background: linear-gradient(90deg, rgba(216,162,80,0.85), rgba(216,162,80,0.5)); }
.ba-fstep-conv { position: absolute; right: 0; top: 0; font-size: 0.62rem; font-variant-numeric: tabular-nums; } .ba-fstep-conv.up { color: var(--up); } .ba-fstep-conv.flat { color: var(--accent); } .ba-fstep-conv.down { color: var(--down); }
.ba-trend { width: 100%; height: 90px; display: block; }
.ba-events { display: grid; }
.ba-erow { display: grid; grid-template-columns: 1fr auto 4rem; align-items: center; gap: 0.6rem; padding: 0.4rem 0; border-bottom: 1px solid var(--line); font-size: 0.82rem; font-variant-numeric: tabular-nums; } .ba-erow:last-child { border-bottom: none; }
.ba-ename { font-family: ui-monospace, monospace; font-size: 0.78rem; color: var(--text-2); } .ba-ecount { color: var(--text); } .ba-echg { text-align: right; font-weight: 600; } .ba-echg.up { color: var(--up); } .ba-echg.down { color: var(--down); } .ba-echg.flat { color: #8b949e; }
.ba-signals { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 1rem; }
.ba-sig { font-size: 0.66rem; border-radius: 5px; padding: 0.1rem 0.45rem; } .ba-sig.up { color: var(--up); background: rgba(75,191,115,0.14); } .ba-sig.down { color: var(--down); background: rgba(240,101,106,0.14); } .ba-sig.neutral { color: var(--text-2); background: rgba(255,255,255,0.05); }
.ba-note { margin: 0.9rem 0 0; font-size: 0.86rem; line-height: 1.6; color: var(--text-2); }
.ba-boundary { font-size: 0.72rem; color: var(--text-3); padding-top: 0.7rem; line-height: 1.5; }
</style>
