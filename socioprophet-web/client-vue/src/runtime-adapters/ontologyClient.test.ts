import { describe, expect, it } from 'vitest'
import {
  createFixtureOntologyClient,
  ontologyE1Fixture,
  OntologyCapabilityError,
} from './ontologyClient'

describe('OntologyClient E1 fixture contract', () => {
  it('lists ontology namespaces with owner, policy, and provenance refs', async () => {
    const client = createFixtureOntologyClient()

    const namespaces = await client.listNamespaces()

    expect(namespaces).toEqual(ontologyE1Fixture.responses['ontology.namespaces.list'])
    expect(namespaces[0]).toMatchObject({
      id: 'domain-ontology-workbench',
      owner_repo: 'SocioProphet/ontogenesis',
      policy_ref: 'SocioProphet/ontogenesis#88',
    })
    expect(namespaces[0].provenance_refs).toContain(
      'urn:ontology:prov:namespace:domain-ontology-workbench',
    )
  })

  it('reads the active ontology graph with KGNode and KGEdge identity intact', async () => {
    const client = createFixtureOntologyClient()

    const graph = await client.getGraph('domain-ontology-workbench')

    expect(graph).not.toBeNull()
    expect(graph?.mockBoundary).toBe(true)
    expect(graph?.evidence_level).toBe('E1')
    expect(graph?.classes[0]).toMatchObject({
      id: 'kg:node:ontology:domain-surface',
      kind: 'ontology-class',
    })
    expect(graph?.relationships[0]).toMatchObject({
      id: 'kg:edge:ontology:domain-surface-runtime-adapter',
      source: 'kg:node:ontology:domain-surface',
      target: 'kg:node:ontology:runtime-adapter',
    })
  })

  it('searches ontology terms through service-operation semantics', async () => {
    const client = createFixtureOntologyClient()

    const terms = await client.searchTerms('adapter')

    expect(terms).toHaveLength(1)
    expect(terms[0]).toMatchObject({
      id: 'kg:node:ontology:runtime-adapter',
      label: 'Runtime Adapter',
      kind: 'ontology-property',
    })
    expect(terms[0].provenance_refs).toEqual(['urn:ontology:prov:runtime-adapter'])
  })

  it('validates a class edit proposal as fixture-backed E1', async () => {
    const client = createFixtureOntologyClient()

    const result = await client.validateEdit({
      namespace_id: 'domain-ontology-workbench',
      term_id: 'kg:node:ontology:new-domain-class',
      action: 'create_class',
      label: 'New Domain Class',
      parent_id: 'kg:node:ontology:domain-surface',
    })

    expect(result.operation).toBe('ontology.edit.validate')
    expect(result.status).toBe('valid')
    expect(result.mockBoundary).toBe(true)
    expect(result.evidence_level).toBe('E1')
  })

  it('validates a relationship proposal as fixture-backed E1', async () => {
    const client = createFixtureOntologyClient()

    const result = await client.validateRelationship({
      namespace_id: 'domain-ontology-workbench',
      source: 'kg:node:ontology:domain-surface',
      target: 'kg:node:ontology:runtime-adapter',
      predicate: 'has_property',
      action: 'add',
    })

    expect(result.operation).toBe('ontology.relationship.validate')
    expect(result.status).toBe('valid')
    expect(result.diagnostics[0]).toMatchObject({
      code: 'ontology.relationship.valid_shape',
      edge_id: 'kg:edge:ontology:domain-surface-runtime-adapter',
    })
  })

  it('returns the invalid_edit negative validation case', async () => {
    const client = createFixtureOntologyClient(ontologyE1Fixture, {
      editValidationKey: ontologyE1Fixture.negative_cases.invalid_edit.proposal_key,
    })

    const result = await client.validateEdit({
      namespace_id: 'domain-ontology-workbench',
      term_id: 'kg:node:ontology:orphan-property',
      action: 'create_property',
      label: 'Orphan Property',
    })

    expect(result.status).toBe(ontologyE1Fixture.negative_cases.invalid_edit.status)
    expect(result.diagnostics[0].code).toBe(
      ontologyE1Fixture.negative_cases.invalid_edit.diagnostic_code,
    )
  })

  it('creates a promotion candidate without approving canonical ontology changes', async () => {
    const client = createFixtureOntologyClient()

    const candidate = await client.createPromotionCandidate({
      namespace_id: 'domain-ontology-workbench',
      term_id: 'kg:node:ontology:new-domain-class',
      action: 'create_class',
      label: 'New Domain Class',
      parent_id: 'kg:node:ontology:domain-surface',
    })

    expect(candidate).toEqual(
      ontologyE1Fixture.responses['ontology.promotion.candidate.create'],
    )
    expect(candidate.mockBoundary).toBe(true)
    expect(candidate.required_capability).toBe('capability://ontology.promote.candidate.create')
  })

  it('rejects promotion approval without the required capability', async () => {
    const client = createFixtureOntologyClient()
    const negative = ontologyE1Fixture.negative_cases.promotion_without_capability

    await expect(
      client.approvePromotion({
        candidate_id: negative.candidate_id,
        approved_by: 'fixture-user',
      }),
    ).rejects.toBeInstanceOf(OntologyCapabilityError)

    await expect(
      client.approvePromotion({
        candidate_id: negative.candidate_id,
        approved_by: 'fixture-user',
      }),
    ).rejects.toMatchObject({
      code: 'capability_required',
      required_capability: negative.required_capability,
    })
  })

  it('exports fixture bundle metadata without producing a live ontology promotion', async () => {
    const client = createFixtureOntologyClient()

    const bundle = await client.exportBundle('domain-ontology-workbench')

    expect(bundle).toEqual(
      ontologyE1Fixture.responses['ontology.export.bundle']['domain-ontology-workbench'],
    )
    expect(bundle?.formats).toEqual(['jsonld', 'shacl'])
    expect(bundle?.mockBoundary).toBe(true)
    expect(bundle?.evidence_level).toBe('E1')
  })

  it('returns null for the missing_graph negative case', async () => {
    const client = createFixtureOntologyClient()

    const graph = await client.getGraph(ontologyE1Fixture.negative_cases.missing_graph.namespace_id)

    expect(graph).toBeNull()
  })
})
