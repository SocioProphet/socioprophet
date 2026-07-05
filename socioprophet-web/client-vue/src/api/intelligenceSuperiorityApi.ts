// Intelligence-superiority comparative-benchmark API client.
//
// Fronts the prophet-platform dashboard-bff route GET /v1/intelligence-superiority
// (apps/dashboard-bff/main.py), which serves schema-validated eval metric-facts:
// OUR reproduced measurements vs CITED frontier numbers, grouped by metric with the
// trust provenance intact. Mirrors the personGraphApi.ts / gaiaMap.ts pattern: an
// env-configured base, a getJson wrapper, and a *WithFallback variant that returns a
// deterministic fixture when the backend is absent (so the SPA renders in fixture mode).
//
// HONESTY (mirrors the server contract): every fact carries reproduced_by_us +
// source_trust_class so the UI badges "reproduced by us" vs "cited, unverified", and
// comparison_valid is true ONLY where a metric has both our and a cited counterpart —
// never today by the disjoint-metric design, so no false cross-provider bar renders.

const API_BASE =
  (import.meta as any).env?.VITE_DASHBOARD_BFF_BASE || '/api';

export interface MetricFactView {
  provider_id: string;
  model_release_id: string;
  value_scalar: number;
  sample_n: number | null;
  source_trust_class: string;
  reproduced_by_us: boolean;
  scenario_id: string | null;
}

export interface MetricComparison {
  metric_definition_id: string;
  metric_name: string;
  family: string;
  ours: MetricFactView[];
  cited: MetricFactView[];
  comparison_valid: boolean;
}

export interface IntelligenceSuperiorityResponse {
  service: string;
  metrics: MetricComparison[];
  headline_claim: string;
  reproduced_fact_count: number;
  cited_fact_count: number;
  disclaimer: string;
}

export type SuperiorityMode = 'live' | 'fixture';

export interface SuperiorityLoadResult {
  data: IntelligenceSuperiorityResponse;
  mode: SuperiorityMode;
  error?: string;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${path}`);
  }
  return response.json() as Promise<T>;
}

// Deterministic fixture — the SAME honest numbers the producer emits (tools/
// emit_intelligence_superiority_metrics.py), so the page renders correctly with the
// full reproduced-vs-cited structure even when dashboard-bff is not running.
const FIXTURE: IntelligenceSuperiorityResponse = {
  service: 'dashboard-bff',
  metrics: [
    {
      metric_definition_id: 'mmlu_stem_accuracy',
      metric_name: 'MMLU-STEM accuracy',
      family: 'task_performance',
      ours: [
        { provider_id: 'socioprophet', model_release_id: 'noetica-7b-baseline', value_scalar: 0.611, sample_n: 450, source_trust_class: 'internal_reproduced', reproduced_by_us: true, scenario_id: 'prodphyschem0629b_seed1729' },
        { provider_id: 'socioprophet', model_release_id: 'noetica-7b-verified-compute', value_scalar: 0.711, sample_n: 450, source_trust_class: 'internal_reproduced', reproduced_by_us: true, scenario_id: 'prodphyschem0629b_seed1729' },
        { provider_id: 'socioprophet', model_release_id: 'noetica-7b-verified-compute', value_scalar: 0.707, sample_n: 450, source_trust_class: 'internal_reproduced', reproduced_by_us: true, scenario_id: 'frontier0630_seed2026' },
      ],
      cited: [],
      comparison_valid: false,
    },
    {
      metric_definition_id: 'kg_triple_plausibility',
      metric_name: 'KG-BERT triple-plausibility held-out accuracy',
      family: 'grounding_factuality',
      ours: [
        { provider_id: 'socioprophet', model_release_id: 'noetica-graph', value_scalar: 0.9853, sample_n: 16990, source_trust_class: 'internal_reproduced', reproduced_by_us: true, scenario_id: 'kg_bert_score' },
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
    {
      metric_definition_id: 'swebench_verified_resolved',
      metric_name: 'SWE-bench Verified resolved',
      family: 'agent_execution',
      ours: [],
      cited: [{ provider_id: 'anthropic', model_release_id: 'claude-opus-4-7', value_scalar: 0.876, sample_n: null, source_trust_class: 'official_provider', reproduced_by_us: false, scenario_id: null }],
      comparison_valid: false,
    },
    {
      metric_definition_id: 'arc_agi2_accuracy',
      metric_name: 'ARC-AGI-2 accuracy',
      family: 'ontology_logic',
      ours: [],
      cited: [{ provider_id: 'openai', model_release_id: 'gpt-5-5', value_scalar: 0.850, sample_n: null, source_trust_class: 'official_provider', reproduced_by_us: false, scenario_id: null }],
      comparison_valid: false,
    },
    {
      metric_definition_id: 'frontiermath_tier4_accuracy',
      metric_name: 'FrontierMath Tier-4 accuracy',
      family: 'task_performance',
      ours: [],
      cited: [
        { provider_id: 'openai', model_release_id: 'gpt-5-5-pro', value_scalar: 0.396, sample_n: null, source_trust_class: 'official_provider', reproduced_by_us: false, scenario_id: null },
        { provider_id: 'anthropic', model_release_id: 'claude-opus-4-8-thinking', value_scalar: 0.229, sample_n: null, source_trust_class: 'official_provider', reproduced_by_us: false, scenario_id: null },
      ],
      comparison_valid: false,
    },
  ],
  headline_claim:
    'On MMLU-STEM (n=450, reproduced), verified compute lifts an identical 7B from 0.611 baseline to 0.711 ' +
    '(+10pp, McNemar p=0.0002) — a technique win on the same model, not a claim of beating frontier models on ' +
    'frontier benchmarks.',
  reproduced_fact_count: 4,
  cited_fact_count: 5,
  disclaimer:
    'Facts labeled internal_reproduced were measured by us; official_provider facts are cited vendor/leaderboard ' +
    'numbers we did NOT independently verify. Our metrics and cited metrics are disjoint by design — no ' +
    'cross-provider superiority is asserted on any single benchmark.',
};

export async function fetchIntelligenceSuperiorityWithFallback(): Promise<SuperiorityLoadResult> {
  try {
    const data = await getJson<IntelligenceSuperiorityResponse>('/v1/intelligence-superiority');
    return { data, mode: 'live' };
  } catch (err) {
    return { data: FIXTURE, mode: 'fixture', error: err instanceof Error ? err.message : String(err) };
  }
}
