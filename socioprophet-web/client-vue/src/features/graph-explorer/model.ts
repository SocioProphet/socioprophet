/**
 * Pure graph-explorer model — ported from the marketing Platform Explorer
 * (`marketing/public/map/index.html`) so the estate's canonical Vue app consumes the same
 * logic rather than forking a second one. Everything here is DOM-free and deterministic so it
 * can be unit-tested and reused by the panel component.
 */
import type {
  ExplorerState,
  GraphLink,
  RuntimeHealth,
  RuntimeTopology,
  SurfaceGraph,
  SurfaceNode,
} from './types';

export interface CategoryLegendEntry {
  key: string;
  label: string;
  color: string;
}

/** Category legend + colours, matching the marketing Platform Explorer palette. */
export const CATEGORY_LEGEND: CategoryLegendEntry[] = [
  { key: 'docs', label: 'Docs / core', color: '#0f172a' },
  { key: 'learning', label: 'Learning / deployment', color: '#1d4ed8' },
  { key: 'technical', label: 'Technical', color: '#7c3aed' },
  { key: 'trust', label: 'Trust / governance', color: '#0f766e' },
  { key: 'domain', label: 'Domain / higher-trust', color: '#b45309' },
  { key: 'content', label: 'Content / topic', color: '#64748b' },
];

/** Runtime (Kiali-style) health colours, drawn from the studio token vocabulary. */
export const HEALTH_COLOR: Record<RuntimeHealth, string> = {
  healthy: 'var(--good)',
  degraded: 'var(--warn)',
  down: 'var(--bad)',
  unknown: 'var(--muted)',
};

