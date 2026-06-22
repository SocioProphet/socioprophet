export type RuntimeState =
  | 'mock'
  | 'fixture'
  | 'live'
  | 'degraded'
  | 'unavailable'
  | 'retired'

export type EvidenceLevel = 'E0' | 'E1' | 'E2' | 'E3' | 'E4'

export interface RuntimeAdapterFeature {
  feature_id: string
  display_name: string
  ui_owner_repo: string
  service_owner_repo: string
  adapter_name: string
  runtime_state: RuntimeState
  mock_boundary: string | null
  fixture_ref: string | null
  live_contract_ref: string | null
  authz_profile_ref: string | null
  integration_test_ref: string | null
  evidence_level: EvidenceLevel
}

export interface RuntimeAdapterManifest {
  schema_version: string
  origin: {
    source: string
    capture_issue: string
    interpretation: string
  }
  features: RuntimeAdapterFeature[]
}

export interface AdapterStatus {
  adapter_name: string
  runtime_state: RuntimeState
  evidence_level: EvidenceLevel
  service_owner_repo: string
  live_contract_ref: string | null
  last_checked_at: string | null
  message: string
}

export interface RuntimeAdapter<TRequest, TResponse> {
  readonly adapterName: string
  readonly featureId: string
  readonly serviceOwnerRepo: string
  readonly evidenceLevel: EvidenceLevel
  status(): AdapterStatus
  execute(request: TRequest): Promise<TResponse>
}

export class RuntimeAdapterUnavailableError extends Error {
  readonly featureId: string
  readonly adapterName: string
  readonly runtimeState: RuntimeState

  constructor(params: {
    featureId: string
    adapterName: string
    runtimeState: RuntimeState
    message: string
  }) {
    super(params.message)
    this.name = 'RuntimeAdapterUnavailableError'
    this.featureId = params.featureId
    this.adapterName = params.adapterName
    this.runtimeState = params.runtimeState
  }
}
