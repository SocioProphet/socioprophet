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
};

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

module.exports = { validate, buildRequest, evidenceBundle, SPEC_VERSION };
