<template>
  <section class="vdt" aria-label="Value Driver Tree">
    <header class="vdt-top">
      <div class="vdt-title">
        <div>
          <p class="vdt-eyebrow">Economy &amp; Industry</p>
          <h1>Value Drivers</h1>
        </div>
        <span class="vdt-pill" :class="mode" :title="mode === 'live' ? 'Served live from economic-prophet via dashboard-bff /v1/vdt' : 'dashboard-bff unavailable — rendering the local fixture (same engine math)'">{{ mode }}</span>
        <span class="vdt-ind">{{ industry }}</span>
      </div>
      <div class="vdt-metrics">
        <div class="vdt-metric"><span class="vdt-m-label">Enterprise value</span><span class="vdt-m-val">{{ money(evBaseline) }}</span></div>
        <div class="vdt-metric up"><span class="vdt-m-label">Projected uplift</span><span class="vdt-m-val">+{{ money(c.totalUplift) }}</span><span class="vdt-m-sub">+{{ (c.upliftFraction * 100).toFixed(2) }}%</span></div>
        <div class="vdt-metric"><span class="vdt-m-label">Projected EV</span><span class="vdt-m-val">{{ money(c.projectedEnterpriseValue) }}</span></div>
      </div>
    </header>

    <div class="vdt-body">
      <!-- Driver × capability-domain value-attribution tensor -->
      <div class="vdt-panel">
        <div class="vdt-panel-h">Value attribution — driver × capability domain <span class="vdt-hint">weights sum to 100% of EV · outlined cells carry a KPI lever</span></div>
        <div class="vdt-matrix" :style="{ gridTemplateColumns: `minmax(150px, 1.3fr) repeat(${domains.length}, 1fr)` }">
          <div class="vdt-corner"></div>
          <div v-for="d in domains" :key="d" class="vdt-colh" :title="d">{{ short(d) }}</div>
          <template v-for="drv in drivers" :key="drv">
            <div class="vdt-rowh">{{ drv }}</div>
            <div
              v-for="d in domains"
              :key="drv + d"
              class="vdt-cell"
              :class="{ lever: hasLever(drv, d) }"
              :style="{ background: cellColor(weightOf(drv, d)) }"
              :title="`${drv} × ${d} — ${(weightOf(drv, d) * 100).toFixed(1)}% of EV${hasLever(drv, d) ? ' · KPI: ' + leverOf(drv, d)!.kpi : ''}`"
            >{{ (weightOf(drv, d) * 100).toFixed(1) }}</div>
          </template>
        </div>
      </div>

      <!-- Per-driver uplift -->
      <div class="vdt-panel">
        <div class="vdt-panel-h">Uplift by driver</div>
        <div class="vdt-bars">
          <div v-for="drv in driversWithUplift" :key="drv" class="vdt-bar-row">
            <span class="vdt-bar-label">{{ drv }}</span>
            <div class="vdt-bar-track"><div class="vdt-bar-fill" :style="{ width: barPct(c.perDriver[drv]!) + '%' }" /></div>
            <span class="vdt-bar-val">+{{ money(c.perDriver[drv]!) }}</span>
          </div>
          <p v-if="driversWithUplift.length === 0" class="vdt-empty">No KPI levers set.</p>
        </div>

        <div class="vdt-panel-h" style="margin-top: 1rem">KPI levers</div>
        <div class="vdt-levers">
          <div v-for="k in c.perKpi" :key="k.kpi" class="vdt-lever">
            <div class="vdt-lever-h">
              <code>{{ k.kpi }}</code>
              <span class="vdt-delta" :class="k.contribution >= 0 ? 'up' : 'down'">{{ k.deltaPct > 0 ? '+' : '' }}{{ k.deltaPct }}%</span>
            </div>
            <div class="vdt-lever-meta">{{ k.driver }} · {{ short(k.domain) }} · <span class="vdt-pol">{{ k.polarity === 'higher_better' ? '↑ better' : '↓ better' }}</span></div>
            <div class="vdt-lever-val">+{{ money(k.contribution) }}</div>
          </div>
        </div>
      </div>
    </div>

    <p class="vdt-foot">Same model as the canonical value engine — <code>economic-prophet --mode vdt</code>. Each KPI lever moves the value carried by its (driver × domain) cell; <span class="vdt-pol">lower-better</span> metrics improve as they fall.</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchVdtWithFallback, fixtureView, type VdtView } from '../api/vdtApi';

// Initialise from the fixture (canonical engine math computed locally) so the surface renders
// synchronously; on mount, try the live dashboard-bff /v1/vdt and swap in the engine's output.
const view = ref<VdtView>(fixtureView());
const mode = ref<'live' | 'fixture'>('fixture');

onMounted(async () => {
  const res = await fetchVdtWithFallback();
  view.value = res.view;
  mode.value = res.mode;
});

const industry = computed(() => view.value.industry);
const evBaseline = computed(() => view.value.evBaseline);
const drivers = computed(() => view.value.drivers);
const domains = computed(() => view.value.domains);
const weights = computed(() => view.value.weights);
const c = computed(() => view.value);

const money = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(n);

function short(d: string): string {
  return d
    .replace('CustomerInterface', 'Customer')
    .replace('ProductServiceDev', 'Product')
    .replace('SupplyDelivery', 'Supply')
    .replace('OperationsSupport', 'Ops')
    .replace('RiskSecurity', 'Risk')
    .replace('GovernanceKnowledge', 'Govern');
}

const weightIndex = computed(
  () => new Map(view.value.weights.map((w) => [`${w.driver}|${w.domain}`, w.weight] as const)),
);
const weightOf = (drv: string, d: string): number => weightIndex.value.get(`${drv}|${d}`) ?? 0;

