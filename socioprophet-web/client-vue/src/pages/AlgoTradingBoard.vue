<template>
  <section class="at" aria-label="Algorithmic trading">
    <header class="at-toolbar">
      <div class="at-title">
        <div>
          <p v-if="scope && !scope.isPrimary" class="at-eyebrow">{{ scope.domain }}</p>
          <h1>{{ scope && !scope.isPrimary ? scope.label : 'Strategies' }}</h1>
        </div>
        <span class="at-pill">fixture</span>
      </div>
      <div class="at-agg">
        <span class="at-agg-k">Live NAV Δ</span><span class="at-num" :class="navClass">{{ signed(navDelta) }}%</span>
        <span class="at-agg-k">Strategies</span><span class="at-num">{{ strategies.length }}</span>
        <span class="at-agg-k">Live</span><span class="at-num">{{ liveCount }}</span>
      </div>
      <div class="at-filters">
        <button v-for="s in statuses" :key="s" class="at-fbtn" :class="{ on: status === s }" @click="status = s">{{ s }}</button>
      </div>
    </header>

    <div class="at-body">
      <!-- Strategy list -->
      <div ref="listEl" class="at-list" aria-label="Strategies" @keydown="arrowRove($event, listEl, '.at-row')">
        <p class="at-count">{{ results.length }} strateg{{ results.length === 1 ? 'y' : 'ies' }}</p>
        <button v-for="s in results" :key="s.id" class="at-row" :class="{ on: s.id === selectedId }" @click="selectedId = s.id">
          <div class="at-row-top">
            <span class="at-klass" :class="s.klass">{{ s.klass }}</span>
            <span class="at-status" :class="s.status">{{ s.status }}</span>
          </div>
          <div class="at-row-name">{{ s.name }}</div>
          <div class="at-row-foot">
            <span class="at-spark"><svg viewBox="0 0 120 26" preserveAspectRatio="none"><polyline :points="sparkPoints(s.equity, 120, 26)" fill="none" :stroke="s.returnPct >= 0 ? 'var(--up)' : 'var(--down)'" stroke-width="1.4" /></svg></span>
            <span class="at-chg" :class="s.returnPct >= 0 ? 'up' : 'down'">{{ signed(s.returnPct) }}%</span>
          </div>
        </button>
      </div>

      <!-- Detail -->
      <article v-if="selected" class="at-detail" aria-label="Strategy detail">
        <div class="at-ribbon">
          <span class="at-ribbon-k">governance</span>
          <span>risk-gated · order routing disabled (fixture)</span>
          <span class="at-ribbon-as">as of {{ asOfLabel }}</span>
        </div>

        <div class="at-d-head">
          <div>
            <div class="at-d-name">{{ selected.name }} <span class="at-status" :class="selected.status">{{ selected.status }}</span></div>
            <div class="at-d-sub">{{ selected.klass }} · {{ selected.universe }}</div>
          </div>
          <div class="at-d-ret" :class="selected.returnPct >= 0 ? 'up' : 'down'">{{ signed(selected.returnPct) }}%<small>ann.</small></div>
        </div>

        <!-- Equity curve -->
        <div class="at-chart">
          <svg viewBox="0 0 720 150" preserveAspectRatio="none" role="img" aria-label="equity curve">
            <defs>
              <linearGradient :id="`atg-${selected.id}`" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="selected.returnPct >= 0 ? 'rgba(75,191,115,0.28)' : 'rgba(240,101,106,0.28)'" />
                <stop offset="100%" stop-color="rgba(0,0,0,0)" />
              </linearGradient>
            </defs>
            <polygon :points="areaPoints(selected.equity, 720, 150)" :fill="`url(#atg-${selected.id})`" />
            <polyline :points="sparkPoints(selected.equity, 720, 150)" fill="none" :stroke="selected.returnPct >= 0 ? 'var(--up)' : 'var(--down)'" stroke-width="1.6" />
          </svg>
        </div>

        <!-- Stats -->
        <div class="at-stats">
          <div class="at-stat"><span>Sharpe</span><strong>{{ selected.sharpe.toFixed(2) }}</strong></div>
          <div class="at-stat"><span>Max drawdown</span><strong :class="'down'">{{ selected.maxDrawdownPct.toFixed(1) }}%</strong></div>
          <div class="at-stat"><span>Win rate</span><strong>{{ selected.winRatePct }}%</strong></div>
          <div class="at-stat"><span>Trades</span><strong>{{ selected.trades.toLocaleString() }}</strong></div>
          <div class="at-stat"><span>Gross exposure</span><strong>{{ selected.exposurePct }}%</strong></div>
        </div>

        <p class="at-note">{{ selected.note }}</p>

        <!-- Signals -->
        <div class="at-signals">
          <span v-for="(sig, i) in selected.signals" :key="i" class="at-sig" :class="sig.tone">{{ sig.label }}</span>
        </div>

        <!-- Recent fills -->
        <div class="at-block">
          <div class="at-block-h">Recent fills</div>
          <div class="at-fills">
            <div class="at-fill at-fill-head"><span>Symbol</span><span>Side</span><span class="r">Qty</span><span class="r">Price</span><span class="r">P&amp;L</span></div>
            <button v-for="(f, i) in selected.fills" :key="i" class="at-fill" @click="openSymbol(f.symbol)">
              <span class="at-sym">{{ f.symbol }}</span>
              <span class="at-side" :class="f.side">{{ f.side }}</span>
              <span class="r">{{ f.qty.toLocaleString() }}</span>
              <span class="r">{{ f.price.toLocaleString() }}</span>
              <span class="r" :class="f.pnlPct >= 0 ? 'up' : 'down'">{{ signed(f.pnlPct) }}%</span>
            </button>
          </div>
        </div>
      </article>
      <div v-else class="at-detail empty">Select a strategy</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { strategies, asOf, type Strategy, type StrategyStatus } from '../data/algoTradingFixture';
