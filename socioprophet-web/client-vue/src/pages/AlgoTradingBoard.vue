<template>
  <section class="at" aria-label="Algorithmic trading">
    <SurfaceHeader :title="scope && !scope.isPrimary ? scope.label : 'Strategies'" :eyebrow="(scope && !scope.isPrimary) ? (scope.domain) : ''">
      <template #badge><span class="at-pill">fixture</span></template>
      <template #actions>
        <div class="at-agg">
        <span class="at-agg-k">Live NAV Δ</span><span class="at-num" :class="navClass">{{ signed(navDelta) }}%</span>
        <span class="at-agg-k">Strategies</span><span class="at-num">{{ strategies.length }}</span>
        <span class="at-agg-k">Live</span><span class="at-num">{{ liveCount }}</span>
        </div>
        <div class="at-filters">
        <button v-for="s in statuses" :key="s" class="at-fbtn" :class="{ on: status === s }" @click="status = s">{{ s }}</button>
        </div>
      </template>
    </SurfaceHeader>

    <!-- Strategy Copilot — Robinhood-clean input, Claude-grade reasoning -->
    <div class="at-copilot">
      <span class="at-copilot-glyph">◇</span>
      <input
        v-model="copilotText"
        class="at-copilot-input"
        type="text"
        spellcheck="false"
        placeholder="Describe a strategy in plain English — e.g. buy semis on breakout with a 3% trailing stop…"
        @keydown.enter="generateStrategy"
      />
      <button class="at-copilot-go" :disabled="!copilotText.trim() || generating" @click="generateStrategy">
        {{ generating ? 'Generating…' : 'Generate strategy' }}
      </button>
    </div>
    <div class="at-copilot-hints">
      <span class="at-copilot-try">Try:</span>
      <button v-for="ex in copilotExamples" :key="ex" class="at-copilot-chip" @click="copilotText = ex; generateStrategy()">{{ ex }}</button>
      <span class="at-copilot-gov">Paper only · governed · not investment advice</span>
    </div>

    <SplitPane storage-key="algo-trading" label="strategies" :initial="360">
      <template #list>
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
      </template>

      <template #detail>
      <article v-if="selected" class="at-detail" aria-label="Strategy detail">
        <div class="at-ribbon">
          <span class="at-ribbon-k">governance</span>
          <span>risk-gated · paper routing to shared book</span>
          <span class="at-ribbon-as">as of {{ asOfLabel }}</span>
        </div>

        <div class="at-actions">
          <button class="at-route" type="button" @click="deployToBook">Route fills to book ▸</button>
          <button class="at-ask" type="button" @click="askNoetica" title="Ask Noetica about this strategy">◇ Ask Noetica</button>
          <RouterLink class="at-portlink" to="/capability/portfolios">Portfolio →</RouterLink>
          <span v-if="deployMsg" class="at-deploymsg">{{ deployMsg }}</span>
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
      </template>
    </SplitPane>
  </section>
</template>

<script setup lang="ts">
import SurfaceHeader from '../components/SurfaceHeader.vue';
import SplitPane from '../components/SplitPane.vue';
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { strategies, asOf, type Strategy, type StrategyStatus, type StrategyClass } from '../data/algoTradingFixture';
import { sparkPoints, areaPoints } from '../utils/sparkline';
import { navScopeForPath } from '../config/cockpitNav';
import { arrowRove } from '../utils/listKeys';
import { usePortfolio } from '../stores/portfolio';
import { useCockpit } from '../stores/cockpit';
import { useSettings } from '../stores/settings';
import { meshChatStream } from '../config/mesh';

const router = useRouter();
const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));
const portfolio = usePortfolio();
const cockpit = useCockpit();
const deployMsg = ref('');

const statuses = ['all', 'live', 'paper', 'backtest', 'halted'] as const;
const status = ref<(typeof statuses)[number]>('all');
const selectedId = ref<string>(strategies[0]!.id);
const listEl = ref<HTMLElement | null>(null);

// Copilot-generated (paper) strategies live above the fixture book.
const genStrategies = ref<Strategy[]>([]);
const pool = computed<Strategy[]>(() => [...genStrategies.value, ...strategies]);
const results = computed<Strategy[]>(() =>
  status.value === 'all' ? pool.value : pool.value.filter((s) => s.status === (status.value as StrategyStatus)),
);
const selected = computed<Strategy | undefined>(() => pool.value.find((s) => s.id === selectedId.value));
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

// ── Strategy Copilot — describe an algo in plain English; the mesh writes the rationale ──
const settings = useSettings();
const copilotText = ref('');
const generating = ref(false);
const copilotExamples = [
  'Buy semis on breakout, 3% trailing stop',
  'Mean-reversion on oversold megacaps (RSI < 30)',
  'Market-neutral: long quality, short high-beta',
];
function pickClass(t: string): StrategyClass {
  const s = t.toLowerCase();
  if (/rsi|revert|revers|oversold|dip|mean/.test(s)) return 'mean-reversion';
  if (/pairs|neutral|hedge|long.?short/.test(s)) return 'market-neutral';
  if (/trend|macd|moving average|ma cross/.test(s)) return 'trend';
  if (/arb|spread|basis/.test(s)) return 'stat-arb';
  return 'momentum';
}
function genCurve(seed: number, n = 40): number[] {
  const out: number[] = []; let v = 100; let r = seed;
  const rand = () => { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; };
  const drift = 0.15 + rand() * 0.5;
  for (let i = 0; i < n; i++) { v += drift + (rand() - 0.5) * 2.2; out.push(Math.round(v * 100) / 100); }
  return out;
}
function tickersIn(t: string): string { const m = t.toUpperCase().match(/\b[A-Z]{2,5}\b/g); return m ? m.slice(0, 3).join(', ') : 'US equities'; }

