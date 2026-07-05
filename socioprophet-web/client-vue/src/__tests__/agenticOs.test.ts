/**
 * The Agentic Operating System — pods pursuing objectives under a governed
 * cadence with a readiness scorecard. Verifies the scoring model and that the
 * console renders objectives, cadence, and readiness.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { opportunities, READINESS_DIMS, readinessPct, readinessRag } from '../data/agenticOsFixture';
import AgenticOS from '../pages/AgenticOS.vue';

describe('agentic operating system', () => {
  it('scores readiness across 12 dimensions (0..36 → %/RAG)', () => {
    expect(READINESS_DIMS.length).toBe(12);
    const health = opportunities.find((o) => o.id === 'health-devsecops')!;
    // 18/36 = 50% → Amber.
    expect(readinessPct(health.readiness)).toBe(50);
    expect(readinessRag(health.readiness)).toBe('Amber');
  });

  it('renders the console: objectives, cadence, and the readiness scorecard', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/agentic-os');
    await router.isReady();
    const wrapper = mount(AgenticOS, { global: { plugins: [router] } });
    await flushPromises();
    const text = wrapper.text();
    expect(text).toContain('Health Services DevSecOps');
    expect(text).toContain('Capture Lead'); // an emphasized agent pod
    expect(wrapper.findAll('.aos-row').length).toBeGreaterThan(3); // objective portfolio
    expect(wrapper.findAll('.aos-cad').length).toBe(9); // W0..W8 cadence
    expect(wrapper.findAll('.aos-dim').length).toBe(12); // readiness scorecard
  });

  it('reuse-repo anchors deep-link into the estate graph', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/agentic-os');
    await router.isReady();
    const wrapper = mount(AgenticOS, { global: { plugins: [router] } });
    await flushPromises();
    await wrapper.find('.aos-repo').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/knowledge/graph');
    expect(String(router.currentRoute.value.query.root)).toMatch(/^hg:repo\//);
  });
});
