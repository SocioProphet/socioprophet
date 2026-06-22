import { describe, expect, it } from 'vitest'
import {
  getRuntimeFeature,
  listRuntimeFeatures,
  rescuedPlatformRuntimeManifest,
} from './rescuedPlatformFeatures'
import {
  canPresentAsFunctional,
  canPresentAsProductionReady,
} from './baseAdapter'

const requiredFields = [
  'feature_id',
  'display_name',
  'ui_owner_repo',
  'service_owner_repo',
  'adapter_name',
  'runtime_state',
  'mock_boundary',
  'live_contract_ref',
  'authz_profile_ref',
  'integration_test_ref',
  'evidence_level',
] as const

describe('rescued platform runtime feature registry', () => {
  it('captures the rescued platform manifest as backlog, not implementation evidence', () => {
    expect(rescuedPlatformRuntimeManifest.origin.capture_issue).toBe(
      'https://github.com/SocioProphet/sociosphere/issues/333',
    )
    expect(rescuedPlatformRuntimeManifest.origin.interpretation).toContain(
      'not implemented evidence',
    )
  })

  it('declares every feature with runtime ownership metadata', () => {
    const features = listRuntimeFeatures()

    expect(features.length).toBeGreaterThanOrEqual(7)

    for (const feature of features) {
      for (const field of requiredFields) {
        expect(feature).toHaveProperty(field)
      }

      expect(feature.ui_owner_repo).toBe('SocioProphet/socioprophet')
      expect(feature.adapter_name).toMatch(/Client$/)
      expect(feature.evidence_level).toMatch(/^E[0-4]$/)
    }
  })

  it('keeps mock and fixture features below functional claim level', () => {
    for (const feature of listRuntimeFeatures()) {
      if (feature.runtime_state === 'mock' || feature.runtime_state === 'fixture') {
        expect(canPresentAsFunctional(feature)).toBe(false)
        expect(canPresentAsProductionReady(feature)).toBe(false)
      }
    }
  })

  it('resolves canonical feature ids', () => {
    expect(getRuntimeFeature('agent-configuration-workbench')?.service_owner_repo).toBe(
      'SocioProphet/agentplane',
    )
    expect(getRuntimeFeature('domain-ontology-workbench')?.service_owner_repo).toBe(
      'SocioProphet/ontogenesis',
    )
    expect(getRuntimeFeature('educational-dialogue-workbench')?.service_owner_repo).toBe(
      'SocioProphet/alexandrian-academy',
    )
  })
})
