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
  /**
   * True when the label is a graceful KIND fallback (no live label resolution),
   * not a resolved governed label. Fixtures never set this; live-derived chains
   * (chatTurnAdapter.ts) mark unresolved concepts so the UI can flag them.
   */
  provisional?: boolean;
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

// ---- precision@1 corpus (counter-test gate) ----
//
// TWO BARS (GKN#9 Goodhart guard), enforced in scoreVariants.precisionAt1:
//   - meetsMinN  : n >= MIN_N (30) → the corpus is a LIVE REGRESSION gate. Met.
//   - publishable: >= MIN_N *production-logged* questions → a precision@1 CLAIM may
//                  ship externally. NOT met — see PROVENANCE below.
//
// PROVENANCE — honest, structural, per AGENTS.md (no fabricated provenance):
//   * A/B/C          → 'reference_example' (the three worked examples).
//   * D..AG, AH..AM  → 'authored_fixture', hand-declared against the reference
//                      component's domain (Acoustic Campaign / `engage` + `common`
//                      primitives). NOT scraped from a production log, and NOT
//                      machine-derived from the scorer's own output — each `goldKey`
//                      is the plan a HUMAN declares correct, independent of what the
//                      scorer returns; the counter-test then checks the governed
//                      scorer actually selects it.
// Because zero fixtures are 'production_log', `precisionAt1(...).publishable` is
// false and a `claimBlockedReason` is surfaced: the gate refuses to publish a
// precision@1 claim on synthetic data even though min-n is met. When a governed
// query-log source lands, register those questions with provenance:'production_log'
// (same declared-gold contract) and the claim unblocks automatically — no scorer
// change required (tracked follow-up @mdheller).
//
// The corpus is not merely self-agreeing: two subsets make the metric earn its
// keep — the D..AG "clean" fixtures pin correct plans, while the AH..AM (and A, V)
// ADVERSARIAL fixtures are ones a naive coverage-only ranker gets WRONG, so the
// gate can assert the governed scorer STRICTLY BEATS that baseline (see
// baselinePrecisionAt1 + the teeth test).
const exA = EXAMPLES[0];
const exB = EXAMPLES[1];
const exC = EXAMPLES[2];

// Compact plan-variant builder for the corpus below (rows are the same
// [concept, executor, weight, cat] tuples as `chain`).
const V = (text: string, parseScore: string, rows: Tuple[]): RawVariant => ({ text, parseScore, chain: chain(rows) });
// A curated fixture minus its provenance stamp; `authored()` applies the stamp so
// the 30+ curated entries can't be added without a declared, honest provenance.
type Fixture = Omit<LoggedQuestion, 'provenance' | 'source'>;
const authored = (rows: Fixture[]): LoggedQuestion[] => rows.map((f) => ({ ...f, provenance: 'authored_fixture' as const }));
// Canonical UI/action executors reused across the corpus.
const SHOW = 'common:ShowDataMessage';
const COUNT = 'common:ShowCount';
const CHART = 'common:ShowChart';
const EXPORT = 'common:ExportCsv';

