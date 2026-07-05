// Operational-risk lens over the supply-chain spine (BIAN/FICO framework). Each
// node gets inherent factors → inherent score, control efficacy → residual score
// + rating; paths accumulate node residuals; clusters carry common-mode / HHI
// concentration. Shapes mirror the sourceos-spec RiskNode / RiskPath / RiskCluster
// contract. Keyed by supply-chain node id.

export type Rating = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Inherent { K: number; P: number; E: number; O: number; C: number; V: number }
export interface NodeRisk {
  inherent: Inherent;
  inherentScore: number;
  residualScore: number;
  rating: Rating;
  controlGaps: string[];
}

// Assessed nodes (facilities/ports/routes carry real op-risk; commodities/companies lower).
export const nodeRisk: Record<string, NodeRisk> = {
  escondida: { inherent: { K: 0.9, P: 0.4, E: 0.2, O: 0.5, C: 0.8, V: 0.3 }, inherentScore: 0.62, residualScore: 0.34, rating: 'Medium', controlGaps: ['distribution'] },
  'chuqui-smelter': { inherent: { K: 0.7, P: 0.3, E: 0.2, O: 0.4, C: 0.6, V: 0.3 }, inherentScore: 0.48, residualScore: 0.29, rating: 'Medium', controlGaps: [] },
  'antofagasta-port': { inherent: { K: 0.8, P: 0.5, E: 0.2, O: 0.6, C: 0.7, V: 0.4 }, inherentScore: 0.58, residualScore: 0.41, rating: 'High', controlGaps: ['monitoring', 'distribution'] },
  'route-anf-sha': { inherent: { K: 0.7, P: 0.3, E: 0.1, O: 0.8, C: 0.6, V: 0.7 }, inherentScore: 0.56, residualScore: 0.47, rating: 'High', controlGaps: ['provenance', 'monitoring'] },
  'shanghai-port': { inherent: { K: 0.8, P: 0.5, E: 0.2, O: 0.6, C: 0.9, V: 0.4 }, inherentScore: 0.62, residualScore: 0.44, rating: 'High', controlGaps: ['distribution'] },
  'tsmc-fab': { inherent: { K: 1.0, P: 0.6, E: 0.4, O: 0.5, C: 0.95, V: 0.3 }, inherentScore: 0.72, residualScore: 0.55, rating: 'Critical', controlGaps: ['distribution', 'concentration'] },
  'kaohsiung-port': { inherent: { K: 0.8, P: 0.5, E: 0.2, O: 0.6, C: 0.8, V: 0.4 }, inherentScore: 0.6, residualScore: 0.43, rating: 'High', controlGaps: ['monitoring'] },
  'route-khh-lax': { inherent: { K: 0.8, P: 0.3, E: 0.1, O: 0.8, C: 0.7, V: 0.7 }, inherentScore: 0.6, residualScore: 0.5, rating: 'High', controlGaps: ['provenance', 'monitoring'] },
  'la-port': { inherent: { K: 0.7, P: 0.5, E: 0.2, O: 0.5, C: 0.6, V: 0.4 }, inherentScore: 0.52, residualScore: 0.36, rating: 'Medium', controlGaps: [] },
};

export interface PathRisk { pathRisk: number; rating: Rating; tolerance: string }
export const chainRisk: Record<string, PathRisk> = {
  copper: { pathRisk: 0.48, rating: 'High', tolerance: '< 2 weeks' },
  semis: { pathRisk: 0.61, rating: 'Critical', tolerance: '< 1 week' },
};

export interface ClusterRisk { name: string; hhi: number; blastRadius: number; residualCommonMode: number; rating: Rating }
export const clusterRisk: Record<string, ClusterRisk> = {
  copper: { name: 'Trans-Pacific shipping lanes', hhi: 0.39, blastRadius: 0.6, residualCommonMode: 0.52, rating: 'High' },
  semis: { name: 'Single-fab concentration (Taiwan)', hhi: 0.82, blastRadius: 0.85, residualCommonMode: 0.7, rating: 'Critical' },
};

export const FACTORS: Array<[keyof Inherent, string]> = [
  ['K', 'criticality'], ['P', 'privilege'], ['E', 'execution'], ['O', 'opacity'], ['C', 'concentration'], ['V', 'velocity'],
];

export function riskForNode(id: string): NodeRisk | undefined { return nodeRisk[id]; }
export function ratingColor(r: Rating): string {
  return r === 'Critical' ? 'var(--down)' : r === 'High' ? '#f0883e' : r === 'Medium' ? 'var(--accent)' : 'var(--up)';
}
