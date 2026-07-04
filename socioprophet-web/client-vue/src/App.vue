<template>
  <div class="sp-shell">
    <header class="sp-topbar">
      <RouterLink class="sp-brand" to="/news">SocioProphet</RouterLink>
      <nav class="sp-domain-nav" aria-label="Primary domains">
        <div v-for="menu in domainMenu" :key="menu.label" class="sp-menu">
          <RouterLink :to="menu.to" class="sp-menu-trigger">
            {{ menu.label }}<span class="sp-caret" aria-hidden="true">▾</span>
          </RouterLink>
          <div class="sp-menu-panel" role="menu">
            <RouterLink
              v-for="leaf in menu.items"
              :key="leaf.to"
              :to="leaf.to"
              class="sp-menu-item"
              role="menuitem"
            >
              {{ leaf.label }}
            </RouterLink>
          </div>
        </div>
      </nav>
      <div class="sp-profile" v-if="auth.user">
        <span class="sp-tier-pill">{{ auth.tier }}</span>
        <span class="sp-user-email">{{ auth.user.email }}</span>
        <button type="button" class="sp-signout" @click="logout">Sign out</button>
      </div>
      <RouterLink v-else class="sp-signin" to="/login">Sign in</RouterLink>
    </header>

    <nav class="sp-tabbar" aria-label="Workspace tabs">
      <button
        class="sp-tab-menu"
        type="button"
        :aria-expanded="navOpen"
        aria-label="Toggle capability navigation"
        @click="navOpen = !navOpen"
      >☷</button>
      <RouterLink v-for="tab in tabLinks" :key="tab.to" :to="tab.to">{{ tab.label }}</RouterLink>
    </nav>

    <div class="sp-workspace">
      <aside class="sp-left-rail" aria-label="Capabilities">
        <RouterLink
          v-for="cap in capabilityRail"
          :key="cap.to"
          :to="cap.to"
          :title="cap.label"
        >
          {{ abbrev(cap.label) }}
        </RouterLink>
      </aside>

      <!-- Expandable named capability panel (Will's SideNav expand), overlay so
           it never disturbs the grid. -->
      <div v-if="navOpen" class="sp-nav-backdrop" @click="navOpen = false" />
      <nav v-if="navOpen" class="sp-nav-panel" aria-label="Capability navigation">
        <div class="sp-nav-section-title">Capabilities</div>
        <RouterLink
          v-for="cap in capabilityRail"
          :key="cap.to"
          :to="cap.to"
          class="sp-nav-link"
          @click="navOpen = false"
        >{{ cap.label }}</RouterLink>
        <div class="sp-nav-section-title">Working surfaces</div>
        <RouterLink
          v-for="op in operatorShortcuts"
          :key="op.to"
          :to="op.to"
          class="sp-nav-link"
          @click="navOpen = false"
        >{{ op.label }}</RouterLink>
        <template v-for="grp in agentCockpit" :key="grp.label">
          <div class="sp-nav-section-title">{{ grp.label }}</div>
          <RouterLink
            v-for="leaf in grp.items"
            :key="leaf.to"
            :to="leaf.to"
            class="sp-nav-link"
            @click="navOpen = false"
          >{{ leaf.label }}</RouterLink>
        </template>
      </nav>

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
        <button
          type="button"
          class="sp-cmd-glyph"
          :class="promptMode"
          :title="promptMode === 'chat' ? 'Chat mode — click to switch to terminal' : 'Terminal mode — click to switch to chat'"
          @click="togglePromptMode()"
        >{{ promptMode === 'chat' ? '◇' : '›_' }}</button>
        <input
          v-model="cmdBar"
          type="text"
          :placeholder="promptMode === 'chat' ? 'Ask Noetica…  ⏎' : 'Run a command…  ⏎'"
          spellcheck="false"
          autocomplete="off"
          @keyup.enter="onPromptSubmit()"
        />
      </div>
      <div class="sp-capture-actions">
        <button
          type="button"
          class="sp-capture-btn"
          :title="`Snapshot ${research.openTabs.length} open tab(s) into the research list`"
          @click="research.snapshotOpen()"
        >
          ⤓ Snapshot ({{ research.openTabs.length }})
        </button>
        <RouterLink class="sp-capture-link" to="/research">Research</RouterLink>
        <button
          type="button"
          class="sp-term-toggle"
          :class="{ on: termOpen }"
          title="Toggle terminal (Ctrl+`)"
          @click="toggleTerm()"
        >›_ Terminal</button>
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

    <!-- Quake/Tilix drop-down operator terminal (Cloud Shell styled), shell-wide.
         Default = drop-down; ⤢ pops it out to a full window. Toggle with Ctrl+` -->
    <div
      v-if="termOpen && termPopout"
      class="sp-term-backdrop"
      @click="termPopout = false"
    />
    <Transition name="sp-term">
      <QuakeTerminal
        v-if="termOpen"
        :variant="termPopout ? 'popout' : 'quake'"
        @close="termOpen = false"
        @toggle-popout="termPopout = !termPopout"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useAuth } from './stores/auth';
import { useResearch } from './stores/research';
import RuntimeAdapterStatusBadge from './components/RuntimeAdapterStatusBadge.vue';
import QuakeTerminal from './components/QuakeTerminal.vue';
import { useOperatorTerminal } from './composables/useOperatorTerminal';
import { useNoeticaChat } from './composables/useNoeticaChat';
import { domainSurfaces, surfaceForRoute, surfacesForDomain } from './config/domainRoutes';
import { AGENT_COCKPIT, CAPABILITY_RAIL, DOMAIN_MENU, OPERATOR_SHORTCUTS } from './config/cockpitNav';
import {
  entriesForDomain,
  registryEntryForPath,
} from './config/routeRegistry';
import { getRuntimeFeature } from './runtime-adapters';
import { runtimeFeatureIdsForPath } from './runtime-adapters/routeRuntimeFeatures';
import type { RuntimeAdapterFeature } from './runtime-adapters';

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const research = useResearch();

const logout = async () => {
  await auth.signOut();
  router.push('/login');
};

const domainMenu = DOMAIN_MENU;
const capabilityRail = CAPABILITY_RAIL;
const operatorShortcuts = OPERATOR_SHORTCUTS;
const agentCockpit = AGENT_COCKPIT;
const navOpen = ref(false);

// Quake drop-down terminal — shell-wide, toggled by the footer button or Ctrl+`.
const termOpen = ref(false);
const termPopout = ref(false);
const term = useOperatorTerminal();
const chat = useNoeticaChat();
const cmdBar = ref('');
// One command bar, two modes: chat (the Noetica social surface) or cmd (operator
// terminal). The glyph toggles; Enter routes to the active mode.
const promptMode = ref<'chat' | 'cmd'>('chat');
function togglePromptMode() { promptMode.value = promptMode.value === 'chat' ? 'cmd' : 'chat'; }
function toggleTerm() { termOpen.value = !termOpen.value; }
async function onPromptSubmit() {
  const v = cmdBar.value.trim();
  if (!v) return;
  cmdBar.value = '';
  if (promptMode.value === 'chat') {
    if (route.path !== '/noetica') await router.push('/noetica');
    chat.send(v);
  } else {
    termOpen.value = true;
    await term.loadStatus();
    term.input.value = v;
    await term.run();
  }
}
function onTermHotkey(e: KeyboardEvent) {
  // Ctrl+`  (backquote) — the classic Quake / VS Code terminal toggle.
  if (e.ctrlKey && (e.key === '`' || e.code === 'Backquote')) {
    e.preventDefault();
    termOpen.value = !termOpen.value;
  } else if (e.key === 'Escape' && termOpen.value) {
    if (termPopout.value) termPopout.value = false;
    else termOpen.value = false;
  }
}
onMounted(() => window.addEventListener('keydown', onTermHotkey));
onUnmounted(() => window.removeEventListener('keydown', onTermHotkey));

// Two-letter abbreviation for the collapsed rail (e.g. "Algorithmic Trading" → "AT").
const abbrev = (label: string): string =>
  label
    .split(/\s+/)
    .filter((w) => w !== '&')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

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

.sp-profile {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.78rem;
}
.sp-tier-pill {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 0.1rem 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.8);
}
.sp-user-email { color: rgba(255, 255, 255, 0.6); }
.sp-signout,
.sp-signin {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  padding: 0.25rem 0.6rem;
  font-size: 0.78rem;
  cursor: pointer;
  text-decoration: none;
}
.sp-signout:hover,
.sp-signin:hover { background: rgba(255, 255, 255, 0.08); }
.sp-signin { margin-left: auto; }

