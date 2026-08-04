// Egress / proxy pool (acquisition I4) — resolves an EgressIdentity to a concrete proxy endpoint at
// fetch time, health-tracks endpoints, and fails over. VENDOR-AGNOSTIC by design: a proxy is just a
// URL + class + geo, so Bright Data, Oxylabs, SOAX, IPRoyal or a self-hosted pool are all "config,
// not code" (design doc §04). The pool never appears in call sites — the transport asks it for an
// endpoint that matches the identity's egress class + geo.
import type { EgressClass, EgressIdentity } from './reputation';

export interface ProxyEndpoint {
  id: string;
  url: string;              // full proxy URL incl. creds, e.g. http://user:pass@host:port
  class: EgressClass;
  geo: string;              // ISO country the egress exits from
}

export interface ProxyPool {
  // Resolve a concrete endpoint for an identity, or null if none is healthy/available.
  acquire(identity: Pick<EgressIdentity, 'egressClass' | 'geo'>): ProxyEndpoint | null;
  report(endpointId: string, ok: boolean): void;
}

interface Health { downUntil: number; fails: number }

// A static, health-tracked pool built from a configured endpoint list. Round-robins within a
// matching {class, geo} bucket, benches an endpoint after repeated failures with exponential cool-off.
export class StaticProxyPool implements ProxyPool {
  private health = new Map<string, Health>();
  private cursor = new Map<string, number>();
  constructor(
    private endpoints: ProxyEndpoint[],
    private now: () => number = Date.now,
    private benchAfter = 3,
    private maxCoolOffMs = 300_000,
  ) {}

  private healthy(e: ProxyEndpoint): boolean {
    const h = this.health.get(e.id);
    return !h || h.downUntil <= this.now();
  }

  acquire(identity: Pick<EgressIdentity, 'egressClass' | 'geo'>): ProxyEndpoint | null {
    // 'direct' means no proxy — the transport fetches straight out.
    if (identity.egressClass === 'direct') return null;
    const exactGeo = this.endpoints.filter((e) => e.class === identity.egressClass && e.geo === identity.geo && this.healthy(e));
    const anyGeo = this.endpoints.filter((e) => e.class === identity.egressClass && this.healthy(e));
    const bucket = exactGeo.length ? exactGeo : anyGeo;
    if (!bucket.length) return null;
    const key = `${identity.egressClass}:${identity.geo}`;
    const i = (this.cursor.get(key) ?? 0) % bucket.length;
    this.cursor.set(key, i + 1);
    return bucket[i];
  }

  report(endpointId: string, ok: boolean): void {
    const h = this.health.get(endpointId) ?? { downUntil: 0, fails: 0 };
    if (ok) { this.health.set(endpointId, { downUntil: 0, fails: 0 }); return; }
    h.fails += 1;
    if (h.fails >= this.benchAfter) {
      const cool = Math.min(this.maxCoolOffMs, 2 ** (h.fails - this.benchAfter) * 5_000);
      h.downUntil = this.now() + cool;
    }
    this.health.set(endpointId, h);
  }

  // Observability: how many endpoints are currently benched.
  benchedCount(): number {
    const t = this.now();
    let n = 0;
    for (const h of this.health.values()) if (h.downUntil > t) n += 1;
    return n;
  }
}
