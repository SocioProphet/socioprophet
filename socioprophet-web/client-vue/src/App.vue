<template>
  <div class="sp-shell">
    <header class="sp-topbar">
      <RouterLink class="sp-brand" to="/news">SocioProphet</RouterLink>
      <nav class="sp-domain-nav" aria-label="Primary domains">
        <RouterLink v-for="item in topRoutes" :key="item.path" :to="item.path">{{ item.label }}</RouterLink>
      </nav>
      <div class="sp-profile-indicator" aria-hidden="true" />
    </header>

    <nav class="sp-tabbar" aria-label="Workspace tabs">
      <button class="sp-tab-menu" type="button" aria-label="Open navigation">☷</button>
      <RouterLink v-for="tab in tabLinks" :key="tab.to" :to="tab.to">{{ tab.label }}</RouterLink>
    </nav>

    <div class="sp-workspace">
      <aside class="sp-left-rail" aria-label="Workspace rail">
        <RouterLink
          v-for="item in railRoutes"
          :key="item.path"
          :to="item.path"
          :title="`${item.label} · ${item.maturity} · ${item.stateMode}`"
        >
          {{ item.railLabel || item.label.slice(0, 2) }}
        </RouterLink>
      </aside>

      <section class="sp-stage">
        <div class="sp-breadcrumbs">
          <span v-for="(crumb, index) in breadcrumbs" :key="`${crumb}-${index}`">
            <span>{{ crumb }}</span>
            <span v-if="index < breadcrumbs.length - 1" class="sp-crumb-separator">/</span>
          </span>
          <span v-if="currentRouteEntry" class="sp-route-badge">
            {{ currentRouteEntry.maturity }} · {{ currentRouteEntry.stateMode }}
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
import {
  entriesForDomain,
  leftRailRoutes,
  registryEntryForPath,
  topNavRoutes,
} from './config/routeRegistry';
import { getRuntimeFeature } from './runtime-adapters';
import { runtimeFeatureIdsForPath } from './runtime-adapters/routeRuntimeFeatures';
import type { RuntimeAdapterFeature } from './runtime-adapters';

const route = useRoute();

const topRoutes = topNavRoutes();
const railRoutes = leftRailRoutes();

const currentRouteEntry = computed(() => registryEntryForPath(route.path));
const surface = computed(() => surfaceForRoute(route.path));
const activeDomain = computed(() => {
  if (currentRouteEntry.value?.domain) return currentRouteEntry.value.domain;
  if (surface.value?.domain) return surface.value.domain;
  if (route.path.startsWith('/analytics')) return 'Maps & Analytics';
  return 'News & Events';
});

const tabLinks = computed(() => {
  if (currentRouteEntry.value?.tabs?.length) return currentRouteEntry.value.tabs;

  const registered = entriesForDomain(activeDomain.value)
    .filter((entry) => entry.navTier !== 'hidden')
    .slice(0, 6)
    .map((entry) => ({ label: entry.label, to: entry.path }));

  if (registered.length > 0) return registered;

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
  if (currentRouteEntry.value?.breadcrumbs?.length) return currentRouteEntry.value.breadcrumbs;
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

<style scoped>
.sp-route-badge {
  margin-left: auto;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  color: rgba(255, 255, 255, 0.64);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
