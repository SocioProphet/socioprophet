<template>
  <section class="wx" aria-label="Weather monitor">
    <header class="wx-toolbar">
      <div class="wx-title"><h1>Weather &amp; Resources</h1><span class="wx-pill">fixture</span></div>
      <form class="term-cmd" @submit.prevent="runCmd">
        <span class="term-cmd-prompt">›</span>
        <input v-model="cmd" spellcheck="false" placeholder="Jump to a region (e.g. Stockholm)" />
        <button type="submit" class="term-cmd-go">&lt;GO&gt;</button>
      </form>
      <div class="wx-asof">{{ asOfLabel }}</div>
    </header>

    <!-- Region tiles -->
    <div class="wx-tiles" aria-label="Regions">
      <button v-for="r in regions" :key="r.id" class="wx-tile" :class="{ on: selected.id === r.id }" @click="selected = r">
        <div class="wx-tile-top"><span class="wx-glyph" :style="{ color: cm(r.cond).color }">{{ cm(r.cond).glyph }}</span><span class="wx-tile-name">{{ r.name }}</span></div>
        <div class="wx-tile-temp">{{ r.tempF }}°<span class="wx-chg" :class="r.changeF >= 0 ? 'up' : 'down'">{{ r.changeF >= 0 ? '+' : '' }}{{ r.changeF }}°</span></div>
        <div class="wx-tile-cond">{{ cm(r.cond).label }}</div>
      </button>
    </div>

    <div class="wx-body">
      <!-- Region detail + forecast timeline -->
      <article class="wx-detail" aria-label="Region detail">
        <div class="wx-d-head">
          <div>
            <div class="wx-d-name">{{ selected.name }} <span class="wx-d-country">{{ selected.country }}</span></div>
            <div class="wx-d-cond"><span class="wx-glyph" :style="{ color: cm(selected.cond).color }">{{ cm(selected.cond).glyph }}</span> {{ cm(selected.cond).label }}</div>
          </div>
          <div class="wx-d-temp">{{ selected.tempF }}°<span class="wx-chg lg" :class="selected.changeF >= 0 ? 'up' : 'down'">{{ selected.changeF >= 0 ? '+' : '' }}{{ selected.changeF }}° vs yest.</span></div>
        </div>

        <div class="wx-stats">
          <div class="wx-kv"><span>Wind</span><b>{{ selected.windMph }} mph</b></div>
          <div class="wx-kv"><span>Humidity</span><b>{{ selected.humidity }}%</b></div>
          <div class="wx-kv"><span>Alerts</span><b :class="{ warn: regionAlerts.length }">{{ regionAlerts.length }}</b></div>
        </div>

        <div class="wx-block">
          <div class="wx-block-h">7-day high <span class="wx-legend">°F</span></div>
          <svg class="wx-area" viewBox="0 0 320 80" preserveAspectRatio="none" role="img" aria-label="forecast">
            <defs>
              <linearGradient id="wxg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--accent)" stop-opacity="0.3" /><stop offset="100%" stop-color="var(--accent)" stop-opacity="0" /></linearGradient>
            </defs>
            <polygon :points="areaPoints(hiSeries, 320, 80)" fill="url(#wxg)" />
            <polyline :points="sparkPoints(hiSeries, 320, 80)" stroke="var(--accent)" fill="none" stroke-width="1.8" />
          </svg>
        </div>

        <div class="wx-block">
          <div class="wx-block-h">Forecast</div>
          <div class="wx-days">
            <div v-for="d in selected.forecast" :key="d.day" class="wx-day">
              <span class="wx-day-name">{{ d.day }}</span>
              <span class="wx-glyph sm" :style="{ color: cm(d.cond).color }">{{ cm(d.cond).glyph }}</span>
              <span class="wx-hi">{{ d.hi }}°</span><span class="wx-lo">{{ d.lo }}°</span>
              <span class="wx-precip" :style="{ opacity: 0.3 + d.precip / 143 }">💧{{ d.precip }}%</span>
            </div>
          </div>
        </div>
      </article>

      <!-- Alerts board -->
      <aside class="wx-alerts" aria-label="Alerts">
        <div class="wx-alerts-h">Active alerts <span>{{ alerts.length }}</span></div>
        <div class="wx-alert-list">
          <button v-for="a in sortedAlerts" :key="a.id" class="wx-alert" :class="{ on: a.regionId === selected.id }" @click="jumpTo(a.regionId)">
            <div class="wx-alert-top">
              <span class="wx-sev" :class="a.severity">{{ a.severity }}</span>
              <span class="wx-alert-type">{{ a.type }}</span>
              <span v-if="a.resource" class="wx-res">{{ a.resource }}</span>
              <span class="wx-alert-region">{{ regionName(a.regionId) }}</span>
            </div>
            <div class="wx-alert-head">{{ a.headline }}</div>
            <div class="wx-alert-until">{{ a.until }}</div>
          </button>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { regions, alerts, asOf, type Region, type Condition } from '../data/weatherFixture';
