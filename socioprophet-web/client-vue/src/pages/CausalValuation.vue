<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  fetchCausalValuation, recomputeCausalValuation, fetchLocations,
  type CausalValuation, type LocationsPayload, type LoadMode,
} from '../api/causalValuationApi';

const cv = ref<CausalValuation | null>(null);
const loc = ref<LocationsPayload | null>(null);
const mode = ref<LoadMode>('live');
const loading = ref(false);
const error = ref('');
const dirty = ref(false);

const overrides = ref<Record<string, number>>({});
const horizon = ref(5);
const discountPct = ref(9);
const q = ref('');
const selected = ref<string | null>(null);

async function loadAll() {
  loading.value = true; error.value = '';
  const [c, l] = await Promise.all([fetchCausalValuation('gyg'), fetchLocations('gyg', q.value)]);
  cv.value = c.data; loc.value = l.data; mode.value = c.mode;
  if (c.error) error.value = c.error;
  if (cv.value) {
    overrides.value = Object.fromEntries(cv.value.assumptions_editable.map((a) => [a.kpi, a.delta_pct]));
    horizon.value = cv.value.timeseries.horizon_years;
    discountPct.value = Math.round(cv.value.timeseries.discount_rate * 100);
  }
  dirty.value = false; loading.value = false;
}

async function recompute() {
  loading.value = true; error.value = '';
  try {
    cv.value = await recomputeCausalValuation(
      { kpi_overrides: overrides.value, horizon_years: horizon.value, discount_rate: discountPct.value / 100 }, 'gyg');
    dirty.value = false;
  } catch (e) { error.value = e instanceof Error ? e.message : String(e); }
  finally { loading.value = false; }
}

async function searchLocations() {
  const l = await fetchLocations('gyg', q.value);
  loc.value = l.data;
}

onMounted(loadAll);

function money(n: number, c = 'AUD') {
  const a = Math.abs(n);
  if (a >= 1e9) return `${c} ${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${c} ${(n / 1e6).toFixed(1)}M`;
  return `${c} ${Math.round(n).toLocaleString()}`;
}
const bounds = (p: string) => (p === 'lower_better' ? { min: -20, max: 0 } : { min: 0, max: 40 });

const nodeById = computed(() => new Map((cv.value?.causal_graph.nodes ?? []).map((n) => [n.id, n])));
const supplyNodes = computed(() => (cv.value?.causal_graph.nodes ?? []).filter((n) => n.labels.includes('SupplyChainNode')));
const causalEdges = computed(() => (cv.value?.causal_graph.edges ?? []).filter((e) => ['CAUSES', 'CONSTRAINS', 'REDUCES'].includes(e.label)));
const kpis = computed(() => [...(cv.value?.vdt.per_kpi_contribution ?? [])].sort((a, b) => b.value_contribution - a.value_contribution));
const drivers = computed(() => Object.entries(cv.value?.vdt.per_driver_uplift ?? {}).sort((a, b) => b[1] - a[1]));
const maxContribution = computed(() => Math.max(1, ...kpis.value.map((k) => k.value_contribution)));
function drivenBy(id: string) {
  return causalEdges.value.filter((e) => e.from === id).map((e) => ({ kpi: nodeById.value.get(e.to)?.properties?.name ?? e.to, mechanism: e.properties?.mechanism ?? '', relation: e.label }));
}

const periods = computed(() => cv.value?.timeseries.periods ?? []);
const maxProjected = computed(() => Math.max(1, ...periods.value.map((p) => p.projected_enterprise_value)));
const minBaseline = computed(() => cv.value?.valuation.ev_baseline ?? 0);

const LNG0 = 112.5, LNG1 = 154, LAT_TOP = -10, LAT_BOT = -44, W = 440, H = 360;
const px = (lng: number) => ((lng - LNG0) / (LNG1 - LNG0)) * W;
const py = (lat: number) => ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * H;
const AU_OUTLINE: number[][] = [
  [142.5,-10.7],[145.5,-16],[149,-21],[153,-25],[153.5,-28.2],[151,-33.9],[150,-37.5],[146,-38.9],[141,-38.4],
  [139,-35.5],[135,-34.8],[132,-32],[129,-31.7],[126,-32.3],[123,-33.9],[118,-35],[115,-34.5],[114,-28],[113.5,-24],
  [114,-22],[116,-20.5],[121,-19.5],[123,-16.5],[126,-14],[129,-15],[130.5,-12],[132,-11.5],[135,-12],[137,-16],
  [140,-17.5],[141,-16],[141.5,-13],[142.5,-10.7],
];
const outlinePoints = computed(() => AU_OUTLINE.map(([lng, lat]) => `${px(lng).toFixed(1)},${py(lat).toFixed(1)}`).join(' '));
const FORMAT_COLOR: Record<string, string> = { drive_thru: '#10b981', strip: '#3b82f6', shopping_centre: '#f59e0b' };
const dotColor = (f: string) => FORMAT_COLOR[f] ?? '#64748b';
const dotR = (ff: number) => 3 + Math.sqrt(ff) / 22;
const selectedLoc = computed(() => loc.value?.locations.find((l) => l.id === selected.value) ?? null);
</script>

