<template>
  <main class="feed-page">
    <section class="feed-hero">
      <div>
        <p class="feed-kicker">Feed Intelligence · {{ state.sourceMode }}</p>
        <h1>Reader as replayable knowledge refinery</h1>
        <p>
          Ticker first, feed subscription second, membrane and memory after admission.
          RSS, Atom, JSON Feed, and ActivityPub remain derived views over canonical events.
        </p>
      </div>
      <span class="feed-pill feed-pill--warn">fixture-backed</span>
    </section>

    <section class="feed-card feed-boundary">
      <span class="feed-pill">UI-first contract surface</span>
      <p>{{ state.boundaryNotice }}</p>
    </section>

    <RouteStatePanel
      state="mock"
      title="Fixture reader state"
      :message="`${state.items.length} feed items, ${state.sources.length} sources, and ${state.events.length} canonical events are loaded from fixture state. No live feed, memory, graph, browser, or publication adapter is active.`"
    />

    <section class="feed-card adapter-boundary" aria-label="Disabled adapter boundary">
      <div class="panel-heading">
        <span>Adapter boundary</span>
        <strong>{{ adapterBoundarySummary() }}</strong>
      </div>
      <div class="adapter-grid">
        <article v-for="adapter in feedIntelligenceAdapters" :key="adapter.id" class="adapter-card">
          <div class="integration-heading">
            <h3>{{ adapter.name }}</h3>
            <span class="surface-status disabled">{{ adapter.status }}</span>
          </div>
          <p>{{ adapter.disabledReason }}</p>
          <small>{{ adapter.owningArtifact }}</small>
        </article>
      </div>
    </section>

    <section class="feed-card adapter-boundary" aria-label="BearBrowser local-event resolver status">
      <div class="panel-heading">
        <span>BearBrowser local-event resolver</span>
        <strong>{{ bearBrowserLocalEventResolution.status }}</strong>
      </div>
      <p>{{ bearBrowserLocalEventResolution.reason }}</p>
      <small>{{ bearBrowserHandoffBoundaryNotice() }}</small>
    </section>

    <section class="feed-card adapter-boundary" aria-label="SlashTopics read-only resolver status">
      <div class="panel-heading">
        <span>SlashTopics read-only resolver</span>
        <strong>{{ slashTopicsReadOnlyResolution.status }}</strong>
      </div>
      <p>{{ slashTopicsReadOnlyResolution.reason }}</p>
      <small>{{ slashTopicScopeBoundaryNotice() }}</small>
    </section>

    <section class="feed-card adapter-boundary" aria-label="New Hope read-only membrane resolver status">
      <div class="panel-heading">
        <span>New Hope read-only membrane resolver</span>
        <strong>{{ newHopeReadOnlyResolution.status }}</strong>
      </div>
      <p>{{ newHopeReadOnlyResolution.reason }}</p>
      <small>{{ newHopeMembraneBoundaryNotice() }}</small>
    </section>

    <section class="feed-card adapter-boundary" aria-label="MemoryMesh read-only posture resolver status">
      <div class="panel-heading">
        <span>MemoryMesh read-only posture resolver</span>
        <strong>{{ memoryMeshReadOnlyResolution.status }}</strong>
      </div>
      <p>{{ memoryMeshReadOnlyResolution.reason }}</p>
      <small>{{ memoryMeshPostureBoundaryNotice() }}</small>
    </section>

    <section class="feed-card adapter-boundary" aria-label="MeshRush read-only graph-view resolver status">
      <div class="panel-heading">
        <span>MeshRush read-only graph-view resolver</span>
        <strong>{{ meshRushReadOnlyResolution.status }}</strong>
      </div>
      <p>{{ meshRushReadOnlyResolution.reason }}</p>
      <small>{{ meshRushGraphViewBoundaryNotice() }}</small>
    </section>

    <section class="ticker-card" aria-label="Ticker proof of life">
      <span class="ticker-label">Ticker</span>
      <button
        v-for="item in state.items"
        :key="item.id"
        type="button"
        :class="['ticker-item', { active: item.id === selectedItem.id }]"
        @click="selectedItemId = item.id"
      >
        <strong>{{ item.title }}</strong>
        <span>{{ item.topicScope }} · {{ item.membraneDecision }}</span>
        <small v-if="item.claims?.length" class="ticker-claims">
          <span v-for="claim in item.claims" :key="claim">{{ claim }}</span>
        </small>
      </button>
    </section>

    <section class="feed-grid">
      <aside class="feed-card source-panel" aria-label="Feed sources">
        <div class="panel-heading">
          <span>Sources</span>
          <strong>{{ state.sources.length }}</strong>
        </div>
        <button
          v-for="source in state.sources"
          :key="source.id"
          type="button"
          :class="['source-card', { active: source.id === selectedSource?.id }]"
          @click="selectedSourceId = source.id"
        >
          <strong>{{ source.title }}</strong>
          <span>{{ source.format }} · {{ source.scope }}</span>
          <small>{{ formatPolicy(source.storagePolicy) }} · {{ source.status }}</small>
        </button>
      </aside>

      <section class="feed-card stream-panel" aria-label="Normalized feed items">
        <div class="panel-heading">
          <span>Stream</span>
          <strong>{{ filteredItems.length }} items</strong>
        </div>
        <button
          v-for="item in filteredItems"
          :key="item.id"
          type="button"
          :class="['item-card', { active: item.id === selectedItem.id }]"
          @click="selectedItemId = item.id"
        >
          <span :class="['decision-pill', item.membraneDecision]">{{ item.membraneDecision }}</span>
          <strong>{{ item.title }}</strong>
          <p>{{ item.summary }}</p>
          <span v-if="item.claims.length" class="item-claims">
            <span v-for="claim in item.claims" :key="claim" class="item-claim">{{ claim }}</span>
          </span>
          <small>{{ item.topicScope }} · {{ item.provenanceHash }}</small>
        </button>
      </section>

      <article class="feed-card detail-panel" aria-label="Selected item detail">
        <div class="panel-heading">
          <span>Canonical item</span>
          <strong>{{ selectedItem.eventRefs.length }} events</strong>
        </div>
        <h2>{{ selectedItem.title }}</h2>
        <p>{{ selectedItem.summary }}</p>

        <dl class="detail-list">
          <div><dt>Canonical URL</dt><dd>{{ selectedItem.canonicalUrl }}</dd></div>
          <div><dt>Published</dt><dd>{{ selectedItem.publishedAt }}</dd></div>
          <div><dt>Normalized</dt><dd>{{ selectedItem.normalizedAt }}</dd></div>
          <div><dt>Storage</dt><dd>{{ formatPolicy(selectedItem.storagePolicy) }}</dd></div>
        </dl>

        <section class="chip-section">
          <h3>Entities</h3>
          <span v-for="entity in selectedItem.entities" :key="entity" class="chip">{{ entity }}</span>
        </section>

        <section class="chip-section">
          <h3>Claims</h3>
          <span v-for="claim in selectedItem.claims" :key="claim" class="chip strong">{{ claim }}</span>
        </section>
      </article>

      <aside class="feed-card memex-panel" aria-label="Memex side panel">
        <div class="panel-heading">
          <span>Fixture chain</span>
          <strong>right rail</strong>
        </div>
        <section class="memex-block">
          <h3>SlashTopics scope</h3>
          <p>{{ selectedSlashTopicScope?.scopeId ?? 'unresolved fixture scope' }}</p>
          <small>{{ selectedSlashTopicScope?.privacyPosture ?? 'No fixture scope found for selected item.' }}</small>
        </section>
        <section class="memex-block">
          <h3>New Hope membrane</h3>
          <p :class="['decision-pill', selectedItem.membraneDecision]">{{ selectedNewHopeMembrane?.decision ?? selectedItem.membraneDecision }}</p>
          <small>{{ selectedNewHopeMembrane?.reason ?? 'No fixture membrane event found.' }}</small>
        </section>
        <section class="memex-block">
          <h3>MemoryMesh posture</h3>
          <p>{{ selectedMemoryMeshPosture?.memoryProfileRef ?? formatPolicy(selectedItem.storagePolicy) }}</p>
          <small>
            {{ selectedMemoryMeshPosture?.recallPolicy.mode ?? 'displayOnly' }} ·
            {{ selectedMemoryMeshPosture?.writebackPolicy.dryRunMode ?? 'no-writeback' }}
          </small>
        </section>
        <section class="memex-block">
          <h3>MeshRush graph</h3>
          <p>{{ selectedMeshRushGraphView?.graphViewId ?? 'no fixture graph view' }}</p>
          <small>
            {{ selectedMeshRushGraphView?.displayMode ?? 'advisoryOnly' }} ·
            traversal {{ selectedMeshRushGraphView?.boundary.liveTraversalEnabled ? 'enabled' : 'disabled' }}
          </small>
        </section>
      </aside>
    </section>

    <section class="event-strip" aria-label="Canonical event chain">
      <article v-for="event in state.events" :key="event.id" :class="['event-step', event.status]">
        <span>{{ event.type }}</span>
        <strong>{{ event.label }}</strong>
        <small>{{ event.evidenceRef }}</small>
      </article>
    </section>

    <section class="integration-grid" aria-label="Stack integration surfaces">
      <article v-for="surface in state.integrations" :key="surface.name" class="integration-card">
        <div class="integration-heading">
          <h3>{{ surface.name }}</h3>
          <span :class="['surface-status', surface.status]">{{ surface.status }}</span>
        </div>
        <p>{{ surface.role }}</p>
        <small>{{ surface.contract }}</small>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import RouteStatePanel from '../components/RouteStatePanel.vue';
