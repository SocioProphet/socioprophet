# @socioprophet/acquire-worker

The **real** Node worker for the governed acquisition plane — not pretty logic in a repo, an actual
process that fetches live public data through the same governance the cockpit unit-tests, and lands
it **local or cloud** with an intact provenance chain.

It reuses the canonical plane core from `../client-vue/src/features/acquisition/*` (one source of
truth — no duplication) and adds only the parts that need a real runtime:

- **`nodeTransport.ts`** — live `fetch` (undici), optional per-request proxy egress (undici
  `ProxyAgent`), real `robots.txt` fetch, real SHA-256 provenance hashing (`node:crypto`).
- **`sinks.ts`** — where data lands: `LocalFileSink` (content-addressed body + provenance sidecar),
  `JsonlLedgerSink` (append-only audit trail), `HttpSink` (cloud bucket / **prophet-mesh** ingest),
  `MultiSink` (land local **and** cloud at once).
- **`service.ts`** — `AcquisitionService`, the API the estate calls. Runs policy → identity → robots
  → rate (honored for real, with bounded waits) → conditional-GET → provenance → sink.
- **`bearBrowserTransport.ts`** — the seam where **BearBrowser** becomes the agentic-ops browser: bind
  a `BearBrowserHost` render bridge and it drops in as the T2/T3 `DirectFetch`.
- **`cli.ts`** / **`server.ts`** — a CLI and an HTTP endpoint (`POST /acquire`).

## Run it

```bash
npm install
# live fetch, land locally + to a ledger:
npm run acquire -- https://en.wikipedia.org/wiki/Web_scraping --sink local:./landed,ledger:./acquire-ledger.jsonl
# land to the mesh / a cloud endpoint instead:
npm run acquire -- https://example.com --sink http:https://mesh.internal/ingest
# as a service:
npm run serve   # POST :8790/acquire { "url": "...", "accountClass": "commercial", "tier": "T1", "sink": "local:./landed" }
npm test        # network-free governance + landing tests
```

Verified live: a real fetch of the Wikipedia article returns HTTP 200 / ~239 KB, lands the body +
provenance to disk, appends the ledger, and the recomputed SHA-256 matches the provenance hash.

## Meta-surface integration seams

| Surface | Seam |
|---|---|
| **BearBrowser** | `BearBrowserHost.render` → `bearBrowserDirectFetch` (T2/T3 transport; agentic-ops browser by default) |
| **Turtle Terminal** | `acquire` CLI as a first-class shell verb |
| **GooseNotes** | `AcquisitionService.acquire` → note capture with provenance |
| **Noetica** | governed invocation via the account-tiered policy + provenance record |
| **prophet-mesh** | `HttpSink` → mesh ingest; policy/provenance map onto the mesh trust kernel |

## Note

Short-term the plane core lives in `client-vue` and is imported here. The clean long-term home is a
shared sovereign package (e.g. `prophet-core-ingest`) both the cockpit and this worker depend on;
tracked as a convergence follow-up.