const leverMap = computed(
  () => new Map(view.value.perKpi.map((k) => [`${k.driver}|${k.domain}`, k] as const)),
);
const hasLever = (drv: string, d: string) => leverMap.value.has(`${drv}|${d}`);
const leverOf = (drv: string, d: string) => leverMap.value.get(`${drv}|${d}`);

const maxWeight = computed(() => Math.max(0, ...view.value.weights.map((w) => w.weight)));
function cellColor(w: number): string {
  const a = maxWeight.value > 0 ? (w / maxWeight.value) * 0.5 : 0; // 0..0.5 alpha
  return `rgba(88, 166, 255, ${a.toFixed(3)})`;
}

const driversWithUplift = computed(() => view.value.drivers.filter((d) => (view.value.perDriver[d] ?? 0) !== 0));
const maxDriverUplift = computed(() => Math.max(1, ...Object.values(view.value.perDriver)));
const barPct = (v: number) => Math.max(2, (v / maxDriverUplift.value) * 100);
</script>

<style scoped>
.vdt { height: 100%; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 0.9rem; padding: 1rem 1.25rem 1.25rem; background: var(--bg); color: rgba(255, 255, 255, 0.92); }
.vdt-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.vdt-title { display: flex; align-items: baseline; gap: 0.7rem; flex-wrap: wrap; } .vdt-title h1 { margin: 0; font-size: 1.3rem; }
.vdt-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.vdt-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: #e3b341; background: rgba(227, 179, 65, 0.14); border-radius: 5px; padding: 0.1rem 0.35rem; }
.vdt-pill.live { color: var(--up); background: rgba(63, 185, 80, 0.16); }
.vdt-ind { font-size: 0.78rem; color: rgba(255, 255, 255, 0.55); }
.vdt-metrics { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.vdt-metric { display: flex; flex-direction: column; border: 1px solid var(--line-2); border-radius: 10px; padding: 0.4rem 0.8rem; min-width: 8rem; }
.vdt-metric.up { border-color: rgba(63, 185, 80, 0.35); }
.vdt-m-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255, 255, 255, 0.45); }
.vdt-m-val { font-size: 1.05rem; font-weight: 700; } .vdt-metric.up .vdt-m-val { color: var(--up); }
.vdt-m-sub { font-size: 0.68rem; color: var(--up); }

.vdt-body { display: grid; grid-template-columns: 1.4fr 1fr; gap: 0.9rem; }
@media (max-width: 1000px) { .vdt-body { grid-template-columns: 1fr; } }
.vdt-panel { border: 1px solid var(--line-2); border-radius: 12px; padding: 0.85rem; background: var(--surface); }
.vdt-panel-h { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.09em; color: rgba(255, 255, 255, 0.5); margin-bottom: 0.7rem; }
.vdt-hint { text-transform: none; letter-spacing: 0; color: var(--text-3); font-size: 0.66rem; }

.vdt-matrix { display: grid; gap: 3px; }
.vdt-corner { }
.vdt-colh { font-size: 0.6rem; color: rgba(255, 255, 255, 0.5); text-align: center; padding: 0.2rem 0; white-space: nowrap; }
.vdt-rowh { font-size: 0.72rem; color: rgba(255, 255, 255, 0.8); display: flex; align-items: center; padding-right: 0.4rem; }
.vdt-cell { display: grid; place-items: center; height: 30px; border-radius: 5px; font-size: 0.66rem; color: rgba(255, 255, 255, 0.85); font-variant-numeric: tabular-nums; }
.vdt-cell.lever { outline: 2px solid var(--up); outline-offset: -2px; font-weight: 700; color: #fff; }

.vdt-bars { display: flex; flex-direction: column; gap: 0.45rem; }
.vdt-bar-row { display: grid; grid-template-columns: 8.5rem 1fr auto; align-items: center; gap: 0.6rem; }
.vdt-bar-label { font-size: 0.76rem; color: rgba(255, 255, 255, 0.8); }
.vdt-bar-track { height: 10px; background: rgba(255, 255, 255, 0.06); border-radius: 999px; overflow: hidden; }
.vdt-bar-fill { height: 100%; background: linear-gradient(90deg, #1f6feb, #58a6ff); border-radius: 999px; }
.vdt-bar-val { font-size: 0.76rem; font-weight: 700; color: var(--up); font-variant-numeric: tabular-nums; }
.vdt-empty { color: rgba(255, 255, 255, 0.45); font-size: 0.82rem; }

.vdt-levers { display: flex; flex-direction: column; gap: 0.5rem; }
.vdt-lever { border: 1px solid var(--line-2); border-radius: 9px; padding: 0.5rem 0.65rem; }
.vdt-lever-h { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.vdt-lever-h code { font-size: 0.78rem; color: rgba(255, 255, 255, 0.9); }
.vdt-delta { font-size: 0.72rem; font-weight: 700; border-radius: 5px; padding: 0.03rem 0.35rem; } .vdt-delta.up { color: var(--up); background: rgba(63, 185, 80, 0.14); } .vdt-delta.down { color: var(--down); background: rgba(248, 81, 73, 0.16); }
.vdt-lever-meta { font-size: 0.68rem; color: rgba(255, 255, 255, 0.5); margin-top: 0.2rem; }
.vdt-pol { color: #58a6ff; }
.vdt-lever-val { font-size: 0.82rem; font-weight: 700; color: var(--up); margin-top: 0.25rem; font-variant-numeric: tabular-nums; }

.vdt-foot { margin: 0; font-size: 0.72rem; color: rgba(255, 255, 255, 0.45); line-height: 1.5; } .vdt-foot code { color: rgba(255, 255, 255, 0.7); }
</style>
