/**
 * Supply-chain operational-risk lens (BIAN/FICO). Verifies the framework rules
 * hold: residual never exceeds inherent (controls only reduce), factors are
 * bounded [0,1], concentration clusters carry an HHI, and the map surface
 * renders the residual/inherent scores + inherent factors for a node that
 * has an assessed risk.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { nodeRisk, chainRisk, clusterRisk, riskForNode, ratingColor, FACTORS } from '../data/supplyChainRiskFixture';
import SupplyChainMap from '../pages/SupplyChainMap.vue';

describe('supply-chain operational-risk lens', () => {
  it('controls only reduce: residual <= inherent, factors bounded', () => {
    for (const [id, r] of Object.entries(nodeRisk)) {
      expect(r.residualScore, id).toBeLessThanOrEqual(r.inherentScore);
      expect(r.inherentScore).toBeGreaterThanOrEqual(0);
      expect(r.inherentScore).toBeLessThanOrEqual(1);
      for (const [k] of FACTORS) {
        const v = r.inherent[k];
        expect(v, `${id}.${k}`).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('concentration clusters carry an HHI and blast radius', () => {
    for (const [id, c] of Object.entries(clusterRisk)) {
      expect(c.hhi, id).toBeGreaterThan(0);
      expect(c.hhi).toBeLessThanOrEqual(1);
      expect(c.blastRadius).toBeGreaterThan(0);
    }
    // Single-fab semis concentration is the sharpest common-mode risk.
    expect(clusterRisk.semis!.hhi).toBeGreaterThan(clusterRisk.copper!.hhi);
    expect(clusterRisk.semis!.rating).toBe('Critical');
  });

  it('path risk exists for each modelled chain and rating maps to a color', () => {
    expect(chainRisk.copper).toBeTruthy();
    expect(chainRisk.semis).toBeTruthy();
    expect(ratingColor('Critical')).toBe('var(--down)');
    expect(ratingColor('Low')).toBe('var(--up)');
    // TSMC fab is the one Critical node in the estate fixture.
    expect(riskForNode('tsmc-fab')!.rating).toBe('Critical');
    expect(riskForNode('does-not-exist')).toBeUndefined();
  });

  it('renders the residual/inherent scores + inherent factors on the map', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/operations/supply-chain');
    await router.isReady();
    const wrapper = mount(SupplyChainMap, { global: { plugins: [router] } });
    await flushPromises();
    expect(wrapper.find('.sc-risk').exists()).toBe(true);
    expect(wrapper.text()).toContain('Operational risk');
    // Six inherent factors render for the assessed node.
    expect(wrapper.findAll('.sc-factor').length).toBe(FACTORS.length);
  });
});
