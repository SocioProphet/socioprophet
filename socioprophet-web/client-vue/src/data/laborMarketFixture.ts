// Request-centric labor market (the Labor Network Charter). Labor is modeled as
// request + response + evidence + fulfillment + trust — NOT identity + feed +
// attention. The primary unit is a structured request; fit is scored between a
// request and a response (never a global human-worth score). Shapes mirror the
// sourceos-spec LaborRequest / LaborResponse / FitScore / LaborAward / TrustEvent
// contract; requesters/responders reference the human-spine networks + People.

export type RequestType = 'RFI' | 'RFP' | 'RFQ' | 'role' | 'collaboration' | 'apprenticeship' | 'review' | 'availability';
export type ReqStatus = 'open' | 'shortlisting' | 'awarded' | 'closed';

export interface Compensation {
  transparency: 'disclosed' | 'exempt';
  exemptReason?: 'volunteer' | 'mutual-aid' | 'exploratory';
  model?: 'fixed' | 'hourly' | 'milestone' | 'equity' | 'stipend';
  min?: number; max?: number; currency?: string;
}

export interface FitScore { rubric: Record<string, number>; fit: number; confidence: number; missingEvidence?: string[] }
export interface Response {
  id: string; responder: string; responderRef?: string; // network id or person id
  approach: string; pricing?: number; availability?: string;
  evidence: string[]; status: 'submitted' | 'shortlisted' | 'declined' | 'awarded';
  fit?: FitScore; // request↔response fit only
}
export interface Milestone { title: string; status: 'pending' | 'in_progress' | 'delivered' | 'approved' | 'disputed' }
export interface Award { responseId: string; terms: string; paymentModel: string; milestones: Milestone[] }
export interface TrustEvent { kind: 'reference' | 'verification' | 'completion' | 'dispute' | 'appeal' | 'correction'; subject: string; requestTied: boolean; at: string }

export interface LaborRequest {
  id: string;
  requestType: RequestType;
  requester: string;
  requesterNetwork?: string; // human-spine network id
  objective: string;
  outcome: string;
  compensation: Compensation;
  schedule?: string;
  responseDeadline: string;
  evaluationCriteria: string[];
  status: ReqStatus;
  responses: Response[];
  award?: Award;
  trustEvents: TrustEvent[];
}

export const requests: LaborRequest[] = [
  {
    id: 'smelter-audit-0001', requestType: 'review', requester: 'Chuquicamata Smelter', requesterNetwork: 'mining-capital',
    objective: 'Independent audit of smelter emissions controls before the next regulatory window.',
    outcome: 'Signed audit report + remediation punch-list.',
    compensation: { transparency: 'disclosed', model: 'fixed', min: 40000, max: 60000, currency: 'USD' },
    schedule: '3-week engagement', responseDeadline: '2026-07-20',
    evaluationCriteria: ['domain competence', 'independence', 'turnaround'], status: 'awarded',
    responses: [
      { id: 'r1', responder: 'Andes Environmental Auditors', approach: 'Single senior auditor; report in 4 weeks.', pricing: 45000, evidence: ['3 prior smelter audits'], status: 'declined',
        fit: { rubric: { 'domain competence': 0.7, independence: 1.0, turnaround: 0.5 }, fit: 0.72, confidence: 0.8 } },
      { id: 'r2', responder: 'Eng Cooperative 4471', responderRef: 'p-mercer', approach: 'Two-auditor team; on-site wk1, analysis wk2, report wk3.', pricing: 52000, availability: 'starts 2026-07-22', evidence: ['prior-audits attestation'], status: 'awarded',
        fit: { rubric: { 'domain competence': 0.9, independence: 1.0, turnaround: 0.8 }, fit: 0.9, confidence: 0.85, missingEvidence: ['conflict-of-interest declaration'] } },
    ],
    award: { responseId: 'r2', terms: 'Fixed $52k, 3 milestones, independence maintained.', paymentModel: 'milestone',
      milestones: [{ title: 'On-site inspection', status: 'delivered' }, { title: 'Analysis', status: 'in_progress' }, { title: 'Signed report', status: 'pending' }] },
    trustEvents: [{ kind: 'completion', subject: 'Eng Cooperative 4471', requestTied: true, at: '2026-07-25' }],
  },
  {
    id: 'sc-resilience-0002', requestType: 'RFP', requester: 'Copper Capital Syndicate', requesterNetwork: 'mining-capital',
    objective: 'Assess copper supply-chain resilience: water constraint, single-mine concentration, shipping lane risk.',
    outcome: 'Resilience assessment + hedging recommendations.',
    compensation: { transparency: 'disclosed', model: 'milestone', min: 80000, max: 120000, currency: 'USD' },
    schedule: '6-week engagement', responseDeadline: '2026-07-28',
    evaluationCriteria: ['approach quality', 'evidence', 'supply-chain domain fit'], status: 'shortlisting',
    responses: [
      { id: 'r1', responder: 'Resilience Labs', approach: 'Node/path/cluster risk model over the chain + Monte-Carlo shocks.', pricing: 98000, evidence: ['BIAN/FICO risk framework track record'], status: 'shortlisted',
        fit: { rubric: { 'approach quality': 0.9, evidence: 0.8, 'supply-chain domain fit': 0.9 }, fit: 0.87, confidence: 0.82 } },
    ],
    trustEvents: [],
  },
  {
    id: 'fab-tech-0003', requestType: 'role', requester: 'TSMC Fab 18', requesterNetwork: 'fab-technicians',
    objective: 'Fractional lithography process technician to cover a capacity ramp.',
    outcome: 'Sustained process yield during ramp; documented runbooks.',
    compensation: { transparency: 'disclosed', model: 'hourly', min: 95, max: 130, currency: 'USD' },
    schedule: 'part-time, 20h/wk, 6 months', responseDeadline: '2026-07-15',
    evaluationCriteria: ['role fit', 'availability', 'evidence'], status: 'open',
    responses: [
      { id: 'r1', responder: 'Process guild bench', approach: 'Rotating senior techs; cleanroom-certified.', availability: 'immediate', evidence: ['lithography certifications'], status: 'submitted',
        fit: { rubric: { 'role fit': 0.85, availability: 1.0, evidence: 0.7 }, fit: 0.85, confidence: 0.75 } },
    ],
    trustEvents: [],
  },
  {
    id: 'grid-apprentice-0004', requestType: 'apprenticeship', requester: 'Grid Policy Lead', requesterNetwork: 'sovereign-fund',
    objective: 'Apprenticeship in grid-interconnect policy, paid, learning-through-work.',
    outcome: 'Apprentice contributes to a real interconnect filing; builds a proof portfolio.',
    compensation: { transparency: 'disclosed', model: 'stipend', min: 4000, currency: 'USD' },
    schedule: '4-month cohort', responseDeadline: '2026-08-01',
    evaluationCriteria: ['teachability', 'support fit'], status: 'open',
    responses: [], trustEvents: [],
  },
];

export const asOf = '2026-07-04T00:00:00-04:00';

export function requestById(id: string): LaborRequest | undefined { return requests.find((r) => r.id === id); }
