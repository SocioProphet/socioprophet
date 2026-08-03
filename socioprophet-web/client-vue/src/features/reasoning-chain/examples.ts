// Reasoning Chain Inspector — faithful port of the three worked examples from the
// reference component (A org-scoping, B best-mailings, C EMEA-rollup): token trees,
// candidate plan variants, and execution outcomes. Data is verbatim from source;
// the per-example `scoring` ontology binds each example to the governed scorer
// (scoreVariants.ts), and `loggedQuestions` seeds the precision@1 gate.

import type { SourceCat } from './kindVocabulary';
import type { ProvenanceClass } from './kindVocabulary';
import type { RawVariant, ScoringOntology, LoggedQuestion } from './scoreVariants';

export interface TokenConcept {
  /** Learned concept label. */
  l: string;
  /** Source CAT token. */
  c: SourceCat;
  /** Provenance class — labels are learned unless a human override supersedes. */
  provenance?: ProvenanceClass;
}
export interface Token {
  text: string;
  pos: string;
  dep: string;
  depth: number;
  parent: number | null;
  concepts: TokenConcept[];
}

export interface ExecutionOutcome {
  status: 'resolved' | 'gap';
  note: string;
  response: string;
}
export interface ExampleMode {
  key: string;
  label: string;
}
export interface Example {
  id: string;
  label: string;
  question: string;
  tokens: Token[];
  modes: ExampleMode[];
  variants: Record<string, RawVariant[]>;
  execution: Record<string, ExecutionOutcome>;
  /** Governed-scorer ontology per mode (keys match `modes`). */
  scoring: Record<string, ScoringOntology>;
}

// Helper: source chains are [concept, executor, weight, cat] tuples.
type Tuple = [string, string, string, string];
const chain = (rows: Tuple[]): RawVariant['chain'] =>
  rows.map(([concept, executor, weight, cat]) => ({ concept, executor, weight: Number(weight), cat }));

const EX_A_TOKENS: Token[] = [
  { text: 'show', pos: 'VB VERB', dep: 'ROOT', depth: 0, parent: null, concepts: [{ l: ':ActionShow', c: 'action' }] },
  { text: 'me', pos: 'PRP PRON', dep: 'iobj', depth: 1, parent: 0, concepts: [{ l: ':ActionShow', c: 'action' }] },
  { text: 'list', pos: 'NNS NOUN', dep: 'dobj', depth: 1, parent: 0, concepts: [{ l: ':ContactLists', c: 'entity' }, { l: ':Lists', c: 'entity' }] },
  { text: 'all', pos: 'DT DET', dep: 'det', depth: 2, parent: 2, concepts: [] },
  { text: 'contact', pos: 'NN NOUN', dep: 'nn', depth: 2, parent: 2, concepts: [{ l: ':ContactLists', c: 'entity' }] },
  { text: 'in', pos: 'IN ADP', dep: 'prep', depth: 2, parent: 2, concepts: [{ l: ':Contains', c: 'relation' }, { l: ':Relation', c: 'relation' }] },
  { text: 'org', pos: 'NN NOUN', dep: 'pobj', depth: 3, parent: 5, concepts: [{ l: ':Organization', c: 'entity' }] },
  { text: 'my', pos: 'PRP$ PRON', dep: 'poss', depth: 4, parent: 6, concepts: [{ l: ':Own', c: 'relation' }] },
];

