import { describe, expect, it } from 'vitest';
import { leftRailRoutes, registryEntryForPath, routeRegistry, topNavRoutes } from '../config/routeRegistry';

describe('routeRegistry', () => {
  it('has unique route paths', () => {
    const paths = routeRegistry.map((entry) => entry.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('keeps experimental adapter seams out of the top nav', () => {
    const topPaths = topNavRoutes().map((entry) => entry.path);

    expect(topPaths).not.toContain('/journal');
    expect(topPaths).not.toContain('/code');
    expect(topPaths).not.toContain('/nlboot');
    expect(topPaths).not.toContain('/reader');
  });

  it('keeps core product entry points in top nav', () => {
    const topPaths = topNavRoutes().map((entry) => entry.path);

    expect(topPaths).toContain('/map');
    expect(topPaths).toContain('/professional-intelligence');
    expect(topPaths).toContain('/control-plane');
    expect(topPaths).toContain('/news');
  });

  it('keeps operator shortcuts in the left rail', () => {
    const railPaths = leftRailRoutes().map((entry) => entry.path);

    expect(railPaths).toContain('/journal');
    expect(railPaths).toContain('/code');
    expect(railPaths).toContain('/reader');
    expect(railPaths).toContain('/nlboot');
  });

  it('resolves entries by exact path and child path', () => {
    expect(registryEntryForPath('/map')?.maturity).toBe('L4');
    expect(registryEntryForPath('/professional-intelligence')?.stateMode).toBe('fixture');
    expect(registryEntryForPath('/control-plane/device/demo')?.domain).toBe('SourceOS Lifecycle');
  });
});
