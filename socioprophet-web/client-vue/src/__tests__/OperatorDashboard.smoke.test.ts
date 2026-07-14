/**
 * Smoke tests for the Operator Dashboard (/capability/dashboard) — the cockpit
 * home. Verifies it mounts (uses useRouter + useNoeticaChat in setup) and
 * aggregates live tiles from every domain fixture with real values.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { createPinia } from 'pinia';
import OperatorDashboard from '../pages/OperatorDashboard.vue';

const stub = { template: '<div />' };
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: stub },
    { path: '/:pathMatch(.*)*', component: stub },
  ],
});

async function mountDashboard() {
  const wrapper = mount(OperatorDashboard, { global: { plugins: [router, createPinia()] } });
  await flushPromises();
  return wrapper;
}

describe('Operator Dashboard', () => {
  it('mounts and renders the operator home + every domain tile', async () => {
    const wrapper = await mountDashboard();
    const text = wrapper.text();

    expect(text).toContain('User Dashboard');
    for (const tile of ['Markets', 'News & Events', 'Economy', 'People', 'Law & Regulation', 'Weather', 'Social Signals', 'Active Alerts']) {
      expect(text).toContain(tile);
    }
  });

  it('binds real fixture values into the tiles', async () => {
    const wrapper = await mountDashboard();
    const text = wrapper.text();

    // A markets symbol and an economy indicator label from the real fixtures.
    expect(text).toContain('SPX');
    expect(text).toContain('Real GDP (QoQ, ann.)');
    // Every card exposes a deep-link "open →" affordance.
    expect(wrapper.findAll('.db-card-head').length).toBeGreaterThanOrEqual(8);
    // The Ask-Noetica line is present (label lives on the input, not in text).
    expect(wrapper.find('.db-ask input').attributes('aria-label')).toContain('Ask Noetica');
  });

  it('deep-links a tile row into its domain surface', async () => {
    const wrapper = await mountDashboard();
    const firstRow = wrapper.find('.db-row');
    expect(firstRow.exists()).toBe(true);

    await firstRow.trigger('click');
    await flushPromises();
    // Clicking a markets row routes into the markets surface with a ?sym= param.
    expect(router.currentRoute.value.path).toBe('/markets/indices-funds');
    expect(router.currentRoute.value.query.sym).toBeTruthy();
  });
});
