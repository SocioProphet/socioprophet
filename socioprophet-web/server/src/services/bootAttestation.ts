export {};
// Measured boot + remote attestation (canon L0 — the Genesis binding).
//
// A device's boot is a MEASURED chain: each stage records the content hash of the next
// (BootProofRecord.stageProofs). Attestation verifies that measured chain against a pinned
// golden policy — fail-closed. A device is trustworthy from power-on only if EVERY stage it
// ran was pinned and matched; an unpinned stage is an unmeasured surface and fails.
//
// It also closes the loop with the verified-immutable corpus (mount-intent, dm-verity): the
// rootfs stage's measured hash MUST equal the dm-verity root hash pinned in the deployment.
// So "the base is immutable" (verity) and "the base that booted is the pinned one"
// (attestation) become ONE chain of evidence, not two assertions.

const crypto = require("crypto");

// AttestationPolicy: the golden measured-boot chain for a device/edition.
//   expectedStages     — every stage the boot MUST run, with its pinned content hash.
//   rootfsStage/root   — bind the rootfs stage's hash to the dm-verity root (verity ↔ boot).
//   requireSignature   — the boot proof must be signed.
const _HASH = /^sha256:[0-9a-f]{64}$/;

const attestBoot = (
  record: any,
  policy: any,
  opts?: { validate?: (r: any) => string[] },
) => {
  const reasons: string[] = [];
  const pins: any[] = Array.isArray(policy?.expectedStages) ? policy.expectedStages : [];
  if (!pins.length) {
    // A policy with no pinned stages could "attest" anything — refuse to be theater.
    return { attested: false, reasons: ["attestation policy pins no stages — nothing measured"], sealed: null };
  }

  // 0. shape: a non-conformant BootProofRecord is not attestable.
  if (opts?.validate) {
    const errs = opts.validate(record);
    if (errs.length) reasons.push("BootProofRecord not conformant: " + errs.join("; "));
  }
  // 1. the boot must have succeeded.
  if (record?.outcome !== "success") reasons.push(`boot outcome '${record?.outcome}' is not success`);

  const stages: any[] = Array.isArray(record?.stageProofs) ? record.stageProofs : [];
  if (!stages.length) reasons.push("no stageProofs — an unmeasured boot cannot be attested");

  // 2. every stage that ran must have measured as 'verified' (the schema's pass verdict;
  //    skipped/failed/tampered are all non-attestable).
  for (const s of stages) {
    if (String(s?.verdict) !== "verified") {
      reasons.push(`stage '${s?.stageName}' verdict '${s?.verdict}' != verified`);
    }
  }

  const byName = new Map(stages.map((s: any) => [s.stageName, s]));
  const pinnedNames = new Set(pins.map((p: any) => p.stageName));

  // 3. every pinned stage must be present AND its measured hash must match exactly.
  for (const pin of pins) {
    const s = byName.get(pin.stageName);
    if (!s) { reasons.push(`expected stage '${pin.stageName}' missing from the boot proof`); continue; }
    if (s.contentHash !== pin.contentHash) {
      reasons.push(`stage '${pin.stageName}' hash mismatch (measured ${s.contentHash} != pinned ${pin.contentHash})`);
    }
  }
  // 3b. fail-closed: NO stage may run that isn't pinned (an unmeasured surface).
  for (const s of stages) {
    if (!pinnedNames.has(s.stageName)) {
      reasons.push(`stage '${s.stageName}' ran but is not pinned in the attestation policy (unmeasured surface)`);
    }
  }

  // 4. dm-verity binding: the rootfs stage's measured hash == the pinned verity root.
  if (policy?.rootfsVerityRoot) {
    if (!_HASH.test(policy.rootfsVerityRoot)) {
      reasons.push("rootfsVerityRoot must be sha256:<64hex>");
    }
    const stageName = policy.rootfsStage || "rootfs";
    const s = byName.get(stageName);
    if (!s) reasons.push(`rootfs stage '${stageName}' absent — cannot bind the dm-verity root`);
    else if (s.contentHash !== policy.rootfsVerityRoot) {
      reasons.push(`rootfs hash ${s.contentHash} != pinned dm-verity root ${policy.rootfsVerityRoot} (booted base is not the verified base)`);
    }
  }

  // 5. signed boot proof, if required.
  if (policy?.requireSignature && !record?.signature) {
    reasons.push("attestation policy requires a signed boot proof");
  }

  const attested = reasons.length === 0;
  const sealed: any = {
    attested,
    device_ref: record?.deviceRef ?? null,
    boot_plan_ref: record?.bootPlanRef ?? null,
    outcome: record?.outcome ?? null,
    measured_stages: stages.map((s: any) => ({ stage: s.stageName, hash: s.contentHash })),
    verity_bound: Boolean(policy?.rootfsVerityRoot),
    reason: reasons.join("; ") || "boot chain matches the pinned measured-boot policy",
    attested_at: new Date().toISOString(),
  };
  sealed.hash = "sha256:" + crypto.createHash("sha256")
    .update(JSON.stringify(sealed, Object.keys(sealed).sort())).digest("hex");
  return { attested, reasons, sealed };
};

module.exports = { attestBoot };
