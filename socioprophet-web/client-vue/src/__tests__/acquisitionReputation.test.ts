import { describe, expect, it } from 'vitest';
import {
  selectIdentity, scoreOutcome, reputationTier, shouldRetire, motionParams,
  type EgressIdentity,
} from '../features/acquisition/reputation';

const id = (over: Partial<EgressIdentity>): EgressIdentity => ({
  id: 'i', egressClass: 'residential', geo: 'US', fingerprintId: 'fp', cookieJar: 'cj',
  reputation: 0.6, successes: 0, challenges: 0, blocks: 0, lastUsedAt: 0, ...over,
});

describe('reputation — identity selection', () => {
  it('picks the cheapest egress class that satisfies the tier', () => {
    const pool = [id({ id: 'mob', egressClass: 'mobile' }), id({ id: 'res', egressClass: 'residential' })];
    // T2 needs >= residential; residential is cheaper than mobile → pick residential.
    const r = selectIdentity(pool, { tier: 'T2' });
    expect(r.identity?.id).toBe('res');
  });
  it('rejects identities below the tier reputation floor', () => {
    const pool = [id({ id: 'low', egressClass: 'mobile', reputation: 0.5 })];
    // T4 needs mobile + rep >= 0.75 → the 0.5-rep mobile fails.
    expect(selectIdentity(pool, { tier: 'T4' }).identity).toBeNull();
  });
  it('honors sticky sessions — never rotates mid-session', () => {
    const pool = [id({ id: 'a', reputation: 0.9 }), id({ id: 'b', reputation: 0.61 })];
    const r = selectIdentity(pool, { tier: 'T2', session: 's1' }, { s1: 'b' });
    expect(r.identity?.id).toBe('b'); // stuck to b even though a is more reputable
    expect(r.reason).toContain('sticky');
  });
  it('prefers an egress in the requested geo', () => {
    const pool = [id({ id: 'de', geo: 'DE' }), id({ id: 'us', geo: 'US' })];
    expect(selectIdentity(pool, { tier: 'T2', geo: 'DE' }).identity?.id).toBe('de');
  });
});

describe('reputation — learning from outcomes', () => {
  it('a block pulls reputation down hard; a success lifts it gently', () => {
    const start = id({ reputation: 0.6 });
    const blocked = scoreOutcome(start, 'block');
    expect(blocked.reputation).toBeLessThan(0.4);
    expect(blocked.blocks).toBe(1);
    const succeeded = scoreOutcome(start, 'success');
    expect(succeeded.reputation).toBeGreaterThan(0.6);
    expect(succeeded.reputation).toBeLessThan(0.75); // gentle
    expect(succeeded.successes).toBe(1);
  });
  it('repeated challenges degrade an identity toward burned', () => {
    let x = id({ reputation: 0.7 });
    for (let i = 0; i < 5; i++) x = scoreOutcome(x, 'challenge');
    expect(reputationTier(x.reputation)).toMatch(/suspect|burned/);
  });
  it('flags an identity for retirement once it is burned or repeatedly blocked', () => {
    expect(shouldRetire(id({ reputation: 0.1 }))).toBe(true);
    expect(shouldRetire(id({ reputation: 0.25, blocks: 3 }))).toBe(true);
    expect(shouldRetire(id({ reputation: 0.6 }))).toBe(false);
  });
});

describe('reputation — tiers + human motion', () => {
  it('maps scores to tiers', () => {
    expect(reputationTier(0.9)).toBe('trusted');
    expect(reputationTier(0.5)).toBe('neutral');
    expect(reputationTier(0.05)).toBe('burned');
  });
  it('motion params are deterministic per seed and within human ranges', () => {
    const a = motionParams(42);
    const b = motionParams(42);
    expect(a).toEqual(b); // deterministic → session replays consistently
    expect(a.steps).toBeGreaterThanOrEqual(12);
    expect(a.thinkMs).toBeGreaterThanOrEqual(300);
    expect(motionParams(43)).not.toEqual(a); // different seed → different motion
  });
});