const EX_B_TOKENS: Token[] = [
  { text: 'send', pos: 'VBN VERB', dep: 'ROOT', depth: 0, parent: null, concepts: [{ l: ':Sent', c: 'action' }] },
  { text: 'what', pos: 'WP PRON', dep: 'dep', depth: 1, parent: 0, concepts: [{ l: ':What', c: 'modifier' }] },
  { text: 'be', pos: 'VBP VERB', dep: 'auxpass', depth: 1, parent: 0, concepts: [{ l: ':What', c: 'modifier' }] },
  { text: 'line', pos: 'NNS NOUN', dep: 'nsubjpass', depth: 1, parent: 0, concepts: [{ l: ':SubjectValues', c: 'entity' }] },
  { text: 'positive', pos: 'JJ ADJ', dep: 'amod', depth: 2, parent: 3, concepts: [{ l: ':Positive', c: 'modifier' }] },
  { text: 'subject', pos: 'JJ ADJ', dep: 'amod', depth: 2, parent: 3, concepts: [{ l: ':SubjectValues', c: 'entity' }] },
  { text: 'of', pos: 'IN ADP', dep: 'prep', depth: 2, parent: 3, concepts: [{ l: ':Relation', c: 'relation' }] },
  { text: 'mailing', pos: 'NNS NOUN', dep: 'pobj', depth: 3, parent: 6, concepts: [{ l: ':Mailings', c: 'entity' }] },
  { text: 'best', pos: 'JJS ADJ', dep: 'amod', depth: 4, parent: 7, concepts: [{ l: ':TheBest', c: 'gap' }] },
  { text: 'in', pos: 'IN ADP', dep: 'prep', depth: 1, parent: 0, concepts: [{ l: ':Relation', c: 'relation' }] },
  { text: '2017', pos: 'CD NUM', dep: 'pobj', depth: 2, parent: 9, concepts: [{ l: ':Timeframe', c: 'temporal' }] },
];

const EX_C_TOKENS: Token[] = [
  { text: 'send', pos: 'VBD VERB', dep: 'ROOT', depth: 0, parent: null, concepts: [{ l: ':Sent', c: 'action' }] },
  { text: 'mailing', pos: 'NNS NOUN', dep: 'dobj', depth: 1, parent: 0, concepts: [{ l: ':Mailings', c: 'entity' }] },
  { text: 'many', pos: 'JJ ADJ', dep: 'amod', depth: 2, parent: 1, concepts: [{ l: ':Count', c: 'modifier' }] },
  { text: 'how', pos: 'WRB ADV', dep: 'advmod', depth: 3, parent: 2, concepts: [{ l: ':Count', c: 'modifier' }] },
  { text: 'EMEA', pos: 'NNP PROPN', dep: 'nsubj', depth: 1, parent: 0, concepts: [{ l: ':OrgUnit', c: 'gap' }] },
  { text: 'quarter', pos: 'NN NOUN', dep: 'tmod', depth: 1, parent: 0, concepts: [{ l: ':Timeframe', c: 'temporal' }] },
  { text: 'last', pos: 'JJ ADJ', dep: 'amod', depth: 2, parent: 5, concepts: [{ l: ':Relation', c: 'relation' }] },
];