import {
  adapterBoundarySummary,
  feedIntelligenceAdapters,
} from '../features/feed-intelligence/adapters';
import {
  bearBrowserHandoffBoundaryNotice,
  resolveBearBrowserLocalEventHandoff,
} from '../features/feed-intelligence/bearbrowserHandoff';
import {
  meshRushGraphViewBoundaryNotice,
  resolveMeshRushGraphViewForItem,
  resolveMeshRushReadOnlyGraphView,
} from '../features/feed-intelligence/meshRushGraphView';
import {
  memoryMeshPostureBoundaryNotice,
  resolveMemoryMeshPostureForItem,
  resolveMemoryMeshReadOnlyPosture,
} from '../features/feed-intelligence/memoryMeshPosture';
import {
  newHopeMembraneBoundaryNotice,
  resolveNewHopeMembraneForItem,
  resolveNewHopeReadOnlyMembrane,
} from '../features/feed-intelligence/newHopeMembrane';
import {
  resolveSlashTopicScopeForSource,
  resolveSlashTopicsReadOnlyScope,
  slashTopicScopeBoundaryNotice,
} from '../features/feed-intelligence/slashTopicsScope';
import { feedIntelligenceState as state } from '../features/feed-intelligence/state';
import type { StoragePolicy } from '../features/feed-intelligence/types';

