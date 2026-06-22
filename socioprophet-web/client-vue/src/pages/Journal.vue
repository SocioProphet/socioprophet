<template>
  <section class="adapter-page" aria-labelledby="journal-title">
    <header class="adapter-hero">
      <div>
        <p class="adapter-kicker">Journal · TriRPC fixture seam</p>
        <h1 id="journal-title">Journal stream</h1>
        <p>
          Fixture-backed journal event stream. Set <code>VITE_MOCK=1</code> for local demo mode.
          This page does not connect to a live TriRPC backend.
        </p>
      </div>
      <ModeBadge label="mock only" tone="warning" />
    </header>

    <BoundaryNotice
      label="mock boundary"
      message="Events are generated from the local mock adapter. No writeback, authorization, or backend stream is declared here."
    />

    <RouteStatePanel v-if="isLoading" state="loading" title="Loading fixture stream" message="Reading mock TriRPC journal events from the local adapter." />
    <RouteStatePanel v-else-if="errorMessage" state="error" title="Adapter unavailable" :message="errorMessage" />
    <RouteStatePanel v-else-if="events.length === 0" state="empty" title="No journal events" message="The fixture stream returned no events. This is an empty mock state, not a backend outage." />
    <RouteStatePanel v-else state="mock" title="Mock journal stream" :message="`${events.length} fixture events loaded from the mock adapter.`" />

    <section class="adapter-grid">
      <article v-for="event in events" :key="event.ts + event.kind" class="adapter-card">
        <div class="adapter-row">
          <strong>{{ event.kind }}</strong>
          <span>{{ event.ts }}</span>
        </div>
        <p>{{ event.space }} / {{ event.ns }} · {{ event.actor.id }}</p>
        <pre>{{ event.body }}</pre>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import ModeBadge from '../components/ModeBadge.vue';
import RouteStatePanel from '../components/RouteStatePanel.vue';
import { triRpc, type EventEnvelope } from '../services/triRpc';

const events = ref<EventEnvelope[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  try {
    for await (const event of triRpc.journal.subscribe()) {
      events.value.push(event);
      if (events.value.length > 100) events.value.shift();
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.adapter-page { display: grid; gap: 1rem; color: var(--text, #f4f4f4); }
.adapter-hero, .adapter-card { border: 1px solid rgba(255,255,255,.14); border-radius: 18px; background: rgba(20,24,31,.82); box-shadow: 0 18px 48px rgba(0,0,0,.22); }
.adapter-hero { display: flex; justify-content: space-between; gap: 1rem; padding: 1.5rem; }
.adapter-kicker { margin: 0 0 .4rem; color: var(--accent, #78a9ff); font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
h1, p { margin-top: 0; }
p, pre, code, .adapter-row span { color: rgba(255,255,255,.70); }
.adapter-card { padding: 1rem; }
.adapter-grid { display: grid; gap: 1rem; }
.adapter-row { display: flex; justify-content: space-between; gap: 1rem; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; padding: .75rem; border-radius: 12px; background: rgba(255,255,255,.06); }
</style>
