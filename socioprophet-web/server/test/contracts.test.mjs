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

// Boot / fleet contracts.
const di = c.deviceIdentity("Dev-1", "rack-01", "user9");
ck("DeviceIdentity conformant", c.validate("DeviceIdentity", di).length === 0);
ck("  trustLevel provisional", di.trustProfile.trustLevel === "provisional");
ck("  id lowercased urn", di.id === "urn:srcos:device-identity:dev-1");

const plan = c.nlBootPlan("dev1", "build7", [
  { name: "kernel", artifactRef: "https://x/kernel", contentHash: "sha256:aa" },
  { name: "initramfs", artifactRef: "https://x/initrd", contentHash: "sha256:bb" },
]);
ck("NLBootPlan conformant", c.validate("NLBootPlan", plan).length === 0);
ck("  platform generic-uefi", plan.platform === "generic-uefi");
ck("  2 stages", plan.stages.length === 2 && plan.stages[0].name === "kernel");

const bp = c.bootProofRecord("dev1", plan.id, "success");
ck("BootProofRecord conformant", c.validate("BootProofRecord", bp).length === 0);
ck("  outcome success", bp.outcome === "success");
ck("bad NLBootPlan REJECTED", c.validate("NLBootPlan", { id: "urn:srcos:nlboot-plan:x", type: "NLBootPlan" }).length > 0);

// Edition descriptors — the refs the builder emits must resolve to conformant objects.
for (const ed of ["desktop", "server", "edge"]) {
  const cs = c.contentSpec(ed);
  ck(`ContentSpec(${ed}) conformant`, c.validate("ContentSpec", cs).length === 0);
  ck(`  os-flavor + content-spec urn`, cs.kind === "os-flavor" && cs.id === `urn:srcos:content-spec:sourceos-${ed}`);
}
const dp = c.desktopProfile("desktop");
ck("DesktopProfile(gnome) conformant", c.validate("DesktopProfile", dp).length === 0);
const bn = c.builderControlNode();
ck("builder ControlNodeProfile conformant", c.validate("ControlNodeProfile", bn).length === 0);
ck("  operator-control-node + podman", bn.hostRole === "operator-control-node" && bn.containerRuntime === "podman");
// The evidence bundle's profileRef now resolves to the builder control node.
ck("evidence profileRef == builder node", ev.profileRef === bn.id);

// Fog compute market — build as billable fog compute.
const offer = c.fogOffer();
ck("Offer conformant", c.validate("Offer", offer).length === 0);
const wo = c.workOrder("Build-7", "user9", "server");
ck("WorkOrder conformant", c.validate("WorkOrder", wo).length === 0);
ck("  workload.image = content-spec", wo.workload.image === "urn:srcos:content-spec:sourceos-server");
const ur = c.usageReceipt("Build-7", "2026-06-22T00:00:00Z", "2026-06-22T00:05:00Z", 300);
ck("UsageReceipt conformant", c.validate("UsageReceipt", ur).length === 0);
ck("  workOrderId links the WorkOrder", ur.workOrderId === wo.id);
const settle = c.settlementEvent("Build-7");
ck("SettlementEvent conformant", c.validate("SettlementEvent", settle).length === 0);
ck("  receiptId links the UsageReceipt", settle.receiptId === ur.id);
ck("bad WorkOrder REJECTED", c.validate("WorkOrder", { id: "urn:srcos:workorder:x", type: "WorkOrder" }).length > 0);

console.log(fail ? `\n${fail} FAILED` : "\nALL CONFORMANCE CHECKS PASSED");
process.exit(fail ? 1 : 0);
