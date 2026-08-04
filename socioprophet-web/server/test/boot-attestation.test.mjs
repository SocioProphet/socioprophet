// Boot-attestation test: a device is trustworthy from power-on only if every stage it ran
// was pinned and matched, the boot succeeded, and the rootfs stage equals the pinned dm-verity
// root. Self-contained — transpiles the TS on the fly (no loader), like contracts/admission.
// Run: node test/boot-attestation.test.mjs
import { createRequire } from "module";
import path from "path";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const fs = require("fs");
const Module = require("module");

const load = (rel, name) => {
  const src = fs.readFileSync(rel, "utf8");
  const js = ts.transpileModule(src, { compilerOptions: { module: "commonjs", target: "es2020" } }).outputText;
  const m = new Module(name);
  m.filename = path.resolve(rel.replace(/\.ts$/, ".js"));
  m.paths = Module._nodeModulePaths(path.dirname(m.filename));
  m._compile(js, m.filename);
  return m.exports;
};

const c = load("src/contracts/index.ts", "contracts");
const { attestBoot } = load("src/services/bootAttestation.ts", "bootAttestation");

let fail = 0;
const ck = (n, ok) => { console.log((ok ? "ok  " : "FAIL ") + n); if (!ok) fail++; };

const VERITY = "sha256:" + "a".repeat(64);
const stage = (stageName, contentHash, verdict = "verified") =>
  ({ stageName, artifactRef: `urn:srcos:artifact:${stageName}`, contentHash, verdict });

function record(stages, outcome = "success", extra = {}) {
  const r = c.bootProofRecord("dev1", "urn:srcos:boot-plan:edge", outcome);
  return { ...r, stageProofs: stages, ...extra };
}

const goodStages = [
  stage("firmware", "sha256:" + "1".repeat(64)),
  stage("bootloader", "sha256:" + "2".repeat(64)),
  stage("kernel", "sha256:" + "3".repeat(64)),
  stage("rootfs", VERITY),
];
const policy = {
  expectedStages: goodStages.map((s) => ({ stageName: s.stageName, contentHash: s.contentHash })),
  rootfsStage: "rootfs",
  rootfsVerityRoot: VERITY,
};

// 1. happy path: every stage pinned + pass + outcome success + rootfs == verity root
let r = attestBoot(record(goodStages), policy, { validate: (x) => c.validate("BootProofRecord", x) });
ck("fully-measured boot attests", r.attested && r.sealed.verity_bound && /^sha256:[0-9a-f]{64}$/.test(r.sealed.hash));

// 2. non-success outcome rejected
r = attestBoot(record(goodStages, "partial"), policy);
ck("non-success outcome rejected", !r.attested && r.reasons.some((x) => x.includes("not success")));

// 3. a failed stage verdict rejected
r = attestBoot(record([...goodStages.slice(0, 3), stage("rootfs", VERITY, "tampered")]), policy);
ck("failed stage verdict rejected", !r.attested && r.reasons.some((x) => x.includes("!= verified")));

// 4. a hash mismatch rejected
const tampered = [...goodStages.slice(0, 2), stage("kernel", "sha256:" + "9".repeat(64)), stage("rootfs", VERITY)];
r = attestBoot(record(tampered), policy);
ck("stage hash mismatch rejected", !r.attested && r.reasons.some((x) => x.includes("hash mismatch")));

// 5. an unpinned stage (unmeasured surface) rejected — fail-closed
r = attestBoot(record([...goodStages, stage("mystery-blob", "sha256:" + "7".repeat(64))]), policy);
ck("unpinned stage rejected (unmeasured surface)", !r.attested && r.reasons.some((x) => x.includes("not pinned")));

// 6. a missing expected stage rejected
r = attestBoot(record(goodStages.slice(0, 3)), policy);
ck("missing expected stage rejected", !r.attested && r.reasons.some((x) => x.includes("missing")));

// 7. dm-verity mismatch rejected (booted base is not the verified base)
const wrongRoot = [...goodStages.slice(0, 3), stage("rootfs", "sha256:" + "b".repeat(64))];
const policyWrong = { ...policy, expectedStages: wrongRoot.map((s) => ({ stageName: s.stageName, contentHash: s.contentHash })) };
r = attestBoot(record(wrongRoot), policyWrong);
ck("rootfs != pinned dm-verity root rejected", !r.attested && r.reasons.some((x) => x.includes("dm-verity")));

// 8. a policy that pins nothing cannot attest anything (anti-theater)
r = attestBoot(record(goodStages), { expectedStages: [] });
ck("empty policy attests nothing", !r.attested && r.sealed === null);

// 9. requireSignature enforced
r = attestBoot(record(goodStages), { ...policy, requireSignature: true });
ck("requireSignature enforced", !r.attested && r.reasons.some((x) => x.includes("signed")));
r = attestBoot(record(goodStages, "success", { signature: "MEUCIQD" + "f".repeat(20) }), { ...policy, requireSignature: true });
ck("signed boot proof attests under requireSignature", r.attested);

console.log(fail ? `\n${fail} FAILED` : "\nboot attestation: all checks pass");
process.exit(fail ? 1 : 0);
