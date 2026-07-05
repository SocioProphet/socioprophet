import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';

import DigitalTwin from '../pages/DigitalTwin.vue';
import { simulate, twins, scenarios } from '../data/twinFixture';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }, { path: '/analytics/digital-twin', component: DigitalTwin }],
});

describe('twin simulation engine', () => {
  it('baseline is a no-op: nothing impacted, no value at risk, lead time unchanged', () => {
    const r = simulate('nvda', 'baseline');
    expect(r.impacted).toHaveLength(0);
    expect(r.valueAtRisk).toBe(0);
    expect(r.leadTimeAfter).toBe(r.leadTimeBefore);
    expect(r.pathRiskAfter).toBeCloseTo(r.pathRiskBefore, 5);
  });

  it('a fab outage shocks the target and propagates downstream with decay', () => {
    const r = simulate('nvda', 'taiwan-fab-outage');
    const sev = r.severityById;
    // target takes the full magnitude
    expect(sev['tsmc-fab']).toBeCloseTo(0.85, 5);
    // a downstream node is impacted but strictly less than the target (decay)
    expect(sev['kaohsiung-port']).toBeGreaterThan(0);
    expect(sev['kaohsiung-port']).toBeLessThan(sev['tsmc-fab']!);
    // real economic + schedule impact
    expect(r.valueAtRisk).toBeGreaterThan(0);
    expect(r.valueAtRiskPct).toBeGreaterThan(0);
    expect(r.pathRiskAfter).toBeGreaterThan(r.pathRiskBefore);
    expect(r.leadTimeAfter).toBe(r.leadTimeBefore + 60);
    // impacted list is sorted severity-desc, headed by the fab
    expect(r.impacted[0]!.id).toBe('tsmc-fab');
  });

  it('a scenario only bites the twin whose chain contains the target', () => {
    // the Taiwan fab is not in the copper twin — copper is untouched by it
    const copper = simulate('copper-major', 'taiwan-fab-outage');
    expect(copper.impacted).toHaveLength(0);
    expect(copper.valueAtRisk).toBe(0);
    // but a Chile shock does bite copper
    const chile = simulate('copper-major', 'chile-water-shortage');
    expect(chile.impacted.length).toBeGreaterThan(0);
    expect(chile.severityById['escondida']).toBeCloseTo(0.6, 5);
  });

  it('every scenario references known twins/targets (no dangling ids)', () => {
    expect(twins.length).toBeGreaterThan(0);
    for (const s of scenarios) {
      for (const t of s.targets) {
        // a target must be a real node id reachable from at least one twin
        const inSomeTwin = twins.some((tw) => simulate(tw.id, s.id).nodes.some((n) => n.id === t));
        expect(inSomeTwin, `${s.id} target ${t}`).toBe(true);
      }
    }
  });

  it('renders the surface with selectors and impact metrics', async () => {
    const wrapper = mount(DigitalTwin, { global: { plugins: [router] } });
    const text = wrapper.text();
    expect(text).toContain('Digital Twin');
    expect(text).toContain('Value at risk');
    expect(wrapper.findAll('select').length).toBe(2); // twin + scenario
  });
});
