/**
 * Verifies the corrected News surface (Lobsters × Feedly): the default feed is a
 * score-ranked story stream with community affordances, /news/recent is
 * recency-ordered (newest first), and the Event Calendar lens still groups items
 * by day.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { createPinia } from 'pinia';
import NewsFeed from '../pages/NewsFeed.vue';

const stub = { template: '<div/>' };
async function mountAt(path: string) {
  const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: stub }] });
  router.push(path);
  await router.isReady();
  const wrapper = mount(NewsFeed, { global: { plugins: [router, createPinia()] } });
  await flushPromises();
  return wrapper;
}

describe('news sub-domain views', () => {
  it('the default feed is a Lobsters-style story stream with community affordances', async () => {
    const wrapper = await mountAt('/news');
    expect(wrapper.find('.nf-day').exists()).toBe(false);
    expect(wrapper.findAll('.nf-story').length).toBeGreaterThan(0);
    // Upvote + score + tags are the Lobsters layer the old inbox lacked.
    expect(wrapper.find('.nf-up').exists()).toBe(true);
    expect(wrapper.find('.nf-score').exists()).toBe(true);
    expect(wrapper.find('.nf-tag').exists()).toBe(true);
    // Stories are never downvoted — no downvote control in the stream.
    expect(wrapper.find('.nf-story .nf-down').exists()).toBe(false);
  });

  it('Recent puts the newest story first', async () => {
    const wrapper = await mountAt('/news/recent');
    const first = wrapper.find('.nf-story .nf-story-title').text();
    expect(first).toContain('Coalition reaches framework on cross-border data flows');
  });

  it('Event Calendar groups items into multiple day sections', async () => {
    const wrapper = await mountAt('/news/calendar');
    const days = wrapper.findAll('.nf-day');
    expect(days.length).toBeGreaterThanOrEqual(4); // items span 5 days
    expect(wrapper.findAll('.nf-agenda').length).toBeGreaterThan(0);
    const text = wrapper.text();
    expect(text).toContain('Jul 3');
    expect(text).toContain('Jun 29');
    // Calendar lens replaces the story stream.
    expect(wrapper.find('.nf-story').exists()).toBe(false);
  });
});