import { sparkPoints, areaPoints } from '../utils/sparkline';
import { navScopeForPath } from '../config/cockpitNav';
import { arrowRove } from '../utils/listKeys';

const router = useRouter();
const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

const statuses = ['all', 'live', 'paper', 'backtest', 'halted'] as const;
const status = ref<(typeof statuses)[number]>('all');
const selectedId = ref<string>(strategies[0]!.id);
const listEl = ref<HTMLElement | null>(null);

const results = computed<Strategy[]>(() =>
  status.value === 'all' ? strategies : strategies.filter((s) => s.status === (status.value as StrategyStatus)),
);
const selected = computed<Strategy | undefined>(() => strategies.find((s) => s.id === selectedId.value));
watch(results, (r) => { if (!r.some((s) => s.id === selectedId.value) && r[0]) selectedId.value = r[0].id; });

const liveCount = strategies.filter((s) => s.status === 'live').length;
// Aggregate "NAV Δ" = mean of live strategies' latest equity-curve step.
const navDelta = computed(() => {
  const live = strategies.filter((s) => s.status === 'live');
  const last = live.map((s) => { const e = s.equity; return e.length > 1 ? ((e[e.length - 1]! - e[e.length - 2]!) / e[e.length - 2]!) * 100 : 0; });
  return Math.round((last.reduce((a, b) => a + b, 0) / (last.length || 1)) * 100) / 100;
});
const navClass = computed(() => (navDelta.value > 0 ? 'up' : navDelta.value < 0 ? 'down' : 'flat'));

function signed(n: number): string { return `${n >= 0 ? '+' : ''}${n}`; }
// Single-ticker fills deep-link into the market monitor; pairs/baskets don't map.
function openSymbol(sym: string) { if (!/[/]/.test(sym)) router.push({ path: '/markets/indices-funds', query: { sym } }); }