// Default to the whole canonical stream (no source pre-selected); picking a
// source in the rail filters it. This keeps every item — including the local
// BearBrowser handoff fixture — visible in the stream by default.
const selectedSourceId = ref('');
const selectedItemId = ref(state.items[0]?.id ?? '');

const selectedSource = computed(() => state.sources.find((source) => source.id === selectedSourceId.value));

const filteredItems = computed(() => {
  if (!selectedSource.value) return state.items;
  const scoped = state.items.filter((item) => item.sourceId === selectedSource.value?.id);
  return scoped.length > 0 ? scoped : state.items;
});

const selectedItem = computed(() => state.items.find((item) => item.id === selectedItemId.value) ?? state.items[0]);
const selectedItemSource = computed(() => state.sources.find((source) => source.id === selectedItem.value.sourceId));
const selectedSlashTopicScope = computed(() =>
  selectedItemSource.value ? resolveSlashTopicScopeForSource(selectedItemSource.value) : undefined,
);
const selectedNewHopeMembrane = computed(() => resolveNewHopeMembraneForItem(selectedItem.value));
const selectedMemoryMeshPosture = computed(() => resolveMemoryMeshPostureForItem(selectedItem.value));
const selectedMeshRushGraphView = computed(() => resolveMeshRushGraphViewForItem(selectedItem.value));
const bearBrowserLocalEventResolution = computed(() => resolveBearBrowserLocalEventHandoff({ enabled: false }));
const slashTopicsReadOnlyResolution = computed(() => resolveSlashTopicsReadOnlyScope({ enabled: false }));
const newHopeReadOnlyResolution = computed(() => resolveNewHopeReadOnlyMembrane({ enabled: false }));
const memoryMeshReadOnlyResolution = computed(() => resolveMemoryMeshReadOnlyPosture({ enabled: false }));
const meshRushReadOnlyResolution = computed(() => resolveMeshRushReadOnlyGraphView({ enabled: false }));

function formatPolicy(policy: StoragePolicy): string {
  return policy.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}
</script>