import { sparkPoints, areaPoints } from '../utils/sparkline';

const selected = ref<Region>(regions[0]!);
const cmd = ref('');

const hiSeries = computed(() => selected.value.forecast.map((d) => d.hi));
const regionAlerts = computed(() => alerts.filter((a) => a.regionId === selected.value.id));
const sev = { warning: 0, watch: 1, advisory: 2 } as const;
const sortedAlerts = computed(() => [...alerts].sort((a, b) => (a.regionId === selected.value.id ? -1 : b.regionId === selected.value.id ? 1 : sev[a.severity] - sev[b.severity])));

const byId = new Map(regions.map((r) => [r.id, r]));
const regionName = (id: string) => byId.get(id)?.name ?? id;
function jumpTo(id: string) { const r = byId.get(id); if (r) selected.value = r; }
function runCmd() {
  const q = cmd.value.trim().toLowerCase();
  if (!q) return;
  const hit = regions.find((r) => r.name.toLowerCase() === q) ?? regions.find((r) => r.name.toLowerCase().includes(q));
  if (hit) { selected.value = hit; cmd.value = ''; }
}

const CONDS: Record<Condition, { glyph: string; label: string; color: string }> = {
  sun: { glyph: '☀', label: 'Sunny', color: '#ffd166' },
  cloud: { glyph: '☁', label: 'Cloudy', color: '#8b949e' },
  rain: { glyph: '🌧', label: 'Rain', color: '#4aa3ff' },
  storm: { glyph: '⛈', label: 'Storms', color: '#c58af9' },
  snow: { glyph: '❄', label: 'Snow', color: '#a5d8ff' },
  heat: { glyph: '🌡', label: 'Heat', color: 'var(--down)' },
};
const cm = (c: Condition) => CONDS[c];
const asOfLabel = new Date(asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
</script>

<style scoped>
.wx { height: 100%; min-height: 0; display: grid; grid-template-rows: auto auto 1fr; gap: 0.6rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: rgba(255, 255, 255, 0.9); }
.wx-toolbar { display: flex; align-items: center; gap: 1rem; }
.wx-title { display: flex; align-items: baseline; gap: 0.5rem; } .wx-title h1 { margin: 0; font-size: 1.2rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.wx-pill { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.08em; color: #e3b341; background: rgba(227, 179, 65, 0.14); border-radius: 4px; padding: 0.08rem 0.3rem; }
.wx-asof { margin-left: auto; font-size: 0.72rem; color: rgba(255, 255, 255, 0.4); }

.wx-tiles { display: flex; gap: 0.6rem; overflow-x: auto; padding-bottom: 0.15rem; }
.wx-tile { flex: 0 0 auto; width: 150px; text-align: left; border: 1px solid var(--line-2); border-radius: 10px; background: var(--surface); color: inherit; padding: 0.55rem 0.7rem; cursor: pointer; display: grid; gap: 0.2rem; } .wx-tile:hover { border-color: rgba(255, 255, 255, 0.2); } .wx-tile.on { border-color: var(--accent); }
.wx-tile-top { display: flex; align-items: center; gap: 0.4rem; } .wx-glyph { font-size: 1rem; } .wx-glyph.sm { font-size: 0.85rem; }
.wx-tile-name { font-size: 0.78rem; color: rgba(255, 255, 255, 0.75); }
.wx-tile-temp { font-size: 1.4rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.wx-tile-cond { font-size: 0.68rem; color: rgba(255, 255, 255, 0.45); }
.wx-chg { font-size: 0.72rem; font-weight: 600; margin-left: 0.4rem; font-variant-numeric: tabular-nums; } .wx-chg.up { color: var(--down); } .wx-chg.down { color: #4aa3ff; } .wx-chg.lg { font-size: 0.78rem; }

.wx-body { min-height: 0; display: grid; grid-template-columns: minmax(420px, 1.5fr) minmax(300px, 1fr); gap: 0.75rem; }
@media (max-width: 1080px) { .wx-body { grid-template-columns: 1fr; } .wx-alerts { display: none; } }

.wx-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem; }
.wx-d-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.wx-d-name { font-size: 1.15rem; font-weight: 700; } .wx-d-country { font-size: 0.6rem; text-transform: uppercase; color: rgba(255, 255, 255, 0.5); background: rgba(255, 255, 255, 0.07); border-radius: 4px; padding: 0.05rem 0.35rem; vertical-align: middle; }
.wx-d-cond { font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); margin-top: 0.2rem; }
.wx-d-temp { text-align: right; font-size: 2rem; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; }
.wx-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-top: 0.9rem; }
.wx-kv { display: flex; align-items: baseline; justify-content: space-between; gap: 0.4rem; font-size: 0.8rem; border-bottom: 1px solid var(--line); padding: 0.3rem 0; } .wx-kv span { color: rgba(255, 255, 255, 0.45); } .wx-kv b { font-variant-numeric: tabular-nums; } .wx-kv b.warn { color: #f0883e; }
.wx-block { margin-top: 0.9rem; border-top: 1px solid var(--line-2); padding-top: 0.8rem; }
.wx-block-h { display: flex; justify-content: space-between; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); margin-bottom: 0.5rem; } .wx-legend { color: rgba(255, 255, 255, 0.3); }
.wx-area { width: 100%; height: 90px; }
.wx-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.3rem; }
.wx-day { display: grid; justify-items: center; gap: 0.2rem; padding: 0.4rem 0.15rem; border: 1px solid var(--line); border-radius: 8px; }
.wx-day-name { font-size: 0.64rem; color: rgba(255, 255, 255, 0.5); } .wx-hi { font-size: 0.82rem; font-weight: 700; font-variant-numeric: tabular-nums; } .wx-lo { font-size: 0.68rem; color: rgba(255, 255, 255, 0.4); font-variant-numeric: tabular-nums; }
.wx-precip { font-size: 0.58rem; color: #4aa3ff; white-space: nowrap; }

.wx-alerts { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 0.5rem; }
.wx-alerts-h { display: flex; justify-content: space-between; font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.45); padding: 0.35rem 0.5rem; } .wx-alerts-h span { color: #f0883e; }
.wx-alert-list { display: grid; gap: 0.35rem; }
.wx-alert { text-align: left; border: 1px solid var(--line-2); border-radius: 8px; background: var(--surface); color: inherit; padding: 0.5rem 0.6rem; cursor: pointer; display: grid; gap: 0.25rem; } .wx-alert:hover { border-color: rgba(255, 255, 255, 0.2); } .wx-alert.on { box-shadow: 0 0 0 1px var(--accent); }
.wx-alert-top { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.wx-sev { font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 800; border-radius: 4px; padding: 0.05rem 0.35rem; } .wx-sev.advisory { color: #4aa3ff; background: rgba(74, 163, 255, 0.16); } .wx-sev.watch { color: #f0883e; background: rgba(240, 136, 62, 0.16); } .wx-sev.warning { color: var(--down); background: rgba(248, 81, 73, 0.18); }
.wx-alert-type { font-size: 0.76rem; font-weight: 600; } .wx-res { font-size: 0.56rem; text-transform: uppercase; color: var(--up); border: 1px solid rgba(63, 185, 80, 0.4); border-radius: 4px; padding: 0.02rem 0.3rem; } .wx-alert-region { margin-left: auto; font-size: 0.68rem; color: rgba(255, 255, 255, 0.45); }
.wx-alert-head { font-size: 0.78rem; color: rgba(255, 255, 255, 0.75); line-height: 1.4; } .wx-alert-until { font-size: 0.66rem; color: rgba(255, 255, 255, 0.4); }
</style>