export const EXAMPLES: Example[] = [
  {
    id: 'A',
    label: 'Org scoping',
    question: 'show me all contact lists in my org',
    tokens: EX_A_TOKENS,
    modes: [
      { key: 'raw', label: 'Raw scoring' },
      { key: 'fixed', label: 'Dedup + parsimony' },
    ],
    variants: {
      raw: [
        { text: 'Show me contact lists.', parseScore: '0.75', chain: chain([['ActionShow', 'common:ShowDataMessage', '5.000', 'action'], ['ContactLists', 'engage:GetContactLists', '3.000', 'entity'], ['Organization', 'engage:GetOrganization', '2.000', 'entity']]) },
        { text: 'Show me contact lists belonging to you.', parseScore: '0.75', chain: chain([['ActionShow', 'common:ShowDataMessage', '3.833', 'action'], ['ContactLists', 'engage:GetOwnLists', '1.833', 'entity'], ['ContactLists', 'engage:GetContactLists', '2.500', 'entity'], ['Organization', 'engage:GetOrganization', '1.000', 'entity']]) },
        { text: 'Show me contact lists belonging to you.', parseScore: '0.625', chain: chain([['ActionShow', 'common:ShowDataMessage', '3.667', 'action'], ['ContactLists', 'engage:GetOwnLists', '1.667', 'entity'], ['ContactLists', 'engage:GetContactLists', '2.000', 'entity']]) },
        { text: 'Show me contact lists.', parseScore: '0.5', chain: chain([['ActionShow', 'common:ShowDataMessage', '4.000', 'action'], ['ContactLists', 'engage:GetContactLists', '2.000', 'entity']]) },
        { text: 'Show me organization belonging to you.', parseScore: '0.5', chain: chain([['ActionShow', 'common:ShowDataMessage', '2.667', 'action'], ['Organization', 'engage:GetOrganization', '2.000', 'entity']]) },
        { text: 'Contains.', parseScore: '0.125', chain: chain([['Contains', 'data:FillConditionIn', '1.000', 'relation']]) },
      ],
      // The "fixed" mode is DERIVED live from scoreVariants(raw) in the component;
      // this array is the reference target the scorer must reproduce (see tests).
      fixed: [
        { text: 'Show me contact lists.', parseScore: '0.75', chain: chain([['ActionShow', 'common:ShowDataMessage', '4.000', 'action'], ['ContactLists', 'engage:GetContactLists', '2.000', 'entity']]) },
        { text: 'Show me contact lists belonging to you.', parseScore: '0.5', chain: chain([['ActionShow', 'common:ShowDataMessage', '3.667', 'action'], ['ContactLists', 'engage:GetOwnLists', '1.667', 'entity'], ['ContactLists', 'engage:GetContactLists', '2.000', 'entity']]) },
        { text: 'Show me organization belonging to you.', parseScore: '0.42', chain: chain([['ActionShow', 'common:ShowDataMessage', '2.667', 'action'], ['Organization', 'engage:GetOrganization', '2.000', 'entity']]) },
        { text: 'Contains.', parseScore: '0.10', chain: chain([['Contains', 'data:FillConditionIn', '1.000', 'relation']]) },
      ],
    },
    execution: {
      raw: { status: 'resolved', note: 'Top-1 margin: 0.00 — exact tie between #1 and #2. Selection depends on tie-break order, not signal.', response: 'I found the 12 contact lists in your org.' },
      fixed: { status: 'resolved', note: 'Top-1 margin: clear separation after dedup + parsimony.', response: 'I found the 12 contact lists in your org.' },
    },
    scoring: {
      raw: { requestedCore: ['ActionShow', 'ContactLists'], ambient: ['Organization', 'Contains'], declaredCanonicalPath: ['ActionShow', 'ContactLists', 'Organization', 'Contains'] },
      fixed: { requestedCore: ['ActionShow', 'ContactLists'], ambient: ['Organization', 'Contains'], declaredCanonicalPath: ['ActionShow', 'ContactLists', 'Organization', 'Contains'] },
    },
  },
  {
    id: 'B',
    label: 'Best mailings',
    question: 'what are positive subject lines of best mailings sent in 2017',
    tokens: EX_B_TOKENS,
    modes: [
      { key: 'current', label: 'Current primitives' },
      { key: 'proposed', label: 'With reporting primitives' },
    ],
    variants: {
      current: [
        { text: 'Show me mailings sent in 2017.', parseScore: '0.42', chain: chain([['ActionShow', 'common:ShowDataMessage', '3.000', 'action'], ['Mailings', 'engage:GetMailingsByDates', '2.000', 'entity']]) },
        { text: 'Show me subject lines.', parseScore: '0.18', chain: chain([['ActionShow', 'common:ShowDataMessage', '1.500', 'action']]) },
      ],
      proposed: [
        { text: 'Show me the best mailings sent in 2017, ranked by open rate, with positive subject lines.', parseScore: '0.91', chain: chain([['ActionShow', 'common:ShowDataMessage', '4.000', 'action'], ['Mailings', 'engage:GetMailingsByDates', '3.000', 'entity'], ['TheBest', 'engage:RankByMetric(openRate)', '3.500', 'entity'], ['Positive', 'engage:FilterSubjectSentiment', '2.500', 'modifier']]) },
      ],
    },
    execution: {
      current: { status: 'gap', note: 'No primitive binds :TheBest or :Positive. Best available variant silently discards both — the answer looks complete but isn\'t.', response: 'Here are your mailings sent in 2017.' },
      proposed: { status: 'resolved', note: 'TheBest resolves via an ontology-declared metric binding (openRate for this vertical).', response: 'Your top mailings from 2017 by open rate, with positive subject lines: ...' },
    },
    scoring: {
      current: { requestedCore: ['ActionShow', 'Mailings', 'TheBest', 'Positive'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Mailings', 'TheBest', 'Positive'] },
      proposed: { requestedCore: ['ActionShow', 'Mailings', 'TheBest', 'Positive'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Mailings', 'TheBest', 'Positive'] },
    },
  },
  {
    id: 'C',
    label: 'EMEA rollup',
    question: 'how many mailings did EMEA send last quarter',
    tokens: EX_C_TOKENS,
    modes: [
      { key: 'current', label: 'Current primitives' },
      { key: 'proposed', label: 'With org hierarchy primitive' },
    ],
    variants: {
      current: [
        { text: 'Show me the number of mailings.', parseScore: '0.38', chain: chain([['ActionShow', 'common:ShowDataMessage', '2.000', 'action'], ['Mailings', 'engage:GetOwnMailings', '2.000', 'entity']]) },
      ],
      proposed: [
        { text: 'Show me the number of mailings sent by EMEA last quarter.', parseScore: '0.88', chain: chain([['ActionShow', 'common:ShowDataMessage', '3.000', 'action'], ['OrgUnit', 'engage:ResolveOrgUnit(EMEA)', '3.000', 'entity'], ['Mailings', 'engage:GetMailingsByDates(rollup:descendants)', '3.500', 'entity']]) },
      ],
    },
    execution: {
      current: { status: 'gap', note: 'Org scope is binary (:Own / :Others) — a named sub-org and hierarchy rollup are unrepresentable, so the scope silently defaults to "own," and the count is for the wrong org entirely.', response: 'You have 214 mailings.' },
      proposed: { status: 'resolved', note: 'Org hierarchy traversal resolves EMEA as a descendant scope and rolls counts up.', response: 'EMEA sent 37 mailings last quarter.' },
    },
    scoring: {
      current: { requestedCore: ['ActionShow', 'Mailings', 'OrgUnit'], ambient: [], declaredCanonicalPath: ['ActionShow', 'OrgUnit', 'Mailings'] },
      proposed: { requestedCore: ['ActionShow', 'Mailings', 'OrgUnit'], ambient: [], declaredCanonicalPath: ['ActionShow', 'OrgUnit', 'Mailings'] },
    },
  },
];

// ---- precision@1 seed fixtures (counter-test gate) ----
// SEED SET ONLY (n < MIN_N=30). The gate is wired; the logged-question corpus
// must grow to n>=30 before any precision@1 claim is published (GKN#9). Follow-up
// filed @mdheller to source real logged questions.
const exA = EXAMPLES[0];
const exB = EXAMPLES[1];
const exC = EXAMPLES[2];

export const LOGGED_QUESTIONS: LoggedQuestion[] = [
  { id: 'A-org-scoping', question: exA.question, variants: exA.variants.raw, ontology: exA.scoring.raw, goldKey: 'common:ShowDataMessage|engage:GetContactLists' },
  { id: 'B-best-mailings', question: exB.question, variants: exB.variants.proposed, ontology: exB.scoring.proposed, goldKey: 'common:ShowDataMessage|engage:FilterSubjectSentiment|engage:GetMailingsByDates|engage:RankByMetric(openRate)' },
  { id: 'C-emea-rollup', question: exC.question, variants: exC.variants.proposed, ontology: exC.scoring.proposed, goldKey: 'common:ShowDataMessage|engage:GetMailingsByDates(rollup:descendants)|engage:ResolveOrgUnit(EMEA)' },
];
