// Per-domain rate governor (design doc §04, "adaptive rate"). A token bucket per host honors
// crawl-delay, caps concurrency implicitly via spacing, and backs off exponentially when a domain
// starts returning 429/403 — then circuit-breaks a domain that keeps challenging. Deterministic:
// the clock is injectable so the whole thing is unit-testable without real time.

export interface DomainState {
  tokens: number;
  lastRefill: number;    // epoch ms
  nextAllowedAt: number; // epoch ms — earliest next request (crawl-delay + backoff)
  backoffMs: number;     // current backoff, doubles on throttle, resets on success
  consecutiveThrottles: number;
  broken: boolean;       // circuit-broken until backoff elapses
}

export interface GovernorConfig {
  ratePerSec: number;     // steady-state requests/sec/domain
  burst: number;          // bucket capacity
  minSpacingMs: number;   // hard floor between requests (crawl-delay maps here)
  maxBackoffMs: number;   // cap
  breakAfter: number;     // consecutive throttles before circuit-breaks
}

export const DEFAULT_GOVERNOR: GovernorConfig = {
  ratePerSec: 1, burst: 4, minSpacingMs: 250, maxBackoffMs: 60_000, breakAfter: 4,
};

export class RateGovernor {
  private state = new Map<string, DomainState>();
  constructor(private cfg: GovernorConfig = DEFAULT_GOVERNOR, private now: () => number = Date.now) {}

  private get(domain: string): DomainState {
    let s = this.state.get(domain);
    if (!s) { s = { tokens: this.cfg.burst, lastRefill: this.now(), nextAllowedAt: 0, backoffMs: 0, consecutiveThrottles: 0, broken: false }; this.state.set(domain, s); }
    return s;
  }

  // Set a per-domain crawl-delay (seconds) discovered from robots.txt — raises the spacing floor.
  setCrawlDelay(domain: string, seconds: number): void {
    const s = this.get(domain);
    s.nextAllowedAt = Math.max(s.nextAllowedAt, 0);
    (s as DomainState & { crawlDelayMs?: number }).crawlDelayMs = seconds * 1000;
  }

  private spacing(domain: string): number {
    const extra = (this.get(domain) as DomainState & { crawlDelayMs?: number }).crawlDelayMs ?? 0;
    return Math.max(this.cfg.minSpacingMs, extra);
  }

  // How long to wait (ms) before a request to this domain is allowed. 0 = go now.
  msUntilReady(domain: string): number {
    const s = this.get(domain);
    const t = this.now();
    // refill tokens
    const elapsed = t - s.lastRefill;
    if (elapsed > 0) {
      s.tokens = Math.min(this.cfg.burst, s.tokens + (elapsed / 1000) * this.cfg.ratePerSec);
      s.lastRefill = t;
    }
    const gate = Math.max(s.nextAllowedAt - t, 0);
    if (s.broken) return gate > 0 ? gate : 0;
    if (s.tokens < 1) return Math.max(gate, (1 - s.tokens) / this.cfg.ratePerSec * 1000);
    return gate;
  }

  // Consume a slot (call right before issuing the request). Assumes msUntilReady()===0.
  take(domain: string): void {
    const s = this.get(domain);
    s.tokens = Math.max(0, s.tokens - 1);
    s.nextAllowedAt = this.now() + this.spacing(domain);
  }

  // Feed back the outcome. 429/403 (or any throttle) doubles backoff and may break the circuit;
  // success resets backoff and closes the circuit.
  onResult(domain: string, status: number): void {
    const s = this.get(domain);
    const throttled = status === 429 || status === 403 || status === 503;
    if (throttled) {
      s.consecutiveThrottles += 1;
      s.backoffMs = Math.min(this.cfg.maxBackoffMs, s.backoffMs ? s.backoffMs * 2 : 1000);
      s.nextAllowedAt = this.now() + s.backoffMs;
      if (s.consecutiveThrottles >= this.cfg.breakAfter) s.broken = true;
    } else if (status >= 200 && status < 400) {
      s.consecutiveThrottles = 0;
      s.backoffMs = 0;
      s.broken = false;
    }
  }

  isBroken(domain: string): boolean { return this.get(domain).broken; }
}
