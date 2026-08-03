#!/usr/bin/env node
/**
 * generate-delivery-snapshot.mjs — compute the estate delivery snapshot from
 * REAL merge/issue evidence across the governed estate, and emit a typed module.
 *
 * Non-naive by construction:
 *  - Estate-wide rollup via the search API (one call per org per window) rather
 *    than paginating ~100 repos.
 *  - Throughput HISTORY in weekly buckets, which is what Monte Carlo resamples.
 *    We never average velocity.
 *  - Boards come from registry/board-spec.yaml — the declarative truth. GitHub
 *    Projects is a render target.
 *  - MoSCoW mix read from labels; when labels are absent we say the backlog is
 *    unprioritized instead of inventing a mix.
 *
 * FAILS CLOSED. Live collection failure emits sourceMode 'fixture' with failing
 * gates. It never fabricates a 'measured' basis.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const argOf = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const ORGS = argOf('--orgs', 'SocioProphet,SourceOS-Linux').split(',').map((s) => s.trim());
const WINDOW_DAYS = Number(argOf('--days', '14'));
const HISTORY_WEEKS = Number(argOf('--history-weeks', '10'));
const BOARD_SPEC = argOf('--board-spec', path.join(process.env.HOME ?? '', 'dev/sociosphere/registry/board-spec.yaml'));
const OUT = argOf('--out', 'src/data/deliverySnapshot.ts');
const AGING_DAYS = 7;
const WIP_LIMIT = 40;

const ymd = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const search = (q) => {
  const raw = execFileSync('gh', ['api', '-X', 'GET', 'search/issues', '-f', `q=${q}`, '--jq', '{n:.total_count,items:[.items[]|{r:.repository_url,t:.title,u:.html_url,c:.created_at,l:[.labels[].name],d:.draft}]}'],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  return JSON.parse(raw);
};
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

let live = true;
let commit = 'unknown';
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}

// ---- boards: the declarative truth -----------------------------------------
let boards = [];
let boardSpecSource = 'not found';
try {
  const yaml = fs.readFileSync(BOARD_SPEC, 'utf8');
  boards = [...yaml.matchAll(/^\s*-\s*title:\s*"([^"]+)"/gm)].map((m) => m[1]);
  boardSpecSource = BOARD_SPEC;
} catch { /* boards stay empty; reported honestly below */ }

// ---- estate rollup ----------------------------------------------------------
const since = ymd(daysAgo(WINDOW_DAYS));
let merged = 0, openPrs = 0, closedIssues = 0, openIssues = 0, arrivals = 0;
let perOrg = [];
let openItems = [];
let history = [];
let labelled = { must: 0, should: 0, could: 0, wont: 0 };
let labelsSeen = 0;

try {
  for (const org of ORGS) {
    const m = search(`org:${org} is:pr is:merged merged:>=${since}`); sleep(700);
    const o = search(`org:${org} is:pr is:open`); sleep(700);
    const ci = search(`org:${org} is:issue is:closed closed:>=${since}`); sleep(700);
    const oi = search(`org:${org} is:issue is:open`); sleep(700);
    // ARRIVALS must be a FLOW (opened during the window), never the open stock —
    // feeding a stock into Little's Law is the classic way to get a confident
    // wrong cycle time.
    const ar = search(`org:${org} is:pr created:>=${since}`); sleep(700);

    merged += m.n; openPrs += o.n; closedIssues += ci.n; openIssues += oi.n; arrivals += ar.n;
    perOrg.push({ org, merged: m.n, openPrs: o.n, closedIssues: ci.n, openIssues: oi.n });

    for (const it of o.items ?? []) {
      const age = Math.max(0, Math.round((Date.now() - new Date(it.c)) / 86400000));
      openItems.push({
        ref: (it.u || '').split('/').slice(-3).join('/').replace('/pull/', '#'),
        title: (it.t || '').slice(0, 88),
        status: it.d ? 'Draft' : 'In review',
        lane: (it.r || '').split('/').pop() ?? org,
        ageDays: age,
        risk: age > 14 ? 'high' : age > AGING_DAYS ? 'medium' : 'low',
        blocked: Boolean(it.d) || age > 14,
      });
    }
    // MoSCoW from labels on open issues.
    for (const it of oi.items ?? []) {
      for (const raw of it.l ?? []) {
        const l = raw.toLowerCase();
        if (l.includes('must')) { labelled.must += 1; labelsSeen += 1; }
        else if (l.includes('should')) { labelled.should += 1; labelsSeen += 1; }
        else if (l.includes('could')) { labelled.could += 1; labelsSeen += 1; }
        else if (l.includes("won't") || l === 'wontfix' || l.includes('wont-fix')) { labelled.wont += 1; labelsSeen += 1; }
      }
    }
  }

  // ---- throughput history in weekly buckets (the Monte Carlo samples) -------
  for (let w = 1; w <= HISTORY_WEEKS; w += 1) {
    const a = ymd(daysAgo(w * 7));
    const b = ymd(daysAgo((w - 1) * 7));
    let n = 0;
    for (const org of ORGS) { n += search(`org:${org} is:pr is:merged merged:${a}..${b}`).n; sleep(700); }
    history.unshift({ weekStart: a, weekEnd: b, merged: n });
  }
} catch (err) {
  live = false;
  process.stderr.write(`[delivery-snapshot] live collection failed: ${err.message}\n`);
}

const samples = history.map((h) => h.merged);
const basis = live ? 'measured' : 'estimated';
const ev = (q) => (live ? q : '');
const agingCount = openItems.filter((i) => i.ageDays > AGING_DAYS).length;
const median = (xs) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round(((s[m - 1] + s[m]) / 2) * 10) / 10; };

