/**
 * Smoke tests for the Analytics Studio — the shared surface behind the three
 * Maps & Analytics cells. Verifies it mounts at each route and renders the
 * right mode (chart gallery vs trending infographics) over the platform
 * fixtures, with the scope label from navScopeForPath.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import AnalyticsStudio from '../pages/AnalyticsStudio.vue';

const stub = { template: '<div />' };
function routerAt(path: string) {
  const r = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: stub }] });
  r.push(path);
  return r;
}
async function mountAt(path: string) {
  const router = routerAt(path);
  await router.isReady();
  const wrapper = mount(AnalyticsStudio, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}

describe('Analytics Studio', () => {
  it('renders the chart gallery + a bar dataset from the market fixture', async () => {
    const wrapper = await mountAt('/analytics/charts-graphs');
    const text = wrapper.text();
    expect(text).toContain('Charts & Graphs'); // scope label
    expect(text).toContain('Index performance'); // dataset from marketsFixture
    // A bar chart renders bar rows.
    expect(wrapper.findAll('.an-bar-row').length).toBeGreaterThan(0);
  });

  it('renders trending infographics at the trending route', async () => {
    const wrapper = await mountAt('/analytics/trending-infographics');
    const text = wrapper.text();
    expect(text).toContain('Trending Infographics');
    expect(text).toContain('Top trending topic');
    // Infographic cards, not the chart gallery.
    expect(wrapper.findAll('.an-card').length).toBeGreaterThanOrEqual(4);
    expect(wrapper.find('.an-bar-row').exists()).toBe(false);
  });
});
