import type { EdgeId, KGEdge, KGNode, NodeId } from './knowledgeGraphClient'

export type OntologyNamespaceId = string
export type OntologyGraphId = string
export type OntologyTermId = NodeId
export type OntologyPromotionCandidateId = string

export type OntologyOperation =
  | 'ontology.namespaces.list'
  | 'ontology.graph.get'
  | 'ontology.term.search'
  | 'ontology.edit.validate'
  | 'ontology.relationship.validate'
  | 'ontology.promotion.candidate.create'
  | 'ontology.promotion.approve'
  | 'ontology.export.bundle'

export type OntologyValidationStatus = 'valid' | 'invalid' | 'requires_capability'

export interface OntologyNamespace {
  id: OntologyNamespaceId
  label: string
  owner_repo: string
  active_graph_id: OntologyGraphId
  policy_ref: string
  provenance_refs: string[]
}

export interface OntologyGraph {
  id: OntologyGraphId
  namespace_id: OntologyNamespaceId
  label: string
  classes: KGNode[]
  properties: KGNode[]
  relationships: KGEdge[]
  mockBoundary: true
  evidence_level: 'E1'
  provenance_refs: string[]
}

export interface OntologyDiagnostic {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  term_id?: OntologyTermId
  edge_id?: EdgeId
}

export interface OntologyValidationResult {
  operation: Extract<OntologyOperation, 'ontology.edit.validate' | 'ontology.relationship.validate'>
  status: OntologyValidationStatus
  diagnostics: OntologyDiagnostic[]
  mockBoundary: true
  evidence_level: 'E1'
  required_capability?: string
}

export interface OntologyEditProposal {
  namespace_id: OntologyNamespaceId
  term_id: OntologyTermId
  action: 'create_class' | 'create_property' | 'rename' | 'deprecate'
  label: string
  parent_id?: OntologyTermId
}

export interface OntologyRelationshipProposal {
  namespace_id: OntologyNamespaceId
  source: OntologyTermId
  target: OntologyTermId
  predicate: string
  action: 'add' | 'remove'
}

export interface OntologyPromotionCandidate {
  id: OntologyPromotionCandidateId
  operation: Extract<OntologyOperation, 'ontology.promotion.candidate.create'>
  namespace_id: OntologyNamespaceId
  validation_status: OntologyValidationStatus
  required_capability: string
  mockBoundary: true
  evidence_level: 'E1'
  provenance_refs: string[]
}

export interface OntologyPromotionApproval {
  candidate_id: OntologyPromotionCandidateId
  approved_by: string
  capability_ref?: string
}

export interface OntologyPromotionApprovalResult {
  operation: Extract<OntologyOperation, 'ontology.promotion.approve'>
  candidate_id: OntologyPromotionCandidateId
  status: 'approved' | 'denied'
  mockBoundary: true
  evidence_level: 'E1'
  denial_reason?: string
}

export interface OntologyExportBundle {
  operation: Extract<OntologyOperation, 'ontology.export.bundle'>
  namespace_id: OntologyNamespaceId
  formats: Array<'jsonld' | 'rdf' | 'owl' | 'shacl'>
  artifact_refs: string[]
  mockBoundary: true
  evidence_level: 'E1'
}

export interface OntologyClient {
  listNamespaces(): Promise<OntologyNamespace[]>
  getGraph(namespaceId: OntologyNamespaceId): Promise<OntologyGraph | null>
  searchTerms(query: string, namespaceId?: OntologyNamespaceId): Promise<KGNode[]>
  validateEdit(proposal: OntologyEditProposal): Promise<OntologyValidationResult>
  validateRelationship(proposal: OntologyRelationshipProposal): Promise<OntologyValidationResult>
  createPromotionCandidate(proposal: OntologyEditProposal): Promise<OntologyPromotionCandidate>
  approvePromotion(approval: OntologyPromotionApproval): Promise<OntologyPromotionApprovalResult>
  exportBundle(namespaceId: OntologyNamespaceId): Promise<OntologyExportBundle | null>
}

export class OntologyCapabilityError extends Error {
  readonly code = 'capability_required'
  readonly required_capability: string

  constructor(requiredCapability: string, message: string) {
    super(message)
    this.name = 'OntologyCapabilityError'
    this.required_capability = requiredCapability
  }
}

