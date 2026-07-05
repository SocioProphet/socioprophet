import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ValueDriverTree from '../pages/ValueDriverTree.vue';
import { computeVdt } from '../data/vdtFixture';

describe('Value Driver Tree surface', () => {
  it('computes the same uplift as the canonical engine (economic-prophet --mode vdt)', () => {
    // Engine (full-precision weights): total $10,201,613 / RevenueGrowth $9,677,419.
    // The fixture uses 6-dp display weights, so allow a small rounding tolerance.
    const c = computeVdt();
    expect(Math.abs(c.totalUplift - 10201613)).toBeLessThan(100);
    expect(Math.abs(c.perDriver.RevenueGrowth! - 9677419)).toBeLessThan(100);
    expect(Math.abs(c.projectedEnterpriseValue - 1010201613)).toBeLessThan(100);
  });

  it('renders the driver x domain tensor, KPI-lever cells, and per-driver uplift', () => {
    const wrapper = mount(ValueDriverTree);
    expect(wrapper.findAll('.vdt-cell').length).toBe(36); // 6 drivers x 6 domains
    expect(wrapper.findAll('.vdt-cell.lever').length).toBe(3); // 3 KPI levers
    expect(wrapper.findAll('.vdt-bar-row').length).toBeGreaterThan(0);
    const text = wrapper.text();
    expect(text).toContain('Value Drivers');
    expect(text).toContain('arr_growth_pct');
  });
});
