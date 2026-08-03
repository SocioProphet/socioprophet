<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { loadComputeSettings, type ComputeSettings } from "../../services/studioApi";

// Project compute setting: governed cluster plane + federated volunteer-mesh (over the agent-machine
// inception-twin) + the governed-deployment view (region/enclave, data-class, TPM attestation,
// policy-drift, legal-basis). Governance is fail-closed — this surface only DISPLAYS; the
// ProjectComputeSetting contract + validator enforce that no ungoverned compute exists.
const props = defineProps<{ project: string }>();

const cfg = ref<ComputeSettings | null>(null);
const loading = ref(false);
const err = ref("");

async function load() {
  loading.value = true;
  err.value = "";
  try {
    cfg.value = await loadComputeSettings(props.project);
  } catch (e) {
    err.value = e instanceof Error ? e.message : "load failed";
  } finally {
    loading.value = false;
  }
}
onMounted(load);
watch(() => props.project, load);
</script>

<template>
  <div class="cs studio-scope">
    <header class="cs-head">
      <h2>Compute</h2>
      <span v-if="cfg?.degraded" class="chip warn" title="No BFF wired — showing the contract shape">degraded · stub</span>
    </header>
    <p v-if="err" class="err">{{ err }}</p>
    <p v-else-if="loading" class="muted">Loading compute setting…</p>

    <template v-else-if="cfg">
      <!-- Two planes -->
      <div class="grid">
        <section class="kcard">
          <h3>Governed plane <span class="chip" :class="cfg.planes.governed.enabled ? 'ok' : 'off'">{{ cfg.planes.governed.enabled ? 'on' : 'off' }}</span></h3>
          <dl>
            <div><dt>Cluster</dt><dd>{{ cfg.planes.governed.clusterRef || '—' }}</dd></div>
            <div><dt>Region</dt><dd>{{ cfg.planes.governed.region || '—' }}</dd></div>
            <div><dt>Default enclave</dt><dd>{{ cfg.planes.governed.defaultEnclave || '—' }}</dd></div>
          </dl>
        </section>
        <section class="kcard">
          <h3>Mesh plane <span class="chip" :class="cfg.planes.mesh.enabled ? 'ok' : 'off'">{{ cfg.planes.mesh.enabled ? 'on' : 'off' }}</span></h3>
          <dl>
            <div><dt>Inception-twin</dt><dd class="mono">{{ cfg.planes.mesh.twinRef || '—' }}</dd></div>
            <div><dt>Revocable</dt><dd>{{ cfg.planes.mesh.revocation?.required ? `yes · ${cfg.planes.mesh.revocation?.propagationSeconds}s` : 'NO' }}</dd></div>
            <div><dt>Min trust</dt><dd>{{ cfg.planes.mesh.minTrust ?? '—' }}</dd></div>
          </dl>
          <ul class="nodes" v-if="cfg.planes.mesh.trustedNodes?.length">
            <li v-for="n in cfg.planes.mesh.trustedNodes" :key="n.nodeRef">
              <span class="chip ok" title="attested">✓</span> {{ n.nodeRef }} <span class="muted">@ {{ n.hostRef }}</span>
            </li>
          </ul>
        </section>
      </div>

      <p class="crypto muted">
        transport <code>{{ cfg.cryptoProfileRef }}</code> · federation <code>{{ cfg.federationCryptoProfileRef }}</code>
      </p>

      <!-- Governed deployment view (image 5) -->
      <h3 class="dep-h">Deployments</h3>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Name</th><th>Type</th><th>Status</th><th>Region / Enclave</th><th>Data class</th>
              <th>Owner</th><th>IAM</th><th>Attestation</th><th>Policy drift</th><th>Legal basis</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in cfg.deployments" :key="d.name">
              <td>{{ d.name }}</td>
              <td><span class="chip">{{ d.type }}</span></td>
              <td>{{ d.status }}</td>
              <td>{{ d.regionEnclave }}</td>
              <td>{{ d.dataClass }}</td>
              <td>{{ d.ownerRef }}</td>
              <td>{{ d.iamRoles.join(', ') }}</td>
              <td><span class="chip" :class="d.attestation.tpmVerified ? 'ok' : 'warn'">TPM {{ d.attestation.tpmVerified ? '✓' : '✗' }}</span></td>
              <td><span class="chip" :class="d.policyDrift.compliant ? 'ok' : 'warn'">{{ d.policyDrift.compliant ? 'compliant' : 'DRIFT' }}</span></td>
              <td>{{ d.legalBasis.kind }} · {{ d.legalBasis.ref }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cs { padding: 16px; color: var(--text, #e7e7ea); }
.cs-head { display: flex; align-items: center; gap: 10px; }
.cs-head h2 { margin: 0; font-size: 18px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
.kcard { border: 1px solid var(--hairline, #2a2a30); border-radius: var(--r-md, 10px); background: var(--surface, #16161a); padding: 12px; }
.kcard h3 { margin: 0 0 8px; font-size: 14px; display: flex; align-items: center; gap: 8px; }
dl { margin: 0; display: grid; gap: 4px; }
dl > div { display: grid; grid-template-columns: 120px 1fr; gap: 8px; font-size: 13px; }
dt { color: var(--muted, #9a9aa2); }
.nodes { list-style: none; margin: 8px 0 0; padding: 0; font-size: 13px; display: grid; gap: 4px; }
.crypto { margin: 6px 0 14px; font-size: 12px; }
.dep-h { margin: 8px 0; font-size: 14px; }
.tbl-wrap { overflow-x: auto; border: 1px solid var(--hairline, #2a2a30); border-radius: var(--r-md, 10px); }
.tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.tbl th, .tbl td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--hairline, #2a2a30); white-space: nowrap; }
.tbl th { color: var(--muted, #9a9aa2); font-weight: 600; }
.chip { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 11px; border: 1px solid var(--hairline, #2a2a30); }
.chip.ok { color: #3fb950; border-color: #235a2c; }
.chip.warn { color: #d29922; border-color: #6b5320; }
.chip.off { color: var(--muted, #9a9aa2); }
.mono, code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }
.muted { color: var(--muted, #9a9aa2); }
.err { color: #f85149; }
</style>
