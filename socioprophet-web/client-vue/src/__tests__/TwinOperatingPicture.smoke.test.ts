/**
 * Smoke tests for /analytics/twin-workshop (TwinOperatingPicture.vue) — the cloud-twin
 * Twin Operating Picture: see & build twins (distinct from the health DigitalTwin surface).
 *
 * Covers:
 *  1. the page mounts and renders the fixture twin registry + metric tiles;
 *  2. on mount, the async load actually runs and falls back to the fixture registry
 *     when the backend is unavailable (proves fetchTwinRegistryWithFallback ran);
 *  3. fail-closed GenesisSeed validation rejects missing required fields;
 *  4. twinCounts tallies the fleet by lifecycle state.
 */
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TwinOperatingPicture from '../pages/TwinOperatingPicture.vue';
import { demoTwins, twinCounts, validateSeed } from '../api/cloudTwinApi';

describe('TwinOperatingPicture', () => {
  beforeEach(() => {
    // No backend in the unit env — the page must fall back to the fixture registry.
    // Stub fetch to reject deterministically (no real socket, no ECONNREFUSED noise).
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no backend in test'))));
  });

  afterEach(() => {
    // Restore globals so the fetch stub does not leak into other test files in the worker.
    vi.unstubAllGlobals();
  });

  it('mounts and renders the fixture twin registry', () => {
    const wrapper = mount(TwinOperatingPicture);
    expect(wrapper.text()).toContain('Twin Workshop');
    expect(wrapper.text()).toContain('twn_mkt-0001'); // a fixture twin id
    expect(wrapper.text()).toContain('Total twins'); // metric tiles rendered
    expect(wrapper.find('table.tw-table').exists()).toBe(true);
  });

  it('runs the async load on mount and falls back to the fixture registry', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error('no backend')));
    vi.stubGlobal('fetch', fetchMock);
    const wrapper = mount(TwinOperatingPicture);
    await flushPromises(); // let onMounted -> fetchTwinRegistryWithFallback resolve
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/twins'), expect.anything());
    expect(wrapper.text()).toContain('fixture'); // fell back to the fixture registry
  });

  it('fail-closed seed validation rejects missing required fields', () => {
    expect(validateSeed({ kind: 'market' })).toMatch(/hologram/i);
    expect(validateSeed({ kind: 'market', hologram_ref: 'holo:x' })).toMatch(/authorization|principal/i);
    expect(validateSeed({ kind: 'market', hologram_ref: 'holo:x', authorization: 'user/x' })).toBeNull();
    expect(validateSeed({ hologram_ref: 'holo:x', authorization: 'user/x' })).toMatch(/kind/i);
  });

  it('twinCounts tallies the fleet by state', () => {
    const c = twinCounts(demoTwins());
    expect(c.total).toBe(5);
    expect(c.verified).toBe(3);
    expect(c.verified + c.authorized + c.created).toBe(c.total);
  });
});
