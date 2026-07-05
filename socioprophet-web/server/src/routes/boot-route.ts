export {};
// /boot — UNAUTHENTICATED nlboot provisioning endpoint. Devices have no Socbase
// token; they authenticate with the claim code on their boot drive. Mounted
// WITHOUT requireAuth (see server.ts).
const express = require("express");
const { handleAnnounce, handleBootProof } = require("../services/bootServer");

const router = express.Router();

// The nlboot "wlserver" announcement: device POSTs inventory + claim code,
// server returns BootInstructions or TryAgainResponse.
router.post("/announce", async (req: any, res: any) => {
  try {
    const { http, body } = await handleAnnounce(req.body || {});
    return res.status(http).json(body);
  } catch (err: any) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

// Device reports a boot outcome → server records a BootProofRecord.
//   { claim, outcome: success|partial|failure|aborted }
router.post("/proof", async (req: any, res: any) => {
  try {
    const { http, body } = await handleBootProof(req.body || {});
    return res.status(http).json(body);
  } catch (err: any) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

module.exports = router;
