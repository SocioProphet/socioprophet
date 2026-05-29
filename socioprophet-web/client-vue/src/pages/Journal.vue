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
      <span class="adapter-pill adapter-pill--warn">mock only</span>
    </header>

    <section class="adapter-card adapter-boundary">
      <strong>Boundary</strong>
      <p>Events are generated from the local mock adapter. No writeback, authorization, or backend stream is declared here.</p>
    </section>

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
import { triRpc, type EventEnvelope } from '../services/triRpc';

const events = ref<EventEnvelope[]>([]);

onMounted(async () => {
  try {
    for await (const event of triRpc.journal.subscribe()) {
      events.value.push(event);
      if (events.value.length > 100) events.value.shift();
    }
  } catch (error) {
    events.value.push({
      ts: new Date().toISOString(),
      space: 'client-vue',
      ns: 'journal',
      actor: { id: 'adapter-boundary', pk: 'none' },
      kind: 'adapter.unavailable',
      body: { error: error instanceof Error ? error.message : String(error) },
    });
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
.adapter-boundary { border-color: rgba(241,194,27,.45); background: rgba(241,194,27,.08); }
.adapter-pill { display: inline-flex; align-items: center; height: fit-content; border-radius: 999px; padding: .2rem .55rem; font-size: .72rem; font-weight: 800; text-transform: uppercase; background: rgba(120,169,255,.15); color: var(--accent, #78a9ff); }
.adapter-pill--warn { background: rgba(241,194,27,.18); color: #f1c21b; }
.adapter-grid { display: grid; gap: 1rem; }
.adapter-row { display: flex; justify-content: space-between; gap: 1rem; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; padding: .75rem; border-radius: 12px; background: rgba(255,255,255,.06); }
</style>
