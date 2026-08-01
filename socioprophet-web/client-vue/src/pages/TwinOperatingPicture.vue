<template>
  <section class="tw-page" aria-labelledby="tw-title">
    <header class="tw-hero">
      <div>
        <p class="tw-kicker">Twin Operating Picture · {{ mode }}</p>
        <h1 id="tw-title">Twin Workshop</h1>
        <p class="tw-lede">
          See and build twins. Submit a GenesisSeed → a verified Twin through the
          <code>created → authorized → verified</code> lifecycle, each transition
          emitting a replayable TwinEventEnvelope. Fail-closed: an invalid seed is
          rejected (422) and no twin is created.
        </p>
      </div>
      <div class="tw-scorecard" aria-label="Fleet size">
        <span class="tw-score">{{ counts.total }}</span>
        <span class="tw-score-label">twins · {{ counts.verified }} verified</span>
      </div>
    </header>

    <BoundaryNotice
      :label="mode === 'live' ? 'live' : 'fixture'"
      :message="mode === 'live'
        ? 'Live twin registry from the cloud-twin service on prophet-platform.'
        : 'Fixture registry. Wire VITE_CLOUD_TWIN_API_BASE to the cloud-twin service for live data; builds are simulated client-side in fixture mode.'"
    />

    <RouteStatePanel
      :state="mode === 'live' ? 'ready' : 'mock'"
      :title="mode === 'live' ? 'Live registry' : 'Fixture registry'"
      :message="loadError
        ? `Backend unavailable (${loadError}); showing the fixture registry.`
        : `${counts.total} twins across the fleet; ${events.length} lifecycle events in the stream.`"
    />

    <!-- Fleet metrics -->
    <section class="tw-tiles" aria-label="Fleet metrics">
      <article v-for="tile in tiles" :key="tile.label" :class="['tw-tile', `tw-tile--${tile.tone}`]">
        <span class="tw-tile-label">{{ tile.label }}</span>
        <span class="tw-tile-value">{{ tile.value }}</span>
      </article>
    </section>

    <div class="tw-grid">
      <!-- Build a twin -->
      <section class="tw-build" aria-labelledby="tw-build-title">
        <h2 id="tw-build-title">Build a twin</h2>
        <form class="tw-form" @submit.prevent="runBuild">
          <label>Kind
            <select v-model="form.kind">
              <option v-for="k in KINDS" :key="k" :value="k">{{ k }}</option>
            </select>
          </label>
          <label>Label
            <input v-model="form.label" type="text" placeholder="e.g. ASX reporting twin" />
          </label>
          <label>Hologram ref <span class="tw-req">*</span>
            <input v-model="form.hologram_ref" type="text" placeholder="holo:mkt/asx-daily" />
          </label>
          <label>Authorization principal <span class="tw-req">*</span>
            <input v-model="form.authorization" type="text" placeholder="user/analyst-3 or svc/…" />
          </label>
          <button class="tw-submit" type="submit" :disabled="building">
            {{ building ? 'Building…' : 'Submit seed →' }}
          </button>
          <p v-if="buildError" class="tw-reject" role="alert">{{ buildError }}</p>
        </form>
      </section>

      <!-- Registry -->
      <section class="tw-registry" aria-labelledby="tw-reg-title">
        <h2 id="tw-reg-title">Twin registry <span class="tw-count">{{ counts.total }}</span></h2>
        <div class="tw-table-wrap">
          <table class="tw-table">
            <thead>
              <tr><th>Twin ID</th><th>Kind</th><th>Label</th><th>State</th><th>Events</th></tr>
            </thead>
            <tbody>
              <tr v-for="t in twins" :key="t.id">
                <td class="tw-id">{{ t.id }}</td>
                <td>{{ t.kind }}</td>
                <td class="tw-muted">{{ t.label }}</td>
                <td><span :class="['tw-pill', `tw-pill--${t.state}`]">{{ t.state }}</span></td>
                <td class="tw-num">{{ t.events }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Event stream -->
    <section class="tw-stream" aria-labelledby="tw-stream-title">
      <h2 id="tw-stream-title">Event stream <span class="tw-count">TwinEventEnvelope</span></h2>
      <ul class="tw-events">
        <li v-if="events.length === 0" class="tw-empty">No events yet — build a twin to emit the lifecycle stream.</li>
        <li v-for="(e, i) in events" :key="`${e.twin_id}-${e.seq}-${i}`" class="tw-event">
          <span class="tw-seq">#{{ e.seq }}</span>
          <span :class="['tw-type', typeClass(e.type)]">{{ e.type }}</span>
          <span class="tw-ev-meta">{{ e.twin_id }} · {{ e.payload }}</span>
        </li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import RouteStatePanel from '../components/RouteStatePanel.vue';
import {
  buildTwin,
  demoTwinEvents,
  demoTwins,
  fetchTwinRegistryWithFallback,
  twinCounts,
  validateSeed,
  TWIN_LIFECYCLE,
  type GenesisSeed,
  type Twin,
  type TwinEventEnvelope,
  type TwinMode,
  type TwinState,
} from '../api/cloudTwinApi';

const KINDS = ['market', 'device', 'citizen', 'portfolio', 'health', 'geo'];

const twins = ref<Twin[]>(demoTwins());
const mode = ref<TwinMode>('fixture');
const loadError = ref<string | undefined>(undefined);
const events = ref<TwinEventEnvelope[]>([]);
const rejects = ref(0);

const form = ref({ kind: 'market', label: '', hologram_ref: '', authorization: '' });
const buildError = ref<string | undefined>(undefined);
const building = ref(false);

const counts = computed(() => twinCounts(twins.value));
const tiles = computed(() => [
  { label: 'Total twins', value: counts.value.total, tone: 'accent' },
  { label: 'Verified', value: counts.value.verified, tone: 'verified' },
  { label: 'Authorized', value: counts.value.authorized, tone: 'authorized' },
  { label: 'Created', value: counts.value.created, tone: 'created' },
  { label: 'Rejected seeds', value: rejects.value, tone: 'rejected' },
]);

function seedEvents(): void {
  events.value = twins.value
    .flatMap(demoTwinEvents)
    .sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts))
    .slice(0, 24);
}

