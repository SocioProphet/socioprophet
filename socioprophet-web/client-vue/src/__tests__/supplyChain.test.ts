/**
 * Verifies the supply-chain spine: the cross-domain resolvers link nodes to
 * markets/economy, and the Supply Chain surface's outbound links actually route
 * into the graph / markets (first-class integration, not decoration).
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { nodesForChain, edgesForChain, nodesForMarketSymbol, nodesForSector, nodesForWeatherRegion, nodesForNews } from '../data/supplyChainFixture';
import SupplyChainMap from '../pages/SupplyChainMap.vue';
import MarketMonitor from '../pages/MarketMonitor.vue';

describe('supply-chain spine', () => {
  it('resolves nodes/edges per chain and cross-links to markets + economy', () => {
    expect(nodesForChain('copper').length).toBeGreaterThan(3);
    expect(edgesForChain('copper').length).toBeGreaterThan(0);
    // NVDA appears on the semis chain (fab + OEM); copper carries the Materials sector.
    expect(nodesForMarketSymbol('NVDA').map((n) => n.id)).toContain('nvda-oem');
    expect(nodesForSector('materials').map((n) => n.id)).toContain('copper');
  });

  it('closes the loop: weather regions and news articles resolve to chain nodes', () => {
    // Antofagasta weather covers the copper mine + smelter + port.
    expect(nodesForWeatherRegion('anf').map((n) => n.id)).toContain('escondida');
    // A copper/mining headline surfaces the copper chain.
    expect(nodesForNews('Copper mining output rises', ['Copper']).length).toBeGreaterThan(0);
    // A semis headline surfaces the semiconductor chain.
    expect(nodesForNews('Semiconductors lead the tape', ['NVIDIA']).some((n) => n.chain === 'semis')).toBe(true);
  });

  it('renders the copper chain flow with a node detail', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/analytics/supply-chain');
    await router.isReady();
    const wrapper = mount(SupplyChainMap, { global: { plugins: [router] } });
    await flushPromises();
    expect(wrapper.text()).toContain('Escondida Mine');
    expect(wrapper.findAll('.sc-node').length).toBeGreaterThan(3);
  });

  it('the Open-in-Graph link re-roots the knowledge graph on the node', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/analytics/supply-chain');
    await router.isReady();
    const wrapper = mount(SupplyChainMap, { global: { plugins: [router] } });
    await flushPromises();
    await wrapper.find('.sc-link.graph').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/knowledge/graph');
    expect(String(router.currentRoute.value.query.root)).toMatch(/^hg:/);
  });

  it('reciprocal: a Markets instrument on a chain links into Supply Chain', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/markets/real-assets?sym=COPPER');
    await router.isReady();
    const wrapper = mount(MarketMonitor, { global: { plugins: [router] } });
    await flushPromises();
    const link = wrapper.find('.mk-sc-link');
    expect(link.exists()).toBe(true); // COPPER sits on the copper chain
    await link.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/analytics/supply-chain');
    expect(router.currentRoute.value.query.node).toBe('copper');
  });
});
