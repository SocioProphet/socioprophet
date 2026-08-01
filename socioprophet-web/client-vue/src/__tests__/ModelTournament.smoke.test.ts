/**
 * Smoke tests for the Model Tournament · iSOTA page.
 *
 * Covers:
 *  1. the page mounts and renders the guardrail banner text
 *  2. FIXTURE mode renders the leaderboard rows (illustrative seed data) when the
 *     dashboard-bff live seam is unavailable
 *  3. HONESTY invariants survive to the DOM: the "illustrative seed" chip, the
 *     "not a measured benchmark result" disclaimer, and the fail-closed Stage 0 gate
 *  4. the async fallback actually runs: after flushPromises(), fetch was called
 *     (proving the *WithFallback path exercised the live seam before falling back)
 *
 * fetch is stubbed to REJECT so the client falls back to its in-file fixture with no
 * network. The stub is removed in afterEach so it cannot leak across test files.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ModelTournament from '../pages/ModelTournament.vue';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('ECONNREFUSED (test: backend unavailable)'))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function mountPage() {
  const wrapper = mount(ModelTournament);
  await flushPromises();
  return wrapper;
}

describe('ModelTournament · iSOTA page', () => {
  it('mounts and renders the provider-neutral guardrail banner', async () => {
    const wrapper = await mountPage();
    const text = wrapper.text();
    expect(text).toContain('Model Tournament → iSOTA');
    expect(text).toContain(
      "'Provider exposes eval tooling' ≠ 'provider wins our workload.'",
    );
    expect(text).toContain('Stage 2 (Sherlock) weighted heaviest');
  });

  it('renders fixture leaderboard rows with providers as neutral labels', async () => {
    const wrapper = await mountPage();
    const text = wrapper.text();
    // Leaderboard rows present (fixture models across neutral providers).
    expect(text).toContain('Anthropic');
    expect(text).toContain('Google Vertex');
    expect(text).toContain('AWS Bedrock');
    // At least one row per verdict class rendered.
    expect(text).toContain('promoted');
    expect(text).toContain('rejected');
    expect(text).toContain('in-tournament');
    // The three corpora, including the heavily-weighted Sherlock workload.
    expect(text).toContain('Sherlock task (OUR workload)');
    expect(text).toContain('Adversarial / edge');
    // Governance-gated example is rejected at the fail-closed Stage 0 gate.
    expect(text).toContain('fail-closed');
  });

  it('keeps the honesty invariants in the DOM (illustrative seed, not measured)', async () => {
    const wrapper = await mountPage();
    const text = wrapper.text();
    expect(text).toContain('illustrative seed');
    expect(text).toContain('ILLUSTRATIVE SEED DATA');
    expect(text).toContain('not a measured benchmark result');
    // Fixture mode is surfaced (live seam rejected → fixture).
    expect(text).toContain('fixture');
  });

  it('runs the async fallback: fetch was called before falling back to the fixture', async () => {
    await mountPage();
    expect(fetch).toHaveBeenCalled();
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toContain('/v1/intelligence-superiority');
  });
});
