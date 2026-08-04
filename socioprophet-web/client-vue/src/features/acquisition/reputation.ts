// Reputation & Fingerprint plane (acquisition I3) — the in-house alternative to renting a managed
// unblocker for PUBLIC data. The winning move against anti-bot systems isn't defeating challenges;
// it's building enough egress + fingerprint + behavioral reputation that a public site never
// challenges us in the first place (design doc §04/§05). This module is the pure, testable core:
// identity/fingerprint modelling, target-difficulty matching, sticky-session selection, and a
// reputation score that learns from fetch outcomes. The actual network client (a Node/backend
// worker using curl-impersonate / Playwright) consumes these decisions — a browser can't spoof TLS,
// so the realism lives where the fetch happens; the cockpit owns the policy + bookkeeping.
//
// Strictly for reaching PUBLIC data (see policy.ts "the line"): reputation avoids challenges, it
// never circumvents an access control. auth-gated targets are refused upstream in the policy engine.
import type { AcquisitionTier } from './policy';

export type Browser = 'chrome' | 'firefox' | 'safari';
export type OS = 'windows' | 'macos' | 'linux' | 'android' | 'ios';
export type EgressClass = 'direct' | 'datacenter' | 'residential' | 'mobile';

// A coherent browser identity. Coherence is the whole game: TLS impersonation target, HTTP version,
// UA, Accept-Language, timezone and viewport must all agree, or the mismatch is itself the tell.
export interface FingerprintProfile {
  id: string;
  browser: Browser;
  os: OS;
  tlsClient: string;        // curl-impersonate / curl_cffi target, e.g. 'chrome124'
  httpVersion: 'h1' | 'h2' | 'h3';
  uaFamily: string;         // e.g. 'Chrome/124'
  acceptLanguage: string;   // must match the egress geo's locale
  timezone: string;         // IANA, must match egress geo
  viewport: { w: number; h: number };
}

// An egress identity = {proxy class/geo + fingerprint + cookie jar + earned reputation}. Held
// stable for a session's lifetime — rotating mid-session is itself a detectable signal.
export interface EgressIdentity {
  id: string;
  egressClass: EgressClass;
  geo: string;              // ISO country of the egress
  fingerprintId: string;
  cookieJar: string;        // opaque handle to the persisted session state
  reputation: number;       // 0..1, EWMA of outcomes; starts neutral at 0.5
  successes: number;
  challenges: number;
  blocks: number;
  lastUsedAt: number;       // epoch ms; 0 = never used
}

export type FetchOutcome = 'success' | 'challenge' | 'block' | 'error';

// Minimum egress class + reputation a target difficulty demands. Harder targets need cleaner egress
// and a more-trusted identity; sending a datacenter IP at a T4 wall just burns the identity.
const TIER_REQUIREMENT: Record<AcquisitionTier, { minClass: EgressClass; minReputation: number }> = {
  T0: { minClass: 'direct', minReputation: 0 },
  T1: { minClass: 'direct', minReputation: 0.3 },
  T2: { minClass: 'residential', minReputation: 0.5 },
  T3: { minClass: 'residential', minReputation: 0.6 },
  T4: { minClass: 'mobile', minReputation: 0.75 },
};

const CLASS_RANK: Record<EgressClass, number> = { direct: 0, datacenter: 1, residential: 2, mobile: 3 };
// Cost order for picking the CHEAPEST identity that qualifies (direct is free, mobile is priciest).
const CLASS_COST: Record<EgressClass, number> = { direct: 0, datacenter: 1, residential: 2, mobile: 3 };

export interface SelectionContext {
  tier: AcquisitionTier;
  geo?: string;             // prefer an egress in this country (locale coherence)
  session?: string;         // if set, reuse the identity already bound to this session (stickiness)
}

export interface SelectionResult {
  identity: EgressIdentity | null;
  reason: string;
}

