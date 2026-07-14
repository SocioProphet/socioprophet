<template>
  <div class="sp-shell" :class="{ 'dock-open': cockpit.dockOpen }">
    <header class="sp-topbar">
      <RouterLink class="sp-brand" to="/capability/dashboard">SocioProphet</RouterLink>
      <nav ref="domainNavEl" class="sp-domain-nav" aria-label="Primary domains" @focusout="onDomainFocusOut">
        <div v-for="(menu, mi) in domainMenu" :key="menu.label" class="sp-menu" :class="{ open: openMenu === mi }">
          <RouterLink
            :to="menu.to"
            class="sp-menu-trigger"
            :aria-expanded="openMenu === mi"
            @keydown="onMenuTriggerKey($event, mi)"
          >
            {{ menu.label }}<span class="sp-caret" aria-hidden="true">▾</span>
          </RouterLink>
          <div class="sp-menu-panel" :class="{ 'sp-menu-panel--grouped': menu.groups }" role="menu">
            <template v-if="menu.groups">
              <div v-for="grp in menu.groups" :key="grp.label" class="sp-menu-col">
                <RouterLink :to="grp.to" class="sp-menu-colhead" @click="openMenu = null">{{ grp.label }}</RouterLink>
                <RouterLink
                  v-for="leaf in grp.items"
                  :key="leaf.to"
                  :to="leaf.to"
                  class="sp-menu-item"
                  role="menuitem"
                  @click="openMenu = null"
                >
                  {{ leaf.label }}
                </RouterLink>
              </div>
            </template>
            <RouterLink
              v-for="leaf in menu.items"
              v-else
              :key="leaf.to"
              :to="leaf.to"
              class="sp-menu-item"
              role="menuitem"
              @keydown="onMenuItemKey($event, mi)"
              @click="openMenu = null"
            >
              {{ leaf.label }}
            </RouterLink>
          </div>
        </div>
      </nav>
      <div class="sp-user" v-if="auth.user">
        <button type="button" class="sp-avatar" :aria-expanded="userMenuOpen" aria-label="User menu" @click="userMenuOpen = !userMenuOpen">
          {{ userInitials }}
        </button>
        <div v-if="userMenuOpen" class="sp-user-backdrop" @click="userMenuOpen = false" />
        <div v-if="userMenuOpen" class="sp-user-menu" role="menu">
          <div class="sp-user-head">
            <span class="sp-user-email">{{ auth.user.email }}</span>
            <span class="sp-tier-pill">{{ auth.tier }}</span>
          </div>
          <RouterLink to="/settings" class="sp-user-item" role="menuitem" @click="userMenuOpen = false">Profile</RouterLink>
          <RouterLink to="/settings" class="sp-user-item" role="menuitem" @click="userMenuOpen = false">Settings</RouterLink>
          <RouterLink to="/operator/holograph-me" class="sp-user-item" role="menuitem" @click="userMenuOpen = false">HolographMe</RouterLink>
          <button type="button" class="sp-user-item sp-user-toggle" role="menuitemcheckbox" :aria-checked="settings.theme === 'light'" @click="settings.toggleTheme()">
            <span>Appearance</span><span class="sp-toggle-state">{{ settings.theme === 'light' ? 'Light' : 'Dark' }}</span>
          </button>
          <button type="button" class="sp-user-item sp-user-toggle" role="menuitemcheckbox" :aria-checked="settings.operatorMode" @click="settings.toggleOperatorMode()">
            <span>Operator mode</span><span class="sp-toggle-state" :class="{ on: settings.operatorMode }">{{ settings.operatorMode ? 'On' : 'Off' }}</span>
          </button>
          <button type="button" class="sp-user-item sp-user-signout" role="menuitem" @click="logout">Sign out</button>
        </div>
      </div>
      <RouterLink v-else class="sp-signin" to="/login">Sign in</RouterLink>
    </header>

    <nav ref="tabbarEl" class="sp-tabbar" aria-label="Workspace tabs" @keydown="onRoveKey($event, tabbarEl, 'h')">
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
      <aside ref="railEl" class="sp-left-rail" aria-label="Capabilities" @keydown="onRoveKey($event, railEl, 'v')">
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
      <nav v-if="navOpen" ref="navPanelEl" class="sp-nav-panel" aria-label="Capability navigation" @keydown="onNavPanelKey">
        <button class="sp-nav-search" type="button" @click="paletteOpen = true; navOpen = false">
          <span>⌕ Jump to a surface…</span><kbd>⌘K</kbd>
        </button>

        <template v-if="pinnedSurfaces.length">
          <div class="sp-nav-section-title">Pinned</div>
          <div v-for="p in pinnedSurfaces" :key="p.to" class="sp-nav-link sp-nav-leaf">
            <RouterLink :to="p.to" class="sp-nav-lbl" @click="navOpen = false">{{ p.label }}</RouterLink>
            <button class="sp-pin on" type="button" title="Unpin" @click.stop="settings.togglePin(p.to)">★</button>
          </div>
        </template>

        <template v-for="sec in drawerSections" :key="sec.id">
          <button class="sp-nav-sec" type="button" :aria-expanded="secOpen(sec)" @click="settings.toggleSection(sec.id, secOpen(sec))">
            <span class="sp-nav-caret">{{ secOpen(sec) ? '▾' : '▸' }}</span>
            <span class="sp-nav-sec-lbl" :class="{ op: sec.operator }">{{ sec.label }}</span>
            <span class="sp-nav-count">{{ sec.items.length }}</span>
          </button>
          <template v-if="secOpen(sec)">
            <div v-for="leaf in sec.items" :key="leaf.to" class="sp-nav-link sp-nav-leaf">
              <RouterLink :to="leaf.to" class="sp-nav-lbl" @click="navOpen = false">{{ leaf.label }}</RouterLink>
              <button class="sp-pin" :class="{ on: settings.isPinned(leaf.to) }" type="button" :title="settings.isPinned(leaf.to) ? 'Unpin' : 'Pin'" @click.stop="settings.togglePin(leaf.to)">{{ settings.isPinned(leaf.to) ? '★' : '☆' }}</button>
            </div>
          </template>
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
        <button type="button" class="sp-kbd" title="Command palette" @click="paletteOpen = true">⌘K</button>
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
          class="sp-graph-toggle"
          :class="{ on: cockpit.graphOpen }"
          title="Toggle knowledge graph (⌘G / Ctrl+G)"
          @click="cockpit.toggleGraph()"
        >◈ Graph</button>
        <button
          type="button"
          class="sp-noetica-toggle"
          :class="{ on: cockpit.dockOpen }"
          title="Toggle Noetica assistant (⌘J / Ctrl+J)"
          @click="cockpit.toggleDock()"
        >◇ Noetica</button>
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

    <!-- Spotlight-style command palette (⌘K / Ctrl+K) -->
    <CommandPalette :open="paletteOpen" @close="paletteOpen = false" />

    <!-- Global Noetica assistant dock — available on every page (⌘J / Ctrl+J) -->
    <NoeticaDock :open="cockpit.dockOpen" @close="cockpit.closeDock()" />

    <!-- Global knowledge-graph dock (⌘G / Ctrl+G) -->
    <GraphDock :open="cockpit.graphOpen" @close="cockpit.closeGraph()" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useAuth } from './stores/auth';
