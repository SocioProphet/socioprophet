// Network-free tests for the worker — inject a fake directFetch so CI proves the governed pipeline
// + sink landing without hitting the wire. (A real live fetch is exercised by the CLI; see README.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AcquisitionService } from './service.ts';
import { MemorySink } from './sinks.ts';

function svcWith(bodyByUrl: (url: string) => { status: number; body: string }) {
  return new AcquisitionService({
    directFetch: async (url) => { const r = bodyByUrl(url); return { status: r.status, headers: {}, body: r.body }; },
    userAgent: 'test-bot',
  });
}

test('acquires, records provenance, and lands in the sink', async () => {
  const sink = new MemorySink();
  const svc = svcWith(() => ({ status: 200, body: 'hello world' }));
  const res = await svc.acquire('https://example.com/a', { sink });
  assert.equal(res.status, 'ok');
  assert.equal(res.landed, true);
  assert.equal(sink.records.length, 1);
  assert.equal(sink.records[0].body, 'hello world');
  assert.match(sink.records[0].provenance.contentHash, /^sha256:[0-9a-f]{64}$/);
  assert.equal(sink.records[0].provenance.httpStatus, 200);
});

test('the line holds: an auth-gated policy is blocked and nothing lands', async () => {
  const sink = new MemorySink();
  const svc = svcWith(() => ({ status: 200, body: 'secret' }));
  const res = await svc.acquire('https://example.com/private', {
    sink,
    policy: { robots: 'allowed', tos: 'auth-gated', pii: false, legalBasis: 'public-data' },
  });
  assert.equal(res.status, 'blocked');
  assert.equal(res.landed, false);
  assert.equal(sink.records.length, 0);
});

test('commercial account enforces tier gating (T3 needs an override)', async () => {
  const svc = svcWith(() => ({ status: 200, body: 'x' }));
  const res = await svc.acquire('https://example.com/a', { accountClass: 'commercial', tier: 'T3' });
  assert.equal(res.status, 'blocked');
});
