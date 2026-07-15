<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { runGovernanceTest, type GovernanceTest, type GovParams } from '../api/governanceApi';

const gt = ref<GovernanceTest | null>(null);
const loading = ref(false);
const error = ref('');

// Reusable: run the SAME governance test against any dataset / action / role / autonomy level.
const p = ref<GovParams>({
  dataset: 'gyg-causal-valuation',
  action_class: 'measurement_render',
  role: 'analyst',
  requested_level: 'L3',
  evidence: 'gyg.metrics.json,vdt_profile.schema.json',
});

const ROLES = ['viewer', 'analyst', 'operator', 'admin', 'owner'];
const LEVELS = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'];
const ACTIONS = ['measurement_render', 'data_read', 'model_route', 'external_search', 'investment_advice', 'live_money_movement'];

async function run() {
  loading.value = true; error.value = '';
  const r = await runGovernanceTest(p.value);
  gt.value = r.data; if (r.error) error.value = r.error;
  loading.value = false;
}
onMounted(run);

const decColor = (d: string) => (d === 'admit' ? '#065f46' : d === 'demote' ? '#92610a' : '#991b1b');
const decBg = (d: string) => (d === 'admit' ? '#ecfdf5' : d === 'demote' ? '#fffbeb' : '#fef2f2');
</script>

<template>
  <section class="pv" aria-label="Governance provenance">
    <header class="pv-top">
      <p class="pv-eyebrow">Organization · Noetica governance</p>
      <h1 class="pv-title">Provenance — why a decision happened</h1>
      <p class="pv-sub">The <strong>reusable governance test</strong> (ST012), re-runnable against any client dataset: a deterministic trust-kernel gate producing a hash-sealed admission receipt. This is governance you can <em>show</em>, not describe.</p>
    </header>

    <!-- Reusable controls: any dataset / action / role / autonomy level -->
    <div class="pv-controls">
      <label>Dataset<input v-model="p.dataset" placeholder="any client dataset ref" /></label>
      <label>Action<select v-model="p.action_class"><option v-for="a in ACTIONS" :key="a" :value="a">{{ a }}</option></select></label>
      <label>Role<select v-model="p.role"><option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option></select></label>
      <label>Requested<select v-model="p.requested_level"><option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option></select></label>
      <label class="wide">Evidence<input v-model="p.evidence" placeholder="comma-separated evidence refs" /></label>
      <button class="pv-run" :disabled="loading" @click="run">{{ loading ? 'Running…' : 'Run governance test' }}</button>
    </div>

    <p v-if="error" class="pv-warn">dashboard-bff unavailable ({{ error }}).</p>

    <template v-if="gt">
      <!-- The decision -->
      <div class="pv-decision" :style="{ background: decBg(gt.receipt.decision), borderColor: decColor(gt.receipt.decision) }">
        <div class="pv-dec-main">
          <span class="pv-dec-word" :style="{ color: decColor(gt.receipt.decision) }">{{ gt.receipt.decision.toUpperCase() }}</span>
          <span class="pv-dec-lvl">requested {{ gt.receipt.requested_level }} → granted <strong>{{ gt.receipt.granted_level }}</strong> · ceiling {{ gt.receipt.role_ceiling }} ({{ gt.receipt.role }})</span>
        </div>
        <p class="pv-dec-reason">{{ gt.receipt.reason }}</p>
      </div>

      <!-- The WHY: trust-kernel gate trace -->
      <div class="pv-card">
        <h3>Trust-kernel gates <span class="pv-hint">the ordered checks that produced the decision</span></h3>
        <div class="pv-gate" v-for="(g, i) in gt.gate_trace" :key="g.gate">
          <span class="pv-gate-n">{{ i + 1 }}</span>
          <span class="pv-gate-name">{{ g.gate }}</span>
          <span class="pv-gate-pass" :class="{ ok: g.pass, bad: !g.pass }">{{ g.pass ? '✓ pass' : '✕ blocked' }}</span>
          <span class="pv-gate-detail">{{ g.detail }}</span>
        </div>
      </div>

      <!-- The sealed receipt -->
      <div class="pv-card">
        <h3>Sealed receipt <span class="pv-hint">AutonomyAdmissionReceipt v{{ gt.receipt.version }} · deterministic, hash-sealed</span></h3>
        <div class="pv-kv"><span>receipt_id</span><code>{{ gt.receipt.receipt_id }}</code></div>
        <div class="pv-kv"><span>subject</span><code>{{ gt.receipt.subject_ref }}</code></div>
        <div class="pv-kv"><span>gate governing</span><code>{{ gt.receipt.gate }}</code></div>
        <div class="pv-kv"><span>evidence</span><code>{{ gt.receipt.evidence_refs.join(', ') || '(none)' }}</code> <span class="pv-req">required: {{ gt.receipt.evidence_required }}</span></div>
        <div class="pv-kv"><span>policy</span><code>{{ gt.receipt.policy_refs.join(' · ') }}</code></div>
        <div class="pv-kv"><span>{{ gt.receipt.hash_algo }}</span><code class="pv-hash">{{ gt.receipt.hash }}</code></div>
        <p class="pv-hint" style="margin-top:.5rem;">{{ gt.reusable }}</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.pv { padding: 1rem 1.25rem; max-width: 920px; font-family: ui-sans-serif, system-ui; }