import { useResearch } from './stores/research';
import { useCockpit } from './stores/cockpit';
import { useSettings } from './stores/settings';
import RuntimeAdapterStatusBadge from './components/RuntimeAdapterStatusBadge.vue';
import QuakeTerminal from './components/QuakeTerminal.vue';
import CommandPalette from './components/CommandPalette.vue';
import NoeticaDock from './components/NoeticaDock.vue';
import GraphDock from './components/GraphDock.vue';
import { useOperatorTerminal } from './composables/useOperatorTerminal';
import { useNoeticaChat } from './composables/useNoeticaChat';
import { domainSurfaces, surfaceForRoute, surfacesForDomain } from './config/domainRoutes';
import { CAPABILITY_RAIL, DOMAIN_MENU, DRAWER_SECTIONS, ALL_SURFACES, type SurfaceEntry } from './config/cockpitNav';
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
const cockpit = useCockpit();
const settings = useSettings();

const logout = async () => {
  await auth.signOut();
  router.push('/login');
};

// Top row = user domains only. The Operator / SourceOS surfaces do NOT sit in this
// row (they're a dashboard-class thing, already reachable from the hamburger drawer,
// and only when Operator mode is on). Keeps the primary bar clean for everyday users.
const domainMenu = [...DOMAIN_MENU];
const capabilityRail = CAPABILITY_RAIL;
// Accordion drawer: everyday sections open, everything else collapsed-but-present.
const drawerSections = DRAWER_SECTIONS;
function secOpen(sec: (typeof DRAWER_SECTIONS)[number]) { return settings.isSectionOpen(sec.id, sec.defaultOpen, sec.operator); }
const pinnedSurfaces = computed<SurfaceEntry[]>(() =>
  settings.pinned.map((to) => ALL_SURFACES.find((s) => s.to === to)).filter(Boolean) as SurfaceEntry[]);
