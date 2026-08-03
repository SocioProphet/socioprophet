// Value model — the first CODIFIED slice of the value axiom, run over the twin.
//
// This operationalizes `docs/value-axiom-human-attention.md` as functional,
// unit-tested code rather than prose. The axiom: the root unit of value is
// QUALIFIED human attention — informed, low-asymmetry, non-coerced. `Kknow`
// (docs/marketplace-value-transfer-model.md §1.2) is its measure:
//
//     Kknow = coverage · coherence · stability · provenance
//
// The twin state-space engine (twinStateSpace.ts) already carries three of those
// factors as state dims, so the value reading is computed FROM a twin state:
//
//     coverage   ← state.coverage    (how much of the world is covered/known)
//     stability  ← 1 − state.drift    (drift is instability; low drift = stable)
//     provenance ← state.integrity    (soundness / attributable grounding)
//
// Two governance invariants are enforced as CODE, mirroring the precision@1 gate:
//   (1) Bankable-only-when-governed. Qualified attention may be BANKED as value
//       only when the governance gate is not fail-closed and the state is not
//       drifting past the floor — the economic form of "no generalized claim on
//       thin or manipulated evidence" (scoreVariants.meetsMinN / publishable).
//   (2) Exogenous hurdle. The cost-of-capital hurdle is a parameter Kknow can
//       NEVER reduce (Economic Profit v37: the hurdle is market/regulator-set;
//       WEDT non-goal: no closed-form EP). Knowledge narrows controllable spreads
//       only. This is asserted by construction and by test.
//
// This is a MODEL, not a measurement — a plausible operationalization in the same
// spirit as twinStateSpace's seed dynamics, not a claim about any real economy.
// Pure TypeScript, no framework imports — unit-testable in isolation.

import type { StateVector, GateMode } from './twinStateSpace';

/** Exogenous cost-of-capital hurdle. NOT reducible by Kknow (EP v37 / WEDT). */
export const HURDLE_DEFAULT = 0.2;

/** Drift above this floor withholds banking until the state is re-annealed. */
export const DRIFT_BANKABLE_MAX = 0.5;

export interface ValueReading {
  /** Measured qualified attention: coverage · stability · provenance, in [0,1]. */
  kknow: number;
  /** Alias — the value base is qualified attention itself (value-axiom §1). */
  qualifiedAttention: number;
  /** EP-like residual: Kknow-weighted, risk-discounted surplus above the hurdle. */
  valueSignal: number;
  /** The controllable spread Kknow acts on (before the exogenous hurdle). */
  controllableSurplus: number;
  /** The exogenous hurdle applied — surfaced so it is visibly un-reducible. */
  hurdle: number;
  /** Value may be banked only when governed AND stable (fail-closed otherwise). */
  bankable: boolean;
  reason: string;
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/**
 * Kknow = coverage · stability · provenance, read off a twin state.
 * Monotone up in coverage & integrity, down in drift — by construction.
 */
export function kknowFromState(s: StateVector): number {
  return clamp01(s.coverage * (1 - clamp01(s.drift)) * s.integrity);
}

/**
 * The value reading for a twin state. `valueSignal = Kknow·(1−risk) − hurdle`:
 * Kknow raises the CONTROLLABLE surplus; the hurdle is subtracted unchanged so
 * knowledge can never buy down the cost of capital.
 */
export function valueReading(
  s: StateVector,
  opts?: { hurdle?: number; governanceGate?: GateMode },
): ValueReading {
  const hurdle = opts?.hurdle ?? HURDLE_DEFAULT;
  const kknow = kknowFromState(s);
  const controllableSurplus = +clamp01(kknow * (1 - clamp01(s.risk))).toFixed(4);
  const valueSignal = +(controllableSurplus - hurdle).toFixed(4);

  const governed = (opts?.governanceGate ?? 'open') !== 'closed';
  const stable = clamp01(s.drift) <= DRIFT_BANKABLE_MAX;
  const bankable = governed && stable;
  const reason = !governed
    ? 'governance gate closed — value held (fail-closed)'
    : !stable
      ? `drift ${clamp01(s.drift).toFixed(2)} > ${DRIFT_BANKABLE_MAX} — value withheld until re-annealed`
      : 'governed + stable — qualified attention may be banked';

  return {
    kknow: +kknow.toFixed(4),
    qualifiedAttention: +kknow.toFixed(4),
    valueSignal,
    controllableSurplus,
    hurdle,
    bankable,
    reason,
  };
}
