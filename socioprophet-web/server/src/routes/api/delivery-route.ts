export {};
// /api/delivery + /api/cowork — the sovereign delivery producer.
//   GET  /delivery/tasks       sovereign tasks in the github-issue mirror shape
//   GET  /cowork/threads       sovereign cowork threads
//   POST /delivery/reconcile   { target, mirror: MirrorRecord[] } → reconcile report
//
// The sovereign store is canonical; reconcile only ever converges the MIRROR toward
// sovereign (see services/mirrorReconcile.ts, validated in
// test/delivery.reconcile.test.mjs). Public read producer — the client adapters
// (deliveryExcellenceLive / coworkLive) fail closed when this is unreachable.
const express = require("express");
const router = express.Router();

// ESM services loaded via dynamic import (they are pure/validated modules).
const store = () => import("../../services/deliveryStore.ts");
const recon = () => import("../../services/mirrorReconcile.ts");

router.get("/delivery/tasks", async (_req: any, res: any) => {
  const { tasksAsIssues } = await store();
  return res.json({ issues: tasksAsIssues() });
});

router.get("/cowork/threads", async (_req: any, res: any) => {
  const { threadsWire } = await store();
  return res.json({ threads: threadsWire() });
});

router.post("/delivery/reconcile", async (req: any, res: any) => {
  const target = String(req.body?.target || "github");
  if (!["github", "taskwarrior", "cowork"].includes(target)) {
    return res.status(400).json({ error: "invalid target (github|taskwarrior|cowork)" });
  }
  const mirror = Array.isArray(req.body?.mirror) ? req.body.mirror : [];
  const { sovereignTasks } = await store();
  const { reconcile } = await recon();
  // Sovereign is the source of truth; the report's ops converge the mirror only.
  return res.json(reconcile(target, sovereignTasks, mirror));
});

module.exports = router;
