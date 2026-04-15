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

const RULES = fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8");
const FIRESTORE_CONFIG = { rules: RULES, host: "127.0.0.1", port: 8080 };

test("Firestore rules: users self-access only; intake collections denied to clients; default deny elsewhere", async (t) => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: FIRESTORE_CONFIG,
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

  // posts: wrong shape must fail even for authenticated users
  await assertFails(alice.doc("posts/x").set({ ownerUid: "alice" }));
  await assertFails(alice.doc("anything/x").get());

  assert.ok(true);
});

test("Firestore rules: posts - create, read, upvote, delete", async (t) => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID + "-posts",
    firestore: FIRESTORE_CONFIG,
  });

  t.after(async () => {
    await testEnv.cleanup();
  });

  const alice = testEnv.authenticatedContext("alice").firestore();
  const bob = testEnv.authenticatedContext("bob").firestore();
  const anon = testEnv.unauthenticatedContext().firestore();

  const validPost = {
    title: "Test Article",
    url: "https://example.com/article",
    source: "Example",
    submittedBy: "alice",
    createdAt: new Date(),
    upvotes: 0,
    tags: ["tech", "news"],
    type: "article",
  };

  // anyone can read posts
  await assertSucceeds(anon.collection("posts").get());

  // signed-in user can create a valid post attributed to themselves
  await assertSucceeds(alice.doc("posts/p1").set(validPost));

  // cannot create post attributed to another user
  await assertFails(alice.doc("posts/p2").set({ ...validPost, submittedBy: "bob" }));

  // cannot create post with initial upvotes != 0
  await assertFails(alice.doc("posts/p3").set({ ...validPost, upvotes: 5 }));

  // cannot create post with missing required fields
  await assertFails(alice.doc("posts/p4").set({ title: "Missing fields" }));

  // unauthenticated user cannot create
  await assertFails(anon.doc("posts/p5").set(validPost));

  // any signed-in user can increment upvotes by exactly 1
  await assertSucceeds(bob.doc("posts/p1").update({ upvotes: 1 }));

  // cannot increment by more than 1
  await assertFails(bob.doc("posts/p1").update({ upvotes: 99 }));

  // cannot update fields other than upvotes
  await assertFails(bob.doc("posts/p1").update({ title: "Hijacked" }));

  // only the submitter can delete
  await assertFails(bob.doc("posts/p1").delete());
  await assertSucceeds(alice.doc("posts/p1").delete());

  assert.ok(true);
});

test("Firestore rules: sources - create, read, update, delete", async (t) => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID + "-sources",
    firestore: FIRESTORE_CONFIG,
  });

  t.after(async () => {
    await testEnv.cleanup();
  });

  const alice = testEnv.authenticatedContext("alice").firestore();
  const bob = testEnv.authenticatedContext("bob").firestore();
  const anon = testEnv.unauthenticatedContext().firestore();

  const validSource = {
    name: "Hacker News",
    url: "https://news.ycombinator.com",
    registeredBy: "alice",
    createdAt: new Date(),
  };

  // anyone can read sources
  await assertSucceeds(anon.collection("sources").get());

  // signed-in user can register a source attributed to themselves
  await assertSucceeds(alice.doc("sources/s1").set(validSource));

  // cannot register a source attributed to another user
  await assertFails(alice.doc("sources/s2").set({ ...validSource, registeredBy: "bob" }));

  // cannot create source with missing required fields
  await assertFails(alice.doc("sources/s3").set({ name: "Incomplete" }));

  // unauthenticated user cannot register a source
  await assertFails(anon.doc("sources/s4").set(validSource));

  // registerer can update their own source
  await assertSucceeds(alice.doc("sources/s1").update({ name: "HN Updated" }));

  // another user cannot update or delete the source
  await assertFails(bob.doc("sources/s1").update({ name: "Hijacked" }));
  await assertFails(bob.doc("sources/s1").delete());

  // registerer can delete their own source
  await assertSucceeds(alice.doc("sources/s1").delete());

  assert.ok(true);
});
