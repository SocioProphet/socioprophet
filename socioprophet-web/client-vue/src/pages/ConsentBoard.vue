<template>
  <section class="cb-page" aria-labelledby="cb-title">
    <header class="cb-hero">
      <div>
        <p class="cb-kicker">Consent · self-sovereign · {{ mode }}</p>
        <h1 id="cb-title">What can be seen, and what you allow</h1>
        <p class="cb-lede">
          Everything that could be recorded about your usage, and everything the agent could do for you —
          each one <strong>off by default</strong>, explained in plain words, and yours to turn on or off.
          The inverse of default-on telemetry: nothing happens until you say so.
        </p>
      </div>
      <div class="cb-scorecard" aria-label="Consent summary">
        <span class="cb-score">{{ grantedCount }}<span class="cb-of">/{{ totalCount }}</span></span>
        <span class="cb-score-label">on · everything else off</span>
      </div>
    </header>

    <BoundaryNotice
      :label="mode === 'live' ? 'live' : 'fixture'"
      :message="mode === 'live'
        ? 'Live consent state from your own node.'
        : 'Fixture consent state (everything off). Wire VITE_CONSENT_BASE to your node for live state.'"
    />

    <div class="cb-sovereign" role="note">
      <span class="cb-dot" /> self-sovereign — the party observed and the party holding the record are the
      same principal: <code>{{ snapshot.subjectPrincipal }}</code>
    </div>

    <RouteStatePanel
      :state="mode === 'live' ? 'ready' : 'mock'"
      :title="mode === 'live' ? 'Live' : 'Fixture'"
      :message="loadError
        ? `Node unavailable (${loadError}); showing the default-off view.`
        : `${grantedCount} of ${totalCount} enabled. Toggle any row; sensitive rows stay off until you explicitly allow them.`"
    />

    <section v-for="group in surfaceGroups" :key="group.category" class="cb-panel" :aria-label="group.category">
      <h2>{{ group.label }} <span class="cb-count">{{ group.rows.length }}</span></h2>
      <div v-for="row in group.rows" :key="row.surfaceId" class="cb-row">
        <div class="cb-row-main">
          <div class="cb-row-head">
            <code class="cb-id">{{ row.surfaceId }}</code>
            <span :class="['cb-chip', `cb-sens-${row.sensitivity}`]">{{ row.sensitivity }}</span>
            <span v-if="row.pii" class="cb-chip cb-pii">pii</span>
            <span class="cb-proj">{{ row.projectionMode.toLowerCase().replace(/_/g, ' ') }}</span>
          </div>
          <p class="cb-explain">{{ row.explanation }}</p>
        </div>
        <button
          :class="['cb-toggle', row.consent.state === 'granted' ? 'on' : 'off']"
          :aria-pressed="row.consent.state === 'granted'"
          @click="toggleSurface(row)"
        >{{ row.consent.state === 'granted' ? 'on' : 'off' }}</button>
      </div>
    </section>

    <section class="cb-panel" aria-label="capabilities">
      <h2>Capabilities <span class="cb-count">{{ snapshot.capabilities.length }}</span></h2>
      <p class="cb-note">
        Active capabilities are held to a stricter standard than telemetry. Most are <strong>per-use</strong> —
        you are asked every single time and there is no “always allow”. Microphone is standing-session because
        this is a voice-first agent and audio stays on-device.
      </p>
      <div v-for="cap in snapshot.capabilities" :key="cap.capabilityId" class="cb-row">
        <div class="cb-row-main">
          <div class="cb-row-head">
            <code class="cb-id">{{ cap.capabilityId }}</code>
            <span :class="['cb-chip', cap.defaultStandard === 'per-use' ? 'cb-peruse' : 'cb-standing']">{{ cap.defaultStandard }}</span>
            <span v-if="cap.oneShot" class="cb-chip cb-oneshot">one-shot</span>
          </div>
          <p class="cb-explain">{{ cap.explanation }}</p>
        </div>
        <button
          :class="['cb-toggle', cap.consent?.state === 'granted' ? 'on' : 'off']"
          :aria-pressed="cap.consent?.state === 'granted'"
          @click="toggleCapability(cap)"
        >{{ capabilityButtonLabel(cap) }}</button>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import RouteStatePanel from '../components/RouteStatePanel.vue';
import {
  demoConsentSnapshot,
  fetchConsentWithFallback,
  setConsent,
  type Capability,
  type ConsentMode,
  type ConsentSnapshot,
  type SurfaceCategory,
  type TelemetrySurface,
} from '../services/consentApi';

const snapshot = ref<ConsentSnapshot>(demoConsentSnapshot());
const mode = ref<ConsentMode>('fixture');
const loadError = ref<string | undefined>(undefined);

onMounted(async () => {
  const result = await fetchConsentWithFallback();
  snapshot.value = result.snapshot;
  mode.value = result.mode;
  loadError.value = result.error;
});

