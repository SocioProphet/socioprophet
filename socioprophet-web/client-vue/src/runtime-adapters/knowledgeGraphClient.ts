export type NodeId = string
export type EdgeId = string

export type KnowledgeGraphOperation =
  | 'knowledge_graph.summary.get'
  | 'knowledge_graph.nodes.search'
  | 'knowledge_graph.node.get'
  | 'knowledge_graph.edge.get'
  | 'knowledge_graph.neighborhood.expand'
  | 'knowledge_graph.provenance.get'

export type KnowledgeGraphHealth = 'ok' | 'degraded' | 'unavailable'

export interface KGNode {
  id: NodeId
  label: string
  kind: string
  properties: Record<string, string | number | boolean>
  provenance_refs: string[]
}

export interface KGEdge {
  id: EdgeId
  source: NodeId
  target: NodeId
  predicate: string
  label: string
  properties: Record<string, string | number | boolean>
  provenance_refs: string[]
}

export interface KGSummary {
  operation: Extract<KnowledgeGraphOperation, 'knowledge_graph.summary.get'>
  health: KnowledgeGraphHealth
  node_count: number
  edge_count: number
  mockBoundary: true
  evidence_level: 'E1'
  degraded_reason?: string
}

export interface KGProvenance {
  operation: KnowledgeGraphOperation
  refs: string[]
  source: string
  evidence_level: 'E1'
  access: 'allowed' | 'denied'
}

export interface KGSubgraph {
  operation: Extract<KnowledgeGraphOperation, 'knowledge_graph.neighborhood.expand'>
  center: NodeId
  nodes: KGNode[]
  edges: KGEdge[]
  provenance: KGProvenance
}

export interface KnowledgeGraphFixture {
  summary: KGSummary
  nodes: KGNode[]
  edges: KGEdge[]
  provenance: Record<string, KGProvenance>
  responses: {
    'knowledge_graph.summary.get': KGSummary
    'knowledge_graph.nodes.search': Record<string, NodeId[]>
    'knowledge_graph.neighborhood.expand': Record<NodeId, { node_ids: NodeId[]; edge_ids: EdgeId[] }>
  }
  negative_cases: {
    missing_node: { node_id: NodeId; expected: null }
    denied_provenance: { provenance_ref: string; error: { code: 'access_denied'; message: string } }
    degraded_backend: { operation: Extract<KnowledgeGraphOperation, 'knowledge_graph.summary.get'>; response: KGSummary }
  }
}

export interface KnowledgeGraphClient {
  summary(): Promise<KGSummary>
  searchNodes(query: string): Promise<KGNode[]>
  getNode(id: NodeId): Promise<KGNode | null>
  getEdge(id: EdgeId): Promise<KGEdge | null>
  getNeighbors(id: NodeId): Promise<KGSubgraph>
  getProvenance(ref: string): Promise<KGProvenance>
}

export class KnowledgeGraphAccessError extends Error {
  readonly code = 'access_denied'
  readonly provenance_ref: string

  constructor(provenanceRef: string, message: string) {
    super(message)
    this.name = 'KnowledgeGraphAccessError'
    this.provenance_ref = provenanceRef
  }
}

