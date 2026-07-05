/**
 * Smoke tests for the live comparative-benchmark section on ProfessionalIntelligence.vue.
 *
 * Covers:
 *  1. the page mounts and renders the comparative-benchmark section
 *  2. FIXTURE mode renders (fallback) when the dashboard-bff backend is unavailable
 *  3. LIVE mode renders when the API returns a payload
 *  4. HONESTY invariants survive to the DOM: reproduced facts badge 'reproduced', cited badge 'cited',
 *     the headline claim (with its p-value) and the provenance disclaimer are shown
 *  5. no false head-to-head: with the disjoint-metric fixture, no metric is marked head-to-head
 *
 * The intelligenceSuperiorityApi module is mocked so tests are fully offline.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProfessionalIntelligence from '../pages/ProfessionalIntelligence.vue';
import { fetchIntelligenceSuperiorityWithFallback } from '../api/intelligenceSuperiorityApi';

vi.mock('../api/intelligenceSuperiorityApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/intelligenceSuperiorityApi')>();
  return { ...actual, fetchIntelligenceSuperiorityWithFallback: vi.fn() };
});

const mockFetch = vi.mocked(fetchIntelligenceSuperiorityWithFallback);

function fixturePayload() {
  return {
    service: 'dashboard-bff',
    metrics: [
      {
        metric_definition_id: 'mmlu_stem_accuracy',
        metric_name: 'MMLU-STEM accuracy',
        family: 'task_performance',
        ours: [
          { provider_id: 'socioprophet', model_release_id: 'noetica-7b-baseline', value_scalar: 0.611, sample_n: 450, source_trust_class: 'internal_reproduced', reproduced_by_us: true, scenario_id: 's1' },
          { provider_id: 'socioprophet', model_release_id: 'noetica-7b-verified-compute', value_scalar: 0.711, sample_n: 450, source_trust_class: 'internal_reproduced', reproduced_by_us: true, scenario_id: 's1' },
        ],
        cited: [],
        comparison_valid: false,
      },
      {
        metric_definition_id: 'gpqa_diamond_accuracy',
        metric_name: 'GPQA-Diamond accuracy',
        family: 'task_performance',
        ours: [],
        cited: [{ provider_id: 'anthropic', model_release_id: 'claude-opus-4-7', value_scalar: 0.942, sample_n: null, source_trust_class: 'official_provider', reproduced_by_us: false, scenario_id: null }],
        comparison_valid: false,
      },
    ],
    headline_claim: 'verified compute lifts a 7B from 0.611 to 0.711 (+10pp, McNemar p=0.0002).',
    reproduced_fact_count: 2,
    cited_fact_count: 1,
    disclaimer: 'official_provider facts are cited numbers we did NOT independently verify.',
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

async function mountPage() {
  const wrapper = mount(ProfessionalIntelligence);
  await flushPromises();
  return wrapper;
}

describe('ProfessionalIntelligence comparative-benchmark section', () => {
  it('renders the section in FIXTURE mode when the backend is unavailable', async () => {
    mockFetch.mockResolvedValue({ data: fixturePayload(), mode: 'fixture', error: 'ECONNREFUSED' });
    const wrapper = await mountPage();
    const text = wrapper.text();
    expect(text).toContain('Comparative intelligence benchmark');
    expect(text).toContain('fixture');
    expect(text).toContain('MMLU-STEM accuracy');
  });

  it('renders LIVE mode when the API returns a payload', async () => {
    mockFetch.mockResolvedValue({ data: fixturePayload(), mode: 'live' });
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain('live · dashboard-bff');
  });

  it('preserves the honesty invariants in the DOM (reproduced vs cited badges, headline, disclaimer)', async () => {
    mockFetch.mockResolvedValue({ data: fixturePayload(), mode: 'live' });
    const wrapper = await mountPage();
    const text = wrapper.text();
    expect(text).toContain('reproduced');       // our facts badged reproduced
    expect(text).toContain('cited');            // cited facts badged cited
    expect(text).toContain('p=0.0002');         // the real, significant claim
    expect(text).toContain('did NOT independently verify');  // the disclaimer
    expect(text).toContain('71.1%');            // our verified-compute number rendered as a percentage
  });

  it('renders no false head-to-head badge for disjoint metrics', async () => {
    mockFetch.mockResolvedValue({ data: fixturePayload(), mode: 'live' });
    const wrapper = await mountPage();
    // every metric in the fixture is single-provider (comparison_valid false) → no head-to-head badge
    expect(wrapper.text()).not.toContain('head-to-head');
  });
});
