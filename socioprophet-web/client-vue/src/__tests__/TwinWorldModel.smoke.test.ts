/**
 * Smoke tests for /analytics/twin-world-model (TwinWorldModel.vue) — a twin as a
 * geospatially-grounded state-space world model: a common operating picture, an
 * ontology graph, and a governed impulse state-space core.
 *
 * Covers:
 *  1. the page mounts and renders the fixture twin fleet on the COP + the ontology
 *     + the state-space core (proves it renders in fixture mode with no backend);
 *  2. on mount the async registry load runs and falls back to the fixture registry;
 *  3. UNIT — the state-space engine proves teeth BOTH ways: a CLOSED gate rejects
 *     fail-closed (admitted = false, state EXACTLY unchanged) and an OPEN gate
 *     admits (admitted = true, state moves).
 */
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TwinWorldModel from '../pages/TwinWorldModel.vue';
import {
  STATE_DIMS,
  createModel,
  stepModel,
  type StateVector,
} from '../features/twinStateSpace';

describe('TwinWorldModel', () => {
  beforeEach(() => {
    // No backend in the unit env — the page must fall back to the fixture registry.
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no backend in test'))));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts and renders the fixture twins, ontology, and state-space core', () => {
    const wrapper = mount(TwinWorldModel);
    expect(wrapper.text()).toContain('Twin world model');
    expect(wrapper.text()).toContain('ASX reporting twin'); // a fixture twin label on the COP
    expect(wrapper.text()).toContain('Common operating picture');
    expect(wrapper.text()).toContain('State space'); // the impulse-gate core rendered
    expect(wrapper.text()).toContain('GAIA/weather'); // the exogenous-shock GAIA source
    expect(wrapper.findAll('svg').length).toBeGreaterThanOrEqual(3); // COP + ontology + trajectory
  });

  it('runs the async registry load on mount and falls back to the fixture registry', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error('no backend')));
    vi.stubGlobal('fetch', fetchMock);
    const wrapper = mount(TwinWorldModel);
    await flushPromises(); // let onMounted -> fetchTwinRegistryWithFallback resolve
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/twins'), expect.anything());
    expect(wrapper.text()).toContain('fixture'); // fell back to the fixture registry
  });
});

describe('twinStateSpace engine', () => {
  const snapshot = (s: StateVector): StateVector => ({ ...s });

  it('a CLOSED gate rejects fail-closed: admitted=false and the state is unchanged', () => {
    const model = createModel('twn_test', 'test twin');
    model.gates.exogenous_shock = 'closed';
    const before = snapshot(model.state);

    const result = stepModel(model, 'exogenous_shock', 1);

    expect(result.admitted).toBe(false);
    // Fail-closed: no input AND no relaxation — the state cannot move at all.
    for (const dim of STATE_DIMS) {
      expect(model.state[dim]).toBe(before[dim]);
    }
  });

  it('an OPEN gate admits: admitted=true and the state moves', () => {
    const model = createModel('twn_test', 'test twin');
    model.gates.exogenous_shock = 'open';
    const before = snapshot(model.state);

    const result = stepModel(model, 'exogenous_shock', 1);

    expect(result.admitted).toBe(true);
    // At least one dimension the impulse drives must have moved.
    const moved = STATE_DIMS.some((dim) => model.state[dim] !== before[dim]);
    expect(moved).toBe(true);
    // The exogenous shock (GAIA/weather) drives risk up from the seed.
    expect(model.state.risk).toBeGreaterThan(before.risk);
  });
});
