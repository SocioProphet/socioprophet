/**
 * Component smoke test for the Studio Platform Explorer panel.
 * Mounts the panel and asserts the teeth: the graph modes render + switch (vector edges appear),
 * the similarity threshold filters edges, and the Kiali-style runtime overlay marks a down node
 * (and can be toggled off).
 */
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import GraphExplorerPanel from '../pages/studio/GraphExplorerPanel.vue';

function mountPanel() {
  return mount(GraphExplorerPanel, { attachTo: document.body });
}

describe('GraphExplorerPanel', () => {
  it('renders the controls and both legends', () => {
    const w = mountPanel();
    expect(w.find('select.ge-mode-graph').exists()).toBe(true);
    expect(w.find('select.ge-mode-explore').exists()).toBe(true);
    expect(w.find('input.ge-threshold').exists()).toBe(true);
    expect(w.find('input.ge-show-topics').exists()).toBe(true);
    expect(w.find('input.ge-show-runtime').exists()).toBe(true);
    // Category legend has the six palette entries.
    expect(w.findAll('.legend').length).toBeGreaterThanOrEqual(2);
    expect(w.findAll('.ge-node').length).toBeGreaterThan(0);
  });

  it('switching graph mode to Vector renders vector edges (none in Topology)', async () => {
    const w = mountPanel();
    expect(w.findAll('.ge-edge.link-vector').length).toBe(0);
    await w.find('select.ge-mode-graph').setValue('vector');
    expect(w.findAll('.ge-edge.link-vector').length).toBeGreaterThan(0);
  });

  it('raising the similarity threshold filters out vector edges', async () => {
    const w = mountPanel();
    await w.find('select.ge-mode-graph').setValue('vector');
    const loose = w.findAll('.ge-edge.link-vector').length;
    const range = w.find('input.ge-threshold');
    (range.element as HTMLInputElement).value = '0.5';
    await range.trigger('input');
    const strict = w.findAll('.ge-edge.link-vector').length;
    expect(strict).toBeLessThan(loose);
  });

  it('marks a down node when the runtime overlay is on, and clears it when off', async () => {
    const w = mountPanel();
    // Overlay is on by default; the fixture has one down node (cloud-broker).
    expect(w.findAll('.ge-node.health-down').length).toBeGreaterThanOrEqual(1);
    expect(w.findAll('.ge-node.health-degraded').length).toBeGreaterThanOrEqual(1);
    await w.find('input.ge-show-runtime').setValue(false);
    expect(w.findAll('.ge-node.health-down').length).toBe(0);
  });

  it('selecting a node opens the details pane with its runtime block', async () => {
    const w = mountPanel();
    // Click the first surface node group.
    await w.find('.ge-node.type-surface').trigger('click');
    expect(w.find('.det-title').exists()).toBe(true);
    expect(w.find('.runtime-block').exists()).toBe(true);
  });
});
