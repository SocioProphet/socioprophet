export {};
// nlboot boot-server logic. Devices announce themselves with a claim code; we
// resolve the owning user + their assigned build and return BootInstructions
// (signed kernel/initramfs URLs + checksums + kargs) per the nlboot contract,
// or a TryAgainResponse when nothing is assigned/ready yet.
const admin = require("firebase-admin");
const GCS_BUCKET = process.env.SOURCEOS_GCS_BUCKET || "sourceos-artifacts-socioprophet";
const SIGNED_TTL_MS = 15 * 60 * 1000;

const db = () => admin.firestore();
const bucket = () => admin.storage().bucket(GCS_BUCKET);

// claim code → { uid, deviceId } (top-level, server-written index).
const resolveClaim = async (claim: string) => {
  if (!claim) return null;
  const snap = await db().collection("device_claims").doc(claim).get();
  return snap.exists ? snap.data() : null;
};

const signed = async (path: string): Promise<string> => {
  const [url] = await bucket().file(path).getSignedUrl({
    action: "read", expires: Date.now() + SIGNED_TTL_MS,
  });
  return url;
};

// Build the nlboot.BootInstructions for a completed netboot build.
const bootInstructionsFor = async (uid: string, buildId: string) => {
  const prefix = `user-builds/${uid}/${buildId}`;
  let manifest: any;
  try {
    const [buf] = await bucket().file(`${prefix}/netboot-manifest.json`).download();
    manifest = JSON.parse(buf.toString());
  } catch {
    return null; // netboot artifacts not present (e.g. an ISO-only build)
  }
  return {
    _type: "nlboot.BootInstructions",
    kernel: {
      url: await signed(`${prefix}/kernel`),
      checksum: `sha256:${manifest.kernel?.sha256 || ""}`,
      args: manifest.kernel?.args || "",
    },
    initramfs: {
      url: await signed(`${prefix}/initrd`),
      checksum: `sha256:${manifest.initramfs?.sha256 || ""}`,
    },
  };
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

  const devRef = db().collection("users").doc(ref.uid).collection("devices").doc(ref.deviceId);
  await devRef.set({
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    lastInventory: { ids: announce.ids || null, nics: announce.nics || null, disks: announce.disks || null, displays: announce.displays || null },
  }, { merge: true });

  const dev = (await devRef.get()).data() || {};
  if (!dev.assignedBuildId) return { http: 200, body: tryAgain() };

  const build = (await db().collection("users").doc(ref.uid).collection("builds").doc(dev.assignedBuildId).get()).data();
  if (!build || build.status !== "complete") return { http: 200, body: tryAgain() };

  const instr = await bootInstructionsFor(ref.uid, dev.assignedBuildId);
  if (!instr) return { http: 200, body: tryAgain() };
  return { http: 200, body: instr };
};

module.exports = { handleAnnounce, bootInstructionsFor };
