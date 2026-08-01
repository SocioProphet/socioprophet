// Model-Tournament · iSOTA API client.
//
// Fronts the provider-neutral model-tournament harness: three corpora (A provider
// seed, B Sherlock task = OUR workload, C adversarial/edge), a Stage 0→4 pipeline
// (Stage 0 governance gate is fail-closed), and a model leaderboard scored across
// 10 axes. Mirrors the personGraphApi.ts / intelligenceSuperiorityApi.ts pattern:
// an env-configured base, a getJson wrapper, and a *WithFallback variant that
// returns a deterministic in-file fixture when the backend is absent (so the SPA
// renders in fixture mode).
//
// The live seam is dashboard-bff GET /v1/intelligence-superiority (it exists). Its
// reproduced-vs-cited metric-fact shape does not map cleanly to a model tournament,
// so this client is FIXTURE-FIRST and honest about it: it fetches the live route,
// and on any non-conforming / unavailable response falls back to the fixture
// tournament below. The seam is wired so a future /v1/model-tournament producer can
// replace the fixture without touching the page.
//
// HONESTY (non-negotiable): the scores below are ILLUSTRATIVE SEED DATA that
// exercise the harness MECHANISM. They are NOT measured, reproduced, or a real
// benchmark result. The UI badges them "illustrative seed" so no reader mistakes
// them for a measured tournament outcome. Providers appear as neutral labels only —
// "provider exposes eval tooling" is not "provider wins our workload."

const API_BASE = (import.meta as any).env?.VITE_ISOTA_API_BASE || '/api';

// The 10 evaluation axes, in leaderboard order.
export const AXES = [
  'retrieval',
  'groundedness',
  'citation',
  'instruction',
  'tool-use',
  'case-action',
  'latency',
  'cost',
  'ergonomics',
  'observability',
] as const;
export type Axis = (typeof AXES)[number];

// Sherlock-weighted composite. case-action (the Sherlock workload axis) is weighted
// heaviest so promotion tracks OUR corpus, not screening breadth. Weights sum to 1.
export const AXIS_WEIGHTS: Record<Axis, number> = {
  'case-action': 0.3,
  groundedness: 0.15,
  citation: 0.12,
  retrieval: 0.1,
  instruction: 0.08,
  'tool-use': 0.08,
  observability: 0.06,
  ergonomics: 0.04,
  latency: 0.04,
  cost: 0.03,
};

export type CorpusKind = 'provider-seed' | 'sherlock' | 'adversarial';

export interface Corpus {
  id: CorpusKind;
  slot: 'A' | 'B' | 'C';
  label: string;
  description: string;
  itemCount: number;
  weight: 'screening' | 'heavy' | 'stress';
  tags: string[];
}

export type Verdict = 'promoted' | 'rejected' | 'in-tournament';

export interface ModelRow {
  name: string;
  provider: string;
  // Score per axis, 0..1 — ILLUSTRATIVE SEED values, not measurements.
  scores: Record<Axis, number>;
  // Furthest pipeline stage reached (0 = stopped at the governance gate … 4 = promoted).
  stage: 0 | 1 | 2 | 3 | 4;
  verdict: Verdict;
  // Present only when rejected — why the harness dropped the model.
  rejectedReason?: string;
}

export interface PipelineStage {
  index: 0 | 1 | 2 | 3 | 4;
  label: string;
  detail: string;
  failClosed?: boolean;
}

export interface TournamentSnapshot {
  // True when these numbers are illustrative seed data rather than measured results.
  illustrativeSeed: boolean;
  corpora: Corpus[];
  stages: PipelineStage[];
  models: ModelRow[];
}

export type TournamentMode = 'live' | 'fixture';

