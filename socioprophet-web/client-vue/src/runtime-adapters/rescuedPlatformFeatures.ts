import type { RuntimeAdapterFeature, RuntimeAdapterManifest } from './types'

export const rescuedPlatformRuntimeManifest: RuntimeAdapterManifest = {
  schema_version: '0.1.0',
  origin: {
    source: 'rescued_chat_artifact',
    capture_issue: 'https://github.com/SocioProphet/sociosphere/issues/333',
    interpretation: 'product-integration backlog; not implemented evidence',
  },
  features: [
    {
      feature_id: 'graph-universe-explorer',
      display_name: 'Graph Universe Explorer',
      ui_owner_repo: 'SocioProphet/socioprophet',
      service_owner_repo: 'SocioProphet/Knowledge-Graph',
      adapter_name: 'KnowledgeGraphClient',
      runtime_state: 'fixture',
      mock_boundary: 'layout and sample graph only until graph-query contract is wired',
      fixture_ref: 'SocioProphet/sociosphere:protocol/ui-runtime-adapter/v0/fixtures/rescued-platform-ui.features.v0.json#/features/0',
      live_contract_ref: 'SocioProphet/Knowledge-Graph:docs/contracts/graph-universe-explorer-runtime-adapter.md',
      authz_profile_ref: 'SocioProphet/mcp-a2a-zero-trust#6',
      integration_test_ref: 'pending',
      evidence_level: 'E1',
    },
    {
      feature_id: 'domain-ontology-workbench',
      display_name: 'Domain Ontology Workbench',
      ui_owner_repo: 'SocioProphet/socioprophet',
      service_owner_repo: 'SocioProphet/ontogenesis',
      adapter_name: 'OntologyClient',
      runtime_state: 'fixture',
      mock_boundary: 'ontology tree and editor states only until validation/promotion contract is implemented',
      fixture_ref: 'SocioProphet/sociosphere:protocol/ui-runtime-adapter/v0/fixtures/rescued-platform-ui.features.v0.json#/features/1',
      live_contract_ref: 'https://github.com/SocioProphet/ontogenesis/issues/88',
      authz_profile_ref: 'SocioProphet/mcp-a2a-zero-trust#6',
      integration_test_ref: 'pending',
      evidence_level: 'E1',
    },
    {
      feature_id: 'agent-configuration-workbench',
      display_name: 'Agent Configuration Workbench',
      ui_owner_repo: 'SocioProphet/socioprophet',
      service_owner_repo: 'SocioProphet/agentplane',
      adapter_name: 'AgentPlaneClient',
      runtime_state: 'fixture',
      mock_boundary: 'agent profile, skills, telemetry, and evolution candidates are fixture-backed until AgentPlane contracts are live',
      fixture_ref: 'SocioProphet/sociosphere:protocol/ui-runtime-adapter/v0/fixtures/rescued-platform-ui.features.v0.json#/features/2',
      live_contract_ref: 'https://github.com/SocioProphet/agentplane/issues/159',
      authz_profile_ref: 'SocioProphet/mcp-a2a-zero-trust#6',
      integration_test_ref: 'pending',
      evidence_level: 'E1',
    },
    {
      feature_id: 'life-mirror-telemetry-panel',
      display_name: 'Life Mirror Telemetry Panel',
      ui_owner_repo: 'SocioProphet/socioprophet',
      service_owner_repo: 'SocioProphet/agentplane',
      adapter_name: 'TelemetryClient',
      runtime_state: 'fixture',
      mock_boundary: 'health bands and telemetry summaries are fixture-backed until live telemetry is wired',
      fixture_ref: 'SocioProphet/sociosphere:protocol/ui-runtime-adapter/v0/fixtures/rescued-platform-ui.features.v0.json#/features/3',
      live_contract_ref: 'https://github.com/SocioProphet/agentplane/issues/159',
      authz_profile_ref: 'SocioProphet/mcp-a2a-zero-trust#6',
      integration_test_ref: 'pending',
      evidence_level: 'E1',
    },
    {
      feature_id: 'browser-capture-clip-inbox',
      display_name: 'Browser Capture Status and Clip Inbox',
      ui_owner_repo: 'SocioProphet/socioprophet',
      service_owner_repo: 'SocioProphet/socioprophet-standards-knowledge',
      adapter_name: 'CaptureClient',
      runtime_state: 'mock',
      mock_boundary: 'no browser extension or capture service is declared here; standards must land first',
      fixture_ref: null,
      live_contract_ref: 'https://github.com/SocioProphet/socioprophet-standards-knowledge/issues/79',
      authz_profile_ref: 'SocioProphet/mcp-a2a-zero-trust#6',
      integration_test_ref: 'pending',
      evidence_level: 'E0',
    },
    {
      feature_id: 'educational-dialogue-workbench',
      display_name: 'Educational Dialogue Workbench',
      ui_owner_repo: 'SocioProphet/socioprophet',
      service_owner_repo: 'SocioProphet/alexandrian-academy',
      adapter_name: 'EducationDialogueClient',
      runtime_state: 'fixture',
      mock_boundary: 'dialogue modes and learner telemetry are fixture-backed until Alexandrian Academy runtime contract lands',
      fixture_ref: 'SocioProphet/sociosphere:protocol/ui-runtime-adapter/v0/fixtures/rescued-platform-ui.features.v0.json#/features/5',
      live_contract_ref: 'https://github.com/SocioProphet/alexandrian-academy/issues/18',
      authz_profile_ref: 'SocioProphet/mcp-a2a-zero-trust#6',
      integration_test_ref: 'pending',
      evidence_level: 'E1',
    },
    {
      feature_id: 'lattice-runtime-placement-surface',
      display_name: 'Lattice Runtime / Execution Placement Surface',
      ui_owner_repo: 'SocioProphet/socioprophet',
      service_owner_repo: 'SocioProphet/lattice-forge',
      adapter_name: 'LatticeRuntimeClient',
      runtime_state: 'mock',
      mock_boundary: 'runtime placement, notebook routing, and compute-marketplace concepts are not yet assigned to live contracts',
      fixture_ref: null,
      live_contract_ref: 'https://github.com/SocioProphet/lattice-forge/issues/16',
      authz_profile_ref: 'SocioProphet/mcp-a2a-zero-trust#6',
      integration_test_ref: 'pending',
      evidence_level: 'E0',
    },
  ],
}

export function listRuntimeFeatures(): RuntimeAdapterFeature[] {
  return rescuedPlatformRuntimeManifest.features
}

export function getRuntimeFeature(featureId: string): RuntimeAdapterFeature | undefined {
  return rescuedPlatformRuntimeManifest.features.find(
    (feature) => feature.feature_id === featureId,
  )
}

export function assertRuntimeFeature(featureId: string): RuntimeAdapterFeature {
  const feature = getRuntimeFeature(featureId)

  if (!feature) {
    throw new Error(`Unknown runtime adapter feature: ${featureId}`)
  }

  return feature
}
