<template>
  <div class="sp-shell">
    <header class="sp-topbar">
      <RouterLink class="sp-brand" to="/news">SocioProphet</RouterLink>
      <nav class="sp-domain-nav" aria-label="Primary domains">
        <RouterLink to="/news">News &amp; Events</RouterLink>
        <RouterLink to="/professional-intelligence">Professional Intelligence</RouterLink>
        <RouterLink to="/control-plane">SourceOS</RouterLink>
        <RouterLink to="/journal">Adapter Seams</RouterLink>
        <RouterLink to="/law/international-law">Law &amp; Regulation</RouterLink>
        <RouterLink to="/people/search">People &amp; Society</RouterLink>
        <RouterLink to="/economy/macro-economics">Economy &amp; Industry</RouterLink>
        <RouterLink to="/markets/indices-funds">Capital &amp; Markets</RouterLink>
        <RouterLink to="/weather/forecast">Weather &amp; Resources</RouterLink>
        <RouterLink to="/map">Maps</RouterLink>
        <RouterLink to="/feed">Feed</RouterLink>
      </nav>
      <div class="sp-profile-indicator" aria-hidden="true" />
    </header>

    <nav class="sp-tabbar" aria-label="Workspace tabs">
      <button class="sp-tab-menu" type="button" aria-label="Open navigation">☷</button>
      <RouterLink v-for="tab in tabLinks" :key="tab.to" :to="tab.to">{{ tab.label }}</RouterLink>
    </nav>

    <div class="sp-workspace">
      <aside class="sp-left-rail" aria-label="Workspace rail">
        <RouterLink to="/news" title="News">☷</RouterLink>
        <RouterLink to="/professional-intelligence" title="Professional Intelligence">PI</RouterLink>
        <RouterLink to="/control-plane" title="SourceOS Control Plane">CP</RouterLink>
        <RouterLink to="/nlboot" title="NLBoot Evidence">NB</RouterLink>
        <RouterLink to="/reader" title="Reader">▤</RouterLink>
        <RouterLink to="/journal" title="Journal">J</RouterLink>
        <RouterLink to="/code" title="Code Search">CS</RouterLink>
        <RouterLink to="/map" title="Maps">⌖</RouterLink>
        <RouterLink to="/people/search" title="People">◫</RouterLink>
        <RouterLink to="/economy/macro-economics" title="Economy">◔</RouterLink>
        <RouterLink to="/analytics" title="Analytics">⌁</RouterLink>
        <RouterLink to="/markets/indices-funds" title="Markets">▥</RouterLink>
        <RouterLink to="/gates" title="Gates">◉</RouterLink>
        <RouterLink to="/settings" title="Settings">⚙</RouterLink>
      </aside>

      <section class="sp-stage">
        <div class="sp-breadcrumbs">
          <span v-for="(crumb, index) in breadcrumbs" :key="`${crumb}-${index}`">
            <span>{{ crumb }}</span>
            <span v-if="index < breadcrumbs.length - 1" class="sp-crumb-separator">/</span>
          </span>
        </div>
        <RouterView />
      </section>
    </div>

    <footer class="sp-agent-shell">
      <div class="sp-agent-search">
        <span>⌕</span>
        <input type="search" placeholder="Search or command…" />
      </div>
      <div class="sp-runtime-strip" aria-label="Runtime adapter status">
        <span class="sp-runtime-strip__label">Runtime</span>
        <RuntimeAdapterStatusBadge
          v-for="feature in activeRuntimeFeatures"
          :key="feature.feature_id"
          :feature="feature"
        />
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import RuntimeAdapterStatusBadge from './components/RuntimeAdapterStatusBadge.vue';
import { domainSurfaces, surfaceForRoute, surfacesForDomain } from './config/domainRoutes';
import { getRuntimeFeature } from './runtime-adapters';
import { runtimeFeatureIdsForPath } from './runtime-adapters/routeRuntimeFeatures';
import type { RuntimeAdapterFeature } from './runtime-adapters';

const route = useRoute();

const surface = computed(() => surfaceForRoute(route.path));
const activeDomain = computed(() => {
  if (route.path.startsWith('/professional-intelligence')) return 'Professional Intelligence';
  if (route.path.startsWith('/control-plane')) return 'SourceOS Lifecycle';
  if (route.path.startsWith('/nlboot')) return 'SourceOS Lifecycle';
  if (route.path.startsWith('/journal')) return 'Adapter Seams';
  if (route.path.startsWith('/code')) return 'Adapter Seams';
  if (route.path.startsWith('/map')) return 'Maps & Analytics';
  if (surface.value?.domain) return surface.value.domain;
  if (route.path.startsWith('/analytics')) return 'Maps & Analytics';
  return 'News & Events';
});

const tabLinks = computed(() => {
  if (activeDomain.value === 'Professional Intelligence') {
    return [
      { label: 'Operating Dashboard', to: '/professional-intelligence' },
      { label: 'Gates', to: '/gates' },
      { label: 'Policies', to: '/policies' },
      { label: 'Runs', to: '/runs' },
      { label: 'Attestations', to: '/attestations' },
    ];
  }

  if (activeDomain.value === 'SourceOS Lifecycle') {
    return [
      { label: 'Lifecycle Control', to: '/control-plane' },
      { label: 'NLBoot Evidence', to: '/nlboot' },
      { label: 'Gates', to: '/gates' },
      { label: 'Attestations', to: '/attestations' },
    ];
  }

  if (activeDomain.value === 'Adapter Seams') {
    return [
      { label: 'Journal', to: '/journal' },
      { label: 'Code Search', to: '/code' },
      { label: 'Reader', to: '/reader' },
    ];
  }

  const surfaces = surfacesForDomain(activeDomain.value).slice(0, 6);
  if (activeDomain.value === 'Maps & Analytics') {
    return [
      { label: 'Map Workbench', to: '/map' },
      ...surfaces.filter((item) => item.route !== '/map').slice(0, 5).map((item) => ({ label: item.item, to: item.route })),
    ];
  }
  return surfaces.map((item) => ({ label: item.item, to: item.route }));
});

const breadcrumbs = computed(() => {
  if (route.path.startsWith('/professional-intelligence')) return ['Professional Intelligence OS', 'Operating dashboard'];
  if (route.path.startsWith('/control-plane')) return ['SourceOS Lifecycle', 'Control-plane evidence'];
  if (route.path.startsWith('/nlboot')) return ['SourceOS Lifecycle', 'NLBoot evidence'];
  if (route.path.startsWith('/journal')) return ['Adapter Seams', 'Journal stream'];
  if (route.path.startsWith('/code')) return ['Adapter Seams', 'Code search'];
  if (route.path.startsWith('/map')) return ['Maps & Analytics', 'OpenStreetMap', 'GAIA world model'];
  if (surface.value) return [surface.value.domain, surface.value.item];
  const fallback = domainSurfaces.find((item) => route.path.startsWith(item.route));
  if (fallback) return [fallback.domain, fallback.item];
  return ['SocioProphet', route.path.replace(/^\//, '') || 'workspace'];
});

const activeRuntimeFeatures = computed<RuntimeAdapterFeature[]>(() => {
  return runtimeFeatureIdsForPath(route.path)
    .map((featureId) => getRuntimeFeature(featureId))
    .filter((feature): feature is RuntimeAdapterFeature => Boolean(feature));
});
</script>