export interface TournamentLoadResult {
  snapshot: TournamentSnapshot;
  mode: TournamentMode;
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

// Sherlock-weighted composite score, 0..1, for a model's axis scores.
export function compositeScore(scores: Record<Axis, number>): number {
  let total = 0;
  for (const axis of AXES) total += (scores[axis] ?? 0) * AXIS_WEIGHTS[axis];
  return total;
}

// Count of models that reached (entered) a given pipeline stage — the funnel view.
export function reachedStage(models: ModelRow[], index: number): number {
  return models.filter((m) => m.stage >= index).length;
}

export async function fetchTournamentSnapshotWithFallback(): Promise<TournamentLoadResult> {
  try {
    // Probe the live dashboard-bff seam. Today it serves a different (reproduced-vs-
    // cited) shape; when it does not conform to a TournamentSnapshot we honestly fall
    // back to the fixture rather than fabricate a live tournament.
    const raw = await getJson<Partial<TournamentSnapshot>>('/v1/intelligence-superiority');
    if (raw && Array.isArray(raw.models) && Array.isArray(raw.corpora) && Array.isArray(raw.stages)) {
      return { snapshot: raw as TournamentSnapshot, mode: 'live' };
    }
    return {
      snapshot: demoTournamentSnapshot(),
      mode: 'fixture',
      error: 'live seam did not expose a model-tournament shape; showing fixture',
    };
  } catch (error) {
    return {
      snapshot: demoTournamentSnapshot(),
      mode: 'fixture',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ── Fixture — illustrative seed tournament (mechanism, not measurement) ──
function s(
  retrieval: number,
  groundedness: number,
  citation: number,
  instruction: number,
  toolUse: number,
  caseAction: number,
  latency: number,
  cost: number,
  ergonomics: number,
  observability: number,
): Record<Axis, number> {
  return {
    retrieval,
    groundedness,
    citation,
    instruction,
    'tool-use': toolUse,
    'case-action': caseAction,
    latency,
    cost,
    ergonomics,
    observability,
  };
}

export function demoTournamentSnapshot(): TournamentSnapshot {
  const corpora: Corpus[] = [
    {
      id: 'provider-seed',
      slot: 'A',
      label: 'Provider seed (screening)',
      description:
        "Each provider's own seed eval — a screening pass only. Broad coverage, low weight: it proves a model runs on our harness, not that it wins our work.",
      itemCount: 48,
      weight: 'screening',
      tags: ['screening', 'provider-supplied', 'smoke'],
    },
    {
      id: 'sherlock',
      slot: 'B',
      label: 'Sherlock task (OUR workload)',
      description:
        'The Sherlock case-action corpus — our real investigative workload. Weighted heaviest: promotion is decided here. Grounded, cited, tool-using multi-step cases.',
      itemCount: 120,
      weight: 'heavy',
      tags: ['our-workload', 'weighted-heavy', 'case-action', 'grounded'],
    },
    {
      id: 'adversarial',
      slot: 'C',
      label: 'Adversarial / edge',
      description:
        'Adversarial and edge cases — injection, distractor evidence, malformed tools, long-context stress. Guards against a model that screens well but breaks under pressure.',
      itemCount: 64,
      weight: 'stress',
      tags: ['adversarial', 'edge', 'injection', 'stress'],
    },
  ];

  const stages: PipelineStage[] = [
    {
      index: 0,
      label: 'Governance gate',
      detail: 'Fail-closed. License, data-handling, and residency policy checked BEFORE any score. Non-conformant models are rejected here.',
      failClosed: true,
    },
    { index: 1, label: 'Provider-seed smoke', detail: 'Corpus A screening — confirms the model runs correctly on our harness.' },
    { index: 2, label: 'Sherlock (weighted)', detail: 'Corpus B — our workload, weighted heaviest. This stage decides promotion.' },
    { index: 3, label: 'Adversarial / stress', detail: 'Corpus C — injection, distractors, malformed tools, long-context stress.' },
    { index: 4, label: 'Promote → iSOTA', detail: 'Survivors clear the Sherlock-weighted composite bar and are promoted into the internal SOTA set.' },
  ];

  // Providers as neutral labels. GitHub Models and Meta Llama are governance-gated
  // examples: rejected at Stage 0 (fail-closed) regardless of any downstream score.
  const models: ModelRow[] = [
    {
      name: 'Model A1',
      provider: 'Anthropic',
      scores: s(0.88, 0.94, 0.91, 0.9, 0.87, 0.92, 0.74, 0.62, 0.86, 0.89),
      stage: 4,
      verdict: 'promoted',
    },
    {
      name: 'Model O1',
      provider: 'OpenAI',
      scores: s(0.86, 0.9, 0.88, 0.91, 0.89, 0.9, 0.79, 0.6, 0.88, 0.85),
      stage: 4,
      verdict: 'promoted',
    },
    {
      name: 'Model V1',
      provider: 'Google Vertex',
      scores: s(0.84, 0.87, 0.83, 0.86, 0.85, 0.84, 0.77, 0.66, 0.82, 0.83),
      stage: 3,
      verdict: 'in-tournament',
    },
    {
      name: 'Model F1',
      provider: 'Azure Foundry',
      scores: s(0.81, 0.83, 0.8, 0.85, 0.86, 0.81, 0.75, 0.64, 0.8, 0.86),
      stage: 3,
      verdict: 'in-tournament',
    },
    {
      name: 'Model B1',
      provider: 'AWS Bedrock',
      scores: s(0.79, 0.82, 0.78, 0.83, 0.8, 0.78, 0.72, 0.68, 0.79, 0.81),
      stage: 2,
      verdict: 'in-tournament',
    },
    {
      name: 'Model C1',
      provider: 'Cohere',
      scores: s(0.82, 0.8, 0.85, 0.79, 0.72, 0.76, 0.81, 0.74, 0.77, 0.75),
      stage: 2,
      verdict: 'in-tournament',
    },
    {
      name: 'Model M1',
      provider: 'Mistral',
      scores: s(0.76, 0.75, 0.72, 0.8, 0.74, 0.71, 0.84, 0.83, 0.78, 0.7),
      stage: 1,
      verdict: 'in-tournament',
    },
    {
      name: 'Model G1',
      provider: 'GitHub Models',
      scores: s(0.8, 0.79, 0.77, 0.82, 0.83, 0.79, 0.78, 0.9, 0.81, 0.72),
      stage: 0,
      verdict: 'rejected',
      rejectedReason: 'Governance gate: usage terms fail data-handling policy (fail-closed).',
    },
    {
      name: 'Model L1',
      provider: 'Meta Llama',
      scores: s(0.78, 0.77, 0.74, 0.8, 0.76, 0.77, 0.82, 0.95, 0.79, 0.68),
      stage: 0,
      verdict: 'rejected',
      rejectedReason: 'Governance gate: license/acceptable-use not cleared for our corpora (fail-closed).',
    },
  ];

  return { illustrativeSeed: true, corpora, stages, models };
}
