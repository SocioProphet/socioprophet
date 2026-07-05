export {};
// /api/fleet — authenticated device-fleet management for the nlboot premium tier.
//   POST /api/fleet/devices            register a device, get a claim code
//   GET  /api/fleet/devices            list the caller's devices
//   POST /api/fleet/devices/:id/assign assign a (completed netboot) build
const express = require("express");
const crypto = require("crypto");
const { socbaseAdmin } = require("../../middleware/auth");
const contracts = require("../../contracts");

const router = express.Router();

const getTier = async (uid: string): Promise<string> => {
  const { data } = await socbaseAdmin.from("profiles").select("tier").eq("uid", uid).maybeSingle();
  return data?.tier || "free";
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
  const deviceId = crypto.randomUUID();

  // Conform: a registered device is a canonical DeviceIdentity.
  const identity = contracts.deviceIdentity(deviceId, name, uid);
  const idErrors = contracts.validate("DeviceIdentity", identity);
  if (idErrors.length) return res.status(500).json({ error: "non-conformant DeviceIdentity", details: idErrors });

  const { error: devErr } = await socbaseAdmin.from("devices").insert({
    id: deviceId, uid, name, claimCode: claim, assignedBuildId: null, identity, lastSeen: null,
  });
  if (devErr) return res.status(500).json({ error: "device registration failed" });
  // Top-level index the unauth /boot/announce resolves against.
  await socbaseAdmin.from("device_claims").insert({ claim, uid, deviceId });

  return res.status(201).json({ deviceId, name, claimCode: claim, identityRef: identity.id });
});

router.get("/devices", async (req: any, res: any) => {
  const uid = req.uid;
  const { data } = await socbaseAdmin.from("devices").select("*").eq("uid", uid).order("createdAt", { ascending: false });
  return res.json({ devices: data || [] });
});

router.post("/devices/:id/assign", async (req: any, res: any) => {
  const uid = req.uid;
  if (!(await requirePremium(uid, res))) return;
  const buildId = req.body?.buildId;
  if (!buildId) return res.status(400).json({ error: "buildId required" });

  const { data: build } = await socbaseAdmin.from("builds").select("id").eq("id", buildId).eq("uid", uid).maybeSingle();
  if (!build) return res.status(404).json({ error: "build not found" });

  const { data: device } = await socbaseAdmin.from("devices").select("id").eq("id", req.params.id).eq("uid", uid).maybeSingle();
  if (!device) return res.status(404).json({ error: "device not found" });
  await socbaseAdmin.from("devices").update({ assignedBuildId: buildId, assignedAt: new Date().toISOString() }).eq("id", req.params.id);

  // Device picks this up on its next announce/heartbeat.
  return res.json({ deviceId: req.params.id, assignedBuildId: buildId });
});

module.exports = router;