onMounted(async () => {
  const result = await fetchTwinRegistryWithFallback();
  twins.value = result.snapshot.twins;
  mode.value = result.mode;
  loadError.value = result.error;
  seedEvents();
});

function pushEvent(e: TwinEventEnvelope): void {
  events.value = [e, ...events.value].slice(0, 40);
}

// Safe lifecycle-suffix class — an unexpected event type (no dot) styles as the
// neutral base rather than `tw-type--undefined`.
function typeClass(type: string): string {
  const suffix = type.includes('.') ? type.split('.')[1] : 'event';
  return `tw-type--${suffix || 'event'}`;
}

function payloadFor(st: TwinState, seed: GenesisSeed, id: string): string {
  if (st === 'created') return `hologram=${seed.hologram_ref}`;
  if (st === 'authorized') return `principal=${seed.authorization}`;
  return `attestation=urn:sp:attest:${id}`;
}

async function simulateBuild(seed: GenesisSeed): Promise<void> {
  const id = `twn_${seed.kind.slice(0, 3)}-${String(twins.value.length + 1).padStart(4, '0')}`;
  const t: Twin = {
    id,
    kind: seed.kind,
    label: seed.label || `Untitled ${seed.kind} twin`,
    hologram: seed.hologram_ref,
    state: 'created',
    principal: seed.authorization,
    events: 0,
    created: new Date().toISOString(),
  };
  twins.value = [t, ...twins.value];
  for (let i = 0; i < TWIN_LIFECYCLE.length; i += 1) {
    const st = TWIN_LIFECYCLE[i];
    t.state = st;
    t.events = i + 1;
    pushEvent({ type: `twin.${st}`, twin_id: id, seq: i + 1, payload: payloadFor(st, seed, id), ts: new Date().toISOString() });
    twins.value = [...twins.value];
    if (i < TWIN_LIFECYCLE.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 380));
    }
  }
}

