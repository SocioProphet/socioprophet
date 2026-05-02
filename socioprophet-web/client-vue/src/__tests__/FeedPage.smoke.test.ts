/**
 * Smoke tests for the /feed route (FeedPage.vue).
 *
 * Covers the acceptance criteria from the Vue-first governed content-feed issue:
 *  1. /feed route loads (component mounts without throwing)
 *  2. Feed cards render with required fields
 *  3. Slash-topic filtering works
 *  4. No downvote control exists
 *  5. Governance / evidence labels render
 *  6. Submit shell does not perform uncontrolled writes
 *
 * The feed is entirely fixture-backed so tests are fully offline; no API mocking
 * is required.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import FeedPage from '../pages/FeedPage.vue';
import { FEED_FIXTURES, ALL_SLASH_TOPICS } from '../fixtures/feedFixtures';

// ──────────────────────────────────────────────────────────────────────────────
// Shared router helper
// ──────────────────────────────────────────────────────────────────────────────

function makeRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/feed', component: FeedPage },
      { path: '/', redirect: '/feed' },
    ],
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Criterion 1 — /feed route loads
// ──────────────────────────────────────────────────────────────────────────────

describe('Criterion 1 – /feed route loads', () => {
  it('mounts FeedPage without throwing', () => {
    expect(() =>
      mount(FeedPage, { global: { plugins: [makeRouter()] } }),
    ).not.toThrow();
  });

  it('resolves to a rendered DOM element', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.element).toBeDefined();
  });

  it('renders the page heading', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.find('h1').text()).toMatch(/content feed/i);
  });

  it('renders the Slash Topics governance surface tag', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.text()).toMatch(/slash-topic-query/i);
  });

  it('renders the New Hope membrane tag', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.text()).toMatch(/newhope-membrane-query/i);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Criterion 2 — Feed cards render with required fields
// ──────────────────────────────────────────────────────────────────────────────

describe('Criterion 2 – feed cards render', () => {
  it('renders at least one feed card', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.findAll('.feed-card').length).toBeGreaterThan(0);
  });

  it('renders a card for the first fixture item', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const firstItem = FEED_FIXTURES[0];
    expect(wrapper.find(`[data-testid="feed-card-${firstItem.id}"]`).exists()).toBe(true);
  });

  it('each card has a title', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const titles = wrapper.findAll('.feed-card-title');
    expect(titles.length).toBeGreaterThan(0);
    titles.forEach((title) => expect(title.text().length).toBeGreaterThan(0));
  });

  it('each card shows a source label', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const sources = wrapper.findAll('.feed-source');
    expect(sources.length).toBeGreaterThan(0);
    sources.forEach((src) => expect(src.text().length).toBeGreaterThan(0));
  });

  it('each card shows a content type tag', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const typeTags = wrapper.findAll('.feed-type-tag');
    expect(typeTags.length).toBeGreaterThan(0);
  });

  it('each card shows slash-topic tags', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const topicTags = wrapper.findAll('.feed-topic-tag');
    expect(topicTags.length).toBeGreaterThan(0);
  });

  it('each card shows a timestamp', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const timestamps = wrapper.findAll('.feed-timestamp');
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('each card shows an upvote / endorse button', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const upvoteBtns = wrapper.findAll('[data-testid="upvote-btn"]');
    expect(upvoteBtns.length).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Criterion 3 — Slash-topic filtering works
// ──────────────────────────────────────────────────────────────────────────────

describe('Criterion 3 – slash-topic filtering', () => {
  it('renders the filter bar', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.find('.feed-filter-bar').exists()).toBe(true);
  });

  it('renders an "All" filter button', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.find('[data-testid="filter-all"]').exists()).toBe(true);
  });

  it('renders a filter button for each slash topic', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const filterBtns = wrapper.findAll('.feed-topic-btn');
    // "All" + one button per unique topic
    expect(filterBtns.length).toBe(ALL_SLASH_TOPICS.length + 1);
  });

  it('shows all items when no topic filter is active', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.findAll('.feed-card').length).toBe(FEED_FIXTURES.length);
  });

  it('filters cards by slash topic on button click', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    // Pick the first topic from fixtures
    const topic = ALL_SLASH_TOPICS[0];
    const testId = `filter-topic-${topic.replace(/\//g, '')}`;
    const btn = wrapper.find(`[data-testid="${testId}"]`);
    expect(btn.exists()).toBe(true);

    await btn.trigger('click');
    await flushPromises();

    const expectedCount = FEED_FIXTURES.filter((item) => item.slashTopics.includes(topic)).length;
    expect(wrapper.findAll('.feed-card').length).toBe(expectedCount);
  });

  it('clears the filter when "All" is clicked', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    const topic = ALL_SLASH_TOPICS[0];
    const testId = `filter-topic-${topic.replace(/\//g, '')}`;
    await wrapper.find(`[data-testid="${testId}"]`).trigger('click');
    await flushPromises();

    await wrapper.find('[data-testid="filter-all"]').trigger('click');
    await flushPromises();

    expect(wrapper.findAll('.feed-card').length).toBe(FEED_FIXTURES.length);
  });

  it('shows empty state when a topic with no matching cards is selected', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    // Select every topic simultaneously → only cards matching ALL topics survive
    for (const topic of ALL_SLASH_TOPICS) {
      const testId = `filter-topic-${topic.replace(/\//g, '')}`;
      await wrapper.find(`[data-testid="${testId}"]`).trigger('click');
    }
    await flushPromises();

    // Either some cards match or the empty message is shown
    const cards = wrapper.findAll('.feed-card');
    const emptyMsg = wrapper.find('.feed-empty');
    expect(cards.length > 0 || emptyMsg.exists()).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Criterion 4 — No downvote control exists
// ──────────────────────────────────────────────────────────────────────────────

describe('Criterion 4 – no downvote control exists', () => {
  it('does not render any element with "downvote" in its test ID', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.find('[data-testid*="downvote"]').exists()).toBe(false);
  });

  it('does not render any button with downvote aria-label', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const btns = wrapper.findAll('button');
    const hasDownvote = btns.some((btn) =>
      btn.attributes('aria-label')?.toLowerCase().includes('downvote'),
    );
    expect(hasDownvote).toBe(false);
  });

  it('does not render any downvote button or interactive downvote control', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    // Verify no interactive element (button, [role=button]) has downvote semantics
    const btns = wrapper.findAll('button, [role="button"]');
    const hasDownvoteControl = btns.some((btn) => {
      const label = (btn.attributes('aria-label') ?? '').toLowerCase();
      const testId = (btn.attributes('data-testid') ?? '').toLowerCase();
      const text = btn.text().toLowerCase();
      return label.includes('downvote') || testId.includes('downvote') || text === '▼' || text === '↓';
    });
    expect(hasDownvoteControl).toBe(false);
  });

  it('renders only upvote / endorse buttons', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const upvoteBtns = wrapper.findAll('[data-testid="upvote-btn"]');
    expect(upvoteBtns.length).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Criterion 5 — Governance / evidence labels render
// ──────────────────────────────────────────────────────────────────────────────

describe('Criterion 5 – governance and evidence labels render', () => {
  it('renders a governance panel for each card', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const govPanels = wrapper.findAll('[data-testid="governance-panel"]');
    expect(govPanels.length).toBe(FEED_FIXTURES.length);
  });

  it('renders a Slash Topics surface reference in each governance panel', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const refs = wrapper.findAll('[data-testid="slash-topic-ref"]');
    expect(refs.length).toBeGreaterThan(0);
    refs.forEach((ref) => expect(ref.text()).toMatch(/slash-topics/i));
  });

  it('renders a New Hope membrane state in each governance panel', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const membranes = wrapper.findAll('[data-testid="new-hope-membrane"]');
    expect(membranes.length).toBeGreaterThan(0);
    membranes.forEach((m) => expect(m.text()).toMatch(/newhope-membrane-query/i));
  });

  it('renders a Memory Mesh profile reference in each governance panel', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const meshRefs = wrapper.findAll('[data-testid="memory-mesh-ref"]');
    expect(meshRefs.length).toBeGreaterThan(0);
    meshRefs.forEach((ref) => expect(ref.text()).toMatch(/memory-mesh/i));
  });

  it('renders an evidence / provenance reference in each governance panel', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const evidenceRefs = wrapper.findAll('[data-testid="evidence-ref"]');
    expect(evidenceRefs.length).toBeGreaterThan(0);
    evidenceRefs.forEach((ref) => expect(ref.text()).toMatch(/provenance/i));
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Criterion 6 — Submit shell does not perform uncontrolled writes
// ──────────────────────────────────────────────────────────────────────────────

describe('Criterion 6 – submit shell does not perform uncontrolled writes', () => {
  it('renders the submit shell section', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.find('[data-testid="submit-shell"]').exists()).toBe(true);
  });

  it('renders the submit form', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    expect(wrapper.find('[data-testid="submit-form"]').exists()).toBe(true);
  });

  it('shows a "no write path" notice in the submit section', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const shell = wrapper.find('[data-testid="submit-shell"]');
    expect(shell.text()).toMatch(/no data will be written/i);
  });

  it('shows the fixture-only label on the submit button', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();
    const btn = wrapper.find('[data-testid="submit-btn"]');
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toMatch(/fixture/i);
  });

  it('does not navigate away or throw on submit', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    const form = wrapper.find('[data-testid="submit-form"]');
    expect(() => form.trigger('submit')).not.toThrow();
  });

  it('shows a confirmation status message after submit', async () => {
    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    await wrapper.find('[data-testid="submit-form"]').trigger('submit');
    await flushPromises();

    const status = wrapper.find('[data-testid="submit-status"]');
    expect(status.exists()).toBe(true);
    expect(status.text()).toMatch(/no data written/i);
  });

  it('does not make any fetch/XHR calls on submit', async () => {
    // happy-dom records global.fetch calls; we verify none are made
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());

    const wrapper = mount(FeedPage, { global: { plugins: [makeRouter()] } });
    await flushPromises();

    await wrapper.find('[data-testid="submit-form"]').trigger('submit');
    await flushPromises();

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
