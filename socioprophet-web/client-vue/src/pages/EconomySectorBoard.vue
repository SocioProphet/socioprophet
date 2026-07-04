<template>
  <section class="ec" aria-label="Economy sector board">
    <header class="ec-toolbar">
      <div class="ec-title">
        <div>
          <p v-if="scope && !scope.isPrimary" class="ec-eyebrow">{{ scope.domain }}</p>
          <h1 v-if="scope && !scope.isPrimary">{{ scope.label }}</h1>
          <h1 v-else>Macro &amp; Sectors</h1>
        </div>
        <span class="ec-pill">fixture</span>
      </div>
      <form class="term-cmd" @submit.prevent="runCmd">
        <span class="term-cmd-prompt">›</span>
        <input v-model="cmd" spellcheck="false" placeholder="Jump to indicator or sector (e.g. CPI, Energy)" />
        <button type="submit" class="term-cmd-go">&lt;GO&gt;</button>
      </form>
      <div class="ec-asof">{{ asOfLabel }}</div>
    </header>

    <!-- KPI indicator tiles -->
    <div class="ec-kpis" aria-label="Macro indicators" @keydown="arrowRove($event, $event.currentTarget, '.ec-kpi', 'h')">
      <button v-for="k in indicators" :key="k.id" class="ec-kpi" :class="{ on: sel.kind === 'indicator' && sel.id === k.id }" @click="pickIndicator(k)">
        <div class="ec-kpi-top">
          <span class="ec-kpi-name">{{ k.name }}</span>
          <span class="ec-chg" :class="indTone(k)">{{ signed(k.changeAbs) }}{{ k.unit === '%' ? 'pp' : '' }}</span>
        </div>
        <div class="ec-kpi-val">{{ k.value }}<span class="ec-unit">{{ k.unit }}</span></div>
        <svg class="ec-spark" viewBox="0 0 100 24" preserveAspectRatio="none"><polyline :points="sp(k.series, 100, 24)" :stroke="toneColor(indTone(k))" fill="none" stroke-width="1.4" /></svg>
      </button>
    </div>

    <!-- Body: sector board · detail -->
    <div class="ec-body">
      <div class="ec-board">
        <div class="ec-board-head">Sector board <span>breadth · momentum</span></div>
        <div class="ec-grid" @keydown="arrowRove($event, $event.currentTarget, '.ec-sector', 'both')">
          <button
            v-for="s in sectors"
            :key="s.id"
            class="ec-sector"
            :class="{ on: sel.kind === 'sector' && sel.id === s.id }"
            :style="{ borderLeftColor: toneColor(dir(s.changePct)) }"
            @click="pickSector(s)"
          >
            <div class="ec-sec-top">
              <span class="ec-sec-name">{{ s.name }}</span>
              <span class="ec-chg" :class="dir(s.changePct)">{{ signed(s.changePct) }}%</span>
            </div>
            <svg class="ec-spark" viewBox="0 0 100 22" preserveAspectRatio="none"><polyline :points="sp(s.series, 100, 22)" :stroke="toneColor(dir(s.changePct))" fill="none" stroke-width="1.3" /></svg>
            <div class="ec-breadth" :title="`${s.breadth}% of constituents in uptrend`">
              <div class="ec-breadth-fill" :style="{ width: s.breadth + '%', background: breadthColor(s.breadth) }" />
            </div>
          </button>
        </div>
      </div>

      <!-- Detail -->
      <article class="ec-detail" aria-label="Detail">
        <template v-if="detail">
          <div class="ec-d-head">
            <div>
              <div class="ec-d-name">{{ detail.name }}</div>
              <div class="ec-d-kind">{{ sel.kind === 'sector' ? 'Sector' : 'Macro indicator' }}</div>
            </div>
            <div class="ec-d-val">
              <div class="ec-d-num">{{ detailValue }}</div>
              <div class="ec-chg lg" :class="detailTone">{{ detailChange }}</div>
            </div>
          </div>

          <svg class="ec-area" viewBox="0 0 320 90" preserveAspectRatio="none" role="img" aria-label="trend">
            <defs>
              <linearGradient :id="`ecg-${sel.id}`" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="toneColor(detailTone)" stop-opacity="0.32" />
                <stop offset="100%" :stop-color="toneColor(detailTone)" stop-opacity="0" />
              </linearGradient>
            </defs>
            <polygon :points="ar(detail.series, 320, 90)" :fill="`url(#ecg-${sel.id})`" />
            <polyline :points="sp(detail.series, 320, 90)" :stroke="toneColor(detailTone)" fill="none" stroke-width="1.8" />
          </svg>

          <template v-if="sel.kind === 'sector' && selectedSector">
            <div class="ec-block">
              <div class="ec-block-h">Breadth</div>
              <div class="ec-breadth big"><div class="ec-breadth-fill" :style="{ width: selectedSector.breadth + '%', background: breadthColor(selectedSector.breadth) }" /></div>
              <div class="ec-breadth-cap">{{ selectedSector.breadth }}% of constituents in uptrend</div>
            </div>
            <div class="ec-block">
              <div class="ec-block-h">Signals</div>
              <div class="ec-sigs"><span v-for="(g, i) in selectedSector.signals" :key="i" class="ec-sig" :class="g.tone">{{ g.label }}</span></div>
            </div>
          </template>
          <template v-else-if="selectedIndicator">
            <div class="ec-block">
              <div class="ec-block-h">Read</div>
              <p class="ec-note">{{ selectedIndicator.note }}</p>
              <div class="ec-kv"><span>Objective</span><b>{{ selectedIndicator.better === 'higher' ? 'higher is better' : 'lower is better' }}</b></div>
            </div>
          </template>

          <div class="ec-block">
            <div class="ec-block-h">Provenance</div>
            <div class="ec-kv wide"><span>Source</span><code>fixture · deterministic series</code></div>
            <div class="ec-kv wide"><span>As of</span><code>{{ asOfLabel }}</code></div>
          </div>
        </template>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { indicators, sectors, asOf, type Indicator, type Sector } from '../data/economyFixture';