.pv-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; opacity: .6; margin: 0; }
.pv-title { font-size: 1.5rem; font-weight: 700; margin: .25rem 0; }
.pv-sub { margin: 0 0 1rem; opacity: .8; max-width: 760px; }
.pv-controls { display: flex; flex-wrap: wrap; gap: .6rem; align-items: end; background: var(--surface, #fff); border: 1px solid var(--line-2, #e2e8f0); border-radius: 12px; padding: .8rem; margin-bottom: 1rem; }
.pv-controls label { display: flex; flex-direction: column; font-size: .72rem; opacity: .7; gap: .2rem; }
.pv-controls label.wide { flex: 1; min-width: 200px; }
.pv-controls input, .pv-controls select { padding: .4rem .55rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: .85rem; }
.pv-run { padding: .5rem .9rem; border: 1px solid #10b981; background: #10b981; color: #fff; border-radius: 8px; cursor: pointer; font-weight: 600; }
.pv-run:disabled { opacity: .5; }
.pv-warn { border: 1px solid #fecaca; background: #fef2f2; color: #991b1b; border-radius: 10px; padding: .75rem; }
.pv-decision { border: 2px solid; border-radius: 12px; padding: 1rem 1.1rem; margin-bottom: 1rem; }
.pv-dec-main { display: flex; align-items: baseline; gap: .75rem; flex-wrap: wrap; }
.pv-dec-word { font-size: 1.6rem; font-weight: 800; letter-spacing: .02em; }
.pv-dec-lvl { font-size: .9rem; opacity: .85; }
.pv-dec-reason { margin: .5rem 0 0; font-size: .9rem; }
.pv-card { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: .85rem 1rem; margin-bottom: 1rem; }
.pv-card h3 { margin: 0 0 .6rem; font-size: 1rem; }
.pv-hint { font-size: .74rem; opacity: .55; font-weight: 400; }
.pv-gate { display: grid; grid-template-columns: 22px 120px 90px 1fr; align-items: center; gap: .5rem; padding: .35rem 0; border-top: 1px solid #f1f5f9; font-size: .84rem; }
.pv-gate-n { color: #94a3b8; }
.pv-gate-name { font-weight: 650; }
.pv-gate-pass.ok { color: #065f46; } .pv-gate-pass.bad { color: #991b1b; font-weight: 650; }
.pv-gate-detail { opacity: .65; font-size: .8rem; }
.pv-kv { display: flex; gap: .6rem; align-items: baseline; padding: .25rem 0; font-size: .84rem; }
.pv-kv > span:first-child { min-width: 110px; opacity: .6; }
.pv-kv code { font-size: .78rem; background: #f1f5f9; padding: .05rem .35rem; border-radius: 4px; word-break: break-all; }
.pv-hash { font-size: .68rem !important; }
.pv-req { font-size: .72rem; opacity: .55; }
</style>
