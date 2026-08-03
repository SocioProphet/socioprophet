// The intelligence suite — the spine that joins the pieces.
//
// The problem this fixes: ten surfaces existed and NOTHING joined them.
// competitive-intelligence named "our surfaces" as free text, the estate graph
// knew repos, board-spec knew funded streams, and delivery knew throughput —
// with no join between any of them. So a competitor finding could not reach the
// repo building the answer, that repo's health, or its priority. Separate pages
// are not a suite.
//
// A SurfaceRef is therefore a TYPED reference, validated against the estate:
// a stream not in board-spec is a broken link and is reported as one rather than
// rendering as prose. A repo outside the graph's scan window is UNKNOWN, which
// is deliberately not the same as absent.

import { estateGraph } from '../../data/estateGraph';
import { markets, type Market, type Coverage } from '../competitive-intelligence/markets';

/** A claim that some part of the estate serves a market. Verifiable, not prose. */
export type SurfaceRef = {
  label: string;
  /** Repo name as it appears in the estate graph. */
  repo?: string;
  /** Stream title as it appears in registry/board-spec.yaml. */
  stream?: string;
};

/** Which real repos and streams each market is actually served by. */
export const marketSurfaces: Record<string, SurfaceRef[]> = {
  'consumer-one-trick': [
    { label: 'BearBrowser', repo: 'BearBrowser', stream: 'BearBrowser' },
    { label: 'Digital health twin', repo: 'prophet-health' },
    { label: 'News & feeds', repo: 'socioprophet', stream: 'Product Surfaces' },
  ],
  'professional-intelligence': [
    { label: 'Cockpit', repo: 'socioprophet', stream: 'Product Surfaces' },
    { label: 'Evidence spine', repo: 'prophet-truth', stream: 'Governance & Control Plane' },
    { label: 'Search', repo: 'sherlock-search' },
    { label: 'Economic model', repo: 'economic-prophet' },
  ],
  browser: [
    { label: 'BearBrowser', repo: 'BearBrowser', stream: 'BearBrowser' },
    { label: 'Agent runtime', repo: 'agent-machine', stream: 'Agent Runtime & Terminal' },
  ],
  'health-twin': [{ label: 'prophet-health', repo: 'prophet-health' }],
  'sovereign-os': [
    { label: 'SourceOS', repo: 'source-os', stream: 'SourceOS Base OS' },
    { label: 'SourceOS spec', repo: 'sourceos-spec', stream: 'SourceOS Base OS' },
    { label: 'Managed plane', repo: 'sociosphere', stream: 'SociOS Managed Plane' },
  ],
  search: [{ label: 'sherlock-search', repo: 'sherlock-search' }],
  'agentic-dev': [
    { label: 'agentplane', repo: 'agentplane' },
    { label: 'prophet-cli', repo: 'prophet-cli' },
  ],
  'knowledge-graph': [
    { label: 'hellgraph', repo: 'hellgraph', stream: 'Reasoning & Intelligence' },
    { label: 'ontogenesis', repo: 'ontogenesis', stream: 'Spec, Ontology & Contracts' },
    { label: 'memory-mesh', repo: 'memory-mesh' },
  ],
  'platform-data': [
    { label: 'prophet-platform', repo: 'prophet-platform', stream: 'Platform & GitOps' },
    { label: 'GitOps standards', repo: 'git-ops-standards', stream: 'Platform & GitOps' },
  ],
};

type Node = (typeof estateGraph.nodes)[number];

export type RefResolution = {
  ref: SurfaceRef;
  repoMeasured: boolean;
  streamFound: boolean;
  node: Node | null;
  broken: boolean;
  detail: string;
};

const streamNames = new Set(estateGraph.streams.map((s) => s.name));
const nodeByName = new Map(estateGraph.nodes.map((n) => [n.name, n]));

export function resolveRef(ref: SurfaceRef): RefResolution {
  const node = ref.repo ? (nodeByName.get(ref.repo) ?? null) : null;
  const repoMeasured = ref.repo ? node !== null : true;
  const streamFound = ref.stream ? streamNames.has(ref.stream) : true;
  // Only a bad STREAM is "broken" — board-spec is a closed vocabulary. A repo
  // outside the scan window is unknown, and unknown is not broken.
  const broken = Boolean(ref.stream) && !streamFound;
  return {
    ref,
    repoMeasured,
    streamFound,
    node,
    broken,
    detail: broken
      ? `Stream '${ref.stream}' is not in board-spec — a broken link, not a description.`
      : !repoMeasured && ref.repo
        ? `Repo '${ref.repo}' is outside the estate graph's scan window; health is unknown, not zero.`
        : 'Resolved.',
  };
}

