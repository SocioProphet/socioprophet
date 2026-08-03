// Bundled representative board dataset — the fallback the surface renders when the
// live producer (intelligence-superiority benchmark contract, competitive-intel plane,
// dashboard-bff GET /v1/competitive-boards) is unavailable. It is a faithful
// REPRESENTATIVE of the contract shape, not a measured certification.
//
// RELATIVE-ONLY SCORING MODEL — no separate estate column. Every cell states the
// estate's own claim about its standing against ONE competitor on ONE feature; the
// same feature legitimately carries a different verdict against a different
// competitor. Evidence/maturity/basis therefore live on every cell.
//
// Positioning grounded in the estate's competitive-intelligence register (local-RAG /
// GraphRAG peers, agent frameworks, eval labs, governance vendors, KG engines,
// marketplaces, reproducibility tooling, world-model/twin platforms, risk/value
// platforms). Evidence links point at estate repos/paths; they are illustrative.

import type { CompetitiveBoardsDataset } from '../../../api/competitiveBoardsApi';

const REPO = 'https://github.com/SocioProphet';

export const COMPETITIVE_BOARDS_FIXTURE: CompetitiveBoardsDataset = {
  service: 'competitive-boards (bundled fixture)',
  version: '0.2.0-fixture',
  generated_at: '2026-08-03T00:00:00Z',
  estate_label: 'SocioProphet estate',
  disclaimer:
    'Representative fixture, not a measured certification. Every cell is the estate\'s ' +
    'own relative claim against that one competitor on that one feature — self-assessed ' +
    'unless marked externally-certified; maturity distinguishes live (shipped) from spec ' +
    '(declared). Wire VITE_COMPETITIVE_BOARDS_BASE to the benchmark producer for the live ' +
    'board dataset.',
  categories: [
    {
      id: 'rag',
      name: 'RAG / Retrieval',
      description:
        'Retrieval-augmented generation over structured knowledge — the local-RAG / GraphRAG field.',
      competitors: [
        { id: 'ms-graphrag', name: 'MS GraphRAG', note: 'GPT-4-class, expensive indexing' },
        { id: 'lightrag', name: 'LightRAG', note: 'HKUDS, ~30B dual-layer KG+vector' },
        { id: 'onyx', name: 'Onyx (Danswer)', note: 'air-gapped, 40+ connectors' },
      ],
      features: [
        { id: 'verified-compute', name: 'Verified compute', definition: 'Executes and verifies computations (modular arithmetic, ODEs) rather than only retrieving text — a capability class retrieval-only systems lack.' },
        { id: 'selective-retrieval', name: 'Selective retrieval gate', definition: 'Measures when retrieval hurts reasoning and routes around it (CRAG-style gate), instead of always retrieving the graph.' },
        { id: 'frontier-authored-structure', name: 'Frontier-authored structure', definition: 'Canon authored offline by frontier models; the small model looks it up, avoiding expensive error-prone small-model extraction.' },
        { id: 'grounded-citations', name: 'Graph-grounded citations', definition: 'Answers cite specific graph edges/receipts, not just mentioned passages.' },
        { id: 'air-gapped-local', name: 'Air-gapped local operation', definition: 'Runs fully offline on local LLMs with no cloud dependency.' },
      ],
      cells: [
        { feature_id: 'verified-compute', competitor_id: 'ms-graphrag', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'noetica operator library', href: `${REPO}/Noetica/tree/main/reason` }, note: 'Operator + reason lane; retrieval-only peers structurally lack it.' },
        { feature_id: 'verified-compute', competitor_id: 'lightrag', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'noetica operator library', href: `${REPO}/Noetica/tree/main/reason` }, note: 'Operator + reason lane; retrieval-only peers structurally lack it.' },
        { feature_id: 'verified-compute', competitor_id: 'onyx', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'noetica operator library', href: `${REPO}/Noetica/tree/main/reason` }, note: 'Operator + reason lane; retrieval-only peers structurally lack it.' },
        { feature_id: 'selective-retrieval', competitor_id: 'ms-graphrag', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'CRAG gate measurement', href: `${REPO}/Noetica` }, note: 'Measured retrieval hurts reasoning; routes around it.' },
        { feature_id: 'selective-retrieval', competitor_id: 'lightrag', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'CRAG gate measurement', href: `${REPO}/Noetica` }, note: 'Measured retrieval hurts reasoning; routes around it.' },
        { feature_id: 'selective-retrieval', competitor_id: 'onyx', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'CRAG gate measurement', href: `${REPO}/Noetica` }, note: 'Measured retrieval hurts reasoning; routes around it.' },
        { feature_id: 'frontier-authored-structure', competitor_id: 'ms-graphrag', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'glossary canon', href: `${REPO}/socioprophet` }, note: 'Pays expensive GPT-4 extraction.' },
        { feature_id: 'frontier-authored-structure', competitor_id: 'lightrag', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'glossary canon', href: `${REPO}/socioprophet` }, note: 'Author canon offline; 7B looks it up.' },
        { feature_id: 'frontier-authored-structure', competitor_id: 'onyx', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'glossary canon', href: `${REPO}/socioprophet` }, note: 'Author canon offline; 7B looks it up.' },
        { feature_id: 'grounded-citations', competitor_id: 'ms-graphrag', rank: 'MEET', maturity: 'live', basis: 'self-assessed', evidence: { label: 'sourceos-spec Receipt', href: `${REPO}/SourceOS` }, note: 'Receipt fabric > MENTIONS citations, but parity on surfacing.' },
        { feature_id: 'grounded-citations', competitor_id: 'lightrag', rank: 'MEET', maturity: 'live', basis: 'self-assessed', evidence: { label: 'sourceos-spec Receipt', href: `${REPO}/SourceOS` }, note: 'Receipt fabric > MENTIONS citations, but parity on surfacing.' },
        { feature_id: 'grounded-citations', competitor_id: 'onyx', rank: 'MEET', maturity: 'live', basis: 'self-assessed', evidence: { label: 'sourceos-spec Receipt', href: `${REPO}/SourceOS` }, note: 'Receipt fabric > MENTIONS citations, but parity on surfacing.' },
        { feature_id: 'air-gapped-local', competitor_id: 'ms-graphrag', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'prophet-mesh local', href: `${REPO}/Noetica` } },
        { feature_id: 'air-gapped-local', competitor_id: 'lightrag', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'prophet-mesh local', href: `${REPO}/Noetica` } },
        { feature_id: 'air-gapped-local', competitor_id: 'onyx', rank: 'PARTIAL', maturity: 'live', basis: 'self-assessed', evidence: { label: 'prophet-mesh local', href: `${REPO}/Noetica` }, note: 'Fully air-gapped @37k users — more productized here.' },
      ],
    },
    {
      id: 'agent-framework',
      name: 'Agent framework',
      description:
        'Governed multi-step agent execution with tool consent and receipts.',
      competitors: [
        { id: 'langgraph', name: 'LangGraph' },
        { id: 'autogen', name: 'AutoGen' },
        { id: 'crewai', name: 'CrewAI' },
      ],
      features: [
        { id: 'governed-tool-consent', name: 'Purpose-bound tool consent', definition: 'Tool calls are gated by purpose-bound consent, not standing broad grants.' },
        { id: 'fail-closed-gates', name: 'Fail-closed gates', definition: 'A closed governance gate holds the agent fail-closed rather than proceeding on ambiguity.' },
        { id: 'execution-receipts', name: 'Execution receipts', definition: 'Every action emits a replayable receipt/event envelope for audit and replay.' },
        { id: 'loop-governance', name: 'Governed loops vs DAGs', definition: 'Loops are explicitly governed (bounded, receipted) rather than free-running graphs.' },
      ],
      cells: [
        { feature_id: 'governed-tool-consent', competitor_id: 'langgraph', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'capability membrane', href: `${REPO}/socioprophet` }, note: 'Purpose-bound consent membrane; frameworks grant broadly.' },
        { feature_id: 'governed-tool-consent', competitor_id: 'autogen', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'capability membrane', href: `${REPO}/socioprophet` }, note: 'Purpose-bound consent membrane; frameworks grant broadly.' },
        { feature_id: 'governed-tool-consent', competitor_id: 'crewai', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'capability membrane', href: `${REPO}/socioprophet` }, note: 'Purpose-bound consent membrane; frameworks grant broadly.' },
        { feature_id: 'fail-closed-gates', competitor_id: 'langgraph', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'guardrail-fabric', href: `${REPO}/guardrail-fabric` } },
        { feature_id: 'fail-closed-gates', competitor_id: 'autogen', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'guardrail-fabric', href: `${REPO}/guardrail-fabric` } },
        { feature_id: 'fail-closed-gates', competitor_id: 'crewai', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'guardrail-fabric', href: `${REPO}/guardrail-fabric` } },
        { feature_id: 'execution-receipts', competitor_id: 'langgraph', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'executions-ledger', href: `${REPO}/socioprophet` } },
        { feature_id: 'execution-receipts', competitor_id: 'autogen', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'executions-ledger', href: `${REPO}/socioprophet` } },
        { feature_id: 'execution-receipts', competitor_id: 'crewai', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'executions-ledger', href: `${REPO}/socioprophet` } },
        { feature_id: 'loop-governance', competitor_id: 'langgraph', rank: 'MEET', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'loops-vs-DAGs note', href: `${REPO}/socioprophet` } },
        { feature_id: 'loop-governance', competitor_id: 'autogen', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'loops-vs-DAGs note', href: `${REPO}/socioprophet` } },
        { feature_id: 'loop-governance', competitor_id: 'crewai', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'loops-vs-DAGs note', href: `${REPO}/socioprophet` } },
      ],
    },
    {
      id: 'model-lab-eval',
      name: 'Model lab / eval',
      description:
        'Provider-neutral evaluation with reproduced (not merely cited) metric facts.',
      competitors: [
        { id: 'openai-evals', name: 'OpenAI Evals' },
        { id: 'langsmith', name: 'LangSmith' },
        { id: 'helm', name: 'HELM' },
      ],
      features: [
        { id: 'reproduced-not-cited', name: 'Reproduced not cited', definition: 'Metric facts are measured by us (internal_reproduced), not just cited vendor numbers.' },
        { id: 'provider-neutral', name: 'Provider-neutral tournament', definition: 'Promotion decided by scores on our corpora — not by which provider ships eval tooling.' },
        { id: 'disjoint-honesty', name: 'Disjoint-metric honesty', definition: 'Ours and cited facts live on disjoint metric ids so no false head-to-head bar can render.' },
        { id: 'schema-validated', name: 'Schema-validated facts', definition: 'Every metric fact validates against the canonical eval-metric schema before it is served.' },
      ],
      cells: [
        { feature_id: 'reproduced-not-cited', competitor_id: 'openai-evals', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'emit_intelligence_superiority_metrics.py', href: `${REPO}/prophet-platform` }, note: 'internal_reproduced facts vs cited-only leaderboards.' },
        { feature_id: 'reproduced-not-cited', competitor_id: 'langsmith', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'emit_intelligence_superiority_metrics.py', href: `${REPO}/prophet-platform` }, note: 'internal_reproduced facts vs cited-only leaderboards.' },
        { feature_id: 'reproduced-not-cited', competitor_id: 'helm', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'emit_intelligence_superiority_metrics.py', href: `${REPO}/prophet-platform` }, note: 'internal_reproduced facts vs cited-only leaderboards.' },
        { feature_id: 'provider-neutral', competitor_id: 'openai-evals', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'Model Tournament · iSOTA', href: `${REPO}/socioprophet` } },
        { feature_id: 'provider-neutral', competitor_id: 'langsmith', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'Model Tournament · iSOTA', href: `${REPO}/socioprophet` } },
        { feature_id: 'provider-neutral', competitor_id: 'helm', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'Model Tournament · iSOTA', href: `${REPO}/socioprophet` } },
        { feature_id: 'disjoint-honesty', competitor_id: 'openai-evals', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'dashboard-bff comparison_valid', href: `${REPO}/prophet-platform` } },
        { feature_id: 'disjoint-honesty', competitor_id: 'langsmith', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'dashboard-bff comparison_valid', href: `${REPO}/prophet-platform` } },
        { feature_id: 'disjoint-honesty', competitor_id: 'helm', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'dashboard-bff comparison_valid', href: `${REPO}/prophet-platform` } },
        { feature_id: 'schema-validated', competitor_id: 'openai-evals', rank: 'MEET', maturity: 'live', basis: 'self-assessed', evidence: { label: 'schemas/eval', href: `${REPO}/prophet-platform` } },
        { feature_id: 'schema-validated', competitor_id: 'langsmith', rank: 'MEET', maturity: 'live', basis: 'self-assessed', evidence: { label: 'schemas/eval', href: `${REPO}/prophet-platform` } },
        { feature_id: 'schema-validated', competitor_id: 'helm', rank: 'MEET', maturity: 'live', basis: 'self-assessed', evidence: { label: 'schemas/eval', href: `${REPO}/prophet-platform` } },
      ],
    },
    {
      id: 'ai-governance',
      name: 'AI governance / trust',
      description:
        'Evidence-fabric governance: receipts, lawful learning, consent, controls that cannot fail.',
      competitors: [
        { id: 'credo', name: 'Credo AI' },
        { id: 'watsonx-gov', name: 'watsonx.governance' },
        { id: 'guardrails-ai', name: 'Guardrails AI' },
      ],
      features: [
        { id: 'evidence-receipts', name: 'Evidence-fabric receipts', definition: 'Governance decisions are backed by cryptographic, replayable receipts rather than reports.' },
        { id: 'lawful-learning', name: 'Lawful-learning conformance', definition: 'Training/learning conforms to a declared lawful-learning contract, audited for conformance.' },
        { id: 'purpose-bound-consent', name: 'Purpose-bound consent', definition: 'Data/tool access is bound to declared purpose, not standing grants.' },
        { id: 'control-cannot-fail', name: 'Control that cannot fail', definition: 'Controls are enforced by construction (fail-closed), verified by artifact not by command.' },
      ],
      cells: [
        { feature_id: 'evidence-receipts', competitor_id: 'credo', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'evidence-intake-kernel', href: `${REPO}/evidence-intake-kernel` } },
        { feature_id: 'evidence-receipts', competitor_id: 'watsonx-gov', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'evidence-intake-kernel', href: `${REPO}/evidence-intake-kernel` } },
        { feature_id: 'evidence-receipts', competitor_id: 'guardrails-ai', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'evidence-intake-kernel', href: `${REPO}/evidence-intake-kernel` } },
        { feature_id: 'lawful-learning', competitor_id: 'credo', rank: 'MEET', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'lawful-learning conformance audit', href: `${REPO}/socioprophet` } },
        { feature_id: 'lawful-learning', competitor_id: 'watsonx-gov', rank: 'PARTIAL', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'lawful-learning conformance audit', href: `${REPO}/socioprophet` }, note: 'Externally-audited governance is their moat.' },
        { feature_id: 'lawful-learning', competitor_id: 'guardrails-ai', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'lawful-learning conformance audit', href: `${REPO}/socioprophet` } },
        { feature_id: 'purpose-bound-consent', competitor_id: 'credo', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'purpose-bound tool consent', href: `${REPO}/socioprophet` } },
        { feature_id: 'purpose-bound-consent', competitor_id: 'watsonx-gov', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'purpose-bound tool consent', href: `${REPO}/socioprophet` } },
        { feature_id: 'purpose-bound-consent', competitor_id: 'guardrails-ai', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'purpose-bound tool consent', href: `${REPO}/socioprophet` } },
        { feature_id: 'control-cannot-fail', competitor_id: 'credo', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'guardrail-fabric', href: `${REPO}/guardrail-fabric` } },
        { feature_id: 'control-cannot-fail', competitor_id: 'watsonx-gov', rank: 'MEET', maturity: 'live', basis: 'self-assessed', evidence: { label: 'guardrail-fabric', href: `${REPO}/guardrail-fabric` } },
        { feature_id: 'control-cannot-fail', competitor_id: 'guardrails-ai', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'guardrail-fabric', href: `${REPO}/guardrail-fabric` } },
      ],
    },
    {
      id: 'knowledge-graph',
      name: 'Knowledge graph',
      description:
        'Frontier-authored ontology with triple-plausibility grounding and shaping.',
      competitors: [
        { id: 'neo4j', name: 'Neo4j' },
        { id: 'tigergraph', name: 'TigerGraph' },
        { id: 'foundry', name: 'Palantir Foundry' },
      ],
      features: [
        { id: 'triple-plausibility', name: 'Triple-plausibility grounding', definition: 'KG-BERT held-out triple-plausibility scoring gates what enters the graph.' },
        { id: 'ontogenesis-shaping', name: 'Ontogenesis shaping', definition: 'Concepts route through an ontogenesis process that shapes classes, not just stores them.' },
        { id: 'frontier-canon', name: 'Frontier-authored canon', definition: 'Ontology is frontier-authored rather than small-model or crowd-extracted.' },
        { id: 'semantic-coords', name: 'Semantic coordinate algebra', definition: 'Concepts carry semantic coordinates enabling algebraic reasoning over meaning.' },
      ],
      cells: [
        { feature_id: 'triple-plausibility', competitor_id: 'neo4j', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'KG-BERT 0.985 n=16990', href: `${REPO}/prophet-platform` } },
        { feature_id: 'triple-plausibility', competitor_id: 'tigergraph', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'KG-BERT 0.985 n=16990', href: `${REPO}/prophet-platform` } },
        { feature_id: 'triple-plausibility', competitor_id: 'foundry', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'KG-BERT 0.985 n=16990', href: `${REPO}/prophet-platform` } },
        { feature_id: 'ontogenesis-shaping', competitor_id: 'neo4j', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'ontogenesis GI classes', href: `${REPO}/socioprophet` }, note: 'Unshaped GI classes remain — declared, partially shipped.' },
        { feature_id: 'ontogenesis-shaping', competitor_id: 'tigergraph', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'ontogenesis GI classes', href: `${REPO}/socioprophet` }, note: 'Unshaped GI classes remain — declared, partially shipped.' },
        { feature_id: 'ontogenesis-shaping', competitor_id: 'foundry', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'ontogenesis GI classes', href: `${REPO}/socioprophet` }, note: 'Unshaped GI classes remain — declared, partially shipped.' },
        { feature_id: 'frontier-canon', competitor_id: 'neo4j', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'frontier-authored glossary', href: `${REPO}/socioprophet` } },
        { feature_id: 'frontier-canon', competitor_id: 'tigergraph', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'frontier-authored glossary', href: `${REPO}/socioprophet` } },
        { feature_id: 'frontier-canon', competitor_id: 'foundry', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'frontier-authored glossary', href: `${REPO}/socioprophet` } },
        { feature_id: 'semantic-coords', competitor_id: 'neo4j', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'semantic coordinate algebra', href: `${REPO}/socioprophet` } },
        { feature_id: 'semantic-coords', competitor_id: 'tigergraph', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'semantic coordinate algebra', href: `${REPO}/socioprophet` } },
        { feature_id: 'semantic-coords', competitor_id: 'foundry', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'semantic coordinate algebra', href: `${REPO}/socioprophet` } },
      ],
    },
    {
      id: 'ecosystem-marketplace',
      name: 'Ecosystem / marketplace',
      description:
        'Sovereign registry + capability membrane with epistemic-annealing pricing.',
      competitors: [
        { id: 'hf-hub', name: 'HuggingFace Hub' },
        { id: 'langchain-hub', name: 'LangChain Hub' },
      ],
      features: [
        { id: 'sovereign-registry', name: 'Sovereign registry', definition: 'Artifacts served from a sovereign, air-gappable registry (zot/gitea) — not a single external hub.' },
        { id: 'capability-membrane', name: 'Capability membrane', definition: 'Capabilities are brokered through a governed membrane with purpose-bound access.' },
        { id: 'annealing-pricing', name: 'Epistemic-annealing pricing', definition: 'Marketplace pricing reflects epistemic value via an annealing model, not flat listing fees.' },
      ],
      cells: [
        { feature_id: 'sovereign-registry', competitor_id: 'hf-hub', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'sovereign registry', href: `${REPO}/socioprophet` } },
        { feature_id: 'sovereign-registry', competitor_id: 'langchain-hub', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'sovereign registry', href: `${REPO}/socioprophet` } },
        { feature_id: 'capability-membrane', competitor_id: 'hf-hub', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'capability membrane', href: `${REPO}/socioprophet` } },
        { feature_id: 'capability-membrane', competitor_id: 'langchain-hub', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'capability membrane', href: `${REPO}/socioprophet` } },
        { feature_id: 'annealing-pricing', competitor_id: 'hf-hub', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'epistemic-annealing pricing', href: `${REPO}/socioprophet/blob/master/socioprophet-web/client-vue/docs/marketplace-epistemic-annealing-pricing.md` } },
        { feature_id: 'annealing-pricing', competitor_id: 'langchain-hub', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'epistemic-annealing pricing', href: `${REPO}/socioprophet/blob/master/socioprophet-web/client-vue/docs/marketplace-epistemic-annealing-pricing.md` } },
      ],
    },
    {
      id: 'reproducibility',
      name: 'Reproducibility',
      description:
        'Schema-validated, seed-pinned, replayable runs with self-validating checkers.',
      competitors: [
        { id: 'wandb', name: 'Weights & Biases' },
        { id: 'mlflow', name: 'MLflow' },
      ],
      features: [
        { id: 'schema-facts', name: 'Schema-validated facts', definition: 'Runs emit facts validated against a strict schema (additionalProperties:false) before storage.' },
        { id: 'replayable-envelopes', name: 'Replayable event envelopes', definition: 'State transitions emit replayable event envelopes enabling exact replay.' },
        { id: 'seed-pinned', name: 'Seed-pinned runs', definition: 'Runs pin seeds (e.g. seed1729/seed2026) so results reproduce deterministically.' },
        { id: 'self-validating-checker', name: 'Self-validating checker', definition: 'The conformance checker validates itself (excluding itself) so it cannot silently pass broken.' },
      ],
      cells: [
        { feature_id: 'schema-facts', competitor_id: 'wandb', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'schemas/eval strict', href: `${REPO}/prophet-platform` } },
        { feature_id: 'schema-facts', competitor_id: 'mlflow', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'schemas/eval strict', href: `${REPO}/prophet-platform` } },
        { feature_id: 'replayable-envelopes', competitor_id: 'wandb', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'TwinEventEnvelope', href: `${REPO}/socioprophet` } },
        { feature_id: 'replayable-envelopes', competitor_id: 'mlflow', rank: 'MEET', maturity: 'live', basis: 'self-assessed', evidence: { label: 'TwinEventEnvelope', href: `${REPO}/socioprophet` } },
        { feature_id: 'seed-pinned', competitor_id: 'wandb', rank: 'MEET', maturity: 'live', basis: 'self-assessed', evidence: { label: 'seed1729 / seed2026', href: `${REPO}/prophet-platform` } },
        { feature_id: 'seed-pinned', competitor_id: 'mlflow', rank: 'MEET', maturity: 'live', basis: 'self-assessed', evidence: { label: 'seed1729 / seed2026', href: `${REPO}/prophet-platform` } },
        { feature_id: 'self-validating-checker', competitor_id: 'wandb', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'self-validating checker', href: `${REPO}/socioprophet` } },
        { feature_id: 'self-validating-checker', competitor_id: 'mlflow', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'self-validating checker', href: `${REPO}/socioprophet` } },
      ],
    },
    {
      id: 'world-model-twin',
      name: 'World model / twin',
      description:
        'Geospatially-grounded state-space twins with a governed impulse core.',
      competitors: [
        { id: 'omniverse', name: 'NVIDIA Omniverse' },
        { id: 'foundry-twin', name: 'Palantir Foundry' },
      ],
      features: [
        { id: 'governed-impulse', name: 'Governed impulse core', definition: 'Twin dynamics x⁺ = A·x + B·(G·u) route inputs through a gate G that holds the twin fail-closed.' },
        { id: 'twin-lifecycle-receipts', name: 'Twin lifecycle receipts', definition: 'created→authorized→verified transitions each emit a replayable TwinEventEnvelope.' },
        { id: 'ontology-bound-twin', name: 'Ontology-bound twin', definition: 'Twins are wired into an ontology (Twin→Region→Sensor→Feed→Event→Policy→Hologram), not free-floating.' },
        { id: 'geospatial-cop', name: 'Geospatial common operating picture', definition: 'Twins located on a shared geospatial picture over a risk field.' },
      ],
      cells: [
        { feature_id: 'governed-impulse', competitor_id: 'omniverse', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'Twin World Model impulse core', href: `${REPO}/socioprophet` } },
        { feature_id: 'governed-impulse', competitor_id: 'foundry-twin', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'Twin World Model impulse core', href: `${REPO}/socioprophet` } },
        { feature_id: 'twin-lifecycle-receipts', competitor_id: 'omniverse', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'cloud-twin lifecycle', href: `${REPO}/socioprophet` } },
        { feature_id: 'twin-lifecycle-receipts', competitor_id: 'foundry-twin', rank: 'BEAT', maturity: 'live', basis: 'self-assessed', evidence: { label: 'cloud-twin lifecycle', href: `${REPO}/socioprophet` } },
        { feature_id: 'ontology-bound-twin', competitor_id: 'omniverse', rank: 'MEET', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'twin ontology', href: `${REPO}/gaia-world-model` } },
        { feature_id: 'ontology-bound-twin', competitor_id: 'foundry-twin', rank: 'MEET', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'twin ontology', href: `${REPO}/gaia-world-model` } },
        { feature_id: 'geospatial-cop', competitor_id: 'omniverse', rank: 'PARTIAL', maturity: 'live', basis: 'self-assessed', evidence: { label: 'equirectangular COP', href: `${REPO}/socioprophet` }, note: 'Photoreal simulation is their moat.' },
        { feature_id: 'geospatial-cop', competitor_id: 'foundry-twin', rank: 'MEET', maturity: 'live', basis: 'self-assessed', evidence: { label: 'equirectangular COP', href: `${REPO}/socioprophet` } },
      ],
    },
    {
      id: 'risk-value',
      name: 'Risk / value',
      description:
        'Regime-aware calculus over value × time — an EP financial spine.',
      competitors: [
        { id: 'aladdin', name: 'BlackRock Aladdin' },
        { id: 'bloomberg', name: 'Bloomberg' },
      ],
      features: [
        { id: 'regime-aware', name: 'Regime-aware calculus', definition: 'Value/risk computed with an explicit regime-aware calculus (regime + microstructure + vol-surface).' },
        { id: 'ep-spine', name: 'EP financial spine', definition: 'A coherent, receipted economic-prophet kernel consumed (not forked) across surfaces.' },
        { id: 'value-energy', name: 'Value-energy conservation', definition: 'A welfare-annealing framework conserving value-energy while annealing toward global QoL.' },
      ],
      cells: [
        { feature_id: 'regime-aware', competitor_id: 'aladdin', rank: 'GAP', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'omnirisk/EP financial spine', href: `${REPO}/economic-prophet` }, note: 'Mature risk analytics is their moat.' },
        { feature_id: 'regime-aware', competitor_id: 'bloomberg', rank: 'PARTIAL', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'omnirisk/EP financial spine', href: `${REPO}/economic-prophet` }, note: 'EP kernel + regime lens declared; not fully shipped.' },
        { feature_id: 'ep-spine', competitor_id: 'aladdin', rank: 'MEET', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'economic-prophet canonical', href: `${REPO}/economic-prophet` } },
        { feature_id: 'ep-spine', competitor_id: 'bloomberg', rank: 'MEET', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'economic-prophet canonical', href: `${REPO}/economic-prophet` } },
        { feature_id: 'value-energy', competitor_id: 'aladdin', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'welfare-annealing framework', href: `${REPO}/socioprophet` }, note: 'Constructive inverse of the SILENT failure mode; unique framing.' },
        { feature_id: 'value-energy', competitor_id: 'bloomberg', rank: 'BEAT', maturity: 'spec', basis: 'self-assessed', evidence: { label: 'welfare-annealing framework', href: `${REPO}/socioprophet` }, note: 'Constructive inverse of the SILENT failure mode; unique framing.' },
      ],
    },
  ],
};

