process.env.FIREBASE_LOG_LEVEL = 'silent';
const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");

const PROJECT_ID = "socioprophet-web-dev-env";

test("Firestore rules: users self-access only; intake collections denied to clients; default deny elsewhere", async (t) => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });

  t.after(async () => {
    await testEnv.cleanup();
  });

  const alice = testEnv.authenticatedContext("alice").firestore();
  const bob = testEnv.authenticatedContext("bob").firestore();
  const anon = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(alice.doc("users/alice").set({ hello: "world" }));
  await assertSucceeds(alice.doc("users/alice").get());

  await assertFails(alice.doc("users/bob").get());
  await assertFails(bob.doc("users/alice").get());

  // lead_intake is server-only
  await assertFails(anon.doc("lead_intake/x1").set({
    surface: "academy",
    audience: "learner",
    email: "dev-test@example.com"
  }));
  await assertFails(anon.doc("lead_intake/x1").get());

  // notification_outbox is server-only
  await assertFails(anon.doc("notification_outbox/x1").get());
  await assertFails(anon.doc("notification_outbox/x1").set({
    kind: "lead_intake_created"
  }));

  // default deny
  await assertFails(alice.doc("posts/x").set({ ownerUid: "alice" }));
  await assertFails(alice.doc("anything/x").get());

  assert.ok(true);
});
