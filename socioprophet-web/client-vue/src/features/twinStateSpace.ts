// Twin state-space engine — the dynamical core of a geospatially-grounded
// twin world model.
//
// A twin is a state-space world model: a state vector x evolves under the
// discrete update
//
//     x⁺ = A·x + B·(G·u)
//
//   x — the twin's state over STATE_DIMS (each clamped to [0, 1]);
//   A — a scalar relaxation (RELAXATION = 0.90): absent input, state decays;
//   u — an impulse magnitude of a given ImpulseClass;
//   B — the input map: which state dims a class of impulse drives, and how hard;
//   G — the impulse gate for that class (open = 1, attenuated = 0.35, closed = 0).
//
// The gate bank is the governance seam. A CLOSED gate is fail-closed: the impulse
// is rejected and the state cannot move (no input AND no relaxation applied) — a
// twin under a closed gate is provably held, not merely quieted. This mirrors the
// sourceos-spec impulse-admission schema, where an exogenous_shock impulse cites a
// GaiaObservation and a Region is grounded in H3 cells.
//
// Pure TypeScript, no framework imports — unit-testable in isolation.

export const STATE_DIMS = ['integrity', 'risk', 'load', 'coverage', 'drift'] as const;
export type StateDim = (typeof STATE_DIMS)[number];

export type StateVector = Record<StateDim, number>;

// Discrete relaxation A: the diagonal decay applied to every admitted step.
export const RELAXATION = 0.9;

// Gate positions and their gain G. Attenuated passes a throttled 0.35 of the
// impulse; closed passes nothing and is fail-closed.
export type GateMode = 'open' | 'attenuated' | 'closed';
export const GATE_GAIN: Record<GateMode, number> = {
  open: 1,
  attenuated: 0.35,
  closed: 0,
};

export type ImpulseClass =
  | 'device_reading'
  | 'market_data_event'
  | 'exogenous_shock'
  | 'policy_change'
  | 'human_action';

export interface ImpulseSpec {
  id: ImpulseClass;
  label: string;
  // Provenance of the impulse source. The exogenous shock is sourced from GAIA.
  source: string;
  // The B-matrix column: how a unit impulse of this class maps onto each state dim.
  b: StateVector;
  blurb: string;
}

// Zero column helper so each spec only names the dims it actually drives.
function column(partial: Partial<StateVector>): StateVector {
  return {
    integrity: partial.integrity ?? 0,
    risk: partial.risk ?? 0,
    load: partial.load ?? 0,
    coverage: partial.coverage ?? 0,
    drift: partial.drift ?? 0,
  };
}

// The impulse classes that can hit a twin, each with its input column.
export const IMPULSES: ImpulseSpec[] = [
  {
    id: 'device_reading',
    label: 'Device reading',
    source: 'edge/sensor',
    b: column({ load: 0.5, coverage: 0.4, integrity: 0.1 }),
    blurb: 'A sensor observation lands: raises load and coverage, lightly confirms integrity.',
  },
  {
    id: 'market_data_event',
    label: 'Market data event',
    source: 'capital-markets/replay',
    b: column({ risk: 0.45, load: 0.35 }),
    blurb: 'A market tick or reprice: drives risk and processing load.',
  },
  {
    id: 'exogenous_shock',
    label: 'Exogenous shock',
    source: 'GAIA/weather',
    b: column({ risk: 0.6, drift: 0.45, coverage: -0.3 }),
    blurb: 'A weather/hazard shock cited from a GaiaObservation: spikes risk and drift, erodes coverage.',
  },
  {
    id: 'policy_change',
    label: 'Policy change',
    source: 'governance/policy',
    b: column({ integrity: 0.5, coverage: 0.3, risk: -0.25 }),
    blurb: 'A governing policy transition: restores integrity and coverage, dampens risk.',
  },
  {
    id: 'human_action',
    label: 'Human action',
    source: 'operator',
    b: column({ integrity: 0.4, load: 0.3, drift: -0.35 }),
    blurb: 'An operator intervention: reasserts integrity and corrects drift at some load cost.',
  },
];

export const IMPULSE_BY_ID: Record<ImpulseClass, ImpulseSpec> = IMPULSES.reduce(
  (acc, spec) => {
    acc[spec.id] = spec;
    return acc;
  },
  {} as Record<ImpulseClass, ImpulseSpec>,
);

export interface TwinStateModel {
  twinId: string;
  label: string;
  state: StateVector;
  gates: Record<ImpulseClass, GateMode>;
}

export interface StepResult {
  admitted: boolean;
  gate: GateMode;
  impulse: ImpulseClass;
  reason: string;
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

// Every gate opens by default; the operator closes/attenuates them to govern the twin.
export function defaultGates(): Record<ImpulseClass, GateMode> {
  return {
    device_reading: 'open',
    market_data_event: 'open',
    exogenous_shock: 'open',
    policy_change: 'open',
    human_action: 'open',
  };
}

// A deterministic seed state so a fresh twin model reads as a plausibly-healthy
// world model rather than an all-zero vector.
export function seedState(): StateVector {
  return { integrity: 0.82, risk: 0.24, load: 0.4, coverage: 0.68, drift: 0.18 };
}

export function createModel(twinId: string, label: string): TwinStateModel {
  return { twinId, label, state: seedState(), gates: defaultGates() };
}

export function resetModel(model: TwinStateModel): void {
  model.state = seedState();
  model.gates = defaultGates();
}

// Cycle a gate open → attenuated → closed → open.
const GATE_CYCLE: GateMode[] = ['open', 'attenuated', 'closed'];
export function cycleGate(mode: GateMode): GateMode {
  return GATE_CYCLE[(GATE_CYCLE.indexOf(mode) + 1) % GATE_CYCLE.length]!;
}

/**
 * Advance the model by one impulse: x⁺ = A·x + B·(G·u).
 *
 * A CLOSED gate is fail-closed — the impulse is rejected, admitted is false, and
 * the state is left EXACTLY unchanged (no input, no relaxation). Any open or
 * attenuated gate admits the impulse and mutates `model.state` in place.
 */
export function stepModel(
  model: TwinStateModel,
  impulseClass: ImpulseClass,
  magnitude: number,
): StepResult {
  const gate = model.gates[impulseClass];
  const gain = GATE_GAIN[gate];

  if (gain === 0) {
    // Fail-closed: the gate rejects the impulse; the state cannot move.
    return {
      admitted: false,
      gate,
      impulse: impulseClass,
      reason: 'gate closed — fail-closed, state held',
    };
  }

  const spec = IMPULSE_BY_ID[impulseClass];
  const u = gain * magnitude;
  const next: StateVector = { ...model.state };
  for (const dim of STATE_DIMS) {
    next[dim] = clamp01(RELAXATION * model.state[dim] + spec.b[dim] * u);
  }
  model.state = next;

  return {
    admitted: true,
    gate,
    impulse: impulseClass,
    reason: gate === 'attenuated' ? `admitted — attenuated ×${gain}` : 'admitted',
  };
}
