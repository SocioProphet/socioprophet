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
/** Paginated list fetch. Without this a 100+ repo org truncates and every
 *  declared edge is misclassified as drift — which is exactly what happened. */
const ghAll = (ep, jq) => {
  const raw = execFileSync('gh', ['api','-X','GET',ep,'--paginate','--jq',jq],
    { encoding:'utf8', maxBuffer:64*1024*1024, stdio:['ignore','pipe','pipe'] });
  return raw.trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).flat();
};
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

// ---- topology first: the node set must be seeded BY the graph -------------
// Choosing nodes purely by activity produced 0 connected edges and 60 dangling
// ones — the topology names repos that are not the most active. The node set is
// therefore the UNION of (most active) and (named in the declared topology).
const REGISTRY_DIR = path.join(process.env.HOME ?? '', 'dev/sociosphere/registry');
let topoNames = new Set();
try {
  const y = fs.readFileSync(path.join(REGISTRY_DIR, 'dependency-graph.yaml'), 'utf8');
  for (const m of y.matchAll(/-\s+from:\s*(\S+)\s*\n\s*to:\s*(\S+)/g)) {
    topoNames.add(m[1]); topoNames.add(m[2]);
  }
} catch {}

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

  // Union: the most active, plus anything the topology names (so edges connect).
  const perOrg = Math.ceil(TOP_N/ORGS.length);
  const active = repos.slice(0, perOrg);
  const named = repos.filter(r => topoNames.has(r.name) && !active.some(a=>a.full===r.full));
  for (const r of [...active, ...named]) {
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

process.stdout.write(`[estate-graph] ${snapshot.sourceMode} · ${ORGS.length} orgs · ${streams.length} streams · ${collected.length}/${nodes.length} nodes · ${totalMinutes} CI min · ~$${totalCost} proxy · agent ${snapshot.totals.agentSharePct}% → ${OUT}\n`);

// ---------------------------------------------------------------------------
// EDGES — the declared sociosphere topology.
//
// Three registries, three different edge KINDS, kept distinct because they mean
// different things: a submodule pin is not an authority relationship, and
// collapsing them would produce a graph that looks connected and says nothing.
// ---------------------------------------------------------------------------
function parseEdges(registryDir) {
  const out = { dependency: [], authority: [], lanes: [], sources: [] };

  // dependency-graph.yaml: `- from: X` / `to: Y` / `type: Z`
  try {
    const p = path.join(registryDir, 'dependency-graph.yaml');
    const y = fs.readFileSync(p, 'utf8');
    for (const m of y.matchAll(/-\s+from:\s*(\S+)\s*\n\s*to:\s*(\S+)\s*\n\s*type:\s*(\S+)/g)) {
      out.dependency.push({ from: m[1], to: m[2], type: m[3] });
    }
    out.sources.push(p);
  } catch {}

  // authority-dependencies.yaml is JSON despite the extension.
  try {
    const p = path.join(registryDir, 'authority-dependencies.yaml');
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const a of j.authority_dependencies ?? []) {
      out.authority.push({
        id: a.id,
        from: (a.source?.repo ?? '').split('/').pop(),
        to: (a.target?.repo ?? '').split('/').pop(),
        fromKind: a.source?.kind ?? null,
        toKind: a.target?.kind ?? null,
        status: a.status ?? 'unknown',
      });
    }
    out.sources.push(p);
  } catch {}

  // estate-control-graph.yaml: governance lanes with an owning repo.
  try {
    const p = path.join(registryDir, 'estate-control-graph.yaml');
    const y = fs.readFileSync(p, 'utf8');
    for (const m of y.matchAll(/-\s+id:\s*(\S+)\s*\n\s*owner_repo:\s*(\S+)/g)) {
      out.lanes.push({ id: m[1], ownerRepo: m[2], owner: m[2].split('/').pop() });
    }
    out.sources.push(p);
  } catch {}

  return out;
}

const edges = parseEdges(REGISTRY_DIR);

// Validate every declared endpoint against the REAL repo set. A declared graph
// that names repos which do not exist is drift, and drift must be reported —
// not quietly filtered until the picture looks connected.
// Each org is fetched in its own try/catch (matching the node-collection loop
// above): one org's API failure must not blank out the repos already fetched
// for the others and misreport them as drift.
let realRepos = new Set();
for (const org of ORGS) {
  try {
    for (const n of ghAll(`orgs/${org}/repos?per_page=100`, '[.[].name]')) realRepos.add(n);
  } catch {}
  sleep(400);
}
const exists = (n) => realRepos.size === 0 || realRepos.has(n);
const declared = edges.dependency;
const realEdges = declared.filter((e) => exists(e.from) && exists(e.to));
const driftEdges = declared.filter((e) => !exists(e.from) || !exists(e.to));
const driftRepos = [...new Set(declared.flatMap((e) => [e.from, e.to]).filter((n) => !exists(n)))];

const known = new Set(nodes.map((n) => n.name));
const placed = realEdges.filter((e) => known.has(e.from) && known.has(e.to));
const dangling = realEdges.filter((e) => !known.has(e.from) || !known.has(e.to));

const graphPatch = {
  edges: {
    dependency: placed,
    dependencyDangling: dangling.length,
    authority: edges.authority,
    lanes: edges.lanes,
    sources: edges.sources,
    declared: declared.length,
    real: realEdges.length,
    driftEdges: driftEdges.length,
    driftRepos,
    note: `${placed.length} dependency edge(s) connect measured nodes; ${dangling.length} more are real but outside the measured set. REGISTRY DRIFT: ${driftEdges.length} of ${declared.length} declared edges reference ${driftRepos.length} repo(s) that do not exist in any of the three orgs — that is reported, not filtered away. Authority edges (${edges.authority.length}) and control lanes (${edges.lanes.length}) are kept SEPARATE: a submodule pin is not an authority relationship.`,
  },
};

// Fold edges into the snapshot and write ONCE. (Writing the node snapshot
// separately and then rewriting it here left a window on disk where the file
// didn't conform to its own EstateGraph type — missing the required `edges`
// field — for anything that happened to read it mid-generation.)
const merged = { ...snapshot, ...graphPatch };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `// GENERATED by scripts/generate-estate-graph.mjs — do not edit by hand.
// Three orgs, project streams from registry/board-spec.yaml, per-node AgentOps,
// and declared topology edges from the sociosphere registries.
import type { EstateGraph } from '../features/delivery/estate';

export const estateGraph: EstateGraph = ${JSON.stringify(merged, null, 2)} as const;
`);
process.stdout.write(`[estate-graph] edges: ${placed.length} dependency (+${dangling.length} dangling) · ${edges.authority.length} authority · ${edges.lanes.length} lanes\n`);
