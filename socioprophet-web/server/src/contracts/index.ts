export {};
// sourceos-spec conformance layer for the image builder.
// Validates payloads against the CANONICAL schemas vendored under ./schemas
// (synced from SourceOS-Linux/sourceos-spec — see schemas/PROVENANCE.txt) and
// builds spec-conformant BuildRequest / BuildValidationEvidenceBundle objects.
const path = require("path");
const fs = require("fs");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const SPEC_VERSION = "2.0.0";
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

// Register EVERY vendored schema with ajv first (so cross-schema $refs like
// ContentRef resolve), then look up validators by each schema's $id.
const schemasDir = path.join(__dirname, "schemas");
const idByName: Record<string, string> = {};
for (const file of fs.readdirSync(schemasDir).filter((f: string) => f.endsWith(".json"))) {
  const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, file), "utf8"));
  if (schema.$id) { ajv.addSchema(schema); idByName[file.replace(/\.json$/, "")] = schema.$id; }
}
const validatorNames = [
  "BuildRequest", "BuildValidationEvidenceBundle", "OSImage", "CatalogEntry",
  "NLBootPlan", "DeviceIdentity", "BootProofRecord", "ContentSpec",
  "ControlNodeProfile", "DesktopProfile", "Offer", "WorkOrder",
  "UsageReceipt", "SettlementEvent", "EventEnvelope",
];
const validators: Record<string, any> = {};
for (const n of validatorNames) validators[n] = ajv.getSchema(idByName[n]);

const RELEASE = "26.11";
// editions → canonical OSImage hostProfile personas.
const hostProfileFor = (edition: string) =>
  edition === "desktop" ? "workstation" : edition === "edge" ? "edge-appliance" : "vm-base";
// osimage urn local-ids must be lowercase [a-z0-9._-]; Firestore ids can be mixed-case.
const lc = (s: string) => s.toLowerCase().replace(/[^a-z0-9._-]/g, "-");

// Validate `obj` against a vendored schema. Returns [] when valid, else messages.
const validate = (schema: string, obj: any): string[] => {
  const v = validators[schema];
  if (!v) return [`no validator for ${schema}`];
  return v(obj) ? [] : (v.errors || []).map((e: any) => `${e.instancePath || "/"} ${e.message}`);
};

// editions → canonical ContentSpec ref. The build/validation control node is a
// single operator-control-node (ControlNodeProfile.hostRole only allows that) —
// NOT the edition. profileRef points at the builder node, not the flavor.
const contentSpecRef = (edition: string) => `urn:srcos:content-spec:sourceos-${edition}`;
const BUILDER_NODE_REF = "urn:srcos:control-node:sourceos-builder";
const outputsFor = (target: string) => (target === "netboot" ? ["pxe"] : ["iso"]);

// Build a spec-conformant BuildRequest from a validated user spec.
const buildRequest = (buildId: string, uid: string, spec: any, target: string) => ({
  id: `urn:srcos:build-request:${buildId}`,
  type: "BuildRequest",
  specVersion: SPEC_VERSION,
  contentSpecRef: contentSpecRef(spec.edition || "desktop"),
  outputs: outputsFor(target),
  architecture: spec.arch || null,
  parameters: {
    hostname: spec.hostname,
    packages: spec.packages || [],
    services: spec.services || {},
    users: spec.users || [],
    ...(spec.moduleSnippet ? { moduleSnippet: spec.moduleSnippet } : {}),
  },
  requestedBy: `urn:srcos:user:${uid}`,
  requestedAt: new Date().toISOString(),
});

// Build a spec-conformant BuildValidationEvidenceBundle for a finished build.
const evidenceBundle = (
  buildId: string, edition: string, ok: boolean, artifactRef: string | null,
) => ({
  id: `urn:srcos:build-evidence:${buildId}`,
  type: "BuildValidationEvidenceBundle",
  specVersion: SPEC_VERSION,
  buildRef: `urn:srcos:build-request:${buildId}`,
  profileRef: BUILDER_NODE_REF,
  artifactRefs: artifactRef ? [artifactRef] : [],
  scenarioResults: [
    { scenarioId: "image-build", status: ok ? "passed" : "failed", artifactRef: artifactRef || "urn:srcos:none" },
  ],
  issuedAt: new Date().toISOString(),
});

