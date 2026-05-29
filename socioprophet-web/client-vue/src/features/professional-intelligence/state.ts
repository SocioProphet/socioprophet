export type CompletionMetric = {
  name: string;
  value: number;
  note: string;
};

export type GateState = {
  name: string;
  status: 'complete' | 'active' | 'pending';
  summary: string;
};

export type CyberneticControl = {
  name: string;
  signal: string;
  action: string;
};

export type PullRequestState = {
  repo: string;
  pr: string;
  capability: string;
  status: 'merged' | 'open';
};

export type GatedAction = {
  title: string;
  description: string;
  actionLabel: string;
  blockedReason: string;
  statusLabel: 'blocked' | 'gated' | 'fixture-only';
};

export type ProfessionalIntelligenceControlState = {
  sourceMode: 'fixture';
  generatedAt: string;
  overallAlignment: number;
  headline: string;
  lede: string;
  boundaryLabel: string;
  boundaryNotice: string;
  sourceRefs: string[];
  metrics: CompletionMetric[];
  gates: GateState[];
  controls: CyberneticControl[];
  prs: PullRequestState[];
  completed: string[];
  nextMoves: string[];
  gatedActions: GatedAction[];
  integrationRule: string;
};

export const professionalIntelligenceControlState: ProfessionalIntelligenceControlState = {
  sourceMode: 'fixture',
  generatedAt: '2026-05-05T20:40:00-04:00',
  overallAlignment: 72,
  headline: 'SocioProphet operating dashboard',
  lede:
    'Closed-loop control surface for the Professional Intelligence OS alignment wave: contracts, playbooks, workrooms, policy, obligations, topology, evidence, adoption, runtime controls, and demo readiness.',
  boundaryLabel: 'read-only evidence surface',
  boundaryNotice:
    'Fixture-backed dashboard state replayed from mdheller/socioprophet-web. This page renders product-control evidence only; it is not live telemetry and does not authorize runtime, backend, device, or release-management actions.',
  sourceRefs: [
    'mdheller/socioprophet-web@67cff37b3da44395757c9095e1cbc081ca73333b:src/pages/ProfessionalIntelligence.vue',
    'mdheller/socioprophet-web@67cff37b3da44395757c9095e1cbc081ca73333b:src/data/professionalIntelligenceControlState.ts',
    'SocioProphet/socioprophet:socioprophet-web/docs/MDHELLER_SOCIOPROPHET_WEB_CONSOLIDATION_AUDIT.md',
  ],
  metrics: [
    { name: 'Architecture spine', value: 42, note: 'Platform manifest, orchestration object, and topology are established.' },
    { name: 'DelEx governance', value: 48, note: 'Delivery model, control register, and Gate 4 addenda are live.' },
    { name: 'Platform contracts', value: 50, note: 'Core contracts, fixtures, orchestration, and validators are merged.' },
    { name: 'Playbooks', value: 35, note: 'Seed InnerSource playbooks validate and feed the demo path.' },
    { name: 'Workrooms', value: 25, note: 'Professional Workroom contract and fixture are merged.' },
    { name: 'Governance loops', value: 52, note: 'Policy, obligation, topology, routing, controls, and evidence loops are connected.' },
    { name: 'Cybernetic controls', value: 54, note: 'Sense/compare/act gates now include a Gate 4 verification runner.' },
    { name: 'Runtime implementation', value: 48, note: 'Agentplane bundle and platform Gate 4 verifier are merged.' },
    { name: 'Demo readiness', value: 76, note: 'The demo path is locally verifiable but still needs generated dashboard ingestion.' },
  ],
  gates: [
    {
      name: 'Gate 1 — alignment docs and seed contracts',
      status: 'complete',
      summary: 'Platform, DelEx automation, playbooks, workspace, policy, obligations, topology, and UI definitions are seeded.',
    },
    {
      name: 'Gate 2 — validation fixtures',
      status: 'complete',
      summary: 'Platform, DelEx automation, playbooks, workrooms, policy decisions, obligations, search packets, context packs, context queries, routing decisions, guardrails, and ledger records validate.',
    },
    {
      name: 'Gate 3 — recordable demo slice',
      status: 'complete',
      summary: 'Agentplane bundle, context/query/search/memory, policy/obligation, routing, guardrail, model-governance, workroom, and evidence/adoption surfaces exist.',
    },
    {
      name: 'Gate 4 — integrated demo',
      status: 'active',
      summary: 'The platform orchestration object and local Gate 4 verifier are merged; dashboard state ingestion and board rollup remain.',
    },
  ],
  controls: [
    { name: 'Repo readiness', signal: 'Missing docs, schema, validation, CI, owner, or integration map.', action: 'Open or block work order until green.' },
    { name: 'Demo readiness', signal: 'Missing playbook, context, policy, evidence, workroom, route, guardrail, Agentplane, or adoption reference.', action: 'Block demo credit and create corrective issue.' },
    { name: 'Policy coverage', signal: 'Governed step lacks policy decision.', action: 'Block runtime/demo credit.' },
    { name: 'Evidence coverage', signal: 'Workflow step lacks evidence reference.', action: 'Fail demo acceptance.' },
    { name: 'Agent authority', signal: 'Agent lacks tool grant, scope, revocation, or session authority.', action: 'Block agent execution.' },
    { name: 'Gate 4 verification', signal: 'Gate 4 orchestration lacks required refs or step evidence.', action: 'Fail local verifier and withhold demo acceptance.' },
  ],
  prs: [
    { repo: 'SocioProphet/prophet-platform', pr: '#263', capability: 'Platform contracts', status: 'merged' },
    { repo: 'SocioProphet/prophet-platform', pr: '#424', capability: 'Gate 4 orchestration', status: 'merged' },
    { repo: 'SocioProphet/prophet-platform', pr: '#427', capability: 'Gate 4 verifier', status: 'merged' },
    { repo: 'SocioProphet/delivery-excellence', pr: '#5', capability: 'Control register', status: 'merged' },
    { repo: 'SocioProphet/delivery-excellence', pr: '#18', capability: 'Gate 4 status', status: 'merged' },
    { repo: 'SocioProphet/delivery-excellence-automation', pr: '#4', capability: 'Automation schemas', status: 'merged' },
    { repo: 'SocioProphet/delivery-excellence-innersource', pr: '#5', capability: 'Playbooks', status: 'merged' },
    { repo: 'SocioProphet/prophet-workspace', pr: '#7', capability: 'Workrooms', status: 'merged' },
    { repo: 'SocioProphet/policy-fabric', pr: '#33', capability: 'Policy decisions', status: 'merged' },
    { repo: 'SocioProphet/contractforge', pr: '#3', capability: 'Obligation ledger', status: 'merged' },
    { repo: 'SocioProphet/agentplane', pr: '#73', capability: 'Workflow bundle', status: 'merged' },
    { repo: 'SocioProphet/agent-registry', pr: '#6', capability: 'Agent authority', status: 'merged' },
    { repo: 'SocioProphet/memory-mesh', pr: '#12', capability: 'Context pack', status: 'merged' },
    { repo: 'SocioProphet/sherlock-search', pr: '#23', capability: 'Search packet', status: 'merged' },
    { repo: 'SocioProphet/prophet-core-query', pr: '#4', capability: 'Context query', status: 'merged' },
    { repo: 'SocioProphet/model-router', pr: '#10', capability: 'Routing decisions', status: 'merged' },
    { repo: 'SocioProphet/guardrail-fabric', pr: '#10', capability: 'Runtime controls', status: 'merged' },
    { repo: 'SocioProphet/model-governance-ledger', pr: '#10', capability: 'Evidence ledger', status: 'merged' },
    { repo: 'SocioProphet/sociosphere', pr: '#221', capability: 'Topology', status: 'merged' },
    { repo: 'SocioProphet/socioprophet', pr: '#300', capability: 'Dashboard definition', status: 'merged' },
    { repo: 'mdheller/socioprophet-web', pr: '#18', capability: 'Dashboard MVP source replay', status: 'merged' },
  ],
  completed: [
    'Professional Intelligence platform manifest, seed contracts, and Gate 4 orchestration.',
    'DelEx work item, repo readiness, demo acceptance, and status addenda.',
    'Validated InnerSource playbooks.',
    'Validated Professional Workroom fixture.',
    'Professional Policy Decision schema with allow/review/deny examples.',
    'ContractForge obligation schema and examples.',
    'Sociosphere topology registration.',
    'Agentplane workflow bundle and replayable artifact path.',
    'Agent Registry tool grants, session authority, and revocation records.',
    'Memory Mesh context pack and Sherlock search packet.',
    'Prophet Core Query context query.',
    'Model Router route decisions and Guardrail Fabric runtime controls.',
    'Model Governance Ledger route/model/promotion/rollback records.',
    'Platform Gate 4 local verification runner.',
  ],
  nextMoves: [
    'Generate this dashboard fixture from DelEx register and Prophet Platform verification output.',
    'Add DelEx board rollup for Gate 4 status.',
    'Add global-devsecops-intelligence governance/control-plane assessment.',
    'Extend the platform runner to optionally execute Agentplane host smoke and include its report.',
    'Promote the local verification report into an operator-facing artifact surface.',
  ],
  gatedActions: [
    {
      title: 'Refresh live control state',
      description: 'Replace fixture state with generated control-state export from DelEx and Prophet Platform verification output.',
      actionLabel: 'Refresh state',
      blockedReason: 'Blocked until dashboard-state ingestion contract and source artifact path are accepted.',
      statusLabel: 'gated',
    },
    {
      title: 'Promote Gate 4 evidence',
      description: 'Promote the local Gate 4 verification report into an operator-facing evidence artifact.',
      actionLabel: 'Promote evidence',
      blockedReason: 'Blocked until promotion authority, signer, and evidence ledger write contract are wired.',
      statusLabel: 'blocked',
    },
    {
      title: 'Open corrective work order',
      description: 'Create a DelEx corrective action when telemetry or validation shows drift.',
      actionLabel: 'Open work order',
      blockedReason: 'Fixture-only page; no DelEx writeback or issue creation authority is available here.',
      statusLabel: 'fixture-only',
    },
  ],
  integrationRule:
    'A subsystem is not integrated because it is referenced. It is integrated only when it has a contract or manifest entry, a runtime/workflow/validation touchpoint, a governance owner, evidence output or evidence reference, feedback into DelEx controls, and corrective action when telemetry or validation shows drift.',
};
