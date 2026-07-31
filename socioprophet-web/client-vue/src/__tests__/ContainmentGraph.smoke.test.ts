/**
 * Smoke test for the Containment / Blast-Radius surface.
 * Mounts, renders the blast-radius satellites, and switching the sever scope
 * changes the contained count (Full contains more than Selective).
 */
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHashHistory } from 'vue-router';
import ContainmentGraph from '../pages/ContainmentGraph.vue';
import { demoTopology } from '../features/containment/types';

const stub = { template: '<div />' };
const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: stub }] });
const mountOpts = { global: { plugins: [router] } };

describe('ContainmentGraph', () => {
  it('renders one graph node per non-source endpoint', () => {
    const w = mount(ContainmentGraph, mountOpts);
    // hub + satellites = all topology nodes; satellites = all but the source.
    expect(w.findAll('.pnode').length).toBe(demoTopology.nodes.length);
  });

  it('switching Full → Selective reduces the contained count', async () => {
    const w = mount(ContainmentGraph, mountOpts);
    const containedN = () => Number((w.find('.ro.cut .n').element as HTMLElement).textContent);
    // Default scope is Full.
    const full = containedN();
    await w.findAll('.scope-btn')[1].trigger('click'); // Selective
    const selective = containedN();
    expect(full).toBeGreaterThan(selective);
  });

  it('shows the verification badge when the sever contains something', () => {
    const w = mount(ContainmentGraph, mountOpts);
    expect(w.find('.verify').exists()).toBe(true);
    expect(w.find('.verify.noop').exists()).toBe(false); // Full isolation contains 4
  });
});
