/**
 * The governed-triparty marketplace — netting cells that clear trades by coupling
 * value + proof + authority + disclosure. Verifies the lifecycle/truth/
 * admissibility model and that the surface renders legs, bundles, and the
 * supply-chain cross-link.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { cells, STAGES, ADMIT_LATTICE, stageIndex } from '../data/marketplaceFixture';
import Marketplace from '../pages/Marketplace.vue';

describe('governed triparty marketplace', () => {
  it('models the lifecycle, truth classes, and admissibility lattice', () => {
    expect(ADMIT_LATTICE).toEqual(['evidence', 'admit', 'release', 'export']);
    // Every cell has exactly three legs, one of them the C (clearing/verifier) leg.
    for (const c of cells) {
      expect(c.legs.length).toBe(3);
      expect(c.legs.some((l) => l.role === 'C')).toBe(true);
    }
    // A fully-exported cell is proven and sits at the strictest admissibility gate.
    const exported = cells.find((c) => c.stage === 'Exported')!;
    expect(exported.truthClass).toBe('PROVEN');
    expect(exported.admissibility).toBe('export');
    expect(stageIndex('Exported')).toBe(STAGES.length - 1);
  });

  it('renders a cell with legs, bundles, and lifecycle', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/marketplace');
    await router.isReady();
    const wrapper = mount(Marketplace, { global: { plugins: [router] } });
    await flushPromises();
    expect(wrapper.text()).toContain('Copper cathode');
    expect(wrapper.findAll('.mp-leg').length).toBe(3);
    expect(wrapper.findAll('.mp-bundle').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.mp-life-s').length).toBe(STAGES.length);
  });

  it('a cell clears a supply-chain trade (cross-link routes)', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/marketplace');
    await router.isReady();
    const wrapper = mount(Marketplace, { global: { plugins: [router] } });
    await flushPromises();
    await wrapper.find('.mp-sc-link').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/analytics/supply-chain');
    expect(router.currentRoute.value.query.node).toBeTruthy();
  });
});
