// HTTP entry point — the same AcquisitionService behind a tiny endpoint, so prophet-mesh, Noetica,
// Turtle Terminal or GooseNotes can drive governed acquisition over the network instead of importing
// the library. POST /acquire { url, accountClass?, tier?, geo?, sink? }.
import { createServer } from 'node:http';
import { AcquisitionService } from './service';
import { LocalFileSink, JsonlLedgerSink, HttpSink, MemorySink, MultiSink, type Sink } from './sinks';

const svc = new AcquisitionService();

function makeSink(spec: string | undefined): Sink {
  if (!spec) return new MemorySink();
  return new MultiSink(spec.split(',').map((s) => {
    const [kind, ...rest] = s.split(':');
    const t = rest.join(':');
    if (kind === 'local') return new LocalFileSink(t || './landed');
    if (kind === 'ledger') return new JsonlLedgerSink(t || './acquire-ledger.jsonl');
    if (kind === 'http') return new HttpSink(t);
    throw new Error(`unknown sink '${s}'`);
  }));
}

const port = Number(process.env.PORT ?? 8790);
createServer(async (req, res) => {
  if (req.method !== 'POST' || !req.url?.startsWith('/acquire')) {
    res.writeHead(404).end('POST /acquire');
    return;
  }
  try {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    if (!body.url) { res.writeHead(400).end(JSON.stringify({ error: 'url required' })); return; }
    const result = await svc.acquire(body.url, {
      accountClass: body.accountClass, tier: body.tier, geo: body.geo, sink: makeSink(body.sink),
    });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: result.status, httpStatus: result.httpStatus, landed: result.landed, sink: result.sink, provenance: result.provenance, reason: result.reason }));
  } catch (e) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'error' }));
  }
}).listen(port, () => console.log(`acquire-worker listening on :${port} (POST /acquire)`));