async function runBuild(): Promise<void> {
  buildError.value = undefined;
  const seed: GenesisSeed = {
    kind: form.value.kind,
    label: form.value.label || undefined,
    hologram_ref: form.value.hologram_ref.trim(),
    authorization: form.value.authorization.trim(),
  };
  const invalid = validateSeed(seed);
  if (invalid) {
    buildError.value = `422 seed rejected — ${invalid}`;
    rejects.value += 1;
    return;
  }
  building.value = true;
  try {
    if (mode.value === 'live') {
      const t = await buildTwin(seed);
      twins.value = [t, ...twins.value];
      demoTwinEvents(t).forEach(pushEvent);
    } else {
      await simulateBuild(seed);
    }
    form.value = { kind: 'market', label: '', hologram_ref: '', authorization: '' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    buildError.value = message;
    if (/422/.test(message)) rejects.value += 1;
  } finally {
    building.value = false;
  }
}
</script>

<style scoped>
.tw-page { display: flex; flex-direction: column; gap: 18px; padding: 20px; max-width: 1160px; margin: 0 auto; color: var(--ink, #e7ebf3); }
.tw-hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
.tw-kicker { text-transform: uppercase; letter-spacing: .1em; font-size: 11px; color: var(--holo, #33e0d4); font-weight: 650; margin: 0 0 4px; }
.tw-hero h1 { margin: 0 0 8px; font-size: 26px; }
.tw-lede { margin: 0; max-width: 62ch; color: var(--ink-muted, #9aa4bb); line-height: 1.55; }
.tw-lede code { font-family: ui-monospace, monospace; font-size: 12px; color: var(--ink, #e7ebf3); }
.tw-scorecard { text-align: right; flex: none; }
.tw-score { display: block; font-family: ui-monospace, monospace; font-size: 34px; font-weight: 600; }
.tw-score-label { font-size: 12px; color: var(--ink-muted, #9aa4bb); }

.tw-tiles { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
@media (max-width: 900px) { .tw-tiles { grid-template-columns: repeat(2, 1fr); } }
.tw-tile { border: 1px solid var(--border, #1e2634); border-radius: 11px; padding: 12px 13px; background: var(--panel, #0f141e); border-left: 3px solid var(--accent, #7d78ff); }
.tw-tile--verified { border-left-color: #3fb950; }
.tw-tile--authorized { border-left-color: #f0b429; }
.tw-tile--created { border-left-color: #7c8cff; }
.tw-tile--rejected { border-left-color: #ff6b6b; }
.tw-tile-label { display: block; text-transform: uppercase; letter-spacing: .06em; font-size: 10.5px; color: var(--ink-muted, #9aa4bb); font-weight: 650; }
.tw-tile-value { font-family: ui-monospace, monospace; font-size: 26px; font-weight: 600; }

.tw-grid { display: grid; grid-template-columns: 300px 1fr; gap: 16px; }
@media (max-width: 900px) { .tw-grid { grid-template-columns: 1fr; } }
.tw-build, .tw-registry, .tw-stream { border: 1px solid var(--border, #1e2634); border-radius: 12px; padding: 14px 16px; background: var(--panel, #0f141e); }
.tw-build h2, .tw-registry h2, .tw-stream h2 { margin: 0 0 12px; font-size: 14px; }
.tw-count { font-family: ui-monospace, monospace; font-size: 11px; color: var(--ink-muted, #9aa4bb); margin-left: 6px; }
.tw-form { display: flex; flex-direction: column; gap: 10px; }
.tw-form label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--ink-muted, #9aa4bb); }
.tw-req { color: #ff6b6b; }
.tw-form input, .tw-form select { background: var(--panel-2, #0b0f18); border: 1px solid var(--border, #1e2634); color: var(--ink, #e7ebf3); border-radius: 8px; padding: 8px 10px; font: inherit; }
.tw-submit { margin-top: 4px; background: var(--accent, #7d78ff); color: #0a0c14; border: 0; border-radius: 8px; padding: 9px; font-weight: 650; cursor: pointer; }
.tw-submit:disabled { opacity: .6; cursor: default; }
.tw-reject { margin: 2px 0 0; background: #2c1618; border: 1px solid #ff6b6b55; color: #ff6b6b; border-radius: 8px; padding: 8px 10px; font-size: 11.5px; }

.tw-table-wrap { overflow-x: auto; }
.tw-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.tw-table th { text-align: left; text-transform: uppercase; letter-spacing: .06em; font-size: 10px; color: var(--ink-muted, #9aa4bb); padding: 0 10px 8px; border-bottom: 1px solid var(--border, #1e2634); }
.tw-table td { padding: 8px 10px; border-bottom: 1px solid var(--border, #1e2634); white-space: nowrap; }
.tw-id { font-family: ui-monospace, monospace; color: var(--accent, #7d78ff); }
.tw-muted { color: var(--ink-muted, #9aa4bb); }
.tw-num { font-family: ui-monospace, monospace; }
.tw-pill { font-family: ui-monospace, monospace; font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
.tw-pill--created { color: #7c8cff; background: #171d33; }
.tw-pill--authorized { color: #f0b429; background: #2a2312; }
.tw-pill--verified { color: #3fb950; background: #112a1d; }

.tw-events { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; max-height: 320px; overflow-y: auto; }
.tw-event { display: grid; grid-template-columns: auto auto 1fr; gap: 10px; align-items: center; padding: 7px 2px; border-bottom: 1px solid var(--border, #1e2634); font-family: ui-monospace, monospace; font-size: 11px; }
.tw-seq { color: var(--ink-muted, #9aa4bb); font-size: 10px; }
.tw-type { font-weight: 600; }
.tw-type--created { color: #7c8cff; }
.tw-type--authorized { color: #f0b429; }
.tw-type--verified { color: #3fb950; }
.tw-ev-meta { color: var(--ink-muted, #9aa4bb); overflow: hidden; text-overflow: ellipsis; }
.tw-empty { color: var(--ink-muted, #9aa4bb); font-style: italic; padding: 14px 2px; }
</style>
