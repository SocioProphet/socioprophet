/**
 * Smoke test for the CausalGraphView page.
 *
 * The view mounts, calls assertWellFormed at construction, and renders one
 * hypothesis row per hypothesis and one edge row per edge. Toggling an edge
 * opens the warrant drill-down so the "every surface shows its warrant"
 * principle is visible not just declared.
 */
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CausalGraphView from '../pages/CausalGraphView.vue';
import { demoAutoPartsSnapshot } from '../features/causal-graph/state';

describe('CausalGraphView', () => {
  it('renders one row per hypothesis and one per edge from the demo snapshot', () => {
    const w = mount(CausalGraphView);
    expect(w.findAll('.hypothesis').length).toBe(demoAutoPartsSnapshot.hypotheses.length);
    expect(w.findAll('.edge').length).toBe(demoAutoPartsSnapshot.edges.length);
  });

  it('surfaces the source-document warrant when an edge is clicked', async () => {
    const w = mount(CausalGraphView);
    // No drill-down visible before click.
    expect(w.find('.edge .drill-down').exists()).toBe(false);

    await w.find('.edge .row').trigger('click');

    const drilled = w.find('.edge .drill-down');
    expect(drilled.exists()).toBe(true);
    // The auto-parts fixture references a document — the surface must show it.
    expect(drilled.text()).toContain('urn:srcos:doc:');
  });

  it('shows a distinct severity badge per claim status', () => {
    const w = mount(CausalGraphView);
    const tones = w.findAll('.badge').map((b) => b.attributes('data-tone'));
    // The demo has both evidenced and proposed hypotheses.
    expect(new Set(tones).size).toBeGreaterThan(1);
  });
});

describe('accessibility (Copilot follow-up)', () => {
  it('every disclosure button declares aria-expanded and aria-controls', () => {
    const w = mount(CausalGraphView);
    const buttons = w.findAll('.row');
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) {
      expect(b.attributes('type')).toBe('button');
      expect(b.attributes('aria-expanded')).toBeDefined();
      expect(b.attributes('aria-controls')).toBeDefined();
    }
  });

  it('aria-expanded flips when a row is clicked', async () => {
    const w = mount(CausalGraphView);
    const first = w.find('.hypothesis .row');
    expect(first.attributes('aria-expanded')).toBe('false');
    await first.trigger('click');
    expect(first.attributes('aria-expanded')).toBe('true');
  });

  it('drill-down id matches the button aria-controls', async () => {
    const w = mount(CausalGraphView);
    const btn = w.find('.edge .row');
    const id = btn.attributes('aria-controls');
    await btn.trigger('click');
    const drilled = w.find('.edge .drill-down');
    expect(drilled.attributes('id')).toBe(id);
  });
});