import { sparkPoints, areaPoints } from '../utils/sparkline';
import { navScopeForPath } from '../config/cockpitNav';
import { arrowRove } from '../utils/listKeys';

const sp = sparkPoints;
const ar = areaPoints;

const sel = ref<{ kind: 'sector' | 'indicator'; id: string }>({ kind: 'sector', id: sectors[0]!.id });
const cmd = ref('');
const route = useRoute();
// Active Economy & Industry sub-domain shown as the board's lens.
const scope = computed(() => navScopeForPath(route.path));
onMounted(() => {
  const id = typeof route.query.k === 'string' ? route.query.k : '';
  const kind = route.query.kind === 'indicator' ? 'indicator' : 'sector';
  if (id && (kind === 'indicator' ? indicators : sectors).some((x) => x.id === id)) sel.value = { kind, id };
});
function pickSector(s: Sector) { sel.value = { kind: 'sector', id: s.id }; }
function pickIndicator(k: Indicator) { sel.value = { kind: 'indicator', id: k.id }; }
function runCmd() {
  const q = cmd.value.trim().toLowerCase();
  if (!q) return;
  const ind = indicators.find((k) => k.id === q || k.name.toLowerCase().includes(q));
  if (ind) { pickIndicator(ind); cmd.value = ''; return; }
  const sec = sectors.find((s) => s.id === q || s.name.toLowerCase().includes(q));
  if (sec) { pickSector(sec); cmd.value = ''; }
}

const selectedSector = computed(() => (sel.value.kind === 'sector' ? sectors.find((s) => s.id === sel.value.id) : undefined));
const selectedIndicator = computed(() => (sel.value.kind === 'indicator' ? indicators.find((k) => k.id === sel.value.id) : undefined));
const detail = computed<Sector | Indicator | undefined>(() => selectedSector.value ?? selectedIndicator.value);

const up = 'var(--up)'; const down = 'var(--down)'; const flat = '#8b949e';
function dir(pct: number): 'up' | 'down' | 'flat' { return pct > 0.05 ? 'up' : pct < -0.05 ? 'down' : 'flat'; }
// Macro semantics: "good" depends on whether higher or lower is desirable.
function indTone(k: Indicator): 'up' | 'down' | 'flat' {
  if (Math.abs(k.changeAbs) < 1e-9) return 'flat';
  const good = (k.better === 'higher' && k.changeAbs > 0) || (k.better === 'lower' && k.changeAbs < 0);
  return good ? 'up' : 'down';
}
function toneColor(t: string): string { return t === 'up' ? up : t === 'down' ? down : flat; }
function breadthColor(b: number): string { return b >= 60 ? up : b >= 45 ? '#e3b341' : down; }
function signed(v: number): string { return `${v > 0 ? '+' : ''}${v}`; }

