export {};
// /api/fleet — authenticated device-fleet management for the nlboot premium tier.
//   POST /api/fleet/devices            register a device, get a claim code
//   GET  /api/fleet/devices            list the caller's devices
//   POST /api/fleet/devices/:id/assign assign a (completed netboot) build
const express = require("express");
const crypto = require("crypto");
const { admin } = require("../../middleware/auth");

const router = express.Router();
const db = () => admin.firestore();

const getTier = async (uid: string): Promise<string> => {
  const s = await db().collection("users").doc(uid).get();
  return (s.exists && s.data()?.tier) || "free";
};
const requirePremium = async (uid: string, res: any): Promise<boolean> => {
  if ((await getTier(uid)) !== "premium") {
    res.status(403).json({ error: "fleet management is a premium feature" });
    return false;
  }
  return true;
};

// Register a device → returns a claim code to put on the nlboot boot drive.
router.post("/devices", async (req: any, res: any) => {
  const uid = req.uid;
  if (!(await requirePremium(uid, res))) return;
  const name = String(req.body?.name || "device").slice(0, 64);
  const claim = crypto.randomBytes(18).toString("base64url");

  const devRef = db().collection("users").doc(uid).collection("devices").doc();
  await devRef.set({
    name, claimCode: claim, assignedBuildId: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(), lastSeen: null,
  });
  // Top-level index the unauth /boot/announce resolves against.
  await db().collection("device_claims").doc(claim).set({ uid, deviceId: devRef.id });

  return res.status(201).json({ deviceId: devRef.id, name, claimCode: claim });
});

router.get("/devices", async (req: any, res: any) => {
  const uid = req.uid;
  const snap = await db().collection("users").doc(uid).collection("devices").orderBy("createdAt", "desc").get();
  return res.json({ devices: snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) });
});

router.post("/devices/:id/assign", async (req: any, res: any) => {
  const uid = req.uid;
  if (!(await requirePremium(uid, res))) return;
  const buildId = req.body?.buildId;
  if (!buildId) return res.status(400).json({ error: "buildId required" });

  const build = await db().collection("users").doc(uid).collection("builds").doc(buildId).get();
  if (!build.exists) return res.status(404).json({ error: "build not found" });

  const devRef = db().collection("users").doc(uid).collection("devices").doc(req.params.id);
  if (!(await devRef.get()).exists) return res.status(404).json({ error: "device not found" });
  await devRef.set({ assignedBuildId: buildId, assignedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

  // Device picks this up on its next announce/heartbeat.
  return res.json({ deviceId: req.params.id, assignedBuildId: buildId });
});

module.exports = router;
