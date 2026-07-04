// The Agentic Operating System — pods pursuing objectives (opportunities) across
// the platform stack under a governed capture cadence, delta-control SLAs, shared
// libraries, and a readiness scorecard. Modeled from the VA OIT Portfolio
// Operating System; generalized as the agentic OS over the estate. These typed
// objects are the draft of the canonical sourceos-spec contract (system of
// record); the cockpit reads this fixture until the live registry adapter lands.

export type Cluster = 'Health' | 'Digital Platforms' | 'Cyber' | 'Infrastructure' | 'End User' | 'CX' | 'Network' | 'Infrastructure / Cyber';
export type OppStatus = 'Active' | 'Watch' | 'Paused';
export type RAG = 'Red' | 'Amber' | 'Green';

// ── Agent pods — the standard staffing pattern for every objective ──
export interface AgentPod { id: string; role: string; mandate: string; inputs: string[]; outputs: string[]; repoAnchors: string[] }
export const pods: AgentPod[] = [
  { id: 'capture', role: 'Capture Lead', mandate: 'Own pursuit strategy, buyer map, milestones, decisions', inputs: ['signals', 'updates', 'Q&A', 'competitive intel'], outputs: ['pursuit plan', 'gate decisions', 'action backlog'], repoAnchors: ['sociosphere', 'socioprophet'] },
  { id: 'solution', role: 'Technical Solution', mandate: 'Design service model, architecture, transition, operating model', inputs: ['scope', 'priorities', 'burning issues', 'reusable patterns'], outputs: ['solution narrative', 'architecture', 'assumptions'], repoAnchors: ['prophet-platform', 'api-spec', 'prophet-platform-standards'] },
  { id: 'compliance', role: 'Compliance Matrix', mandate: 'Trace every requirement, assumption, ambiguity and delta', inputs: ['RFI/RFP', 'amendments', 'Q&A'], outputs: ['L/M matrix', 'compliance tracker', 'question log'], repoAnchors: ['sourceos-spec', 'agentplane'] },
  { id: 'pastperf', role: 'Past Performance', mandate: 'Map references and evidence to discriminators', inputs: ['team capabilities', 'repo evidence'], outputs: ['PP mapping', 'proof points', 'gaps'], repoAnchors: ['agentplane', 'socioprophet'] },
  { id: 'intel', role: 'Competitive Intel', mandate: 'Track incumbents, likely evaluators, pressure points, OEMs', inputs: ['incumbent/vehicle data', 'market posture'], outputs: ['competitive assessment', 'ghost themes'], repoAnchors: ['socioprophet', 'policy-fabric'] },
  { id: 'pricing', role: 'Pricing / Packaging', mandate: 'Shape labor, packaging, partner stack, win-price logic', inputs: ['solution assumptions', 'partner roles'], outputs: ['pricing hypotheses', 'packaging options'], repoAnchors: ['sociosphere'] },
  { id: 'partnering', role: 'Partnering', mandate: 'Map teammate gaps, OEM lanes, niche specialists', inputs: ['capability gaps', 'OEM dependencies'], outputs: ['partner matrix', 'outreach targets'], repoAnchors: ['sociosphere', 'api-spec'] },
  { id: 'questions', role: 'Question Generator', mandate: 'Produce government-facing questions that reduce ambiguity and shape evaluation', inputs: ['scope ambiguity', 'pain points'], outputs: ['question bank', 'RFI comments'], repoAnchors: ['policy-fabric', 'sourceos-spec'] },
  { id: 'evidence', role: 'Evidence / QA', mandate: 'Run review gates and coherence checks across all objectives', inputs: ['draft artifacts', 'matrices', 'libraries'], outputs: ['gate report', 'defect list'], repoAnchors: ['agentplane', 'policy-fabric'] },
];