async function generateStrategy() {
  const text = copilotText.value.trim();
  if (!text || generating.value) return;
  generating.value = true;
  const seed = Math.floor(Math.random() * 1e6);
  const equity = genCurve(seed);
  const klass = pickClass(text);
  const s: Strategy = {
    id: 'gen-' + seed,
    name: text.length > 42 ? text.slice(0, 42) + '…' : text,
    klass, status: 'paper', universe: tickersIn(text),
    returnPct: Math.round((equity[equity.length - 1]! - 100) * 10) / 10,
    sharpe: Math.round((0.6 + Math.random() * 1.6) * 100) / 100,
    maxDrawdownPct: -Math.round((3 + Math.random() * 14) * 10) / 10,
    winRatePct: 48 + Math.floor(Math.random() * 18),
    trades: 40 + Math.floor(Math.random() * 400),
    exposurePct: 40 + Math.floor(Math.random() * 60),
    equity,
    signals: [{ label: 'generated', tone: 'neutral' }, { label: klass, tone: 'up' }],
    fills: [],
    note: 'Generating rationale…',
  };
  genStrategies.value = [s, ...genStrategies.value];
  selectedId.value = s.id;
  copilotText.value = '';
  try {
    if (settings.meshChat) {
      s.note = '';
      await meshChatStream(
        [{ role: 'user', content: `You are a quant strategy copilot. In 2-3 sentences, explain this trading strategy and its main risk. Paper-trading only, NOT investment advice.\n\nStrategy: "${text}"` }],
        (d) => { s.note += d; },
      );
    } else {
      s.note = `Paper strategy synthesized from your description (${klass}, ${s.universe}). Turn on Prophet Cloud Mesh in Settings → Connections for a live AI rationale. Advisory only — not investment advice.`;
    }
  } catch (e) {
    s.note = `Paper strategy (${klass}). AI rationale unavailable: ${e instanceof Error ? e.message : 'mesh error'}. Not investment advice.`;
  } finally {
    generating.value = false;
  }
}

// ── Integration: route a strategy's fills into the SHARED portfolio book ──
function deployToBook() {
  const s = selected.value;
  if (!s) return;
  let ok = 0;
  let skipped = 0;
  for (const f of s.fills) {
    if (/[/]/.test(f.symbol)) { skipped += 1; continue; } // pairs/baskets don't map to a single position
    const side = /sell|short/i.test(f.side) ? 'sell' : 'buy';
    if (portfolio.placeOrder({ symbol: f.symbol, name: f.symbol, side, qty: f.qty, price: f.price, source: `algo:${s.id}` }).ok) ok += 1;
    else skipped += 1;
  }
  deployMsg.value = ok
    ? `Routed ${ok} fill(s) from ${s.name} to your Portfolio${skipped ? ` · ${skipped} skipped` : ''}.`
    : 'No routable single-ticker fills (pairs/baskets or risk-gated).';
}
function askNoetica() {
  const s = selected.value;
  if (!s) return;
  cockpit.askAbout(`Assess the "${s.name}" strategy (${s.klass}, ${s.status}): return ${signed(s.returnPct)}%, Sharpe ${s.sharpe}, max drawdown ${s.maxDrawdownPct}%, win rate ${s.winRatePct}%. Is the risk acceptable, and would you allocate?`);
}
watch(selected, (s) => {
  if (s) cockpit.setContext({ surface: 'Algorithmic Trading', entityLabel: s.name, detail: `${signed(s.returnPct)}% · ${s.status}`, route: route.path });
}, { immediate: true });
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

.at-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin: 0.6rem 0 0.2rem; }
.at-route { border: none; border-radius: 8px; padding: 0.4rem 0.9rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; background: var(--up); color: #06210f; } .at-route:hover { filter: brightness(1.08); }
.at-ask { border: 1px solid rgba(120, 160, 255, 0.45); background: rgba(120, 160, 255, 0.08); color: #93b4ff; border-radius: 8px; padding: 0.4rem 0.7rem; font-size: 0.76rem; cursor: pointer; } .at-ask:hover { background: rgba(120, 160, 255, 0.16); color: #fff; }
.at-portlink { color: var(--accent); text-decoration: none; font-size: 0.76rem; align-self: center; } .at-portlink:hover { text-decoration: underline; }
.at-deploymsg { font-size: 0.72rem; color: var(--text-2); }
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
.at-copilot { display: flex; align-items: center; gap: 0.6rem; margin: 0.5rem 0 0.4rem; padding: 0.6rem 0.9rem; background: var(--surface); border: 1px solid var(--line-2); border-radius: 12px; }
.at-copilot-glyph { color: var(--accent); font-size: 1.05rem; }
.at-copilot-input { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-size: 0.95rem; }
.at-copilot-input::placeholder { color: var(--text-3); }
.at-copilot-go { border: none; background: var(--accent); color: #17130a; border-radius: 8px; padding: 0.45rem 0.9rem; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
.at-copilot-go:disabled { opacity: 0.5; cursor: default; }
.at-copilot-hints { display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem; }
.at-copilot-try { font-size: 0.74rem; color: var(--text-3); }
.at-copilot-chip { border: 1px solid var(--line-2); background: transparent; color: var(--text-2); border-radius: 999px; padding: 0.2rem 0.6rem; font-size: 0.74rem; cursor: pointer; }
.at-copilot-chip:hover { color: var(--accent); border-color: var(--accent); }
.at-copilot-gov { margin-left: auto; font-size: 0.72rem; color: var(--text-3); }
</style>
