/**
 * Verifies Economy renders a REAL per-sub-domain KPI set (macro/micro/labor/…​/
 * logistics), not one shared indicator strip.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { indicatorsForPath, SUBDOMAIN_GROUP } from '../data/economyFixture';
import EconomySectorBoard from '../pages/EconomySectorBoard.vue';

describe('economy per-sub-domain KPIs', () => {
  it('slices indicators by the sub-domain group', () => {
    const labor = indicatorsForPath('/economy/labor-economics');
    expect(labor.length).toBeGreaterThan(0);
    expect(labor.every((i) => i.group === 'labor')).toBe(true);
    expect(labor.map((i) => i.id)).toContain('payrolls');
    expect(labor.map((i) => i.id)).not.toContain('gdp');

    const tech = indicatorsForPath('/economy/technology-information');
    expect(tech.every((i) => i.group === 'technology')).toBe(true);
    expect(tech.map((i) => i.id)).toContain('semis');
  });

  it('covers every economy sub-domain with a non-empty KPI set', () => {
    for (const path of Object.keys(SUBDOMAIN_GROUP)) {
      expect(indicatorsForPath(path).length, path).toBeGreaterThan(0);
    }
  });

  it('defaults an unknown path to the macro set', () => {
    expect(indicatorsForPath('/capability/economic-prophet').every((i) => i.group === 'macro')).toBe(true);
  });

  it('renders the labor KPIs (not macro) at the labor sub-domain', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/economy/labor-economics');
    await router.isReady();
    const wrapper = mount(EconomySectorBoard, { global: { plugins: [router] } });
    await flushPromises();
    const kpiText = wrapper.findAll('.ec-kpi').map((k) => k.text()).join(' ');
    expect(kpiText).toContain('Nonfarm Payrolls');
    expect(kpiText).not.toContain('Real GDP');
  });
});
