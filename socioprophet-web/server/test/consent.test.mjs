// Consent-ledger test: grant → check → revoke, the fail-closed default, and the self-sovereign
// invariant (subject == grantee). Also validates every minted grant against the VENDORED
// canonical mcp-a2a-zero-trust Grant schema, so a consent grant stays verifiable by the same
// verifier as any other capability grant in the estate.
// Self-contained — transpiles TS on the fly (same pattern as device-enrollment.test.mjs).
// Run: node test/consent.test.mjs
import { createRequire } from "module";
import path from "path";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const fs = require("fs");
const Module = require("module");

const _realResolve = Module._resolveFilename.bind(Module);
const _virtual = new Map();

Module._resolveFilename = function (request, parentModule, ...rest) {
  if (parentModule && typeof request === "string" && request.startsWith(".")) {
    const abs = path.resolve(path.dirname(parentModule.filename), request + ".js");
    if (_virtual.has(abs)) return abs;
  }
  return _realResolve(request, parentModule, ...rest);
};

const load = (rel) => {
  const abs = path.resolve(rel.replace(/\.ts$/, ".js"));
  if (_virtual.has(abs)) return _virtual.get(abs);
  const src = fs.readFileSync(rel, "utf8");
  const js = ts.transpileModule(src, { compilerOptions: { module: "commonjs", target: "es2020" } }).outputText;
  const m = new Module(abs);
  m.filename = abs;
  m.paths = Module._nodeModulePaths(path.dirname(abs));
  require.cache[abs] = m;
  _virtual.set(abs, null);
  m._compile(js, abs);
  _virtual.set(abs, m.exports);
  return m.exports;
};

const L = load("src/services/consentLedger.ts");

// The canonical Grant schema is draft 2020-12 — use the matching Ajv build, as
// src/contracts/index.ts does.
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
// Grant $refs quorum_proof + runtime_evidence_refs. QuorumProof is already vendored here for
// the enrollment gate — register that same copy rather than a second one.
ajv.addSchema(JSON.parse(fs.readFileSync("src/contracts/schemas/QuorumProof.json", "utf8")));
ajv.addSchema(JSON.parse(fs.readFileSync("src/contracts/schemas/RuntimeEvidenceRefs.json", "utf8")));
const GRANT_SCHEMA = JSON.parse(fs.readFileSync("src/contracts/schemas/Grant.json", "utf8"));
const validateGrant = ajv.compile(GRANT_SCHEMA);

let fail = 0;
const ck = (n, ok) => { console.log((ok ? "ok  " : "FAIL ") + n); if (!ok) fail++; };

const SELF = "urn:srcos:principal:self";
const OTHER = "urn:srcos:principal:someone-else";
const SURFACE = "telemetry:model:tokens_used";
const CAM = "camera";

// ── default-deny ──────────────────────────────────────────────────────────────
{
  const s = L.createStore();
  ck("fresh store: check() is false (default-deny)", L.check(s, SURFACE) === false);
  ck("fresh store: unknown id is false, not 'unknown → allow'", L.check(s, "telemetry:not:a:thing") === false);

  const snap = L.snapshot(s, SELF);
  ck("snapshot: self-sovereign, subject == collector", snap.subjectPrincipal === snap.collectorPrincipal);
  ck("snapshot: every surface denied by default", snap.surfaces.every((x) => x.consent.state === "denied"));
  ck("snapshot: every surface off by default", snap.surfaces.every((x) => x.effectiveMode === "off"));
  ck("snapshot: every capability denied by default", snap.capabilities.every((x) => x.consent.state === "denied"));
  ck("snapshot: every capability disabled by default", snap.capabilities.every((x) => x.defaultState === "disabled"));
  ck("snapshot: every row carries a real explanation", snap.surfaces.concat(snap.capabilities).every((x) => (x.explanation || "").length > 11));
}

// ── fail-closed on malformed input ────────────────────────────────────────────
{
  ck("check(null store) is false", L.check(null, SURFACE) === false);
  ck("check(undefined store) is false", L.check(undefined, SURFACE) === false);
  ck("check(garbage store) is false", L.check({ nope: 1 }, SURFACE) === false);
  ck("check(store, undefined id) is false", L.check(L.createStore(), undefined) === false);
  ck("grant with no subject is refused", L.grant(L.createStore(), "", SURFACE).ok === false);
  ck("grant of an unknown id is refused", L.grant(L.createStore(), SELF, "telemetry:made:up").ok === false);
}

// ── grant → check → revoke ────────────────────────────────────────────────────
{
  const s = L.createStore();
  const g = L.grant(s, SELF, SURFACE);
  ck("grant succeeds", g.ok === true && g.state === "granted");
  ck("grant returns a grantRef", typeof g.grantRef === "string" && g.grantRef.startsWith("grant:"));
  ck("check() stands after grant", L.check(s, SURFACE) === true);
  ck("granting one surface does NOT grant another", L.check(s, "telemetry:model:latency") === false);

  const snap = L.snapshot(s, SELF);
  const row = snap.surfaces.find((x) => x.surfaceId === SURFACE);
  ck("snapshot reflects the grant", row.consent.state === "granted");
  ck("snapshot carries the grantRef", row.consent.grantRef === g.grantRef);
  ck("snapshot: granted surface is no longer off", row.effectiveMode !== "off");
  ck("snapshot: other surfaces still denied", snap.surfaces.filter((x) => x.surfaceId !== SURFACE).every((x) => x.consent.state === "denied"));

  const r = L.revoke(s, SELF, SURFACE);
  ck("revoke succeeds", r.ok === true && r.state === "revoked");
  ck("check() is false after revoke", L.check(s, SURFACE) === false);
  ck("snapshot shows revoked", L.snapshot(s, SELF).surfaces.find((x) => x.surfaceId === SURFACE).consent.state === "revoked");

  // Re-granting mints a NEW grant — a revocation cannot be undone by replaying the old token.
  const g2 = L.grant(s, SELF, SURFACE);
  ck("re-grant mints a NEW grant_id", g2.grantRef !== g.grantRef);
  ck("check() stands again after re-grant", L.check(s, SURFACE) === true);
}

