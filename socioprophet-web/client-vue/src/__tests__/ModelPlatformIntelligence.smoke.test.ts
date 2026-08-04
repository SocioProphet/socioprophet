/**
 * Model Platform Intelligence — live wiring smoke tests.
 *
 * PR #543 shipped this investigation UI with code refs that opened plain GitHub blob
 * links and an "Ask the agent" button that was a dead placeholder (`asked.value = true`).
 * These tests cover the two follow-ons:
 *
 *  1. Code refs deep-link into the LIVE HellGraph code-graph view (/knowledge/graph,
 *     the same route AgenticOS.vue's `hg:repo/…` reuse-repo anchors already use — see
 *     agenticOs.test.ts) instead of only a GitHub blob link.
 *  2. "Ask the agent" calls the real hellgraph-service GraphRAG endpoint
 *     (POST /api/graph/ask, via services/hellgraphApi.ts::askGraphWithFallback) and
 *     renders its actual response — grounded answer, grounded-but-extractive citations,
 *     ungrounded (0 facts), or an honest "unreachable" state — never a fabricated answer.
 *
 * fetch is stubbed per test; the stub is removed in afterEach so it cannot leak.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import ModelPlatformIntelligence from '../pages/ModelPlatformIntelligence.vue';

afterEach(() => vi.unstubAllGlobals());

function routerAt(path: string) {
  const r = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
  r.push(path);
  return r;
}

async function mountPage() {
  const router = routerAt('/competitive/model-platforms');
  await router.isReady();
  const wrapper = mount(ModelPlatformIntelligence, { global: { plugins: [router] } });
  await flushPromises();
  return { wrapper, router };
}

describe('ModelPlatformIntelligence · code refs → live HellGraph', () => {
  it('opens a code ref in the live code-graph view, not a GitHub-only link', async () => {
    const { wrapper, router } = await mountPage();
    const ref = wrapper.find('.mp-ref.code');
    expect(ref.exists()).toBe(true);
    // The GitHub link is still present (secondary, real, always-works provenance link).
    const src = ref.find('.mp-refsrc');
    expect(src.exists()).toBe(true);
    expect(src.attributes('href')).toMatch(/^https:\/\/github\.com\//);

    await ref.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/knowledge/graph');
    expect(String(router.currentRoute.value.query.root)).toMatch(/^hg:code\//);
    expect(String(router.currentRoute.value.query.root)).toContain('inference_gateway.py');
  });

  it('a click on the secondary GitHub source link does not also navigate to the graph', async () => {
    const { wrapper, router } = await mountPage();
    const src = wrapper.find('.mp-ref.code .mp-refsrc');
    await src.trigger('click');
    await flushPromises();
    // @click.stop on the source link — the outer ref's navigation handler must not fire.
    expect(router.currentRoute.value.path).not.toBe('/knowledge/graph');
  });
});

describe('ModelPlatformIntelligence · Ask the agent → live GraphRAG', () => {
  it('renders a synthesized, cited answer when the live graph is grounded', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      expect(String(url)).toContain('/api/graph/ask');
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          question: 'x',
          answer: 'SociOS wins on sovereignty [1] and replayable receipts [2].',
          citations: [
            { n: 1, fact: 'SociOS sovereignty rank = 1', subject: 'sociOS', predicate: 'sovereigntyRank', object: '1', isIri: false, assertedAt: '2026-08-01T00:00:00Z' },
            { n: 2, fact: 'SociOS emits RunReceipt', subject: 'sociOS', predicate: 'emits', object: 'RunReceipt', isIri: false, assertedAt: '2026-08-01T00:00:00Z' },
          ],
          synthesized: true,
          grounded: true,
        }),
      };
    }));
    const { wrapper } = await mountPage();
    await wrapper.find('.mp-ask').trigger('click');
    await flushPromises();
    const text = wrapper.text();
    expect(text).toContain('SociOS wins on sovereignty');
    expect(text).toContain('SociOS sovereignty rank = 1');
    expect(text).not.toContain('nothing fabricated');
  });

  it('honestly reports zero grounded facts instead of fabricating an answer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ question: 'x', answer: '', citations: [], synthesized: false, grounded: false }),
    })));
    const { wrapper } = await mountPage();
    await wrapper.find('.mp-ask').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('nothing fabricated');
  });

  it('fails closed to an explicit "unreachable" state on network failure — no fake answer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED (test: hellgraph-service unavailable)'); }));
    const { wrapper } = await mountPage();
    await wrapper.find('.mp-ask').trigger('click');
    await flushPromises();
    const text = wrapper.text();
    expect(text).toContain('unreachable');
    expect(text).toContain('ECONNREFUSED');
  });
});
