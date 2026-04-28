<template>
  <section class="surface-page">
    <header class="surface-header">
      <div>
        <p class="eyebrow">{{ surface?.domain || 'SocioProphet' }}</p>
        <h1>{{ surface?.item || 'Workspace' }}</h1>
        <p class="surface-summary">
          {{ surface?.template || 'Workspace surface' }} · {{ surface?.status || 'Exists (mocked)' }}
        </p>
      </div>
      <div class="status-stack">
        <span class="tag">{{ surface?.implementation || 'mocked' }}</span>
        <span v-if="surface?.provenanceRibbon" class="tag tag-blue">provenance</span>
        <span v-if="surface?.commentCard" class="tag tag-green">comments</span>
      </div>
    </header>

    <div class="surface-grid">
      <section class="carbon-card surface-module">
        <div class="section-title">Template</div>
        <h2>{{ surface?.template || 'Module' }}</h2>
        <p>
          This screen is represented by the domain route registry and intentionally mocked until its
          live data contract is connected. The React shell remains the behavioral reference; the Vue shell
          is the implementation target.
        </p>
      </section>

      <section v-if="surface?.provenanceRibbon" class="carbon-card surface-module">
        <div class="section-title">Provenance ribbon</div>
        <p>Enabled for this route. Future data cards should expose source, receipt, and evidence state here.</p>
      </section>

      <section v-if="surface?.commentCard" class="carbon-card surface-module">
        <div class="section-title">Comment card</div>
        <p>Enabled for this route. User annotations, agent notes, and review comments should mount here.</p>
      </section>

      <section class="carbon-card surface-module wide">
        <div class="section-title">Route contract</div>
        <div class="detail-grid">
          <span>Domain</span><strong>{{ surface?.domain }}</strong>
          <span>Route</span><strong>{{ surface?.route }}</strong>
          <span>Status</span><strong>{{ surface?.status }}</strong>
          <span>Implementation</span><strong>{{ surface?.implementation || 'mocked' }}</strong>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { surfaceForRoute } from '../config/domainRoutes';

const route = useRoute();
const surface = computed(() => surfaceForRoute(route.path));
</script>
