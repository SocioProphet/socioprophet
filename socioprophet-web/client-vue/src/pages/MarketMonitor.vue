<template>
  <section class="mk" aria-label="Market monitor">
    <!-- Toolbar + command line -->
    <header class="mk-toolbar">
      <div class="mk-title">
        <div>
          <p v-if="scope && !scope.isPrimary" class="mk-eyebrow">{{ scope.domain }}</p>
          <h1>{{ scope && !scope.isPrimary ? scope.label : 'Market Monitor' }}</h1>
        </div>
        <span class="mk-pill">fixture</span>
      </div>
      <form class="mk-cmd" @submit.prevent="runCmd">
        <span class="mk-cmd-prompt">›</span>
        <input v-model="cmd" spellcheck="false" placeholder="Type a ticker  (e.g. NVDA)" />
        <button type="submit" class="mk-cmd-go">&lt;GO&gt;</button>
      </form>
      <div class="mk-asof">{{ asOfLabel }}</div>
    </header>

    <!-- Ticker tape -->
    <div class="mk-tape" aria-label="Ticker tape">
      <button v-for="it in tape" :key="'t' + it.symbol" class="mk-tape-item" @click="pick(it)">
        <span class="mk-tape-sym">{{ it.symbol }}</span>
        <span class="mk-tape-px">{{ fmt(it) }}</span>
        <span class="mk-chg" :class="dir(it.changePct)">{{ fmtPct(it.changePct) }}</span>
      </button>
    </div>

    <!-- Index tiles -->
    <div class="mk-tiles" aria-label="Indices">
      <button v-for="ix in indices" :key="ix.symbol" class="mk-tile" :class="{ on: selected.symbol === ix.symbol }" @click="pick(ix)">
        <div class="mk-tile-top">
          <span class="mk-tile-name">{{ ix.name }}</span>
          <span class="mk-chg" :class="dir(ix.changePct)">{{ fmtPct(ix.changePct) }}</span>
        </div>
        <div class="mk-tile-val">{{ fmt(ix) }}</div>
        <svg class="mk-spark" viewBox="0 0 100 26" preserveAspectRatio="none">
          <polyline :points="points(ix.series, 100, 26)" :stroke="lineColor(ix.changePct)" fill="none" stroke-width="1.4" />
        </svg>
      </button>
    </div>

    <!-- Body: watchlist · detail -->
    <div class="mk-body">
      <!-- Watchlist -->
      <div class="mk-watch">
        <div class="mk-watch-head">
          <span>{{ scope && !scope.isPrimary ? scope.label : 'Watchlist' }}</span>
          <div v-if="classes.length > 2" class="mk-filter">
            <button v-for="c in classes" :key="c" class="mk-fbtn" :class="{ on: klass === c }" @click="setKlass(c)">{{ c }}</button>
          </div>
        </div>
        <div ref="listEl" class="mk-rows" @keydown="arrowRove($event, listEl, '.mk-row')">
          <button
            v-for="it in rows"
            :key="it.symbol"
            class="mk-row"
            :class="{ on: it.symbol === selected.symbol }"
            @click="pick(it)"
          >
            <div class="mk-sym"><b>{{ it.symbol }}</b><span>{{ it.name }}</span></div>
            <svg class="mk-spark sm" viewBox="0 0 90 24" preserveAspectRatio="none">
              <polyline :points="points(it.series, 90, 24)" :stroke="lineColor(it.changePct)" fill="none" stroke-width="1.4" />
            </svg>
            <div class="mk-px">{{ fmt(it) }}</div>
            <div class="mk-chg" :class="dir(it.changePct)">{{ fmtPct(it.changePct) }}</div>
          </button>
        </div>
      </div>

      <!-- Detail -->
      <article class="mk-detail" aria-label="Instrument detail">
        <div class="mk-d-head">
          <div>
            <div class="mk-d-sym">{{ selected.symbol }} <span class="mk-d-klass">{{ selected.klass }}</span></div>
            <div class="mk-d-name">{{ selected.name }}</div>
          </div>
          <div class="mk-d-px">
            <div class="mk-d-price">{{ fmt(selected) }}</div>
            <div class="mk-chg lg" :class="dir(selected.changePct)">{{ fmtPct(selected.changePct) }} today</div>
          </div>
        </div>

        <svg class="mk-area" viewBox="0 0 320 96" preserveAspectRatio="none" role="img" aria-label="price chart">
          <defs>
            <linearGradient :id="`g-${selected.symbol}`" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="lineColor(selected.changePct)" stop-opacity="0.35" />
              <stop offset="100%" :stop-color="lineColor(selected.changePct)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <polygon :points="areaPoints(selected.series, 320, 96)" :fill="`url(#g-${selected.symbol})`" />
          <polyline :points="points(selected.series, 320, 96)" :stroke="lineColor(selected.changePct)" fill="none" stroke-width="1.8" />
        </svg>

        <div class="mk-stats">
          <div class="mk-kv"><span>Open</span><b>{{ num(selected.open) }}</b></div>
          <div class="mk-kv"><span>Prev close</span><b>{{ num(selected.prevClose) }}</b></div>
          <div class="mk-kv"><span>Day low</span><b>{{ num(selected.dayLow) }}</b></div>
          <div class="mk-kv"><span>Day high</span><b>{{ num(selected.dayHigh) }}</b></div>
        </div>

        <div class="mk-block" v-if="selected.signals.length">
          <div class="mk-block-h">Signals</div>
          <div class="mk-sigs">
            <span v-for="(s, i) in selected.signals" :key="i" class="mk-sig" :class="s.tone">{{ s.label }}</span>
          </div>
        </div>

        <div class="mk-block" v-if="chainNodes.length">
          <div class="mk-block-h">Supply chain</div>
          <div class="mk-sc">
            <button v-for="n in chainNodes" :key="n.id" class="mk-sc-link" @click="openChain(n.id)">⛓ {{ chainName(n.chain) }} chain · {{ n.name }} →</button>
          </div>
        </div>

        <div class="mk-block">
          <div class="mk-block-h">Provenance</div>
          <div class="mk-kv wide"><span>Source</span><code>fixture · deterministic series</code></div>
          <div class="mk-kv wide"><span>As of</span><code>{{ asOfLabel }}</code></div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { navScopeForPath } from '../config/cockpitNav';
