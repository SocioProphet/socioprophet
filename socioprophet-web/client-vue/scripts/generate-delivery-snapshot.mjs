#!/usr/bin/env node
/**
 * generate-delivery-snapshot.mjs — compute the delivery/sprint snapshot from
 * REAL merge and issue evidence, and emit a typed module the cockpit renders.
 *
 * Design rule from registry/board-spec.yaml: GitHub Projects are a render
 * target, not the truth. Merged PRs and issue events are the evidence; the
 * board is a view of them.
 *
 * FAILS CLOSED. If live evidence cannot be collected it emits a snapshot with
 * sourceMode 'fixture' and an unverified gate rather than inventing numbers.
 * It never fabricates a 'measured' basis.
 *
 *   node scripts/generate-delivery-snapshot.mjs [--repo owner/name] [--days 14] [--out path]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const REPO = argOf('--repo', 'SocioProphet/socioprophet');
const DAYS = Number(argOf('--days', '14'));
const OUT = argOf('--out', 'src/data/deliverySnapshot.ts');
const AGING_DAYS = 7;

const gh = (endpoint) => {
  const raw = execFileSync('gh', ['api', endpoint, '--paginate'], {
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
  // --paginate concatenates JSON arrays; stitch them.
  return JSON.parse(raw.replace(/\]\s*\[/g, ','));
};

const daysBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
const sinceIso = new Date(Date.now() - DAYS * 86400000).toISOString();

let live = true;
let commit = 'unknown';
let mergedPrs = [];
let openPrs = [];
let openIssues = [];
let closedIssues = [];

try {
  commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
} catch { /* not a repo — leave 'unknown' */ }

try {
  const prs = gh(`repos/${REPO}/pulls?state=all&per_page=100&sort=updated&direction=desc`);
  mergedPrs = prs.filter((p) => p.merged_at && p.merged_at >= sinceIso && p.base?.ref === 'master');
  openPrs = prs.filter((p) => p.state === 'open');
  const issues = gh(`repos/${REPO}/issues?state=all&per_page=100&since=${sinceIso}`)
    .filter((i) => !i.pull_request);
  openIssues = issues.filter((i) => i.state === 'open');
  closedIssues = issues.filter((i) => i.state === 'closed' && i.closed_at >= sinceIso);
} catch (err) {
  live = false;
  process.stderr.write(`[delivery-snapshot] live collection failed, falling back to fixture: ${err.message}\n`);
}

// ---- metrics (only 'measured' when actually computed from evidence) --------
const cycleTimes = mergedPrs.map((p) => daysBetween(p.created_at, p.merged_at));
const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round(((s[m - 1] + s[m]) / 2) * 10) / 10;
};
const agingPrs = openPrs.filter((p) => daysBetween(p.created_at, new Date().toISOString()) > AGING_DAYS);

const basis = live ? 'measured' : 'estimated';
const ev = (q) => (live ? q : '');

const metrics = [
  { id: 'throughput', label: 'Throughput', value: mergedPrs.length, unit: 'count', basis,
    evidence: ev(`gh api repos/${REPO}/pulls merged_at>=${sinceIso.slice(0, 10)} base=master`),
    better: 'up', note: `PRs merged to master in the last ${DAYS} days.` },
  { id: 'cycle-time', label: 'Median cycle time', value: median(cycleTimes), unit: 'days', basis,
    evidence: ev('median(merged_at - created_at) over merged PRs'),
    better: 'down', note: 'Open to merge, median across the window.' },
  { id: 'wip', label: 'Work in progress', value: openPrs.length, unit: 'count', basis,
    evidence: ev(`gh api repos/${REPO}/pulls state=open`),
    better: 'down', note: 'Open pull requests right now.' },
  { id: 'aging', label: 'Aging WIP', value: agingPrs.length, unit: 'count', basis,
    evidence: ev(`open PRs older than ${AGING_DAYS}d`),
    better: 'down', note: `Open PRs older than ${AGING_DAYS} days — the flow risk.` },
  { id: 'issues-closed', label: 'Issues closed', value: closedIssues.length, unit: 'count', basis,
    evidence: ev(`gh api repos/${REPO}/issues state=closed since=${sinceIso.slice(0, 10)}`),
    better: 'up', note: `Issues closed in the last ${DAYS} days.` },
  { id: 'issues-open', label: 'Open issues', value: openIssues.length, unit: 'count', basis,
    evidence: ev(`gh api repos/${REPO}/issues state=open`),
    better: 'down', note: 'Open issues touched in the window.' },
];