const CATEGORY_LABEL: Record<SurfaceCategory, string> = {
  model: 'AI usage', policy: 'Governance', app: 'Session & app', device: 'Device',
};

const surfaceGroups = computed(() =>
  (['model', 'policy', 'app', 'device'] as SurfaceCategory[])
    .map((category) => ({
      category,
      label: CATEGORY_LABEL[category],
      rows: snapshot.value.surfaces.filter((s) => s.category === category),
    }))
    .filter((g) => g.rows.length > 0),
);

const grantedCount = computed(
  () =>
    snapshot.value.surfaces.filter((s) => s.consent.state === 'granted').length +
    snapshot.value.capabilities.filter((c) => c.consent?.state === 'granted').length,
);
const totalCount = computed(() => snapshot.value.surfaces.length + snapshot.value.capabilities.length);

function capabilityButtonLabel(cap: Capability): string {
  if (cap.consent?.state === 'granted') return 'on';
  return cap.defaultStandard === 'per-use' ? 'ask' : 'off';
}

async function toggleSurface(row: TelemetrySurface): Promise<void> {
  const grant = row.consent.state !== 'granted';
  row.consent.state = grant ? 'granted' : 'revoked';
  const res = await setConsent(row.surfaceId, grant);
  row.consent.state = res.state;
}

async function toggleCapability(cap: Capability): Promise<void> {
  const grant = cap.consent?.state !== 'granted';
  cap.consent = { state: grant ? 'granted' : 'revoked' };
  const res = await setConsent(cap.capabilityId, grant);
  cap.consent = { state: res.state };
}
</script>

<style scoped>
.cb-page { display: flex; flex-direction: column; gap: 1.1rem; padding: 1.5rem; max-width: 940px; margin: 0 auto; }
.cb-hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; flex-wrap: wrap; }
.cb-kicker { font-family: var(--font-mono, ui-monospace, monospace); font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); margin: 0 0 0.3rem; }
.cb-hero h1 { margin: 0; font-size: clamp(1.5rem, 3.5vw, 2.1rem); }
.cb-lede { color: var(--text-2); max-width: 64ch; margin: 0.5rem 0 0; }
.cb-scorecard { display: flex; flex-direction: column; align-items: flex-end; }
.cb-score { font-size: 2rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.cb-of { color: var(--text-3); font-size: 1.1rem; }
.cb-score-label { font-size: 0.72rem; color: var(--text-3); }
code { background: var(--surface-2); border: 1px solid var(--line); padding: 0.03rem 0.32rem; border-radius: 5px; font-size: 0.84em; }

.cb-sovereign { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--text-2); background: var(--surface); border: 1px solid var(--line); border-left: 3px solid var(--up); border-radius: 8px; padding: 0.6rem 0.9rem; }
.cb-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: var(--up); box-shadow: 0 0 8px var(--up); flex: none; }

.cb-panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius, 14px); padding: 1.1rem 1.2rem; }
.cb-panel h2 { font-size: 0.95rem; margin: 0 0 0.7rem; }
.cb-count { color: var(--text-3); font-weight: 400; font-size: 0.85em; }
.cb-note { font-size: 0.82rem; color: var(--text-2); margin: 0 0 0.8rem; }

.cb-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.7rem 0; border-bottom: 1px solid var(--line); }
.cb-row:last-child { border-bottom: none; }
.cb-row-main { min-width: 0; }
.cb-row-head { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.cb-id { font-family: var(--font-mono, ui-monospace, monospace); font-size: 0.8rem; color: var(--text); }
.cb-explain { font-size: 0.84rem; color: var(--text-2); margin: 0.3rem 0 0; max-width: 62ch; }
.cb-proj { font-size: 0.68rem; color: var(--text-3); font-family: var(--font-mono, ui-monospace, monospace); }

.cb-chip { font-size: 0.64rem; padding: 0.08rem 0.45rem; border-radius: 5px; border: 1px solid currentColor; text-transform: uppercase; letter-spacing: 0.04em; }
.cb-sens-benign { color: var(--text-3); }
.cb-sens-personal { color: var(--amber); }
.cb-sens-sensitive { color: var(--down); }
.cb-pii { color: var(--down); }
.cb-peruse { color: var(--down); }
.cb-standing { color: var(--amber); }
.cb-oneshot { color: var(--text-3); }

.cb-toggle { flex: none; min-width: 3.4rem; font-family: var(--font-mono, ui-monospace, monospace); font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.06em; padding: 0.35rem 0.7rem; border-radius: 8px; cursor: pointer; border: 1px solid var(--line); background: var(--surface-2); color: var(--text-3); transition: all 0.12s; }
.cb-toggle.on { background: color-mix(in srgb, var(--up) 18%, transparent); border-color: var(--up); color: var(--up); }
.cb-toggle.off:hover { border-color: var(--text-3); color: var(--text-2); }
.cb-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