import { indices, watchlist, instrumentsForPath, asOf, type Instrument } from '../data/marketsFixture';
import { nodesForMarketSymbol, chains } from '../data/supplyChainFixture';
import { arrowRove } from '../utils/listKeys';

const route = useRoute();
const router = useRouter();
// Active DOMAIN-axis sub-domain → the real slice of instruments it surfaces
// (Equities & Preferreds → equities/preferreds, Crypto/Digital → crypto, …).
const scope = computed(() => navScopeForPath(route.path));
const subInstruments = computed<Instrument[]>(() => instrumentsForPath(route.path));
const classes = computed<string[]>(() => ['All', ...Array.from(new Set(subInstruments.value.map((i) => i.klass)))]);
const klass = ref<string>('All');
const selected = ref<Instrument>(subInstruments.value[0] ?? indices[0]!);
const listEl = ref<HTMLElement | null>(null);
const cmd = ref('');
const tape = [...indices, ...watchlist];
onMounted(() => { const sym = typeof route.query.sym === 'string' ? route.query.sym.toUpperCase() : ''; if (sym) { const hit = tape.find((i) => i.symbol === sym); if (hit) selected.value = hit; } });

const rows = computed<Instrument[]>(() => (klass.value === 'All' ? subInstruments.value : subInstruments.value.filter((i) => i.klass === klass.value)));
// Keep a valid selection + reset the class filter as the sub-domain changes.
watch(rows, (r) => { if (!r.some((i) => i.symbol === selected.value.symbol) && r[0]) selected.value = r[0]; });
watch(() => route.path, () => { klass.value = 'All'; });

function pick(it: Instrument) { selected.value = it; }
// Bloomberg-style command line: type a ticker, <GO> jumps to it.
function runCmd() {
  const q = cmd.value.trim().toUpperCase();
  if (!q) return;
  const hit = tape.find((i) => i.symbol === q) ?? tape.find((i) => i.symbol.startsWith(q)) ?? tape.find((i) => i.name.toUpperCase().includes(q));
  if (hit) { pick(hit); cmd.value = ''; }
}
function setKlass(c: string) { klass.value = c; if (!rows.value.some((r) => r.symbol === selected.value.symbol) && rows.value[0]) pick(rows.value[0]); }

// Supply-chain integration: instruments that sit on a modeled supply chain link
// into the Supply Chain surface (which links on to the graph / map / twin).
const chainNodes = computed(() => nodesForMarketSymbol(selected.value.symbol));
function chainName(cid: string): string { return chains.find((c) => c.id === cid)?.name ?? cid; }
function openChain(id: string) { router.push({ path: '/analytics/supply-chain', query: { node: id } }); }

