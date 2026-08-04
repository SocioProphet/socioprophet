// AcquisitionService — the programmatic entry point the whole estate calls (BearBrowser, Turtle
// Terminal, GooseNotes, Noetica, prophet-mesh). Give it a URL and an account context; it runs the
// governed pipeline for real (live fetch, robots, rate, provenance) and lands the result in whatever
// sink you pass (local / cloud / mesh). Governance is identical to the cockpit's — same code.
import { GovernedFetcher, type FetchResult } from '../../client-vue/src/features/acquisition/fetcher';
import { RateGovernor } from '../../client-vue/src/features/acquisition/rateGovernor';
import { makeTieredTransport, type TransportDeps } from '../../client-vue/src/features/acquisition/transport';
import type { ProxyPool } from '../../client-vue/src/features/acquisition/egress';
import type { Unblocker } from '../../client-vue/src/features/acquisition/unblocker';
import type { EgressIdentity } from '../../client-vue/src/features/acquisition/reputation';
import type { AccountClass, AcquisitionTier, SourcePolicy, Override } from '../../client-vue/src/features/acquisition/policy';
import type { RobotsRules } from '../../client-vue/src/features/acquisition/robots';
import { makeNodeDirectFetch, fetchRobots, sha256 } from './nodeTransport';
import type { Sink } from './sinks';
import type { Enricher, EnrichmentResult } from './enricher';

const DEFAULT_UA = 'SocioProphetBot/1.0 (+https://socioprophet.ai/bot; governed-acquisition)';
const PUBLIC: SourcePolicy = { robots: 'allowed', tos: 'public', pii: false, legalBasis: 'public-data' };

const DEFAULT_POOL: EgressIdentity[] = [
  { id: 'direct-us', egressClass: 'direct', geo: 'US', fingerprintId: 'node-default', cookieJar: 'j0', reputation: 0.6, successes: 0, challenges: 0, blocks: 0, lastUsedAt: 0 },
];

export interface ServiceConfig {
  userAgent?: string;
  identityPool?: EgressIdentity[];
  proxyPool?: ProxyPool;
  unblocker?: Unblocker;
  directFetch?: TransportDeps['directFetch']; // override the transport (e.g. a BearBrowser transport)
  timeoutMs?: number;
}

export interface AcquireOptions {
  accountClass?: AccountClass;
  tier?: AcquisitionTier;
  sink?: Sink;
  policy?: SourcePolicy;
  override?: Override;
  sourceId?: string;
  geo?: string;
  maxRateWaits?: number;      // how many times to honor a rate-limit deferral before giving up
  enricher?: Enricher;        // SynapseIQ (or any Enricher) — runs after fetch, before the sink
}

export type AcquireResult = FetchResult & { landed: boolean; sink?: string; enriched: boolean };

export class AcquisitionService {
  private fetcher: GovernedFetcher;
  private governor = new RateGovernor();
  private robotsCache = new Map<string, RobotsRules | null>();
  private ua: string;
  private pool: EgressIdentity[];

  constructor(cfg: ServiceConfig = {}) {
    this.ua = cfg.userAgent ?? DEFAULT_UA;
    this.pool = cfg.identityPool ?? DEFAULT_POOL;
    const net = makeTieredTransport({
      directFetch: cfg.directFetch ?? makeNodeDirectFetch({ timeoutMs: cfg.timeoutMs }),
      proxyPool: cfg.proxyPool,
      unblocker: cfg.unblocker,
    });
    this.fetcher = new GovernedFetcher({
      net,
      hash: sha256,
      robotsFor: (origin) => this.robotsCache.get(origin) ?? null,
      governor: this.governor,
    });
  }

  async acquire(url: string, opts: AcquireOptions = {}): Promise<AcquireResult> {
    const origin = new URL(url).origin;
    if (!this.robotsCache.has(origin)) this.robotsCache.set(origin, await fetchRobots(origin, this.ua));

    const job = {
      accountClass: opts.accountClass ?? 'sovereign' as AccountClass,
      sourceId: opts.sourceId ?? url,
      policy: opts.policy ?? PUBLIC,
      tier: opts.tier ?? 'T1' as AcquisitionTier,
      override: opts.override ?? null,
    };
    const req = { url, job, identityPool: this.pool, userAgent: this.ua, geo: opts.geo };

    // Honor the rate governor for real: if deferred, wait the requested time and retry (bounded).
    let res = await this.fetcher.fetch(req);
    let waits = opts.maxRateWaits ?? 3;
    while (res.status === 'rate-limited' && waits-- > 0) {
      await new Promise((r) => setTimeout(r, Math.min(res.retryAfterMs ?? 1000, 30_000)));
      res = await this.fetcher.fetch(req);
    }

    // Enrich (SynapseIQ) between fetch and sink — only on a real body, and never let an enrichment
    // failure lose the governed fetch: the document still lands, just without enrichment.
    let enrichment: EnrichmentResult | undefined;
    if (res.status === 'ok' && res.body && opts.enricher) {
      try {
        enrichment = await opts.enricher.enrich({ url, body: res.body, contentHash: res.provenance?.contentHash ?? '' });
      } catch {
        enrichment = undefined;
      }
    }

    let landed = false;
    if (res.provenance && opts.sink) {
      await opts.sink.write({ provenance: res.provenance, body: res.body ?? null, enrichment });
      landed = true;
    }
    return { ...res, landed, sink: opts.sink?.name, enriched: !!enrichment };
  }
}
