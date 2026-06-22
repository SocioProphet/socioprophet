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

const loadSchema = (name: string) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "schemas", `${name}.json`), "utf8"));

const validators: Record<string, any> = {
  BuildRequest: ajv.compile(loadSchema("BuildRequest")),
  BuildValidationEvidenceBundle: ajv.compile(loadSchema("BuildValidationEvidenceBundle")),
  OSImage: ajv.compile(loadSchema("OSImage")),
  CatalogEntry: ajv.compile(loadSchema("CatalogEntry")),
};

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

// editions → canonical refs (ContentSpec / ControlNodeProfile families).
const contentSpecRef = (edition: string) => `urn:srcos:content-spec:sourceos-${edition}`;
const controlNodeRef = (edition: string) => `urn:srcos:control-node:sourceos-${edition}`;
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
  profileRef: controlNodeRef(edition),
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

module.exports = { validate, buildRequest, evidenceBundle, osImage, catalogEntry, SPEC_VERSION };