// SVG sparkline / area point strings.
function scale(series: number[], w: number, h: number): Array<[number, number]> {
  const min = Math.min(...series); const max = Math.max(...series); const span = (max - min) || 1;
  const pad = h * 0.12;
  return series.map((v, i) => [(i / (series.length - 1)) * w, (h - pad) - ((v - min) / span) * (h - pad * 2)] as [number, number]);
}
function points(series: number[], w: number, h: number): string { return scale(series, w, h).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '); }
function areaPoints(series: number[], w: number, h: number): string { return `0,${h} ${points(series, w, h)} ${w},${h}`; }

const up = 'var(--up)'; const down = 'var(--down)'; const flat = '#8b949e';
function dir(pct: number): 'up' | 'down' | 'flat' { return pct > 0.02 ? 'up' : pct < -0.02 ? 'down' : 'flat'; }
function lineColor(pct: number): string { return pct > 0.02 ? up : pct < -0.02 ? down : flat; }

function num(v: number): string { return v.toLocaleString('en-US', { minimumFractionDigits: v < 10 ? 3 : 2, maximumFractionDigits: v < 10 ? 4 : 2 }); }
function fmt(it: Instrument): string { const p = num(it.price); return it.unit === '$' ? `$${p}` : it.unit === '%' ? `${p}%` : p; }
function fmtPct(pct: number): string { return `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`; }
const asOfLabel = new Date(asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function onKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = (e.target as HTMLElement | null)?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const list = rows.value; if (!list.length) return;
  const idx = list.findIndex((i) => i.symbol === selected.value.symbol);
  if (e.key === 'j') { e.preventDefault(); pick(list[Math.min(list.length - 1, idx + 1)] ?? list[0]!); }
  else if (e.key === 'k') { e.preventDefault(); pick(list[Math.max(0, idx < 0 ? 0 : idx - 1)] ?? list[0]!); }
}
onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.mk { height: 100%; min-height: 0; display: grid; grid-template-rows: auto auto auto 1fr; gap: 0.6rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: var(--text); }
.mk-toolbar { display: flex; align-items: center; gap: 1rem; }
.mk-title { display: flex; align-items: baseline; gap: 0.5rem; } .mk-title h1 { margin: 0; font-size: 1.2rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.mk-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.mk-pill { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.08em; color: #e3b341; background: rgba(227, 179, 65, 0.14); border-radius: 4px; padding: 0.08rem 0.3rem; }
.mk-asof { margin-left: auto; font-size: 0.72rem; color: rgba(255, 255, 255, 0.4); }
/* command line */
.mk-cmd { flex: 0 1 320px; display: flex; align-items: center; gap: 0.4rem; border: 1px solid var(--accent); border-radius: 4px; background: var(--accent-soft); padding: 0.2rem 0.5rem; }
.mk-cmd-prompt { color: var(--accent); font-weight: 700; }
.mk-cmd input { flex: 1; min-width: 0; background: transparent; border: none; outline: none; color: var(--accent-2); font-family: inherit; font-size: 0.78rem; text-transform: uppercase; } .mk-cmd input::placeholder { color: rgba(255, 160, 40, 0.5); text-transform: none; }
.mk-cmd-go { border: none; background: var(--accent); color: var(--bg); font-family: inherit; font-size: 0.66rem; font-weight: 800; border-radius: 3px; padding: 0.1rem 0.4rem; cursor: pointer; }
/* ticker tape */
.mk-tape { display: flex; align-items: stretch; gap: 0; overflow-x: auto; border: 1px solid var(--line); border-radius: 4px; background: var(--bg); }
.mk-tape-item { flex: 0 0 auto; display: inline-flex; align-items: baseline; gap: 0.4rem; border: none; border-right: 1px solid var(--line); background: transparent; color: inherit; padding: 0.3rem 0.7rem; cursor: pointer; font-family: inherit; } .mk-tape-item:hover { background: var(--accent-soft); }
.mk-tape-sym { color: var(--accent); font-weight: 700; font-size: 0.72rem; } .mk-tape-px { font-size: 0.72rem; font-variant-numeric: tabular-nums; } .mk-tape .mk-chg { font-size: 0.68rem; }

.mk-tiles { display: flex; gap: 0.6rem; overflow-x: auto; padding-bottom: 0.15rem; }
.mk-tile { flex: 0 0 auto; width: 168px; text-align: left; border: 1px solid var(--line-2); border-radius: 10px; background: var(--surface); color: inherit; padding: 0.55rem 0.65rem 0.4rem; cursor: pointer; display: grid; gap: 0.25rem; } .mk-tile:hover { border-color: rgba(255, 255, 255, 0.2); } .mk-tile.on { border-color: var(--accent); }
.mk-tile-top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.mk-tile-name { font-size: 0.72rem; color: rgba(255, 255, 255, 0.6); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mk-tile-val { font-size: 1.05rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.mk-spark { width: 100%; height: 26px; } .mk-spark.sm { width: 90px; height: 24px; }

.mk-body { min-height: 0; display: grid; grid-template-columns: minmax(420px, 1.35fr) minmax(340px, 1fr); gap: 0.75rem; }
@media (max-width: 1080px) { .mk-body { grid-template-columns: 1fr; } .mk-detail { display: none; } }

.mk-watch { min-height: 0; display: flex; flex-direction: column; border: 1px solid var(--line-2); border-radius: 12px; overflow: hidden; }
.mk-watch-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.6rem 0.85rem; border-bottom: 1px solid var(--line-2); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255, 255, 255, 0.5); }
.mk-filter { display: flex; gap: 0.2rem; }
.mk-fbtn { border: none; background: transparent; color: rgba(255, 255, 255, 0.55); border-radius: 6px; padding: 0.15rem 0.45rem; font-size: 0.68rem; text-transform: capitalize; cursor: pointer; } .mk-fbtn.on { background: rgba(255, 160, 40, 0.18); color: var(--accent); }
.mk-rows { min-height: 0; overflow-y: auto; }
.mk-row { width: 100%; display: grid; grid-template-columns: 1fr 90px 5.5rem 4.5rem; align-items: center; gap: 0.6rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.55rem 0.85rem; cursor: pointer; text-align: left; } .mk-row:hover { background: rgba(255, 255, 255, 0.03); } .mk-row.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.mk-sym { min-width: 0; display: flex; flex-direction: column; } .mk-sym b { font-size: 0.84rem; } .mk-sym span { font-size: 0.68rem; color: rgba(255, 255, 255, 0.45); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mk-px { text-align: right; font-variant-numeric: tabular-nums; font-size: 0.84rem; }
.mk-chg { font-variant-numeric: tabular-nums; font-size: 0.8rem; font-weight: 600; text-align: right; } .mk-chg.up { color: var(--up); } .mk-chg.down { color: var(--down); } .mk-chg.flat { color: #8b949e; } .mk-chg.lg { font-size: 0.9rem; }

.mk-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem; }
.mk-d-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.mk-d-sym { font-size: 1.05rem; font-weight: 700; } .mk-d-klass { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255, 255, 255, 0.5); background: rgba(255, 255, 255, 0.07); border-radius: 4px; padding: 0.05rem 0.35rem; vertical-align: middle; }
.mk-d-name { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); margin-top: 0.15rem; }
.mk-d-px { text-align: right; } .mk-d-price { font-size: 1.5rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.mk-area { width: 100%; height: 110px; margin: 0.9rem 0; }
.mk-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.4rem 1rem; }
.mk-kv { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; font-size: 0.8rem; border-bottom: 1px solid var(--line); padding: 0.3rem 0; } .mk-kv span { color: rgba(255, 255, 255, 0.45); } .mk-kv b { font-variant-numeric: tabular-nums; } .mk-kv.wide code { color: rgba(255, 255, 255, 0.7); font-family: ui-monospace, monospace; font-size: 0.72rem; }
.mk-block { margin-top: 0.9rem; border-top: 1px solid var(--line-2); padding-top: 0.8rem; }
.mk-block-h { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); margin-bottom: 0.5rem; }
.mk-sigs { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.mk-sig { font-size: 0.72rem; border-radius: 6px; padding: 0.15rem 0.5rem; border: 1px solid var(--line-2); color: rgba(255, 255, 255, 0.75); } .mk-sig.up { color: var(--up); border-color: rgba(63, 185, 80, 0.4); } .mk-sig.down { color: var(--down); border-color: rgba(248, 81, 73, 0.4); }
.mk-sc { display: flex; flex-direction: column; gap: 0.4rem; } .mk-sc-link { text-align: left; border: 1px solid var(--line-2); background: var(--surface-2); color: var(--text-2); border-radius: 8px; padding: 0.4rem 0.6rem; font-size: 0.78rem; cursor: pointer; } .mk-sc-link:hover { border-color: var(--accent); color: var(--accent); }
</style>
