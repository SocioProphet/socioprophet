<template>
  <section class="feed-page">
    <header class="feed-page-header">
      <div>
        <p class="eyebrow">Content Feed · Slash Topics governed · fixture-backed</p>
        <h1>Content Feed Workbench</h1>
        <p class="feed-subtitle">
          Fixture-backed content aggregator. Public query surface:
          <strong>Slash Topics</strong> (<code>slash-topic-query</code>).
          Runtime membrane: <strong>New Hope</strong> (<code>newhope-membrane-query</code>).
          No direct writes. No downvote action.
        </p>
      </div>
      <div class="status-stack">
        <span class="tag tag-blue">slash-topic-query</span>
        <span class="tag">newhope-membrane-query</span>
        <span class="tag">fixture-backed</span>
        <span class="tag">/feed</span>
        <RuntimeAdapterStatusBadge
          v-for="feature in runtimeFeatures"
          :key="feature.feature_id"
          :feature="feature"
        />
      </div>
    </header>

    <section class="carbon-card surface-module" style="margin-bottom:1rem">
      <div class="section-title">Runtime adapter status</div>
      <div class="detail-grid" v-for="feature in runtimeFeatures" :key="`${feature.feature_id}-feed`">
        <span>{{ feature.display_name }}</span><strong>{{ feature.runtime_state }} · {{ feature.evidence_level }}</strong>
        <span>Owner</span><strong>{{ feature.service_owner_repo }}</strong>
        <span>Contract</span><strong>{{ feature.live_contract_ref || 'pending' }}</strong>
      </div>
    </section>

    <!-- Slash-topic filter -->
    <div class="feed-controls">
      <div class="feed-filter-bar">
        <span class="section-title" style="margin-bottom:0">Filter by slash topic:</span>
        <button
          :class="['tag', 'feed-topic-btn', { 'feed-topic-btn--active': activeTopics.length === 0 }]"
          type="button"
          data-testid="filter-all"
          @click="clearTopicFilter"
        >
          All
        </button>
        <button
          v-for="topic in allTopics"
          :key="topic"
          :class="['tag', 'feed-topic-btn', { 'feed-topic-btn--active': activeTopics.includes(topic) }]"
          type="button"
          :data-testid="`filter-topic-${topic.replace(/\//g, '')}`"
          @click="toggleTopic(topic)"
        >
          {{ topic }}
        </button>
      </div>
    </div>

    <!-- Feed cards -->
    <div class="feed-list" aria-live="polite" aria-label="Content feed">
      <p v-if="filteredItems.length === 0" class="feed-empty">
        No items match the selected slash-topic filter.
      </p>
      <article
        v-for="item in filteredItems"
        :key="item.id"
        class="feed-card"
        :data-testid="`feed-card-${item.id}`"
      >
        <div class="feed-card-header">
          <div class="feed-card-meta">
            <span class="tag feed-type-tag">{{ item.contentType }}</span>
            <span class="feed-source">{{ item.sourceLabel }}</span>
            <time :datetime="item.createdAt" class="feed-timestamp">{{ formatDate(item.createdAt) }}</time>
          </div>
          <div class="feed-card-actions">
            <!-- Upvote only — no downvote action exists -->
            <button
              class="feed-upvote-btn"
              type="button"
              :aria-label="`Endorse: ${item.title}`"
              data-testid="upvote-btn"
              @click="endorseItem(item.id)"
            >
              ▲ {{ localUpvotes[item.id] ?? item.upvotes }}
            </button>
          </div>
        </div>

        <h2 class="feed-card-title">{{ item.title }}</h2>

        <div class="tag-row feed-topic-tags">
          <span
            v-for="topic in item.slashTopics"
            :key="topic"
            class="tag tag-blue feed-topic-tag"
            :data-testid="`card-topic-${topic.replace(/\//g, '')}`"
          >
            {{ topic }}
          </span>
        </div>

        <!-- Governance state panel -->
        <details class="feed-governance" data-testid="governance-panel">
          <summary class="feed-governance-summary">
            <span class="section-title" style="margin-bottom:0">Governance state</span>
          </summary>
          <div class="feed-governance-body">
            <div class="detail-grid">
              <span>Slash Topics surface</span>
              <strong data-testid="slash-topic-ref">{{ item.governance.slashTopicRef }}</strong>
              <span>New Hope membrane</span>
              <strong data-testid="new-hope-membrane">{{ item.governance.newHopeMembrane }}</strong>
              <span>Memory Mesh profile</span>
              <strong data-testid="memory-mesh-ref">{{ item.governance.memoryMeshRef }}</strong>
              <span>Evidence / provenance</span>
              <strong data-testid="evidence-ref">{{ item.governance.evidenceRef }}</strong>
            </div>
          </div>
        </details>
      </article>
    </div>

    <!-- Submit / link-registration form shell -->
    <!-- Writes are intentionally mocked and clearly labelled as fixture-only. -->
    <section class="feed-submit-shell carbon-card" data-testid="submit-shell">
      <div class="section-title">Register a link (fixture-only — no write path active)</div>
      <p class="feed-submit-notice">
        This form shell is a workbench placeholder. No data will be written to any backend.
        A governed write path requires a Slash Topics surface contract and New Hope membrane
        admission before production use.
      </p>
      <form class="feed-submit-form" data-testid="submit-form" @submit.prevent="handleSubmit">
        <label class="input-label" for="feed-submit-url">URL</label>
        <input
          id="feed-submit-url"
          v-model="submitUrl"
          class="field"
          type="url"
          placeholder="https://example.com/article"
          data-testid="submit-url-input"
        />
        <label class="input-label" for="feed-submit-title">Title</label>
        <input
          id="feed-submit-title"
          v-model="submitTitle"
          class="field"
          type="text"
          placeholder="Article title"
          data-testid="submit-title-input"
        />
        <label class="input-label" for="feed-submit-topics">Slash topics (comma-separated)</label>
        <input
          id="feed-submit-topics"
          v-model="submitTopics"
          class="field"
          type="text"
          placeholder="/policy, /governance"
          data-testid="submit-topics-input"
        />
        <button class="primary" type="submit" data-testid="submit-btn">
          Register (fixture preview only)
        </button>
        <p v-if="submitStatus" class="feed-submit-status" data-testid="submit-status">
          {{ submitStatus }}
        </p>
      </form>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import RuntimeAdapterStatusBadge from '../components/RuntimeAdapterStatusBadge.vue';