// ── Shared libraries — standardized once, inherited everywhere ──
export interface SharedLibrary { id: string; name: string; standardizes: string; repoAnchors: string[]; usedBy: string }
export const libraries: SharedLibrary[] = [
  { id: 'operating-model', name: 'Canonical operating model', standardizes: 'Managed outcomes, service integration, governance cadence', repoAnchors: ['sociosphere', 'prophet-platform', 'socioprophet'], usedBy: 'All objectives' },
  { id: 'ai-position', name: 'AI / automation position', standardizes: 'Where AI is allowed, bounded, evidenced, and measured', repoAnchors: ['policy-fabric', 'agentplane', 'memory-mesh'], usedBy: 'EDGE; OMEGA; CCI; CCaaS; cyber' },
  { id: 'transition-in', name: 'Transition-in method', standardizes: 'Knowledge transfer, takeover, continuity controls, cutover readiness', repoAnchors: ['agentplane', 'prophet-platform'], usedBy: 'Health; Infra; CX' },
  { id: 'release-gates', name: 'Quality / release gates', standardizes: 'Validation, test automation, release readiness, defect policy', repoAnchors: ['agentplane', 'prophet-platform-standards', 'sourceos-spec'], usedBy: 'All build/run objectives' },
  { id: 'identity-plane', name: 'Identity control plane', standardizes: 'IGA/PAM, evidence refs, grants, runtime identity semantics', repoAnchors: ['mcp-a2a-zero-trust', 'socioprophet-standards-storage'], usedBy: 'ZTA; IAM/ICAM; network' },
  { id: 'api-fabric', name: 'Interoperability / API fabric', standardizes: 'Schemas, transport, compatibility policy, contract ownership', repoAnchors: ['api-spec', 'tritrpc', 'prophet-platform-standards'], usedBy: 'HMDM; Supply Chain; EDGE; CCaaS' },
  { id: 'observability', name: 'Observability / service intelligence', standardizes: 'Dashboards, RCA, MTTR, operational telemetry', repoAnchors: ['agentplane', 'policy-fabric', 'memory-mesh'], usedBy: 'TSMPS; NEDIIS; CCI; Hosting' },
];

// ── Readiness scorecard — 12 dimensions, 0..3 each (max 36) ──
export const READINESS_DIMS = [
  'Buyer problem', 'Solution hypothesis', 'Shared libraries', 'Agent pod', 'Partner archetype',
  'Named partner targets', 'OEM lane', 'Artifact pack', 'Delta control', 'Questions', 'Pricing', 'Past performance',
] as const;
export type ReadinessDim = (typeof READINESS_DIMS)[number];
export interface Readiness { scores: Record<ReadinessDim, 0 | 1 | 2 | 3>; nextGate: string }

// ── Delta control — standing Q&A / amendment monitoring ──
export interface Delta { id: string; kind: string; monitorSource: string; expected: string; status: 'Open' | 'Ingested' | 'Watching'; requiredOutput: string }

// ── Opportunity — the objective the pods pursue ──
export interface Opportunity {
  id: string;
  name: string;
  cluster: Cluster;
  missionOwner: string;
  buyingProblem: string;
  priorities: string[];
  deliveryPattern: string;
  reuseRepos: string[];
  podEmphasis: string[]; // pod ids emphasized
  sharedLibs: string[]; // library ids
  partnerLane: string;
  winTheme: string;
  status: OppStatus;
  readiness: Readiness;
  deltas: Delta[];
}

function rd(partial: Partial<Record<ReadinessDim, 0 | 1 | 2 | 3>>, nextGate = 'Gate 1'): Readiness {
  const scores = {} as Record<ReadinessDim, 0 | 1 | 2 | 3>;
  for (const d of READINESS_DIMS) scores[d] = partial[d] ?? 0;
  return { scores, nextGate };
}

