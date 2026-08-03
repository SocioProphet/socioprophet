// Sovereign-cutover reconciliation test. Runs under plain node via type-stripping
// (no TS loader needed): `node test/delivery.reconcile.test.mjs`.
import { reconcile, isFullyMirrored } from '../src/services/mirrorReconcile.ts';
import { sovereignTasks, tasksAsIssues, threadsWire } from '../src/services/deliveryStore.ts';

let fail = 0;
const ck = (n, ok) => { console.log((ok ? 'ok   ' : 'FAIL ') + n); if (!ok) fail++; };

const sov = [
  { id: 'a', title: 'Alpha', status: 'todo' },
  { id: 'b', title: 'Beta', status: 'done' },
];

// 1. A faithful mirror → fully mirrored, no ops.
const faithful = reconcile('github', sov, [
  { sovereignId: 'a', title: 'Alpha', status: 'todo', ref: 'gh:1' },
  { sovereignId: 'b', title: 'Beta', status: 'done', ref: 'gh:2' },
]);
ck('faithful mirror → isFullyMirrored', isFullyMirrored(faithful));
ck('faithful mirror → all states mirrored', Object.values(faithful.states).every((s) => s === 'mirrored'));
ck('faithful mirror → zero ops', faithful.ops.length === 0);

// 2. A drifted mirror → drift detected, one UPDATE op on the MIRROR.
const drift = reconcile('github', sov, [
  { sovereignId: 'a', title: 'Alpha (stale)', status: 'todo', ref: 'gh:1' },
  { sovereignId: 'b', title: 'Beta', status: 'done', ref: 'gh:2' },
]);
ck('drift detected', drift.drifted.includes('a') && drift.states.a === 'drifted');
ck('drift → update op targets the mirror ref', drift.ops.some((o) => o.op === 'update' && o.ref === 'gh:1' && o.fields.title === 'Alpha'));

// 3. A missing mirror → sovereign_only, CREATE op.
const missing = reconcile('taskwarrior', sov, [{ sovereignId: 'a', title: 'Alpha', status: 'todo', ref: 'tw:1' }]);
ck('missing → sovereign_only', missing.sovereignOnly.includes('b') && missing.states.b === 'sovereign_only');
ck('missing → create op', missing.ops.some((o) => o.op === 'create' && o.sovereignId === 'b'));

// 4. An orphan mirror (no sovereign source) → FLAGGED, never deleted.
const orphan = reconcile('github', sov, [
  { sovereignId: 'a', title: 'Alpha', status: 'todo', ref: 'gh:1' },
  { sovereignId: 'ghost', title: 'Ghost', status: 'todo', ref: 'gh:99' },
]);
ck('orphan flagged', orphan.orphans.includes('gh:99'));
ck('orphan op is "orphan" (flag), never delete', orphan.ops.some((o) => o.op === 'orphan' && o.ref === 'gh:99'));

// 5. CUTOVER INVARIANT: reconciliation is one-directional — no op ever mutates
//    sovereign. Every op targets a mirror (create/update/orphan), never sovereign.
const allOps = [...faithful.ops, ...drift.ops, ...missing.ops, ...orphan.ops];
ck('one-directional: every op targets the mirror, never sovereign', allOps.every((o) => o.op === 'create' || o.op === 'update' || o.op === 'orphan'));

// 6. Store wire projections match the client adapter contracts.
const issues = tasksAsIssues();
ck('tasksAsIssues → github-issue shape', issues.every((i) => typeof i.number === 'number' && i.title && (i.state === 'open' || i.state === 'closed') && i.html_url.startsWith('https://')));
ck('tasksAsIssues carries sovereign provenance', issues.every((i) => typeof i.sovereign_id === 'string'));
ck('a done task projects to a closed issue', issues.find((i) => i.sovereign_id === 't-ops-cyber').state === 'closed');

const threads = threadsWire();
const taskIds = new Set(sovereignTasks.map((t) => t.id));
ck('threadsWire subjects reference real sovereign tasks', threads.every((t) => taskIds.has(t.subject_ref)));

console.log(fail ? `\n${fail} FAILED` : '\nall reconciliation + projection checks passed');
process.exit(fail ? 1 : 0);