// ---- board columns, derived from real PR/issue state -----------------------
const columns = [
  { name: 'Open (issues)', count: openIssues.length, aging: openIssues.filter((i) => daysBetween(i.created_at, new Date().toISOString()) > AGING_DAYS).length },
  { name: 'In review (PRs)', count: openPrs.length, wipLimit: 10, aging: agingPrs.length },
  { name: `Merged (${DAYS}d)`, count: mergedPrs.length, aging: 0 },
  { name: `Closed (${DAYS}d)`, count: closedIssues.length, aging: 0 },
];

const riskOf = (ageDays) => (ageDays > 14 ? 'high' : ageDays > AGING_DAYS ? 'medium' : 'low');
const items = openPrs.slice(0, 14).map((p) => {
  const ageDays = daysBetween(p.created_at, new Date().toISOString());
  return {
    ref: `#${p.number}`,
    title: (p.title || '').slice(0, 96),
    status: p.draft ? 'Draft' : 'In review',
    lane: p.base?.ref ?? 'master',
    ageDays,
    risk: riskOf(ageDays),
    blocked: Boolean(p.draft) || ageDays > 14,
  };
});

// ---- CI gates — fail closed -----------------------------------------------
const gates = [
  { name: 'Evidence collected', status: live ? 'pass' : 'fail',
    detail: live ? 'Snapshot computed from live merge and issue evidence.' : 'Live collection failed; snapshot is fixture-backed and must not drive decisions.' },
  { name: 'Aging WIP within threshold', status: !live ? 'unverified' : agingPrs.length <= 5 ? 'pass' : 'fail',
    detail: !live ? 'No evidence.' : `${agingPrs.length} PR(s) older than ${AGING_DAYS}d (threshold 5).` },
  { name: 'WIP limit respected', status: !live ? 'unverified' : openPrs.length <= 10 ? 'pass' : 'fail',
    detail: !live ? 'No evidence.' : `${openPrs.length} open PR(s) against a limit of 10.` },
];

const snapshot = {
  sourceMode: live ? 'live' : 'fixture',
  generatedAt: new Date().toISOString(),
  commit,
  workflowRun: process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL ?? 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null,
  repo: REPO,
  boundaryNotice: live
    ? `Computed from merged PRs and issue events on ${REPO} over the last ${DAYS} days. Board columns are derived from that evidence, not read from a Projects board — per registry/board-spec.yaml, Projects is a render target, not the truth. Sprint commitment is a declared field and is marked as such.`
    : 'Live collection failed. This snapshot is fixture-backed, every gate is unverified, and it must not be used to report delivery status.',
  sprint: {
    name: `Rolling ${DAYS}-day window`,
    startedAt: sinceIso,
    endsAt: new Date().toISOString(),
    committed: mergedPrs.length + openPrs.length,
    completed: mergedPrs.length,
    addedMidSprint: 0,
    carriedOver: openPrs.length,
  },
  metrics,
  columns,
  items,
  gates,
  boards: ['Portfolio Roadmap', 'Spec, Ontology & Contracts', 'Reasoning & Intelligence', 'Governance & Control Plane'],
};

const banner = `// GENERATED by scripts/generate-delivery-snapshot.mjs — do not edit by hand.
// Regenerated by CI on merge to master so the dashboard cannot drift from what shipped.
// sourceMode '${snapshot.sourceMode}' at commit ${snapshot.commit.slice(0, 7)}.
import type { DeliverySnapshot } from '../features/delivery/contract';

export const deliverySnapshot: DeliverySnapshot = ${JSON.stringify(snapshot, null, 2)} as const;
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, banner);
process.stdout.write(`[delivery-snapshot] ${snapshot.sourceMode} · ${mergedPrs.length} merged · ${openPrs.length} open PRs · ${closedIssues.length} issues closed → ${OUT}\n`);
if (!live) process.exitCode = 0; // emit the honest fixture; the GATE fails, not the build step
