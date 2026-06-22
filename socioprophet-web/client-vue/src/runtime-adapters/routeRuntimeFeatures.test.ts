import { describe, expect, it } from 'vitest'
import { runtimeFeatureIdsForPath } from './routeRuntimeFeatures'

describe('route runtime feature mapping', () => {
  it('maps map workbench routes to graph and lattice runtime surfaces', () => {
    expect(runtimeFeatureIdsForPath('/map')).toEqual([
      'graph-universe-explorer',
      'lattice-runtime-placement-surface',
    ])
    expect(runtimeFeatureIdsForPath('/map?layer=osm')).toEqual([
      'graph-universe-explorer',
      'lattice-runtime-placement-surface',
    ])
  })

  it('maps analytics routes to graph runtime status', () => {
    expect(runtimeFeatureIdsForPath('/analytics')).toEqual(['graph-universe-explorer'])
    expect(runtimeFeatureIdsForPath('/analytics/flow')).toEqual(['graph-universe-explorer'])
  })

  it('maps feed and reader routes to capture runtime status', () => {
    expect(runtimeFeatureIdsForPath('/feed')).toEqual(['browser-capture-clip-inbox'])
    expect(runtimeFeatureIdsForPath('/reader')).toEqual(['browser-capture-clip-inbox'])
  })

  it('maps law routes to ontology runtime status', () => {
    expect(runtimeFeatureIdsForPath('/law/international-law')).toEqual([
      'domain-ontology-workbench',
    ])
  })

  it('maps people, gates, and settings routes to agent and telemetry status', () => {
    const expected = ['agent-configuration-workbench', 'life-mirror-telemetry-panel']

    expect(runtimeFeatureIdsForPath('/people/search')).toEqual(expected)
    expect(runtimeFeatureIdsForPath('/gates')).toEqual(expected)
    expect(runtimeFeatureIdsForPath('/settings')).toEqual(expected)
  })

  it('defaults to agent configuration runtime status', () => {
    expect(runtimeFeatureIdsForPath('/news')).toEqual(['agent-configuration-workbench'])
    expect(runtimeFeatureIdsForPath('/unknown')).toEqual(['agent-configuration-workbench'])
  })
})
