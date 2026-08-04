#!/usr/bin/env -S npx tsx
// acquire — CLI for the governed acquisition worker. Fetches a live URL through the full plane and
// lands it. Usage:
//   acquire <url> [--account sovereign|research|own-estate|commercial] [--tier T0..T4]
//                 [--sink local:<dir> | ledger:<file> | http:<url>] [--geo US] [--dry]
import { AcquisitionService } from './service';
import { LocalFileSink, JsonlLedgerSink, HttpSink, MemorySink, MultiSink, type Sink } from './sinks';
import type { AccountClass, AcquisitionTier } from '../../client-vue/src/features/acquisition/policy';

function arg(flag: string, def?: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
function makeSink(spec: string | undefined): Sink {
  if (!spec || spec === 'dry') return new MemorySink();
  return new MultiSink(spec.split(',').map((s) => {
    const [kind, ...rest] = s.split(':');
    const target = rest.join(':');
    if (kind === 'local') return new LocalFileSink(target || './landed');
    if (kind === 'ledger') return new JsonlLedgerSink(target || './acquire-ledger.jsonl');
    if (kind === 'http') return new HttpSink(target);
    throw new Error(`unknown sink '${s}' (use local:<dir> | ledger:<file> | http:<url>)`);
  }));
}

async function main() {
  const url = process.argv[2];
  if (!url || url.startsWith('--')) { console.error('usage: acquire <url> [--account ..] [--tier ..] [--sink local:<dir>]'); process.exit(2); }
  const sink = makeSink(arg('--dry') !== undefined ? 'dry' : arg('--sink', 'local:./landed'));
  const svc = new AcquisitionService();
  const res = await svc.acquire(url, {
    accountClass: (arg('--account', 'sovereign') as AccountClass),
    tier: (arg('--tier', 'T1') as AcquisitionTier),
    geo: arg('--geo', 'US'),
    sink,
  });

  const p = res.provenance;
  console.log(JSON.stringify({
    status: res.status,
    httpStatus: res.httpStatus,
    bytes: res.body?.length ?? 0,
    landed: res.landed,
    sink: res.sink,
    reason: res.reason,
    provenance: p && { url: p.url, fetchedAt: p.fetchedAt, httpStatus: p.httpStatus, contentHash: p.contentHash, tier: p.tier, posture: p.posture, egress: p.egress, warnings: p.warnings },
  }, null, 2));
  process.exit(res.status === 'ok' || res.status === 'not-modified' ? 0 : 1);
}
main().catch((e) => { console.error('acquire failed:', e); process.exit(1); });
