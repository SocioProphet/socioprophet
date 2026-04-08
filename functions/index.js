const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getProducer, buildEnvelope, getKafkaConfig } = require("./lib/kafkaRelay");

initializeApp();
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const RELEASE = {
  environment: process.env.APP_ENV || "dev",
  releaseId: process.env.RELEASE_ID || "academy-intake-dev-20260315-v3",
  surfaceRelease: process.env.SURFACE_RELEASE || "academy-v0.2",
  releaseSlot: process.env.RELEASE_SLOT || "green",
  deploymentStrategy: process.env.DEPLOYMENT_STRATEGY || "manual",
  releaseManifestRef: process.env.RELEASE_MANIFEST_REF || "release_manifests/academy-intake-dev-20260315-v3",
  handlerMode: "api_lead_v1",
  formSchemaVersion: "lead-intake-v3",
  firebaseAppId: process.env.FIREBASE_APP_ID || "1:515493591230:web:4744bd8ae63e9e689e86ef",
  firestoreRuleset: process.env.FIRESTORE_RULESET || "7f751ad2-d63a-4c13-94b0-9e255e0c94b5",
  appCheckMode: process.env.APP_CHECK_MODE || "off",
  privacyPolicyVersion: process.env.PRIVACY_POLICY_VERSION || "privacy-v0",
  termsVersion: process.env.TERMS_VERSION || "terms-v0",
  humanSafeguardsVersion: process.env.HUMAN_SAFEGUARDS_VERSION || "human-safeguards-v1",
};