export const LOGGED_QUESTIONS: LoggedQuestion[] = [
  // ---- reference-derived seeds (the three worked examples) ----
  { id: 'A-org-scoping', question: exA.question, variants: exA.variants.raw, ontology: exA.scoring.raw, goldKey: 'common:ShowDataMessage|engage:GetContactLists', provenance: 'reference_example', source: 'worked example A (org scoping) — raw-tie adversarial' },
  { id: 'B-best-mailings', question: exB.question, variants: exB.variants.proposed, ontology: exB.scoring.proposed, goldKey: 'common:ShowDataMessage|engage:FilterSubjectSentiment|engage:GetMailingsByDates|engage:RankByMetric(openRate)', provenance: 'reference_example', source: 'worked example B (best mailings)' },
  { id: 'C-emea-rollup', question: exC.question, variants: exC.variants.proposed, ontology: exC.scoring.proposed, goldKey: 'common:ShowDataMessage|engage:GetMailingsByDates(rollup:descendants)|engage:ResolveOrgUnit(EMEA)', provenance: 'reference_example', source: 'worked example C (EMEA rollup)' },

  // ---- curated domain corpus (provenance 'authored_fixture' applied by authored()) ----
  ...authored([
  // contacts, lists, suppression
  {
    id: 'D-contacts-in-list',
    question: 'show me the contacts in my newsletter list',
    variants: [
      V('Show me the contacts.', '0.71', [['ActionShow', SHOW, '4.000', 'action'], ['Contacts', 'engage:GetContacts', '3.000', 'entity']]),
      V('Show me contact lists.', '0.44', [['ActionShow', SHOW, '3.000', 'action'], ['ContactLists', 'engage:GetContactLists', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Contacts'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Contacts'] },
    goldKey: 'common:ShowDataMessage|engage:GetContacts',
  },
  {
    id: 'E-suppression-list',
    question: 'who is on my suppression list',
    variants: [
      V('Show me the suppression list.', '0.68', [['ActionShow', SHOW, '4.000', 'action'], ['SuppressionList', 'engage:GetSuppressionList', '3.000', 'entity']]),
      V('Show me a message.', '0.20', [['ActionShow', SHOW, '1.500', 'action']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'SuppressionList'], ambient: [], declaredCanonicalPath: ['ActionShow', 'SuppressionList'] },
    goldKey: 'common:ShowDataMessage|engage:GetSuppressionList',
  },
  {
    id: 'F-hard-bounces',
    question: 'show me hard bounces from last week',
    variants: [
      V('Show me hard bounces.', '0.66', [['ActionShow', SHOW, '4.000', 'action'], ['Bounces', 'engage:GetBounces', '3.000', 'entity']]),
      V('Show me mailings.', '0.33', [['ActionShow', SHOW, '2.000', 'action'], ['Mailings', 'engage:GetMailings', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Bounces'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Bounces'] },
    goldKey: 'common:ShowDataMessage|engage:GetBounces',
  },
  {
    id: 'G-unsubscribes',
    question: 'how many people unsubscribed in July',
    variants: [
      V('Show me the number of unsubscribes.', '0.62', [['ActionShow', SHOW, '3.000', 'action'], ['Unsubscribes', 'engage:GetUnsubscribes', '3.000', 'entity']]),
      V('Show me a message.', '0.18', [['ActionShow', SHOW, '1.500', 'action']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Unsubscribes'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Unsubscribes'] },
    goldKey: 'common:ShowDataMessage|engage:GetUnsubscribes',
  },

  // ---- curated domain corpus — mailings, reports, rankings ----
  {
    id: 'H-open-rate-rank',
    question: 'which mailings had the highest open rate',
    variants: [
      V('Show me mailings ranked by open rate.', '0.83', [['ActionShow', SHOW, '4.000', 'action'], ['Mailings', 'engage:GetMailings', '3.000', 'entity'], ['TheBest', 'engage:RankByMetric(openRate)', '3.500', 'modifier']]),
      V('Show me mailings.', '0.40', [['ActionShow', SHOW, '3.000', 'action'], ['Mailings', 'engage:GetMailings', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Mailings', 'TheBest'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Mailings', 'TheBest'] },
    goldKey: 'common:ShowDataMessage|engage:GetMailings|engage:RankByMetric(openRate)',
  },
  {
    id: 'I-click-rank',
    question: 'top 10 mailings by click-through rate',
    variants: [
      V('Show me mailings ranked by click rate.', '0.81', [['ActionShow', SHOW, '4.000', 'action'], ['Mailings', 'engage:GetMailings', '3.000', 'entity'], ['TheBest', 'engage:RankByMetric(clickRate)', '3.500', 'modifier']]),
      V('Show me mailings.', '0.39', [['ActionShow', SHOW, '3.000', 'action'], ['Mailings', 'engage:GetMailings', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Mailings', 'TheBest'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Mailings', 'TheBest'] },
    goldKey: 'common:ShowDataMessage|engage:GetMailings|engage:RankByMetric(clickRate)',
  },
  {
    id: 'AE-mailings-by-date',
    question: 'show me mailings sent in Q1',
    variants: [
      V('Show me mailings sent in Q1.', '0.72', [['ActionShow', SHOW, '4.000', 'action'], ['Mailings', 'engage:GetMailingsByDates', '3.000', 'entity']]),
      V('Show me mailings by status.', '0.35', [['ActionShow', SHOW, '2.000', 'action'], ['Status', 'engage:GetMailingsByStatus', '2.000', 'modifier']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Mailings'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Mailings'] },
    goldKey: 'common:ShowDataMessage|engage:GetMailingsByDates',
  },
  {
    id: 'AB-draft-mailings',
    question: 'show me all draft mailings',
    variants: [
      V('Show me mailings filtered to draft status.', '0.79', [['ActionShow', SHOW, '4.000', 'action'], ['Mailings', 'engage:GetMailings', '3.000', 'entity'], ['Status', 'engage:FilterByStatus(draft)', '3.000', 'modifier']]),
      V('Show me mailings.', '0.41', [['ActionShow', SHOW, '3.000', 'action'], ['Mailings', 'engage:GetMailings', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Mailings', 'Status'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Mailings', 'Status'] },
    goldKey: 'common:ShowDataMessage|engage:FilterByStatus(draft)|engage:GetMailings',
  },
  {
    id: 'AF-bounce-rank',
    question: 'which mailings have the worst bounce rate',
    variants: [
      V('Show me mailings ranked by bounce rate.', '0.80', [['ActionShow', SHOW, '4.000', 'action'], ['Mailings', 'engage:GetMailings', '3.000', 'entity'], ['TheBest', 'engage:RankByMetric(bounceRate)', '3.500', 'modifier']]),
      V('Show me mailings.', '0.38', [['ActionShow', SHOW, '3.000', 'action'], ['Mailings', 'engage:GetMailings', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Mailings', 'TheBest'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Mailings', 'TheBest'] },
    goldKey: 'common:ShowDataMessage|engage:GetMailings|engage:RankByMetric(bounceRate)',
  },
  {
    id: 'R-scheduled-mailings',
    question: 'what mailings are scheduled for next week',
    variants: [
      V('Show me scheduled mailings.', '0.70', [['ActionShow', SHOW, '4.000', 'action'], ['ScheduledMailings', 'engage:GetScheduledMailings', '3.000', 'entity']]),
      V('Show me mailings.', '0.36', [['ActionShow', SHOW, '2.000', 'action'], ['Mailings', 'engage:GetMailings', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'ScheduledMailings'], ambient: [], declaredCanonicalPath: ['ActionShow', 'ScheduledMailings'] },
    goldKey: 'common:ShowDataMessage|engage:GetScheduledMailings',
  },

  // ---- curated domain corpus — engagement metrics ----
  {
    id: 'Y-clicks-by-link',
    question: 'show me clicks by link for mailing 4821',
    variants: [
      V('Show me the clicks.', '0.67', [['ActionShow', SHOW, '4.000', 'action'], ['Clicks', 'engage:GetClicks', '3.000', 'entity']]),
      V('Show me the opens.', '0.34', [['ActionShow', SHOW, '2.000', 'action'], ['Opens', 'engage:GetOpens', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Clicks'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Clicks'] },
    goldKey: 'common:ShowDataMessage|engage:GetClicks',
  },
  {
    id: 'Z-delivery-rate',
    question: 'what was the delivery rate for my newsletter',
    variants: [
      V('Show me the delivery rate.', '0.69', [['ActionShow', SHOW, '4.000', 'action'], ['DeliveryRate', 'engage:GetDeliveryRate', '3.000', 'entity']]),
      V('Show me a message.', '0.19', [['ActionShow', SHOW, '1.500', 'action']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'DeliveryRate'], ambient: [], declaredCanonicalPath: ['ActionShow', 'DeliveryRate'] },
    goldKey: 'common:ShowDataMessage|engage:GetDeliveryRate',
  },
  {
    id: 'X-chart-opens',
    question: 'chart daily opens for my last campaign',
    variants: [
      V('Chart opens grouped by day.', '0.78', [['ActionChart', CHART, '4.000', 'action'], ['Opens', 'engage:GetOpens', '3.000', 'entity'], ['GroupByDate', 'engage:GroupByDate', '2.500', 'modifier']]),
      V('Chart the opens.', '0.44', [['ActionChart', CHART, '3.000', 'action'], ['Opens', 'engage:GetOpens', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionChart', 'Opens', 'GroupByDate'], ambient: [], declaredCanonicalPath: ['ActionChart', 'Opens', 'GroupByDate'] },
    goldKey: 'common:ShowChart|engage:GetOpens|engage:GroupByDate',
  },
  {
    id: 'S-abtest-results',
    question: 'show me the results of my last A/B test',
    variants: [
      V('Show me the A/B test results.', '0.73', [['ActionShow', SHOW, '4.000', 'action'], ['ABTestResults', 'engage:GetABTestResults', '3.000', 'entity']]),
      V('Show me mailings.', '0.32', [['ActionShow', SHOW, '2.000', 'action'], ['Mailings', 'engage:GetMailings', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'ABTestResults'], ambient: [], declaredCanonicalPath: ['ActionShow', 'ABTestResults'] },
    goldKey: 'common:ShowDataMessage|engage:GetABTestResults',
  },
  {
    id: 'T-journey-metrics',
    question: 'how is my onboarding journey performing',
    variants: [
      V('Show me the journey metrics.', '0.71', [['ActionShow', SHOW, '4.000', 'action'], ['JourneyMetrics', 'engage:GetJourneyMetrics', '3.000', 'entity']]),
      V('Show me programs.', '0.35', [['ActionShow', SHOW, '2.000', 'action'], ['Programs', 'engage:GetPrograms', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'JourneyMetrics'], ambient: [], declaredCanonicalPath: ['ActionShow', 'JourneyMetrics'] },
    goldKey: 'common:ShowDataMessage|engage:GetJourneyMetrics',
  },

  // ---- curated domain corpus — assets, content, structure ----
  {
    id: 'J-segments',
    question: 'show me my segments',
    variants: [
      V('Show me the segments.', '0.70', [['ActionShow', SHOW, '4.000', 'action'], ['Segments', 'engage:GetSegments', '3.000', 'entity']]),
      V('Show me queries.', '0.34', [['ActionShow', SHOW, '2.000', 'action'], ['Queries', 'engage:GetQueries', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Segments'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Segments'] },
    goldKey: 'common:ShowDataMessage|engage:GetSegments',
  },
  {
    id: 'K-templates',
    question: 'list all email templates',
    variants: [
      V('Show me the templates.', '0.69', [['ActionShow', SHOW, '4.000', 'action'], ['Templates', 'engage:GetTemplates', '3.000', 'entity']]),
      V('Show me a message.', '0.18', [['ActionShow', SHOW, '1.500', 'action']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Templates'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Templates'] },
    goldKey: 'common:ShowDataMessage|engage:GetTemplates',
  },
  {
    id: 'L-campaigns',
    question: 'show me active campaigns',
    variants: [
      V('Show me the campaigns.', '0.70', [['ActionShow', SHOW, '4.000', 'action'], ['Campaigns', 'engage:GetCampaigns', '3.000', 'entity']]),
      V('Show me programs.', '0.35', [['ActionShow', SHOW, '2.000', 'action'], ['Programs', 'engage:GetPrograms', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Campaigns'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Campaigns'] },
    goldKey: 'common:ShowDataMessage|engage:GetCampaigns',
  },
  {
    id: 'M-programs',
    question: 'which automated programs are running',
    variants: [
      V('Show me the programs.', '0.68', [['ActionShow', SHOW, '4.000', 'action'], ['Programs', 'engage:GetPrograms', '3.000', 'entity']]),
      V('Show me campaigns.', '0.34', [['ActionShow', SHOW, '2.000', 'action'], ['Campaigns', 'engage:GetCampaigns', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Programs'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Programs'] },
    goldKey: 'common:ShowDataMessage|engage:GetPrograms',
  },
  {
    id: 'N-landing-pages',
    question: 'show me my landing pages',
    variants: [
      V('Show me the landing pages.', '0.69', [['ActionShow', SHOW, '4.000', 'action'], ['LandingPages', 'engage:GetLandingPages', '3.000', 'entity']]),
      V('Show me forms.', '0.34', [['ActionShow', SHOW, '2.000', 'action'], ['Forms', 'engage:GetForms', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'LandingPages'], ambient: [], declaredCanonicalPath: ['ActionShow', 'LandingPages'] },
    goldKey: 'common:ShowDataMessage|engage:GetLandingPages',
  },
  {
    id: 'O-forms',
    question: 'list the forms on my site',
    variants: [
      V('Show me the forms.', '0.68', [['ActionShow', SHOW, '4.000', 'action'], ['Forms', 'engage:GetForms', '3.000', 'entity']]),
      V('Show me landing pages.', '0.34', [['ActionShow', SHOW, '2.000', 'action'], ['LandingPages', 'engage:GetLandingPages', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Forms'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Forms'] },
    goldKey: 'common:ShowDataMessage|engage:GetForms',
  },
  {
    id: 'P-databases',
    question: 'show me all my databases',
    variants: [
      V('Show me the databases.', '0.69', [['ActionShow', SHOW, '4.000', 'action'], ['Databases', 'engage:GetDatabases', '3.000', 'entity']]),
      V('Show me relational tables.', '0.35', [['ActionShow', SHOW, '2.000', 'action'], ['RelationalTables', 'engage:GetRelationalTables', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Databases'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Databases'] },
    goldKey: 'common:ShowDataMessage|engage:GetDatabases',
  },
  {
    id: 'Q-relational-tables',
    question: 'show me the relational tables',
    variants: [
      V('Show me the relational tables.', '0.68', [['ActionShow', SHOW, '4.000', 'action'], ['RelationalTables', 'engage:GetRelationalTables', '3.000', 'entity']]),
      V('Show me databases.', '0.35', [['ActionShow', SHOW, '2.000', 'action'], ['Databases', 'engage:GetDatabases', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'RelationalTables'], ambient: [], declaredCanonicalPath: ['ActionShow', 'RelationalTables'] },
    goldKey: 'common:ShowDataMessage|engage:GetRelationalTables',
  },
  {
    id: 'AA-saved-queries',
    question: 'show me my saved queries',
    variants: [
      V('Show me the saved queries.', '0.68', [['ActionShow', SHOW, '4.000', 'action'], ['Queries', 'engage:GetQueries', '3.000', 'entity']]),
      V('Show me segments.', '0.34', [['ActionShow', SHOW, '2.000', 'action'], ['Segments', 'engage:GetSegments', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Queries'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Queries'] },
    goldKey: 'common:ShowDataMessage|engage:GetQueries',
  },
  {
    id: 'AC-send-time-optimization',
    question: 'when is the best time to send to my APAC segment',
    variants: [
      V('Show me the send-time recommendation.', '0.66', [['ActionShow', SHOW, '4.000', 'action'], ['SendTimeOptimization', 'engage:GetSendTimeOptimization', '3.000', 'entity']]),
      V('Show me segments.', '0.30', [['ActionShow', SHOW, '2.000', 'action'], ['Segments', 'engage:GetSegments', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'SendTimeOptimization'], ambient: [], declaredCanonicalPath: ['ActionShow', 'SendTimeOptimization'] },
    goldKey: 'common:ShowDataMessage|engage:GetSendTimeOptimization',
  },

  // ---- curated domain corpus — filters, org scope, alternate actions ----
  {
    id: 'AD-tagged-contacts',
    question: 'show me contacts tagged VIP',
    variants: [
      V('Show me contacts filtered to the VIP tag.', '0.79', [['ActionShow', SHOW, '4.000', 'action'], ['Contacts', 'engage:GetContacts', '3.000', 'entity'], ['Tag', 'engage:FilterByTag(VIP)', '3.000', 'modifier']]),
      V('Show me the contacts.', '0.41', [['ActionShow', SHOW, '3.000', 'action'], ['Contacts', 'engage:GetContacts', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Contacts', 'Tag'], ambient: [], declaredCanonicalPath: ['ActionShow', 'Contacts', 'Tag'] },
    goldKey: 'common:ShowDataMessage|engage:FilterByTag(VIP)|engage:GetContacts',
  },
  {
    id: 'U-apac-rollup',
    question: 'how many mailings did APAC send last quarter',
    variants: [
      V('Show me the number of mailings sent by APAC last quarter.', '0.86', [['ActionShow', SHOW, '3.000', 'action'], ['OrgUnit', 'engage:ResolveOrgUnit(APAC)', '3.000', 'entity'], ['Mailings', 'engage:GetMailingsByDates(rollup:descendants)', '3.500', 'entity']]),
      V('Show me the number of mailings.', '0.38', [['ActionShow', SHOW, '2.000', 'action'], ['Mailings', 'engage:GetOwnMailings', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Mailings', 'OrgUnit'], ambient: [], declaredCanonicalPath: ['ActionShow', 'OrgUnit', 'Mailings'] },
    goldKey: 'common:ShowDataMessage|engage:GetMailingsByDates(rollup:descendants)|engage:ResolveOrgUnit(APAC)',
  },
  {
    id: 'V-own-lists',
    question: 'show me the contact lists that belong to me',
    // Dedup + ambient-prune teeth: two variants collapse to one node and the
    // ambient Organization hop is pruned from the canonical form.
    variants: [
      V('Show me your contact lists.', '0.62', [['ActionShow', SHOW, '3.833', 'action'], ['ContactLists', 'engage:GetOwnLists', '1.833', 'entity'], ['Organization', 'engage:GetOrganization', '1.000', 'entity']]),
      V('Show me your contact lists.', '0.60', [['ActionShow', SHOW, '3.667', 'action'], ['ContactLists', 'engage:GetOwnLists', '1.667', 'entity']]),
      V('Show me your organization.', '0.30', [['ActionShow', SHOW, '2.667', 'action'], ['Organization', 'engage:GetOrganization', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'ContactLists'], ambient: ['Organization'], declaredCanonicalPath: ['ActionShow', 'ContactLists', 'Organization'] },
    goldKey: 'common:ShowDataMessage|engage:GetOwnLists',
  },
  {
    id: 'W-export-contacts',
    question: 'export my contacts to csv',
    variants: [
      V('Export the contacts to CSV.', '0.74', [['ActionExport', EXPORT, '4.000', 'action'], ['Contacts', 'engage:GetContacts', '3.000', 'entity']]),
      V('Show me the contacts.', '0.40', [['ActionShow', SHOW, '3.000', 'action'], ['Contacts', 'engage:GetContacts', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionExport', 'Contacts'], ambient: [], declaredCanonicalPath: ['ActionExport', 'Contacts'] },
    goldKey: 'common:ExportCsv|engage:GetContacts',
  },
  {
    id: 'AG-count-contacts',
    question: 'how many contacts are in my database',
    variants: [
      V('Count the contacts.', '0.72', [['ActionCount', COUNT, '4.000', 'action'], ['Contacts', 'engage:GetContacts', '3.000', 'entity']]),
      V('Show me the contacts.', '0.40', [['ActionShow', SHOW, '3.000', 'action'], ['Contacts', 'engage:GetContacts', '2.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionCount', 'Contacts'], ambient: [], declaredCanonicalPath: ['ActionCount', 'Contacts'] },
    goldKey: 'common:ShowCount|engage:GetContacts',
  },

  // ---- adversarial fixtures: a NAIVE coverage-only ranker gets these WRONG ----
  // Each places a redundant ambient hop FIRST. The naive baseline (max coverage,
  // ties → first, UNPRUNED key) selects the bloated plan and misses the gold; the
  // governed scorer prunes the ambient hop, collapses the two plan-equivalent
  // variants, and lands the minimal gold. With seeds A and V these make
  // baselinePrecisionAt1 strictly < governed precision@1 — the counter-test has teeth.
  {
    id: 'AH-contacts-ambient-first',
    question: 'show me the contacts in my org',
    variants: [
      V('Show me the contacts in your organization.', '0.70', [['ActionShow', SHOW, '3.833', 'action'], ['Contacts', 'engage:GetContacts', '3.000', 'entity'], ['Organization', 'engage:GetOrganization', '1.000', 'entity']]),
      V('Show me the contacts.', '0.66', [['ActionShow', SHOW, '4.000', 'action'], ['Contacts', 'engage:GetContacts', '3.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Contacts'], ambient: ['Organization'], declaredCanonicalPath: ['ActionShow', 'Contacts', 'Organization'] },
    goldKey: 'common:ShowDataMessage|engage:GetContacts',
  },
  {
    id: 'AI-segments-ambient-first',
    question: 'show me the segments in my account',
    variants: [
      V('Show me the segments in your account.', '0.69', [['ActionShow', SHOW, '3.833', 'action'], ['Segments', 'engage:GetSegments', '3.000', 'entity'], ['Account', 'engage:GetAccount', '1.000', 'entity']]),
      V('Show me the segments.', '0.65', [['ActionShow', SHOW, '4.000', 'action'], ['Segments', 'engage:GetSegments', '3.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Segments'], ambient: ['Account'], declaredCanonicalPath: ['ActionShow', 'Segments', 'Account'] },
    goldKey: 'common:ShowDataMessage|engage:GetSegments',
  },
  {
    id: 'AJ-mailings-ambient-first',
    question: 'show me the mailings in my org',
    variants: [
      V('Show me the mailings in your organization.', '0.70', [['ActionShow', SHOW, '3.833', 'action'], ['Mailings', 'engage:GetMailings', '3.000', 'entity'], ['Organization', 'engage:GetOrganization', '1.000', 'entity']]),
      V('Show me the mailings.', '0.66', [['ActionShow', SHOW, '4.000', 'action'], ['Mailings', 'engage:GetMailings', '3.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Mailings'], ambient: ['Organization'], declaredCanonicalPath: ['ActionShow', 'Mailings', 'Organization'] },
    goldKey: 'common:ShowDataMessage|engage:GetMailings',
  },
  {
    id: 'AK-templates-ambient-first',
    question: 'show me the templates in my workspace',
    variants: [
      V('Show me the templates in your workspace.', '0.69', [['ActionShow', SHOW, '3.833', 'action'], ['Templates', 'engage:GetTemplates', '3.000', 'entity'], ['Workspace', 'engage:GetWorkspace', '1.000', 'entity']]),
      V('Show me the templates.', '0.65', [['ActionShow', SHOW, '4.000', 'action'], ['Templates', 'engage:GetTemplates', '3.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Templates'], ambient: ['Workspace'], declaredCanonicalPath: ['ActionShow', 'Templates', 'Workspace'] },
    goldKey: 'common:ShowDataMessage|engage:GetTemplates',
  },
  {
    id: 'AL-campaigns-ambient-first',
    question: 'show me the campaigns in my org',
    variants: [
      V('Show me the campaigns in your organization.', '0.70', [['ActionShow', SHOW, '3.833', 'action'], ['Campaigns', 'engage:GetCampaigns', '3.000', 'entity'], ['Organization', 'engage:GetOrganization', '1.000', 'entity']]),
      V('Show me the campaigns.', '0.66', [['ActionShow', SHOW, '4.000', 'action'], ['Campaigns', 'engage:GetCampaigns', '3.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Campaigns'], ambient: ['Organization'], declaredCanonicalPath: ['ActionShow', 'Campaigns', 'Organization'] },
    goldKey: 'common:ShowDataMessage|engage:GetCampaigns',
  },
  {
    id: 'AM-databases-ambient-first',
    question: 'show me the databases in my account',
    variants: [
      V('Show me the databases in your account.', '0.69', [['ActionShow', SHOW, '3.833', 'action'], ['Databases', 'engage:GetDatabases', '3.000', 'entity'], ['Account', 'engage:GetAccount', '1.000', 'entity']]),
      V('Show me the databases.', '0.65', [['ActionShow', SHOW, '4.000', 'action'], ['Databases', 'engage:GetDatabases', '3.000', 'entity']]),
    ],
    ontology: { requestedCore: ['ActionShow', 'Databases'], ambient: ['Account'], declaredCanonicalPath: ['ActionShow', 'Databases', 'Account'] },
    goldKey: 'common:ShowDataMessage|engage:GetDatabases',
  },
  ]),
];
