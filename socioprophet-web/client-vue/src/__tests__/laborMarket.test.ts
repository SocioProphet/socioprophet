/**
 * The request-centric labor market (Labor Network Charter). Verifies the charter
 * rules hold: fit is scored request↔response (never a global human-worth score),
 * compensation transparency is present, and the surface renders requests +
 * per-response fit + awards.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { requests } from '../data/laborMarketFixture';
import LaborMarket from '../pages/LaborMarket.vue';

describe('request-centric labor market', () => {
  it('scores fit request↔response only — never a global human-worth score', () => {
    for (const r of requests) {
      // Every request declares compensation transparency (LN-004).
      expect(['disclosed', 'exempt']).toContain(r.compensation.transparency);
      // Fit lives on responses (request↔response), scoped to this request.
      for (const resp of r.responses) {
        if (resp.fit) {
          expect(resp.fit.fit).toBeGreaterThanOrEqual(0);
          expect(resp.fit.fit).toBeLessThanOrEqual(1);
          expect(Object.keys(resp.fit.rubric).length).toBeGreaterThan(0);
        }
      }
    }
    // A response object never carries a standalone/global score field.
    const resp = requests.flatMap((r) => r.responses)[0]!;
    expect('globalScore' in resp).toBe(false);
    expect('employabilityScore' in resp).toBe(false);
  });

  it('renders requests with per-response fit rubrics + an award', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/people/labor-market');
    await router.isReady();
    const wrapper = mount(LaborMarket, { global: { plugins: [router] } });
    await flushPromises();
    expect(wrapper.text()).toContain('Independent audit of smelter emissions');
    expect(wrapper.findAll('.lm-resp').length).toBeGreaterThan(0);
    expect(wrapper.find('.lm-dim').exists()).toBe(true); // fit rubric dimension
    expect(wrapper.find('.lm-milestones').exists()).toBe(true); // award work-ledger
  });

  it('a responder links back into the People domain', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/people/labor-market');
    await router.isReady();
    const wrapper = mount(LaborMarket, { global: { plugins: [router] } });
    await flushPromises();
    // The awarded responder references a real person (p-mercer).
    const responders = wrapper.findAll('.lm-responder');
    const awarded = responders.find((b) => b.text().includes('Eng Cooperative 4471'))!;
    await awarded.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/people/search');
    expect(router.currentRoute.value.query.id).toBe('p-mercer');
  });
});