const metrics = [
  { id: 'throughput', label: 'Throughput', value: merged, unit: 'count', basis, better: 'up',
    evidence: ev(`search: org:{${ORGS.join('|')}} is:pr is:merged merged:>=${since}`),
    note: `PRs merged across the estate in ${WINDOW_DAYS} days.` },
  { id: 'throughput-median-wk', label: 'Median weekly throughput', value: median(samples), unit: 'count', basis, better: 'up',
    evidence: ev(`median of ${samples.length} weekly buckets`),
    note: 'Median, not mean — the distribution is heavily skewed.' },
  { id: 'wip', label: 'Work in progress', value: openPrs, unit: 'count', basis, better: 'down',
    evidence: ev(`search: is:pr is:open across ${ORGS.length} orgs`),
    note: 'Open pull requests across the estate.' },
  { id: 'aging', label: 'Aging WIP', value: agingCount, unit: 'count', basis, better: 'down',
    evidence: ev(`open PRs older than ${AGING_DAYS}d`),
    note: `Open PRs older than ${AGING_DAYS} days — the flow risk.` },
  { id: 'issues-closed', label: 'Issues closed', value: closedIssues, unit: 'count', basis, better: 'up',
    evidence: ev(`search: is:issue is:closed closed:>=${since}`),
    note: `Issues closed in ${WINDOW_DAYS} days.` },
  { id: 'issues-open', label: 'Open issues', value: openIssues, unit: 'count', basis, better: 'down',
    evidence: ev('search: is:issue is:open'),
    note: 'Open issues across the estate — the forecastable backlog.' },
  { id: 'arrivals', label: 'Arrivals', value: arrivals, unit: 'count', basis, better: 'down',
    evidence: ev(`search: is:pr created:>=${since}`),
    note: `PRs opened in ${WINDOW_DAYS} days — a flow, measured so Little's Law can be validated rather than assumed.` },
];

const columns = [
  { name: 'Backlog (open issues)', count: openIssues, aging: 0 },
  { name: 'In review (open PRs)', count: openPrs, wipLimit: WIP_LIMIT, aging: agingCount },
  { name: `Merged (${WINDOW_DAYS}d)`, count: merged, aging: 0 },
  { name: `Closed (${WINDOW_DAYS}d)`, count: closedIssues, aging: 0 },
];

const gates = [
  { name: 'Evidence collected', status: live ? 'pass' : 'fail',
    detail: live ? `Estate rollup across ${ORGS.join(', ')} from live search evidence.` : 'Live collection failed; snapshot must not drive decisions.' },
  { name: 'Forecast has sufficient history', status: !live ? 'unverified' : samples.length >= 6 ? 'pass' : 'fail',
    detail: !live ? 'No evidence.' : `${samples.length} weekly throughput samples (minimum 6 to forecast).` },
  { name: 'Aging WIP within threshold', status: !live ? 'unverified' : agingCount <= 10 ? 'pass' : 'fail',
    detail: !live ? 'No evidence.' : `${agingCount} PR(s) older than ${AGING_DAYS}d (threshold 10).` },
  { name: 'Board spec resolved', status: boards.length ? 'pass' : 'unverified',
    detail: boards.length ? `${boards.length} boards from ${boardSpecSource}.` : 'registry/board-spec.yaml not reachable — boards unknown.' },
  { name: 'Backlog is prioritized (MoSCoW)', status: labelsSeen > 0 ? 'pass' : 'unverified',
    detail: labelsSeen > 0 ? `${labelsSeen} MoSCoW-labelled item(s).` : 'No MoSCoW labels found on open issues — the backlog is unprioritized, so Must-share discipline cannot be assessed.' },
];

const snapshot = {
  sourceMode: live ? 'live' : 'fixture',
  generatedAt: new Date().toISOString(),
  commit,
  workflowRun: process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL ?? 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null,
  repo: ORGS.join(' + '),
  windowDays: WINDOW_DAYS,
  boundaryNotice: live
    ? `Estate-wide rollup across ${ORGS.join(' and ')} over ${WINDOW_DAYS} days, computed from merged-PR and issue search evidence. Boards come from registry/board-spec.yaml — Projects is a render target, not the truth. Throughput history is bucketed weekly and resampled by Monte Carlo; no velocity average is used anywhere. Cost and price inputs are DECLARED, not measured, and every money figure inherits the weakest basis of its inputs.`
    : 'Live collection failed. Fixture-backed, all gates unverified, must not be used to report delivery status.',
  perOrg,
  history,
  arrivals,
  sprint: {
    name: `Rolling ${WINDOW_DAYS}-day window`,
    startedAt: daysAgo(WINDOW_DAYS).toISOString(),
    endsAt: new Date().toISOString(),
    committed: merged + openPrs,
    completed: merged,
    addedMidSprint: 0,
    carriedOver: openPrs,
  },
  moscow: { ...labelled, labelsSeen },
  metrics,
  columns,
  items: openItems.sort((a, b) => b.ageDays - a.ageDays).slice(0, 16),
  gates,
  boards,
};

const banner = `// GENERATED by scripts/generate-delivery-snapshot.mjs — do not edit by hand.
// Regenerated by CI on merge to master so the dashboard cannot drift from what shipped.
// sourceMode '${snapshot.sourceMode}' at commit ${snapshot.commit.slice(0, 7)}.
import type { DeliverySnapshot } from '../features/delivery/contract';

export const deliverySnapshot: DeliverySnapshot = ${JSON.stringify(snapshot, null, 2)} as const;
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, banner);
process.stdout.write(`[delivery-snapshot] ${snapshot.sourceMode} · ${merged} merged · ${openPrs} open PR · ${openIssues} open issues · ${samples.length} history weeks → ${OUT}\n`);
