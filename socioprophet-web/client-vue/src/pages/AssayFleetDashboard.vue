<template>
  <section class="af-page" aria-labelledby="af-title">
    <header class="af-hero">
      <div>
        <p class="af-kicker">prophet-mesh · cloud-mesh · {{ mode }}</p>
        <h1 id="af-title">Assay Fleet Dashboard</h1>
        <p class="af-lede">
          Verdict health across the fleet: how claims are projecting, which verifier standards are
          actually live, and the standard rollout in flight. Every <code>ok</code> is earned behind a
          measured verifier — never asserted.
        </p>
      </div>
      <div class="af-scorecard" aria-label="Window summary">
        <span class="af-score">{{ rollup.totalAssays }}</span>
        <span class="af-score-label">assays · {{ rollup.scope.nodeCount }} nodes · 1h window</span>
      </div>
    </header>

    <BoundaryNotice
      :label="mode === 'live' ? 'live' : 'fixture'"
      :message="mode === 'live'
        ? 'Live AssayRollup from prophet-mesh (cloud-mesh).'
        : 'Fixture rollup with the real calibrated standards. Wire VITE_ASSAY_BASE to the prophet-mesh rollup endpoint (:8780) for live fleet data.'"
    />

    <RouteStatePanel
      :state="mode === 'live' ? 'ready' : 'mock'"
      :title="mode === 'live' ? 'Live fleet' : 'Fixture fleet'"
      :message="loadError
        ? `Backend unavailable (${loadError}); showing the fixture rollup with real standards.`
        : `${rollup.totalAssays} verdicts across ${rollup.scope.nodeCount} nodes${rollup.driftDetected ? ' — calibration drift detected' : ''}.`"
    />

    <!-- KPI row -->
    <section class="af-kpis" aria-label="Verdict distribution">
      <article class="af-kpi af-ok">
        <span class="af-big">{{ pct(rollup.distribution.ok) }}%</span>
        <span class="af-lbl">ok</span>
        <span class="af-sub">{{ rollup.distribution.ok }} · supported, inline, calibrated</span>
      </article>
      <article class="af-kpi af-sad">
        <span class="af-big">{{ pct(rollup.distribution.sad) }}%</span>
        <span class="af-lbl">unassayed · sad</span>
        <span class="af-sub">{{ rollup.distribution.sad }} · not yet settled</span>
      </article>
      <article class="af-kpi af-bad">
        <span class="af-big">{{ pct(rollup.distribution.bad) }}%</span>
        <span class="af-lbl">bad</span>
        <span class="af-sub">{{ rollup.distribution.bad }} · refuted / broken</span>
      </article>
      <article class="af-kpi af-sig">
        <span class="af-big">{{ standards.length }}</span>
        <span class="af-lbl">standards live</span>
        <span class="af-sub">{{ calibratedCount }} calibrated</span>
      </article>
    </section>

    <!-- distribution bar -->
    <section class="af-panel" aria-label="Distribution bar">
      <div class="af-distbar">
        <span class="af-seg af-seg-ok" :style="{ width: pct(rollup.distribution.ok) + '%' }">{{ rollup.distribution.ok }}</span>
        <span class="af-seg af-seg-sad" :style="{ width: pct(rollup.distribution.sad) + '%' }">{{ rollup.distribution.sad }}</span>
        <span class="af-seg af-seg-bad" :style="{ width: pct(rollup.distribution.bad) + '%' }">{{ rollup.distribution.bad }}</span>
      </div>
      <div class="af-legend">
        <span><i class="af-dot af-ok" /> ok — supported, inline-bound, calibrated verifier</span>
        <span><i class="af-dot af-sad" /> sad — unassayed / unresolved</span>
        <span><i class="af-dot af-bad" /> bad — refuted or authority-broken</span>
      </div>
    </section>

    <div class="af-two">
      <section class="af-panel" aria-label="Why amber">
        <h2>Why the fleet is amber</h2>
        <div v-for="row in reasonRows" :key="row.label" class="af-barrow">
          <span class="af-k">{{ row.label }}</span>
          <span class="af-track"><span class="af-fill af-fill-sad" :style="{ width: row.pct + '%' }" /></span>
          <span class="af-v">{{ row.value }}</span>
        </div>
        <p class="af-note">The amber band is <em>earned</em>: each sad verdict names its unresolved condition.</p>
      </section>

      <section class="af-panel" aria-label="By method">
        <h2>By method</h2>
        <div v-for="row in methodRows" :key="row.label" class="af-barrow">
          <span class="af-k">{{ row.label }}</span>
          <span class="af-track"><span class="af-fill" :class="row.cls" :style="{ width: row.pct + '%' }" /></span>
          <span class="af-v">{{ row.value }}</span>
        </div>
        <p class="af-note">Computed + retrieved are attestable and can reach ok; generated cannot on its own.</p>
      </section>
    </div>

    <!-- calibration drift -->
    <section class="af-panel" aria-label="Calibration drift">
      <h2>
        Calibration drift — which standards are live
        <span v-if="rollup.driftDetected" class="af-warn">⚠ drift detected</span>
      </h2>
      <p class="af-note">
        The fleet's {{ pct(rollup.distribution.ok) }}% ok is weaker than it looks:
        {{ uncalibratedNodes }} of {{ rollup.scope.nodeCount }} nodes verify against an uncalibrated standard,
        so their verdicts can never legitimately reach ok.
      </p>
      <table class="af-table">
        <thead>
          <tr><th>AssayStandard (verifier · version)</th><th>nodes</th><th>F1</th><th>κ</th><th>status</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in standardRows" :key="s.id">
            <td class="af-mono">
              {{ s.verifierId }} : {{ s.version }}
              <span v-if="s.real" class="af-real">● real</span>
            </td>
            <td>{{ s.nodeCount }}</td>
            <td class="af-num">{{ s.f1.toFixed(2) }}</td>
            <td class="af-num">{{ s.kappa.toFixed(2) }} <span class="af-muted">{{ s.kappaLabel }}</span></td>
            <td>
              <span :class="['af-chip', s.calibrated ? 'af-chip-ok' : 'af-chip-sad']">
                {{ s.calibrated ? 'calibrated' : 'uncalibrated' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="af-note">
        The two calibrated standards are <strong>real measurements</strong>: narration-fidelity from the
        SP-TRACE-CFR eval (F1 1.0, n=42), nl-lexical-baseline from a labelled NL corpus (F1 0.71, n=32).
      </p>
    </section>

    <!-- rollout -->
    <section class="af-panel" aria-label="Standard rollout">
      <div class="af-rollout-head">
        <span class="af-mono">
          {{ rollout.supersedes ? shortVer(rollout.supersedes) : '—' }} →
          <strong class="af-accent">{{ shortVer(rollout.standardRef) }}</strong>
        </span>
        <span class="af-phase">{{ rollout.strategy }} · {{ rollout.phase }}</span>
      </div>
      <div class="af-pcttrack"><div class="af-pctfill" :style="{ width: (rollout.rolloutPct || 0) + '%' }" /></div>
      <p class="af-mono af-sub2">
        {{ (rollout.rolloutPct || 0).toFixed(1) }}% of fleet on new standard · guard:
        <code>{{ rollout.guard?.metric }}</code> →
        <span :class="rollout.guard?.decision === 'continue' ? 'af-good' : 'af-warn'">{{ rollout.guard?.decision }}</span>
      </p>
      <div class="af-cohorts">
        <div v-for="c in rollout.cohorts" :key="c.cohortId" :class="['af-cohort', `af-cohort-${c.state}`]">
          <span class="af-cid">{{ c.cohortId }}</span>
          <span class="af-nodes">{{ c.nodeCount }} nodes · {{ c.state }}</span>
        </div>
      </div>
      <p class="af-note">
        Widening is gated on the canary's observed rollup — <strong>no promotion-by-hope</strong>. A new
        verifier standard is never switched on fleet-wide at once.
      </p>
    </section>

    <section class="af-panel af-local" aria-label="Local mode">
      <h2>The local contrast</h2>
      <p class="af-note">
        A <strong>single-user local</strong> deployment runs the same Assay framework — verdicts, projection,
        the resolver gate — but this dashboard does not exist there. On <code>local</code> /
        <code>trusted_private</code> loci the fleet aggregation path is never instantiated. No fleet dashboards
        for a single user is a <strong>structural</strong> guarantee, not a setting.
      </p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import RouteStatePanel from '../components/RouteStatePanel.vue';
import {
  demoAssayFleetSnapshot,
  fetchAssayFleetWithFallback,
  type AssayFleetSnapshot,
  type AssayMode,
} from '../services/assayApi';

const snapshot = ref<AssayFleetSnapshot>(demoAssayFleetSnapshot());
const mode = ref<AssayMode>('fixture');
const loadError = ref<string | undefined>(undefined);

onMounted(async () => {
  const result = await fetchAssayFleetWithFallback();
  snapshot.value = result.snapshot;
  mode.value = result.mode;
  loadError.value = result.error;
});

const rollup = computed(() => snapshot.value.rollup);
const rollout = computed(() => snapshot.value.rollout);
const standards = computed(() => snapshot.value.standards);

function pct(n: number): number {
  const total = rollup.value.totalAssays || 1;
  return Math.round((n / total) * 1000) / 10;
}

const calibratedCount = computed(() => standards.value.filter((s) => s.calibrated).length);

const methodColour: Record<string, string> = {
  computed: 'af-fill-ok',
  retrieved: 'af-fill-sig',
  generated: 'af-fill-muted',
};

const reasonRows = computed(() => {
  const reasons = rollup.value.unassayedReasons || {};
  const max = Math.max(1, ...Object.values(reasons));
  return Object.entries(reasons).map(([label, value]) => ({ label, value, pct: (value / max) * 100 }));
});

const methodRows = computed(() => {
  const methods = rollup.value.byMethod || {};
  const max = Math.max(1, ...Object.values(methods));
  return Object.entries(methods)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, pct: (value / max) * 100, cls: methodColour[label] || 'af-fill-muted' }));
});