const detailTone = computed(() => (selectedSector.value ? dir(selectedSector.value.changePct) : selectedIndicator.value ? indTone(selectedIndicator.value) : 'flat'));
const detailValue = computed(() => (selectedSector.value ? `${selectedSector.value.breadth}%` : selectedIndicator.value ? `${selectedIndicator.value.value}${selectedIndicator.value.unit}` : ''));
const detailChange = computed(() => {
  if (selectedSector.value) return `${signed(selectedSector.value.changePct)}% · breadth`;
  if (selectedIndicator.value) return `${signed(selectedIndicator.value.changeAbs)}${selectedIndicator.value.unit === '%' ? 'pp' : ''} vs prior`;
  return '';
});
const asOfLabel = new Date(asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
</script>

<style scoped>
.ec { height: 100%; min-height: 0; display: grid; grid-template-rows: auto auto 1fr; gap: 0.75rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: rgba(255, 255, 255, 0.9); }
.ec-toolbar { display: flex; align-items: center; justify-content: space-between; }
.ec-title { display: flex; align-items: baseline; gap: 0.6rem; } .ec-title h1 { margin: 0; font-size: 1.2rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.ec-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.ec-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: #e3b341; background: rgba(227, 179, 65, 0.14); border-radius: 5px; padding: 0.1rem 0.35rem; }
.ec-asof { font-size: 0.74rem; color: rgba(255, 255, 255, 0.45); }

.ec-kpis { display: flex; gap: 0.6rem; overflow-x: auto; padding-bottom: 0.15rem; }
.ec-kpi { flex: 0 0 auto; width: 176px; text-align: left; border: 1px solid var(--line-2); border-radius: 10px; background: var(--surface); color: inherit; padding: 0.55rem 0.65rem 0.4rem; cursor: pointer; display: grid; gap: 0.2rem; } .ec-kpi:hover { border-color: rgba(255, 255, 255, 0.2); } .ec-kpi.on { border-color: var(--accent); }
.ec-kpi-top { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; }
.ec-kpi-name { font-size: 0.68rem; color: rgba(255, 255, 255, 0.55); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ec-kpi-val { font-size: 1.15rem; font-weight: 700; font-variant-numeric: tabular-nums; } .ec-unit { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); margin-left: 1px; }
.ec-spark { width: 100%; height: 24px; }
.ec-chg { font-variant-numeric: tabular-nums; font-size: 0.78rem; font-weight: 600; } .ec-chg.up { color: var(--up); } .ec-chg.down { color: var(--down); } .ec-chg.flat { color: #8b949e; } .ec-chg.lg { font-size: 0.85rem; }

.ec-body { min-height: 0; display: grid; grid-template-columns: minmax(440px, 1.4fr) minmax(320px, 1fr); gap: 0.75rem; }
@media (max-width: 1080px) { .ec-body { grid-template-columns: 1fr; } .ec-detail { display: none; } }

.ec-board { min-height: 0; display: flex; flex-direction: column; border: 1px solid var(--line-2); border-radius: 12px; overflow: hidden; }
.ec-board-head { display: flex; align-items: baseline; justify-content: space-between; padding: 0.6rem 0.85rem; border-bottom: 1px solid var(--line-2); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255, 255, 255, 0.5); } .ec-board-head span { font-size: 0.6rem; color: rgba(255, 255, 255, 0.35); }
.ec-grid { min-height: 0; overflow-y: auto; padding: 0.6rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5rem; align-content: start; }
.ec-sector { text-align: left; border: 1px solid var(--line-2); border-left: 3px solid #8b949e; border-radius: 8px; background: var(--surface); color: inherit; padding: 0.5rem 0.6rem; cursor: pointer; display: grid; gap: 0.3rem; } .ec-sector:hover { border-top-color: rgba(255, 255, 255, 0.2); } .ec-sector.on { box-shadow: 0 0 0 1px var(--accent); }
.ec-sec-top { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; } .ec-sec-name { font-size: 0.8rem; font-weight: 600; }
.ec-breadth { height: 5px; border-radius: 3px; background: rgba(255, 255, 255, 0.08); overflow: hidden; } .ec-breadth.big { height: 9px; }
.ec-breadth-fill { height: 100%; border-radius: 3px; }

.ec-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem; }
.ec-d-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.ec-d-name { font-size: 1.1rem; font-weight: 700; } .ec-d-kind { font-size: 0.72rem; color: rgba(255, 255, 255, 0.5); margin-top: 0.15rem; }
.ec-d-val { text-align: right; } .ec-d-num { font-size: 1.5rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.ec-area { width: 100%; height: 100px; margin: 0.9rem 0; }
.ec-block { margin-top: 0.9rem; border-top: 1px solid var(--line-2); padding-top: 0.8rem; }
.ec-block-h { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); margin-bottom: 0.5rem; }
.ec-breadth-cap { font-size: 0.72rem; color: rgba(255, 255, 255, 0.5); margin-top: 0.4rem; }
.ec-note { margin: 0 0 0.5rem; font-size: 0.85rem; line-height: 1.55; color: rgba(255, 255, 255, 0.8); }
.ec-sigs { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.ec-sig { font-size: 0.72rem; border-radius: 6px; padding: 0.15rem 0.5rem; border: 1px solid var(--line-2); color: rgba(255, 255, 255, 0.75); } .ec-sig.up { color: var(--up); border-color: rgba(63, 185, 80, 0.4); } .ec-sig.down { color: var(--down); border-color: rgba(248, 81, 73, 0.4); }
.ec-kv { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; font-size: 0.8rem; padding: 0.2rem 0; } .ec-kv span { color: rgba(255, 255, 255, 0.45); } .ec-kv.wide code { color: rgba(255, 255, 255, 0.7); font-family: ui-monospace, monospace; font-size: 0.72rem; }
</style>
