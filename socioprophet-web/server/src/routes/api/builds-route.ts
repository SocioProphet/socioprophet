export {};
// /api/builds — self-serve SourceOS image builds (authenticated).
//   POST /api/builds       create a build from a spec (tier-gated), dispatch it
//   GET  /api/builds        list the caller's builds
//   GET  /api/builds/:id    one build + live status (reflected from GCS)
const express = require("express");
const { admin } = require("../../middleware/auth");
const { dispatchBuild, readBuildStatus } = require("../../services/buildOrchestrator");
const contracts = require("../../contracts");

const router = express.Router();
const db = () => admin.firestore();

// Tier policy: what each tier may customize. Enforced server-side.
const TIER_POLICY: any = {
  free:    { editions: ["desktop", "server", "edge"], arches: ["x86_64", "aarch64"], maxPackages: 10, services: false,        users: false, moduleEditor: false, dailyBuilds: 3 },
  paid:    { editions: ["desktop", "server", "edge"], arches: ["x86_64", "aarch64"], maxPackages: 100, services: ["openssh", "docker"], users: true, moduleEditor: false, dailyBuilds: 50 },
  premium: { editions: ["desktop", "server", "edge"], arches: ["x86_64", "aarch64"], maxPackages: 1000, services: ["openssh", "docker"], users: true, moduleEditor: true, dailyBuilds: 1000 },
};

const getTier = async (uid: string): Promise<string> => {
  const snap = await db().collection("users").doc(uid).get();
  return (snap.exists && snap.data()?.tier) || "free";
};

// Validate a spec against the caller's tier policy. Returns [ok, errorOrSpec].
const validateSpec = (spec: any, policy: any): [boolean, any] => {
  if (!spec || typeof spec !== "object") return [false, "spec required"];
  const edition = spec.edition || "desktop";
  const arch = spec.arch || "x86_64";
  if (!policy.editions.includes(edition)) return [false, `edition ${edition} not allowed on your plan`];
  if (!policy.arches.includes(arch)) return [false, `arch ${arch} not allowed on your plan`];
  const hostname = spec.hostname || "sourceos";
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(hostname)) return [false, "invalid hostname"];
  const packages = Array.isArray(spec.packages) ? spec.packages : [];
  if (packages.length > policy.maxPackages) return [false, `too many packages (max ${policy.maxPackages})`];
  for (const p of packages) {
    if (typeof p !== "string" || !/^[a-zA-Z0-9._-]+$/.test(p)) return [false, `invalid package: ${p}`];
  }
  if (spec.services && !policy.services) return [false, "services not available on your plan"];
  if (spec.users && !policy.users) return [false, "custom users not available on your plan"];
  if (spec.moduleSnippet && !policy.moduleEditor) return [false, "module editor is a premium feature"];
  return [true, { edition, arch, hostname, packages, services: spec.services || {}, users: spec.users || [] }];
};

router.post("/", async (req: any, res: any) => {
  const uid = req.uid;
  try {
    const tier = await getTier(uid);
    const policy = TIER_POLICY[tier] || TIER_POLICY.free;

    // Rate limit (builds today).
    const since = new Date(); since.setHours(0, 0, 0, 0);
    const todays = await db().collection("users").doc(uid).collection("builds")
      .where("createdAt", ">=", since).get();
    if (todays.size >= policy.dailyBuilds) {
      return res.status(429).json({ error: `daily build limit reached (${policy.dailyBuilds})` });
    }

    const [ok, result] = validateSpec(req.body?.spec, policy);
    if (!ok) return res.status(400).json({ error: result });
    const spec = result;
    const target = spec.target === "netboot" ? "netboot" : "iso";

    const doc = await db().collection("users").doc(uid).collection("builds").add({
      spec, tier, status: "queued",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Conform: persist a canonical sourceos-spec BuildRequest alongside the build.
    const buildRequest = contracts.buildRequest(doc.id, uid, spec, target);
    const reqErrors = contracts.validate("BuildRequest", buildRequest);
    if (reqErrors.length) {
      await doc.update({ status: "error", error: "BuildRequest not spec-conformant: " + reqErrors.join("; ") });
      return res.status(500).json({ error: "internal: non-conformant BuildRequest", details: reqErrors });
    }
    await doc.update({ buildRequest });

    try {
      const dispatch = await dispatchBuild(uid, doc.id, spec, tier);
      await doc.update({ status: "dispatched", lane: dispatch.lane });
    } catch (err: any) {
      await doc.update({ status: "error", error: String(err?.message || err) });
      return res.status(502).json({ error: "build dispatch failed", buildId: doc.id });
    }
    return res.status(201).json({ buildId: doc.id, status: "dispatched" });
  } catch (err: any) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

router.get("/", async (req: any, res: any) => {
  const uid = req.uid;
  const snap = await db().collection("users").doc(uid).collection("builds")
    .orderBy("createdAt", "desc").limit(50).get();
  const builds = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  return res.json({ builds });
});

// Caller's tier + what that tier may customize (for UI gating; server still enforces).
router.get("/whoami", async (req: any, res: any) => {
  const tier = await getTier(req.uid);
  const policy = TIER_POLICY[tier] || TIER_POLICY.free;
  return res.json({ uid: req.uid, email: req.userEmail || null, tier, policy });
});

router.get("/:id", async (req: any, res: any) => {
  const uid = req.uid;
  const ref = db().collection("users").doc(uid).collection("builds").doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "not found" });

  // Reflect live status from the build's GCS status.json.
  const live = await readBuildStatus(uid, req.params.id);
  if (live?.status && live.status !== snap.data()?.status) {
    const update: any = { status: live.status };
    if (live.artifact) update.artifact = live.artifact;
    // On a terminal status, emit a spec-conformant BuildValidationEvidenceBundle
    // — "validated" now means an evidence record exists, not a bucket glance.
    if (live.status === "complete" || live.status === "error") {
      const edition = snap.data()?.spec?.edition || "desktop";
      const bundle = contracts.evidenceBundle(req.params.id, edition, live.status === "complete", live.artifact || null);
      const errs = contracts.validate("BuildValidationEvidenceBundle", bundle);
      if (!errs.length) update.evidence = bundle;
      else update.evidenceError = errs.join("; ");
    }
    await ref.update(update);
  }
  const fresh = await ref.get();
  return res.json({ id: fresh.id, ...fresh.data() });
});

module.exports = router;
