const { Kafka, logLevel } = require("kafkajs");
const { GoogleAuth } = require("google-auth-library");

function getKafkaConfig() {
  const brokers = (process.env.KAFKA_BROKERS || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);

  return {
    brokers,
    topic: process.env.KAFKA_TOPIC_INTAKE || "intake.leads.v1",
    clientId: process.env.KAFKA_CLIENT_ID || "socioprophet-intake-relay",
    mode: process.env.KAFKA_MODE || "disabled",
    principalEmail: process.env.KAFKA_PRINCIPAL_EMAIL || "",
  };
}

async function getProducer() {
  const { brokers, clientId, mode } = getKafkaConfig();
  if (!brokers.length || mode === "disabled") {
    throw new Error("Kafka not configured");
  }

  const config = {
    clientId,
    brokers,
    ssl: true,
    logLevel: logLevel.NOTHING,
  };

  if (mode === "oauthbearer_adc") {
    const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
    config.sasl = {
      mechanism: "oauthbearer",
      oauthBearerProvider: async () => {
        const token = await auth.getAccessToken();
        if (!token) throw new Error("Unable to obtain ADC access token");
        return { value: token };
      },
    };
  } else if (mode === "plain_adc") {
    const { principalEmail } = getKafkaConfig();
    if (!principalEmail) throw new Error("Missing KAFKA_PRINCIPAL_EMAIL");
    const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
    const token = await auth.getAccessToken();
    if (!token) throw new Error("Unable to obtain ADC access token");
    config.sasl = {
      mechanism: "plain",
      username: principalEmail,
      password: token,
    };
  } else {
    throw new Error(`Unsupported KAFKA_MODE: ${mode}`);
  }

  const kafka = new Kafka(config);
  const producer = kafka.producer();
  await producer.connect();
  return producer;
}

function buildEnvelope(outboxDoc) {
  const f = outboxDoc.fields || {};
  const mv = (x) => (x && x.mapValue && x.mapValue.fields) || {};
  const sv = (x) => (x && x.stringValue) || "";
  const tv = (x) => (x && x.timestampValue) || "";
  const summary = mv(f.summary);
  const platform = mv(f.platform);
  const experiment = mv(f.experiment);
  const policy = mv(f.policy);
  const udm = mv(f.udm);

  return {
    event_id: outboxDoc.name.split("/").pop(),
    event_type: sv(f.kind),
    event_version: 1,
    occurred_at: tv(f.createdAt),
    lead_id: sv(f.leadId),
    status: sv(f.status),
    summary: {
      surface: sv(summary.surface),
      audience: sv(summary.audience),
      email: sv(summary.email),
      intent: sv(summary.intent),
      reason: sv(summary.reason),
      page: sv(summary.page),
    },
    platform,
    experiment,
    policy,
    udm,
  };
}

module.exports = {
  getKafkaConfig,
  getProducer,
  buildEnvelope,
};