// Build a spec-conformant OSImage identity for a finished iso/qcow2 build.
// `opts`: { arch, channel, artifactRef, revision }.
const osImage = (buildId: string, edition: string, opts: any = {}) => {
  const id = lc(buildId);
  const hostProfile = hostProfileFor(edition);
  const arch = opts.arch === "aarch64" ? "aarch64" : "x86_64";
  return {
    id: `urn:srcos:osimage:${id}`,
    type: "OSImage",
    specVersion: SPEC_VERSION,
    shortId: `so1-${hostProfile}`,
    family: "sourceos",
    epoch: 1,
    hostProfile,
    artifact: opts.artifact || "iso",
    architecture: arch,
    osRelease: {
      ID: "sourceos",
      VERSION_ID: RELEASE,
      IMAGE_ID: `sourceos-${edition}`,
      IMAGE_VERSION: RELEASE,
      RELEASE_TYPE: opts.channel || "custom",
    },
    ociAnnotations: {
      "org.opencontainers.image.version": RELEASE,
      "org.opencontainers.image.revision": opts.revision || "main",
      "org.opencontainers.image.source": "https://github.com/SourceOS-Linux/source-os",
      "org.opencontainers.image.created": new Date().toISOString(),
    },
    substrateCapabilities: ["nix", "systemd-boot", "immutable-base"],
    provenance: {
      statementRef: `urn:srcos:attestation:${id}`,
      slsaPredicateRef: `urn:srcos:slsa:${id}`,
    },
  };
};

// Register a built OSImage in the catalog.
const catalogEntry = (buildId: string, osImageUrn: string, published: boolean, evidenceRef?: string) => ({
  id: `urn:srcos:catalog-entry:${lc(buildId)}`,
  type: "CatalogEntry",
  specVersion: SPEC_VERSION,
  objectRef: osImageUrn,
  objectType: "OSImage",
  status: published ? "published" : "draft",
  ...(evidenceRef ? { evidenceBundleRef: evidenceRef } : {}),
  updatedAt: new Date().toISOString(),
});

// ── Boot / fleet contracts ───────────────────────────────────────────────────

// A registered fleet device → conformant DeviceIdentity.
const deviceIdentity = (deviceId: string, name: string, uid: string) => ({
  id: `urn:srcos:device-identity:${lc(deviceId)}`,
  type: "DeviceIdentity",
  specVersion: SPEC_VERSION,
  deviceName: name,
  platform: "linux",
  archClass: "x86_64",
  trustProfile: { trustLevel: "provisional", enrolledAt: new Date().toISOString() },
  ownerRef: `urn:srcos:user:${uid}`,
  registeredAt: new Date().toISOString(),
});

// The server-managed boot plan a device receives → conformant NLBootPlan.
// `stages` = [{name, artifactRef, contentHash}] derived from the netboot manifest.
const nlBootPlan = (deviceId: string, buildId: string, stages: any[]) => ({
  id: `urn:srcos:nlboot-plan:${lc(buildId)}-${lc(deviceId)}`,
  type: "NLBootPlan",
  specVersion: SPEC_VERSION,
  targetDeviceRef: `urn:srcos:device-identity:${lc(deviceId)}`,
  platform: "generic-uefi",
  status: "active",
  stages: stages.map((s) => ({
    name: s.name,
    artifactRef: s.artifactRef,
    contentHash: s.contentHash,
    verificationRequired: true,
  })),
  bootReleaseSetRef: `urn:srcos:catalog-entry:${lc(buildId)}`,
  createdAt: new Date().toISOString(),
});

// Evidence that a device booted a plan → conformant BootProofRecord.
//
// The id used to be `boot-proof:{deviceId}-{Date.now()}`, so two boot-proofs from the
// same device in the same millisecond (retry loop, rapid stage transitions, batched
// fleet callback) minted identical URNs and the second silently overwrote the first in
// Firestore.
//
// Copilot round-2: a per-process sequence alone still collides across horizontally
// scaled instances or serverless cold starts, because `_bootProofSeq` resets to 0 in
// each process and Date.now() readily matches across them. Combined with the same-device
// key, an id like `boot-proof:dev-1-172890123-0` could easily be minted by two workers
// simultaneously. Add a process-unique random suffix (crypto.randomUUID short-form) so
// ids are globally unique, not just per-process. The sequence stays for readability and
// as a tiebreaker within a single process's tick. `bootedAt` still carries wall time.
const crypto = require("crypto");
const _bootProofNonce = crypto.randomUUID().slice(0, 8); // once per process — 32 bits of process entropy
let _bootProofSeq = 0;
const bootProofRecord = (deviceId: string, planRef: string, outcome: string) => ({
  // Deterministic-shape id: `boot-proof:{device}-{ms}-{seq}-{procNonce}`. Every id is
  // unique across every replica by the procNonce even if seq and ms collide.
  id: `urn:srcos:boot-proof:${lc(deviceId)}-${Date.now()}-${_bootProofSeq++}-${_bootProofNonce}`,
  type: "BootProofRecord",
  specVersion: SPEC_VERSION,
  bootPlanRef: planRef,
  deviceRef: `urn:srcos:device-identity:${lc(deviceId)}`,
  outcome: ["success", "partial", "failure", "aborted"].includes(outcome) ? outcome : "failure",
  bootedAt: new Date().toISOString(),
});