export const knowledgeGraphE1Fixture: KnowledgeGraphFixture = {
  summary: {
    operation: 'knowledge_graph.summary.get',
    health: 'ok',
    node_count: 3,
    edge_count: 2,
    mockBoundary: true,
    evidence_level: 'E1',
  },
  nodes: [
    {
      id: 'kg:node:socioprophet',
      label: 'SocioProphet',
      kind: 'platform',
      properties: { owner_repo: 'SocioProphet/socioprophet', surface: 'Graph Universe Explorer' },
      provenance_refs: ['urn:kg:prov:socioprophet-platform'],
    },
    {
      id: 'kg:node:agentplane',
      label: 'AgentPlane',
      kind: 'runtime-control-plane',
      properties: { owner_repo: 'SocioProphet/agentplane', adapter: 'AgentPlaneClient' },
      provenance_refs: ['urn:kg:prov:agentplane-runtime'],
    },
    {
      id: 'kg:node:graph-universe-explorer',
      label: 'Graph Universe Explorer',
      kind: 'ui-feature',
      properties: { adapter: 'KnowledgeGraphClient', route: '/map' },
      provenance_refs: ['urn:kg:prov:graph-universe-explorer'],
    },
  ],
  edges: [
    {
      id: 'kg:edge:socioprophet-owns-graph-universe-explorer',
      source: 'kg:node:socioprophet',
      target: 'kg:node:graph-universe-explorer',
      predicate: 'owns_surface',
      label: 'owns surface',
      properties: { contract: 'ui-runtime-adapter-v0' },
      provenance_refs: ['urn:kg:prov:graph-universe-explorer'],
    },
    {
      id: 'kg:edge:graph-universe-explorer-uses-agentplane',
      source: 'kg:node:graph-universe-explorer',
      target: 'kg:node:agentplane',
      predicate: 'uses_runtime_boundary',
      label: 'uses runtime boundary',
      properties: { runtime_state: 'fixture' },
      provenance_refs: ['urn:kg:prov:agentplane-runtime'],
    },
  ],
  provenance: {
    'urn:kg:prov:socioprophet-platform': {
      operation: 'knowledge_graph.node.get',
      refs: ['SocioProphet/socioprophet', 'SocioProphet/sociosphere#333'],
      source: 'fixture',
      evidence_level: 'E1',
      access: 'allowed',
    },
    'urn:kg:prov:agentplane-runtime': {
      operation: 'knowledge_graph.neighborhood.expand',
      refs: ['SocioProphet/agentplane', 'SocioProphet/agentplane#161'],
      source: 'fixture',
      evidence_level: 'E1',
      access: 'allowed',
    },
    'urn:kg:prov:graph-universe-explorer': {
      operation: 'knowledge_graph.nodes.search',
      refs: ['protocol/ui-runtime-adapter/v0/README.md'],
      source: 'fixture',
      evidence_level: 'E1',
      access: 'allowed',
    },
  },
  responses: {
    'knowledge_graph.summary.get': {
      operation: 'knowledge_graph.summary.get',
      health: 'ok',
      node_count: 3,
      edge_count: 2,
      mockBoundary: true,
      evidence_level: 'E1',
    },
    'knowledge_graph.nodes.search': {
      agent: ['kg:node:agentplane'],
      graph: ['kg:node:graph-universe-explorer'],
      socioprophet: ['kg:node:socioprophet'],
    },
    'knowledge_graph.neighborhood.expand': {
      'kg:node:socioprophet': {
        node_ids: ['kg:node:socioprophet', 'kg:node:graph-universe-explorer', 'kg:node:agentplane'],
        edge_ids: [
          'kg:edge:socioprophet-owns-graph-universe-explorer',
          'kg:edge:graph-universe-explorer-uses-agentplane',
        ],
      },
    },
  },
  negative_cases: {
    missing_node: { node_id: 'kg:node:missing', expected: null },
    denied_provenance: {
      provenance_ref: 'urn:kg:prov:restricted',
      error: { code: 'access_denied', message: 'Provenance ref is denied by fixture access policy.' },
    },
    degraded_backend: {
      operation: 'knowledge_graph.summary.get',
      response: {
        operation: 'knowledge_graph.summary.get',
        health: 'degraded',
        node_count: 3,
        edge_count: 2,
        mockBoundary: true,
        evidence_level: 'E1',
        degraded_reason: 'Fixture backend degraded negative case.',
      },
    },
  },
}

interface FixtureClientOptions {
  summaryMode?: 'ok' | 'degraded_backend'
}

export function createFixtureKnowledgeGraphClient(
  fixture: KnowledgeGraphFixture = knowledgeGraphE1Fixture,
  options: FixtureClientOptions = {},
): KnowledgeGraphClient {
  const nodesById = new Map(fixture.nodes.map((node) => [node.id, node]))
  const edgesById = new Map(fixture.edges.map((edge) => [edge.id, edge]))

  return {
    async summary() {
      if (options.summaryMode === 'degraded_backend') {
        return fixture.negative_cases.degraded_backend.response
      }
      return fixture.responses['knowledge_graph.summary.get']
    },

    async searchNodes(query: string) {
      const normalized = query.trim().toLowerCase()
      const responseIds = fixture.responses['knowledge_graph.nodes.search'][normalized] || []
      return responseIds.map((id) => nodesById.get(id)).filter((node): node is KGNode => Boolean(node))
    },

    async getNode(id: NodeId) {
      return nodesById.get(id) || null
    },

    async getEdge(id: EdgeId) {
      return edgesById.get(id) || null
    },

    async getNeighbors(id: NodeId) {
      const response = fixture.responses['knowledge_graph.neighborhood.expand'][id]
      if (!response) {
        return {
          operation: 'knowledge_graph.neighborhood.expand',
          center: id,
          nodes: [],
          edges: [],
          provenance: {
            operation: 'knowledge_graph.neighborhood.expand',
            refs: [],
            source: 'fixture',
            evidence_level: 'E1',
            access: 'allowed',
          },
        }
      }

      return {
        operation: 'knowledge_graph.neighborhood.expand',
        center: id,
        nodes: response.node_ids.map((nodeId) => nodesById.get(nodeId)).filter((node): node is KGNode => Boolean(node)),
        edges: response.edge_ids.map((edgeId) => edgesById.get(edgeId)).filter((edge): edge is KGEdge => Boolean(edge)),
        provenance: {
          operation: 'knowledge_graph.neighborhood.expand',
          refs: response.edge_ids,
          source: 'fixture',
          evidence_level: 'E1',
          access: 'allowed',
        },
      }
    },

    async getProvenance(ref: string) {
      if (ref === fixture.negative_cases.denied_provenance.provenance_ref) {
        throw new KnowledgeGraphAccessError(ref, fixture.negative_cases.denied_provenance.error.message)
      }

      const provenance = fixture.provenance[ref]
      if (!provenance) {
        return {
          operation: 'knowledge_graph.provenance.get',
          refs: [ref],
          source: 'fixture',
          evidence_level: 'E1',
          access: 'allowed',
        }
      }

      return provenance
    },
  }
}
