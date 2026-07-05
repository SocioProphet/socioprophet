// Governed-triparty marketplace — netting cells + typed bundles. Shapes mirror
// the sourceos-spec NettingCell / TripartyBundle contract. The triparty cell is
// the smallest local clearing object that couples value + proof + authority +
// disclosure and governs release/refund/export by policy, not confidence. Cells
// can clear supply-chain trades (supplyChainRef → the chain node/route).

export type Stage = 'Observed' | 'Proposed' | 'Ready' | 'Escrowed' | 'Filled' | 'Verified' | 'Released' | 'Exported' | 'Refunded' | 'Reversed';
export type TruthClass = 'PROVEN' | 'ATTESTED' | 'INFERRED' | 'REPUTED';
export type Admissibility = 'evidence' | 'admit' | 'release' | 'export';
export type BundleKind = 'intent' | 'acceptance' | 'escrow' | 'fill' | 'verification' | 'export';

// Ordered lifecycles (for progress rendering + gating).
export const STAGES: Stage[] = ['Observed', 'Proposed', 'Ready', 'Escrowed', 'Filled', 'Verified', 'Released', 'Exported'];
export const BUNDLE_ORDER: BundleKind[] = ['intent', 'acceptance', 'escrow', 'fill', 'verification', 'export'];
export const ADMIT_LATTICE: Admissibility[] = ['evidence', 'admit', 'release', 'export']; // ⊇ order
export const TRUTH_ORDER: TruthClass[] = ['REPUTED', 'INFERRED', 'ATTESTED', 'PROVEN'];

export interface Leg { party: string; role: 'A' | 'B' | 'C'; value?: string; capability?: string; proof?: string }
export interface Bundle { id: string; kind: BundleKind; summary: string; truthClass: TruthClass; attested: boolean }

export interface Cell {
  id: string;
  name: string;
  legs: Leg[];
  stage: Stage;
  truthClass: TruthClass;
  admissibility: Admissibility;
  bundles: Bundle[];
  netAmount: number;
  asset: string;
  supplyChainNode?: string; // supply-chain node id this cell clears
  note: string;
}

function bundles(cellId: string, upTo: BundleKind, truthByKind: Partial<Record<BundleKind, TruthClass>> = {}): Bundle[] {
  const idx = BUNDLE_ORDER.indexOf(upTo);
  return BUNDLE_ORDER.slice(0, idx + 1).map((k) => ({
    id: `urn:srcos:triparty-bundle:${cellId}-${k}`,
    kind: k,
    summary: {
      intent: 'Counterparties declare terms + scope', acceptance: 'Provider publishes suitability + witnesses',
      escrow: 'Value deposited; channel opened', fill: 'Service/goods delivered + signed metadata',
      verification: 'Independent witness confirms delivery', export: 'Cross-boundary release under stricter scope',
    }[k],
    truthClass: truthByKind[k] ?? 'ATTESTED',
    attested: k === 'verification' || k === 'export',
  }));
}

export const cells: Cell[] = [
  {
    id: 'cu-trade-0001', name: 'Copper cathode · Antofagasta → Shanghai',
    legs: [
      { party: 'Antofagasta Port', role: 'A', value: '500t Cu cathode', proof: 'bill-of-lading' },
      { party: 'Shanghai Buyer', role: 'B', value: '1.16M ASI', capability: 'import-license/cn' },
      { party: 'Clearing Verifier', role: 'C', proof: 'route delivery attestation' },
    ],
    stage: 'Verified', truthClass: 'ATTESTED', admissibility: 'release',
    bundles: bundles('cu-trade-0001', 'verification'),
    netAmount: 1160000, asset: 'ASI', supplyChainNode: 'route-anf-sha',
    note: 'Delivery witnessed by the C leg; cleared to release. Export would require the stricter export gate.',
  },
  {
    id: 'semis-trade-0002', name: 'Wafer lot · Kaohsiung → Los Angeles',
    legs: [
      { party: 'Kaohsiung Port', role: 'A', value: '2k wafers', proof: 'lot manifest' },
      { party: 'NVIDIA (OEM)', role: 'B', value: '4.2M ASI', capability: 'ITAR clearance' },
      { party: 'Clearing Verifier', role: 'C' },
    ],
    stage: 'Escrowed', truthClass: 'INFERRED', admissibility: 'admit',
    bundles: bundles('semis-trade-0002', 'escrow', { escrow: 'INFERRED' }),
    netAmount: 4200000, asset: 'ASI', supplyChainNode: 'route-khh-lax',
    note: 'Value escrowed; fill pending. Truth class INFERRED until the fill + verification bundles attest.',
  },
  {
    id: 'energy-trade-0003', name: 'Solar PPA · Atacama grid',
    legs: [
      { party: 'Atacama Solar', role: 'A', value: '120 GWh', proof: 'metered output' },
      { party: 'Chuquicamata Smelter', role: 'B', value: '0.9M ASI', capability: 'grid interconnect' },
      { party: 'Grid Clearing', role: 'C', proof: 'settlement meter attestation' },
    ],
    stage: 'Exported', truthClass: 'PROVEN', admissibility: 'export',
    bundles: bundles('energy-trade-0003', 'export', { verification: 'PROVEN', export: 'PROVEN' }),
    netAmount: 900000, asset: 'ASI', supplyChainNode: 'atacama-solar',
    note: 'Fully proven and exported across the grid boundary — passed the strictest admissibility gate.',
  },
  {
    id: 'grain-trade-0004', name: 'Grain forward · US Grain Belt',
    legs: [
      { party: 'Grain-Belt Cooperatives', role: 'A', value: '50k bu forward', proof: 'warehouse receipt' },
      { party: 'Processor', role: 'B', value: '0.3M ASI' },
      { party: 'Clearing Verifier', role: 'C' },
    ],
    stage: 'Proposed', truthClass: 'REPUTED', admissibility: 'evidence',
    bundles: bundles('grain-trade-0004', 'intent', { intent: 'REPUTED' }),
    netAmount: 300000, asset: 'ASI', supplyChainNode: 'us-grain-belt',
    note: 'Intent declared only; reputational truth class. Needs acceptance + escrow to advance past the evidence floor.',
  },
];

export const asOf = '2026-07-04T00:00:00-04:00';

export function cellById(id: string): Cell | undefined { return cells.find((c) => c.id === id); }
export function stageIndex(s: Stage): number { const i = STAGES.indexOf(s); return i < 0 ? STAGES.length : i; }
