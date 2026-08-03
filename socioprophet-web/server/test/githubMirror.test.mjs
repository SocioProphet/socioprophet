// Two-way GitHub mirror sync test. Runs on plain node via type-stripping:
//   node test/githubMirror.test.mjs
import { syncMirror, issueToRecord, markerFor } from '../src/services/githubMirror.ts';

let fail = 0;
const ck = (n, ok) => { console.log((ok ? 'ok   ' : 'FAIL ') + n); if (!ok) fail++; };

// A recording mock GhClient — the token is never needed here (minted in CI).
function mockClient(issues) {
  const calls = { create: [], update: [] };
  return {
    calls,
    async listIssues() { return issues; },
    async createIssue(repo, title, body, labels) { calls.create.push({ repo, title, labels }); return { number: 999, title, state: 'open', html_url: `https://x/${999}` }; },
    async updateIssue(repo, num, fields) { calls.update.push({ num, fields }); },
  };
}

const sovereign = [
  { id: 't-a', title: 'Task A', status: 'in_progress' },
  { id: 't-b', title: 'Task B', status: 'done' },       // sovereign-only → create
];
const issues = [
  { number: 1, title: 'Task A (stale title)', state: 'open', html_url: 'https://gh/1', body: `x ${markerFor('t-a')} y`, labels: [{ name: 'in progress' }] }, // drift (title)
  { number: 2, title: 'Ghost issue', state: 'open', html_url: 'https://gh/2', body: `${markerFor('t-ghost')}`, labels: [] }, // orphan
  { number: 3, title: 'Unmarked human issue', state: 'open', html_url: 'https://gh/3', body: 'no marker', labels: [] },       // ignored
];

// issueToRecord only picks up marker-carrying issues.
ck('marker parsed', issueToRecord(issues[0]).sovereignId === 't-a');
ck('unmarked issue ignored', issueToRecord(issues[2]) === null);

// DRY RUN — zero writes, but a full report.
const dry = await syncMirror(mockClient(issues), 'SocioProphet/delivery-excellence', sovereign, { apply: false });
ck('dry-run makes ZERO writes', dry.applied === false);
ck('dry-run plans a create for the sovereign-only task', dry.created.includes('t-b'));
ck('dry-run plans an update for the drifted task', dry.updated.includes('t-a'));
ck('dry-run flags the orphan', dry.flaggedOrphans.includes('https://gh/2'));

// APPLY — writes happen, but the orphan is only LABELLED (never closed/deleted).
const client = mockClient(issues);
const applied = await syncMirror(client, 'SocioProphet/delivery-excellence', sovereign, { apply: true });
ck('apply created the sovereign-only issue', client.calls.create.length === 1 && client.calls.create[0].title === 'Task B');
ck('apply updated the drifted issue title → sovereign', client.calls.update.some((c) => c.num === 1 && c.fields.title === 'Task A'));
ck('orphan is LABELLED, never closed/deleted', client.calls.update.some((c) => c.num === 2 && (c.fields.addLabels || []).includes('sovereign:orphan') && c.fields.state !== 'closed'));
ck('no update ever sets state on the orphan', !client.calls.update.some((c) => c.num === 2 && c.fields.state));
ck('apply report marks applied', applied.applied === true);

console.log(fail ? `\n${fail} FAILED` : '\nall github-mirror sync checks passed');
process.exit(fail ? 1 : 0);
