import { describe, expect, it } from 'vitest'
import { contractSurfaceById, contractSurfaces, contractSurfacesForRoute } from './registry'
import { canAppearInProfessionalWorkroom, isExecutionAuthorized, requiresAdmission } from './types'

describe('contract surface registry', () => {
  it('contains no live-execution-authorized surfaces in the initial workroom registry', () => {
    expect(contractSurfaces.length).toBeGreaterThan(0)
    expect(contractSurfaces.some(isExecutionAuthorized)).toBe(false)
  })

  it('keeps NLBoot evidence-only and blocks boot execution', () => {
    const surface = contractSurfaceById('contract-surface:nlboot-evidence')
    expect(surface).toBeDefined()
    expect(surface?.authority).toBe('evidence-only')
    expect(surface?.blockedActions.some((action) => action.id === 'nlboot.execute-boot')).toBe(true)
    expect(surface?.boundaryNotice).toContain('cannot issue boot commands')
  })

  it('separates professional-workroom surfaces from internal-only surfaces', () => {
    const professional = contractSurfaces.filter(canAppearInProfessionalWorkroom)
    expect(professional.map((surface) => surface.id)).toContain('contract-surface:nlboot-evidence')
    expect(professional.map((surface) => surface.id)).toContain('contract-surface:browser-runtime-boundary')
    expect(professional.map((surface) => surface.id)).not.toContain('contract-surface:agent-pre-dispatch')
  })

  it('marks runtime-adjacent surfaces as requiring admission or runtime control', () => {
    const agent = contractSurfaceById('contract-surface:agent-pre-dispatch')
    const browser = contractSurfaceById('contract-surface:browser-runtime-boundary')
    expect(agent && requiresAdmission(agent)).toBe(true)
    expect(browser && requiresAdmission(browser)).toBe(true)
  })

  it('indexes contract surfaces by route', () => {
    expect(contractSurfacesForRoute('/nlboot').map((surface) => surface.id)).toEqual([
      'contract-surface:nlboot-evidence',
    ])
  })
})