export function slug(text: unknown): string {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function colorForNode(node: SurfaceNode): string {
  if (node.type === 'topic') return '#64748b';
  switch (node.category) {
    case 'learning':
    case 'deployment':
      return '#1d4ed8';
    case 'technical':
      return '#7c3aed';
    case 'trust':
    case 'governance':
      return '#0f766e';
    case 'domain':
      return '#b45309';
    case 'docs':
      return '#0f172a';
    case 'content':
      return '#64748b';
    default:
      return '#64748b';
  }
}

/** The feature bag used for vector similarity — categories, groups, topics, audiences, overlay. */
export function featureSet(node: SurfaceNode): Set<string> {
  const values: string[] = [];
  values.push(`category:${slug(node.category ?? '')}`);
  values.push(`group:${slug(node.graph_group ?? '')}`);
  for (const t of node.topic_constituents ?? []) values.push(`topic:${slug(t)}`);
  for (const t of node.normalized_topics ?? []) values.push(`norm:${slug(t)}`);
  for (const a of node.audiences ?? []) values.push(`aud:${slug(a)}`);
  for (const r of node.related_surfaces ?? []) values.push(`rel:${slug(r)}`);
  const overlay = node.investor_overlay ?? {};
  if (overlay.lens) values.push(`lens:${slug(overlay.lens)}`);
  for (const d of overlay.value_drivers ?? []) values.push(`driver:${slug(d)}`);
  for (const p of overlay.economic_profit_proxy ?? []) values.push(`proxy:${slug(p)}`);
  return new Set(values.filter(Boolean));
}

export function jaccard(a: Iterable<string>, b: Iterable<string>): number {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  const uni = new Set([...A, ...B]).size;
  return uni ? inter / uni : 0;
}

/** Vector-similarity edges: every surface pair whose jaccard >= threshold. */
export function buildVectorLinks(surfaceNodes: SurfaceNode[], threshold: number): GraphLink[] {
  const out: GraphLink[] = [];
  for (let i = 0; i < surfaceNodes.length; i += 1) {
    for (let j = i + 1; j < surfaceNodes.length; j += 1) {
      const a = surfaceNodes[i];
      const b = surfaceNodes[j];
      const score = jaccard(featureSet(a), featureSet(b));
      if (score >= threshold) out.push({ source: a.id, target: b.id, type: 'vector', score });
    }
  }
  return out;
}

function endpointId(end: string | { id?: string }): string {
  return typeof end === 'string' ? end : (end?.id ?? '');
}

/** N-hop neighbourhood of a root over a link set (used by Local / DRIFT-like explore modes). */
export function neighborIds(links: GraphLink[], rootId: string, depth: number): Set<string> {
  let frontier = new Set<string>([rootId]);
  const seen = new Set<string>([rootId]);
  for (let d = 0; d < depth; d += 1) {
    const next = new Set<string>();
    for (const l of links) {
      const s = endpointId(l.source as never);
      const t = endpointId(l.target as never);
      if (frontier.has(s) && !seen.has(t)) next.add(t);
      if (frontier.has(t) && !seen.has(s)) next.add(s);
    }
    for (const x of next) seen.add(x);
    frontier = next;
  }
  return seen;
}

function curatedLinksOf(graph: SurfaceGraph): GraphLink[] {
  if (Array.isArray(graph.links?.curated)) return graph.links!.curated!;
  if (Array.isArray(graph.edges)) return graph.edges;
  return [];
}

export interface ActiveGraph {
  nodes: SurfaceNode[];
  links: GraphLink[];
}

/**
 * The heart of the explorer — resolves the visible node/link set from the full graph and the
 * current control state. Mirrors the marketing `activeGraph()` exactly, minus DOM concerns.
 */
export function computeActiveGraph(graph: SurfaceGraph, state: ExplorerState): ActiveGraph {
  const query = state.query.trim().toLowerCase();

  let surfaces = graph.nodes
    .filter((n) => n.type === 'surface')
    .filter((n) => {
      if (!query) return true;
      const hay = [n.label, n.description, ...(n.topic_constituents ?? []), ...(n.audiences ?? [])]
        .join(' ')
        .toLowerCase();
      return hay.includes(query);
    });

  const ids = new Set(surfaces.map((s) => s.id));

  const curatedLinks: GraphLink[] = curatedLinksOf(graph)
    .filter((l) => ids.has(endpointId(l.source as never)) && ids.has(endpointId(l.target as never)))
    .map((l) => ({ ...l, type: l.type ?? 'curated' }));

  const vectorLinks =
    state.viewMode === 'topology' ? [] : buildVectorLinks(surfaces, state.threshold);

  let constituentLinks: GraphLink[] = [];
  let topics: SurfaceNode[] = [];
  if (state.showTopics || state.expandedSurfaceId) {
    const constituentSource = Array.isArray(graph.links?.constituent) ? graph.links!.constituent! : [];
    const relevant = state.expandedSurfaceId
      ? new Set([state.expandedSurfaceId])
      : new Set(surfaces.map((s) => s.id));
    constituentLinks = constituentSource
      .filter((l) => relevant.has(endpointId(l.source as never)))
      .map((l) => ({ ...l, type: l.type ?? 'constituent' }));
    const topicIds = new Set(constituentLinks.map((l) => endpointId(l.target as never)));
    topics = graph.nodes.filter((n) => n.type === 'topic' && topicIds.has(n.id));
  }

  let links: GraphLink[] = [];
  if (state.viewMode === 'topology') links = [...curatedLinks, ...constituentLinks];
  if (state.viewMode === 'vector') links = [...vectorLinks, ...constituentLinks];
  if (state.viewMode === 'hybrid') links = [...curatedLinks, ...vectorLinks, ...constituentLinks];

  if (state.selectedId && state.searchMode !== 'global') {
    const depth = state.searchMode === 'local' ? 1 : 2;
    const keep = neighborIds(links, state.selectedId, depth);
    keep.add(state.selectedId);
    if (state.expandedSurfaceId) keep.add(state.expandedSurfaceId);
    surfaces = surfaces.filter((n) => keep.has(n.id));
    topics = topics.filter((n) => keep.has(n.id));
    links = links.filter(
      (l) => keep.has(endpointId(l.source as never)) && keep.has(endpointId(l.target as never)),
    );
  }

  return { nodes: [...surfaces, ...topics], links };
}

/** A surface node with its runtime overlay resolved. */
export interface RuntimeAnnotatedNode extends SurfaceNode {
  runtime: {
    health: RuntimeHealth;
    service?: string;
    rps?: number;
    errorRate?: number;
    p95Ms?: number;
  };
}

/**
 * Overlay Kiali-style runtime health/traffic onto ontology nodes. Surface nodes with no runtime
 * stat (and every topic node) resolve to `unknown`.
 */
export function applyRuntimeOverlay(
  nodes: SurfaceNode[],
  runtime: RuntimeTopology | null | undefined,
): RuntimeAnnotatedNode[] {
  const byId = new Map((runtime?.nodes ?? []).map((r) => [r.id, r]));
  return nodes.map((n) => {
    const stat = byId.get(n.id);
    return {
      ...n,
      runtime: {
        health: (stat?.health ?? 'unknown') as RuntimeHealth,
        service: stat?.service,
        rps: stat?.rps,
        errorRate: stat?.errorRate,
        p95Ms: stat?.p95Ms,
      },
    };
  });
}

export function colorForHealth(health: RuntimeHealth): string {
  return HEALTH_COLOR[health] ?? HEALTH_COLOR.unknown;
}

/** Roll-up counts for the runtime status strip. */
export function runtimeSummary(runtime: RuntimeTopology | null | undefined): Record<RuntimeHealth, number> {
  const acc: Record<RuntimeHealth, number> = { healthy: 0, degraded: 0, down: 0, unknown: 0 };
  for (const r of runtime?.nodes ?? []) acc[r.health] = (acc[r.health] ?? 0) + 1;
  return acc;
}