const navOpen = ref(false);
const userMenuOpen = ref(false);
const userInitials = computed(() => {
  const name: string = auth.user?.displayName ?? '';
  if (name) return name.split(/\s+/).map((s: string) => s[0]).slice(0, 2).join('').toUpperCase();
  const email: string = auth.user?.email ?? '';
  return (email.slice(0, 2) || '?').toUpperCase();
});

// ── Keyboard navigation for the nav menus ────────────────────────────────────
const domainNavEl = ref<HTMLElement | null>(null);
const tabbarEl = ref<HTMLElement | null>(null);
const railEl = ref<HTMLElement | null>(null);
const navPanelEl = ref<HTMLElement | null>(null);
const openMenu = ref<number | null>(null);

function menuEls(): HTMLElement[] { return domainNavEl.value ? Array.from(domainNavEl.value.querySelectorAll<HTMLElement>('.sp-menu')) : []; }
function focusTrigger(i: number) { menuEls()[i]?.querySelector<HTMLElement>('.sp-menu-trigger')?.focus(); }
function itemsOf(mi: number): HTMLElement[] { const m = menuEls()[mi]; return m ? Array.from(m.querySelectorAll<HTMLElement>('.sp-menu-item')) : []; }
function focusItem(mi: number, ii: number) { const items = itemsOf(mi); if (items.length) items[(ii + items.length) % items.length]!.focus(); }

// Top-level menubar item: ArrowDown opens the submenu; Left/Right move between
// menus; Enter navigates (RouterLink default); Escape closes.
function onMenuTriggerKey(e: KeyboardEvent, mi: number) {
  const n = menuEls().length;
  if (e.key === 'ArrowDown') { e.preventDefault(); openMenu.value = mi; nextTick(() => focusItem(mi, 0)); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); openMenu.value = null; focusTrigger((mi + 1) % n); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); openMenu.value = null; focusTrigger((mi - 1 + n) % n); }
  else if (e.key === 'Escape') { openMenu.value = null; }
}
// Submenu item: Up/Down move; Left/Right jump to the adjacent menu; Escape back
// to the trigger; Enter navigates.
function onMenuItemKey(e: KeyboardEvent, mi: number) {
  const items = itemsOf(mi);
  const cur = items.indexOf(document.activeElement as HTMLElement);
  const n = menuEls().length;
  if (e.key === 'ArrowDown') { e.preventDefault(); focusItem(mi, cur + 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (cur <= 0) { openMenu.value = null; focusTrigger(mi); } else focusItem(mi, cur - 1); }
  else if (e.key === 'Escape') { e.preventDefault(); openMenu.value = null; focusTrigger(mi); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); const t = (mi + 1) % n; openMenu.value = t; nextTick(() => focusItem(t, 0)); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); const t = (mi - 1 + n) % n; openMenu.value = t; nextTick(() => focusItem(t, 0)); }
}
// Close the mega-menu when focus leaves the whole nav.
function onDomainFocusOut() { setTimeout(() => { if (domainNavEl.value && !domainNavEl.value.contains(document.activeElement)) openMenu.value = null; }, 0); }

