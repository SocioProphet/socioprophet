// Model Platform Intelligence — the competitive lens for the model plane:
// SociOS Model Board vs watsonx.ai / SageMaker+Bedrock / Seldon. Unlike the consumer
// "one-trick" teardown, platforms are judged on governance + sovereignty. Each row is
// clickable into an INVESTIGATION grounded in the sociosphere code graph (real files) and
// the auto-generated docs (docs-index) — the agent cites code + docs, it does not guess.

export type PlatformVerdict = 'lead' | 'par' | 'behind';

export interface CodeRef { repo: string; path: string; symbol?: string; label: string }
export interface DocRef { path: string; title: string }
export interface Investigation { summary: string; code: CodeRef[]; docs: DocRef[]; agentQuery: string }

export interface ModelPlatform {
  id: string; name: string; vendor: boolean; oneLiner: string; sovereignty: string; score: number;
}
export interface CapabilityRow {
  dim: string; sociOS: string; watson: string; sagemaker: string; seldon: string; verdict: PlatformVerdict;
}

export const modelPlatformRanking: ModelPlatform[] = [
  { id: 'sociOS', name: 'SociOS Model Board', vendor: false, sovereignty: 'sovereign · cloud ∩ local',
    oneLiner: 'One board across foundation + business models, sovereignty-ranked, every call and promotion receipted.', score: 92 },
  { id: 'sagemaker', name: 'AWS SageMaker + Bedrock', vendor: true, sovereignty: 'vendor cloud',
    oneLiner: 'Deep model registry + Bedrock foundation catalog; strong serving, cloud-locked.', score: 80 },
  { id: 'watsonx', name: 'IBM watsonx.ai', vendor: true, sovereignty: 'vendor cloud',
    oneLiner: 'Foundation catalog + watsonx.governance factsheets; governance-forward, still vendor cloud.', score: 78 },
  { id: 'seldon', name: 'Seldon', vendor: true, sovereignty: 'self-host',
    oneLiner: 'Best-in-class serving + A/B/shadow + drift (Alibi); serving-only, no unified catalog.', score: 72 },
];

export const capabilityMatrix: CapabilityRow[] = [
  { dim: 'Foundation + business models on one board', sociOS: 'yes', watson: 'separate', sagemaker: 'separate', seldon: 'serving only', verdict: 'lead' },
  { dim: 'Champion / challenger + historic + drift', sociOS: 'yes (PSI + RunReceipt)', watson: 'governance', sagemaker: 'registry approval', seldon: 'A/B + Alibi', verdict: 'par' },
  { dim: 'Data-catalog classifiers per target', sociOS: 'yes (DataClass)', watson: 'partial', sagemaker: 'no', seldon: 'no', verdict: 'lead' },
  { dim: 'Governance = replayable receipts', sociOS: 'RunReceipt / GatewayCallAudit', watson: 'factsheets', sagemaker: 'audit logs', seldon: 'no', verdict: 'lead' },
  { dim: 'Sovereignty-weighted ranking', sociOS: 'yes', watson: 'no', sagemaker: 'no', seldon: 'no', verdict: 'lead' },
  { dim: 'Cloud ∩ local on one contract', sociOS: 'yes', watson: 'no', sagemaker: 'no', seldon: 'self-host', verdict: 'lead' },
];

// Grounded investigation — real files merged this session + real docs-index entries.
export const investigations: Record<string, Investigation> = {
  sociOS: {
    summary: 'Every SociOS advantage is traceable to code that runs and a doc that is auto-generated from source — the agent investigates from the graph, it does not assert.',
    code: [
      { repo: 'agent-machine', path: 'src/agent_machine/inference_gateway.py', symbol: 'serve', label: 'fail-closed local serving; GatewayCallAudit on every call' },
      { repo: 'agent-machine', path: 'src/agent_machine/inference_backends.py', symbol: 'ollama_backend', label: 'real local Ollama backend — no egress' },
      { repo: 'prophet-platform', path: 'apps/lattice-studio/src/lattice_studio/inference_gateway_leaderboard.py', symbol: 'leaderboard', label: 'sovereignty-weighted leaderboard (sovereign-local first)' },
      { repo: 'sourceos-spec', path: 'tools/promote_model.py', symbol: 'decide_promotion', label: 'champion→challenger gate + replayable RunReceipt' },
    ],
    docs: [
      { path: 'docs/contract-additions/inference-gateway-intersection.md', title: 'InferenceGateway — the cloud ∩ local intersection' },
      { path: 'docs/surfaces/model-governance.html', title: 'Model Governance Registry — champion/challenger + classifiers' },
      { path: 'docs/contract-additions/ergonomics-superiority.md', title: 'Ergonomics — one system, more ergonomic than Apple' },
    ],
    agentQuery: 'How does the SociOS model board beat watsonx.ai, SageMaker and Seldon on sovereignty and governance? Cite the code and docs.',
  },
};