import { ALL_SLASH_TOPICS, FEED_FIXTURES } from '../fixtures/feedFixtures';
import {
  getRuntimeFeature,
  runtimeFeatureIdsForPath,
  type RuntimeAdapterFeature,
} from '../runtime-adapters';

const runtimeFeatures = computed<RuntimeAdapterFeature[]>(() =>
  runtimeFeatureIdsForPath('/feed')
    .map((featureId) => getRuntimeFeature(featureId))
    .filter((feature): feature is RuntimeAdapterFeature => Boolean(feature)),
);

// ── Slash-topic filter state ──────────────────────────────────────────────────

const allTopics = ALL_SLASH_TOPICS;
const activeTopics = ref<string[]>([]);

function toggleTopic(topic: string) {
  const idx = activeTopics.value.indexOf(topic);
  if (idx === -1) {
    activeTopics.value = [...activeTopics.value, topic];
  } else {
    activeTopics.value = activeTopics.value.filter((t) => t !== topic);
  }
}

function clearTopicFilter() {
  activeTopics.value = [];
}

const filteredItems = computed(() => {
  if (activeTopics.value.length === 0) return FEED_FIXTURES;
  return FEED_FIXTURES.filter((item) =>
    activeTopics.value.every((topic) => item.slashTopics.includes(topic)),
  );
});

// ── Upvote / endorse state (fixture-local, no backend write) ─────────────────

const localUpvotes = reactive<Record<string, number>>({});

function endorseItem(id: string) {
  const base = FEED_FIXTURES.find((item) => item.id === id)?.upvotes ?? 0;
  localUpvotes[id] = (localUpvotes[id] ?? base) + 1;
}

// ── Submit form state (fixture-only, no governed write path) ─────────────────

const submitUrl = ref('');
const submitTitle = ref('');
const submitTopics = ref('');
const submitStatus = ref('');

function handleSubmit() {
  // No write path: fixture-only preview. Log to console for workbench visibility.
  // eslint-disable-next-line no-console
  console.info('[FeedPage] submit preview (fixture-only):', {
    url: submitUrl.value,
    title: submitTitle.value,
    topics: submitTopics.value,
  });
  submitStatus.value =
    'Preview only — no data written. A governed write path requires Slash Topics contract and New Hope membrane admission.';
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}
</script>
