#!/usr/bin/env -S npx tsx
// acquire — CLI for the governed acquisition worker. Fetches (or crawls) live URLs through the full
// plane and lands them, optionally enriched by SynapseIQ. Usage:
//   acquire <url> [--account ..] [--tier T0..T4] [--sink local:<dir>|ledger:<file>|http:<url>]
//                 [--geo US] [--enrich synapseiq:<endpoint>] [--dry]
//   acquire crawl <seed...> [--max-pages N] [--max-depth N] [--same-origin] [--enrich ..] [--sink ..]
import { AcquisitionService } from './service';
import { crawl } from './crawl';
import { SynapseIQEnricher, NullEnricher, type Enricher } from './enricher';
import { LocalFileSink, JsonlLedgerSink, HttpSink, MemorySink, MultiSink, type Sink } from './sinks';
import type { AccountClass, AcquisitionTier } from '../../client-vue/src/features/acquisition/policy';

function arg(flag: string, def?: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
function flag(name: string): boolean { return process.argv.includes(name); }

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
// --enrich synapseiq:<endpoint>  → SynapseIQ language enrichment (entities/extraction/embeddings).
function makeEnricher(spec: string | undefined): Enricher {
  if (!spec) return new NullEnricher();
  const [kind, ...rest] = spec.split(':');
  if (kind === 'synapseiq') return new SynapseIQEnricher({ endpoint: rest.join(':'), apiKey: process.env.SYNAPSEIQ_KEY });
  throw new Error(`unknown enricher '${spec}' (use synapseiq:<endpoint>)`);
}

async function runCrawl() {
  const seeds = process.argv.slice(3).filter((a) => !a.startsWith('--') && !isFlagValue(a));
  if (!seeds.length) { console.error('usage: acquire crawl <seed-url...> [--max-pages N] [--max-depth N]'); process.exit(2); }
  const svc = new AcquisitionService();
  const report = await crawl(seeds, svc, {
    accountClass: (arg('--account', 'sovereign') as AccountClass),
    tier: (arg('--tier', 'T1') as AcquisitionTier),
    maxPages: Number(arg('--max-pages', '25')),
    maxDepth: Number(arg('--max-depth', '2')),
    sameOrigin: !flag('--any-origin'),
    sink: makeSink(flag('--dry') ? 'dry' : arg('--sink', 'local:./landed')),
    enricher: makeEnricher(arg('--enrich')),
    onPage: (u, s) => console.error(`  [${s}] ${u}`),
  });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.errored > 0 && report.landed === 0 ? 1 : 0);
}

// crude: values that follow a known value-taking flag shouldn't be treated as seeds
function isFlagValue(a: string): boolean {
  const i = process.argv.indexOf(a);
  return i > 0 && ['--max-pages', '--max-depth', '--account', '--tier', '--sink', '--enrich', '--geo'].includes(process.argv[i - 1]);
}

async function runOne() {
  const url = process.argv[2];
  if (!url || url.startsWith('--')) { console.error('usage: acquire <url> [--account ..] [--tier ..] [--sink ..] [--enrich synapseiq:<endpoint>]'); process.exit(2); }
  const svc = new AcquisitionService();
  const res = await svc.acquire(url, {
    accountClass: (arg('--account', 'sovereign') as AccountClass),
    tier: (arg('--tier', 'T1') as AcquisitionTier),
    geo: arg('--geo', 'US'),
    sink: makeSink(flag('--dry') ? 'dry' : arg('--sink', 'local:./landed')),
    enricher: makeEnricher(arg('--enrich')),
  });
  const p = res.provenance;
  console.log(JSON.stringify({
    status: res.status, httpStatus: res.httpStatus, bytes: res.body?.length ?? 0,
    landed: res.landed, sink: res.sink, enriched: res.enriched, reason: res.reason,
    provenance: p && { url: p.url, fetchedAt: p.fetchedAt, httpStatus: p.httpStatus, contentHash: p.contentHash, tier: p.tier, posture: p.posture, egress: p.egress, warnings: p.warnings },
  }, null, 2));
  process.exit(res.status === 'ok' || res.status === 'not-modified' ? 0 : 1);
}

const main = process.argv[2] === 'crawl' ? runCrawl : runOne;
main().catch((e) => { console.error('acquire failed:', e); process.exit(1); });
