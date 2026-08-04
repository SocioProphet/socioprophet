import { describe, expect, it } from 'vitest';
import { parseRobots, isAllowed, crawlDelayFor } from '../features/acquisition/robots';
import { RateGovernor } from '../features/acquisition/rateGovernor';
import { GovernedFetcher, type NetResponse } from '../features/acquisition/fetcher';
import type { JobEnvelope, SourcePolicy } from '../features/acquisition/policy';
import type { EgressIdentity } from '../features/acquisition/reputation';

// ── robots.txt ──────────────────────────────────────────────────────────────
describe('robots.txt parsing + matching', () => {
  const txt = `
User-agent: *
Disallow: /private
Allow: /private/public
Crawl-delay: 5

User-agent: sociobot
Disallow: /
Sitemap: https://x.example/sitemap.xml
`;
  const rules = parseRobots(txt);
  it('longest-match wins: /private denied but /private/public allowed', () => {
    expect(isAllowed(rules, 'generic', '/private/data')).toBe(false);
    expect(isAllowed(rules, 'generic', '/private/public/x')).toBe(true);
    expect(isAllowed(rules, 'generic', '/open')).toBe(true);
  });
  it('a more-specific agent group overrides the * group', () => {
    expect(isAllowed(rules, 'sociobot/1.0', '/anything')).toBe(false); // Disallow: /
  });
  it('parses crawl-delay and sitemaps', () => {
    expect(crawlDelayFor(rules, 'generic')).toBe(5);
    expect(rules.sitemaps).toContain('https://x.example/sitemap.xml');
  });
  it('supports * and $ wildcards', () => {
    const r = parseRobots('User-agent: *\nDisallow: /*.pdf$');
    expect(isAllowed(r, 'g', '/docs/a.pdf')).toBe(false);
    expect(isAllowed(r, 'g', '/docs/a.pdf?x=1')).toBe(true); // $ anchors end
  });
});

// ── rate governor ───────────────────────────────────────────────────────────
describe('rate governor', () => {
  it('spaces requests and refills tokens over time', () => {
    let t = 0;
    const g = new RateGovernor({ ratePerSec: 1, burst: 2, minSpacingMs: 100, maxBackoffMs: 10000, breakAfter: 3 }, () => t);
    expect(g.msUntilReady('h')).toBe(0); g.take('h'); // token 1
    t = 100; expect(g.msUntilReady('h')).toBe(0); g.take('h'); // token 2 after spacing
    // out of tokens now-ish → must wait
    expect(g.msUntilReady('h')).toBeGreaterThan(0);
  });
  it('backs off then circuit-breaks on repeated throttling', () => {
    let t = 0;
    const g = new RateGovernor({ ratePerSec: 5, burst: 5, minSpacingMs: 0, maxBackoffMs: 10000, breakAfter: 3 }, () => t);
    for (let i = 0; i < 3; i++) g.onResult('h', 429);
    expect(g.isBroken('h')).toBe(true);
    g.onResult('h', 200); // a success closes the circuit
    expect(g.isBroken('h')).toBe(false);
  });
});

// ── governed fetcher (orchestration) ─────────────────────────────────────────
const publicPolicy: SourcePolicy = { robots: 'allowed', tos: 'public', pii: false, legalBasis: 'public-data' };
const identity = (): EgressIdentity => ({ id: 'i', egressClass: 'residential', geo: 'US', fingerprintId: 'fp', cookieJar: 'cj', reputation: 0.7, successes: 0, challenges: 0, blocks: 0, lastUsedAt: 0 });
const job = (o: Partial<JobEnvelope> = {}): JobEnvelope => ({ accountClass: 'sovereign', sourceId: 'src', policy: publicPolicy, tier: 'T1', now: '2026-08-03T00:00:00Z', ...o });

function fetcherWith(res: NetResponse | (() => Promise<NetResponse>), extra = {}) {
  const net = typeof res === 'function' ? res : async () => res;
  return new GovernedFetcher({ net, hash: (b) => `sha256:${b.length}`, now: () => 1_700_000_000_000, ...extra });
}

describe('GovernedFetcher', () => {
  it('blocks at policy before any network call (the line)', async () => {
    let called = false;
    const f = fetcherWith(async () => { called = true; return { status: 200, headers: {}, body: 'x' }; });
    const r = await f.fetch({ url: 'https://x.example/a', job: job({ policy: { ...publicPolicy, tos: 'auth-gated' } }), identityPool: [identity()], userAgent: 'sociobot' });
    expect(r.status).toBe('blocked');
    expect(called).toBe(false);
  });

  it('fetches, emits provenance, and lifts reputation on success', async () => {
    const f = fetcherWith({ status: 200, headers: { etag: 'W/"abc"' }, body: 'hello' });
    const r = await f.fetch({ url: 'https://x.example/a', job: job(), identityPool: [identity()], userAgent: 'sociobot' });
    expect(r.status).toBe('ok');
    expect(r.body).toBe('hello');
    expect(r.provenance?.contentHash).toBe('sha256:5');
    expect(r.provenance?.egress).toEqual({ class: 'residential', geo: 'US' });
    expect(r.identity!.reputation).toBeGreaterThan(0.7);
  });

  it('sends conditional-GET validators on the second request and handles 304', async () => {
    const seen: Record<string, string>[] = [];
    const openGov = new RateGovernor({ ratePerSec: 100, burst: 100, minSpacingMs: 0, maxBackoffMs: 1000, breakAfter: 9 }, () => 1_700_000_000_000);
    const f = fetcherWith({ status: 200, headers: {}, body: 'x' }, {
      governor: openGov,
      net: async (_url: string, opts: { headers: Record<string, string> }) => { seen.push(opts.headers); return seen.length === 1 ? { status: 200, headers: { etag: '"v1"' }, body: 'data' } : { status: 304, headers: {}, body: '' }; },
    });
    const base = { url: 'https://x.example/a', job: job(), identityPool: [identity()], userAgent: 'sociobot' };
    const r1 = await f.fetch(base);
    expect(r1.status).toBe('ok');
    const r2 = await f.fetch(base);
    expect(r2.status).toBe('not-modified');
    expect(seen[1]['If-None-Match']).toBe('"v1"'); // validator replayed
  });

  it('defers when the rate governor is not ready', async () => {
    let t = 0;
    const gov = new RateGovernor({ ratePerSec: 1, burst: 1, minSpacingMs: 1000, maxBackoffMs: 10000, breakAfter: 3 }, () => t);
    const f = fetcherWith({ status: 200, headers: {}, body: 'x' }, { governor: gov, now: () => t });
    const base = { url: 'https://x.example/a', job: job(), identityPool: [identity()], userAgent: 'sociobot' };
    expect((await f.fetch(base)).status).toBe('ok');       // consumes the one token
    const second = await f.fetch(base);                     // no tokens, spacing not elapsed
    expect(second.status).toBe('rate-limited');
    expect(second.retryAfterMs).toBeGreaterThan(0);
  });

  it('enforced mode denies a robots-disallowed path per-URL', async () => {
    const robots = parseRobots('User-agent: *\nDisallow: /secret');
    const f = fetcherWith({ status: 200, headers: {}, body: 'x' }, { robotsFor: () => robots });
    const r = await f.fetch({ url: 'https://x.example/secret/a', job: job({ accountClass: 'commercial', tier: 'T1' }), identityPool: [identity()], userAgent: 'sociobot' });
    expect(r.status).toBe('robots-denied');
  });
});
