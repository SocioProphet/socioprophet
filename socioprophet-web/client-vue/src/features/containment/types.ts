// Containment / Blast-Radius — types, a client-side mirror of the GBRG sever
// engine (gbrg-core::containment), and a network-endpoint fixture.
//
// Fixture-first: this computes residual/contained locally so the surface is
// interactive without a backend. The authoritative engine is the Rust
// gbrg-core `sever_residual` (sociosphere); the semantics here mirror it:
//   - Full: a cut node keeps no traversable edge except allow-listed terminals
//   - Selective: a cut node keeps only `keepLabels` edges traversable

export type SeverScope = 'full' | 'selective';

export interface NetNode {
  id: string;
  label: string;
  kind: 'foothold' | 'workstation' | 'server' | 'domain-controller' | 'control';
  highValue?: boolean;
}
export interface NetEdge { from: string; to: string; label: string }
export interface Topology { nodes: NetNode[]; edges: NetEdge[] }

export interface ContainmentReading {
  source: string;
  scope: SeverScope;
  baseline: string[];
  residual: string[];
  contained: string[];
}

function outEdges(topo: Topology, node: string): NetEdge[] {
  return topo.edges.filter((e) => e.from === node);
}

/** Every node reachable from `source` over out-edges, excluding source. */
export function reachableSet(topo: Topology, source: string): string[] {
  const seen = new Set<string>([source]);
  const out: string[] = [];
  const queue = [source];
  while (queue.length) {
    const d = queue.shift() as string;
    for (const e of outEdges(topo, d)) {
      if (!seen.has(e.to)) { seen.add(e.to); out.push(e.to); queue.push(e.to); }
    }
  }
  return out.sort();
}

/** Cut-aware BFS mirroring gbrg-core::containment::sever_residual. */
export function severResidual(
  topo: Topology,
  source: string,
  cutNodes: string[],
  scope: SeverScope,
  keepLabels: string[],
  allow: string[],
): ContainmentReading {
  const baseline = reachableSet(topo, source);
  const cut = new Set(cutNodes);
  const allowSet = new Set(allow);
  const seen = new Set<string>([source]);
  const reached: string[] = [];
  const queue = [source];

  while (queue.length) {
    const d = queue.shift() as string;
    const edges = outEdges(topo, d);
    let expand: NetEdge[];
    if (!cut.has(d)) {
      expand = edges; // not isolated: traverse everything
    } else if (scope === 'full') {
      expand = []; // fully isolated: nothing expands
    } else {
      // Selective: keep only kept-label edges traversable, and never expand THROUGH an
      // allow-listed endpoint (it is terminal — recorded below but never a pivot).
      expand = edges.filter((e) => keepLabels.includes(e.label) && !allowSet.has(e.to));
    }
    // Allow-listed neighbours of a cut node are terminal-reachable but not expanded.
    if (cut.has(d)) {
      for (const e of edges) {
        if (allowSet.has(e.to) && !seen.has(e.to)) { seen.add(e.to); reached.push(e.to); }
      }
    }
    for (const e of expand) {
      if (!seen.has(e.to)) { seen.add(e.to); reached.push(e.to); queue.push(e.to); }
    }
  }

  const residual = reached.sort();
  const residualSet = new Set(residual);
  const contained = baseline.filter((n) => !residualSet.has(n)).sort();
  return { source, scope, baseline, residual, contained };
}

// ---------------------------------------------------------------------------
// Fixture: the mockup's network — a compromised foothold, an SMB chain up to a
// high-value DC + file server, an RDP path, and the allow-listed EDR channel.
// ---------------------------------------------------------------------------

export const demoTopology: Topology = {
  nodes: [
    { id: 'vvv-648e9d56f1a', label: 'vvv-648e…f1a', kind: 'foothold' },
    { id: 'wks-2970', label: 'wks-2970', kind: 'workstation' },
    { id: 'wks-0d06', label: 'wks-0d06', kind: 'workstation' },
    { id: 'dc-01', label: 'DC-01', kind: 'domain-controller', highValue: true },
    { id: 'file-srv', label: 'FILE-SRV', kind: 'server', highValue: true },
    { id: 'edr-epp', label: 'EDR / EPP', kind: 'control' },
  ],
  edges: [
    { from: 'vvv-648e9d56f1a', to: 'wks-2970', label: 'SMB' },
    { from: 'wks-2970', to: 'dc-01', label: 'SMB' },
    { from: 'dc-01', to: 'file-srv', label: 'SMB' },
    { from: 'vvv-648e9d56f1a', to: 'wks-0d06', label: 'RDP' },
    { from: 'vvv-648e9d56f1a', to: 'edr-epp', label: 'EDR' },
  ],
};

export const DEMO_SOURCE = 'vvv-648e9d56f1a';
export const DEMO_ALLOW = ['edr-epp'];
export const SELECTIVE_KEEP = ['RDP', 'EDR'];
