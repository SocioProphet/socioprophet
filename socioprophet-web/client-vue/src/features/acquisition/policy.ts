// The governed acquisition plane — policy engine (Increment 1, the spine).
//
// This encodes the account-tiered posture from the design doc: capability is maximal, but
// ENFORCEMENT is contextual. Sovereign / research / own-estate jobs run in `advisory` mode
// (compliance signals are captured as provenance, not blocked); a job billed to a `commercial`
// account runs `enforced` (public-only, robots/ToS/rate honored, aggressive tiers T2–T4 need a
// signed, time-boxed override). One exception is absolute in EVERY posture — "the line": we never
// defeat authentication to reach non-public data. That is not a policy toggle; it is a hard block.
import type { Grade } from '../../data/dataSources';

export type AccountClass = 'sovereign' | 'research' | 'own-estate' | 'commercial';
export type Posture = 'advisory' | 'enforced';
// Acquisition tier — match the tool to the target's difficulty (doc §02). T0 = official API/dump …
// T4 = managed unblocker for anti-bot walls. Higher tier = more cost + detection surface.
export type AcquisitionTier = 'T0' | 'T1' | 'T2' | 'T3' | 'T4';
export const TIER_ORDER: AcquisitionTier[] = ['T0', 'T1', 'T2', 'T3', 'T4'];

export type RobotsPolicy = 'allowed' | 'disallowed' | 'unknown';
export type TosClass = 'public' | 'restricted' | 'auth-gated';

export interface SourcePolicy {
  robots: RobotsPolicy;      // what the target's robots.txt says about our paths
  tos: TosClass;             // is the data public, restricted, or behind a login?
  pii: boolean;              // does it contain personal data (GDPR/CCPA duties)?
  legalBasis: string;        // e.g. 'public-data', 'licensed', 'consent', 'contract'
}

// A signed, time-boxed acceptance of a documented risk (doc §01, override row).
export interface Override {
  by: string;                // who accepted it
  reason: string;            // why
  expiresAt: string;         // ISO — overrides are never open-ended
}

// The unit the engine evaluates. Enforcement is a property of the envelope, resolved once.
export interface JobEnvelope {
  accountClass: AccountClass;
  sourceId: string;
  policy: SourcePolicy;
  tier: AcquisitionTier;
  override?: Override | null;
  now?: string;              // ISO, injectable for tests; defaults to Date.now()
}

export type Decision = 'allow' | 'block';
export interface PolicyResult {
  decision: Decision;
  posture: Posture;
  reasons: string[];         // why blocked (empty when allowed)
  warnings: string[];        // advisory-mode notes captured into provenance
  overrideApplied: boolean;
}

// Commercial jobs are enforced; everything else is advisory. This is the whole switch.
export function resolvePosture(accountClass: AccountClass): Posture {
  return accountClass === 'commercial' ? 'enforced' : 'advisory';
}

function overrideValid(o: Override | null | undefined, now: number): boolean {
  if (!o) return false;
  const exp = Date.parse(o.expiresAt);
  return Number.isFinite(exp) && exp > now && !!o.by && !!o.reason;
}

