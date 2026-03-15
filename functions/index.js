const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

exports.leadCapture = onRequest(async (req, res) => {
  res.set("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method-not-allowed" });
  }

  try {
    const body = req.body || {};

    // honeypot: if filled, pretend success and drop
    if (body.company || body.website || body.hp) {
      return res.status(200).json({ ok: true, dropped: true });
    }

    const email = String(body.email || "").trim().toLowerCase();
    const surface = String(body.surface || "").trim().toLowerCase();
    const audience = String(body.audience || "").trim().toLowerCase();

    if (!email || !surface || !audience) {
      return res.status(400).json({ ok: false, error: "missing-required-fields" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: "invalid-email" });
    }

    const doc = {
      surface,
      audience,
      email,
      intent: body.intent || "",
      reason: body.reason || "",
      notes: body.notes || "",
      stage: body.stage || "",
      org_type: body.org_type || "",
      mission_area: body.mission_area || "",
      oversight_model: body.oversight_model || "",
      impact: body.impact || "",
      restricted_use_ack: !!body.restricted_use_ack,
      page: body.page || "",
      referrer: body.referrer || "",
      utm_source: body.utm_source || "",
      utm_medium: body.utm_medium || "",
      utm_campaign: body.utm_campaign || "",
      userAgent: req.get("user-agent") || "",
      ip: req.ip || "",
      status: "new",
      createdAt: FieldValue.serverTimestamp(),
    };

    const ref = await db.collection("lead_intake").add(doc);

    const outbox = {
      kind: "lead_intake_created",
      leadId: ref.id,
      createdAt: FieldValue.serverTimestamp(),
      status: "pending",
      destination: {
        mode: "founder_controlled",
        channel: "intake"
      },
      summary: {
        surface,
        audience,
        email,
        intent: doc.intent,
        reason: doc.reason,
        page: doc.page
      }
    };
    if (doc.platform) outbox.platform = doc.platform;
    if (doc.experiment) outbox.experiment = doc.experiment;
    if (doc.policy) outbox.policy = doc.policy;

    await db.collection("notification_outbox").add(outbox);
    logger.info("leadCapture stored", { id: ref.id, surface, audience, email });

    return res.status(200).json({ ok: true, id: ref.id });
  } catch (err) {
    logger.error("leadCapture failed", err);
    return res.status(500).json({ ok: false, error: "internal-error" });
  }
});
