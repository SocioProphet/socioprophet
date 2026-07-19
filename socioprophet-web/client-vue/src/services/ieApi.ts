// Real NLP / Information-Extraction backend — ie-engine (prophet-platform/apps/ie-engine).
// Entities = live spaCy NER; relations = dependency parse; claims = assert/hedge; extraction can be
// pushed into the canonical HellGraph. Same-origin `/svc/ie` proxy → :8086 in dev.
import { resolveBase } from '../config/cockpitRuntime';
const BASE = resolveBase('ie', 'VITE_IE_BASE', '/svc/ie');

export interface Entity { text: string; type: string; spacy_label?: string; mentions?: number; count?: number }
export interface Relation { from: string; relation: string; to: string }
export interface Claim { type: 'ASSERT' | 'HEDGE'; text: string; verifiable: boolean }
export interface Extraction {
  entities: Entity[]; relations: Relation[]; claims: Claim[]; topics: Entity[];
  sentiment: { label: string; score: number }; counts: Record<string, number>;
  provenance: { model: string; extractor: string; real: boolean };
}
export interface GraphWrite extends Extraction { ok: boolean; nodes_written: number; edges_written: number; graph: string }

async function post<T>(p: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${p}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${p} ${r.status}`); return r.json();
}
export const extract = (text: string) => post<Extraction>('/extract', { text });
export const toGraph = (text: string) => post<GraphWrite>('/to-graph', { text });
export const vectorize = (texts: string[]) => post<{ similarity: number[][]; method: string }>('/vectorize', { texts });

export interface Term { term: string; type: string; count: number; definition: string }
export const glossary = (text: string) => post<{ terms: Term[]; count: number }>('/glossary', { text });

// Sibling suite backends, same-origin proxies (see vite.config.ts).
async function postAt<T>(base: string, p: string, body: unknown): Promise<T> {
  const r = await fetch(`${base}${p}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${p} ${r.status}`); return r.json();
}
// owl-reasoner — type-system / ontology entailment
export const reason = (turtle: string, inference = 'rdfs') =>
  postAt<{ input_triples: number; entailed_triples: number; entailments: any[] }>('/svc/reason', '/reason', { turtle, inference });
// entity-resolution — resolve mentions → golden records
export const resolve = (records: { id: string; name: string }[]) =>
  postAt<{ golden_records: any[]; decision_ledger: any[]; entities: any[] }>('/svc/er', '/resolve', { records });

// holmes — verify claims against real HellGraph evidence (deduction engine)
export interface Verdict { claim: string; verdict: 'supported' | 'weakly-supported' | 'unverified' | 'unreachable'; matched_terms?: string[]; evidence_count: number }
export const verifyClaims = (claims: string[]) =>
  postAt<{ results: Verdict[] }>('/svc/holmes', '/verify', { claims });

// synapseiq — language intelligence: KKO (Peircean) type classification of entity types
export interface Kko { type: string; kko: 'Particulars' | 'Generals' | 'Possibilities' }
export const kkoClassify = (types: string[]) =>
  postAt<{ results: Kko[] }>('/svc/synapse', '/kko-class', { types });