// ── revoke is idempotent ──────────────────────────────────────────────────────
{
  const s = L.createStore();
  const r = L.revoke(s, SELF, SURFACE);
  ck("revoking something never granted is a no-op, not an error", r.ok === true && r.state === "revoked");
  ck("still denied afterwards", L.check(s, SURFACE) === false);
}

// ── expiry ────────────────────────────────────────────────────────────────────
{
  const t0 = Date.parse("2026-08-04T12:00:00Z");
  const s = L.createStore();
  L.grant(s, SELF, CAM, { now: t0 });
  ck("per-use grant stands immediately", L.check(s, CAM, { now: t0 + 1000 }) === true);
  ck("per-use grant is expired 6 minutes later", L.check(s, CAM, { now: t0 + 6 * 60 * 1000 }) === false);
  ck("expired grant reports denied in the snapshot, not granted",
    L.snapshot(s, SELF, { now: t0 + 6 * 60 * 1000 }).capabilities.find((x) => x.capabilityId === CAM).consent.state === "denied");
  ck("a grant is not valid BEFORE it was issued (clock skew)", L.check(s, CAM, { now: t0 - 60 * 1000 }) === false);
}

// ── the self-sovereign invariant: subject == grantee ──────────────────────────
{
  const s = L.createStore();
  L.grant(s, SELF, SURFACE);
  ck("a different subject cannot grant into this store", L.grant(s, OTHER, "telemetry:model:latency").ok === false);
  ck("a different subject cannot revoke from this store", L.revoke(s, OTHER, SURFACE).ok === false);
  ck("the original subject's consent is untouched by the attempt", L.check(s, SURFACE) === true);

  // The teeth: forge a grant for another principal straight into the store, bypassing grant().
  // check() must still refuse it — the invariant is re-asserted at check time, not only at mint.
  const forged = L.createStore();
  forged.subject = SELF;
  const stolen = L.mintGrant(OTHER, L.registry().surfaces[0]);
  forged.grants[SURFACE] = {
    id: SURFACE, state: "granted", grantedAt: stolen.issued_at, revokedAt: null,
    grantRef: stolen.grant_id, grant: stolen,
  };
  ck("a grant bound to ANOTHER principal is refused by check()", L.check(forged, SURFACE) === false);
  ck("the forged grant also reports denied in the snapshot",
    L.snapshot(forged, SELF).surfaces.find((x) => x.surfaceId === SURFACE).consent.state === "denied");
}

// ── a grant for one capability cannot be replayed onto another ────────────────
{
  const s = L.createStore();
  s.subject = SELF;
  const g = L.mintGrant(SELF, L.registry().capabilities.find((c) => c.capabilityId === CAM));
  s.grants["microphone"] = { id: "microphone", state: "granted", grantedAt: g.issued_at, revokedAt: null, grantRef: g.grant_id, grant: g };
  ck("a camera grant filed under microphone is refused", L.check(s, "microphone") === false);
}

// ── canonical Grant conformance ───────────────────────────────────────────────
{
  const all = [...L.registry().surfaces, ...L.registry().capabilities];
  let bad = null;
  for (const item of all) {
    const g = L.mintGrant(SELF, item);
    if (!validateGrant(g)) { bad = { id: item.surfaceId ?? item.capabilityId, errors: validateGrant.errors }; break; }
  }
  ck("every minted grant validates against the canonical Grant schema", bad === null);
  if (bad) console.log("   ", bad.id, JSON.stringify(bad.errors));

  const g = L.mintGrant(SELF, L.registry().surfaces[0]);
  ck("telemetry grant declares effect=egress (it LEAVES the device)", g.capability.effect === "egress");
  ck("grant carries the self-sovereign constraint", g.constraints.self_sovereign === true);
  ck("grant binding names the subject", g.binding.spiffe_id.includes(encodeURIComponent(SELF)));

  const cam = L.mintGrant(SELF, L.registry().capabilities.find((c) => c.capabilityId === CAM));
  ck("per-use capability grant is marked one_shot", cam.constraints.one_shot === true);
  ck("per-use lifetime is short (<= 5 min)", Date.parse(cam.expires_at) - Date.parse(cam.issued_at) <= L.LIFETIME_MS["per-use"]);
}

// ── registry parity with the board's fixture ──────────────────────────────────
// The board renders this list live or on the fixture; if the two drift, a person sees a
// different set of choices depending on whether the backend is reachable.
{
  const fixture = fs.readFileSync("../client-vue/src/services/consentApi.ts", "utf8");
  const r = L.registry();
  const missing = r.surfaces.map((s) => s.surfaceId).filter((id) => !fixture.includes(`'${id}'`));
  ck("every ledger surface exists in the client fixture", missing.length === 0);
  if (missing.length) console.log("    missing:", missing);
  const capMissing = r.capabilities.map((c) => c.capabilityId).filter((id) => !fixture.includes(`'${id}'`));
  ck("every ledger capability exists in the client fixture", capMissing.length === 0);
  if (capMissing.length) console.log("    missing:", capMissing);
}

console.log(fail ? `\n${fail} FAILED` : "\nall consent-ledger checks passed");
process.exit(fail ? 1 : 0);
