import { describe, expect, it } from 'vitest';
import {
  resolvePosture, evaluateJob, complianceGrade,
  type JobEnvelope, type SourcePolicy, type AcquisitionProfile, type Override,
} from '../features/acquisition/policy';

const publicPolicy: SourcePolicy = { robots: 'allowed', tos: 'public', pii: false, legalBasis: 'public-data' };
const base = (over: Partial<JobEnvelope> = {}): JobEnvelope => ({
  accountClass: 'sovereign', sourceId: 's', policy: publicPolicy, tier: 'T1', now: '2026-08-03T00:00:00Z', ...over,
});
const validOverride: Override = { by: 'mdheller', reason: 'documented risk accepted', expiresAt: '2026-12-31T00:00:00Z' };

describe('acquisition policy — posture resolution', () => {
  it('commercial → enforced, everything else → advisory', () => {
    expect(resolvePosture('commercial')).toBe('enforced');
    expect(resolvePosture('sovereign')).toBe('advisory');
    expect(resolvePosture('research')).toBe('advisory');
    expect(resolvePosture('own-estate')).toBe('advisory');
  });
});

describe('acquisition policy — advisory (default) never blocks except on the line', () => {
  it('allows a disallowed-robots T4 job but records warnings', () => {
    const r = evaluateJob(base({ policy: { ...publicPolicy, robots: 'disallowed' }, tier: 'T4' }));
    expect(r.decision).toBe('allow');
    expect(r.posture).toBe('advisory');
    expect(r.warnings.some((w) => w.includes('robots'))).toBe(true);
  });
  it('warns on PII and restricted ToS but still allows', () => {
    const r = evaluateJob(base({ policy: { robots: 'allowed', tos: 'restricted', pii: true, legalBasis: 'public-data' } }));
    expect(r.decision).toBe('allow');
    expect(r.warnings.length).toBeGreaterThanOrEqual(2);
  });
});

describe('acquisition policy — enforced (commercial) is compliant-by-default', () => {
  const commercial = (o: Partial<JobEnvelope> = {}) => base({ accountClass: 'commercial', ...o });

  it('allows a clean public T1 job', () => {
    expect(evaluateJob(commercial()).decision).toBe('allow');
  });
  it('blocks disallowed robots without an override', () => {
    const r = evaluateJob(commercial({ policy: { ...publicPolicy, robots: 'disallowed' } }));
    expect(r.decision).toBe('block');
    expect(r.reasons.some((x) => x.includes('robots'))).toBe(true);
  });
  it('blocks T2–T4 tiers without an override', () => {
    for (const tier of ['T2', 'T3', 'T4'] as const) {
      expect(evaluateJob(commercial({ tier })).decision).toBe('block');
    }
    expect(evaluateJob(commercial({ tier: 'T1' })).decision).toBe('allow');
  });
  it('blocks PII with only a public-data basis', () => {
    const r = evaluateJob(commercial({ policy: { robots: 'allowed', tos: 'public', pii: true, legalBasis: 'public-data' } }));
    expect(r.decision).toBe('block');
  });
  it('a valid override lifts robots + tier gates (but is logged as a warning)', () => {
    const r = evaluateJob(commercial({ tier: 'T4', policy: { ...publicPolicy, robots: 'disallowed' }, override: validOverride }));
    expect(r.decision).toBe('allow');
    expect(r.overrideApplied).toBe(true);
    expect(r.warnings.every((w) => w.startsWith('override:'))).toBe(true);
  });
  it('an expired override does NOT lift gates', () => {
    const expired: Override = { ...validOverride, expiresAt: '2020-01-01T00:00:00Z' };
    const r = evaluateJob(commercial({ tier: 'T4', override: expired }));
    expect(r.decision).toBe('block');
  });
});

describe('acquisition policy — the line is absolute', () => {
  it('auth-gated is blocked in every posture, even with an override', () => {
    for (const accountClass of ['sovereign', 'commercial'] as const) {
      const r = evaluateJob(base({ accountClass, policy: { ...publicPolicy, tos: 'auth-gated' }, override: validOverride }));
      expect(r.decision).toBe('block');
      expect(r.overrideApplied).toBe(false);
      expect(r.reasons[0]).toContain('the line');
    }
  });
});

describe('acquisition compliance grade', () => {
  const prof = (p: Partial<SourcePolicy>, tier: AcquisitionProfile['tier'] = 'T1'): AcquisitionProfile => ({
    tier, policy: { robots: 'allowed', tos: 'public', pii: false, legalBasis: 'public-data', ...p }, egressDefault: 'direct', freshness: 'daily',
  });
  it('clean public API grades A, auth-gated grades F', () => {
    expect(complianceGrade(prof({}))).toBe('A');
    expect(complianceGrade(prof({ tos: 'auth-gated' }))).toBe('F');
  });
  it('degrades for disallowed robots / restricted ToS / hard walls', () => {
    expect(complianceGrade(prof({ robots: 'disallowed' }))).toBe('C');
    expect(complianceGrade(prof({ tos: 'restricted' }, 'T4'))).toBe('D');
  });
});
