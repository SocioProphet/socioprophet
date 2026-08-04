// Admission test: every OS build is admitted through the capability membrane and seals a
// contract-conformant AutonomyAdmissionReceipt. Advisory-by-default never blocks; enforcement
// fails closed. Self-contained — transpiles the TS on the fly (no loader), like contracts.test.
// Run: node test/admission.test.mjs
import { createRequire } from "module";
import path from "path";
import os from "os";
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
const adm = load("src/services/buildAdmission.ts", "buildAdmission");

let fail = 0;
const ck = (n, ok) => { console.log((ok ? "ok  " : "FAIL ") + n); if (!ok) fail++; };
const conforms = (r) => c.validate("AutonomyAdmissionReceipt.v0.2", r).length === 0;
const spec = { edition: "desktop", arch: "x86_64", hostname: "h", packages: [], users: [] };

const cli = (name, body) => {
  const p = path.join(os.tmpdir(), name);
  fs.writeFileSync(p, `let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{${body}});`);
  return `node ${p}`;
};
const reset = () => { delete process.env.MEMBRANE_GATE_URL; delete process.env.MEMBRANE_GATE_CMD; delete process.env.BUILD_ADMISSION_ENFORCE; };

// 1. Advisory, no transport: admits, never blocks, receipt conforms + is sealed.
reset();
let r = await adm.admitBuild("u1", "b1", spec, "free");
ck("advisory (no transport) admits, not blocked", r.decision === "admit" && r.blocked === false);
ck("  receipt conforms to AutonomyAdmissionReceipt.v0.2", conforms(r.receipt));
ck("  receipt is sealed (sha256)", /^sha256:[0-9a-f]{64}$/.test(r.receipt.hash));
ck("  advisory receipt marks membrane unenforced", r.receipt.membrane.enforced === false);

// 2. Enforce, no transport: fails closed (deny + blocked), receipt still conforms.
reset(); process.env.BUILD_ADMISSION_ENFORCE = "true";
r = await adm.admitBuild("u1", "b2", spec, "free");
ck("enforce + no transport fails CLOSED (deny + blocked)", r.decision === "deny" && r.blocked === true);
ck("  denied receipt still conforms", conforms(r.receipt));
ck("  granted_level demoted to L0 on deny", r.receipt.granted_level === "L0");

// 3. CLI transport ALLOW (exit 0): admit, not blocked, membrane fields carried through.
reset();
process.env.MEMBRANE_GATE_CMD = cli("membrane-allow.mjs",
  "process.stdout.write(JSON.stringify({execution_decision:'allow',verdict:'allowed',enforced:true,capability_radius:'R2',missing_tension:[],membrane_decision:'ALLOW',seal_hash:'sha256:'+'a'.repeat(64)}));process.exit(0)");
r = await adm.admitBuild("u1", "b3", spec, "premium");
ck("cli allow -> admit, not blocked", r.decision === "admit" && r.blocked === false);
ck("  granted_level == requested on admit", r.receipt.granted_level === r.request.requested_autonomy_level);
ck("  carries membrane radius + seal", r.receipt.membrane.capability_radius === "R2" && r.receipt.membrane.enforced === true);

// 4. CLI transport DENY (exit 3) under enforcement: deny + blocked.
reset(); process.env.BUILD_ADMISSION_ENFORCE = "true";
process.env.MEMBRANE_GATE_CMD = cli("membrane-deny.mjs",
  "process.stdout.write(JSON.stringify({execution_decision:'deny',verdict:'denied',enforced:true,capability_radius:'R0',missing_tension:['consent'],membrane_decision:'DENY',seal_hash:'sha256:'+'b'.repeat(64)}));process.exit(3)");
r = await adm.admitBuild("u1", "b4", spec, "premium");
ck("cli deny (exit 3) + enforce -> deny + blocked", r.decision === "deny" && r.blocked === true);
ck("  denied receipt conforms", conforms(r.receipt));

// 5. CLI DENY but ADVISORY: records the deny, does NOT block (pipeline unbroken).
reset(); // enforce off
process.env.MEMBRANE_GATE_CMD = cli("membrane-deny2.mjs",
  "process.stdout.write(JSON.stringify({execution_decision:'deny',verdict:'denied',enforced:true,capability_radius:'R0',missing_tension:['consent'],membrane_decision:'DENY',seal_hash:'sha256:'+'c'.repeat(64)}));process.exit(3)");
r = await adm.admitBuild("u1", "b5", spec, "free");
ck("cli deny + ADVISORY records deny but does NOT block", r.decision === "deny" && r.blocked === false);

// 6. Risk classification: a raw Nix module snippet is high-risk.
reset();
ck("riskForSpec(raw module) == high", adm.riskForSpec({ module: "{ boot.loader.grub.enable = true; }" }, "free") === "high");
ck("riskForSpec(plain free) == low", adm.riskForSpec(spec, "free") === "low");

console.log(fail ? `\n${fail} FAILED` : "\nadmission: all checks pass");
process.exit(fail ? 1 : 0);