// ── Edition descriptors (resolve the contentSpecRef / profileRef the builder emits) ──

const EDITION_NAMES: Record<string, string> = {
  desktop: "SourceOS Desktop (GNOME)", server: "SourceOS Server", edge: "SourceOS Edge",
};

// Each edition is a canonical ContentSpec of kind os-flavor.
const contentSpec = (edition: string) => ({
  id: contentSpecRef(edition),
  type: "ContentSpec",
  specVersion: SPEC_VERSION,
  name: EDITION_NAMES[edition] || `SourceOS ${edition}`,
  kind: "os-flavor",
});

// The desktop edition's desktop environment.
const desktopProfile = (edition: string) => ({
  id: `urn:srcos:desktop-profile:sourceos-${edition}`,
  type: "DesktopProfile",
  specVersion: SPEC_VERSION,
  desktopEnvironment: "gnome",
});

// The single operator-control-node that builds + validates images (the profileRef
// the evidence bundles point at).
const builderControlNode = () => ({
  id: BUILDER_NODE_REF,
  type: "ControlNodeProfile",
  specVersion: SPEC_VERSION,
  hostRole: "operator-control-node",
  hostPlatform: "x86_64-linux",
  containerRuntime: "podman",
  // Compute-placement priority: prefer local, then the private GCP lane, then
  // burst to cloud — mirrors the builder's free/paid build lanes.
  placementOrder: ["local", "trusted-private", "burst-cloud"],
  workspace: {
    configDir: "/etc/sourceos",
    stateDir: "/var/lib/sourceos",
    evidenceDir: "/var/lib/sourceos/evidence",
  },
});

// ── Fog compute market — builds as billable fog compute ──────────────────────

// The builder's standing FogCompute Offer (it offers build capacity).
const fogOffer = () => ({
  id: "urn:srcos:offer:sourceos-builder",
  type: "Offer",
  specVersion: SPEC_VERSION,
  provider: { subjectId: BUILDER_NODE_REF },
  resources: { cpuCores: 8, memoryBytes: 34359738368, storageBytes: 64424509440 },
});

// A build job submitted to the fog → WorkOrder (requestor = user, workload = the flavor).
const workOrder = (buildId: string, uid: string, edition: string) => ({
  id: `urn:srcos:workorder:${lc(buildId)}`,
  type: "WorkOrder",
  specVersion: SPEC_VERSION,
  requestor: { subjectId: `urn:srcos:user:${uid}` },
  workload: { image: contentSpecRef(edition) },
});

// Compute consumed by a finished build → UsageReceipt against its WorkOrder.
const usageReceipt = (buildId: string, startedAt: string, endedAt: string, cpuSeconds: number) => ({
  id: `urn:srcos:receipt:usage:${lc(buildId)}`,
  type: "UsageReceipt",
  specVersion: SPEC_VERSION,
  workOrderId: `urn:srcos:workorder:${lc(buildId)}`,
  provider: { subjectId: BUILDER_NODE_REF },
  startedAt,
  endedAt,
  usage: { cpuSeconds: Math.max(0, Math.round(cpuSeconds)) },
});

// Maps a usage receipt to a settlement backend (paid/premium billing).
const settlementEvent = (buildId: string) => ({
  id: `urn:srcos:settlement:${lc(buildId)}`,
  type: "SettlementEvent",
  specVersion: SPEC_VERSION,
  receiptId: `urn:srcos:receipt:usage:${lc(buildId)}`,
});

// A canonical EventEnvelope for the builder's lifecycle on the event planes.
let _evtSeq = 0;
const eventEnvelope = (eventType: string, subjectId: string, objectId: string, payload: any = {}) => ({
  eventId: `urn:srcos:event:${Date.now()}-${_evtSeq++}`,
  eventType,
  specVersion: SPEC_VERSION,
  occurredAt: new Date().toISOString(),
  actor: { subjectId },
  objectId,
  payload,
});

module.exports = {
  validate, buildRequest, evidenceBundle, osImage, catalogEntry,
  deviceIdentity, nlBootPlan, bootProofRecord,
  contentSpec, desktopProfile, builderControlNode,
  fogOffer, workOrder, usageReceipt, settlementEvent,
  eventEnvelope, SPEC_VERSION,
};