<style scoped>
.feed-page { min-height: 100%; padding: 1.25rem; display: grid; gap: 1rem; background: var(--bg); color: var(--text); }
.feed-hero, .feed-card, .ticker-card, .event-strip, .integration-card { border: 1px solid var(--line); background: var(--surface); border-radius: var(--radius); }
.feed-hero { display: flex; justify-content: space-between; gap: 1rem; padding: 1.25rem; }
.feed-kicker { margin: 0 0 .4rem; color: var(--accent); font-size: .78rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
h1 { margin: 0; font-size: clamp(1.7rem, 3vw, 2.4rem); letter-spacing: -.04em; color: var(--text); }
p { color: var(--text-2); }
.feed-card, .integration-card { padding: 1rem; }
.feed-boundary { border-color: var(--accent-soft); background: rgba(216, 162, 80, 0.06); }
.feed-pill, .decision-pill, .surface-status { display: inline-flex; align-items: center; border-radius: 999px; padding: .2rem .55rem; font-size: .72rem; font-weight: 800; text-transform: uppercase; }
.feed-pill { background: var(--accent-soft); color: var(--accent); }
.feed-pill--warn { background: rgba(216, 162, 80, 0.22); color: var(--accent); }
.ticker-card { display: flex; align-items: stretch; overflow-x: auto; }
.ticker-label { display: grid; place-items: center; padding: 0 1rem; background: var(--surface-2); color: var(--text); font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
.ticker-item, .source-card, .item-card { border: 0; border-right: 1px solid var(--line); background: transparent; color: var(--text); text-align: left; cursor: pointer; transition: background .12s ease; }
.ticker-item:hover, .source-card:hover, .item-card:hover { background: var(--surface-2); }
.ticker-item { min-width: 24rem; display: grid; gap: .25rem; padding: .65rem 1rem; }
.ticker-item.active, .source-card.active, .item-card.active { box-shadow: inset 3px 0 0 var(--accent); background: var(--accent-soft); }
.ticker-item span, small { color: var(--text-3); }
.feed-grid { min-height: 38rem; display: grid; grid-template-columns: 280px 340px minmax(0, 1fr) 320px; gap: 1rem; }
.panel-heading { display: flex; justify-content: space-between; gap: 1rem; padding-bottom: .75rem; margin-bottom: .75rem; border-bottom: 1px solid var(--line); color: var(--text-2); font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; }
.source-card, .item-card { width: 100%; display: grid; gap: .45rem; padding: 1rem; border-bottom: 1px solid var(--line); }
.item-card p { margin: 0; }
.item-claims { display: flex; flex-wrap: wrap; gap: .3rem; }
.item-claim { font-size: .68rem; color: var(--accent); background: rgba(216, 162, 80, 0.1); border: 1px solid var(--accent-soft); border-radius: 5px; padding: .05rem .35rem; }
.detail-panel h2 { font-size: 1.55rem; letter-spacing: -.03em; color: var(--text); }
.detail-list { display: grid; gap: .5rem; }
.detail-list div { display: grid; grid-template-columns: 9rem minmax(0, 1fr); gap: .75rem; padding: .5rem 0; border-bottom: 1px solid var(--line); }
.detail-list dt { color: var(--text-3); }
.detail-list dd { margin: 0; overflow-wrap: anywhere; color: var(--text); }
.chip-section h3, .memex-block h3 { margin-bottom: .4rem; font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; color: var(--text-2); }
.chip { display: inline-flex; margin: 0 .4rem .4rem 0; padding: .25rem .5rem; border: 1px solid var(--line-2); border-radius: 6px; background: var(--surface-2); color: var(--text-2); font-size: .78rem; }
.chip.strong { border-color: var(--accent-soft); color: var(--accent); background: rgba(216, 162, 80, 0.1); }
.memex-block { padding-bottom: .9rem; margin-bottom: .9rem; border-bottom: 1px solid var(--line); }
.decision-pill.admit { background: rgba(75, 191, 115, 0.15); color: var(--up); }
.decision-pill.hold { background: rgba(216, 162, 80, 0.16); color: var(--accent); }
.decision-pill.quarantine { background: rgba(240, 101, 106, 0.16); color: var(--down); }
.decision-pill.reject { background: var(--surface-2); color: var(--text-2); }
.event-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.event-step { display: grid; gap: .35rem; padding: .85rem; border-right: 1px solid var(--line); border-bottom: 3px solid var(--line-2); }
.event-step.complete { border-bottom-color: var(--up); }
.event-step.active { border-bottom-color: var(--accent); }
.event-step.blocked { border-bottom-color: var(--down); }
.event-step span { color: var(--text-3); font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; }
.integration-grid, .adapter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
.integration-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.integration-heading h3 { margin: 0; color: var(--text); }
.adapter-card { display: grid; gap: .4rem; padding: .85rem; border: 1px solid var(--line); border-radius: 10px; background: var(--surface-2); }
.adapter-card p { margin: 0; }
.surface-status.wired { background: rgba(75, 191, 115, 0.15); color: var(--up); }
.surface-status.specified { background: var(--accent-soft); color: var(--accent); }
.surface-status.pending, .surface-status.disabled { background: var(--surface-2); color: var(--text-3); }
@media (max-width: 1100px) { .feed-grid { grid-template-columns: 1fr; } .feed-hero { flex-direction: column; } }
</style>