// Roving arrow-key focus for a link/button strip. dir 'h' = Left/Right, 'v' = Up/Down.
function onRoveKey(e: KeyboardEvent, container: HTMLElement | null, dir: 'h' | 'v') {
  const nextKey = dir === 'h' ? 'ArrowRight' : 'ArrowDown';
  const prevKey = dir === 'h' ? 'ArrowLeft' : 'ArrowUp';
  if (e.key !== nextKey && e.key !== prevKey) return;
  const els = container ? Array.from(container.querySelectorAll<HTMLElement>('a, button')) : [];
  const cur = els.indexOf(document.activeElement as HTMLElement);
  if (cur < 0 || els.length === 0) return;
  e.preventDefault();
  const nx = e.key === nextKey ? (cur + 1) % els.length : (cur - 1 + els.length) % els.length;
  els[nx]!.focus();
}
function onNavPanelKey(e: KeyboardEvent) {
  if (e.key === 'Escape') { navOpen.value = false; return; }
  onRoveKey(e, navPanelEl.value, 'v');
}

// Any navigation closes the open menus.
watch(() => route.path, () => { openMenu.value = null; navOpen.value = false; userMenuOpen.value = false; });

// Quake drop-down terminal — shell-wide, toggled by the footer button or Ctrl+`.
const paletteOpen = ref(false);
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
    // Open the assistant dock inline (available on every page) rather than
    // navigating away to the /noetica surface.
    cockpit.openDock();
    chat.send(v);
  } else {
    termOpen.value = true;
    await term.loadStatus();
    term.input.value = v;
    await term.run();
  }
}
function onTermHotkey(e: KeyboardEvent) {
  // Cmd/Ctrl+K — Spotlight-style command palette (⌘Space is reserved by macOS).
  if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    paletteOpen.value = !paletteOpen.value;
    return;
  }
  // Cmd/Ctrl+J — toggle the global Noetica assistant dock (chat anywhere).
  if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'J')) {
    e.preventDefault();
    cockpit.toggleDock();
    return;
  }
  // Cmd/Ctrl+G — toggle the global knowledge-graph dock.
  if ((e.metaKey || e.ctrlKey) && (e.key === 'g' || e.key === 'G')) {
    e.preventDefault();
    cockpit.toggleGraph();
    return;
  }
  if (e.key === 'Escape' && cockpit.dockOpen && !termOpen.value) { cockpit.closeDock(); return; }
  if (e.key === 'Escape' && cockpit.graphOpen && !termOpen.value) { cockpit.closeGraph(); return; }
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

