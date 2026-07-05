// Fixture-backed information-extraction documents for the
// /capability/nlp-information-extraction surface. Documents are stored
// pre-segmented (plain text + typed entity spans) so highlighting is
// deterministic and offset-free. No live NLP model runs — a real extractor
// (SynapseIQ / entity-resolution lane) swaps in behind the same shape.

export type NerType = 'person' | 'org' | 'place' | 'date' | 'money' | 'topic';

export interface Segment { t: string; ent?: NerType; conf?: number }
export interface Relation { subj: string; pred: string; obj: string; conf: number }
export interface Claim { text: string; kind: 'assert' | 'hedge' | 'deny'; verifiable: boolean }
export interface Sentiment { label: 'positive' | 'neutral' | 'negative'; score: number }

export interface Doc {
  id: string;
  title: string;
  source: string;
  date: string;
  segments: Segment[];
  relations: Relation[];
  claims: Claim[];
  sentiment: Sentiment;
}

export const docs: Doc[] = [
  {
    id: 'doc-rule',
    title: 'Model-Provenance Disclosure Rule — comment opens',
    source: 'Regulatory Watch',
    date: '2026-07-03T12:20:00-04:00',
    segments: [
      { t: 'The ', },
      { t: 'Open Data Governance Board', ent: 'org', conf: 0.97 },
      { t: ' opened public comment on ', },
      { t: 'July 3, 2026', ent: 'date', conf: 0.99 },
      { t: ' for a rule requiring model-provenance disclosure. Chair ', },
      { t: 'Dana Whitfield', ent: 'person', conf: 0.94 },
      { t: ' said the ', },
      { t: 'European Commission', ent: 'org', conf: 0.92 },
      { t: ' is expected to align a parallel framework. Compliance costs are estimated at ', },
      { t: '$4.2M', ent: 'money', conf: 0.88 },
      { t: ' across covered providers, concentrated in ', },
      { t: 'Brussels', ent: 'place', conf: 0.9 },
      { t: ' and ', },
      { t: 'Washington', ent: 'place', conf: 0.91 },
      { t: '. The rule centers on ', },
      { t: 'model provenance', ent: 'topic', conf: 0.86 },
      { t: '.', },
    ],
    relations: [
      { subj: 'Open Data Governance Board', pred: 'opened-comment-on', obj: 'Model-Provenance Disclosure Rule', conf: 0.95 },
      { subj: 'Dana Whitfield', pred: 'chairs', obj: 'Open Data Governance Board', conf: 0.9 },
      { subj: 'European Commission', pred: 'aligns', obj: 'parallel framework', conf: 0.78 },
    ],
    claims: [
      { text: 'Compliance costs will total $4.2M across covered providers.', kind: 'assert', verifiable: true },
      { text: 'The European Commission is expected to align a parallel framework.', kind: 'hedge', verifiable: false },
    ],
    sentiment: { label: 'neutral', score: 0.08 },
  },
  {
    id: 'doc-market',
    title: 'Semis lead the tape into the close',
    source: 'Global News Intake',
    date: '2026-07-03T20:05:00-04:00',
    segments: [
      { t: 'Chipmaker ', },
      { t: 'Nvidia', ent: 'org', conf: 0.98 },
      { t: ' led a broad advance as the ', },
      { t: 'S&P 500', ent: 'org', conf: 0.85 },
      { t: ' closed higher on ', },
      { t: 'July 3', ent: 'date', conf: 0.96 },
      { t: '. Analyst ', },
      { t: 'Priya Raman', ent: 'person', conf: 0.93 },
      { t: ' argued the rally is narrow and driven mainly by ', },
      { t: 'semiconductors', ent: 'topic', conf: 0.89 },
      { t: ', warning breadth remains thin.', },
    ],
    relations: [
      { subj: 'Nvidia', pred: 'led', obj: 'market advance', conf: 0.9 },
      { subj: 'Priya Raman', pred: 'argues', obj: 'rally is narrow', conf: 0.84 },
    ],
    claims: [
      { text: 'The rally is narrow and driven mainly by semiconductors.', kind: 'assert', verifiable: true },
      { text: 'Market breadth remains thin.', kind: 'assert', verifiable: true },
    ],
    sentiment: { label: 'positive', score: 0.42 },
  },
  {
    id: 'doc-capture',
    title: 'BearBrowser capture — local evidence note',
    source: 'BearBrowser Capture',
    date: '2026-07-03T21:11:00-04:00',
    segments: [
      { t: 'A page captured by ', },
      { t: 'BearBrowser', ent: 'org', conf: 0.99 },
      { t: ' references a ', },
      { t: 'humanitarian corridor', ent: 'topic', conf: 0.82 },
      { t: ' dispute before an international tribunal, filed ', },
      { t: 'last week', ent: 'date', conf: 0.6 },
      { t: '. The capture is held as local-only evidence and was not published.', },
    ],
    relations: [
      { subj: 'BearBrowser', pred: 'captured', obj: 'page (local-only)', conf: 0.97 },
      { subj: 'capture', pred: 'references', obj: 'humanitarian corridor dispute', conf: 0.7 },
    ],
    claims: [
      { text: 'The capture references a humanitarian-corridor dispute before an international tribunal.', kind: 'hedge', verifiable: false },
      { text: 'The capture was not published.', kind: 'assert', verifiable: true },
    ],
    sentiment: { label: 'neutral', score: -0.05 },
  },
];

export const asOf = '2026-07-03T14:00:00-04:00';
