// Fixture-backed experiments/simulations for the
// /capability/experiments-simulations surface — the measurement discipline
// (boards, A/B arms, ablations) rendered as a comparison board. Numbers are
// replayable fixtures reflecting the platform's evaluation shape; a live board
// runner swaps in behind the same interface.

export type ExpKind = 'a-b' | 'ablation' | 'board' | 'simulation';
export type ExpStatus = 'running' | 'complete' | 'queued';

export interface Arm {
  name: string;
  score: number; // primary metric value
  baseline?: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  kind: ExpKind;
  status: ExpStatus;
  metric: string; // e.g. "MMLU accuracy (%)"
  n: number; // samples / questions
  seed: number;
  subject: string;
  arms: Arm[];
  significant: boolean;
  note: string;
}

export const experiments: Experiment[] = [
  {
    id: 'opcompute',
    name: 'Verified-compute vs baseline (identical 7B)',
    kind: 'a-b',
    status: 'complete',
    metric: 'MMLU accuracy (%)',
    n: 450,
    seed: 2026,
    subject: 'Operator board · STEM',
    arms: [
      { name: 'baseline 7B', score: 61.1, baseline: true },
      { name: 'weak-ground', score: 62.0 },
      { name: 'verified-compute', score: 71.1 },
    ],
    significant: true,
    note: 'Same weights, same prompts — the +10pp comes from the verified-compute arm, not a bigger model. Seed-stable across seed2026/n=450.',
  },
  {
    id: 'combiner',
    name: 'Composite combiner ceiling',
    kind: 'ablation',
    status: 'complete',
    metric: 'MMLU accuracy (%)',
    n: 300,
    seed: 7,
    subject: 'Stacker · mixed',
    arms: [
      { name: 'single best arm', score: 59.4, baseline: true },
      { name: 'mean vote', score: 60.1 },
      { name: 'Condorcet stack', score: 60.7 },
    ],
    significant: false,
    note: 'Arms correlate 0.66 and fail together, so the stacker tops ~60.7%. The lever is a decorrelated arm, not a cleverer combiner.',
  },
  {
    id: 'ground-nli',
    name: 'KG-BERT grounding gate',
    kind: 'ablation',
    status: 'complete',
    metric: 'MMLU accuracy (%)',
    n: 200,
    seed: 11,
    subject: 'Grounding · knowledge',
    arms: [
      { name: 'no grounding', score: 64.2, baseline: true },
      { name: 'KG-BERT gate', score: 65.1 },
    ],
    significant: false,
    note: 'Grounding is a ~1pp knob (non-significant here). The moat stays verified-compute; grounding is a retrieval problem.',
  },
  {
    id: 'refine-loop',
    name: 'Teacher–student refine loop',
    kind: 'a-b',
    status: 'running',
    metric: 'pass@1 (%)',
    n: 128,
    seed: 2026,
    subject: 'Reasoning-experience store',
    arms: [
      { name: 'no memory', score: 48.3, baseline: true },
      { name: 'procedural memory', score: 52.6 },
    ],
    significant: true,
    note: 'Gated reasoning-experience store feeds a refine arm. Interim read at n=128; board still filling.',
  },
  {
    id: 'sim-egress',
    name: 'Egress-masking membrane simulation',
    kind: 'simulation',
    status: 'complete',
    metric: 'leak rate (%, lower=better)',
    n: 5000,
    seed: 3,
    subject: 'Capability membrane · Monte-Carlo',
    arms: [
      { name: 'no membrane', score: 12.4, baseline: true },
      { name: 'fail-open gate', score: 3.1 },
      { name: 'fail-closed gate', score: 0.0 },
    ],
    significant: true,
    note: '5k simulated egress attempts. The fail-closed membrane admits zero leaks; fail-open still bleeds 3.1%.',
  },
];

export const asOf = '2026-07-03T14:00:00-04:00';
