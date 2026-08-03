// Knowledge Studio — knowledge-engineering / information-extraction workspace.
// Screen parity with IBM Watson Knowledge Studio (Assets / Rule-based Model /
// Machine Learning Model), plus the governance layer WKS does not ship:
// per-annotation provenance, inter-annotator agreement, a fail-closed deploy
// gate, and an estimate-vs-observation split on every extracted value.
//
// Fixture-backed. No annotator runs; a real extractor (SynapseIQ / slate-nlp)
// swaps in behind the same shape.

export type LifecycleStage =
  | 'ideation' | 'ingest' | 'discover' | 'process' | 'develop'
  | 'train' | 'evaluate' | 'deploy' | 'catalog';

export type StageState = 'done' | 'active' | 'blocked' | 'pending';

export type LifecycleStep = {
  id: LifecycleStage;
  label: string;
  state: StageState;
  note: string;
  /** Which estate plane owns this stage. */
  owner: string;
};

/** The ingestion + model lifecycle, with a retraining edge from evaluate back to develop. */
export const lifecycle: LifecycleStep[] = [
  { id: 'ideation', label: 'Ideation', state: 'done', note: 'Extraction goal and type system agreed with the domain owner.', owner: 'ontogenesis' },
  { id: 'ingest', label: 'Ingest', state: 'done', note: 'Documents admitted through the ingestion contract with capture provenance.', owner: 'evidence-intake-kernel' },
  { id: 'discover', label: 'Discover', state: 'done', note: 'Corpus profiled — languages, lengths, duplicate and near-duplicate clusters.', owner: 'slate/nlp' },
  { id: 'process', label: 'Process', state: 'active', note: 'Tokenization, sentence split, OCR for scanned pages.', owner: 'slate/ocr' },
  { id: 'develop', label: 'Develop', state: 'active', note: 'Dictionaries, regex and rules authored against the type system.', owner: 'Knowledge Studio' },
  { id: 'train', label: 'Train', state: 'pending', note: 'Statistical model trained on adjudicated ground truth.', owner: 'tritfabric slate/trainers' },
  { id: 'evaluate', label: 'Evaluate', state: 'pending', note: 'Held-out P/R/F1 per type, plus inter-annotator agreement on the gold set.', owner: 'counter-test gate' },
  { id: 'deploy', label: 'Deploy', state: 'blocked', note: 'BLOCKED by the promotion gate — F1 below threshold on two types and no signed version receipt.', owner: 'atlas/autopilot promotion_controller' },
  { id: 'catalog', label: 'Catalog', state: 'pending', note: 'Version published to the model catalog with its evidence chain.', owner: 'model-governance-ledger' },
];

export type NavSection = {
  group: string;
  items: { id: string; label: string; badge?: string }[];
};

/** Left-rail information architecture — WKS parity. */
export const nav: NavSection[] = [
  {
    group: 'Assets',
    items: [
      { id: 'documents', label: 'Documents', badge: '3' },
      { id: 'entity-types', label: 'Entity Types', badge: '8' },
      { id: 'relation-types', label: 'Relation Types', badge: '5' },
      { id: 'dictionaries', label: 'Dictionaries', badge: '4' },
    ],
  },
  {
    group: 'Rule-based Model',
    items: [
      { id: 'rules', label: 'Rules' },
      { id: 'rule-versions', label: 'Versions', badge: '3' },
    ],
  },
  {
    group: 'Machine Learning Model',
    items: [
      { id: 'pre-annotation', label: 'Pre-annotation' },
      { id: 'annotation-tasks', label: 'Annotation Tasks', badge: '2' },
      { id: 'performance', label: 'Performance' },
      { id: 'ml-versions', label: 'Versions', badge: '4' },
    ],
  },
  { group: '', items: [{ id: 'settings', label: 'Settings' }, { id: 'help', label: 'Help' }] },
];

// ---------- Assets ----------

