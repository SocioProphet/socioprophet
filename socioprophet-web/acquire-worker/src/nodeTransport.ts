// Real Node transport for the governed acquisition plane — this is where "make it real" happens:
// live HTTP via Node's global fetch (undici), optional per-request proxy egress, real robots.txt
// fetching, and real SHA-256 content hashing. It plugs into the SAME GovernedFetcher the cockpit
// unit-tests with a fake net, so the governance (policy → identity → robots → rate → provenance) is
// identical; only the socket is real here.
import { createHash } from 'node:crypto';
import type { DirectFetch } from '../../client-vue/src/features/acquisition/transport';
import type { NetResponse } from '../../client-vue/src/features/acquisition/fetcher';
import { parseRobots, type RobotsRules } from '../../client-vue/src/features/acquisition/robots';

// Real content hash for provenance/dedup.
export function sha256(body: string): string {
  return 'sha256:' + createHash('sha256').update(body, 'utf8').digest('hex');
}

// A live directFetch: real network, optional undici ProxyAgent dispatcher for T2/T3 egress.
export function makeNodeDirectFetch(opts: { timeoutMs?: number } = {}): DirectFetch {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  return async (url, { headers, proxyUrl }) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const init: RequestInit & { dispatcher?: unknown } = { headers, redirect: 'follow', signal: ctrl.signal };
      if (proxyUrl) {
        const { ProxyAgent } = await import('undici'); // only pulled in when a proxy is actually used
        init.dispatcher = new ProxyAgent(proxyUrl);
      }
      const res = await fetch(url, init as RequestInit);
      const body = await res.text();
      const h: Record<string, string> = {};
      res.headers.forEach((v, k) => { h[k] = v; });
      return { status: res.status, headers: h, body } satisfies NetResponse;
    } finally {
      clearTimeout(timer);
    }
  };
}

// Fetch + parse a site's robots.txt (best-effort; a fetch failure means "no rules resolved").
export async function fetchRobots(origin: string, userAgent: string): Promise<RobotsRules | null> {
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return parseRobots(await res.text());
  } catch {
    return null;
  }
}
