import type { EvidenceLevel, RuntimeState } from '../../runtime-adapters/types'

export type ContractSurfaceKind =
  | 'nlboot'
  | 'agent'
  | 'run'
  | 'workstation'
  | 'browser'
  | 'model-carry'
  | 'feed'
  | 'workspace'

export type ContractSurfaceAudience = 'internal-workroom' | 'professional-workroom' | 'client-visible'

export type ContractSurfaceAuthority =
  | 'evidence-only'
  | 'request-only'
  | 'admission-required'
  | 'runtime-control-required'
  | 'authority-mutation-required'
  | 'live-execution-authorized'

export type ContractActionState = 'available' | 'blocked' | 'disabled' | 'mock-only' | 'fixture-only'

export interface ContractActionAffordance {
  id: string
  label: string
  state: ContractActionState
  requirementRefs: string[]
  boundary: string
}

export interface ContractSurface {
  id: string
  label: string
  kind: ContractSurfaceKind
  route: string
  owningRepo: string
  owningPlane: string
  schemaRef: string
  runtimeState: RuntimeState
  evidenceLevel: EvidenceLevel
  authority: ContractSurfaceAuthority
  audience: ContractSurfaceAudience
  fixtureRef: string | null
  liveContractRef: string | null
  adapterName: string | null
  capabilityProfileRef: string | null
  admissionRequirementRefs: string[]
  receiptRefs: string[]
  boundaryNotice: string
  allowedActions: ContractActionAffordance[]
  blockedActions: ContractActionAffordance[]
}

export function canAppearInProfessionalWorkroom(surface: ContractSurface): boolean {
  return surface.audience === 'professional-workroom' || surface.audience === 'client-visible'
}

export function isExecutionAuthorized(surface: ContractSurface): boolean {
  return surface.authority === 'live-execution-authorized' && surface.runtimeState === 'live'
}

export function requiresAdmission(surface: ContractSurface): boolean {
  return surface.authority === 'admission-required' || surface.authority === 'runtime-control-required'
}