// join adoption node counts with the standard summaries for the drift table
const standardRows = computed(() => {
  const adoption = rollup.value.standardAdoption || [];
  return standards.value.map((s) => {
    const a = adoption.find((x) => x.calibrationRef === s.id);
    return { ...s, nodeCount: a?.nodeCount ?? 0 };
  });
});

const uncalibratedNodes = computed(() =>
  (rollup.value.standardAdoption || []).filter((a) => !a.calibrated).reduce((sum, a) => sum + a.nodeCount, 0),
);

function shortVer(ref: string): string {
  const parts = ref.split(':');
  return `${parts[parts.length - 2]}:${parts[parts.length - 1]}`;
}
</script>

<style scoped>
.af-page { display: flex; flex-direction: column; gap: 1.1rem; padding: 1.5rem; max-width: 1080px; margin: 0 auto; }
.af-hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap; }
.af-kicker { font-family: var(--font-mono, ui-monospace, monospace); font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); margin: 0 0 0.3rem; }
.af-hero h1 { margin: 0; font-size: clamp(1.5rem, 3.5vw, 2.1rem); }
.af-lede { color: var(--text-2); max-width: 60ch; margin: 0.5rem 0 0; }
.af-scorecard { display: flex; flex-direction: column; align-items: flex-end; }
.af-score { font-size: 2.2rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.af-score-label { font-size: 0.74rem; color: var(--text-3); }
code { background: var(--surface-2); border: 1px solid var(--line); padding: 0.03rem 0.32rem; border-radius: 6px; font-size: 0.86em; }

.af-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.7rem; }
.af-kpi { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm, 10px); padding: 0.9rem 1rem; border-top: 3px solid var(--neutral); }
.af-kpi.af-ok { border-top-color: var(--up); }
.af-kpi.af-sad { border-top-color: var(--amber); }
.af-kpi.af-bad { border-top-color: var(--down); }
.af-kpi.af-sig { border-top-color: var(--info); }
.af-big { font-size: 2rem; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; display: block; }
.af-ok .af-big { color: var(--up); }
.af-sad .af-big { color: var(--amber); }
.af-bad .af-big { color: var(--down); }
.af-lbl { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); margin-top: 0.35rem; display: block; }
.af-sub { font-size: 0.72rem; color: var(--text-2); margin-top: 0.15rem; display: block; }

