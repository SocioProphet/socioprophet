<script setup lang="ts">
// Algorithmic Trading — REAL. Backtests run over real historical daily bars (algo-engine :8085,
// Yahoo data); "author in plain English" maps NL → a strategy spec; "route fills to book" places
// real paper orders into a live ledger with real mark-to-market P&L. No fixtures.
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import { navScopeForPath } from '../config/cockpitNav';
import {
  listStrategies, runBacktest, strategyFromNl, paperState, placeOrder, resetPaper,
  type Backtest, type StrategyDef, type PaperState,
} from '../services/algoApi';

const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

interface Row { id: string; name: string; klass: string; universe: string[]; bt: Backtest }
const rows = ref<Row[]>([]);
const catalog = ref<StrategyDef[]>([]);
const selectedId = ref('');
const selected = computed(() => rows.value.find((r) => r.id === selectedId.value) ?? rows.value[0]);
const paper = ref<PaperState | null>(null);
const nl = ref('');
const busy = ref(false);
const err = ref('');
let seq = 0;

const DEFAULTS = [
  { name: 'Semis Momentum', strategy: 'momentum', universe: ['NVDA', 'AMD', 'AVGO', 'INTC', 'MU', 'QCOM'] },
  { name: 'Megacap Mean-Reversion', strategy: 'mean_reversion', universe: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA'] },
  { name: 'Index Trend', strategy: 'trend', universe: ['SPY', 'QQQ', 'IWM', 'DIA'] },
  { name: 'Semis Market-Neutral', strategy: 'market_neutral', universe: ['NVDA', 'AMD', 'AVGO', 'INTC', 'MU', 'QCOM'] },
];
const EXAMPLES = [
  'Buy semis on breakout, 3% trailing stop',
  'Mean-reversion on oversold megacaps (RSI < 30)',
  'Market-neutral: long quality, short high-beta',
];
const CLASS_LABEL: Record<string, string> = { momentum: 'MOMENTUM', mean_reversion: 'MEAN-REVERSION', trend: 'TREND', market_neutral: 'MARKET-NEUTRAL' };

async function addBacktest(name: string, strategy: string, universe: string[], params: Record<string, any> = {}) {
  const bt = await runBacktest({ strategy, universe, lookback_days: 400, params });
  if (!bt.ok) throw new Error(bt.error || 'backtest failed');
  const id = `bt-${++seq}`;
  rows.value.unshift({ id, name, klass: CLASS_LABEL[strategy] ?? strategy, universe: bt.universe, bt });
  selectedId.value = id;
}
async function loadAll() {
  busy.value = true; err.value = '';
  try {
    catalog.value = (await listStrategies()).strategies;
    for (const d of DEFAULTS) { try { await addBacktest(d.name, d.strategy, d.universe); } catch { /* skip a failed name */ } }
    rows.value.reverse();
    selectedId.value = rows.value[0]?.id ?? '';
    paper.value = await paperState();
  } catch (e) { err.value = e instanceof Error ? e.message : String(e); }
  finally { busy.value = false; }
}
onMounted(loadAll);

async function author(text?: string) {
  const t = (text ?? nl.value).trim(); if (!t) return;
  busy.value = true; err.value = '';
  try { const spec = await strategyFromNl(t); await addBacktest(spec.name, spec.strategy, spec.universe, spec.params); nl.value = ''; }
  catch (e) { err.value = e instanceof Error ? e.message : String(e); }
  finally { busy.value = false; }
}
async function routeToBook() {
  const s = selected.value; if (!s) return;
  busy.value = true; err.value = '';
  try {
    const sleeve = 250_000;
    for (const f of s.bt.fills) {
      const qty = Math.max(1, Math.round((Math.abs(f.weight_delta) * sleeve) / f.price));
      await placeOrder({ symbol: f.symbol, side: f.side, qty, price: f.price });
    }
    paper.value = await paperState();
  } catch (e) { err.value = e instanceof Error ? e.message : String(e); }
  finally { busy.value = false; }
}
async function resetBook() { paper.value = await resetPaper(); }

function poly(curve: number[], w: number, h: number): string {
  if (curve.length < 2) return '';
  const min = Math.min(...curve), max = Math.max(...curve), rng = max - min || 1;
  return curve.map((v, i) => `${((i / (curve.length - 1)) * w).toFixed(1)},${(h - ((v - min) / rng) * h).toFixed(1)}`).join(' ');
}
const pct = (x: number) => (x * 100).toFixed(1) + '%';
const signed = (x: number) => (x >= 0 ? '+' : '') + (x * 100).toFixed(1) + '%';
const money = (x: number) => '$' + Math.round(x).toLocaleString();
</script>

<template>
  <section class="at" aria-label="Algorithmic trading">
    <SurfaceHeader :title="scope && !scope.isPrimary ? scope.label : 'Algorithmic Trading'" :eyebrow="scope && !scope.isPrimary ? scope.domain : 'Capital & Markets'">
      <template #badge><span class="at-pill live">live</span></template>
      <template #actions>
        <div class="at-agg" v-if="paper">
          <span class="at-agg-k">Paper equity</span><span class="at-num">{{ money(paper.equity) }}</span>
          <span class="at-agg-k">Unrealized P&amp;L</span><span class="at-num" :class="paper.unrealized_pnl >= 0 ? 'up' : 'down'">{{ paper.unrealized_pnl >= 0 ? '+' : '' }}{{ money(paper.unrealized_pnl) }}</span>
          <span class="at-agg-k">Strategies</span><span class="at-num">{{ rows.length }}</span>
        </div>
      </template>
    </SurfaceHeader>

    <div class="at-copilot">
      <span class="at-glyph">◇</span>
      <input v-model="nl" class="at-input" placeholder="Describe a strategy in plain English — e.g. buy semis on breakout with a 3% trailing stop" @keyup.enter="author()" />
      <button class="at-gen" :disabled="busy || !nl.trim()" @click="author()">{{ busy ? 'Working…' : 'Author &amp; backtest' }}</button>
    </div>
    <div class="at-examples">
      <span class="at-try">Try</span>
      <button v-for="e in EXAMPLES" :key="e" class="at-chip" @click="author(e)">{{ e }}</button>
      <span class="at-adv">Paper · governed · real historical backtest · not investment advice</span>
    </div>
    <p v-if="err" class="at-err">{{ err }}</p>

    <div class="at-grid">
      <aside class="at-list">
        <div class="at-list-h">{{ rows.length }} strategies · backtested</div>
        <button v-for="r in rows" :key="r.id" class="at-scard" :class="{ on: r.id === selectedId }" @click="selectedId = r.id">
          <div class="at-scard-top"><span class="at-klass">{{ r.klass }}</span><span class="at-ret" :class="r.bt.metrics.total_return >= 0 ? 'up' : 'down'">{{ signed(r.bt.metrics.total_return) }}</span></div>
          <div class="at-sname">{{ r.name }}</div>
          <svg class="at-mini" viewBox="0 0 120 30" preserveAspectRatio="none"><polyline :points="poly(r.bt.equity_curve, 120, 30)" fill="none" :stroke="r.bt.metrics.total_return >= 0 ? 'var(--up)' : 'var(--down)'" stroke-width="1.5" /></svg>
          <div class="at-scard-sub">Sharpe {{ r.bt.metrics.sharpe }} · {{ r.universe.length }} names</div>
        </button>
        <div v-if="busy && !rows.length" class="at-empty">Running real backtests…</div>
      </aside>

      <div class="at-detail" v-if="selected">
        <div class="at-d-head">
          <div>
            <div class="at-d-name">{{ selected.name }} <span class="at-pill live">backtested</span></div>
            <div class="at-d-sub">{{ selected.klass.toLowerCase() }} · {{ selected.universe.join(', ') }} · as of {{ selected.bt.as_of }}</div>
          </div>
          <div class="at-d-ret" :class="selected.bt.metrics.total_return >= 0 ? 'up' : 'down'">{{ signed(selected.bt.metrics.total_return) }}</div>
        </div>
        <svg class="at-equity" viewBox="0 0 680 150" preserveAspectRatio="none">
          <polyline :points="poly(selected.bt.equity_curve, 680, 150)" fill="none" :stroke="selected.bt.metrics.total_return >= 0 ? 'var(--up)' : 'var(--down)'" stroke-width="2" />
        </svg>
        <div class="at-metrics">
          <div><span class="at-m-k">Sharpe</span><span class="at-m-v">{{ selected.bt.metrics.sharpe }}</span></div>
          <div><span class="at-m-k">Max Drawdown</span><span class="at-m-v down">{{ pct(selected.bt.metrics.max_drawdown) }}</span></div>
          <div><span class="at-m-k">Win Rate</span><span class="at-m-v">{{ pct(selected.bt.metrics.win_rate) }}</span></div>
          <div><span class="at-m-k">CAGR</span><span class="at-m-v">{{ pct(selected.bt.metrics.cagr) }}</span></div>
          <div><span class="at-m-k">Ann. Vol</span><span class="at-m-v">{{ pct(selected.bt.metrics.vol) }}</span></div>
          <div><span class="at-m-k">Gross Exposure</span><span class="at-m-v">{{ (selected.bt.gross_exposure * 100).toFixed(0) }}%</span></div>
        </div>
        <div class="at-run">
          <button class="at-route" :disabled="busy || !selected.bt.fills.length" @click="routeToBook">Route fills to paper book →</button>
          <span class="at-prov">{{ selected.bt.provenance.data_source }} · {{ selected.bt.provenance.bars_per_name }} bars/name · not investment advice</span>
        </div>
        <div class="at-fills" v-if="selected.bt.fills.length">
          <div class="at-fills-h">Target rebalance · latest bar</div>
          <table class="at-tbl">
            <thead><tr><th>Symbol</th><th>Side</th><th>Δ weight</th><th>Price</th></tr></thead>
            <tbody><tr v-for="(f, i) in selected.bt.fills" :key="i"><td>{{ f.symbol }}</td><td><span class="at-side" :class="f.side.toLowerCase()">{{ f.side }}</span></td><td>{{ (f.weight_delta * 100).toFixed(1) }}%</td><td>{{ f.price }}</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="at-book" v-if="paper">
      <div class="at-book-h">
        <span class="at-book-t">Paper book</span>
        <span class="at-book-eq">Equity {{ money(paper.equity) }} · P&amp;L <b :class="paper.unrealized_pnl >= 0 ? 'up' : 'down'">{{ paper.unrealized_pnl >= 0 ? '+' : '' }}{{ money(paper.unrealized_pnl) }}</b> · Cash {{ money(paper.cash) }}</span>
        <button class="at-reset" @click="resetBook">Reset</button>
      </div>
      <table class="at-tbl" v-if="paper.positions.length">
        <thead><tr><th>Symbol</th><th>Qty</th><th>Price</th><th>Market value</th></tr></thead>
        <tbody><tr v-for="p in paper.positions" :key="p.symbol"><td>{{ p.symbol }}</td><td>{{ p.qty }}</td><td>{{ p.price }}</td><td>{{ money(p.market_value) }}</td></tr></tbody>
      </table>
      <p v-else class="at-empty">No paper positions yet — route a strategy's fills to the book.</p>
    </div>
  </section>
</template>

<style scoped>
.at { padding: 1rem 1.25rem; max-width: 1180px; margin: 0 auto; color: var(--text); }
.at-pill { font-size: .62rem; text-transform: uppercase; letter-spacing: .05em; padding: .1rem .45rem; border-radius: 999px; border: 1px solid var(--line-2); color: var(--text-2); }
.at-pill.live { color: var(--up); border-color: rgba(75,191,115,.4); background: rgba(75,191,115,.12); }
.at-agg { display: flex; align-items: center; gap: .5rem; font-size: .78rem; }
.at-agg-k { color: var(--text-3); text-transform: uppercase; font-size: .62rem; letter-spacing: .06em; }
.at-num { font-weight: 700; } .up { color: var(--up); } .down { color: var(--down); }
.at-copilot { display: flex; align-items: center; gap: .6rem; border: 1px solid var(--line-2); background: var(--surface); border-radius: 12px; padding: .5rem .7rem; margin: 1rem 0 .5rem; }
.at-glyph { color: var(--accent); }
.at-input { flex: 1; background: transparent; border: 0; color: var(--text); font-size: .9rem; outline: none; }
.at-gen { background: var(--accent); color: #1a1204; border: 0; border-radius: 8px; padding: .45rem .9rem; font-weight: 700; cursor: pointer; }
.at-gen:disabled { opacity: .5; cursor: default; }
.at-examples { display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; margin-bottom: .4rem; }
.at-try { color: var(--text-3); font-size: .74rem; }
.at-chip { background: var(--surface-2); border: 1px solid var(--line); color: var(--text-2); border-radius: 999px; padding: .2rem .6rem; font-size: .74rem; cursor: pointer; }
.at-chip:hover { border-color: var(--accent); color: var(--text); }
.at-adv { margin-left: auto; color: var(--text-3); font-size: .72rem; }
.at-err { color: var(--down); font-size: .82rem; }
.at-grid { display: grid; grid-template-columns: 300px 1fr; gap: 1rem; margin-top: .6rem; }
.at-list { display: flex; flex-direction: column; gap: .5rem; }
.at-list-h { color: var(--text-3); font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; }
.at-scard { text-align: left; border: 1px solid var(--line-2); border-radius: 12px; background: var(--surface); padding: .6rem .7rem; cursor: pointer; color: var(--text); }
.at-scard.on { border-color: var(--accent); background: var(--accent-soft); }
.at-scard-top { display: flex; justify-content: space-between; align-items: center; }
.at-klass { font-size: .6rem; letter-spacing: .06em; color: var(--text-3); }
.at-ret { font-weight: 700; font-size: .82rem; }
.at-sname { font-weight: 650; margin: .15rem 0; }
.at-mini { width: 100%; height: 30px; display: block; }
.at-scard-sub { color: var(--text-3); font-size: .72rem; }
.at-detail { border: 1px solid var(--line-2); border-radius: 14px; background: var(--surface); padding: 1rem 1.1rem; }
.at-d-head { display: flex; justify-content: space-between; align-items: flex-start; }
.at-d-name { font-size: 1.15rem; font-weight: 700; display: flex; align-items: center; gap: .5rem; }
.at-d-sub { color: var(--text-3); font-size: .78rem; margin-top: .1rem; }
.at-d-ret { font-size: 1.6rem; font-weight: 800; }
.at-equity { width: 100%; height: 150px; display: block; margin: .8rem 0; }
.at-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: .6rem; }
.at-metrics > div { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 10px; padding: .5rem .6rem; }
.at-m-k { color: var(--text-3); font-size: .64rem; text-transform: uppercase; letter-spacing: .05em; }
.at-m-v { font-size: 1.05rem; font-weight: 700; }
.at-run { display: flex; align-items: center; gap: .8rem; margin: .9rem 0 .3rem; flex-wrap: wrap; }
.at-route { background: var(--up); color: #05271c; border: 0; border-radius: 8px; padding: .5rem .9rem; font-weight: 700; cursor: pointer; }
.at-route:disabled { opacity: .5; cursor: default; }
.at-prov { color: var(--text-3); font-size: .72rem; }
.at-fills-h, .at-book-t { color: var(--text-3); font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; margin: .6rem 0 .3rem; }
.at-tbl { width: 100%; border-collapse: collapse; font-size: .82rem; }
.at-tbl th { text-align: left; color: var(--text-3); font-weight: 500; border-bottom: 1px solid var(--line-2); padding: .35rem .4rem; }
.at-tbl td { border-bottom: 1px solid var(--line); padding: .35rem .4rem; }
.at-side { font-size: .64rem; font-weight: 700; padding: .05rem .4rem; border-radius: 4px; }
.at-side.buy { color: var(--up); background: rgba(75,191,115,.14); } .at-side.sell { color: var(--down); background: rgba(240,101,106,.14); }
.at-book { border: 1px solid var(--line-2); border-radius: 14px; background: var(--surface); padding: .8rem 1rem; margin-top: 1rem; }
.at-book-h { display: flex; align-items: center; gap: .8rem; }
.at-book-eq { font-size: .84rem; color: var(--text-2); } .at-book-eq b { font-weight: 700; }
.at-reset { margin-left: auto; background: var(--surface-2); border: 1px solid var(--line-2); color: var(--text-2); border-radius: 8px; padding: .3rem .7rem; cursor: pointer; font-size: .78rem; }
.at-empty { color: var(--text-3); font-size: .82rem; padding: .5rem 0; }
@media (max-width: 900px) { .at-grid { grid-template-columns: 1fr; } }
</style>
