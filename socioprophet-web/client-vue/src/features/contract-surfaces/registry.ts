import type { ContractSurface } from './types'

export const contractSurfaces: ContractSurface[] = [
  {
    id: 'contract-surface:nlboot-evidence',
    label: 'NLBoot Evidence Contract Surface',
    kind: 'nlboot',
    route: '/nlboot',
    owningRepo: 'SourceOS-Linux/sourceos-spec',
    owningPlane: 'SourceOS Lifecycle / NLBoot',
    schemaRef: 'sourceos.nlboot.evidence-boundary',
    runtimeState: 'fixture',
    evidenceLevel: 'E2',
    authority: 'evidence-only',
    audience: 'professional-workroom',
    fixtureRef: 'client-vue:/features/nlboot-evidence',
    liveContractRef: null,
    adapterName: null,
    capabilityProfileRef: null,
    admissionRequirementRefs: [],
    receiptRefs: [],
    boundaryNotice: 'Evidence-only. The UI cannot issue boot commands, mutate EFI state, write disks, reboot, or contact host hardware.',
    allowedActions: [
      {
        id: 'nlboot.inspect-evidence',
        label: 'Inspect evidence records',
        state: 'available',
        requirementRefs: [],
        boundary: 'Read-only evidence inspection.',
      },
    ],
    blockedActions: [
      {
        id: 'nlboot.execute-boot',
        label: 'Execute boot action',
        state: 'blocked',
        requirementRefs: ['agentplane admission', 'host-local executor', 'operator approval'],
        boundary: 'Execution is outside the Vue shell and requires governed runtime admission.',
      },
    ],
  },
  {
    id: 'contract-surface:agent-pre-dispatch',
    label: 'Agent Pre-Dispatch Contract Surface',
    kind: 'agent',
    route: '/journal',
    owningRepo: 'SourceOS-Linux/agent-term',
    owningPlane: 'Agent Registry / Policy Fabric / AgentTerm',
    schemaRef: 'agent-term.pre-dispatch-decision.v0.1',
    runtimeState: 'fixture',
    evidenceLevel: 'E2',
    authority: 'admission-required',
    audience: 'internal-workroom',
    fixtureRef: 'SourceOS-Linux/agent-term#45',
    liveContractRef: null,
    adapterName: 'agent-term-pre-dispatch',
    capabilityProfileRef: 'agent-registry grants required for non-human participants',
    admissionRequirementRefs: ['Agent Registry ref', 'grant refs', 'session ref', 'Policy Fabric decision refs'],
    receiptRefs: [],
    boundaryNotice: 'AgentTerm pre-dispatch decisions are decision-only and must not perform runtime dispatch.',
    allowedActions: [
      {
        id: 'agent.inspect-boundary',
        label: 'Inspect pre-dispatch requirements',
        state: 'available',
        requirementRefs: [],
        boundary: 'Read-only contract inspection.',
      },
    ],
    blockedActions: [
      {
        id: 'agent.dispatch',
        label: 'Dispatch agent action',
        state: 'blocked',
        requirementRefs: ['live Agent Registry lookup', 'live Policy Fabric decision', 'AgentPlane admission'],
        boundary: 'Dispatch must occur in the owning runtime plane, not inside the UI registry.',
      },
    ],
  },
  {
    id: 'contract-surface:browser-runtime-boundary',
    label: 'Browser Runtime Boundary Surface',
    kind: 'browser',
    route: '/reader',
    owningRepo: 'SourceOS-Linux/BearBrowser',
    owningPlane: 'BearBrowser Runtime / Credential Broker',
    schemaRef: 'bearbrowser.runtime-boundary.v1',
    runtimeState: 'fixture',
    evidenceLevel: 'E2',
    authority: 'runtime-control-required',
    audience: 'professional-workroom',
    fixtureRef: 'SourceOS-Linux/BearBrowser#37',
    liveContractRef: null,
    adapterName: 'bearbrowser-runtime-boundary',
    capabilityProfileRef: 'credential export denied; Agent Registry required for agent actors',
    admissionRequirementRefs: ['Policy decision ref', 'Agent Registry ref for agent actor', 'redaction boundary'],
    receiptRefs: [],
    boundaryNotice: 'Browser runtime boundary records are decision-only and cannot grant credential access, submit forms, or bridge workspace downloads.',
    allowedActions: [
      {
        id: 'browser.inspect-boundary',
        label: 'Inspect browser boundary',
        state: 'available',
        requirementRefs: [],
        boundary: 'Read-only runtime-boundary inspection.',
      },
    ],
    blockedActions: [
      {
        id: 'browser.credential-export',
        label: 'Export credential',
        state: 'blocked',
        requirementRefs: ['credential broker policy denies export'],
        boundary: 'Credential export remains denied by contract.',
      },
    ],
  },
  {
    id: 'contract-surface:model-carry-boundary',
    label: 'Model Carry Authorization Boundary',
    kind: 'model-carry',
    route: '/control-plane',
    owningRepo: 'SourceOS-Linux/sourceos-model-carry',
    owningPlane: 'SourceOS Model Carry',
    schemaRef: 'ModelCarryAuthorizationBoundary v0.1',
    runtimeState: 'fixture',
    evidenceLevel: 'E2',
    authority: 'evidence-only',
    audience: 'internal-workroom',
    fixtureRef: 'SourceOS-Linux/sourceos-model-carry#12',
    liveContractRef: null,
    adapterName: 'model-carry-boundary',
    capabilityProfileRef: null,
    admissionRequirementRefs: [],
    receiptRefs: [],
    boundaryNotice: 'Model carry profiles are reference objects only. They do not authorize prompt egress, network, tool use, download, training, promotion, or lifecycle mutation.',
    allowedActions: [
      {
        id: 'model-carry.inspect-profile',
        label: 'Inspect carried profile',
        state: 'available',
        requirementRefs: [],
        boundary: 'Read-only carry-profile inspection.',
      },
    ],
    blockedActions: [
      {
        id: 'model-carry.download-model',
        label: 'Download model weights',
        state: 'blocked',
        requirementRefs: ['explicit pull/install action', 'policy admission'],
        boundary: 'Carry profile does not authorize download.',
      },
    ],
  },
]

export function contractSurfaceById(id: string): ContractSurface | undefined {
  return contractSurfaces.find((surface) => surface.id === id)
}

export function contractSurfacesForRoute(route: string): ContractSurface[] {
  return contractSurfaces.filter((surface) => surface.route === route)
}