export const opportunities: Opportunity[] = [
  {
    id: 'health-devsecops', name: 'Health Services DevSecOps', cluster: 'Health', missionOwner: 'PDS',
    buyingProblem: 'Sustain legacy health apps while modernizing safely outside the Oracle Health baseline.',
    priorities: ['VistA sustainment', 'modernization', 'MUMPS', 'broad CLIN/tech spread'],
    deliveryPattern: 'Continuity-plus-modernization delivery cell; governed DevSecOps; legacy transition discipline.',
    reuseRepos: ['prophet-platform', 'prophet-platform-standards', 'agentplane', 'policy-fabric', 'sociosphere'],
    podEmphasis: ['capture', 'solution', 'compliance', 'evidence'], sharedLibs: ['operating-model', 'transition-in', 'release-gates'],
    partnerLane: 'Health IT SI; VistA/MUMPS niche partner',
    winTheme: 'We preserve continuity while industrializing governed modernization with low-regret migration paths.',
    status: 'Active',
    readiness: rd({ 'Buyer problem': 3, 'Solution hypothesis': 2, 'Shared libraries': 3, 'Agent pod': 2, 'Partner archetype': 2, 'OEM lane': 1, 'Artifact pack': 2, 'Delta control': 2, 'Questions': 1 }),
    deltas: [
      { id: 'd-h1', kind: 'Industry-day Q&A', monitorSource: 'OIT Industry Day site / VOA', expected: '2026-04-17', status: 'Watching', requiredOutput: 'delta memo + requirement updates' },
      { id: 'd-h2', kind: 'Draft RFP', monitorSource: 'SAM.gov', expected: 'TBD', status: 'Open', requiredOutput: 'L/M delta + question set + replan' },
    ],
  },
  {
    id: 'supply-chain-devsecops', name: 'Supply Chain Management DevSecOps & Integration', cluster: 'Health', missionOwner: 'PDS',
    buyingProblem: 'Keep the supply-chain ecosystem interoperable while modernizing obsolete systems incrementally.',
    priorities: ['VALIP interoperability', 'data standardization/migration', 'iterative modernization'],
    deliveryPattern: 'Integration-first modernization cell with schema/contract discipline.',
    reuseRepos: ['sherlock-search', 'api-spec', 'prophet-platform', 'prophet-platform-standards', 'policy-fabric'],
    podEmphasis: ['solution', 'compliance', 'partnering'], sharedLibs: ['api-fabric', 'release-gates'],
    partnerLane: 'ERP / supply-chain integration partner',
    winTheme: 'We reduce integration drag by treating modernization as contract-governed iterative replacement, not big-bang rewrite.',
    status: 'Active',
    readiness: rd({ 'Buyer problem': 3, 'Solution hypothesis': 2, 'Shared libraries': 3, 'Agent pod': 2, 'Partner archetype': 2, 'OEM lane': 1, 'Artifact pack': 2, 'Delta control': 2, 'Questions': 1 }),
    deltas: [{ id: 'd-sc1', kind: 'Industry-day Q&A', monitorSource: 'OIT Industry Day site', expected: '2026-04-17', status: 'Watching', requiredOutput: 'delta memo + requirement updates' }],
  },
  {
    id: 'edge', name: 'EDGE', cluster: 'Digital Platforms', missionOwner: 'DPS',
    buyingProblem: 'Deliver a governed, AI-enabled digital platform with bounded automation and measurable outcomes.',
    priorities: ['platform governance', 'bounded AI', 'developer velocity'],
    deliveryPattern: 'Platform operating-model cell with an evidenced AI-automation position.',
    reuseRepos: ['prophet-platform', 'policy-fabric', 'agentplane', 'memory-mesh'],
    podEmphasis: ['solution', 'intel', 'evidence'], sharedLibs: ['operating-model', 'ai-position', 'api-fabric'],
    partnerLane: 'Platform / hyperscaler lane',
    winTheme: 'Bounded, evidenced AI on a governed platform — velocity without losing control.',
    status: 'Active',
    readiness: rd({ 'Buyer problem': 3, 'Solution hypothesis': 2, 'Shared libraries': 3, 'Agent pod': 2, 'Artifact pack': 2, 'Delta control': 2 }),
    deltas: [],
  },
  {
    id: 'zta', name: 'ZTA Acceleration', cluster: 'Cyber', missionOwner: 'OIS',
    buyingProblem: 'Accelerate zero-trust architecture across identity, network, and data without breaking operations.',
    priorities: ['zero trust', 'identity-first', 'segmentation', 'continuous verification'],
    deliveryPattern: 'Identity-control-plane cell with runtime identity semantics and evidence refs.',
    reuseRepos: ['mcp-a2a-zero-trust', 'policy-fabric', 'socioprophet-standards-storage'],
    podEmphasis: ['solution', 'compliance', 'evidence'], sharedLibs: ['identity-plane', 'ai-position'],
    partnerLane: 'ZTA / identity OEM lane',
    winTheme: 'Zero trust as a governed control plane with evidence at every grant — not a product bolt-on.',
    status: 'Active',
    readiness: rd({ 'Buyer problem': 3, 'Solution hypothesis': 2, 'Shared libraries': 3, 'Agent pod': 2, 'OEM lane': 1, 'Artifact pack': 2, 'Delta control': 2 }),
    deltas: [],
  },
  {
    id: 'app-hosting', name: 'Application Hosting Compute & Storage', cluster: 'Infrastructure', missionOwner: 'ITOPS',
    buyingProblem: 'Provide resilient, observable hosting for compute and storage with clear service intelligence.',
    priorities: ['resilience', 'observability', 'cost discipline'],
    deliveryPattern: 'Hosting operating-model cell with service-intelligence telemetry.',
    reuseRepos: ['prophet-platform', 'agentplane', 'policy-fabric'],
    podEmphasis: ['solution', 'pricing', 'evidence'], sharedLibs: ['operating-model', 'observability', 'release-gates'],
    partnerLane: 'Hosting / cloud OEM lane',
    winTheme: 'Hosting you can see and trust — resilience proven by telemetry, not promised in slides.',
    status: 'Active',
    readiness: rd({ 'Buyer problem': 3, 'Shared libraries': 3, 'Agent pod': 2, 'Artifact pack': 2, 'Delta control': 2, 'Pricing': 1 }),
    deltas: [],
  },
  {
    id: 'iam-icam', name: 'IAM/ICAM Modernization', cluster: 'Infrastructure / Cyber', missionOwner: 'OIS',
    buyingProblem: 'Modernize identity and credential management across the enterprise with governed runtime identity.',
    priorities: ['IGA', 'PAM', 'credential lifecycle', 'runtime identity'],
    deliveryPattern: 'Identity-control-plane cell with grant evidence and lifecycle governance.',
    reuseRepos: ['mcp-a2a-zero-trust', 'socioprophet-standards-storage', 'policy-fabric'],
    podEmphasis: ['solution', 'compliance', 'partnering'], sharedLibs: ['identity-plane', 'release-gates'],
    partnerLane: 'IAM/ICAM OEM lane',
    winTheme: 'Identity as governed infrastructure — every grant evidenced, every credential accountable.',
    status: 'Watch',
    readiness: rd({ 'Buyer problem': 2, 'Solution hypothesis': 2, 'Shared libraries': 3, 'Agent pod': 2, 'OEM lane': 1 }),
    deltas: [],
  },
  {
    id: 'cci', name: 'Contact Center Intelligence (CCI)', cluster: 'CX', missionOwner: 'MSCS',
    buyingProblem: 'Improve contact-center outcomes with bounded AI assistance and blended human/agent operations.',
    priorities: ['CSAT', 'deflection', 'assistant governance', 'escalation'],
    deliveryPattern: 'CX cell with an evidenced AI-automation position and human-in-the-loop escalation.',
    reuseRepos: ['agentplane', 'policy-fabric', 'memory-mesh'],
    podEmphasis: ['solution', 'intel', 'pricing'], sharedLibs: ['ai-position', 'observability'],
    partnerLane: 'CCaaS / contact-center OEM lane',
    winTheme: 'AI that assists agents under governance — measured deflection without eroding trust.',
    status: 'Active',
    readiness: rd({ 'Buyer problem': 3, 'Solution hypothesis': 2, 'Shared libraries': 2, 'Agent pod': 2, 'Artifact pack': 1 }),
    deltas: [],
  },
  {
    id: 'nediis', name: 'NEDIIS', cluster: 'Network', missionOwner: 'ITOPS',
    buyingProblem: 'Run and observe enterprise network/data infrastructure with strong RCA and MTTR discipline.',
    priorities: ['network reliability', 'RCA', 'MTTR', 'telemetry'],
    deliveryPattern: 'Network operations cell with observability and service-intelligence.',
    reuseRepos: ['agentplane', 'policy-fabric', 'memory-mesh'],
    podEmphasis: ['solution', 'evidence'], sharedLibs: ['observability', 'operating-model'],
    partnerLane: 'Network / NOC OEM lane',
    winTheme: 'Network operations that explain themselves — fast RCA, low MTTR, evidenced reliability.',
    status: 'Watch',
    readiness: rd({ 'Buyer problem': 2, 'Shared libraries': 2, 'Agent pod': 2, 'Delta control': 1 }),
    deltas: [],
  },
];

