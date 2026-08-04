// Crawl driver — where Sherlock plugs in. Sherlock's search drives acquisition: it supplies seeds
// and, at each page, RANKED discovery of what to fetch next. The frontier stays governed — every URL
// the crawl visits goes through AcquisitionService.acquire, so it inherits policy, robots, rate
// limiting, reputation, provenance and (optionally) SynapseIQ enrichment. Sherlock decides WHAT to
// crawl; the plane decides WHETHER and HOW. A default same-origin link extractor stands in when
// Sherlock isn't wired.
import type { AcquisitionService, AcquireOptions } from './service';

// A Discoverer turns a fetched page into the next URLs to consider. Sherlock implements this with
// ranked, relevance-scored discovery; the default just extracts in-page links.
export interface Discoverer {
  readonly name: string;
  discover(input: { url: string; body: string; depth: number }): string[];
}

// Default discovery: same-doc <a href> / <link href> extraction, resolved against the page URL.
export class LinkDiscoverer implements Discoverer {
  readonly name = 'links';
  discover({ url, body }: { url: string; body: string }): string[] {
    const out: string[] = [];
    const re = /(?:href|src)\s*=\s*["']([^"'#]+)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      try {
        const abs = new URL(m[1], url).toString();
        if (abs.startsWith('http')) out.push(abs.split('#')[0]);
      } catch { /* skip malformed */ }
    }
    return out;
  }
}

export interface CrawlOptions extends Omit<AcquireOptions, 'sink' | 'enricher'> {
  maxPages?: number;
  maxDepth?: number;
  sameOrigin?: boolean;        // stay on the seed's origin (default true)
  allowHosts?: string[];       // additional hosts permitted beyond the seed origin(s)
  discoverer?: Discoverer;     // Sherlock plugs in here
  sink?: AcquireOptions['sink'];
  enricher?: AcquireOptions['enricher'];
  onPage?: (url: string, status: string) => void;
}

export interface CrawlReport {
  seeds: string[];
  visited: number;
  landed: number;
  blocked: number;
  errored: number;
  byStatus: Record<string, number>;
  frontierExhausted: boolean;   // false = stopped on maxPages
}

interface FrontierItem { url: string; depth: number }

// Bounded, deduped, scope-checked frontier. Sherlock's ranking only reorders what we consider; the
// scope + budget + governance are non-negotiable.
export async function crawl(seeds: string[], svc: AcquisitionService, opts: CrawlOptions = {}): Promise<CrawlReport> {
  const maxPages = opts.maxPages ?? 50;
  const maxDepth = opts.maxDepth ?? 2;
  const sameOrigin = opts.sameOrigin ?? true;
  const discoverer = opts.discoverer ?? new LinkDiscoverer();
  const seedOrigins = new Set(seeds.map((s) => safeOrigin(s)).filter(Boolean) as string[]);
  const allowHosts = new Set(opts.allowHosts ?? []);

  const inScope = (url: string): boolean => {
    const o = safeOrigin(url);
    if (!o) return false;
    if (!sameOrigin) return true;
    if (seedOrigins.has(o)) return true;
    try { return allowHosts.has(new URL(url).host); } catch { return false; }
  };

  const visited = new Set<string>();
  const queue: FrontierItem[] = seeds.filter(inScope).map((url) => ({ url, depth: 0 }));
  const report: CrawlReport = { seeds, visited: 0, landed: 0, blocked: 0, errored: 0, byStatus: {}, frontierExhausted: true };

  while (queue.length) {
    if (report.visited >= maxPages) { report.frontierExhausted = false; break; }
    const { url, depth } = queue.shift()!;
    const norm = url.split('#')[0];
    if (visited.has(norm)) continue;
    visited.add(norm);

    const res = await svc.acquire(norm, { ...opts, sink: opts.sink, enricher: opts.enricher });
    report.visited += 1;
    report.byStatus[res.status] = (report.byStatus[res.status] ?? 0) + 1;
    if (res.landed) report.landed += 1;
    if (res.status === 'blocked' || res.status === 'robots-denied') report.blocked += 1;
    if (res.status === 'error') report.errored += 1;
    opts.onPage?.(norm, res.status);

    // Discover the next hop only from a page we actually read, and only within budget.
    if ((res.status === 'ok') && res.body && depth < maxDepth) {
      for (const next of discoverer.discover({ url: norm, body: res.body, depth })) {
        const n = next.split('#')[0];
        if (!visited.has(n) && inScope(n)) queue.push({ url: n, depth: depth + 1 });
      }
    }
  }
  return report;
}

function safeOrigin(url: string): string | null {
  try { return new URL(url).origin; } catch { return null; }
}
