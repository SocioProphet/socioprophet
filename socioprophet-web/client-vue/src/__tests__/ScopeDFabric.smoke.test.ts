/**
 * Smoke tests for /workbench/scope-d (ScopeDFabric.vue) — the first native
 * Vue+Carbon port of a render-harness screen. Verifies the page composes the
 * workbench primitive components with the SCOPE-D spec data (axiom chain,
 * collector lanes, admissibility gate, throughput) and renders stage-body only
 * (no duplicated .sp-shell chrome, which App.vue owns).
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ScopeDFabric from '../pages/workbench/ScopeDFabric.vue';

describe('ScopeDFabric (native SCOPE-D surface)', () => {
  it('renders the surface header and the E4/E5/E6-clear tag', () => {
    const wrapper = mount(ScopeDFabric);
    expect(wrapper.text()).toContain('SCOPE-D · collector-policy fabric');
    expect(wrapper.find('.tag.tag-green').text()).toContain('E4/E5/E6 clear');
  });

  it('renders the full A1–A7 axiom chain plus a starting point via P-STEPS', () => {
    const wrapper = mount(ScopeDFabric);
    const steps = wrapper.findAll('.psteps .step');
    // 7 axioms + 1 starting point
    expect(steps.length).toBe(8);
    expect(wrapper.find('.psteps .step.start').exists()).toBe(true);
    expect(wrapper.text()).toContain('A7 · Michael-only E-gate');
  });

  it('renders the admissibility verdict with the resolver = admissible (v-pos)', () => {
    const wrapper = mount(ScopeDFabric);
    const verdict = wrapper.find('.pverdict');
    expect(verdict.exists()).toBe(true);
    const rows = verdict.findAll('.vr');
    expect(rows.length).toBe(4);
    // the resolver row value must classify as positive
    const resolver = rows.find((r) => r.text().includes('admissible'));
    expect(resolver?.find('.v').classes()).toContain('v-pos');
  });

  it('renders the collector graph: hub + 4 satellite nodes', () => {
    const wrapper = mount(ScopeDFabric);
    const nodes = wrapper.findAll('.canvas .pnode');
    expect(nodes.length).toBe(5); // hub + 4 satellites
    expect(wrapper.find('.canvas svg.edges').exists()).toBe(true);
  });

  it('does NOT re-render the app shell (App.vue owns .sp-shell)', () => {
    const wrapper = mount(ScopeDFabric);
    expect(wrapper.find('.sp-shell').exists()).toBe(false);
    expect(wrapper.find('.sp-topbar').exists()).toBe(false);
  });
});