// ── Capture cadence — the governed 8-week sprint each objective runs ──
export interface CadenceWeek { week: number; objective: string; portfolioDeliverable: string; cellDeliverable: string; minReadiness: number; exitDecision: string }
export const cadence: CadenceWeek[] = [
  { week: 0, objective: 'Intake + normalize', portfolioDeliverable: 'update OS, partner map, pod coverage', cellDeliverable: 'opportunity brief + buyer/problem memo', minReadiness: 0.2, exitDecision: 'pursue / watch / pause' },
  { week: 1, objective: 'Shape the lane', portfolioDeliverable: 'freeze archetypes and OEM lanes', cellDeliverable: 'next-action memo, discriminators v0, risk list', minReadiness: 0.3, exitDecision: 'solution lane confirmed' },
  { week: 2, objective: 'Build solution frame', portfolioDeliverable: 'freeze library pulls and pod design', cellDeliverable: 'solution narrative v0, library inheritance, assumptions', minReadiness: 0.4, exitDecision: 'solution frame accepted' },
  { week: 3, objective: 'Pressure-test fit', portfolioDeliverable: 'open named targets and capture issues', cellDeliverable: 'partner/OEM targets, questions, PP candidates', minReadiness: 0.45, exitDecision: 'teaming direction accepted' },
  { week: 4, objective: 'Artifact pack v1', portfolioDeliverable: 'synchronize all cell artifacts', cellDeliverable: '30-day artifact pack, storyboard, compliance skeleton', minReadiness: 0.5, exitDecision: 'Gate 1 complete' },
  { week: 5, objective: 'Commercial shape', portfolioDeliverable: 'align solution and price story', cellDeliverable: 'pricing hypothesis v0, staffing model, packaging options', minReadiness: 0.6, exitDecision: 'commercial lane accepted' },
  { week: 6, objective: 'Proof layer', portfolioDeliverable: 'tighten evidence and past performance', cellDeliverable: 'PP map, proof points, evidence gaps', minReadiness: 0.7, exitDecision: 'proof posture accepted' },
  { week: 7, objective: 'Bid-ready baseline', portfolioDeliverable: 'prepare to ingest live solicitation text rapidly', cellDeliverable: 'redline-ready library, review checklist, bid kickover', minReadiness: 0.75, exitDecision: 'RFP-ready baseline' },
  { week: 8, objective: 'Delta sprint', portfolioDeliverable: 'ingest live text and replan in ≤72h', cellDeliverable: 'delta memo, reprioritized backlog, owner resets', minReadiness: 0.8, exitDecision: 'go-forward after delta' },
];
export const currentWeek = 4; // where the portfolio sits in the cadence

export const asOf = '2026-07-04T00:00:00-04:00';

// ── Derived scoring ──
export function readinessTotal(r: Readiness): number { return READINESS_DIMS.reduce((a, d) => a + r.scores[d], 0); }
export function readinessPct(r: Readiness): number { return Math.round((readinessTotal(r) / (READINESS_DIMS.length * 3)) * 100); }
export function readinessRag(r: Readiness): RAG { const p = readinessPct(r); return p >= 70 ? 'Green' : p >= 40 ? 'Amber' : 'Red'; }
export function podById(id: string): AgentPod | undefined { return pods.find((p) => p.id === id); }
export function libById(id: string): SharedLibrary | undefined { return libraries.find((l) => l.id === id); }