// Pick the lowest-cost identity that satisfies the target's difficulty and reputation floor.
// Honors sticky sessions: a session already bound to an identity keeps it (rotation is a signal).
export function selectIdentity(
  pool: EgressIdentity[],
  ctx: SelectionContext,
  sessionBindings: Record<string, string> = {},
): SelectionResult {
  if (ctx.session && sessionBindings[ctx.session]) {
    const bound = pool.find((i) => i.id === sessionBindings[ctx.session!]);
    if (bound) return { identity: bound, reason: 'sticky: reused session-bound identity' };
  }
  const req = TIER_REQUIREMENT[ctx.tier];
  const qualified = pool.filter(
    (i) => CLASS_RANK[i.egressClass] >= CLASS_RANK[req.minClass] && i.reputation >= req.minReputation,
  );
  if (qualified.length === 0) return { identity: null, reason: `no identity meets ${ctx.tier} (needs ≥${req.minClass}, rep ≥${req.minReputation})` };
  // Prefer: matching geo, then cheapest egress class, then highest reputation, then least-recently-used.
  const ranked = [...qualified].sort((a, b) => {
    const geoA = ctx.geo && a.geo === ctx.geo ? 0 : 1;
    const geoB = ctx.geo && b.geo === ctx.geo ? 0 : 1;
    if (geoA !== geoB) return geoA - geoB;
    if (CLASS_COST[a.egressClass] !== CLASS_COST[b.egressClass]) return CLASS_COST[a.egressClass] - CLASS_COST[b.egressClass];
    if (a.reputation !== b.reputation) return b.reputation - a.reputation;
    return a.lastUsedAt - b.lastUsedAt;
  });
  return { identity: ranked[0], reason: 'selected cheapest qualifying identity' };
}

// Learn from an outcome. Reputation is an EWMA toward a per-outcome target; challenges and blocks
// pull it down hard (a block is the strongest negative signal), successes lift it gently.
const OUTCOME_TARGET: Record<FetchOutcome, number> = { success: 1, error: 0.5, challenge: 0.2, block: 0 };
const OUTCOME_ALPHA: Record<FetchOutcome, number> = { success: 0.15, error: 0.1, challenge: 0.4, block: 0.6 };

export function scoreOutcome(identity: EgressIdentity, outcome: FetchOutcome, now = Date.now()): EgressIdentity {
  const target = OUTCOME_TARGET[outcome];
  const alpha = OUTCOME_ALPHA[outcome];
  const reputation = clamp01(identity.reputation + alpha * (target - identity.reputation));
  return {
    ...identity,
    reputation,
    successes: identity.successes + (outcome === 'success' ? 1 : 0),
    challenges: identity.challenges + (outcome === 'challenge' ? 1 : 0),
    blocks: identity.blocks + (outcome === 'block' ? 1 : 0),
    lastUsedAt: now,
  };
}

export type ReputationTier = 'trusted' | 'warming' | 'neutral' | 'suspect' | 'burned';
export function reputationTier(score: number): ReputationTier {
  if (score >= 0.8) return 'trusted';
  if (score >= 0.6) return 'warming';
  if (score >= 0.4) return 'neutral';
  if (score >= 0.2) return 'suspect';
  return 'burned';
}

// An identity that keeps getting blocked/challenged should be retired, not reused — reusing a
// burned IP just trains the target's reputation model against us.
export function shouldRetire(identity: EgressIdentity): boolean {
  return identity.reputation < 0.15 || (identity.blocks >= 3 && identity.reputation < 0.3);
}

// Human-motion parameters for a T3 browser fetch. Instantaneous coordinate jumps and fixed dwell
// are classic behavioral tells; real interaction has eased paths and variable think-time. Deterministic
// with a seed so a session replays consistently (another coherence signal).
export interface MotionParams { dwellMs: number; steps: number; jitter: number; thinkMs: number }
export function motionParams(seed: number): MotionParams {
  const r = mulberry32(seed);
  return {
    dwellMs: 40 + Math.floor(r() * 120),   // pause on an element
    steps: 12 + Math.floor(r() * 18),      // points along the eased mouse path
    jitter: 0.5 + r() * 1.5,               // px of path noise
    thinkMs: 300 + Math.floor(r() * 1400), // between-action think time
  };
}

function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
