// Managed unblocker adapter (acquisition I5) — the T4 fallback for anti-bot walls on PUBLIC pages
// (design doc §07). BUY, don't build: a vendor (Zyte API, Bright Data Web Unlocker, ScrapingBee,
// Oxylabs) resolves the challenge and returns the page, carrying that compliance itself. One stable
// interface, so the vendor is config: swap impls without touching call sites. Only ever pointed at
// public URLs — an unblocker fetching a public page is not defeating an access control.
export interface UnblockerRequest {
  url: string;
  render?: boolean;    // execute JS
  geo?: string;        // egress country
  session?: string;    // sticky identity
}
export interface UnblockerResponse {
  html: string;
  status: number;
  egressGeo: string;
  cost: number;        // vendor spend for this request, for budget caps
}
export interface Unblocker {
  fetch(req: UnblockerRequest): Promise<UnblockerResponse>;
}

// Generic HTTP unblocker — adapts ANY vendor whose API is "POST our params, get back the page".
// buildRequest maps our request onto the vendor's HTTP call; parseResponse maps the vendor's reply
// back onto UnblockerResponse. Zyte/BrightData/ScrapingBee differ only in these two functions.
export interface HttpUnblockerConfig {
  endpoint: string;
  buildRequest: (req: UnblockerRequest) => { url: string; init: RequestInit };
  parseResponse: (raw: { status: number; headers: Record<string, string>; body: string }) => UnblockerResponse;
  fetchImpl?: typeof fetch;
  costCapPerReq?: number;   // refuse a request whose parsed cost would exceed this
}

export class HttpUnblocker implements Unblocker {
  constructor(private cfg: HttpUnblockerConfig) {}
  async fetch(req: UnblockerRequest): Promise<UnblockerResponse> {
    const f = this.cfg.fetchImpl ?? fetch;
    const { url, init } = this.cfg.buildRequest(req);
    const res = await f(url, init);
    const body = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    const parsed = this.cfg.parseResponse({ status: res.status, headers, body });
    if (this.cfg.costCapPerReq != null && parsed.cost > this.cfg.costCapPerReq) {
      throw new Error(`unblocker cost ${parsed.cost} exceeds cap ${this.cfg.costCapPerReq}`);
    }
    return parsed;
  }
}

// Default when no unblocker is configured — T4 is unavailable rather than silently degrading.
export class NullUnblocker implements Unblocker {
  async fetch(_req: UnblockerRequest): Promise<UnblockerResponse> {
    throw new Error('no unblocker configured — T4 targets are unavailable');
  }
}