const asOfLabel = new Date(asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
</script>

<style scoped>
.at { height: 100%; min-height: 0; display: grid; grid-template-rows: auto 1fr; gap: 0.75rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: var(--text); }
.at-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.at-title { display: flex; align-items: baseline; gap: 0.6rem; } .at-title h1 { margin: 0; font-size: 1.2rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.at-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.at-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); background: var(--accent-soft); border-radius: 5px; padding: 0.1rem 0.35rem; }
.at-agg { display: flex; align-items: center; gap: 0.5rem; font-size: 0.72rem; color: var(--text-3); } .at-agg-k { text-transform: uppercase; letter-spacing: 0.05em; }
.at-agg .at-num { color: var(--text); font-variant-numeric: tabular-nums; margin-right: 0.4rem; } .at-agg .at-num.up { color: var(--up); } .at-agg .at-num.down { color: var(--down); }
.at-filters { display: flex; gap: 0.25rem; }
.at-fbtn { border: 1px solid var(--line-2); background: transparent; color: var(--text-2); border-radius: 8px; padding: 0.3rem 0.6rem; font-size: 0.74rem; text-transform: capitalize; cursor: pointer; } .at-fbtn.on { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

.at-body { min-height: 0; display: grid; grid-template-columns: minmax(280px, 0.8fr) minmax(420px, 1.4fr); gap: 0.75rem; }
@media (max-width: 1080px) { .at-body { grid-template-columns: 1fr; } .at-detail { display: none; } }

.at-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; }
.at-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); border-bottom: 1px solid var(--line); }
.at-row { width: 100%; display: grid; gap: 0.3rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.6rem 0.85rem; cursor: pointer; text-align: left; } .at-row:hover { background: var(--surface-2); } .at-row.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.at-row-top { display: flex; align-items: center; gap: 0.4rem; }
.at-row-name { font-size: 0.9rem; font-weight: 600; }
.at-row-foot { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.at-spark { width: 120px; height: 26px; } .at-spark svg { width: 100%; height: 100%; display: block; }
.at-chg { font-size: 0.82rem; font-variant-numeric: tabular-nums; font-weight: 600; } .at-chg.up { color: var(--up); } .at-chg.down { color: var(--down); }

.at-klass, .at-status, .at-sig, .at-side { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; }
.at-klass { color: #93c5fd; background: rgba(88, 166, 255, 0.14); }
.at-status { margin-left: auto; }
.at-status.live { color: var(--up); background: rgba(75, 191, 115, 0.16); } .at-status.paper { color: var(--accent); background: rgba(216, 162, 80, 0.16); } .at-status.backtest { color: #93c5fd; background: rgba(88, 166, 255, 0.14); } .at-status.halted { color: var(--down); background: rgba(240, 101, 106, 0.16); }
.at-d-head .at-status { margin-left: 0; }

.at-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 0 1.1rem 1.1rem; }
.at-detail.empty { display: grid; place-items: center; color: var(--text-3); font-size: 0.85rem; padding: 1.1rem; }
.at-ribbon { display: flex; align-items: center; gap: 0.6rem; margin: 0 -1.1rem 0.9rem; padding: 0.4rem 1.1rem; background: var(--accent-soft); border-bottom: 1px solid var(--line-2); font-size: 0.7rem; color: var(--text-2); }
.at-ribbon-k { text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); font-weight: 700; font-size: 0.6rem; } .at-ribbon-as { margin-left: auto; color: var(--text-3); }
.at-d-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-top: 0.9rem; }
.at-d-name { font-size: 1.25rem; font-weight: 640; display: flex; align-items: center; gap: 0.5rem; } .at-d-sub { font-size: 0.78rem; color: var(--text-3); margin-top: 0.15rem; text-transform: capitalize; }
.at-d-ret { font-size: 1.6rem; font-weight: 700; font-variant-numeric: tabular-nums; } .at-d-ret small { font-size: 0.62rem; font-weight: 600; color: var(--text-3); margin-left: 0.25rem; } .at-d-ret.up { color: var(--up); } .at-d-ret.down { color: var(--down); }
.at-chart { margin: 0.9rem 0; height: 150px; } .at-chart svg { width: 100%; height: 100%; display: block; }
.at-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.5rem; }
.at-stat { border: 1px solid var(--line); border-radius: 9px; padding: 0.5rem 0.65rem; background: var(--surface-2); } .at-stat span { display: block; font-size: 0.64rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); } .at-stat strong { font-size: 1.05rem; font-variant-numeric: tabular-nums; font-weight: 660; } .at-stat strong.down { color: var(--down); }
.at-note { margin: 0.9rem 0 0; font-size: 0.86rem; line-height: 1.6; color: var(--text-2); }
.at-signals { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.7rem; }
.at-sig.up { color: var(--up); background: rgba(75, 191, 115, 0.14); } .at-sig.down { color: var(--down); background: rgba(240, 101, 106, 0.14); } .at-sig.neutral { color: var(--text-2); background: rgba(255, 255, 255, 0.05); }
.at-block { margin-top: 1rem; border-top: 1px solid var(--line-2); padding-top: 0.85rem; }
.at-block-h { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); margin-bottom: 0.6rem; }
.at-fills { display: grid; }
.at-fill { display: grid; grid-template-columns: 1.4fr 0.7fr 0.9fr 1fr 0.8fr; align-items: center; gap: 0.5rem; border: none; background: transparent; color: inherit; padding: 0.4rem 0.35rem; border-bottom: 1px solid var(--line); font-size: 0.8rem; cursor: pointer; text-align: left; font-variant-numeric: tabular-nums; } .at-fill:hover:not(.at-fill-head) { background: var(--surface-2); }
.at-fill .r { text-align: right; } .at-fill .r.up { color: var(--up); } .at-fill .r.down { color: var(--down); }
.at-fill-head { color: var(--text-3); font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.05em; cursor: default; }
.at-sym { font-family: ui-monospace, monospace; font-weight: 600; }
.at-side.buy { color: var(--up); background: rgba(75, 191, 115, 0.14); justify-self: start; } .at-side.sell { color: var(--down); background: rgba(240, 101, 106, 0.14); justify-self: start; }
</style>
