// Live ChatTurn → Reasoning-Chain-Inspector model adapter.
//
// Augments PR #516: the inspector shipped over three seed fixtures (examples.ts).
// This maps a LIVE Noetica conversation turn (useNoeticaChat ChatTurn — its
// plan / retrieval / grounding / judgment) onto the SAME Example shape the
// fixtures produce, so the four stages (Annotation → Concepts → Variants →
// Execution) render the REAL active chain for the selected turn, scored by the
// UNCHANGED governed scorer (scoreVariants.ts).
//
// Contract (ChatTurn → Example):
//   • question   ← the user turn that produced this assistant turn
//   • tokens     ← annotation tree: an ACTION head (intent / plan skill|capability),
//                  then grounding.terms as ENTITY concepts and grounding.topics as
//                  CONTEXT concepts (plan step labels stand in when grounding is
//                  empty). Each concept's LABEL comes from the live resolver
//                  (conceptResolver.ts); its KIND stays bound via kindVocabulary.
//   • variants   ← ONE candidate plan built from plan.steps (executor = capability:
//                  stepId, weight from step status). No synthetic ties are invented
//                  — a single real plan yields a single variant.
//   • scoring    ← requestedCore/declaredCanonicalPath derived from the plan's
//                  concept order; ambient empty (fed verbatim to scoreVariants).
//   • execution  ← judgment.verdict → resolved/gap; content is the response.
//
// Pure and resolver-injected: no store/composable/network coupling, so the
// transform and its live-label resolution are unit-testable in isolation.

import type { ChatTurn } from '../../composables/useNoeticaChat';
import type { Example, Token, TokenConcept, ExecutionOutcome, ExampleMode } from './examples';
import type { RawVariant, ChainStep, ScoringOntology } from './scoreVariants';
import type { SourceCat, AnnotationKind } from './kindVocabulary';
import { resolveConceptLabel, type ConceptResolver } from './conceptResolver';

/** One inspectable live chain: an assistant turn + the question that drove it. */
export interface LiveChain {
  /** Index of the assistant turn within useNoeticaChat().turns. */
  turnIndex: number;
  /** The user question that produced this turn (empty string if none captured). */
  question: string;
  /** The assistant turn to inspect. */
  turn: ChatTurn;
}

const LIVE_MODE: ExampleMode = { key: 'live', label: 'Live plan' };

const uniq = (xs: string[]): string[] => Array.from(new Set(xs));
const firstLine = (s: string): string => (s.split('\n').find((l) => l.trim().length > 0) ?? '').trim();
const truncate = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Plan-step status → hop weight (provenance/display only; not a governed input). */
function weightForStatus(status: string | undefined): number {
  switch ((status ?? '').toLowerCase()) {
    case 'done':
    case 'complete':
    case 'completed':
    case 'ok':
      return 1;
    case 'running':
    case 'active':
    case 'in_progress':
      return 0.6;
    case 'failed':
    case 'error':
    case 'blocked':
      return 0.2;
    default:
      return 0.5;
  }
}

function makeConcept(
  text: string,
  cat: SourceCat,
  kind: AnnotationKind,
  resolver: ConceptResolver,
): TokenConcept {
  const rc = resolveConceptLabel(text, kind, resolver);
  return { l: rc.label, c: cat, provenance: rc.provenance, provisional: rc.provisional };
}

function makeToken(
  text: string,
  dep: string,
  depth: number,
  parent: number | null,
  cat: SourceCat,
  kind: AnnotationKind,
  resolver: ConceptResolver,
): Token {
  return { text, pos: '', dep, depth, parent, concepts: [makeConcept(text, cat, kind, resolver)] };
}

/** The action head text for a turn (intent → plan skill → plan capability). */
function actionText(turn: ChatTurn): string {
  return turn.intentName ?? turn.plan?.skill ?? turn.plan?.capability ?? 'respond';
}

function buildTokens(chain: LiveChain, resolver: ConceptResolver): Token[] {
  const { turn } = chain;
  const tokens: Token[] = [makeToken(actionText(turn), 'ROOT', 0, null, 'action', 'ACTION', resolver)];

  const terms = turn.grounding?.terms ?? [];
  const entitySources = terms.length ? terms : (turn.plan?.steps ?? []).map((s) => s.label);
  for (const t of entitySources) {
    if (t && t.trim()) tokens.push(makeToken(t, 'concept', 1, 0, 'entity', 'ENTITY_TYPE', resolver));
  }

  for (const tp of turn.grounding?.topics ?? []) {
    if (tp && tp.trim()) tokens.push(makeToken(tp, 'context', 1, 0, 'temporal', 'CONTEXT', resolver));
  }

  return tokens;
}

