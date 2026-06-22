export function runtimeFeatureIdsForPath(path: string): string[] {
  if (path.startsWith('/map')) {
    return ['graph-universe-explorer', 'lattice-runtime-placement-surface']
  }

  if (path.startsWith('/analytics')) {
    return ['graph-universe-explorer']
  }

  if (path.startsWith('/feed') || path.startsWith('/reader')) {
    return ['browser-capture-clip-inbox']
  }

  if (path.startsWith('/law')) {
    return ['domain-ontology-workbench']
  }

  if (path.startsWith('/people') || path.startsWith('/gates') || path.startsWith('/settings')) {
    return ['agent-configuration-workbench', 'life-mirror-telemetry-panel']
  }

  return ['agent-configuration-workbench']
}
