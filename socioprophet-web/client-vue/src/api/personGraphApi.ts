// Personal Knowledge Graph API client.
//
// Fronts the memory-mesh workspace_ingestion runtime (WorkspaceSource → CSKG →
// managed HellGraph). Mirrors the gaiaMap.ts pattern: an env-configured base, a
// getJson wrapper, and a *WithFallback variant that returns a deterministic
// fixture when the backend is absent (so the SPA renders in fixture mode).
//
// Reuses the KG node/edge/summary types the SPA already models.
import type {
  KGEdge,
  KGNode,
  KGSummary,
} from '../runtime-adapters/knowledgeGraphClient';

const API_BASE =
  (import.meta as any).env?.VITE_PERSON_GRAPH_API_BASE || '/api';

export interface PersonGraphSnapshot {
  summary: KGSummary;
  self: KGNode;
  nodes: KGNode[];
  edges: KGEdge[];
}

export type PersonGraphMode = 'live' | 'fixture';

export interface PersonGraphLoadResult {
  snapshot: PersonGraphSnapshot;
  mode: PersonGraphMode;
  error?: string;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchPersonGraphSnapshot(): Promise<PersonGraphSnapshot> {
  return getJson<PersonGraphSnapshot>('/person-graph/snapshot');
}

export async function fetchPersonGraphSnapshotWithFallback(): Promise<PersonGraphLoadResult> {
  try {
    const snapshot = await fetchPersonGraphSnapshot();
    return { snapshot, mode: 'live' };
  } catch (error) {
    return {
      snapshot: demoPersonGraphSnapshot(),
      mode: 'fixture',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Resolve a single opaque `hg:` identity to its neighborhood in the LIVE graph — the deep-link
 * seam any surface uses when a graph ref is clicked. The client never touches HellGraph; the
 * backend adapter (agent-machine /api/person-graph/snapshot?root=…) resolves it.
 */
export async function fetchEntityNeighborhood(hgRef: string): Promise<PersonGraphSnapshot> {
  return getJson<PersonGraphSnapshot>(`/person-graph/snapshot?root=${encodeURIComponent(hgRef)}`);
}

export async function fetchEntityNeighborhoodWithFallback(hgRef: string): Promise<PersonGraphLoadResult> {
  try {
    const snapshot = await fetchEntityNeighborhood(hgRef);
    // A live graph that doesn't hold this identity yields an empty/unavailable snapshot — fall back
    // to the fixture rather than render a blank neighborhood.
    if (snapshot.summary?.health === 'unavailable' || snapshot.nodes.length === 0) {
      return { snapshot: demoPersonGraphSnapshot(), mode: 'fixture', error: `hg ref not in live graph: ${hgRef}` };
    }
    return { snapshot, mode: 'live' };
  } catch (error) {
    return {
      snapshot: demoPersonGraphSnapshot(),
      mode: 'fixture',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ── Fixture — the demo person-graph the runtime produces (self + relationships) ──
function node(
  id: string,
  kind: string,
  label: string,
  source: string,
  extra: Record<string, string | number | boolean> = {},
): KGNode {
  return { id, label, kind, properties: extra, provenance_refs: [source] };
}

function edge(
  id: string,
  source: string,
  target: string,
  predicate: string,
  ref: string,
): KGEdge {
  return {
    id,
    source,
    target,
    predicate,
    label: predicate,
    properties: { epistemicClass: 'confirmed_relation', promotionState: 'confirmed' },
    provenance_refs: [ref],
  };
}

const SELF = 'cskg-node://self/demo-user';

export function demoPersonGraphSnapshot(): PersonGraphSnapshot {
  const self = node(SELF, 'Self', 'You', 'workspace-source:onboarding');
  const mom = node('cskg-node://person/c_mom', 'Person', 'Mom', 'workspace-source:contacts/mom');
  const jamie = node('cskg-node://person/c_jamie', 'Person', 'Jamie', 'workspace-source:contacts/jamie');
  const acme = node('cskg-node://organization/acme_music', 'Organization', 'Acme Music', 'workspace-source:contacts/jamie');
  const practice = node('cskg-node://event/e_practice', 'Event', 'Band practice', 'workspace-source:calendar/practice');
  const setlist = node('cskg-node://document/a_setlist', 'Document', 'Setlist', 'workspace-source:office/setlist');
  const nodes = [self, mom, jamie, acme, practice, setlist];
  const edges = [
    edge('e1', SELF, mom.id, 'relatedTo', 'workspace-source:contacts/mom'),
    edge('e2', SELF, jamie.id, 'knows', 'workspace-source:contacts/jamie'),
    edge('e3', jamie.id, acme.id, 'worksAt', 'workspace-source:contacts/jamie'),
    edge('e4', SELF, practice.id, 'participatedIn', 'workspace-source:calendar/practice'),
    edge('e5', jamie.id, practice.id, 'participatedIn', 'workspace-source:calendar/practice'),
    edge('e6', SELF, jamie.id, 'communicatedWith', 'workspace-source:mail/jamie-thread'),
    edge('e7', SELF, setlist.id, 'authored', 'workspace-source:office/setlist'),
  ];
  const summary: KGSummary = {
    operation: 'knowledge_graph.summary.get',
    health: 'ok',
    node_count: nodes.length,
    edge_count: edges.length,
    mockBoundary: true,
    evidence_level: 'E1',
  };
  return { summary, self, nodes, edges };
}