function s(v, max = 4096) {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function b(v) {
  return v === true || v === "true" || v === "on" || v === 1 || v === "1";
}

function referrerDomain(url) {
  try { return url ? new URL(url).hostname : ""; } catch { return ""; }
}

function browserFromUA(ua) {
  const x = ua || "";
  if (/Firefox\/(\d+)/i.test(x)) return { family: "Firefox", major: (x.match(/Firefox\/(\d+)/i) || [])[1] || "" };
  if (/Edg\/(\d+)/i.test(x)) return { family: "Edge", major: (x.match(/Edg\/(\d+)/i) || [])[1] || "" };
  if (/Chrome\/(\d+)/i.test(x) && !/Edg\//i.test(x)) return { family: "Chrome", major: (x.match(/Chrome\/(\d+)/i) || [])[1] || "" };
  if (/Version\/(\d+).+Safari/i.test(x) && !/Chrome/i.test(x)) return { family: "Safari", major: (x.match(/Version\/(\d+)/i) || [])[1] || "" };
  return { family: "", major: "" };
}

function osFromUA(ua) {
  const x = ua || "";
  if (/Mac OS X/i.test(x)) return { family: "macOS", version: "" };
  if (/Windows NT/i.test(x)) return { family: "Windows", version: "" };
  if (/Android/i.test(x)) return { family: "Android", version: "" };
  if (/(iPhone|iPad|iPod)/i.test(x)) return { family: "iOS", version: "" };
  if (/Linux/i.test(x)) return { family: "Linux", version: "" };
  return { family: "", version: "" };
}

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

    if (body.company || body.website || body.hp) {
      return res.status(200).json({ ok: true, dropped: true });
    }

    const email = s(body.email, 320).trim().toLowerCase();
    const surface = s(body.surface, 64).trim().toLowerCase();
    const audience = s(body.audience, 64).trim().toLowerCase();

    if (!email || !surface || !audience) {
      return res.status(400).json({ ok: false, error: "missing-required-fields" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: "invalid-email" });
    }

    const host = req.get("x-forwarded-host") || req.get("host") || "";
    const trace = req.get("x-cloud-trace-context") || "";
    const userAgent = req.get("user-agent") || "";
    const acceptLanguage = req.get("accept-language") || "";
    const secChUa = req.get("sec-ch-ua") || "";
    const secChUaPlatform = req.get("sec-ch-ua-platform") || "";
    const secChUaMobile = req.get("sec-ch-ua-mobile") || "";
    const browser = browserFromUA(userAgent);
    const os = osFromUA(userAgent);

    const context = {
      page: s(body.page, 256),
      referrerUrl: s(body.referrer, 2048),
      referrerDomain: referrerDomain(s(body.referrer, 2048)),
      landingPath: s(body.landing_path, 256),
      ctaId: s(body.cta_id, 128),
      userAgent,
      acceptLanguage,
      secChUa,
      secChUaPlatform,
      secChUaMobile,
      browserFamily: s(body.browser_family, 64) || browser.family,
      browserMajor: s(body.browser_major, 32) || browser.major,
      osFamily: s(body.os_family, 64) || os.family,
      osVersion: s(body.os_version, 64) || os.version,
      deviceClass: s(body.device_class, 32),
      viewportBucket: s(body.viewport_bucket, 32),
      timezone: s(body.timezone, 64),
      ip: req.ip || "",
    };

    const platform = {
      environment: RELEASE.environment,
      surfaceId: surface,
      surfaceRoute: s(body.page, 256),
      surfaceRelease: RELEASE.surfaceRelease,
      releaseId: RELEASE.releaseId,
      releaseSlot: RELEASE.releaseSlot,
      deploymentStrategy: RELEASE.deploymentStrategy,
      deploymentChannel: host.includes("--") ? host.split("--")[1].split(".")[0] : "default",
      releaseManifestRef: RELEASE.releaseManifestRef,
      handlerMode: RELEASE.handlerMode,
      formSchemaVersion: RELEASE.formSchemaVersion,
      firebaseAppId: RELEASE.firebaseAppId,
      firestoreRuleset: RELEASE.firestoreRuleset,
      appCheckMode: RELEASE.appCheckMode,
      observerHost: host,
      observerPath: req.path || "",
      traceId: trace.split("/")[0] || "",
      functionService: process.env.K_SERVICE || "leadCapture",
      functionRevision: process.env.K_REVISION || "",
    };

    const experiment = {
      experimentId: s(body.experiment_id, 128),
      variantId: s(body.variant_id, 64) || "control",
      assignmentId: s(body.assignment_id, 128),
      ctaId: s(body.cta_id, 128),
      landingPath: s(body.landing_path, 256),
    };

    const policy = {
      privacyPolicyVersion: s(body.privacy_policy_version, 64) || RELEASE.privacyPolicyVersion,
      termsVersion: s(body.terms_version, 64) || RELEASE.termsVersion,
      humanSafeguardsVersion: RELEASE.humanSafeguardsVersion,
      consentAck: b(body.consent_ack),
    };

    const udm = {
      schemaVersion: "udm-v1",
      eventTypes: ["NETWORK_HTTP", "USER_RESOURCE_CREATION"],
      metadata: {
        productName: "SocioProphet Intake",
        productEventType: `${surface}_submit`,
        eventType: "NETWORK_HTTP",
      },
      principal: {
        ip: context.ip,
        userAgent: context.userAgent,
        browserFamily: context.browserFamily,
        browserMajor: context.browserMajor,
        osFamily: context.osFamily,
        osVersion: context.osVersion,
        deviceClass: context.deviceClass,
        acceptLanguage: context.acceptLanguage,
      },
      target: {
        url: context.page,
        surface,
        audience,
      },
      observer: {
        host: platform.observerHost,
        path: platform.observerPath,
        namespace: "socioprophet-intake",
        service: platform.functionService,
        revision: platform.functionRevision,
        environment: platform.environment,
      },
      network: {
        http: {
          method: req.method,
          referralUrl: context.referrerUrl,
          userAgent: context.userAgent,
          requestId: platform.traceId,
          protocol: req.get("x-forwarded-proto") || "",
          secChUa,
          secChUaPlatform,
          secChUaMobile,
        }
      },
      additional: {
        releaseId: platform.releaseId,
        releaseSlot: platform.releaseSlot,
        deploymentStrategy: platform.deploymentStrategy,
        formSchemaVersion: platform.formSchemaVersion,
        firebaseAppId: platform.firebaseAppId,
        firestoreRuleset: platform.firestoreRuleset,
        appCheckMode: platform.appCheckMode,
        experimentId: experiment.experimentId,
        variantId: experiment.variantId,
        assignmentId: experiment.assignmentId,
        ctaId: experiment.ctaId,
        landingPath: experiment.landingPath,
        privacyPolicyVersion: policy.privacyPolicyVersion,
        termsVersion: policy.termsVersion,
        humanSafeguardsVersion: policy.humanSafeguardsVersion,
        consentAck: policy.consentAck,
      }
    };

    const doc = {
      surface,
      audience,
      email,
      intent: s(body.intent, 256),
      reason: s(body.reason, 256),
      notes: s(body.notes, 4000),
      stage: s(body.stage, 64),
      org_type: s(body.org_type, 128),
      mission_area: s(body.mission_area, 128),
      oversight_model: s(body.oversight_model, 128),
      impact: s(body.impact, 2000),
      restricted_use_ack: b(body.restricted_use_ack),
      page: s(body.page, 256),
      referrer: s(body.referrer, 2048),
      utm_source: s(body.utm_source, 128),
      utm_medium: s(body.utm_medium, 128),
      utm_campaign: s(body.utm_campaign, 128),
      context,
      platform,
      experiment,
      policy,
      udm,
      userAgent,
      status: "new",
      createdAt: FieldValue.serverTimestamp(),
    };

    const ref = await db.collection("lead_intake").add(doc);

    await db.collection("release_manifests").doc(RELEASE.releaseId).set({
      releaseId: RELEASE.releaseId,
      environment: RELEASE.environment,
      surfaceRelease: RELEASE.surfaceRelease,
      releaseSlot: RELEASE.releaseSlot,
      deploymentStrategy: RELEASE.deploymentStrategy,
      releaseManifestRef: RELEASE.releaseManifestRef,
      handlerMode: RELEASE.handlerMode,
      formSchemaVersion: RELEASE.formSchemaVersion,
      firebaseAppId: RELEASE.firebaseAppId,
      firestoreRuleset: RELEASE.firestoreRuleset,
      appCheckMode: RELEASE.appCheckMode,
      privacyPolicyVersion: RELEASE.privacyPolicyVersion,
      termsVersion: RELEASE.termsVersion,
      humanSafeguardsVersion: RELEASE.humanSafeguardsVersion,
      functionService: process.env.K_SERVICE || "leadCapture",
      functionRevision: process.env.K_REVISION || "",
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

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
      },
      platform,
      experiment,
      policy,
      udm
    };

    await db.collection("notification_outbox").add(outbox);

    logger.info("leadCapture stored", {
      id: ref.id,
      surface,
      audience,
      email,
      releaseId: RELEASE.releaseId,
      slot: RELEASE.releaseSlot,
    });

    return res.status(200).json({
      ok: true,
      id: ref.id,
      releaseId: RELEASE.releaseId,
      releaseSlot: RELEASE.releaseSlot,
    });
  } catch (err) {
    logger.error("leadCapture failed", err);
    return res.status(500).json({ ok: false, error: "internal-error" });
  }
});