// The single chokepoint. Call at job-submit; the result decides allow/block and what provenance
// carries. Advisory never blocks except on "the line"; enforced blocks unless a valid override lifts it.
export function evaluateJob(job: JobEnvelope): PolicyResult {
  const posture = resolvePosture(job.accountClass);
  const now = Date.parse(job.now ?? new Date().toISOString());
  const hasOverride = overrideValid(job.override, now);
  const reasons: string[] = [];
  const warnings: string[] = [];

  // ── The line (§12) — absolute in every posture, override cannot lift it ──────────────
  // We do not defeat authentication to reach non-public data. Public-data scraping has legal
  // shelter (hiQ, Van Buren); auth-walled data does not, and it contaminates provenance.
  if (job.policy.tos === 'auth-gated') {
    return {
      decision: 'block', posture, overrideApplied: false,
      reasons: ['auth-gated: outside the public-data shelter — defeating access controls is not supported (the line)'],
      warnings,
    };
  }

  if (posture === 'advisory') {
    // Advisory captures compliance as provenance, not as a block.
    if (job.policy.robots === 'disallowed') warnings.push('robots.txt disallows these paths (advisory)');
    if (job.policy.robots === 'unknown') warnings.push('robots.txt not resolved (advisory)');
    if (job.policy.tos === 'restricted') warnings.push('ToS marks this data restricted (advisory)');
    if (job.policy.pii) warnings.push('source contains PII — minimization/retention duties apply (advisory)');
    return { decision: 'allow', posture, reasons, warnings, overrideApplied: false };
  }

  // ── Enforced (commercial) — compliant by default, overrides lift specific gates ──────
  if (job.policy.robots === 'disallowed' && !hasOverride) reasons.push('robots.txt disallows these paths');
  if (job.policy.tos === 'restricted' && !hasOverride) reasons.push('ToS marks this data restricted');
  if (job.policy.pii && job.policy.legalBasis === 'public-data' && !hasOverride) {
    reasons.push('PII present without a stronger legal basis than "public-data"');
  }
  const tierIdx = TIER_ORDER.indexOf(job.tier);
  if (tierIdx >= TIER_ORDER.indexOf('T2') && !hasOverride) {
    reasons.push(`tier ${job.tier} (proxy/anti-bot) requires a logged override in enforced mode`);
  }

  if (reasons.length === 0) {
    return { decision: 'allow', posture, reasons, warnings, overrideApplied: hasOverride };
  }
  // If an override is present and valid it clears the gates it's allowed to clear (all but the line).
  if (hasOverride) {
    return { decision: 'allow', posture, reasons: [], warnings: reasons.map((r) => `override: ${r}`), overrideApplied: true };
  }
  return { decision: 'block', posture, reasons, warnings, overrideApplied: false };
}

// The record every fetch emits — the artifact that makes the data defensible (doc §08). Feeds the
// WorldClaim / verified-compute chain and the catalogue's compliance grade.
export interface ProvenanceRecord {
  sourceId: string;
  url: string;
  fetchedAt: string;         // ISO
  httpStatus: number;
  contentHash: string;       // sha256:… — dedup + integrity
  tier: AcquisitionTier;
  renderMode: 'http' | 'playwright' | 'unblocker' | 'api';
  egress: { class: 'datacenter' | 'residential' | 'mobile' | 'direct'; geo: string };
  posture: Posture;
  policy: SourcePolicy;
  override: Override | null;
  accountClass: AccountClass;
  warnings: string[];        // advisory notes carried from evaluateJob
}

// A source's acquisition profile, attached to a catalogue DataSource.
export interface AcquisitionProfile {
  tier: AcquisitionTier;
  policy: SourcePolicy;
  egressDefault: ProvenanceRecord['egress']['class'];
  freshness: string;         // human cadence, mirrors DataSource.cadence
}

// Derive a compliance grade A–F for a source from its acquisition profile — a sibling to the
// quality grade. Clean public APIs grade A; anything auth-gated is F (we won't take it).
export function complianceGrade(p: AcquisitionProfile): Grade {
  if (p.policy.tos === 'auth-gated') return 'F';
  let score = 5; // start at A
  if (p.policy.tos === 'restricted') score -= 2;
  if (p.policy.robots === 'disallowed') score -= 2;
  else if (p.policy.robots === 'unknown') score -= 1;
  if (p.policy.pii && p.policy.legalBasis === 'public-data') score -= 1;
  if (p.tier === 'T4') score -= 1;               // hardest walls = more fragile right-to-acquire
  score = Math.max(1, Math.min(5, score));
  return (['F', 'D', 'C', 'B', 'A'] as Grade[])[score - 1];
}
