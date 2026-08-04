// Tiered transport (acquisition I4/I5 wiring) — builds the NetFetch the GovernedFetcher consumes,
// routing each request by its tier: T0/T1 fetch direct, T2/T3 fetch through the proxy pool, T4 goes
// to the managed unblocker. The actual socket work is delegated to an injected `directFetch` (a Node
// backend supplies one with a proxy agent + curl-impersonate TLS realism; the browser supplies a
// plain fetch wrapper), so this stays runtime-agnostic and unit-testable.
import type { NetFetch, NetResponse } from './fetcher';
import type { ProxyPool } from './egress';
import type { Unblocker } from './unblocker';
import { TIER_ORDER } from './policy';

export interface DirectFetch {
  (url: string, opts: { headers: Record<string, string>; proxyUrl?: string }): Promise<NetResponse>;
}

export interface TransportDeps {
  directFetch: DirectFetch;
  proxyPool?: ProxyPool;
  unblocker?: Unblocker;
}

const idx = (t: string) => TIER_ORDER.indexOf(t as (typeof TIER_ORDER)[number]);

export function makeTieredTransport(deps: TransportDeps): NetFetch {
  return async (url, { headers, identity, tier }): Promise<NetResponse> => {
    // T4 — hand the whole hard-wall problem to the managed unblocker (public URLs only).
    if (tier === 'T4') {
      if (!deps.unblocker) throw new Error('T4 requires an unblocker; none configured');
      const r = await deps.unblocker.fetch({ url, render: true, geo: identity.geo, session: identity.cookieJar });
      return { status: r.status, headers: { 'x-egress-geo': r.egressGeo }, body: r.html };
    }

    // T2/T3 (or any non-direct identity) — route through the proxy pool and report health.
    const wantsProxy = idx(tier) >= idx('T2') || identity.egressClass !== 'direct';
    if (wantsProxy && deps.proxyPool) {
      const ep = deps.proxyPool.acquire(identity);
      if (!ep && idx(tier) >= idx('T2')) throw new Error(`no ${identity.egressClass} proxy available for ${tier}`);
      try {
        const res = await deps.directFetch(url, { headers, proxyUrl: ep?.url });
        if (ep) deps.proxyPool.report(ep.id, res.status < 500);
        return res;
      } catch (e) {
        if (ep) deps.proxyPool.report(ep.id, false);
        throw e;
      }
    }

    // T0/T1 direct.
    return deps.directFetch(url, { headers });
  };
}