export type DocumentSet = {
  name: string;
  documents: number;
  lastModified: string;
  /** Capture provenance — the thing WKS has no column for. */
  captureReceipt: string;
  status: 'admitted' | 'quarantined';
};

export const documentSets: DocumentSet[] = [
  { name: 'All', documents: 1284, lastModified: '2026-08-02', captureReceipt: 'sha256:9f2c…a41b', status: 'admitted' },
  { name: 'Regulatory filings 2026H1', documents: 612, lastModified: '2026-07-30', captureReceipt: 'sha256:41de…77c0', status: 'admitted' },
  { name: 'Earnings transcripts Q2', documents: 340, lastModified: '2026-07-28', captureReceipt: 'sha256:b108…2f9a', status: 'admitted' },
  { name: 'Vendor PDFs (unverified origin)', documents: 332, lastModified: '2026-07-19', captureReceipt: '— none —', status: 'quarantined' },
];

export type AnnotationSet = {
  name: string;
  documents: number;
  annotator: string;
  status: 'in-progress' | 'submitted' | 'adjudicated';
  agreement?: number;
};

export const annotationSets: AnnotationSet[] = [
  { name: 'Round 1 — analyst A', documents: 120, annotator: 'analyst.a', status: 'adjudicated', agreement: 0.87 },
  { name: 'Round 1 — analyst B', documents: 120, annotator: 'analyst.b', status: 'adjudicated', agreement: 0.87 },
  { name: 'Round 2 — analyst A', documents: 200, annotator: 'analyst.a', status: 'submitted', agreement: 0.79 },
  { name: 'Round 2 — model pre-annotation', documents: 200, annotator: 'gemma-2-9b-it', status: 'in-progress' },
];

export type EntityType = {
  name: string;
  color: string;
  mentions: number;
  f1: number | null;
  /** Whether values of this type are observed or modelled — WKS cannot express this. */
  valueKind: 'observed' | 'derived';
  roles: string;
  /** Authored into the KE loop (e.g. from the Reasoning Chain Inspector), not seeded. */
  authored?: boolean;
  /** Honest receipt from the promotion gate — unsigned until a real signer seals it. */
  receipt?: string;
};

export const entityTypes: EntityType[] = [
  { name: 'ORGANIZATION', color: 'var(--info)', mentions: 4821, f1: 0.94, valueKind: 'observed', roles: 'issuer, counterparty, regulator' },
  { name: 'PERSON', color: 'var(--teal)', mentions: 2610, f1: 0.91, valueKind: 'observed', roles: 'officer, signatory' },
  { name: 'INSTRUMENT', color: 'var(--accent)', mentions: 1877, f1: 0.88, valueKind: 'observed', roles: 'security, facility' },
  { name: 'MONETARY_VALUE', color: 'var(--up)', mentions: 1544, f1: 0.96, valueKind: 'observed', roles: 'amount, threshold' },
  { name: 'DATE', color: 'var(--violet)', mentions: 3102, f1: 0.97, valueKind: 'observed', roles: 'effective, filing' },
  { name: 'OBLIGATION', color: 'var(--amber)', mentions: 702, f1: 0.71, valueKind: 'observed', roles: 'covenant, undertaking' },
  { name: 'RISK_FACTOR', color: 'var(--down)', mentions: 588, f1: 0.63, valueKind: 'derived', roles: 'disclosed risk' },
  { name: 'SENTIMENT_TONE', color: 'var(--neutral)', mentions: 410, f1: null, valueKind: 'derived', roles: 'management tone' },
];

export type RelationType = {
  name: string;
  subject: string;
  object: string;
  instances: number;
  f1: number | null;
  /** Authored into the KE loop (e.g. from the Reasoning Chain Inspector), not seeded. */
  authored?: boolean;
  /** Honest receipt from the promotion gate — unsigned until a real signer seals it. */
  receipt?: string;
};

