<template>
  <section class="wb-page" aria-labelledby="wb-title">
    <header class="wb-bar">
      <div>
        <p class="wb-kicker">Operator Workbench · render-harness</p>
        <h1 id="wb-title">SocioProphet Operator Workbench</h1>
      </div>
      <nav class="wb-links" aria-label="Workbench surfaces">
        <a :href="screenUrl('index.html')" :class="{ active: current === 'index.html' }" @click.prevent="current = 'index.html'">Index</a>
        <a :href="screenUrl('estate_aligned_architecture.html')" :class="{ active: current === 'estate_aligned_architecture.html' }" @click.prevent="current = 'estate_aligned_architecture.html'">Estate Architecture</a>
        <a :href="screenUrl('unified_cognitive_systems_map.html')" :class="{ active: current === 'unified_cognitive_systems_map.html' }" @click.prevent="current = 'unified_cognitive_systems_map.html'">Cognitive Systems Map</a>
        <RouterLink to="/workbench/scope-d" class="wb-native">SCOPE-D (native) →</RouterLink>
        <a :href="screenUrl(current)" target="_blank" rel="noopener" class="wb-standalone">Open standalone ↗</a>
      </nav>
    </header>

    <!-- The screens are self-contained IBM-Carbon render-harness HTML (the DOSSIER's fidelity mirror for
         this Vue+Carbon port). They are served as static assets from /workbench and mounted in an iframe
         so their exact Carbon fidelity is preserved verbatim — porting each to a Vue component would risk
         the very drift the DOSSIER's Correction 2 fixed. Native-component migration is the follow-on. -->
    <iframe
      class="wb-frame"
      :src="screenUrl(current)"
      :title="`Operator workbench — ${current}`"
      loading="lazy"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

// Vite serves public/ at the app base; BASE_URL respects VITE_ROUTER_BASE so this resolves under any deploy path.
const base = (import.meta as any).env?.BASE_URL || '/';
const screenUrl = (name: string) => `${base}workbench/${name}`;

// The workbench index.html is itself the launcher (links to all 33 sub-screens); it loads by default and
// its internal relative links navigate WITHIN the iframe. The two architecture diagrams are surfaced here
// too since the index does not link them.
const current = ref('index.html');
</script>

<style scoped>
.wb-page {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: calc(100vh - 120px);
  min-height: 520px;
}

.wb-bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.wb-kicker {
  margin: 0 0 0.3rem;
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--sp-blue, #0f62fe);
}

.wb-bar h1 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.wb-links {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.wb-links a {
  font-size: 0.8rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--sp-border, #2d333b);
  border-radius: 0;
  color: var(--sp-text, #f4f4f4);
  text-decoration: none;
  transition: border-color 0.12s;
}

.wb-links a:hover {
  border-color: var(--sp-blue, #0f62fe);
}

.wb-links a.active {
  border-color: var(--sp-blue, #0f62fe);
  color: var(--sp-blue, #0f62fe);
}

.wb-links a.wb-standalone {
  color: var(--sp-gray-60, #8a94a6);
}

.wb-frame {
  flex: 1;
  width: 100%;
  border: 1px solid var(--sp-border, #2d333b);
  border-radius: 0;
  background: #f7f7f5;
}
</style>
