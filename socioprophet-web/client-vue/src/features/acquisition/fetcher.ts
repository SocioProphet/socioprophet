// GovernedFetcher (acquisition I2) — the orchestrator that turns I1 (policy) + I3 (reputation) +
// robots + rate governing into ONE governed request. This is the chokepoint every acquisition flows
// through: evaluate posture → pick an identity → check robots → wait for the rate governor →
// conditional GET → record provenance → learn from the outcome. The actual network client and the
// content hasher are INJECTED, so the whole pipeline is unit-testable without a socket (and so the
// real backend worker can plug in a curl-impersonate / Playwright transport for TLS realism).
import { evaluateJob, type JobEnvelope, type ProvenanceRecord, type PolicyResult, type AcquisitionTier } from './policy';
import { selectIdentity, scoreOutcome, type EgressIdentity, type FetchOutcome } from './reputation';
import { RateGovernor } from './rateGovernor';
import { isAllowed, crawlDelayFor, type RobotsRules } from './robots';

export interface NetResponse { status: number; headers: Record<string, string>; body: string }
export type NetFetch = (url: string, opts: { headers: Record<string, string>; identity: EgressIdentity; tier: AcquisitionTier }) => Promise<NetResponse>;

export interface FetcherDeps {
  net: NetFetch;
  hash: (body: string) => string;                 // content hash (sha256 in prod, injectable for tests)
  robotsFor?: (origin: string) => RobotsRules | null; // resolved robots.txt for an origin
  governor?: RateGovernor;
  now?: () => number;
}

export interface FetchRequest {
  url: string;
  job: JobEnvelope;
  identityPool: EgressIdentity[];
  userAgent: string;
  sessionBindings?: Record<string, string>;
  geo?: string;
}

export type FetchStatus = 'ok' | 'not-modified' | 'blocked' | 'rate-limited' | 'no-identity' | 'robots-denied' | 'error';
export interface FetchResult {
  status: FetchStatus;
  httpStatus?: number;
  body?: string;
  provenance?: ProvenanceRecord;
  identity?: EgressIdentity;   // post-outcome (reputation updated) — caller should persist it
  retryAfterMs?: number;
  reason?: string;
}

function originOf(url: string): { origin: string; host: string; path: string } {
  const u = new URL(url);
  return { origin: u.origin, host: u.host, path: u.pathname + u.search };
}

function outcomeFor(status: number): FetchOutcome {
  if (status >= 200 && status < 400) return 'success';
  if (status === 429 || status === 403 || status === 503) return 'challenge';
  if (status === 401 || status === 451 || status === 402) return 'block';
  return 'error';
}

export class GovernedFetcher {
  private governor: RateGovernor;
  private now: () => number;
  // conditional-GET cache: url → validators, so repeat fetches are free (a 304 costs nothing).
  private validators = new Map<string, { etag?: string; lastModified?: string }>();

  constructor(private deps: FetcherDeps) {
    this.governor = deps.governor ?? new RateGovernor();
    this.now = deps.now ?? Date.now;
  }

  async fetch(req: FetchRequest): Promise<FetchResult> {
    // 1) Policy — posture resolution + the line. A block here never touches the network.
    const policy: PolicyResult = evaluateJob(req.job);
    if (policy.decision === 'block') return { status: 'blocked', reason: policy.reasons.join('; ') };

    const { origin, host, path } = originOf(req.url);

    // 2) robots.txt (advisory records a warning; enforced already blocked disallowed above via policy
    //    if the source policy said so — this is the per-PATH check the source-level policy can't do).
    const robots = this.deps.robotsFor?.(origin);
    if (robots && !isAllowed(robots, req.userAgent, path)) {
      if (policy.posture === 'enforced' && !policy.overrideApplied) {
        return { status: 'robots-denied', reason: `robots.txt disallows ${path}` };
      }
      policy.warnings.push(`robots.txt disallows ${path} (advisory)`);
    }
    if (robots) {
      const cd = crawlDelayFor(robots, req.userAgent);
      if (cd) this.governor.setCrawlDelay(host, cd);
    }

    // 3) Identity — cheapest egress that meets the tier + reputation floor; sticky per session.
    const sel = selectIdentity(req.identityPool, { tier: req.job.tier, geo: req.geo, session: req.sessionBindings ? Object.keys(req.sessionBindings)[0] : undefined }, req.sessionBindings);
    if (!sel.identity) return { status: 'no-identity', reason: sel.reason };
    const identity = sel.identity;

    // 4) Rate governor — wait-or-defer. We defer (return retryAfter) rather than block the caller.
    const wait = this.governor.msUntilReady(host);
    if (wait > 0) return { status: 'rate-limited', retryAfterMs: wait, identity };
    this.governor.take(host);

    // 5) Conditional GET — send validators if we have them.
    const headers: Record<string, string> = { 'User-Agent': req.userAgent };
    const v = this.validators.get(req.url);
    if (v?.etag) headers['If-None-Match'] = v.etag;
    if (v?.lastModified) headers['If-Modified-Since'] = v.lastModified;

    let res: NetResponse;
    try {
      res = await this.deps.net(req.url, { headers, identity, tier: req.job.tier });
    } catch (e) {
      const updated = scoreOutcome(identity, 'error', this.now());
      return { status: 'error', identity: updated, reason: e instanceof Error ? e.message : 'network error' };
    }
    this.governor.onResult(host, res.status);

    // capture validators for next time
    const etag = res.headers['etag'] ?? res.headers['ETag'];
    const lastMod = res.headers['last-modified'] ?? res.headers['Last-Modified'];
    if (etag || lastMod) this.validators.set(req.url, { etag, lastModified: lastMod });

    const outcome = outcomeFor(res.status);
    const updated = scoreOutcome(identity, res.status === 304 ? 'success' : outcome, this.now());

    const provenance: ProvenanceRecord = {
      sourceId: req.job.sourceId,
      url: req.url,
      fetchedAt: new Date(this.now()).toISOString(),
      httpStatus: res.status,
      contentHash: res.status === 304 ? (v ? `unchanged` : '') : this.deps.hash(res.body),
      tier: req.job.tier,
      renderMode: 'http',
      egress: { class: identity.egressClass, geo: identity.geo },
      posture: policy.posture,
      policy: req.job.policy,
      override: req.job.override ?? null,
      accountClass: req.job.accountClass,
      warnings: policy.warnings,
    };

    if (res.status === 304) return { status: 'not-modified', httpStatus: 304, provenance, identity: updated };
    if (outcome === 'success') return { status: 'ok', httpStatus: res.status, body: res.body, provenance, identity: updated };
    return { status: 'error', httpStatus: res.status, provenance, identity: updated, reason: `http ${res.status}` };
  }
}
