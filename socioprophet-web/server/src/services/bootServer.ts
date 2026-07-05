export {};
// nlboot boot-server logic. Devices announce themselves with a claim code; we
// resolve the owning user + their assigned build and return BootInstructions
// (signed kernel/initramfs URLs + checksums + kargs) per the nlboot contract,
// or a TryAgainResponse when nothing is assigned/ready yet.
const { Storage } = require("@google-cloud/storage");
const { socbaseAdmin } = require("../middleware/auth");
const contracts = require("../contracts");
const { emitEvent } = require("./events");
const GCS_BUCKET = process.env.SOURCEOS_GCS_BUCKET || "sourceos-artifacts-socioprophet";
const SIGNED_TTL_MS = 15 * 60 * 1000;

const storage = new Storage();
const bucket = () => storage.bucket(GCS_BUCKET);

// claim code → { uid, deviceId } (top-level, server-written index).
const resolveClaim = async (claim: string) => {
  if (!claim) return null;
  const { data } = await socbaseAdmin.from("device_claims").select("uid, deviceId").eq("claim", claim).maybeSingle();
  return data;
};

const signed = async (path: string): Promise<string> => {
  const [url] = await bucket().file(path).getSignedUrl({
    action: "read", expires: Date.now() + SIGNED_TTL_MS,
  });
  return url;
};

// Resolve a completed netboot build into signed kernel/initramfs refs + sha + kargs.
const netbootArtifacts = async (uid: string, buildId: string) => {
  const prefix = `user-builds/${uid}/${buildId}`;
  let manifest: any;
  try {
    const [buf] = await bucket().file(`${prefix}/netboot-manifest.json`).download();
    manifest = JSON.parse(buf.toString());
  } catch {
    return null; // netboot artifacts not present (e.g. an ISO-only build)
  }
  return {
    kernelUrl: await signed(`${prefix}/kernel`),
    kernelSha: manifest.kernel?.sha256 || "",
    kargs: manifest.kernel?.args || "",
    initrdUrl: await signed(`${prefix}/initrd`),
    initrdSha: manifest.initramfs?.sha256 || "",
  };
};

// Build the CANONICAL NLBootPlan for a build, then derive the wire-shape
// nlboot.BootInstructions the device's nlbootd actually parses. The plan is the
// spec-conformant record; the instructions are the interop projection of it.
const planAndInstructions = async (uid: string, deviceId: string, buildId: string) => {
  const a = await netbootArtifacts(uid, buildId);
  if (!a) return null;
  const plan = contracts.nlBootPlan(deviceId, buildId, [
    { name: "kernel", artifactRef: a.kernelUrl, contentHash: `sha256:${a.kernelSha}` },
    { name: "initramfs", artifactRef: a.initrdUrl, contentHash: `sha256:${a.initrdSha}` },
  ]);
  const planErrors = contracts.validate("NLBootPlan", plan);
  const instructions = {
    _type: "nlboot.BootInstructions",
    kernel: { url: a.kernelUrl, checksum: `sha256:${a.kernelSha}`, args: a.kargs },
    initramfs: { url: a.initrdUrl, checksum: `sha256:${a.initrdSha}` },
  };
  return { plan, planErrors, instructions };
};

const tryAgain = (seconds = 30) => ({
  _type: "nlboot.TryAgainResponse",
  timeout_seconds: String(seconds),
});

// Handle one device announcement. `announce` = { claim, ids, info, nics, disks, displays }.
const handleAnnounce = async (announce: any) => {
  const claim = announce?.claim || announce?.ids?.claim;
  const ref = await resolveClaim(claim);
  if (!ref) return { http: 403, body: { error: "unknown claim code" } };

  await socbaseAdmin.from("devices").update({
    lastSeen: new Date().toISOString(),
    lastInventory: { ids: announce.ids || null, nics: announce.nics || null, disks: announce.disks || null, displays: announce.displays || null },
  }).eq("id", ref.deviceId).eq("uid", ref.uid);

  const { data: dev } = await socbaseAdmin.from("devices").select("*").eq("id", ref.deviceId).eq("uid", ref.uid).maybeSingle();
  if (!dev?.assignedBuildId) return { http: 200, body: tryAgain() };

  const { data: build } = await socbaseAdmin.from("builds").select("*").eq("id", dev.assignedBuildId).eq("uid", ref.uid).maybeSingle();
  if (!build || build.status !== "complete") return { http: 200, body: tryAgain() };

  const pi = await planAndInstructions(ref.uid, ref.deviceId, dev.assignedBuildId);
  if (!pi) return { http: 200, body: tryAgain() };

  // Persist the conformant NLBootPlan; serve the device its wire instructions.
  if (!pi.planErrors.length) {
    await socbaseAdmin.from("devices").update({ activeBootPlan: pi.plan }).eq("id", ref.deviceId).eq("uid", ref.uid);
  }
  return { http: 200, body: pi.instructions };
};

// A device reports a boot outcome → store a conformant BootProofRecord.
const handleBootProof = async (announce: any) => {
  const claim = announce?.claim;
  const ref = await resolveClaim(claim);
  if (!ref) return { http: 403, body: { error: "unknown claim code" } };
  const { data: dev } = await socbaseAdmin.from("devices").select("*").eq("id", ref.deviceId).eq("uid", ref.uid).maybeSingle();
  const planRef = dev?.activeBootPlan?.id || "urn:srcos:nlboot-plan:none";
  const proof = contracts.bootProofRecord(ref.deviceId, planRef, announce?.outcome || "failure");
  const errs = contracts.validate("BootProofRecord", proof);
  if (errs.length) return { http: 500, body: { error: "non-conformant BootProofRecord", details: errs } };
  await socbaseAdmin.from("boot_proofs").insert({ deviceId: ref.deviceId, proof });
  await emitEvent("srcos.builder.boot.proof", proof.deviceRef, proof.id,
    { outcome: proof.outcome, bootPlanRef: planRef }, "ops-history");
  return { http: 201, body: { recorded: proof.id, outcome: proof.outcome } };
};

module.exports = { handleAnnounce, handleBootProof, planAndInstructions };
