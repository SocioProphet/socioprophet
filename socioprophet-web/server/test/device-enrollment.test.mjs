// Device-enrollment test: a device joins the fleet only if boot attests AND a validator quorum
// co-signs. Self-contained — transpiles TS on the fly (same pattern as boot-attestation.test.mjs).
// Run: node test/device-enrollment.test.mjs
import { createRequire } from "module";
import path from "path";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const fs = require("fs");
const Module = require("module");

// Transpile + load a TS file into a new Module instance, registering it in
// require.cache so that cross-service require('./bootAttestation') etc. resolve.
// We intercept Module._resolveFilename so Node doesn't hit the filesystem for
// the fake .js paths (the real .ts sources are never compiled to disk).
const _realResolve = Module._resolveFilename.bind(Module);
const _virtual = new Map();   // absPath → exports — virtual .js stubs

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
  const js  = ts.transpileModule(src, { compilerOptions: { module: "commonjs", target: "es2020" } }).outputText;
  const m   = new Module(abs);
  m.filename = abs;
  m.paths    = Module._nodeModulePaths(path.dirname(abs));
  // register BEFORE _compile so circular (or self-referencing) requires don't loop
  require.cache[abs] = m;
  _virtual.set(abs, null);   // sentinel so _resolveFilename knows this is virtual
  m._compile(js, abs);
  _virtual.set(abs, m.exports);
  return m.exports;
};

// Load order matters: dependencies first.
const c                                    = load("src/contracts/index.ts");
const { attestBoot }                       = load("src/services/bootAttestation.ts");
const { verifyQuorum, parseRule }          = load("src/services/quorum.ts");
const { enrollDevice, enrollmentPayloadHash } = load("src/services/deviceEnrollment.ts");

let fail = 0;
const ck = (n, ok) => { console.log((ok ? "ok  " : "FAIL ") + n); if (!ok) fail++; };

// ── shared fixtures ────────────────────────────────────────────────────────────
const VERITY  = "sha256:" + "a".repeat(64);
const WRONG   = "sha256:" + "b".repeat(64);

const stage   = (name, hash, verdict = "verified") =>
  ({ stageName: name, artifactRef: `urn:srcos:artifact:${name}`, contentHash: hash, verdict });

const STAGES  = [
  stage("firmware",   "sha256:" + "1".repeat(64)),
  stage("bootloader", "sha256:" + "2".repeat(64)),
  stage("kernel",     "sha256:" + "3".repeat(64)),
  stage("rootfs",     VERITY),
];

const POLICY  = {
  expectedStages:   STAGES.map((s) => ({ stageName: s.stageName, contentHash: s.contentHash })),
  rootfsStage:      "rootfs",
  rootfsVerityRoot: VERITY,
};

const DEV = { id: "dev-001", deviceName: "edge-node-1", platform: "linux-x86_64", archClass: "x86_64" };

function bootProof(stages = STAGES, outcome = "success") {
  const r = c.bootProofRecord(DEV.id, "urn:srcos:boot-plan:edge", outcome);
  return { ...r, stageProofs: stages };
}

function quorumProof(payloadHash, validCount = 2) {
  const validators = ["spiffe://estate/node/v1", "spiffe://estate/node/v2", "spiffe://estate/node/v3"];
  const sigs = validators.slice(0, validCount).map((id) => ({
    kind:      "human",
    spiffe_id: id,
    sig:       "0".repeat(32),
  }));
  return {
    kind:                "QuorumProof",
    rule:                "2of3-human",
    validators,
    signed_payload_hash: payloadHash,
    signatures:          sigs,
  };
}

// ── 1. happy path ─────────────────────────────────────────────────────────────
// attestBoot includes attested_at in the sealed hash — freeze time so the hash
// computed here (for building the quorum proof) matches the hash enrollDevice sees.
{
  const FIXED = "2026-08-04T00:00:00.000Z";
  const origToISO = Date.prototype.toISOString;
  Date.prototype.toISOString = () => FIXED;
  try {
    const bp  = bootProof();
    const attest = attestBoot(bp, POLICY);
    const ph  = enrollmentPayloadHash(DEV, attest.sealed.hash);
    const qp  = quorumProof(ph, 2);
    const r   = enrollDevice({ deviceIdentity: DEV, bootProof: bp, attestationPolicies: { x86_64: POLICY }, quorumProof: qp });
    ck("1. enrolled on good boot + good quorum", r.enrolled === true);
    ck("1. receipt has enrolled_at",             typeof r.receipt.enrolled_at === "string");
    ck("1. receipt hash present",                typeof r.receipt.hash === "string" && r.receipt.hash.startsWith("sha256:"));
    ck("1. attestation_verity_bound true",       r.receipt.attestation_verity_bound === true);
  } finally {
    Date.prototype.toISOString = origToISO;
  }
}

// ── 2. bad boot (tampered rootfs hash) ────────────────────────────────────────
{
  const tampered = STAGES.map((s) => s.stageName === "rootfs" ? { ...s, contentHash: WRONG } : s);
  const bp  = bootProof(tampered);
  const r   = enrollDevice({ deviceIdentity: DEV, bootProof: bp, attestationPolicies: { x86_64: POLICY }, quorumProof: quorumProof("sha256:" + "0".repeat(64)) });
  ck("2. rejected on tampered rootfs",         r.enrolled === false);
  ck("2. reason mentions boot",                r.reasons.some((x) => /boot not attested/i.test(x)));
}