export const relationTypes: RelationType[] = [
  { name: 'ISSUED_BY', subject: 'INSTRUMENT', object: 'ORGANIZATION', instances: 1204, f1: 0.9 },
  { name: 'OFFICER_OF', subject: 'PERSON', object: 'ORGANIZATION', instances: 866, f1: 0.88 },
  { name: 'OBLIGATES', subject: 'ORGANIZATION', object: 'OBLIGATION', instances: 512, f1: 0.68 },
  { name: 'EFFECTIVE_ON', subject: 'OBLIGATION', object: 'DATE', instances: 498, f1: 0.93 },
  { name: 'EXPOSED_TO', subject: 'ORGANIZATION', object: 'RISK_FACTOR', instances: 331, f1: null },
];

export type Dictionary = {
  name: string;
  terms: number;
  mappedType: string;
  source: string;
  /** Licence provenance on the term list — a lawful-learning requirement. */
  licence: string;
  /** Authored into the KE loop (e.g. from the Reasoning Chain Inspector), not seeded. */
  authored?: boolean;
  /** Honest receipt from the promotion gate — unsigned until a real signer seals it. */
  receipt?: string;
};

export const dictionaries: Dictionary[] = [
  { name: 'Regulators (global)', terms: 412, mappedType: 'ORGANIZATION', source: 'curated + KBpedia', licence: 'CC-BY-4.0' },
  { name: 'Instrument classes', terms: 1880, mappedType: 'INSTRUMENT', source: 'internal taxonomy', licence: 'owned' },
  { name: 'Covenant verbs', terms: 96, mappedType: 'OBLIGATION', source: 'hand-authored', licence: 'owned' },
  { name: 'Legacy vendor list', terms: 5400, mappedType: 'ORGANIZATION', source: 'vendor CSV', licence: 'UNKNOWN — blocked from training' },
];

// ---------- Rule-based model ----------

export type Regex = { name: string; pattern: string; capturesAs: string; matches: number };

export const regexes: Regex[] = [
  { name: 'ISIN', pattern: '[A-Z]{2}[A-Z0-9]{9}\\d', capturesAs: 'INSTRUMENT', matches: 742 },
  { name: 'Money (multi-currency)', pattern: '(?:[$€£]|USD|EUR|GBP)\\s?[\\d,.]+(?:\\s?(?:m|bn|million|billion))?', capturesAs: 'MONETARY_VALUE', matches: 1489 },
  { name: 'Filing date', pattern: '\\b\\d{1,2}\\s\\w+\\s\\d{4}\\b', capturesAs: 'DATE', matches: 2210 },
];

export type Rule = { name: string; pattern: string; producesType: string; precision: number; enabled: boolean };

export const rules: Rule[] = [
  { name: 'Officer appointment', pattern: '(PERSON) was appointed (ROLE) of (ORGANIZATION)', producesType: 'OFFICER_OF', precision: 0.93, enabled: true },
  { name: 'Covenant undertaking', pattern: '(ORGANIZATION) shall (COVENANT_VERB)', producesType: 'OBLIGATES', precision: 0.74, enabled: true },
  { name: 'Issuance', pattern: '(INSTRUMENT) issued by (ORGANIZATION)', producesType: 'ISSUED_BY', precision: 0.95, enabled: true },
  { name: 'Risk hedge (experimental)', pattern: '(ORGANIZATION) may be exposed to (RISK_FACTOR)', producesType: 'EXPOSED_TO', precision: 0.51, enabled: false },
];

// ---------- ML model ----------

export type AnnotationTask = {
  name: string;
  assignee: string;
  documents: number;
  completed: number;
  agreement: number | null;
  status: 'open' | 'in-review' | 'adjudicated';
};

export const annotationTasks: AnnotationTask[] = [
  { name: 'Ground truth — filings', assignee: 'analyst.a, analyst.b', documents: 120, completed: 120, agreement: 0.87, status: 'adjudicated' },
  { name: 'Ground truth — transcripts', assignee: 'analyst.a, analyst.c', documents: 200, completed: 143, agreement: 0.79, status: 'in-review' },
];