<template>
  <section class="cv" aria-label="Causal Valuation">
    <header class="cv-top">
      <div>
        <p class="cv-eyebrow">Economy &amp; Industry · portfolio-manager persona</p>
        <h1 class="cv-title">{{ cv?.subject ?? 'Guzman y Gomez (ASX:GYG)' }} — causal valuation
          <span class="cv-pill" :class="mode">{{ mode }}</span>
        </h1>
        <p class="cv-sub">Supply-chain causal graph → economic-prophet value-driver tree → enterprise value. Advisory measurement of a public-sourced scenario — <strong>not investment advice</strong>.</p>
      </div>
    </header>

    <p v-if="mode === 'unavailable'" class="cv-warn">dashboard-bff unavailable ({{ error }}). Start it on the client-vue data port to load the live causal valuation.</p>

    <template v-if="cv">
      <div class="cv-metrics">
        <div class="cv-metric"><span class="cv-m-label">Enterprise value (baseline)</span><span class="cv-m-val">{{ money(cv.valuation.ev_baseline) }}</span></div>
        <div class="cv-metric up"><span class="cv-m-label">Projected EV</span><span class="cv-m-val">{{ money(cv.valuation.projected_ev) }}</span></div>
        <div class="cv-metric up"><span class="cv-m-label">Scenario uplift</span><span class="cv-m-val">+{{ money(cv.valuation.value_uplift) }}</span><span class="cv-m-sub">+{{ (cv.valuation.uplift_fraction * 100).toFixed(2) }}%</span></div>
      </div>

      <div class="cv-panel">
        <div class="cv-panel-h">
          <span>Scenario assumptions <span v-if="cv.recomputed" class="cv-tag">recomputed via engine</span></span>
          <button class="cv-btn" :class="{ primary: dirty }" :disabled="!dirty || loading" @click="recompute">{{ loading ? 'Recomputing…' : 'Recompute valuation' }}</button>
        </div>
        <p class="cv-hint">Move a lever — the value math runs in the economic-prophet engine, not the browser.</p>
        <div class="cv-controls">
          <div class="cv-ctrl">
            <div class="cv-ctrl-h"><strong>Time horizon</strong><span>{{ horizon }} years</span></div>
            <input type="range" min="1" max="10" step="1" :value="horizon" @input="horizon = Number(($event.target as HTMLInputElement).value); dirty = true" />
          </div>
          <div class="cv-ctrl">
            <div class="cv-ctrl-h"><strong>Discount rate</strong><span>{{ discountPct }}%</span></div>
            <input type="range" min="0" max="20" step="0.5" :value="discountPct" @input="discountPct = Number(($event.target as HTMLInputElement).value); dirty = true" />
          </div>
        </div>
        <div class="cv-controls">
          <div class="cv-ctrl" v-for="a in cv.assumptions_editable" :key="a.kpi">
            <div class="cv-ctrl-h"><span>{{ a.driver }} · {{ a.kpi }}</span><span>{{ overrides[a.kpi] > 0 ? '+' : '' }}{{ overrides[a.kpi] }}%</span></div>
            <input type="range" :min="bounds(a.polarity).min" :max="bounds(a.polarity).max" step="0.5" :value="overrides[a.kpi]" @input="overrides[a.kpi] = Number(($event.target as HTMLInputElement).value); dirty = true" />
          </div>
        </div>
      </div>

      <div class="cv-grid3">
        <div class="cv-card">
          <h3>1 · Supply chain → levers</h3>
          <div class="cv-sc" v-for="n in supplyNodes" :key="n.id">
            <div class="cv-sc-name">{{ n.properties.name }}</div>
            <ul><li v-for="(d, i) in drivenBy(n.id)" :key="i"><code>{{ d.relation }}</code> <strong>{{ d.kpi }}</strong> — {{ d.mechanism }}</li></ul>
          </div>
        </div>
        <div class="cv-card">
          <h3>2 · KPI contribution</h3>
          <div class="cv-kpi" v-for="k in kpis" :key="k.kpi">
            <div class="cv-kpi-h"><span>{{ k.driver }} · {{ k.kpi }}</span><span class="up">+{{ money(k.value_contribution) }}</span></div>
            <div class="cv-bar"><div :style="{ width: (k.value_contribution / maxContribution * 100) + '%' }"></div></div>
          </div>
        </div>
        <div class="cv-card">
          <h3>3 · Driver → EV</h3>
          <div class="cv-drv" v-for="[name, up] in drivers" :key="name"><span>{{ name }}</span><span class="up">+{{ money(up) }}</span></div>
          <div class="cv-drv total"><span>Enterprise value</span><span>{{ money(cv.valuation.projected_ev) }}</span></div>
        </div>
      </div>

      <div class="cv-panel">
        <div class="cv-panel-h"><span>Projected enterprise value over {{ cv.timeseries.horizon_years }} years</span>
          <span class="cv-hint">terminal <strong>{{ money(cv.timeseries.terminal_projected_enterprise_value) }}</strong> · PV @ {{ (cv.timeseries.discount_rate*100).toFixed(1) }}% <strong>{{ money(cv.timeseries.present_value_of_uplift) }}</strong></span>
        </div>
        <div class="cv-traj">
          <div class="cv-traj-col" v-for="p in periods" :key="p.year">
            <div class="cv-traj-v">{{ money(p.projected_enterprise_value) }}</div>
            <div class="cv-traj-bar" :style="{ height: ((p.projected_enterprise_value - minBaseline*0.98) / (maxProjected - minBaseline*0.98) * 100) + '%' }"></div>
            <div class="cv-traj-y">y{{ p.year }}</div>
          </div>
        </div>
      </div>

      <div class="cv-panel" v-if="loc">
        <div class="cv-panel-h"><span>Location intelligence — org digital twin ({{ loc.sample_size }} of {{ loc.network_totals.total_au_restaurants }})</span>
          <span class="cv-legend"><i style="background:#10b981"></i>drive-thru <i style="background:#3b82f6"></i>strip <i style="background:#f59e0b"></i>centre</span>
        </div>
        <div class="cv-search">
          <input v-model="q" @keyup.enter="searchLocations" placeholder="Search suburb, state, or format (e.g. coast, VIC, drive_thru)" />
          <button class="cv-btn" @click="searchLocations">Search</button>
        </div>
        <div class="cv-grid2">
          <div class="cv-card">
            <svg :viewBox="`0 0 ${W} ${H}`" class="cv-map">
              <polygon :points="outlinePoints" fill="#eef2f7" stroke="#cbd5e1" stroke-width="1" />
              <circle v-for="l in loc.locations" :key="l.id" :cx="px(l.lng)" :cy="py(l.lat)" :r="dotR(l.modeled_weekly_footfall)"
                :fill="dotColor(l.format)" :fill-opacity="selected===l.id ? 1 : 0.72" :stroke="selected===l.id ? '#0f172a' : 'white'" :stroke-width="selected===l.id ? 2 : 1"
                style="cursor:pointer" @click="selected = l.id" />
            </svg>
            <p class="cv-hint">Dot size ∝ modeled weekly footfall · click a dot for detail · coordinates approximate.</p>
          </div>
          <div class="cv-card">
            <div class="cv-twin">
              <div><span class="cv-m-label">Modeled annual sales</span><span class="cv-m-val">{{ money(loc.org_twin.sample_modeled_annual_sales_aud) }}</span></div>
              <div><span class="cv-m-label">Modeled weekly footfall</span><span class="cv-m-val">{{ loc.org_twin.sample_modeled_weekly_footfall.toLocaleString() }}</span></div>
            </div>
            <div class="cv-states"><span v-for="(n, s) in loc.org_twin.by_state" :key="s">{{ s }} · {{ n }}</span></div>
            <p class="cv-hint">{{ loc.org_twin.network_extrapolation_note }}</p>
            <div v-if="selectedLoc" class="cv-locsel">
              <strong>{{ selectedLoc.suburb }}</strong> · {{ selectedLoc.state }} · {{ selectedLoc.format.replace('_',' ') }} · {{ selectedLoc.ownership }}
              <div class="cv-twin">
                <div><span class="cv-m-label">Modeled annual sales</span><span class="cv-m-val">{{ money(selectedLoc.est_annual_sales_aud) }}</span></div>
                <div><span class="cv-m-label">Weekly footfall</span><span class="cv-m-val">{{ selectedLoc.modeled_weekly_footfall.toLocaleString() }}</span></div>
              </div>
              <p class="cv-hint">{{ selectedLoc.catchment_profile }} — basis: {{ selectedLoc.basis }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="cv-panel governance">
        <div class="cv-panel-h"><span>Provenance &amp; measurement boundary</span></div>
        <p class="cv-hint">Data: <code>{{ cv.vdt.epistemic_status.level }}</code> · confidence {{ cv.vdt.epistemic_status.confidence }} · engine <code>{{ cv.provenance.engine }}</code>. Advisory measurement of a scenario — not a recommendation, target price, or valuation opinion.</p>
        <ul class="cv-lims"><li v-for="lim in cv.vdt.limitations" :key="lim">{{ lim }}</li></ul>
      </div>
    </template>
  </section>
</template>

<style scoped>
.cv { padding: 1rem 1.25rem; max-width: 1100px; font-family: ui-sans-serif, system-ui; }
.cv-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; opacity: .6; margin: 0; }
.cv-title { font-size: 1.4rem; font-weight: 700; margin: .25rem 0; display: flex; align-items: center; gap: .5rem; }
.cv-sub { margin: 0; opacity: .78; max-width: 820px; }
.cv-pill { font-size: .7rem; padding: .1rem .5rem; border-radius: 999px; border: 1px solid #cbd5e1; text-transform: uppercase; }
.cv-pill.live { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
.cv-pill.unavailable { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
.cv-warn { border: 1px solid #fecaca; background: #fef2f2; color: #991b1b; border-radius: 10px; padding: .75rem; }
.cv-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: .75rem; margin: 1rem 0; }
.cv-metric { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: .85rem; display: flex; flex-direction: column; }
.cv-m-label { font-size: .72rem; opacity: .6; text-transform: uppercase; letter-spacing: .04em; }
.cv-m-val { font-size: 1.35rem; font-weight: 700; }
.cv-metric.up .cv-m-val, .up { color: #065f46; }
.cv-m-sub { font-size: .85rem; opacity: .7; }
.cv-panel { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: .85rem; margin-bottom: 1rem; }
.cv-panel-h { display: flex; justify-content: space-between; align-items: center; gap: .5rem; flex-wrap: wrap; font-weight: 600; }
.cv-tag { font-size: .7rem; font-weight: 600; color: #065f46; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 999px; padding: .1rem .5rem; }
.cv-hint { font-size: .8rem; opacity: .6; margin: .35rem 0; font-weight: 400; }
.cv-controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: .5rem 1.25rem; margin-top: .5rem; }
.cv-ctrl-h { display: flex; justify-content: space-between; font-size: .82rem; }
.cv-ctrl input { width: 100%; }
.cv-btn { padding: .4rem .8rem; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; cursor: pointer; }
.cv-btn.primary { background: #10b981; border-color: #10b981; color: #fff; }
.cv-btn:disabled { opacity: .5; cursor: default; }
.cv-grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.cv-grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.cv-card { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: .85rem; }
.cv-card h3 { margin: 0 0 .5rem; font-size: 1rem; }
.cv-sc { border: 1px solid #eef2f7; border-radius: 10px; padding: .5rem; margin: .45rem 0; }
.cv-sc-name { font-weight: 650; }
.cv-sc ul { margin: .35rem 0 0; padding-left: 1rem; font-size: .82rem; }
.cv-sc code, .cv-sc-name code { font-size: .72rem; background: #f1f5f9; padding: .05rem .3rem; border-radius: 4px; }
.cv-kpi { margin: .5rem 0; }
.cv-kpi-h { display: flex; justify-content: space-between; font-size: .85rem; }
.cv-bar { height: 8px; background: #eef2f7; border-radius: 6px; margin-top: .25rem; overflow: hidden; }
.cv-bar div { height: 100%; background: #10b981; }
.cv-drv { display: flex; justify-content: space-between; padding: .5rem; border: 1px solid #eef2f7; border-radius: 10px; margin: .35rem 0; }
.cv-drv.total { background: #ecfdf5; border-color: #a7f3d0; font-weight: 750; }
.cv-traj { display: flex; align-items: flex-end; gap: .5rem; height: 130px; margin-top: 1rem; }
.cv-traj-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
.cv-traj-v { font-size: .7rem; font-weight: 600; color: #065f46; }
.cv-traj-bar { width: 100%; max-width: 46px; background: #10b981; border-radius: 6px 6px 0 0; min-height: 4px; margin-top: .2rem; }
.cv-traj-y { font-size: .74rem; opacity: .6; margin-top: .25rem; }
.cv-search { display: flex; gap: .5rem; margin: .5rem 0; }
.cv-search input { flex: 1; padding: .45rem .7rem; border: 1px solid #cbd5e1; border-radius: 8px; }
.cv-legend { font-size: .72rem; display: flex; gap: .6rem; align-items: center; font-weight: 400; }
.cv-legend i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 2px; }
.cv-map { width: 100%; height: auto; }
.cv-twin { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
.cv-states { display: flex; flex-wrap: wrap; gap: .35rem; margin: .6rem 0; }
.cv-states span { font-size: .78rem; padding: .15rem .5rem; border: 1px solid #e2e8f0; border-radius: 999px; }
.cv-locsel { border-top: 1px solid #eef2f7; margin-top: .6rem; padding-top: .6rem; }
.cv-lims { margin: .25rem 0 0; padding-left: 1rem; font-size: .82rem; opacity: .8; }
</style>
