#!/usr/bin/env node
// Admin: set a user's image-builder tier. Run with application-default or a
// service-account credential that can write Firestore. Tier is server-only
// (users cannot self-grant it — see firestore.rules).
//
//   node scripts/set-tier.mjs <uid> <free|paid|premium>
//
// Resolve a uid from an email first with:
//   node scripts/set-tier.mjs --email user@example.com   (prints the uid)
import admin from "firebase-admin";

const [, , a, b] = process.argv;
if (!admin.apps.length) {
  admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT });
}

const usage = () => {
  console.error("usage: set-tier.mjs <uid> <free|paid|premium>  |  set-tier.mjs --email <email>");
  process.exit(1);
};

if (a === "--email") {
  if (!b) usage();
  const u = await admin.auth().getUserByEmail(b);
  console.log(u.uid);
  process.exit(0);
}

const VALID = ["free", "paid", "premium"];
if (!a || !VALID.includes(b)) usage();

await admin.firestore().collection("users").doc(a).set(
  { tier: b, tierUpdatedAt: admin.firestore.FieldValue.serverTimestamp() },
  { merge: true },
);
console.log(`set users/${a}.tier = ${b}`);
process.exit(0);
