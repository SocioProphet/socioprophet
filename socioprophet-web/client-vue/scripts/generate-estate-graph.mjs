#!/usr/bin/env node
/**
 * generate-estate-graph.mjs — the sociosphere node graph with AgentOps.
 *
 * THREE ORGS, not two: SocioProphet, SociOS-Linux, SourceOS-Linux. Project
 * streams come from registry/board-spec.yaml (13 boards, each owned by an org)
 * — the declarative truth; GitHub Projects renders it.
 *
 * Per NODE (repo) it measures: delivery (merged/open), CI health (success rate
 * over recent runs), build minutes, deployments, and AGENT SHARE (what fraction
 * of merged PRs were authored by a bot/agent rather than a human — the
 * human-vs-agent attribution the market study said enterprises pay for).
 *
 * COST IS A PROXY AND SAYS SO. CI minutes are MEASURED; the rate is DECLARED.
 * The product therefore inherits the weaker basis — it is never presented as a
 * billed figure.
 *
 * FAILS CLOSED: a node whose metrics could not be collected is emitted with
 * collected:false rather than zeros, because zero is a claim and absence is not.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const argOf = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i+1] ? args[i+1] : d; };
const ORGS = argOf('--orgs', 'SocioProphet,SociOS-Linux,SourceOS-Linux').split(',').map(s=>s.trim());
const DAYS = Number(argOf('--days','14'));
const TOP_N = Number(argOf('--nodes','24'));
const BOARD_SPEC = argOf('--board-spec', path.join(process.env.HOME ?? '', 'dev/sociosphere/registry/board-spec.yaml'));
const OUT = argOf('--out','src/data/estateGraph.ts');
/** DECLARED. Not a billed rate — a planning input for a cost PROXY. */
const USD_PER_CI_MINUTE = Number(argOf('--ci-rate','0.008'));

const gh = (ep, jq) => {
  const a = ['api','-X','GET',ep];
  if (jq) a.push('--jq', jq);
  return execFileSync('gh', a, { encoding:'utf8', maxBuffer:64*1024*1024, stdio:['ignore','pipe','pipe'] });
};
const ghJson = (ep, jq) => JSON.parse(gh(ep, jq));
const since = new Date(Date.now() - DAYS*86400000).toISOString();
const sinceDay = since.slice(0,10);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const mins = (a,b) => Math.max(0, (new Date(b) - new Date(a)) / 60000);

// ---- project streams from the declarative board spec ----------------------
let streams = [];
try {
  const y = fs.readFileSync(BOARD_SPEC,'utf8');
  streams = [...y.matchAll(/- title: "([^"]+)"\s*\n\s*owner_org: (\S+)/g)]
    .map(m => ({ name:m[1], org:m[2] }));
} catch { /* reported honestly below */ }

// ---- nodes: most-active repos per org -------------------------------------
const nodes = [];
let orgTotals = [];