/* Top-right user dropdown */
.sp-user { margin-left: auto; position: relative; }
.sp-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.72rem; font-weight: 600; cursor: pointer;
}
.sp-avatar:hover { background: rgba(255, 255, 255, 0.16); }
.sp-user-backdrop { position: fixed; inset: 0; z-index: 40; }
.sp-user-menu {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: 41;
  min-width: 240px; padding: 6px 0;
  background: #14161c; border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
.sp-user-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 14px 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.sp-user-item {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  width: 100%; text-align: left; padding: 8px 14px;
  background: transparent; border: 0; cursor: pointer;
  color: rgba(255, 255, 255, 0.85); font-size: 0.82rem; text-decoration: none;
}
.sp-user-item:hover { background: rgba(255, 255, 255, 0.08); }
.sp-toggle-state { font-size: 0.72rem; color: rgba(255, 255, 255, 0.5); }
.sp-toggle-state.on { color: #34d399; }
.sp-user-signout { border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 4px; }
.sp-nav-op { color: #34d399; }

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
.sp-noetica-toggle {
  border: 1px solid rgba(120, 160, 255, 0.4);
  border-radius: 6px;
  background: transparent;
  color: rgba(150, 180, 255, 0.95);
  padding: 0.25rem 0.6rem;
  font-size: 0.76rem;
  cursor: pointer;
  white-space: nowrap;
}
.sp-noetica-toggle:hover { background: rgba(120, 160, 255, 0.12); }
.sp-noetica-toggle.on { background: rgba(120, 160, 255, 0.18); color: #fff; }
.sp-graph-toggle {
  border: 1px solid rgba(47, 107, 255, 0.4);
  border-radius: 6px;
  background: transparent;
  color: rgba(130, 160, 255, 0.95);
  padding: 0.25rem 0.6rem;
  font-size: 0.76rem;
  cursor: pointer;
  white-space: nowrap;
}
.sp-graph-toggle:hover { background: rgba(47, 107, 255, 0.12); }
.sp-graph-toggle.on { background: rgba(47, 107, 255, 0.2); color: #fff; }

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
.sp-menu.open .sp-menu-panel { display: flex; }
.sp-menu-item:focus-visible, .sp-menu-trigger:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; border-radius: 4px; }
/* Grouped mega-menu (Operator) — anchored right so it doesn't overflow the viewport. */
.sp-menu-panel--grouped {
  left: auto; right: 0;
  flex-direction: row; flex-wrap: wrap;
  gap: 0.4rem 1.1rem;
  width: max-content; max-width: 44rem;
  padding: 0.85rem 1rem;
}
.sp-menu-col { display: flex; flex-direction: column; min-width: 9.5rem; }
.sp-menu-colhead {
  font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;
  color: var(--text-3, #8b949e); text-decoration: none;
  padding: 0.2rem 0.75rem 0.3rem; margin-bottom: 0.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.sp-menu-colhead:hover { color: var(--text); }
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
/* Accordion drawer */
.sp-nav-search { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; width: calc(100% - 1.2rem); margin: 0.6rem; padding: 0.5rem 0.7rem; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; color: rgba(255, 255, 255, 0.6); cursor: pointer; font-size: 0.82rem; }
.sp-nav-search kbd { font-size: 0.66rem; border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 4px; padding: 0 0.3rem; }
.sp-nav-sec { display: flex; align-items: center; gap: 0.5rem; width: 100%; background: transparent; border: 0; cursor: pointer; padding: 0.5rem 1rem; color: rgba(255, 255, 255, 0.85); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; }
.sp-nav-sec:hover { background: rgba(255, 255, 255, 0.05); }
.sp-nav-caret { width: 0.8rem; color: rgba(255, 255, 255, 0.5); font-size: 0.7rem; }
.sp-nav-sec-lbl { flex: 1; text-align: left; }
.sp-nav-sec-lbl.op { color: #34d399; }
.sp-nav-count { font-size: 0.68rem; color: rgba(255, 255, 255, 0.4); }
.sp-nav-leaf { display: flex; align-items: center; gap: 0.5rem; }
.sp-nav-leaf .sp-nav-lbl { flex: 1; color: rgba(255, 255, 255, 0.82); text-decoration: none; }
.sp-nav-leaf .sp-nav-lbl.router-link-active { color: #78c88c; }
.sp-nav-leaf:hover { background: rgba(255, 255, 255, 0.08); }
.sp-pin { background: transparent; border: 0; cursor: pointer; color: rgba(255, 255, 255, 0.28); font-size: 0.9rem; padding: 0 0.2rem; line-height: 1; }
.sp-pin.on, .sp-pin:hover { color: #f5b301; }
</style>
