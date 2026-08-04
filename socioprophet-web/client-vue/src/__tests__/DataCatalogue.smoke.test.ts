/**
 * Smoke tests for the Data Catalogue (/data/catalogue) — the searchable registry of every source
 * plus per-country coverage grading. Verifies it mounts, lists live sources, and honestly renders
 * the world grade distribution (which must NOT be uniformly "A").
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import DataCatalogue from '../pages/DataCatalogue.vue';

const stub = { template: '<div />' };
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: stub },
    { path: '/:pathMatch(.*)*', component: stub },
  ],
});

async function mountCatalogue() {
  const wrapper = mount(DataCatalogue, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}

describe('Data Catalogue', () => {
  it('mounts and renders the source registry with real upstreams', async () => {
    const wrapper = await mountCatalogue();
    const text = wrapper.text();
    expect(text).toContain('Data Catalogue');
    expect(text).toContain('Census ACS');
    expect(text).toContain('USGS earthquakes');
    expect(text).toContain('World Bank indicators');
    // grade chips present
    expect(wrapper.findAll('.dc-grade').length).toBeGreaterThan(0);
  });

  it('surfaces the acquisition tier + compliance grade per source (governed plane)', async () => {
    const wrapper = await mountCatalogue();
    expect(wrapper.findAll('.dc-tier').length).toBeGreaterThan(0);
    const text = wrapper.text();
    expect(text).toContain('Compliance');
    expect(text).toContain('Tier');
  });

  it('surfaces the honest world grade distribution (not uniformly A)', async () => {
    const wrapper = await mountCatalogue();
    const segs = wrapper.findAll('.dc-dist-seg');
    expect(segs.length).toBe(5); // A B C D F
    // there is at least one non-A grade band with countries in it
    const text = wrapper.text();
    expect(text).toContain('World coverage grade');
  });

  it('switches to the world tab and lists graded countries', async () => {
    const wrapper = await mountCatalogue();
    const worldTab = wrapper.findAll('.dc-tabs button').find((b) => b.text().includes('World coverage'));
    expect(worldTab).toBeTruthy();
    await worldTab!.trigger('click');
    await flushPromises();
    const countries = wrapper.findAll('.dc-country');
    expect(countries.length).toBeGreaterThan(150);
  });
});
