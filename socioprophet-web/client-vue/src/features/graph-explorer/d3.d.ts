/**
 * Minimal ambient shim for the d3 force functions used by the Graph Explorer layout.
 *
 * The estate depends on `d3` (v7) but does not vendor `@types/d3` (a large type package). Rather
 * than pull that in, we declare only the handful of chainable force helpers this panel consumes.
 * The graph model itself is fully typed in features/graph-explorer/*; only the force layout is d3.
 */
declare module 'd3' {
  interface D3Force {
    (): void;
    id(fn: (d: unknown) => string): D3Force;
    distance(v: number | ((l: unknown) => number)): D3Force;
    strength(v: number | ((l: unknown) => number)): D3Force;
    radius(v: number | ((d: unknown) => number)): D3Force;
  }
  interface D3Simulation {
    force(name: string, force: D3Force): D3Simulation;
    nodes(): unknown[];
    tick(iterations?: number): D3Simulation;
    stop(): D3Simulation;
  }
  export function forceSimulation(nodes?: unknown[]): D3Simulation;
  export function forceLink(links?: unknown[]): D3Force;
  export function forceManyBody(): D3Force;
  export function forceCenter(x?: number, y?: number): D3Force;
  export function forceCollide(radius?: number | ((d: unknown) => number)): D3Force;
}
