/**
 * Verifies the News sub-domains are real views of the feed: Event Calendar
 * groups items by day, Recent Events is recency-ordered.
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
  it('Event Calendar groups items into multiple day sections', async () => {
    const wrapper = await mountAt('/news/calendar');
    const days = wrapper.findAll('.nf-day');
    expect(days.length).toBeGreaterThanOrEqual(4); // items span 5 days
    expect(wrapper.findAll('.nf-agenda').length).toBeGreaterThan(0);
    // Day headers span the real date range.
    const text = wrapper.text();
    expect(text).toContain('Jul 3');
    expect(text).toContain('Jun 29');
    // The magazine grid is not used in calendar mode.
    expect(wrapper.find('.nf-mag').exists()).toBe(false);
  });

  it('Recent Events puts the newest item first', async () => {
    const wrapper = await mountAt('/news/recent');
    // The ticker mirrors the item order; newest published item leads.
    const firstTick = wrapper.find('.nf-tick').text();
    expect(firstTick).toContain('Coalition reaches framework on cross-border data flows');
  });

  it('the default feed shows the magazine grid (no calendar)', async () => {
    const wrapper = await mountAt('/news');
    expect(wrapper.find('.nf-day').exists()).toBe(false);
    expect(wrapper.findAll('.nf-mag').length).toBeGreaterThan(0);
  });
});
