<template>
  <section class="ac" aria-label="Governed acquisition console">
    <header class="ac-head">
      <div>
        <p class="ac-eyebrow">SocioProphet · Governed Acquisition</p>
        <h1>The gate, made visible</h1>
        <p class="ac-lede">
          Capability is maximal; <em>enforcement is contextual</em>. Pick an account class and watch every source's
          acquisition verdict resolve live — the same <code>evaluateJob()</code> chokepoint the plane runs at submit
          time. Flip to <strong>commercial</strong> and the aggressive tiers and restricted sources go compliant-by-default.
        </p>
      </div>
      <span class="ac-asof">{{ asOf }}</span>
    </header>

    <div class="ac-controls">
      <div class="ac-seg" role="tablist" aria-label="Account class">
        <button v-for="a in accountClasses" :key="a" role="tab" :aria-selected="account === a" :class="{ on: account === a }" @click="account = a">
          {{ accountLabel[a] }}
        </button>
      </div>
      <div class="ac-posture" :class="posture">
        <span class="ac-posture-dot"></span>
        posture: <strong>{{ posture }}</strong>
        <span class="ac-posture-note">{{ postureNote }}</span>
      </div>
    </div>

    <div class="ac-summary">
      <div class="ac-stat"><span class="ac-stat-n" :style="{ color: 'var(--up)' }">{{ counts.allow }}</span><span class="ac-stat-l">allowed</span></div>
      <div class="ac-stat"><span class="ac-stat-n" :style="{ color: 'var(--down)' }">{{ counts.block }}</span><span class="ac-stat-l">blocked</span></div>
      <div class="ac-stat"><span class="ac-stat-n" :style="{ color: 'var(--accent)' }">{{ counts.warned }}</span><span class="ac-stat-l">with advisories</span></div>
      <div class="ac-stat"><span class="ac-stat-n">{{ rows.length }}</span><span class="ac-stat-l">sources</span></div>
    </div>

    <div class="ac-table-wrap">
      <table class="ac-table">
        <thead>
          <tr><th>Source</th><th>Tier</th><th>ToS</th><th>robots</th><th>PII</th><th>Compliance</th><th>Verdict</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id" :class="{ blocked: r.result.decision === 'block' }">
            <td class="ac-td-name">{{ r.name }}</td>
            <td><span class="ac-tier" :class="'t-' + r.tier">{{ r.tier }}</span></td>
            <td><span class="ac-tos" :class="r.policy.tos">{{ r.policy.tos }}</span></td>
            <td class="ac-mono">{{ r.policy.robots }}</td>
            <td class="ac-mono">{{ r.policy.pii ? 'yes' : 'no' }}</td>
            <td><span class="ac-grade" :class="'g-' + r.grade">{{ r.grade }}</span></td>
            <td>
              <span class="ac-verdict" :class="r.result.decision">
                {{ r.result.decision === 'allow' ? '● allow' : '✕ block' }}
              </span>
            </td>
            <td class="ac-why">
              <span v-for="(x, i) in r.result.reasons" :key="'r' + i" class="ac-reason block">{{ x }}</span>
              <span v-for="(x, i) in r.result.warnings" :key="'w' + i" class="ac-reason warn">{{ x }}</span>
              <span v-if="!r.result.reasons.length && !r.result.warnings.length" class="ac-reason ok">clean</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="ac-note">
      The line is absolute: an <code>auth-gated</code> source is blocked in <em>every</em> posture, un-liftable by an
      override — defeating an access control is out of scope by design, not by toggle. In <strong>advisory</strong>
      mode compliance signals are captured as provenance warnings rather than blocks; in <strong>enforced</strong>
      (commercial) they become blocks unless a signed, time-boxed override lifts the specific gate.
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { DATA_SOURCES } from '../data/dataSources';
import { acquisitionFor } from '../data/acquisitionProfiles';
import { evaluateJob, resolvePosture, type AccountClass } from '../features/acquisition/policy';

const accountClasses: AccountClass[] = ['sovereign', 'research', 'own-estate', 'commercial'];
const accountLabel: Record<AccountClass, string> = {
  sovereign: 'Sovereign', research: 'Research', 'own-estate': 'Own estate', commercial: 'Commercial',
};
const account = ref<AccountClass>('sovereign');
const posture = computed(() => resolvePosture(account.value));
const postureNote = computed(() =>
  posture.value === 'enforced'
    ? 'compliant by default — robots/ToS/rate honored, T2–T4 need a logged override'
    : 'full capability — compliance captured as provenance, not blocked',
);

const rows = computed(() =>
  DATA_SOURCES.map((s) => {
    const { profile, grade } = acquisitionFor(s.id);
    const result = evaluateJob({ accountClass: account.value, sourceId: s.id, policy: profile.policy, tier: profile.tier });
    return { id: s.id, name: s.name, tier: profile.tier, policy: profile.policy, grade, result };
  }),
);

const counts = computed(() => ({
  allow: rows.value.filter((r) => r.result.decision === 'allow').length,
  block: rows.value.filter((r) => r.result.decision === 'block').length,
  warned: rows.value.filter((r) => r.result.warnings.length > 0).length,
}));

