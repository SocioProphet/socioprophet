#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2] || 'fixtures/professional-intelligence/dashboard-control-state.json';
const output = process.argv[3] || 'src/data/professionalIntelligenceControlState.ts';

const source = JSON.parse(fs.readFileSync(input, 'utf8'));
for (const key of ['overallAlignment', 'metrics', 'gates', 'nextMoves']) {
  if (!(key in source)) throw new Error(`missing required field: ${key}`);
}

const state = {
  sourceMode: 'fixture',
  generatedAt: source.generatedAt || new Date().toISOString(),
  overallAlignment: source.overallAlignment,
  headline: source.headline || 'SocioProphet operating dashboard',
  lede: source.lede || 'Closed-loop control surface for Professional Intelligence OS.',
  boundaryNotice:
    source.boundaryNotice ||
    'Fixture-backed dashboard state. This page renders product-control evidence only; it is not live telemetry and does not authorize runtime, backend, device, or release-management actions.',
  sourceRefs: source.sourceRefs || [
    'fixtures/professional-intelligence/dashboard-control-state.json',
  ],
  metrics: source.metrics,
  gates: source.gates,
  controls: source.controls || [
    {
      name: 'Gate 4 verification',
      signal: source.verificationPassed ? 'Verification passed.' : 'Verification incomplete.',
      action: 'Use the platform report as the dashboard control signal.',
    },
  ],
  prs: source.prs || [
    { repo: 'SocioProphet/prophet-platform', pr: '#430', capability: 'Dashboard control-state export', status: 'merged' },
  ],
  completed: source.completed || ['Platform dashboard control-state export.', 'Typed dashboard fixture seam.'],
  nextMoves: source.nextMoves,
  integrationRule:
    source.integrationRule ||
    'Integration requires contracts, runtime or workflow touchpoints, governance ownership, evidence, feedback, and corrective controls.',
};

const moduleText = `export type CompletionMetric = { name: string; value: number; note: string; };
export type GateState = { name: string; status: 'complete' | 'active' | 'pending'; summary: string; };
export type CyberneticControl = { name: string; signal: string; action: string; };
export type PullRequestState = { repo: string; pr: string; capability: string; status: 'merged' | 'open'; };
export type ProfessionalIntelligenceControlState = { sourceMode: 'fixture'; generatedAt: string; overallAlignment: number; headline: string; lede: string; boundaryNotice: string; sourceRefs: string[]; metrics: CompletionMetric[]; gates: GateState[]; controls: CyberneticControl[]; prs: PullRequestState[]; completed: string[]; nextMoves: string[]; integrationRule: string; };

export const professionalIntelligenceControlState: ProfessionalIntelligenceControlState = ${JSON.stringify(state, null, 2)};
`;

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, moduleText, 'utf8');
console.log(`Wrote ${output}`);
