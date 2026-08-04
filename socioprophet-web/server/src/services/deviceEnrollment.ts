export {};
// Device enrollment gate — quorum → literal (fuses boot attestation + validator quorum).
//
// A device joins the fleet only if BOTH hold:
//   1. its boot ATTESTS — the measured chain matches the pinned golden policy FOR ITS ARCH
//      (bootAttestation.attestBoot, PP-side dm-verity bound), and
//   2. an N-of-M validator QUORUM co-signs THIS enrollment (quorum.verifyQuorum, bound to the
//      enrollment payload hash so the vote can't be replayed onto another device).
//
// ARCH-NEUTRAL BY DESIGN: the golden boot chain differs per silicon (Apple-Silicon arm64,
// x86_64, riscv64, …), so the caller passes an attestationPolicies MAP keyed by archClass (with
// a platform fallback). The gate hardcodes NO architecture — the same gate, and the same tests,
// demonstrate on an M2 and on a sovereign-silicon Linux box; only the pinned policy differs.

const crypto = require("crypto");
const { attestBoot } = require("./bootAttestation");
const { verifyQuorum } = require("./quorum");

const _canon = (o: any): string => JSON.stringify(o, Object.keys(o).sort());

// Resolve the attestation policy for a device's silicon. Fail-closed: no policy = no enrollment.
const _policyForDevice = (device: any, policies: any): any | null => {
  if (!policies || typeof policies !== "object") return null;
  const key = device?.archClass ?? device?.platform;
  return policies[key] ?? policies[device?.platform] ?? null;
};

// The payload the validators co-sign: binds the device + the exact boot that was attested, so a
// quorum vote is valid for THIS enrollment only (not replayable to another device or boot).
const enrollmentPayloadHash = (device: any, attestationHash: string): string => {
  const payload = {
    device_ref: device?.id ?? null,
    device_name: device?.deviceName ?? null,
    platform: device?.platform ?? null,
    arch_class: device?.archClass ?? null,
    attestation: attestationHash,
  };
  return "sha256:" + crypto.createHash("sha256").update(_canon(payload)).digest("hex");
};

const enrollDevice = (
  input: {
    deviceIdentity: any;
    bootProof: any;
    attestationPolicies: any;      // { [archClass|platform]: AttestationPolicy }
    quorumProof: any;
  },
  opts?: { validateBootProof?: (r: any) => string[]; validateQuorum?: (p: any) => string[] },
) => {
  const { deviceIdentity: device, bootProof, attestationPolicies, quorumProof } = input;
  const reasons: string[] = [];

  // 1. attest the boot against the per-arch golden policy.
  const policy = _policyForDevice(device, attestationPolicies);
  if (!policy) {
    reasons.push(`no attestation policy for arch '${device?.archClass ?? device?.platform ?? "unknown"}' `
      + `— fail-closed (add the golden boot chain for this silicon)`);
  }
  const attestation = policy
    ? attestBoot(bootProof, policy, { validate: opts?.validateBootProof })
    : { attested: false, reasons: ["no policy"], sealed: null };
  if (!attestation.attested) {
    reasons.push("boot not attested: " + (attestation.reasons || []).join("; "));
  }

  // 2. the quorum must co-sign THIS enrollment (bound to device + attested boot).
  const attestationHash = attestation.sealed?.hash ?? "sha256:" + "0".repeat(64);
  const payloadHash = enrollmentPayloadHash(device, attestationHash);
  const quorum = verifyQuorum(quorumProof, { payloadHash, validate: opts?.validateQuorum });
  if (!quorum.ok) {
    reasons.push("quorum not satisfied: " + quorum.reasons.join("; "));
  }

  const enrolled = reasons.length === 0;
  const receipt: any = {
    enrolled,
    device_ref: device?.id ?? null,
    platform: device?.platform ?? null,
    arch_class: device?.archClass ?? null,
    attestation_ref: attestationHash,
    attestation_verity_bound: Boolean(attestation.sealed?.verity_bound),
    quorum_rule: quorumProof?.rule ?? null,
    enrollment_payload_hash: payloadHash,
    reason: reasons.join(" | ") || "boot attested and quorum co-signed the enrollment",
    enrolled_at: new Date().toISOString(),
  };
  receipt.hash = "sha256:" + crypto.createHash("sha256").update(_canon(receipt)).digest("hex");
  return { enrolled, reasons, receipt, attestation, quorum };
};

module.exports = { enrollDevice, enrollmentPayloadHash };