export type MarketRow = {
  market: Market;
  coverage: Coverage;
  refs: RefResolution[];
  brokenRefs: number;
  measuredNodes: number;
  ciRate: number | null;
  costProxyUsd: number;
  agentSharePct: number | null;
};

export function marketRows(): MarketRow[] {
  return markets.map((m) => {
    const refs = (marketSurfaces[m.id] ?? []).map(resolveRef);
    const nodes = refs
      .map((r) => r.node)
      .filter((n): n is Node => n !== null && n.collected);
    const withCi = nodes.filter((n) => n.ciSuccessRate !== null);
    const agent = nodes.reduce((s, n) => s + n.agentAuthored, 0);
    const human = nodes.reduce((s, n) => s + n.humanAuthored, 0);
    return {
      market: m,
      coverage: m.coverage,
      refs,
      brokenRefs: refs.filter((r) => r.broken).length,
      measuredNodes: nodes.length,
      ciRate: withCi.length
        ? Math.round(withCi.reduce((s, n) => s + (n.ciSuccessRate as number), 0) / withCi.length)
        : null,
      costProxyUsd: Math.round(nodes.reduce((s, n) => s + (n.costProxyUsd ?? 0), 0) * 100) / 100,
      agentSharePct: agent + human ? Math.round((agent / (agent + human)) * 100) : null,
    };
  });
}

/** What the suite still cannot answer. Stated, not hidden. */
export type SuiteGap = { area: string; detail: string; blocking: boolean };

export function suiteGaps(rows: MarketRow[]): SuiteGap[] {
  const gaps: SuiteGap[] = [];

  const uncovered = rows.filter((r) => r.coverage === 'none');
  if (uncovered.length) {
    gaps.push({
      area: 'Market coverage',
      detail: `${uncovered.length} of ${rows.length} markets have no competitive teardown: ${uncovered
        .map((r) => r.market.name)
        .join(', ')}. Their surfaces are named and measured, but there is no read on who we compete with.`,
      blocking: true,
    });
  }

  const broken = rows.reduce((s, r) => s + r.brokenRefs, 0);
  if (broken) {
    gaps.push({
      area: 'Broken links',
      detail: `${broken} surface reference(s) name a stream that is not in board-spec.`,
      blocking: true,
    });
  }

  const unmeasured = rows.flatMap((r) => r.refs.filter((x) => x.ref.repo && !x.repoMeasured));
  if (unmeasured.length) {
    gaps.push({
      area: 'Outside the measured window',
      detail: `${unmeasured.length} referenced repo(s) sit outside the estate graph's scan window (${[
        ...new Set(unmeasured.map((u) => u.ref.repo)),
      ].join(', ')}). Health is unknown, which is not the same as unhealthy.`,
      blocking: false,
    });
  }

  gaps.push({
    area: 'Cost',
    detail:
      'Cost is a CI-minutes proxy only. No cloud/GKE billing is wired, so no market shows its true cost to serve.',
    blocking: false,
  });

  return gaps;
}

/** The suite's own surfaces, so the index can link them rather than describe them. */
export const suiteSurfaces = [
  { label: 'Market Portfolio', to: '/professional-intelligence/competitive/markets', role: 'Which markets we compete in, and how much intelligence each has.' },
  { label: 'Consumer teardown', to: '/professional-intelligence/competitive', role: '29 single-feature apps — the money machine.' },
  { label: 'Enterprise teardown', to: '/professional-intelligence/competitive/enterprise', role: '23 platforms — substrate ownership and governed deployability.' },
  { label: 'Feature Library', to: '/professional-intelligence/competitive/features', role: 'Every feature normalized and aligned to real capability owners.' },
  { label: 'Delivery Dashboard', to: '/delivery', role: 'Backward / current / forward, with a learning loop.' },
  { label: 'Estate Graph', to: '/delivery/estate', role: 'Three orgs, streams, nodes, AgentOps, cost.' },
  { label: 'Knowledge Studio', to: '/knowledge/studio', role: 'The KE/IE workspace the extraction models are built in.' },
];
