import { describe, expect, it } from 'vitest';
import { StaticProxyPool, type ProxyEndpoint } from '../features/acquisition/egress';
import { HttpUnblocker, NullUnblocker } from '../features/acquisition/unblocker';
import { makeTieredTransport } from '../features/acquisition/transport';
import type { EgressIdentity } from '../features/acquisition/reputation';
import type { AcquisitionTier } from '../features/acquisition/policy';

const identity = (o: Partial<EgressIdentity> = {}): EgressIdentity => ({
  id: 'i', egressClass: 'residential', geo: 'US', fingerprintId: 'fp', cookieJar: 'sess-1',
  reputation: 0.7, successes: 0, challenges: 0, blocks: 0, lastUsedAt: 0, ...o,
});

// ── egress pool ───────────────────────────────────────────────────────────────
describe('StaticProxyPool', () => {
  const eps: ProxyEndpoint[] = [
    { id: 'r-us-1', url: 'http://p1', class: 'residential', geo: 'US' },
    { id: 'r-us-2', url: 'http://p2', class: 'residential', geo: 'US' },
    { id: 'm-de-1', url: 'http://p3', class: 'mobile', geo: 'DE' },
  ];
  it('returns null for a direct identity (no proxy needed)', () => {
    const pool = new StaticProxyPool(eps);
    expect(pool.acquire({ egressClass: 'direct', geo: 'US' })).toBeNull();
  });
  it('matches class+geo and round-robins within the bucket', () => {
    const pool = new StaticProxyPool(eps);
    const a = pool.acquire({ egressClass: 'residential', geo: 'US' });
    const b = pool.acquire({ egressClass: 'residential', geo: 'US' });
    expect(new Set([a?.id, b?.id])).toEqual(new Set(['r-us-1', 'r-us-2']));
  });
  it('benches an endpoint after repeated failures', () => {
    let t = 0;
    const pool = new StaticProxyPool([eps[2]], () => t, 3);
    for (let i = 0; i < 3; i++) pool.report('m-de-1', false);
    expect(pool.benchedCount()).toBe(1);
    expect(pool.acquire({ egressClass: 'mobile', geo: 'DE' })).toBeNull(); // benched → unavailable
  });
});

// ── unblocker adapter ─────────────────────────────────────────────────────────
describe('HttpUnblocker', () => {
  it('adapts a generic vendor endpoint and enforces a cost cap', async () => {
    const fakeFetch = (async () => ({
      status: 200, text: async () => '<html>ok</html>', headers: new Map<string, string>() as unknown as Headers,
    })) as unknown as typeof fetch;
    const ub = new HttpUnblocker({
      endpoint: 'https://vendor/api',
      buildRequest: (r) => ({ url: 'https://vendor/api', init: { method: 'POST', body: JSON.stringify(r) } }),
      parseResponse: (raw) => ({ html: raw.body, status: raw.status, egressGeo: 'US', cost: 0.002 }),
      fetchImpl: fakeFetch,
      costCapPerReq: 0.001,
    });
    await expect(ub.fetch({ url: 'https://x/a' })).rejects.toThrow(/cost/);
  });
  it('NullUnblocker makes T4 explicitly unavailable', async () => {
    await expect(new NullUnblocker().fetch({ url: 'https://x/a' })).rejects.toThrow(/no unblocker/);
  });
});

// ── tiered transport routing ────────────────────────────────────────────────
describe('makeTieredTransport routing', () => {
  const netOpts = (tier: AcquisitionTier, id = identity()) => ({ headers: {}, identity: id, tier });

  it('T1 fetches direct (no proxy url)', async () => {
    const seen: Array<{ proxyUrl?: string }> = [];
    const t = makeTieredTransport({ directFetch: async (_u, o) => { seen.push(o); return { status: 200, headers: {}, body: 'x' }; } });
    await t('https://x/a', netOpts('T1', identity({ egressClass: 'direct' })));
    expect(seen[0].proxyUrl).toBeUndefined();
  });

  it('T2 routes through the proxy pool and reports health', async () => {
    const pool = new StaticProxyPool([{ id: 'r-us-1', url: 'http://p1', class: 'residential', geo: 'US' }]);
    const seen: Array<{ proxyUrl?: string }> = [];
    const t = makeTieredTransport({ proxyPool: pool, directFetch: async (_u, o) => { seen.push(o); return { status: 200, headers: {}, body: 'x' }; } });
    const res = await t('https://x/a', netOpts('T2'));
    expect(seen[0].proxyUrl).toBe('http://p1');
    expect(res.status).toBe(200);
  });

  it('T2 throws when no proxy is available', async () => {
    const t = makeTieredTransport({ proxyPool: new StaticProxyPool([]), directFetch: async () => ({ status: 200, headers: {}, body: 'x' }) });
    await expect(t('https://x/a', netOpts('T2'))).rejects.toThrow(/no residential proxy/);
  });

  it('T4 routes to the unblocker, not directFetch', async () => {
    let direct = false;
    const ub = { fetch: async () => ({ html: '<b>wall</b>', status: 200, egressGeo: 'US', cost: 0.01 }) };
    const t = makeTieredTransport({ unblocker: ub, directFetch: async () => { direct = true; return { status: 0, headers: {}, body: '' }; } });
    const res = await t('https://x/a', netOpts('T4'));
    expect(direct).toBe(false);
    expect(res.body).toBe('<b>wall</b>');
  });

  it('T4 without an unblocker throws', async () => {
    const t = makeTieredTransport({ directFetch: async () => ({ status: 200, headers: {}, body: 'x' }) });
    await expect(t('https://x/a', netOpts('T4'))).rejects.toThrow(/requires an unblocker/);
  });
});
