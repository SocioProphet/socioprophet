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

test("Firestore rules: users self-access only; lead_intake create-only; default deny elsewhere", async (t) => {
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

  const validLead = {
    surface: "academy",
    audience: "learner",
    email: "dev-test@example.com",
    intent: "Learn cybernetics systems",
    reason: "I want a serious systems learning path",
    notes: "rules smoke test",
    page: "/academy/apply/",
    referrer: "",
    ts: 1710000000000,
    hp: ""
  };

  await assertSucceeds(anon.doc("lead_intake/x1").set(validLead));
  await assertFails(anon.doc("lead_intake/x1").get());
  await assertFails(anon.doc("lead_intake/x1").update({ notes: "changed" }));
  await assertFails(anon.doc("lead_intake/x1").delete());

  await assertFails(anon.doc("lead_intake/x2").set({
    surface: "academy",
    audience: "learner"
  }));

  assert.ok(true);
});
