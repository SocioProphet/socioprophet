// Contract test: the builder's canonical objects validate against the vendored
// sourceos-spec schemas (BuildRequest, BuildValidationEvidenceBundle).
// Self-contained — transpiles src/contracts/index.ts on the fly so it runs in
// CI without a TS loader. Run: node test/contracts.test.mjs
import { createRequire } from "module";
import path from "path";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const fs = require("fs");
const Module = require("module");

const src = fs.readFileSync("src/contracts/index.ts", "utf8");
const js = ts.transpileModule(src, { compilerOptions: { module: "commonjs", target: "es2020" } }).outputText;
const m = new Module("contracts");
m.filename = path.resolve("src/contracts/index.js");
m.paths = Module._nodeModulePaths(path.resolve("src/contracts"));
m._compile(js, m.filename);
const c = m.exports;

let fail = 0;
const ck = (n, ok) => { console.log((ok ? "ok  " : "FAIL ") + n); if (!ok) fail++; };

const br = c.buildRequest("abc123", "u1", { edition: "server", arch: "x86_64", hostname: "h1", packages: ["htop"], services: { openssh: true }, users: [] }, "iso");
ck("BuildRequest(iso) conformant", c.validate("BuildRequest", br).length === 0);
ck("  outputs=[iso]", JSON.stringify(br.outputs) === '["iso"]');
ck("  id is build-request urn", /^urn:srcos:build-request:/.test(br.id));
const brN = c.buildRequest("d1", "u", { edition: "edge", arch: "x86_64", hostname: "n" }, "netboot");
ck("BuildRequest(netboot) outputs=[pxe]", JSON.stringify(brN.outputs) === '["pxe"]');
ck("bad BuildRequest REJECTED", c.validate("BuildRequest", { id: "nope", type: "BuildRequest" }).length > 0);

const ev = c.evidenceBundle("abc123", "server", true, "gs://b/u/abc123/x.iso");
ck("EvidenceBundle(pass) conformant", c.validate("BuildValidationEvidenceBundle", ev).length === 0);
ck("  profileRef is control-node urn", /^urn:srcos:control-node:/.test(ev.profileRef));
const evF = c.evidenceBundle("abc", "server", false, null);
ck("EvidenceBundle(fail) conformant", c.validate("BuildValidationEvidenceBundle", evF).length === 0);

// OSImage per edition (host-profile mapping) + mixed-case build id → lowercase urn.
for (const [ed, hp] of [["desktop", "workstation"], ["server", "vm-base"], ["edge", "edge-appliance"]]) {
  const img = c.osImage("Build-XYZ", ed, { arch: "x86_64", channel: "paid", revision: "abc123" });
  ck(`OSImage(${ed}) conformant`, c.validate("OSImage", img).length === 0);
  ck(`  shortId so1-${hp}`, img.shortId === `so1-${hp}`);
  ck("  id urn is lowercased", img.id === "urn:srcos:osimage:build-xyz");
}
const img1 = c.osImage("b1", "server", { arch: "aarch64" });
const cat = c.catalogEntry("b1", img1.id, true, "urn:srcos:build-evidence:b1");
ck("CatalogEntry conformant", c.validate("CatalogEntry", cat).length === 0);
ck("  objectRef = OSImage urn", cat.objectRef === img1.id);
ck("bad OSImage REJECTED", c.validate("OSImage", { id: "urn:srcos:osimage:x", type: "OSImage" }).length > 0);

console.log(fail ? `\n${fail} FAILED` : "\nALL CONFORMANCE CHECKS PASSED");
process.exit(fail ? 1 : 0);