function buildPlanVariant(chain: LiveChain, resolver: ConceptResolver): { variant: RawVariant; ontology: ScoringOntology } {
  const { turn } = chain;
  const cap = turn.plan?.capability ?? turn.plan?.skill ?? 'noetica';
  const steps = turn.plan?.steps ?? [];

  const chainSteps: ChainStep[] = [];
  const path: string[] = [];

  // Action head (part of requestedCore, mirroring the fixture convention).
  const actionLabel = resolveConceptLabel(actionText(turn), 'ACTION', resolver).label;
  chainSteps.push({ concept: actionLabel, executor: `${cap}:respond`, weight: 1, cat: 'action' });
  path.push(actionLabel);

  const coreConcepts: string[] = [];
  const conceptSources: Array<{ label: string; executor: string; weight: number }> = steps.length
    ? steps.map((s) => ({
        label: resolveConceptLabel(s.label, 'ENTITY_TYPE', resolver).label,
        executor: `${cap}:${s.id}`,
        weight: weightForStatus(s.status),
      }))
    : (turn.grounding?.terms ?? []).map((t) => ({
        label: resolveConceptLabel(t, 'ENTITY_TYPE', resolver).label,
        executor: `${cap}:${t.replace(/\s+/g, '_')}`,
        weight: 0.5,
      }));

  for (const c of conceptSources) {
    chainSteps.push({ concept: c.label, executor: c.executor, weight: c.weight, cat: 'entity' });
    coreConcepts.push(c.label);
    path.push(c.label);
  }

  const text = firstLine(turn.content) || turn.plan?.skill || turn.plan?.capability || 'Executed plan';
  const variant: RawVariant = { id: `live-${chain.turnIndex}`, text, chain: chainSteps };
  const ontology: ScoringOntology = {
    requestedCore: uniq([actionLabel, ...coreConcepts]),
    ambient: [],
    declaredCanonicalPath: uniq(path),
  };
  return { variant, ontology };
}

function buildExecution(chain: LiveChain): ExecutionOutcome {
  const { turn } = chain;
  const verdict = turn.judgment?.verdict;
  const status: ExecutionOutcome['status'] =
    verdict === 'grounded'
      ? 'resolved'
      : verdict === 'speculative' || verdict === 'contradiction'
        ? 'gap'
        : turn.error
          ? 'gap'
          : turn.content.trim()
            ? 'resolved'
            : 'gap';

  const notes = turn.judgment?.notes?.filter(Boolean).join(' · ');
  const contradictions = turn.judgment?.contradictions?.map((c) => c.statement).filter(Boolean).join('; ');
  const note =
    notes ||
    (contradictions ? `Declared contradiction: ${contradictions}` : '') ||
    (turn.grounding?.domain ? `Grounded in ${turn.grounding.domain}.` : '') ||
    (status === 'resolved'
      ? 'Resolved from the live chain (no explicit value judgment emitted for this turn).'
      : 'No grounded answer produced for this turn.');

  const response = truncate(turn.content.trim() || '—', 600);
  return { status, note, response };
}

/** Map one live conversation chain onto the inspector's Example model. */
export function chatTurnToExample(chain: LiveChain, resolver: ConceptResolver): Example {
  const { variant, ontology } = buildPlanVariant(chain, resolver);
  return {
    id: `L${chain.turnIndex}`,
    label: chain.turn.intentName ?? 'Live turn',
    question: chain.question || '(no question captured for this turn)',
    tokens: buildTokens(chain, resolver),
    modes: [LIVE_MODE],
    variants: { [LIVE_MODE.key]: [variant] },
    execution: { [LIVE_MODE.key]: buildExecution(chain) },
    scoring: { [LIVE_MODE.key]: ontology },
  };
}

/**
 * Derive the inspectable live chains from a chat turn list: each non-streaming
 * assistant turn paired with the most recent preceding user question. Fan-out
 * siblings (several assistant columns for one question) each reuse that question.
 */
export function liveChainsFromTurns(turns: ChatTurn[]): LiveChain[] {
  const chains: LiveChain[] = [];
  let pendingQuestion = '';
  turns.forEach((t, i) => {
    if (t.role === 'user') {
      pendingQuestion = t.content;
    } else if (t.role === 'assistant' && !t.streaming) {
      chains.push({ turnIndex: i, question: pendingQuestion, turn: t });
    }
  });
  return chains;
}