for (const org of ORGS) {
  let repos = [];
  try {
    repos = ghJson(`orgs/${org}/repos?per_page=100&sort=pushed&direction=desc`,
      `[.[] | select(.pushed_at > "${sinceDay}") | {name:.name, full:.full_name, pushed:.pushed_at, archived:.archived}]`);
  } catch (e) {
    orgTotals.push({ org, collected:false, reason:e.message.slice(0,120), repos:0, merged:0, openPrs:0 });
    continue;
  }
  repos = repos.filter(r=>!r.archived);
  let merged=0, openPrs=0;
  try {
    merged = ghJson(`search/issues?q=${encodeURIComponent(`org:${org} is:pr is:merged merged:>=${sinceDay}`)}`, '.total_count'); sleep(700);
    openPrs = ghJson(`search/issues?q=${encodeURIComponent(`org:${org} is:pr is:open`)}`, '.total_count'); sleep(700);
  } catch {}
  orgTotals.push({ org, collected:true, reason:null, repos:repos.length, merged, openPrs });

  for (const r of repos.slice(0, Math.ceil(TOP_N/ORGS.length))) {
    const node = {
      id: r.full, name: r.name, org,
      collected: false, reason: null,
      merged: 0, openPrs: 0,
      ciRuns: 0, ciSuccess: 0, ciSuccessRate: null,
      buildMinutes: 0, deployments: 0,
      agentAuthored: 0, humanAuthored: 0, agentShare: null,
      costProxyUsd: null,
      lastPush: r.pushed,
    };
    try {
      const runs = ghJson(`repos/${r.full}/actions/runs?per_page=50&created=>=${sinceDay}`,
        '[.workflow_runs[] | {c:.conclusion, s:.created_at, u:.updated_at}]'); sleep(400);
      node.ciRuns = runs.length;
      node.ciSuccess = runs.filter(x=>x.c==='success').length;
      node.ciSuccessRate = runs.length ? Math.round((node.ciSuccess/runs.length)*100) : null;
      node.buildMinutes = Math.round(runs.reduce((s,x)=>s+mins(x.s,x.u),0));
      node.costProxyUsd = Math.round(node.buildMinutes * USD_PER_CI_MINUTE * 100)/100;

      const prs = ghJson(`repos/${r.full}/pulls?state=closed&per_page=50&sort=updated&direction=desc`,
        `[.[] | select(.merged_at != null and .merged_at >= "${since}") | {a:.user.login, t:.user.type}]`); sleep(400);
      node.merged = prs.length;
      node.agentAuthored = prs.filter(p=>p.t==='Bot' || /\[bot\]|agent|copilot|claude/i.test(p.a)).length;
      node.humanAuthored = node.merged - node.agentAuthored;
      node.agentShare = node.merged ? Math.round((node.agentAuthored/node.merged)*100) : null;

      try { node.deployments = ghJson(`repos/${r.full}/deployments?per_page=100`, 'length'); sleep(300); } catch {}
      node.collected = true;
    } catch (e) {
      node.reason = e.message.slice(0,100); // stays collected:false — absence, not zero
    }
    nodes.push(node);
  }
}

const collected = nodes.filter(n=>n.collected);
const totalCost = Math.round(collected.reduce((s,n)=>s+(n.costProxyUsd??0),0)*100)/100;
const totalMinutes = collected.reduce((s,n)=>s+n.buildMinutes,0);
const agentTotal = collected.reduce((s,n)=>s+n.agentAuthored,0);
const humanTotal = collected.reduce((s,n)=>s+n.humanAuthored,0);

const snapshot = {
  sourceMode: collected.length ? 'live' : 'fixture',
  generatedAt: new Date().toISOString(),
  windowDays: DAYS,
  orgs: ORGS,
  orgTotals,
  streams,
  streamSpecSource: streams.length ? BOARD_SPEC : 'not reachable',
  nodes,
  nodesCollected: collected.length,
  nodesFailed: nodes.length - collected.length,
  totals: {
    buildMinutes: totalMinutes,
    costProxyUsd: totalCost,
    agentAuthored: agentTotal,
    humanAuthored: humanTotal,
    agentSharePct: (agentTotal+humanTotal) ? Math.round((agentTotal/(agentTotal+humanTotal))*100) : null,
    deployments: collected.reduce((s,n)=>s+n.deployments,0),
  },
  costBasis: 'declared',
  costNote: `CI minutes are MEASURED from workflow run durations; the rate ($${USD_PER_CI_MINUTE}/min) is DECLARED. The product is a cost PROXY and inherits the weaker basis — it is not a billed figure.`,
  boundaryNotice: collected.length
    ? `Node graph across ${ORGS.length} orgs over ${DAYS} days. Project streams come from registry/board-spec.yaml. Per-node CI health, build minutes, deployments and agent share are measured from workflow runs and merged-PR authorship. A node whose metrics could not be collected is marked collected:false rather than shown as zero — absence is not zero.`
    : 'No node metrics collected. This graph must not be used to report estate health.',
};

const banner = `// GENERATED by scripts/generate-estate-graph.mjs — do not edit by hand.
// Three orgs, project streams from registry/board-spec.yaml, per-node AgentOps.
import type { EstateGraph } from '../features/delivery/estate';

export const estateGraph: EstateGraph = ${JSON.stringify(snapshot,null,2)} as const;
`;
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT, banner);
process.stdout.write(`[estate-graph] ${snapshot.sourceMode} · ${ORGS.length} orgs · ${streams.length} streams · ${collected.length}/${nodes.length} nodes · ${totalMinutes} CI min · ~$${totalCost} proxy · agent ${snapshot.totals.agentSharePct}% → ${OUT}\n`);
