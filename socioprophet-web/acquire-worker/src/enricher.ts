// Enrichment seam — where SynapseIQ plugs in. After a page is fetched (and before it lands), the
// body runs through an Enricher for language intelligence: entities, structured extractions,
// embeddings, language ID. The enrichment travels WITH the provenance record into the sink, so what
// lands is not raw HTML but a governed, enriched, attributed document. SynapseIQ is one Enricher
// behind a stable interface — swap it, stack it, or run NullEnricher to land raw.
export interface EnrichmentResult {
  enricher: string;
  enrichedAt: string;
  language?: string;
  entities?: { text: string; type: string; confidence?: number }[];
  extractions?: Record<string, unknown>;
  embedding?: number[];
  cost?: number;
}
export interface EnrichInput { url: string; body: string; contentHash: string }
export interface Enricher { readonly name: string; enrich(input: EnrichInput): Promise<EnrichmentResult> }

// SynapseIQ — our language-intelligence engine. Generic HTTP adapter: POST the document, get back
// entities/extractions/embeddings. The request/response mapping is config so the SynapseIQ API can
// evolve without touching callers.
export interface SynapseIQConfig {
  endpoint: string;
  apiKey?: string;
  tasks?: ('entities' | 'extraction' | 'embedding' | 'language')[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}
export class SynapseIQEnricher implements Enricher {
  readonly name = 'synapseiq';
  constructor(private cfg: SynapseIQConfig) {}
  async enrich(input: EnrichInput): Promise<EnrichmentResult> {
    const f = this.cfg.fetchImpl ?? fetch;
    const res = await f(this.cfg.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(this.cfg.apiKey ? { authorization: `Bearer ${this.cfg.apiKey}` } : {}) },
      body: JSON.stringify({ url: input.url, text: input.body, contentHash: input.contentHash, tasks: this.cfg.tasks ?? ['entities', 'extraction', 'embedding', 'language'] }),
      signal: AbortSignal.timeout(this.cfg.timeoutMs ?? 30_000),
    });
    if (!res.ok) throw new Error(`SynapseIQ ${this.cfg.endpoint} responded ${res.status}`);
    const out = await res.json() as Partial<EnrichmentResult>;
    return {
      enricher: this.name,
      enrichedAt: new Date().toISOString(),
      language: out.language,
      entities: out.entities,
      extractions: out.extractions,
      embedding: out.embedding,
      cost: out.cost,
    };
  }
}

// Default: land raw (no enrichment configured).
export class NullEnricher implements Enricher {
  readonly name = 'none';
  async enrich(): Promise<EnrichmentResult> { return { enricher: 'none', enrichedAt: new Date().toISOString() }; }
}
