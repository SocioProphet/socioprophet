/**
 * Smoke tests for /analytics/twin-workshop (TwinOperatingPicture.vue) — the cloud-twin
 * Twin Operating Picture: see & build twins (distinct from the health DigitalTwin surface).
 *
 * Covers:
 *  1. the page mounts and renders the fixture twin registry + metric tiles;
 *  2. fail-closed GenesisSeed validation rejects missing required fields (mirrors the
 *     service's 422 SeedValidationError);
 *  3. twinCounts tallies the fleet by lifecycle state.
 */
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TwinOperatingPicture from '../pages/TwinOperatingPicture.vue';
import { demoTwins, twinCounts, validateSeed } from '../api/cloudTwinApi';

describe('TwinOperatingPicture', () => {
  beforeEach(() => {
    // No backend in the unit env — the page must fall back to the fixture registry.
    // Stub fetch to reject deterministically (no real socket, no ECONNREFUSED noise).
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no backend in test'))));
  });

  it('mounts and renders the fixture twin registry', () => {
    const wrapper = mount(TwinOperatingPicture);
    expect(wrapper.text()).toContain('Twin Workshop');
    expect(wrapper.text()).toContain('twn_mkt-0001'); // a fixture twin id
    expect(wrapper.text()).toContain('Total twins'); // metric tiles rendered
    expect(wrapper.find('table.tw-table').exists()).toBe(true);
  });

  it('fail-closed seed validation rejects missing required fields', () => {
    expect(validateSeed({ kind: 'market' })).toMatch(/hologram_ref/);
    expect(validateSeed({ kind: 'market', hologram_ref: 'holo:x' })).toMatch(/authorization/);
    expect(validateSeed({ kind: 'market', hologram_ref: 'holo:x', authorization: 'user/x' })).toBeNull();
    expect(validateSeed({ hologram_ref: 'holo:x', authorization: 'user/x' })).toMatch(/kind/);
  });

  it('twinCounts tallies the fleet by state', () => {
    const c = twinCounts(demoTwins());
    expect(c.total).toBe(5);
    expect(c.verified).toBe(3);
    expect(c.verified + c.authorized + c.created).toBe(c.total);
  });
});
