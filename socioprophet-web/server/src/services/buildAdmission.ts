export {};
// Governed admission for OS-image builds.
//
// Before an image is built, the request is admitted through the AUTHORITATIVE capability
// membrane (SourceOS-Linux/prophet-platform :: tools/capability_membrane.py) and the decision
// is sealed into an AutonomyAdmissionReceipt (the same contract the membrane emits estate-wide
// — vendored under contracts/schemas/). We NEVER re-implement the membrane decision here; we
// call it and record what it said. Two properties make this safe to land on a live pipeline:
//
//   * ADVISORY BY DEFAULT. Every build gets a decision + a sealed receipt, but the build is
//     never blocked unless BUILD_ADMISSION_ENFORCE=true. Flip enforcement on only once the
//     membrane transport is confirmed in the deploy — so wiring this cannot break builds.
//   * FAIL-CLOSED WHEN ENFORCING. Under enforcement, an unreachable/unwired membrane denies
//     (never fails open). Under advisory, an unwired membrane admits but the receipt says so.
//
// Transport is injectable/config-driven: MEMBRANE_GATE_URL (HTTP POST the CapabilityRequest)
// or MEMBRANE_GATE_CMD (the membrane CLI: JSON in on stdin, decision JSON on stdout, exit
// 0=allow / 3=deny). Absent both, we are in advisory-no-transport mode.

const crypto = require("crypto");
const { execFile } = require("child_process");

const ROLE_CEILING = "L2"; // builder role's autonomy ceiling
// canonical trust-kernel gate order (AutonomyAdmissionReceipt.v0.2 requires exactly these six)
const TRUST_KERNEL_GATE_ORDER = ["identity", "policy", "evidence", "attestation", "revocation", "audit"];

// ---- compose the membrane CapabilityRequest for a build -------------------------------
const riskForSpec = (spec: any, tier: string): string => {
  if (spec && typeof spec.module === "string" && spec.module.trim().length > 0) return "high"; // raw Nix module
  if (Array.isArray(spec?.users) && spec.users.some((u: any) => u?.privileged || u?.sudo)) return "high";
  if (tier === "premium") return "medium";
  return "low";
};

const composeCapabilityRequest = (uid: string, buildId: string, spec: any, tier: string) => ({
  surface: "sourceos.os-image-build",
  action: "builder.image.build",
  access_level: "write",
  subject_ref: `urn:srcos:user:${uid}`,
  object_ref: `urn:srcos:build:${buildId}`,
  scope: "global_platform",            // an OS artifact is published platform-wide
  owned: true,
  requested_autonomy_level: tier === "free" ? "L1" : "L2",
  autonomy_evidence: [`tier:${tier}`],
  membrane_decision: "ALLOW",
  policy_refs: [`policy://sourceos/builder/tier/${tier}`],
  risk_level: riskForSpec(spec, tier),
  may_transmit_content: true,          // the build ships an artifact to GCS
  machine_ref: "urn:srcos:agent-machine:builder",
});

// ---- call the authoritative membrane (transport is config-driven) ---------------------
const shellMembrane = (cmd: string, request: any): Promise<any> =>
  new Promise((resolve, reject) => {
    const parts = cmd.split(/\s+/);
    const child = execFile(parts[0], parts.slice(1), { timeout: 8000 }, (err: any, stdout: string) => {
      // exit 0 = allow, 3 = deny — both carry a JSON decision on stdout; other codes are errors.
      const code = err && typeof err.code === "number" ? err.code : 0;
      if (code !== 0 && code !== 3) return reject(err || new Error(`membrane cli exit ${code}`));
      try { resolve(JSON.parse(stdout || "{}")); } catch (e) { reject(e); }
    });
    child.stdin.end(JSON.stringify(request));
  });

const callMembrane = async (request: any): Promise<any | null> => {
  const url = process.env.MEMBRANE_GATE_URL;
  if (url) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!r.ok) throw new Error(`membrane gate HTTP ${r.status}`);
    return await r.json();
  }
  const cmd = process.env.MEMBRANE_GATE_CMD;
  if (cmd) return await shellMembrane(cmd, request);
  return null; // no transport configured
};

const canon = (obj: any): string =>
  JSON.stringify(obj, Object.keys(obj).sort()); // stable top-level key order for the seal

// ---- compose the sealed AutonomyAdmissionReceipt (AutonomyAdmissionReceipt.v0.2) -------
const composeReceipt = (request: any, d: any) => {
  const membrane = d.membrane || {};
  const admitted = d.decision === "admit";
  const base: any = {
    version: "0.2",
    receipt_id: `urn:srcos:admission:${crypto.randomUUID()}`,
    created_at: new Date().toISOString(),
    service_ref: "urn:srcos:service:image-builder",
    role: "builder",
    requested_level: request.requested_autonomy_level,
    granted_level: admitted ? request.requested_autonomy_level : "L0",
    role_ceiling: ROLE_CEILING,
    decision: d.decision,                 // admit | demote | deny
    gate: "capability-membrane",
    evidence_required: "none",
    evidence_refs: [],
    reason: d.reason || `membrane ${d.execution_decision}`,
    trust_kernel_gate_order: TRUST_KERNEL_GATE_ORDER,
    subject_ref: request.subject_ref,
    policy_refs: request.policy_refs,
    membrane: {
      execution_decision: d.execution_decision,
      verdict: d.verdict,
      capability_radius: membrane.capability_radius || "R0",
      missing_tension: membrane.missing_tension || [],
      membrane_decision: membrane.membrane_decision || request.membrane_decision || "ALLOW",
      enforced: !!d.enforced,
      // when the membrane didn't return its own seal (advisory), seal the request itself so
      // the field is always a real digest, never a placeholder.
      seal_hash: membrane.seal_hash
        || ("sha256:" + crypto.createHash("sha256").update(canon(request)).digest("hex")),
    },
    hash_algo: "sha256",
  };
  base.hash = "sha256:" + crypto.createHash("sha256").update(canon(base)).digest("hex");
  return base;
};

// ---- the admission gate ---------------------------------------------------------------
const admitBuild = async (uid: string, buildId: string, spec: any, tier: string) => {
  const request = composeCapabilityRequest(uid, buildId, spec, tier);
  const enforce = process.env.BUILD_ADMISSION_ENFORCE === "true";

  let membrane: any = null;
  let error: string | undefined;
  try {
    membrane = await callMembrane(request);
  } catch (e: any) {
    error = String(e?.message || e);
  }

  let decision: string, execution_decision: string, verdict: string, enforced: boolean;
  if (membrane && membrane.execution_decision) {
    execution_decision = membrane.execution_decision;             // allow|deny|ask|defer|rewrite
    verdict = membrane.verdict || "observed";
    enforced = membrane.enforced !== undefined ? !!membrane.enforced : true;
    decision = execution_decision === "allow" ? "admit"
      : execution_decision === "rewrite" ? "demote" : "deny";
  } else {
    // no usable membrane result: advisory admits, enforcement fails closed.
    execution_decision = "defer";
    verdict = "observed";
    enforced = false;
    decision = enforce ? "deny" : "admit";
    if (!error) error = "membrane transport not configured — advisory admission";
  }

  const receipt = composeReceipt(request, {
    decision, execution_decision, verdict, enforced, membrane, reason: error,
  });
  const blocked = enforce && decision !== "admit";
  return { decision, blocked, enforce, receipt, request };
};

module.exports = { admitBuild, composeCapabilityRequest, composeReceipt, riskForSpec };