.af-panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius, 14px); padding: 1.1rem 1.2rem; }
.af-panel h2 { font-size: 0.95rem; margin: 0 0 0.7rem; }
.af-two { display: grid; grid-template-columns: 1fr; gap: 0.9rem; }
@media (min-width: 760px) { .af-two { grid-template-columns: 1fr 1fr; } }

.af-distbar { display: flex; height: 2.3rem; border-radius: 8px; overflow: hidden; border: 1px solid var(--line); margin-bottom: 0.7rem; }
.af-seg { display: flex; align-items: center; justify-content: center; font-variant-numeric: tabular-nums; font-weight: 700; color: #0c0d11; min-width: 2rem; font-size: 0.8rem; }
.af-seg-ok { background: var(--up); }
.af-seg-sad { background: var(--amber); }
.af-seg-bad { background: var(--down); }
.af-legend { display: flex; gap: 1.2rem; flex-wrap: wrap; font-size: 0.76rem; color: var(--text-2); }
.af-dot { display: inline-block; width: 0.7rem; height: 0.7rem; border-radius: 3px; vertical-align: middle; margin-right: 0.3rem; }
.af-dot.af-ok { background: var(--up); }
.af-dot.af-sad { background: var(--amber); }
.af-dot.af-bad { background: var(--down); }

.af-barrow { display: grid; grid-template-columns: 12ch 1fr 3ch; gap: 0.7rem; align-items: center; margin: 0.35rem 0; font-size: 0.8rem; }
.af-track { height: 0.7rem; background: var(--surface-2); border-radius: 4px; overflow: hidden; }
.af-fill { height: 100%; border-radius: 4px; display: block; }
.af-fill-sad { background: var(--amber); }
.af-fill-ok { background: var(--up); }
.af-fill-sig { background: var(--info); }
.af-fill-muted { background: var(--neutral); }
.af-k { color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.af-v { color: var(--text-3); text-align: right; font-variant-numeric: tabular-nums; }
.af-note { font-size: 0.8rem; color: var(--text-2); margin: 0.7rem 0 0; }

.af-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 0.4rem; }
.af-table th, .af-table td { text-align: left; padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--line); }
.af-table th { font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-3); }
.af-mono { font-family: var(--font-mono, ui-monospace, monospace); }
.af-num { font-variant-numeric: tabular-nums; }
.af-muted { color: var(--text-3); font-size: 0.9em; }
.af-real { color: var(--up); font-size: 0.72rem; margin-left: 0.3rem; }
.af-chip { display: inline-block; font-size: 0.66rem; padding: 0.1rem 0.5rem; border-radius: 5px; border: 1px solid currentColor; text-transform: uppercase; letter-spacing: 0.04em; }
.af-chip-ok { color: var(--up); }
.af-chip-sad { color: var(--amber); }
.af-warn { color: var(--down); font-size: 0.78rem; }
.af-good { color: var(--up); }

.af-rollout-head { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 0.5rem; }
.af-accent { color: var(--accent); }
.af-phase { font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); }
.af-pcttrack { height: 0.6rem; background: var(--surface-2); border: 1px solid var(--line); border-radius: 6px; overflow: hidden; margin: 0.5rem 0 0.3rem; }
.af-pctfill { height: 100%; background: linear-gradient(90deg, var(--accent-soft), var(--accent)); }
.af-sub2 { font-size: 0.76rem; color: var(--text-2); margin: 0 0 0.7rem; }
.af-cohorts { display: flex; flex-direction: column; gap: 0.5rem; }
.af-cohort { display: flex; justify-content: space-between; background: var(--surface-2); border-left: 2px solid var(--neutral); border-radius: 0 6px 6px 0; padding: 0.5rem 0.8rem; }
.af-cohort-promoted { border-left-color: var(--up); }
.af-cohort-pending { border-left-color: var(--neutral); }
.af-cid { font-family: var(--font-mono, ui-monospace, monospace); font-size: 0.82rem; }
.af-nodes { font-size: 0.74rem; color: var(--text-3); }
.af-local { border-style: dashed; }
</style>