const asOf = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
</script>

<style scoped>
.ac { height: 100%; min-height: 0; overflow-y: auto; padding: 1rem 1.2rem 2rem; background: var(--bg); color: var(--text); }
.ac-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.1rem; }
.ac-eyebrow { margin: 0 0 0.15rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-3); }
.ac-head h1 { margin: 0 0 0.35rem; font-size: 1.5rem; letter-spacing: -0.02em; font-weight: 660; }
.ac-lede { margin: 0; max-width: 76ch; font-size: 0.86rem; line-height: 1.6; color: var(--text-2); }
.ac-lede em { color: var(--text); font-style: normal; font-weight: 600; }
.ac-asof { flex: 0 0 auto; font-size: 0.72rem; color: var(--text-3); font-family: ui-monospace, monospace; }

.ac-controls { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
.ac-seg { display: inline-flex; border: 1px solid var(--line-2); border-radius: 10px; overflow: hidden; }
.ac-seg button { border: none; background: var(--surface); color: var(--text-2); padding: 0.45rem 0.85rem; font: inherit; font-size: 0.8rem; font-weight: 600; cursor: pointer; border-right: 1px solid var(--line); }
.ac-seg button:last-child { border-right: none; }
.ac-seg button.on { background: var(--accent); color: #17130a; }
.ac-posture { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--text-2); border: 1px solid var(--line-2); border-radius: 999px; padding: 0.3rem 0.75rem; }
.ac-posture-dot { width: 8px; height: 8px; border-radius: 50%; }
.ac-posture.advisory .ac-posture-dot { background: #6ea8fe; } .ac-posture.enforced .ac-posture-dot { background: var(--up); }
.ac-posture strong { text-transform: uppercase; letter-spacing: 0.03em; font-size: 0.72rem; }
.ac-posture-note { color: var(--text-3); font-size: 0.72rem; }

.ac-summary { display: flex; gap: 0.6rem; margin-bottom: 1rem; flex-wrap: wrap; }
.ac-stat { border: 1px solid var(--line); border-radius: 12px; background: var(--surface); padding: 0.6rem 1rem; min-width: 6rem; }
.ac-stat-n { display: block; font-size: 1.4rem; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
.ac-stat-l { font-size: 0.64rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }

.ac-table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius); }
.ac-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
.ac-table th { text-align: left; padding: 0.55rem 0.7rem; font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); border-bottom: 1px solid var(--line-2); background: var(--surface-2); position: sticky; top: 0; white-space: nowrap; }
.ac-table td { padding: 0.5rem 0.7rem; border-bottom: 1px solid var(--line); color: var(--text-2); vertical-align: top; }
.ac-table tr:last-child td { border-bottom: none; }
.ac-table tr.blocked { background: rgba(240, 101, 106, 0.05); }
.ac-td-name { color: var(--text); font-weight: 600; white-space: nowrap; }
.ac-mono { font-family: ui-monospace, monospace; font-size: 0.72rem; color: var(--text-3); }
.ac-tier { display: inline-grid; place-items: center; min-width: 1.7rem; height: 1.25rem; border-radius: 4px; font-size: 0.62rem; font-weight: 800; color: #0c0f14; }
.ac-tier.t-T0 { background: #4bbf73; } .ac-tier.t-T1 { background: #7fca8f; } .ac-tier.t-T2 { background: #6ea8fe; } .ac-tier.t-T3 { background: #d8a250; } .ac-tier.t-T4 { background: #e5646a; }
.ac-tos { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.03em; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; }
.ac-tos.public { color: #7ee2a8; background: rgba(75, 191, 115, 0.14); } .ac-tos.restricted { color: #f0883e; background: rgba(240, 136, 62, 0.14); } .ac-tos.auth-gated { color: var(--down); background: rgba(240, 101, 106, 0.16); }
.ac-grade { display: inline-grid; place-items: center; min-width: 1.35rem; height: 1.35rem; border-radius: 5px; font-size: 0.74rem; font-weight: 800; color: #0c0f14; }
.g-A { background: #4bbf73; } .g-B { background: #6ea8fe; } .g-C { background: #d8a250; } .g-D { background: #f0883e; } .g-F { background: #e5646a; }
.ac-verdict { font-size: 0.7rem; font-weight: 700; white-space: nowrap; }
.ac-verdict.allow { color: var(--up); } .ac-verdict.block { color: var(--down); }
.ac-why { display: flex; flex-direction: column; gap: 0.2rem; }
.ac-reason { font-size: 0.68rem; line-height: 1.35; }
.ac-reason.block { color: #f0a0a3; } .ac-reason.warn { color: #e6c07a; } .ac-reason.ok { color: var(--text-3); }
.ac-note { margin: 0.9rem 0 0; font-size: 0.74rem; line-height: 1.6; color: var(--text-3); max-width: 84ch; }
.ac-note em { color: var(--text-2); font-style: normal; } .ac-note strong { color: var(--text-2); }
</style>
