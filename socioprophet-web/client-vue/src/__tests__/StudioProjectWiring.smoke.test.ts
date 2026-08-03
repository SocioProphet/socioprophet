/**
 * Studio ⇄ projects store wiring. Project-scoped tabs (compute setting, notebooks, …)
 * must bind to the REAL active project from the Pinia store, not a hardcoded string.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import Studio from '../pages/Studio.vue';
import StudioComputeSettings from '../pages/studio/StudioComputeSettings.vue';
import { useProjects } from '../stores/projects';

const stub = { template: '<div />' };
function routerAt(path: string) {
  const r = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: stub }] });
  r.push(path);
  return r;
}
async function mountStudioAt(path: string) {
  const router = routerAt(path);
  await router.isReady();
  const wrapper = mount(Studio, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}

describe('Studio project wiring', () => {
  it('passes the active project id from the store to project-scoped tabs', async () => {
    const projects = useProjects();
    const p = projects.create('KG demo');
    const wrapper = await mountStudioAt('/studio?section=compute-settings');
    const child = wrapper.findComponent(StudioComputeSettings);
    expect(child.exists()).toBe(true);
    expect(child.props('project')).toBe(p.id);
  });

  it('falls back to the demo project when none is selected', async () => {
    const wrapper = await mountStudioAt('/studio?section=compute-settings');
    const child = wrapper.findComponent(StudioComputeSettings);
    expect(child.props('project')).toBe('demo');
  });
});