// ── 3. wrong outcome ──────────────────────────────────────────────────────────
{
  const bp  = bootProof(STAGES, "firmware_fail");
  const r   = enrollDevice({ deviceIdentity: DEV, bootProof: bp, attestationPolicies: { x86_64: POLICY }, quorumProof: quorumProof("sha256:" + "0".repeat(64)) });
  ck("3. rejected on non-success outcome",     r.enrolled === false);
}

// ── 4. sub-threshold quorum (only 1 signature, need 2) ────────────────────────
{
  const bp  = bootProof();
  const attest = attestBoot(bp, POLICY);
  const ph  = enrollmentPayloadHash(DEV, attest.sealed.hash);
  const qp  = quorumProof(ph, 1);
  const r   = enrollDevice({ deviceIdentity: DEV, bootProof: bp, attestationPolicies: { x86_64: POLICY }, quorumProof: qp });
  ck("4. rejected sub-threshold quorum",       r.enrolled === false);
  ck("4. reason mentions quorum",              r.reasons.some((x) => /quorum not satisfied/i.test(x)));
}

// ── 5. wrong payload hash in quorum ───────────────────────────────────────────
{
  const bp  = bootProof();
  const qp  = quorumProof("sha256:" + "0".repeat(64), 2);  // hash doesn't match the enrollment
  const attest = attestBoot(bp, POLICY);
  const ph  = enrollmentPayloadHash(DEV, attest.sealed.hash);
  const r   = enrollDevice({ deviceIdentity: DEV, bootProof: bp, attestationPolicies: { x86_64: POLICY }, quorumProof: qp });
  ck("5. rejected wrong payload hash",         r.enrolled === false);
}

// ── 6. no attestation policy for this arch ────────────────────────────────────
{
  const bp  = bootProof();
  const r   = enrollDevice({ deviceIdentity: DEV, bootProof: bp, attestationPolicies: { arm64: POLICY }, quorumProof: quorumProof("sha256:" + "0".repeat(64)) });
  ck("6. rejected missing arch policy",        r.enrolled === false);
  ck("6. reason mentions arch",                r.reasons.some((x) => /no attestation policy/i.test(x)));
}

// ── 7. enrollmentPayloadHash binds device + attestation ───────────────────────
{
  const hash1 = enrollmentPayloadHash(DEV, "sha256:" + "a".repeat(64));
  const hash2 = enrollmentPayloadHash({ ...DEV, id: "dev-002" }, "sha256:" + "a".repeat(64));
  const hash3 = enrollmentPayloadHash(DEV, "sha256:" + "b".repeat(64));
  ck("7. different device → different hash",   hash1 !== hash2);
  ck("7. different attestation → different hash", hash1 !== hash3);
  ck("7. same inputs → same hash",             hash1 === enrollmentPayloadHash(DEV, "sha256:" + "a".repeat(64)));
}

// ── 8. platform fallback in policy resolution ─────────────────────────────────
{
  const devNoArch = { id: "dev-003", deviceName: "edge-2", platform: "linux-x86_64" };
  const FIXED = "2026-08-04T00:00:00.000Z";
  const origToISO = Date.prototype.toISOString;
  Date.prototype.toISOString = () => FIXED;
  try {
    const bp    = bootProof();
    const attest = attestBoot(bp, POLICY);
    const ph    = enrollmentPayloadHash(devNoArch, attest.sealed.hash);
    const qp    = quorumProof(ph, 2);
    const r     = enrollDevice({ deviceIdentity: devNoArch, bootProof: bp, attestationPolicies: { "linux-x86_64": POLICY }, quorumProof: qp });
    ck("8. platform fallback resolves policy",   r.enrolled === true);
  } finally {
    Date.prototype.toISOString = origToISO;
  }
}

// ── quorum unit tests ─────────────────────────────────────────────────────────
ck("Q1. parseRule '2of3-human'",    JSON.stringify(parseRule("2of3-human")) === JSON.stringify({ threshold: 2, total: 3, kind: "human" }));
ck("Q2. parseRule null on garbage", parseRule("bad") === null);
ck("Q3. parseRule 0of1 invalid",    parseRule("0of1-human") === null);
ck("Q4. verifyQuorum ok",           verifyQuorum(quorumProof("sha256:" + "0".repeat(64)), {}).ok === true);
ck("Q5. verifyQuorum rejects dup signer", (() => {
  const validators = ["spiffe://a", "spiffe://b", "spiffe://c"];
  const sigs = [
    { kind: "human", spiffe_id: "spiffe://a", sig: "0".repeat(32) },
    { kind: "human", spiffe_id: "spiffe://a", sig: "1".repeat(32) },  // duplicate
  ];
  return !verifyQuorum({ kind: "QuorumProof", rule: "2of3-human", validators, signed_payload_hash: "sha256:" + "0".repeat(64), signatures: sigs }).ok;
})());

console.log(`\n${fail ? fail + " FAIL" : "all ok"}`);
process.exit(fail ? 1 : 0);
