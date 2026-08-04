// Network-free tests for the SynapseIQ enrichment stage + Sherlock crawl driver. We inject
// directFetch (same pattern as service.test.ts) so nothing hits the wire; robots resolves to
// allowed offline.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AcquisitionService } from './service.ts';
import { MemorySink } from './sinks.ts';
import { NullEnricher, type Enricher } from './enricher.ts';
import { crawl, LinkDiscoverer } from './crawl.ts';

function svcWith(pages: Record<string, { status: number; body: string }>) {
  return new AcquisitionService({
    directFetch: async (url: string) => {
      const p = pages[url.split('#')[0]];
      return p ? { status: p.status, headers: {}, body: p.body } : { status: 404, headers: {}, body: '' };
    },
    userAgent: 'test-bot',
  });
}

test('SynapseIQ: enricher runs between fetch and sink and the enrichment lands', async () => {
  const sink = new MemorySink();
  const enricher: Enricher = {
    name: 'test-iq',
    async enrich({ body }) { return { enricher: 'test-iq', enrichedAt: '2026-08-04T00:00:00Z', entities: [{ text: 'world', type: 'thing' }], language: body.includes('hello') ? 'en' : 'xx' }; },
  };
  const res = await svcWith({ 'https://ex.test/a': { status: 200, body: 'hello world' } }).acquire('https://ex.test/a', { sink, enricher });
  assert.equal(res.status, 'ok');
  assert.equal(res.enriched, true);
  assert.equal(sink.records[0].enrichment?.entities?.[0].text, 'world');
  assert.equal(sink.records[0].enrichment?.language, 'en');
});

test('SynapseIQ: an enrichment failure never loses the document — it still lands, unenriched', async () => {
  const sink = new MemorySink();
  const boom: Enricher = { name: 'boom', async enrich() { throw new Error('synapseiq down'); } };
  const res = await svcWith({ 'https://ex.test/a': { status: 200, body: 'data' } }).acquire('https://ex.test/a', { sink, enricher: boom });
  assert.equal(res.status, 'ok');
  assert.equal(res.enriched, false);
  assert.equal(sink.records.length, 1);
  assert.equal(sink.records[0].enrichment, undefined);
});

test('NullEnricher lands raw', async () => {
  assert.equal((await new NullEnricher().enrich({ url: '', body: '', contentHash: '' })).enricher, 'none');
});

test('Sherlock seam: LinkDiscoverer resolves in-page links against the base', () => {
  const links = new LinkDiscoverer().discover({ url: 'https://ex.test/dir/a', body: '<a href="b">x</a><a href="/c">y</a><a href="https://other.test/z">o</a>', depth: 0 });
  assert.ok(links.includes('https://ex.test/dir/b'));
  assert.ok(links.includes('https://ex.test/c'));
  assert.ok(links.includes('https://other.test/z'));
});

test('crawl: same-origin, deduped, lands every page, off-origin excluded', async () => {
  const sink = new MemorySink();
  const svc = svcWith({
    'https://ex.test/': { status: 200, body: '<a href="/a">a</a><a href="/b">b</a><a href="https://off.test/x">off</a>' },
    'https://ex.test/a': { status: 200, body: '<a href="/">home</a>' }, // links back → must dedupe
    'https://ex.test/b': { status: 200, body: 'leaf' },
  });
  const report = await crawl(['https://ex.test/'], svc, { sink, maxPages: 10, maxDepth: 2, sameOrigin: true });
  assert.equal(report.visited, 3);   // /, /a, /b (off-origin excluded, / not revisited)
  assert.equal(report.landed, 3);
  assert.equal(sink.records.length, 3);
  assert.equal(report.frontierExhausted, true);
});

test('crawl: maxPages is a hard budget', async () => {
  const svc = svcWith({
    'https://ex.test/': { status: 200, body: '<a href="/a">a</a><a href="/b">b</a><a href="/c">c</a>' },
    'https://ex.test/a': { status: 200, body: 'a' }, 'https://ex.test/b': { status: 200, body: 'b' }, 'https://ex.test/c': { status: 200, body: 'c' },
  });
  const report = await crawl(['https://ex.test/'], svc, { sink: new MemorySink(), maxPages: 2 });
  assert.equal(report.visited, 2);
  assert.equal(report.frontierExhausted, false);
});