export type PerfRow = { type: string; precision: number; recall: number; f1: number; support: number; gate: 'pass' | 'fail' };

export const performance: PerfRow[] = [
  { type: 'ORGANIZATION', precision: 0.95, recall: 0.93, f1: 0.94, support: 964, gate: 'pass' },
  { type: 'PERSON', precision: 0.92, recall: 0.9, f1: 0.91, support: 522, gate: 'pass' },
  { type: 'MONETARY_VALUE', precision: 0.97, recall: 0.95, f1: 0.96, support: 309, gate: 'pass' },
  { type: 'DATE', precision: 0.98, recall: 0.96, f1: 0.97, support: 620, gate: 'pass' },
  { type: 'INSTRUMENT', precision: 0.9, recall: 0.86, f1: 0.88, support: 375, gate: 'pass' },
  { type: 'OBLIGATION', precision: 0.78, recall: 0.65, f1: 0.71, support: 140, gate: 'fail' },
  { type: 'RISK_FACTOR', precision: 0.69, recall: 0.58, f1: 0.63, support: 118, gate: 'fail' },
];

export const perfGateThreshold = 0.8;

export type Version = {
  version: string;
  kind: 'rule-based' | 'machine-learning';
  created: string;
  f1: number | null;
  status: 'draft' | 'evaluated' | 'promoted' | 'blocked';
  /** Signed receipt for the version — the artifact no competitor ships. */
  receipt: string;
};

export const versions: Version[] = [
  { version: 'ml-v4', kind: 'machine-learning', created: '2026-08-02', f1: 0.86, status: 'blocked', receipt: 'unsigned — promotion gate held' },
  { version: 'ml-v3', kind: 'machine-learning', created: '2026-07-24', f1: 0.84, status: 'promoted', receipt: 'sha256:7c11…9ab2 (signed)' },
  { version: 'ml-v2', kind: 'machine-learning', created: '2026-07-10', f1: 0.79, status: 'evaluated', receipt: 'sha256:2d90…41ff (signed)' },
  { version: 'ml-v1', kind: 'machine-learning', created: '2026-06-28', f1: 0.71, status: 'evaluated', receipt: 'sha256:0aa7…b3c1 (signed)' },
  { version: 'rules-v3', kind: 'rule-based', created: '2026-08-01', f1: null, status: 'draft', receipt: 'unsigned — draft' },
  { version: 'rules-v2', kind: 'rule-based', created: '2026-07-21', f1: null, status: 'promoted', receipt: 'sha256:55b2…7e04 (signed)' },
  { version: 'rules-v1', kind: 'rule-based', created: '2026-07-05', f1: null, status: 'evaluated', receipt: 'sha256:c3f8…1120 (signed)' },
];

/** What this workspace does that Watson Knowledge Studio does not. */
export const beyondParity: { title: string; detail: string }[] = [
  {
    title: 'Capture provenance on every document set',
    detail: 'Each set carries a capture receipt; a set with no receipt is QUARANTINED and cannot enter training. WKS has no column for where a document came from.',
  },
  {
    title: 'Licence provenance on dictionaries',
    detail: 'Term lists carry a licence. The unknown-licence vendor list is blocked from training rather than silently used — the Lawful Learning invariant.',
  },
  {
    title: 'Observed vs derived, per type',
    detail: 'Entity types declare whether their values are observed in the text or modelled. A derived value can never be presented downstream as a filed fact.',
  },
  {
    title: 'Fail-closed promotion gate',
    detail: 'Deploy is BLOCKED, not warned: two types sit under the F1 threshold and the version has no signed receipt. The gate refuses rather than advising.',
  },
  {
    title: 'Signed version receipts',
    detail: 'Every promoted version carries a hash-sealed receipt binding model, training set and evaluation. This is the artifact the whole intelligence market cites but nobody ships.',
  },
  {
    title: 'Inter-annotator agreement surfaced, not buried',
    detail: 'Agreement is shown on the annotation set and the task, so a low-agreement round is visible before it becomes ground truth.',
  },
];
