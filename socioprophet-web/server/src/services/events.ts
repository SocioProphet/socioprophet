export {};
// Emit builder lifecycle events onto the event planes. Builds a conformant
// EventEnvelope and writes it to notification_outbox — the same outbox the
// existing Kafka relay (functions/publishPendingOutbox) drains to the planes.
const admin = require("firebase-admin");
const contracts = require("../contracts");

// emitEvent(eventType, subjectId, objectId, payload, channel)
// Returns the envelope (or null + logs if it would be non-conformant).
const emitEvent = async (
  eventType: string, subjectId: string, objectId: string,
  payload: any = {}, channel = "ops-history",
) => {
  const envelope = contracts.eventEnvelope(eventType, subjectId, objectId, payload);
  const errs = contracts.validate("EventEnvelope", envelope);
  if (errs.length) { console.error("non-conformant EventEnvelope, dropping", eventType, errs); return null; }
  await admin.firestore().collection("notification_outbox").add({
    kind: eventType,
    event: envelope,
    status: "pending",
    destination: { mode: "system", channel },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return envelope;
};

module.exports = { emitEvent };
