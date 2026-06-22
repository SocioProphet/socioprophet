import { describe, expect, it } from 'vitest'
import {
  createFixtureKnowledgeGraphClient,
  KnowledgeGraphAccessError,
  knowledgeGraphE1Fixture,
} from './knowledgeGraphClient'

describe('KnowledgeGraphClient E1 fixture contract', () => {
  it('returns the happy-path summary response from explicit summary operation response', async () => {
    const client = createFixtureKnowledgeGraphClient()

    await expect(client.summary()).resolves.toEqual(
      knowledgeGraphE1Fixture.responses['knowledge_graph.summary.get'],
    )
  })

  it('searches nodes using service operation semantics, not generic SPARQL', async () => {
    const client = createFixtureKnowledgeGraphClient()

    const nodes = await client.searchNodes('graph')

    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toMatchObject({
      id: 'kg:node:graph-universe-explorer',
      label: 'Graph Universe Explorer',
      kind: 'ui-feature',
    })
    expect(nodes[0].provenance_refs).toContain('urn:kg:prov:graph-universe-explorer')
  })

  it('returns a node by stable NodeId with provenance refs', async () => {
    const client = createFixtureKnowledgeGraphClient()

    const node = await client.getNode('kg:node:agentplane')

    expect(node).not.toBeNull()
    expect(node?.properties.owner_repo).toBe('SocioProphet/agentplane')
    expect(node?.provenance_refs).toEqual(['urn:kg:prov:agentplane-runtime'])
  })

  it('expands neighborhood subgraphs with operation-scoped provenance and stable EdgeIds', async () => {
    const client = createFixtureKnowledgeGraphClient()

    const subgraph = await client.getNeighbors('kg:node:socioprophet')

    expect(subgraph.operation).toBe('knowledge_graph.neighborhood.expand')
    expect(subgraph.nodes.map((node) => node.id)).toEqual([
      'kg:node:socioprophet',
      'kg:node:graph-universe-explorer',
      'kg:node:agentplane',
    ])
    expect(subgraph.edges.map((edge) => edge.id)).toEqual([
      'kg:edge:socioprophet-owns-graph-universe-explorer',
      'kg:edge:graph-universe-explorer-uses-agentplane',
    ])
    expect(subgraph.provenance.operation).toBe('knowledge_graph.neighborhood.expand')
  })

  it('returns null for the missing_node negative case', async () => {
    const client = createFixtureKnowledgeGraphClient()

    const missing = await client.getNode(knowledgeGraphE1Fixture.negative_cases.missing_node.node_id)

    expect(missing).toBeNull()
  })

  it('raises an access-control error for the denied_provenance negative case', async () => {
    const client = createFixtureKnowledgeGraphClient()
    const deniedRef = knowledgeGraphE1Fixture.negative_cases.denied_provenance.provenance_ref

    await expect(client.getProvenance(deniedRef)).rejects.toBeInstanceOf(KnowledgeGraphAccessError)
    await expect(client.getProvenance(deniedRef)).rejects.toMatchObject({
      code: 'access_denied',
      provenance_ref: deniedRef,
    })
  })

  it('returns a degraded summary for the degraded_backend negative case', async () => {
    const client = createFixtureKnowledgeGraphClient(knowledgeGraphE1Fixture, {
      summaryMode: 'degraded_backend',
    })

    const summary = await client.summary()

    expect(summary).toEqual(knowledgeGraphE1Fixture.negative_cases.degraded_backend.response)
    expect(summary.health).toBe('degraded')
    expect(summary.mockBoundary).toBe(true)
    expect(summary.evidence_level).toBe('E1')
  })
})