export interface OntologyFixture {
  namespaces: OntologyNamespace[]
  graphs: Record<OntologyNamespaceId, OntologyGraph>
  responses: {
    'ontology.namespaces.list': OntologyNamespace[]
    'ontology.term.search': Record<string, OntologyTermId[]>
    'ontology.edit.validate': Record<string, OntologyValidationResult>
    'ontology.relationship.validate': Record<string, OntologyValidationResult>
    'ontology.promotion.candidate.create': OntologyPromotionCandidate
    'ontology.export.bundle': Record<OntologyNamespaceId, OntologyExportBundle>
  }
  negative_cases: {
    missing_graph: { namespace_id: OntologyNamespaceId; expected: null }
    invalid_edit: { proposal_key: string; status: 'invalid'; diagnostic_code: string }
    promotion_without_capability: {
      candidate_id: OntologyPromotionCandidateId
      required_capability: string
      error: { code: 'capability_required'; message: string }
    }
  }
}

const domainClass: KGNode = {
  id: 'kg:node:ontology:domain-surface',
  label: 'Domain Surface',
  kind: 'ontology-class',
  properties: { namespace: 'domain-ontology-workbench', iri: 'sp:DomainSurface' },
  provenance_refs: ['urn:ontology:prov:domain-surface'],
}

const adapterProperty: KGNode = {
  id: 'kg:node:ontology:runtime-adapter',
  label: 'Runtime Adapter',
  kind: 'ontology-property',
  properties: { namespace: 'domain-ontology-workbench', iri: 'sp:runtimeAdapter' },
  provenance_refs: ['urn:ontology:prov:runtime-adapter'],
}

const adapterRelationship: KGEdge = {
  id: 'kg:edge:ontology:domain-surface-runtime-adapter',
  source: domainClass.id,
  target: adapterProperty.id,
  predicate: 'has_property',
  label: 'has property',
  properties: { namespace: 'domain-ontology-workbench' },
  provenance_refs: ['urn:ontology:prov:domain-surface-runtime-adapter'],
}

export const ontologyE1Fixture: OntologyFixture = {
  namespaces: [
    {
      id: 'domain-ontology-workbench',
      label: 'Domain Ontology Workbench',
      owner_repo: 'SocioProphet/ontogenesis',
      active_graph_id: 'graph:domain-ontology-workbench:e1',
      policy_ref: 'SocioProphet/ontogenesis#88',
      provenance_refs: ['urn:ontology:prov:namespace:domain-ontology-workbench'],
    },
  ],
  graphs: {
    'domain-ontology-workbench': {
      id: 'graph:domain-ontology-workbench:e1',
      namespace_id: 'domain-ontology-workbench',
      label: 'Domain Ontology Workbench E1 Fixture Graph',
      classes: [domainClass],
      properties: [adapterProperty],
      relationships: [adapterRelationship],
      mockBoundary: true,
      evidence_level: 'E1',
      provenance_refs: ['urn:ontology:prov:graph:domain-ontology-workbench:e1'],
    },
  },
  responses: {
    'ontology.namespaces.list': [
      {
        id: 'domain-ontology-workbench',
        label: 'Domain Ontology Workbench',
        owner_repo: 'SocioProphet/ontogenesis',
        active_graph_id: 'graph:domain-ontology-workbench:e1',
        policy_ref: 'SocioProphet/ontogenesis#88',
        provenance_refs: ['urn:ontology:prov:namespace:domain-ontology-workbench'],
      },
    ],
    'ontology.term.search': {
      domain: [domainClass.id],
      adapter: [adapterProperty.id],
    },
    'ontology.edit.validate': {
      valid_class_create: {
        operation: 'ontology.edit.validate',
        status: 'valid',
        diagnostics: [
          {
            code: 'ontology.edit.valid_shape',
            severity: 'info',
            message: 'Class creation proposal conforms to the E1 fixture contract.',
          },
        ],
        mockBoundary: true,
        evidence_level: 'E1',
      },
      invalid_orphan_property: {
        operation: 'ontology.edit.validate',
        status: 'invalid',
        diagnostics: [
          {
            code: 'ontology.edit.parent_required',
            severity: 'error',
            message: 'Property creation requires a parent class or domain term.',
          },
        ],
        mockBoundary: true,
        evidence_level: 'E1',
      },
    },
    'ontology.relationship.validate': {
      valid_relationship_add: {
        operation: 'ontology.relationship.validate',
        status: 'valid',
        diagnostics: [
          {
            code: 'ontology.relationship.valid_shape',
            severity: 'info',
            message: 'Relationship addition conforms to the E1 fixture contract.',
            edge_id: adapterRelationship.id,
          },
        ],
        mockBoundary: true,
        evidence_level: 'E1',
      },
    },
    'ontology.promotion.candidate.create': {
      id: 'ontology-promotion-candidate:e1:domain-surface-extension',
      operation: 'ontology.promotion.candidate.create',
      namespace_id: 'domain-ontology-workbench',
      validation_status: 'valid',
      required_capability: 'capability://ontology.promote.candidate.create',
      mockBoundary: true,
      evidence_level: 'E1',
      provenance_refs: ['urn:ontology:prov:promotion-candidate:e1'],
    },
    'ontology.export.bundle': {
      'domain-ontology-workbench': {
        operation: 'ontology.export.bundle',
        namespace_id: 'domain-ontology-workbench',
        formats: ['jsonld', 'shacl'],
        artifact_refs: [
          'fixture://ontology/domain-ontology-workbench/export.jsonld',
          'fixture://ontology/domain-ontology-workbench/export.shacl',
        ],
        mockBoundary: true,
        evidence_level: 'E1',
      },
    },
  },
  negative_cases: {
    missing_graph: { namespace_id: 'missing-namespace', expected: null },
    invalid_edit: {
      proposal_key: 'invalid_orphan_property',
      status: 'invalid',
      diagnostic_code: 'ontology.edit.parent_required',
    },
    promotion_without_capability: {
      candidate_id: 'ontology-promotion-candidate:e1:domain-surface-extension',
      required_capability: 'capability://ontology.promote.approve',
      error: {
        code: 'capability_required',
        message: 'Ontology promotion approval requires capability://ontology.promote.approve.',
      },
    },
  },
}