.sp-capture-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sp-capture-btn {
  border: 1px solid rgba(120, 200, 140, 0.4);
  border-radius: 6px;
  background: transparent;
  color: rgba(150, 220, 170, 0.95);
  padding: 0.25rem 0.6rem;
  font-size: 0.76rem;
  cursor: pointer;
  white-space: nowrap;
}
.sp-capture-btn:hover { background: rgba(120, 200, 140, 0.12); }
.sp-capture-link {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.76rem;
  text-decoration: none;
  border-bottom: 1px dotted rgba(255, 255, 255, 0.3);
}

/* Domain mega-menu (top axis) — faithful to Will's HeaderMenu dropdowns */
.sp-domain-nav { display: flex; align-items: stretch; gap: 0; }
.sp-menu { position: relative; }
.sp-menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  height: 100%;
  padding: 0 0.7rem;
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
  font-size: 0.82rem;
  white-space: nowrap;
}
.sp-menu-trigger:hover,
.sp-menu:hover .sp-menu-trigger {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.sp-caret { font-size: 0.6rem; opacity: 0.7; }
.sp-menu-panel {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 40;
  min-width: 15rem;
  display: none;
  flex-direction: column;
  padding: 0.25rem 0;
  background: #161616;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
}
.sp-menu:hover .sp-menu-panel,
.sp-menu:focus-within .sp-menu-panel { display: flex; }
.sp-menu-item {
  padding: 0.5rem 1rem;
  color: rgba(255, 255, 255, 0.78);
  text-decoration: none;
  font-size: 0.8rem;
  white-space: nowrap;
}
.sp-menu-item:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

/* Expandable capability panel (left axis) — overlay, dark theme */
.sp-nav-backdrop {
  position: fixed;
  inset: 0;
  z-index: 45;
  background: rgba(0, 0, 0, 0.35);
}
.sp-nav-panel {
  position: fixed;
  top: 8.5rem;
  left: 0;
  bottom: 5.5rem;
  z-index: 46;
  width: 18rem;
  overflow-y: auto;
  padding: 0.75rem 0;
  background: #161616;
  border-right: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 12px 0 28px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
}
.sp-nav-section-title {
  padding: 0.6rem 1rem 0.35rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.4);
}
.sp-nav-link {
  padding: 0.5rem 1rem;
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
  font-size: 0.82rem;
}
.sp-nav-link:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
.sp-nav-link.router-link-active { color: #78c88c; }
</style>
