// Assay Fleet API client.
//
// Fronts prophet-mesh's cloud-mesh rollup: an AssayRollup (fleet verdict
// distribution + calibration drift) plus the AssayStandardRollout in flight and a
// summary of the verifier standards live across the fleet. Mirrors the
// personGraphApi pattern: an env-configured base via resolveBase, a getJson
// wrapper, and a *WithFallback variant that returns a deterministic fixture (the
// real calibrated standards) so the SPA renders in fixture mode with no backend.
import { resolveBase } from '../config/cockpitRuntime';

const BASE = resolveBase('assay', 'VITE_ASSAY_BASE', '/svc/assay');

export type AssayState = 'ok' | 'sad' | 'bad';
export type AssayMode = 'live' | 'fixture';

export interface StandardAdoption {
  calibrationRef: string;
  nodeCount: number;
  calibrated: boolean;
}

export interface AssayRollup {
  id: string;
  scope: { mode: 'node' | 'cohort' | 'fleet'; nodeCount: number; cohortId?: string };
  window: { from: string; to: string };
  totalAssays: number;
  distribution: Record<AssayState, number>;
  byMethod?: Record<string, number>;
  unassayedReasons?: Record<string, number>;
  standardAdoption?: StandardAdoption[];
  driftDetected?: boolean;
  capturedAt: string;
}

// Display summary of an AssayStandard (the measured reliability of a verifier).
export interface AssayStandardSummary {
  id: string;
  verifierId: string;
  version: string;
  f1: number;
  kappa: number;
  kappaLabel: string;
  calibrated: boolean;
  sampleSize: number;
  real: boolean; // measured from a real calibration run vs a placeholder
}

export interface AssayStandardRollout {
  id: string;
  standardRef: string;
  supersedes?: string;
  strategy: 'canary' | 'staged' | 'immediate';
  phase: 'canary' | 'widening' | 'complete' | 'halted' | 'rolled-back';
  cohorts: Array<{ cohortId: string; nodeCount: number; state: string }>;
  guard?: { observedRollupRef?: string; metric?: string; decision?: 'continue' | 'hold' | 'rollback' };
  rolloutPct?: number;
}

export interface AssayFleetSnapshot {
  rollup: AssayRollup;
  rollout: AssayStandardRollout;
  standards: AssayStandardSummary[];
}

export interface AssayFleetLoadResult {
  snapshot: AssayFleetSnapshot;
  mode: AssayMode;
  error?: string;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchAssayFleetSnapshot(): Promise<AssayFleetSnapshot> {
  return getJson<AssayFleetSnapshot>('/fleet/rollup');
}

export async function fetchAssayFleetWithFallback(): Promise<AssayFleetLoadResult> {
  try {
    const snapshot = await fetchAssayFleetSnapshot();
    return { snapshot, mode: 'live' };
  } catch (error) {
    return {
      snapshot: demoAssayFleetSnapshot(),
      mode: 'fixture',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ── Fixture — real calibrated standards + a representative fleet window ──
const NF = 'urn:srcos:assay-standard:narration-fidelity:cfr-eval-001';
const NL = 'urn:srcos:assay-standard:nl-lexical-baseline:v1';
const NLI = 'urn:srcos:assay-standard:deployed-nli:0.1.0';

export function demoAssayFleetSnapshot(): AssayFleetSnapshot {
  const rollup: AssayRollup = {
    id: 'urn:srcos:assay-rollup:fleet-demo',
    scope: { mode: 'fleet', nodeCount: 12 },
    window: { from: '2026-07-05T00:00:00Z', to: '2026-07-05T01:00:00Z' },
    totalAssays: 100,
    distribution: { ok: 40, sad: 55, bad: 5 },
    byMethod: { generated: 45, computed: 30, retrieved: 25 },
    unassayedReasons: { 'post-hoc-binding': 30, 'uncalibrated-verifier': 15, 'correlated-arms': 10 },
    standardAdoption: [
      { calibrationRef: NF, nodeCount: 5, calibrated: true },
      { calibrationRef: NL, nodeCount: 4, calibrated: true },
      { calibrationRef: NLI, nodeCount: 3, calibrated: false },
    ],
    driftDetected: true,
    capturedAt: '2026-07-05T01:00:01Z',
  };
  const rollout: AssayStandardRollout = {
    id: 'urn:srcos:assay-standard-rollout:narration-fidelity-next',
    standardRef: 'urn:srcos:assay-standard:narration-fidelity:cfr-eval-002',
    supersedes: NF,
    strategy: 'canary',
    phase: 'widening',
    cohorts: [
      { cohortId: 'canary-a', nodeCount: 2, state: 'promoted' },
      { cohortId: 'fleet-remainder', nodeCount: 10, state: 'pending' },
    ],
    guard: { observedRollupRef: 'urn:srcos:assay-rollup:fleet-demo', metric: 'bad_rate_delta', decision: 'continue' },
    rolloutPct: 16.7,
  };
  const standards: AssayStandardSummary[] = [
    { id: NF, verifierId: 'narration-fidelity', version: 'cfr-eval-001', f1: 1.0, kappa: 1.0, kappaLabel: 'almost-perfect', calibrated: true, sampleSize: 42, real: true },
    { id: NL, verifierId: 'nl-lexical-baseline', version: 'v1', f1: 0.706, kappa: 0.375, kappaLabel: 'fair', calibrated: true, sampleSize: 32, real: true },
    { id: NLI, verifierId: 'deployed-nli', version: '0.1.0', f1: 0.26, kappa: 0.19, kappaLabel: 'slight', calibrated: false, sampleSize: 100, real: false },
  ];
  return { rollup, rollout, standards };
}