interface FixtureOntologyClientOptions {
  editValidationKey?: keyof OntologyFixture['responses']['ontology.edit.validate']
  relationshipValidationKey?: keyof OntologyFixture['responses']['ontology.relationship.validate']
}

export function createFixtureOntologyClient(
  fixture: OntologyFixture = ontologyE1Fixture,
  options: FixtureOntologyClientOptions = {},
): OntologyClient {
  const termsById = new Map<NodeId, KGNode>()
  for (const graph of Object.values(fixture.graphs)) {
    for (const term of [...graph.classes, ...graph.properties]) {
      termsById.set(term.id, term)
    }
  }

  return {
    async listNamespaces() {
      return fixture.responses['ontology.namespaces.list']
    },

    async getGraph(namespaceId: OntologyNamespaceId) {
      return fixture.graphs[namespaceId] || null
    },

    async searchTerms(query: string) {
      const normalized = query.trim().toLowerCase()
      const ids = fixture.responses['ontology.term.search'][normalized] || []
      return ids.map((id) => termsById.get(id)).filter((term): term is KGNode => Boolean(term))
    },

    async validateEdit() {
      const key = options.editValidationKey || 'valid_class_create'
      return fixture.responses['ontology.edit.validate'][key]
    },

    async validateRelationship() {
      const key = options.relationshipValidationKey || 'valid_relationship_add'
      return fixture.responses['ontology.relationship.validate'][key]
    },

    async createPromotionCandidate() {
      return fixture.responses['ontology.promotion.candidate.create']
    },

    async approvePromotion(approval: OntologyPromotionApproval) {
      const negative = fixture.negative_cases.promotion_without_capability
      if (approval.candidate_id === negative.candidate_id && approval.capability_ref !== negative.required_capability) {
        throw new OntologyCapabilityError(negative.required_capability, negative.error.message)
      }

      return {
        operation: 'ontology.promotion.approve',
        candidate_id: approval.candidate_id,
        status: 'approved',
        mockBoundary: true,
        evidence_level: 'E1',
      }
    },

    async exportBundle(namespaceId: OntologyNamespaceId) {
      return fixture.responses['ontology.export.bundle'][namespaceId] || null
    },
  }
}
