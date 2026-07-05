/**
 * Layer 0 — Land & Natural Resources. Verifies endowments are the base of the
 * value chain: they resolve to the extraction nodes that draw on them, and the
 * surface links up (resource → extraction → market) while the supply chain links
 * back down (facility → resource base).
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { endowmentsForNode, endowmentsByKind } from '../data/landResourceFixture';
import LandResources from '../pages/LandResources.vue';
import SupplyChainMap from '../pages/SupplyChainMap.vue';

const stub = { template: '<div/>' };
function routerAt(path: string) {
  const r = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: stub }] });
  r.push(path);
  return r;
}

describe('Layer 0 — land & resources', () => {
  it('resolves the resource base under an extraction node', () => {
    const base = endowmentsForNode('escondida').map((e) => e.id);
    expect(base).toContain('escondida-orebody'); // the ore
    expect(base).toContain('atacama-water'); // the binding water constraint
    expect(endowmentsByKind('water').length).toBeGreaterThan(0);
  });

  it('renders endowments and links UP the value chain to the extraction node', async () => {
    const router = routerAt('/weather/natural-resources?e=escondida-orebody');
    await router.isReady();
    const wrapper = mount(LandResources, { global: { plugins: [router] } });
    await flushPromises();
    expect(wrapper.text()).toContain('Escondida Orebody');
    // "Value chain up" surfaces the extraction node and routes to the supply chain.
    const up = wrapper.find('.lr-vc-node.link');
    expect(up.exists()).toBe(true);
    await up.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/analytics/supply-chain');
    expect(router.currentRoute.value.query.node).toBe('escondida');
  });

  it('the supply chain links DOWN to the resource base', async () => {
    const router = routerAt('/analytics/supply-chain?node=escondida');
    await router.isReady();
    const wrapper = mount(SupplyChainMap, { global: { plugins: [router] } });
    await flushPromises();
    const chips = wrapper.findAll('.sc-chip').map((c) => c.text());
    expect(chips.join(' ')).toContain('Escondida Orebody');
  });
});
