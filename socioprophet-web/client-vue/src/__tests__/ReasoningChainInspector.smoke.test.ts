// Smoke test for the Reasoning Chain Inspector surface: mounts, renders the four
// stages, and proves the governed scorer is load-bearing in the UI — switching
// example A to the dedup mode produces a clear top-1 (the raw tie is resolved).
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHashHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import ReasoningChainInspector from '../pages/ReasoningChainInspector.vue';

const stub = { template: '<div />' };
const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: stub }] });

function mountIt() {
  setActivePinia(createPinia());
  return mount(ReasoningChainInspector, { global: { plugins: [router] } });
}

describe('ReasoningChainInspector', () => {
  it('renders the four stage tabs and three examples', () => {
    const w = mountIt();
    expect(w.findAll('.rci-stage').length).toBe(4);
    expect(w.findAll('.rci-pill').length).toBe(3);
  });

  it('annotation stage renders concept tags with governed KIND labels', () => {
    const w = mountIt();
    const tags = w.findAll('.rci-tag');
    expect(tags.length).toBeGreaterThan(0);
    // KIND chip present on typed tags.
    expect(w.findAll('.rci-tag-kind').length).toBeGreaterThan(0);
  });

  it('variants stage shows a clear governed top-1 for example A dedup mode', async () => {
    const w = mountIt();
    // switch to Variants stage
    await w.findAll('.rci-stage')[2].trigger('click');
    // example A defaults to raw mode → switch to the dedup mode
    await w.findAll('.rci-mode')[1].trigger('click');
    const ribbon = w.find('.rci-score-ribbon');
    expect(ribbon.exists()).toBe(true);
    expect(w.find('.rci-variant.top').exists()).toBe(true);
    // governed margin is clearly > 0 after dedup + parsimony
    expect(w.find('.rci-score-ribbon b.clear').text()).not.toBe('0.00');
  });

  it('authoring a concept records a governed, versioned, unsigned event', async () => {
    const w = mountIt();
    await w.findAll('.rci-tag')[0].trigger('click'); // select a concept
    const promote = w.findAll('.rci-author-btns button')[0];
    await promote.trigger('click');
    const ledger = w.find('.rci-ledger');
    expect(ledger.exists()).toBe(true);
    expect(ledger.text()).toContain('unsigned');
    expect(ledger.text()).toContain('human-authored');
  });
});
