/**
 * The human spine — cross-cutting across every layer. Human networks (capital /
 * labor / supply) attach to entities at any level (resource endowment, supply-
 * chain node, market symbol, sector) and link back to People.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { networksForEntity, networks } from '../data/laborFixture';
import HumanNetworks from '../components/HumanNetworks.vue';

describe('human spine (capital / labor / supply)', () => {
  it('attaches human networks at every layer', () => {
    // L0 resource endowment → labor.
    expect(networksForEntity('escondida-orebody').some((n) => n.role === 'labor')).toBe(true);
    // L1 extraction facility → labor + supply.
    const escondida = networksForEntity('escondida').map((n) => n.role);
    expect(escondida).toContain('labor');
    expect(escondida).toContain('supply');
    // L2 market instrument + sector → capital.
    expect(networksForEntity('COPPER').some((n) => n.role === 'capital')).toBe(true);
    expect(networksForEntity('materials').some((n) => n.role === 'capital')).toBe(true);
    // All three roles are represented in the model.
    const roles = new Set(networks.map((n) => n.role));
    expect(roles).toEqual(new Set(['capital', 'labor', 'supply']));
  });

  it('renders nothing when no network attaches (safe on every layer)', () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    const wrapper = mount(HumanNetworks, { props: { entityId: 'nonexistent-entity' }, global: { plugins: [router] } });
    expect(wrapper.find('.hn').exists()).toBe(false);
  });

  it('links a network back to the People domain', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    const wrapper = mount(HumanNetworks, { props: { entityId: 'escondida' }, global: { plugins: [router] } });
    expect(wrapper.text()).toContain('Atacama Mining Workforce');
    await wrapper.find('.hn-net').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/people/search');
    expect(router.currentRoute.value.query.id).toBe('p-mercer');
  });
});
