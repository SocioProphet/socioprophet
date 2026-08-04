// Sinks — where acquired data lands. First-class local OR cloud (the estate requirement): a job can
// write to the local filesystem, a provenance ledger, a cloud bucket / prophet-mesh ingest endpoint,
// or several at once (MultiSink fan-out). Everything lands WITH its provenance record, so the chain
// of custody survives wherever the bytes go.
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ProvenanceRecord } from '../../client-vue/src/features/acquisition/policy';

export interface LandedRecord { provenance: ProvenanceRecord; body: string | null }
export interface Sink { readonly name: string; write(rec: LandedRecord): Promise<void> }

// Local filesystem: content-addressed body + sidecar provenance JSON under a directory.
export class LocalFileSink implements Sink {
  readonly name: string;
  private ready?: Promise<void>;
  constructor(private dir: string) { this.name = `local:${dir}`; }
  private ensure() { return (this.ready ??= mkdir(this.dir, { recursive: true }).then(() => undefined)); }
  async write(rec: LandedRecord): Promise<void> {
    await this.ensure();
    const key = rec.provenance.contentHash.replace(/^sha256:/, '').slice(0, 16) || String(Date.now());
    await writeFile(join(this.dir, `${key}.json`), JSON.stringify(rec.provenance, null, 2));
    if (rec.body != null) await writeFile(join(this.dir, `${key}.body`), rec.body);
  }
}

// Append-only provenance ledger (one JSON object per line) — the audit trail, cheap and greppable.
export class JsonlLedgerSink implements Sink {
  readonly name: string;
  constructor(private file: string) { this.name = `ledger:${file}`; }
  async write(rec: LandedRecord): Promise<void> {
    await appendFile(this.file, JSON.stringify(rec.provenance) + '\n');
  }
}

// Cloud / prophet-mesh: POST {provenance, body} to a configured ingest endpoint. Works against a
// GCS signed URL, an S3 presigned PUT (override method), or the mesh's ingest API. Real HTTP.
export class HttpSink implements Sink {
  readonly name: string;
  constructor(private endpoint: string, private opts: { method?: string; headers?: Record<string, string> } = {}) {
    this.name = `http:${endpoint}`;
  }
  async write(rec: LandedRecord): Promise<void> {
    const res = await fetch(this.endpoint, {
      method: this.opts.method ?? 'POST',
      headers: { 'content-type': 'application/json', ...this.opts.headers },
      body: JSON.stringify(rec),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`sink ${this.endpoint} responded ${res.status}`);
  }
}

// Fan-out: land local AND cloud (or any combination) in one write.
export class MultiSink implements Sink {
  readonly name: string;
  constructor(private sinks: Sink[]) { this.name = `multi(${sinks.map((s) => s.name).join(',')})`; }
  async write(rec: LandedRecord): Promise<void> {
    await Promise.all(this.sinks.map((s) => s.write(rec)));
  }
}

// In-memory — tests + dry runs.
export class MemorySink implements Sink {
  readonly name = 'memory';
  readonly records: LandedRecord[] = [];
  async write(rec: LandedRecord): Promise<void> { this.records.push(rec); }
}