exports.publishPendingOutbox = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method-not-allowed" });
  }

  const cfg = getKafkaConfig();
  let producer;
  try {
    producer = await getProducer();
  } catch (err) {
    logger.error("publishPendingOutbox getProducer failed", err);
    return res.status(503).json({
      ok: false,
      error: "kafka-not-configured",
      detail: String(err && err.message ? err.message : err),
      config: { ...cfg, brokers: cfg.brokers.length }
    });
  }

  try {
    const snap = await db.collection("notification_outbox")
      .where("status", "==", "pending")
      .limit(10)
      .get();

    const results = [];

    for (const docSnap of snap.docs) {
      const raw = {
        name: docSnap.ref.path,
        fields: {}
      };
      const data = docSnap.data();

      const toFS = (obj) => {
        const out = {};
        for (const [k,v] of Object.entries(obj || {})) {
          if (typeof v === "string") out[k] = { stringValue: v };
          else if (typeof v === "boolean") out[k] = { booleanValue: v };
          else if (v && typeof v === "object" && !Array.isArray(v)) out[k] = { mapValue: { fields: toFS(v) } };
        }
        return out;
      };
      raw.fields = toFS(data);

      const envelope = buildEnvelope(raw);
      await producer.send({
        topic: cfg.topic,
        messages: [{
          key: envelope.lead_id || envelope.event_id,
          value: JSON.stringify(envelope)
        }]
      });

      await docSnap.ref.update({
        status: "published",
        publishedAt: FieldValue.serverTimestamp(),
        publishAttemptCount: FieldValue.increment(1),
        kafka: {
          topic: cfg.topic,
          clientId: cfg.clientId,
        }
      });

      results.push({ id: docSnap.id, leadId: envelope.lead_id, status: "published" });
    }

    await producer.disconnect();
    return res.status(200).json({ ok: true, count: results.length, results });
  } catch (err) {
    if (producer) {
      try { await producer.disconnect(); } catch {}
    }
    logger.error("publishPendingOutbox failed", err);
    return res.status(500).json({ ok: false, error: "internal-error" });
  }
});
