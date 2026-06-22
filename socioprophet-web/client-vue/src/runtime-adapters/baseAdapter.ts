import type {
  AdapterStatus,
  RuntimeAdapter,
  RuntimeAdapterFeature,
  RuntimeState,
} from './types'
import { assertRuntimeFeature } from './rescuedPlatformFeatures'

export abstract class BaseRuntimeAdapter<TRequest, TResponse>
  implements RuntimeAdapter<TRequest, TResponse>
{
  readonly feature: RuntimeAdapterFeature

  protected constructor(featureId: string) {
    this.feature = assertRuntimeFeature(featureId)
  }

  get adapterName(): string {
    return this.feature.adapter_name
  }

  get featureId(): string {
    return this.feature.feature_id
  }

  get serviceOwnerRepo(): string {
    return this.feature.service_owner_repo
  }

  get evidenceLevel() {
    return this.feature.evidence_level
  }

  get runtimeState(): RuntimeState {
    return this.feature.runtime_state
  }

  status(): AdapterStatus {
    return {
      adapter_name: this.adapterName,
      runtime_state: this.feature.runtime_state,
      evidence_level: this.feature.evidence_level,
      service_owner_repo: this.feature.service_owner_repo,
      live_contract_ref: this.feature.live_contract_ref,
      last_checked_at: null,
      message: statusMessage(this.feature),
    }
  }

  abstract execute(request: TRequest): Promise<TResponse>
}

export function statusMessage(feature: RuntimeAdapterFeature): string {
  switch (feature.runtime_state) {
    case 'mock':
      return feature.mock_boundary ?? 'Mock-only UI surface. No live adapter is declared.'
    case 'fixture':
      return feature.mock_boundary ?? 'Fixture-backed UI surface. Live service contract is pending.'
    case 'live':
      return 'Live adapter is declared. Verify integration tests before production use.'
    case 'degraded':
      return 'Adapter is available in degraded mode. UI must show reduced confidence.'
    case 'unavailable':
      return 'Adapter is unavailable. UI must not present live data.'
    case 'retired':
      return 'Adapter is retired. UI should hide or replace this surface.'
    default:
      return 'Unknown adapter state.'
  }
}

export function canPresentAsFunctional(feature: RuntimeAdapterFeature): boolean {
  return feature.evidence_level === 'E3' || feature.evidence_level === 'E4'
}

export function canPresentAsProductionReady(feature: RuntimeAdapterFeature): boolean {
  return feature.evidence_level === 'E4'
}
