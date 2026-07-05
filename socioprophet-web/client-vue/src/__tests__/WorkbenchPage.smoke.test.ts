/**
 * Smoke tests for /workbench (WorkbenchPage.vue).
 *
 * The operator workbench is 35 self-contained IBM-Carbon render-harness screens served as static assets
 * from public/workbench and mounted in an iframe (the DOSSIER's fidelity mirror — kept verbatim rather
 * than ported, to avoid Carbon drift). These tests cover:
 *  1. the page mounts and renders the shell + iframe
 *  2. the iframe defaults to the workbench launcher (index.html)
 *  3. the two architecture diagrams are reachable from the header nav
 *  4. switching surface updates the iframe src
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import WorkbenchPage from '../pages/WorkbenchPage.vue';

// RouterLink is stubbed to a plain anchor so the page can mount without a full
// router instance; `to` becomes the href (the SCOPE-D native link is /workbench/scope-d).
const RouterLinkStub = {
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
};
const mountOpts = { global: { stubs: { RouterLink: RouterLinkStub } } };

describe('WorkbenchPage', () => {
  it('mounts and renders the workbench iframe defaulting to the launcher index', () => {
    const wrapper = mount(WorkbenchPage, mountOpts);
    const iframe = wrapper.find('iframe.wb-frame');
    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes('src')).toContain('workbench/index.html');
    expect(wrapper.text()).toContain('SocioProphet Operator Workbench');
  });

  it('surfaces the two architecture diagrams in the header nav', () => {
    const wrapper = mount(WorkbenchPage, mountOpts);
    const text = wrapper.text();
    expect(text).toContain('Estate Architecture');
    expect(text).toContain('Cognitive Systems Map');
  });

  it('switching to a surface updates the iframe src', async () => {
    const wrapper = mount(WorkbenchPage, mountOpts);
    const estateLink = wrapper.findAll('a').find((a) => a.text() === 'Estate Architecture')!;
    await estateLink.trigger('click');
    expect(wrapper.find('iframe.wb-frame').attributes('src')).toContain('estate_aligned_architecture.html');
  });

  it('every surface url is scoped under /workbench', () => {
    const wrapper = mount(WorkbenchPage, mountOpts);
    for (const a of wrapper.findAll('a')) {
      const href = a.attributes('href') || '';
      expect(href).toContain('workbench/');
    }
  });
});
