// studioApi — client for the Lattice Studio product surface (notebooks + data catalog + model catalog + tuning +
// reproducible experiments), the integrated Watson-Studio-class plane. Calls the studio BFF, which fronts the
// deployed Tier-9 fabric (lattice-studio notebooks, prophet-core-catalog, model-zoo-api, tritfabric/Ray,
// governance-ledger). VITE_STUDIO_API unset → STUB mode so the surface renders standalone until the BFF is wired.
// Everything is PROJECT-SCOPED: a projectId (Noetica proj- collection) threads through so notebooks/data/models/
// experiments live in the same knowledge scope an agent team already retrieves.

const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_STUDIO_API;

export type StudioSection =
  | "notebooks" | "data" | "models" | "tuning" | "experiments"                 // Workbench
  | "extraction" | "ontology" | "graph" | "query" | "retrieval" | "generation" // Knowledge engineering
  | "operations" | "compute"                                                    // Operations cockpit (WS#45–48/#31) + Universal Compute Plane
  | "governance"                                                                // Governance: ontology · actions · GAIA
  | "commons";                                                                  // Commons (WS#36–39)

export interface Notebook {
  id: string; name: string; runtime: string; kernel: string;
  status: "idle" | "running" | "stopped"; updatedAt: string;
  cells: number; collaborators: string[]; lastCell?: string;
}
export interface DataAsset {
  id: string; name: string; kind: "table" | "dataset" | "stream"; catalog: string; governed: boolean;
  rows?: number; columns?: number; schema?: { name: string; type: string }[]; lineage?: string[];
}
export interface ModelCard {
  id: string; name: string; task: string; stage: "candidate" | "staged" | "promoted";
  metrics?: { name: string; value: number; unit?: string }[]; base?: string; lineage?: string[]; servable?: boolean;
}
export interface TuningRun {
  id: string; name: string; method: "lora" | "sae" | "circuit-probe" | "full"; backend: string;
  status: "queued" | "running" | "done" | "failed"; progress?: number; metric?: { name: string; value: number };
  target?: string;
}
export interface Experiment {
  id: string; title: string; reproducible: boolean; provenance: string; createdAt: string;
  steps?: { label: string; hash: string }[]; rerunnable?: boolean;
}

// ── Knowledge engineering — extraction → ontology → graph → retrieval → generation ──
export interface ExtractionSource {
  id: string; name: string; engine: "holmes" | "sherlock" | "doc-ingest"; kind: string;
  status: "idle" | "running" | "done"; extracted?: number; target: string; // → graph
}
export interface OntologyItem {
  id: string; name: string; kind: "class" | "relation" | "axiom" | "alignment"; engine: "ontogenesis";
  count?: number; aligned?: boolean;
}
export interface GraphStat { id: string; label: string; value: number | string; hint?: string }
export interface RetrievalIndex {
  id: string; name: string; method: "fiber" | "graph-rag" | "topic" | "vector" | "lexical";
  engine: "fibered-retrieval" | "slash-topics" | "hellgraph" | "noetica"; scope: string; ready: boolean;
}
export interface GenerationRun {
  id: string; name: string; engine: "new-hope"; kind: "synthesis" | "generation-tuning" | "distillation";
  status: "queued" | "running" | "done" | "failed"; grounded?: boolean; output?: string;
}

// The MOAT header — the proof-carrying identity of the whole workspace, computed live on every load.
export interface Moat {
  epistemic_distribution: Record<string, number>; fact_count: number; provenance_coverage: number;
  verified_compute: boolean; receipts_recent: number; governed_writes: boolean; read_auth: boolean;
}
export interface StudioBundle {
  notebooks: Notebook[]; data: DataAsset[]; models: ModelCard[]; tuning: TuningRun[]; experiments: Experiment[];
  extraction: ExtractionSource[]; ontology: OntologyItem[]; graph: GraphStat[]; retrieval: RetrievalIndex[]; generation: GenerationRun[];
  moat?: Moat; stub?: boolean;
}

// graph/query are custom-rendered sections with no list payload in the bundle → defensive index.
export const SECTION_COUNT = (b: StudioBundle | null, s: StudioSection): number => (b ? ((b as unknown as Record<string, unknown[]>)[s]?.length ?? 0) : 0);

const now = () => new Date().toISOString();
const STUB: StudioBundle = {
  moat: { epistemic_distribution: { verified: 1, observed: 2, derived: 1, hypothesis: 1 }, fact_count: 5,
          provenance_coverage: 0.8, verified_compute: true, receipts_recent: 3, governed_writes: true, read_auth: false },
  notebooks: [
    { id: "nb-1", name: "Exploratory analysis", runtime: "prophet-python-ml", kernel: "python3", status: "idle", updatedAt: now(), cells: 24, collaborators: ["you", "analyst-agent"], lastCell: "df.groupby('cohort').agg(...)" },
    { id: "nb-2", name: "LoRA fine-tune", runtime: "prophet-ray-ml", kernel: "ray", status: "running", updatedAt: now(), cells: 11, collaborators: ["you"], lastCell: "trainer.fit(ray_dataset)" },
    { id: "nb-3", name: "SAE feature atlas", runtime: "prophet-ray-ml", kernel: "ray", status: "idle", updatedAt: now(), cells: 38, collaborators: ["you", "researcher-agent"], lastCell: "atlas.plot_features(layer=12)" },
  ],
  data: [
    { id: "da-1", name: "customer_events", kind: "table", catalog: "prophet-core-catalog", governed: true, rows: 1_240_000, columns: 18, schema: [{ name: "event_id", type: "uuid" }, { name: "ts", type: "timestamp" }, { name: "cohort", type: "string" }], lineage: ["ingest→dbt→catalog"] },
    { id: "da-2", name: "corpus_v3", kind: "dataset", catalog: "prophet-core-catalog", governed: true, rows: 890_000, lineage: ["scrape→dedupe→redact→catalog"] },
    { id: "da-3", name: "telemetry_stream", kind: "stream", catalog: "prophet-core-catalog", governed: false },
  ],
  models: [
    { id: "m-1", name: "prophet-7b-lora", task: "chat", stage: "staged", base: "prophet-7b", servable: true, metrics: [{ name: "MMLU", value: 64.2 }, { name: "win-rate", value: 0.58 }], lineage: ["prophet-7b→lora(nb-2)→zoo"] },
    { id: "m-2", name: "sae-residual-l12", task: "interpretability", stage: "candidate", base: "prophet-7b", metrics: [{ name: "L0", value: 41 }, { name: "recon", value: 0.92 }], lineage: ["prophet-7b→sae(t-1)"] },
    { id: "m-3", name: "prophet-7b", task: "chat", stage: "promoted", servable: true, metrics: [{ name: "MMLU", value: 61.0 }] },
  ],
  tuning: [
    { id: "t-1", name: "SAE on residual stream L12", method: "sae", backend: "tritfabric/ray", status: "running", progress: 0.62, metric: { name: "recon", value: 0.92 }, target: "prophet-7b" },
    { id: "t-2", name: "Circuit probe — induction heads", method: "circuit-probe", backend: "tritfabric/ray", status: "queued", target: "prophet-7b" },
    { id: "t-3", name: "LoRA — support tone", method: "lora", backend: "tritfabric/ray", status: "done", progress: 1, metric: { name: "loss", value: 0.31 }, target: "prophet-7b" },
  ],
  experiments: [
    { id: "e-1", title: "LoRA vs full fine-tune", reproducible: true, provenance: "in-toto + conda-lock", createdAt: now(), rerunnable: true, steps: [{ label: "runtime", hash: "sha256:9a1…" }, { label: "data", hash: "sha256:c4f…" }, { label: "code", hash: "sha256:2e8…" }] },
    { id: "e-2", title: "SAE sparsity sweep", reproducible: true, provenance: "in-toto + flake.lock", createdAt: now(), rerunnable: true, steps: [{ label: "runtime", hash: "sha256:77b…" }, { label: "params", hash: "sha256:1d3…" }] },
  ],
  extraction: [
    { id: "x-1", name: "Entity & relation extraction — corpus_v3", engine: "holmes", kind: "entities+relations", status: "running", extracted: 48210, target: "project graph" },
    { id: "x-2", name: "Federated retrieval → facts", engine: "sherlock", kind: "federated search", status: "idle", target: "project graph" },
    { id: "x-3", name: "Doc ingest — governed", engine: "doc-ingest", kind: "chunks+claims", status: "done", extracted: 12904, target: "proj- collection" },
  ],
  ontology: [
    { id: "o-1", name: "Domain ontology", kind: "class", engine: "ontogenesis", count: 342, aligned: true },
    { id: "o-2", name: "Relations", kind: "relation", engine: "ontogenesis", count: 118, aligned: true },
    { id: "o-3", name: "KKO ⇄ project alignment", kind: "alignment", engine: "ontogenesis", aligned: true },
  ],
  graph: [
    { id: "g-1", label: "Entities", value: 61240, hint: "canonical entities in the project graph" },
    { id: "g-2", label: "Relations", value: 148900 },
    { id: "g-3", label: "Documents grounded", value: 12904 },
    { id: "g-4", label: "Engine", value: "HellGraph", hint: "gremlin / sparql over :8090" },
  ],
  retrieval: [
    { id: "r-1", name: "Fibered retrieval (PageIndex ⊕ HellGraph)", method: "fiber", engine: "fibered-retrieval", scope: "project", ready: true },
    { id: "r-2", name: "Graph-RAG", method: "graph-rag", engine: "hellgraph", scope: "project", ready: true },
    { id: "r-3", name: "Topic index", method: "topic", engine: "slash-topics", scope: "project", ready: true },
    { id: "r-4", name: "Semantic + lexical", method: "vector", engine: "noetica", scope: "chat + project", ready: true },
  ],
  generation: [
    { id: "gn-1", name: "Synthesize training set from graph", engine: "new-hope", kind: "synthesis", status: "running", grounded: true, output: "→ annotation set" },
    { id: "gn-2", name: "Generation-tuning — grounded rewrite", engine: "new-hope", kind: "generation-tuning", status: "queued", grounded: true },
  ],
  stub: true,
};

// ── KE-2: the project sub-graph with PROVENANCE per node (the differentiator) ──
export interface GraphNode { id: string; name: string; epistemic_mode: string; source?: string; extractor?: string; labels: string[] }
export interface GraphEdge { id: string; source: string; target: string; label: string; weight?: number }
export interface GraphView {
  project: string; projectCollection: string;
  nodes: GraphNode[]; edges?: GraphEdge[]; count: number; edge_count?: number;
  epistemic_distribution: Record<string, number>;
  degraded?: string | null; stub?: boolean;
}

// Epistemic-mode → colour (the ladder hypothesis→…→attested). This colouring IS the feature: Bloom shows topology,
// we show epistemic status per node.
// Resolve from the token ramp so the graph, membrane, and chips share one ink.
// (Falls back to literals when read outside the DOM, e.g. SSR/tests.)
function epiVar(name: string, fallback: string): string {
  if (typeof getComputedStyle === "function" && typeof document !== "undefined") {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (v) return v;
  }
  return fallback;
}
export const EPISTEMIC_COLORS: Record<string, string> = {
  get hypothesis() { return epiVar("--epi-hypothesis", "#94a1b2"); },
  get observed()   { return epiVar("--epi-observed",   "#4a90e2"); },
  get derived()    { return epiVar("--epi-derived",    "#8b5cf6"); },
  get verified()   { return epiVar("--epi-verified",   "#14b8a6"); },
  get attested()   { return epiVar("--epi-attested",   "#059669"); },
  get simulated()  { return epiVar("--epi-simulated",  "#d98324"); },
  get unknown()    { return epiVar("--epi-unknown",    "#b6bec9"); },
};

const STUB_GRAPH: GraphView = {
  project: "demo", projectCollection: "proj-demo",
  nodes: [
    { id: "proj-demo:ent:hellgraph", name: "HellGraph", epistemic_mode: "verified", source: "doc:spec", extractor: "lattice-studio/deterministic-v0", labels: ["proj-demo", "Entity"] },
    { id: "proj-demo:ent:neo4j", name: "Neo4j", epistemic_mode: "observed", source: "doc:demo", extractor: "lattice-studio/deterministic-v0", labels: ["proj-demo", "Entity"] },
    { id: "proj-demo:ent:anzo", name: "Anzo", epistemic_mode: "observed", source: "doc:demo", extractor: "lattice-studio/deterministic-v0", labels: ["proj-demo", "Entity"] },
    { id: "proj-demo:ent:sae", name: "SAE feature", epistemic_mode: "derived", source: "notebook:nb-3", extractor: "superconscious", labels: ["proj-demo", "Entity"] },
    { id: "proj-demo:ent:claim", name: "Contradiction claim", epistemic_mode: "hypothesis", source: "holmes", extractor: "holmes", labels: ["proj-demo", "Entity"] },
  ],
  edges: [
    { id: "e1", source: "proj-demo:ent:hellgraph", target: "proj-demo:ent:neo4j", label: "COMPARED_WITH", weight: 3 },
    { id: "e2", source: "proj-demo:ent:hellgraph", target: "proj-demo:ent:anzo", label: "COMPARED_WITH", weight: 2 },
    { id: "e3", source: "proj-demo:ent:neo4j", target: "proj-demo:ent:anzo", label: "CO_OCCURS", weight: 1 },
    { id: "e4", source: "proj-demo:ent:hellgraph", target: "proj-demo:ent:sae", label: "GROUNDS", weight: 2 },
    { id: "e5", source: "proj-demo:ent:sae", target: "proj-demo:ent:claim", label: "SUPPORTS", weight: 1 },
    { id: "e6", source: "proj-demo:ent:hellgraph", target: "proj-demo:ent:claim", label: "GROUNDS", weight: 1 },
  ],
  count: 5, edge_count: 6, epistemic_distribution: { verified: 1, observed: 2, derived: 1, hypothesis: 1 }, stub: true,
};

export async function loadGraph(project: string): Promise<GraphView> {
  if (!BASE) return STUB_GRAPH;
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/graph?project=${encodeURIComponent(project)}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`graph load failed: ${res.status}`);
  return (await res.json()) as GraphView;
}

// ── WRITE workbench: hand-author facts into the project graph (KE-1). Fail-closed behind the Studio write
// token (Bearer) — the same gate /extract uses, so a manual fact is as governed + proof-carrying as an
// extracted one. The token is held in-session only (never persisted). ──
export const EPISTEMIC_ORDER = ["attested", "verified", "observed", "derived", "hypothesis", "simulated"] as const;

export interface AddNodeInput { project: string; name: string; epistemic_mode?: string; labels?: string[]; source?: string }
export interface AddEdgeInput { project: string; from_name: string; to_name: string; label?: string; epistemic_mode?: string; source?: string }

function writeHeaders(token: string): HeadersInit {
  return { "content-type": "application/json", accept: "application/json", authorization: `Bearer ${token}` };
}

function writeError(prefix: string, status: number): Error {
  const hint = status === 401 ? " — bad write token" : status === 503 ? " — writes disabled (STUDIO_WRITE_TOKEN unset)" : status === 502 ? " — graph write failed" : "";
  return new Error(`${prefix}: ${status}${hint}`);
}

export async function addNode(input: AddNodeInput, token: string): Promise<{ id: string; written: boolean }> {
  if (!BASE) throw new Error("Studio backend not connected (set VITE_STUDIO_API)");
  if (!token) throw new Error("write token required");
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/node`, { method: "POST", headers: writeHeaders(token), body: JSON.stringify(input) });
  if (!res.ok) throw writeError("add node failed", res.status);
  return (await res.json()) as { id: string; written: boolean };
}

export async function addEdge(input: AddEdgeInput, token: string): Promise<{ from: string; to: string; written: boolean }> {
  if (!BASE) throw new Error("Studio backend not connected (set VITE_STUDIO_API)");
  if (!token) throw new Error("write token required");
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/edge`, { method: "POST", headers: writeHeaders(token), body: JSON.stringify(input) });
  if (!res.ok) throw writeError("add edge failed", res.status);
  return (await res.json()) as { from: string; to: string; written: boolean };
}

// ── KE-5 "How derived?": the proof-carrying lineage of one fact — provenance + the facts it was
// derived/co-observed with, each carrying its own epistemic status. What Bloom/Stardog can't show. ──
export interface Derivation { relation: string; direction: "in" | "out"; weight: number; with: { id: string; name: string; epistemic_mode: string; source?: string | null } }
export interface Provenance {
  id: string; found: boolean; name?: string; epistemic_mode?: string; source?: string | null;
  extractor?: string | null; kko_type?: string; labels?: string[];
  derivations: Derivation[]; derivation_count: number; summary?: string; degraded?: string | null;
}

const STUB_PROVENANCE = (id: string, nodes: GraphNode[], edges: GraphEdge[]): Provenance => {
  const node = nodes.find((n) => n.id === id);
  if (!node) return { id, found: false, derivations: [], derivation_count: 0 };
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const derivations: Derivation[] = edges.filter((e) => e.source === id || e.target === id).map((e) => {
    const out = e.source === id; const o = byId[out ? e.target : e.source];
    return { relation: e.label, direction: out ? "out" : "in", weight: e.weight ?? 1,
             with: { id: o?.id ?? "", name: o?.name ?? "", epistemic_mode: o?.epistemic_mode ?? "unknown", source: o?.source } };
  });
  return { id, found: true, name: node.name, epistemic_mode: node.epistemic_mode, source: node.source,
           extractor: node.extractor, kko_type: "Particulars", labels: node.labels,
           derivations, derivation_count: derivations.length,
           summary: `‘${node.name}’ is held as ${node.epistemic_mode}, connected to ${derivations.length} related fact(s).` };
};

export async function getProvenance(project: string, id: string, stubGraph?: GraphView): Promise<Provenance> {
  if (!BASE) return STUB_PROVENANCE(id, stubGraph?.nodes ?? STUB_GRAPH.nodes, stubGraph?.edges ?? STUB_GRAPH.edges ?? []);
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/provenance?project=${encodeURIComponent(project)}&id=${encodeURIComponent(id)}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`provenance failed: ${res.status}`);
  return (await res.json()) as Provenance;
}

// ── WS#29: verified-compute RECEIPTS from the evidence fabric — the replayable proof-of-work behind Studio. ──
export interface Receipt { service: string; correlation_id: string; received_at?: string | null; verdict?: string | null; kind?: string | null; bundle_ref?: string | null }
export interface Receipts { receipts: Receipt[]; count: number; services: Record<string, boolean>; services_reachable: number; detail_endpoint: string }

const STUB_RECEIPTS: Receipts = {
  receipts: [
    { service: "hellgraph-service", correlation_id: "hg-9f2a", received_at: "just now", verdict: "ok", kind: "graph-write", bundle_ref: "/v1/receipts/hellgraph-service/hg-9f2a" },
    { service: "owl-reasoner", correlation_id: "owl-71c", received_at: "2m ago", verdict: "sound", kind: "reason", bundle_ref: "/v1/receipts/owl-reasoner/owl-71c" },
    { service: "entity-resolution", correlation_id: "er-33b", received_at: "6m ago", verdict: "merged", kind: "resolve", bundle_ref: "/v1/receipts/entity-resolution/er-33b" },
  ],
  count: 3, services: { "hellgraph-service": true, "owl-reasoner": true, "entity-resolution": true }, services_reachable: 3,
  detail_endpoint: "/v1/receipts/{service}/{correlation_id}",
};

export async function loadReceipts(limit = 12): Promise<Receipts> {
  if (!BASE) return STUB_RECEIPTS;
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/receipts?limit=${limit}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`receipts failed: ${res.status}`);
  return (await res.json()) as Receipts;
}

// ── WS#30: the proof-carrying query IDE (SPARQL/Cypher/Gremlin). Results carry replay proof + per-fact epistemic. ──
export type QueryLang = "sparql" | "cypher" | "gremlin";
export interface QueryProof { query_hash?: string | null; evaluated_at_seq?: number | null; replayable: boolean }
export interface QueryResult {
  project: string; lang: QueryLang; columns: string[]; rows: Record<string, unknown>[]; row_count: number;
  epistemic: Record<string, string>; proof: QueryProof; raw?: unknown;
}

const STUB_QUERY = (lang: QueryLang): QueryResult => ({
  project: "demo", lang,
  columns: ["entity", "epistemic"],
  rows: [
    { entity: "proj-demo:ent:hellgraph", epistemic: "verified" },
    { entity: "proj-demo:ent:neo4j", epistemic: "observed" },
    { entity: "proj-demo:ent:anzo", epistemic: "observed" },
  ],
  row_count: 3,
  epistemic: { "proj-demo:ent:hellgraph": "verified", "proj-demo:ent:neo4j": "observed", "proj-demo:ent:anzo": "observed" },
  proof: { query_hash: "qh-demo-8f2a", evaluated_at_seq: 128, replayable: true },
});

export async function runQuery(project: string, lang: QueryLang, query: string, params?: Record<string, string>): Promise<QueryResult> {
  if (!BASE) return STUB_QUERY(lang);
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/query`, {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ project, lang, query, params }),
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try { const j = await res.json(); detail = (j as { detail?: string }).detail ?? detail; } catch { /* */ }
    throw new Error(`query failed: ${detail}`);
  }
  return (await res.json()) as QueryResult;
}

// ── WS#32: experiment tracking — runs are first-class proof-carrying graph facts (params/metrics + epistemic). ──
export interface ExperimentRun {
  run_id: string; name: string; status: string; params: Record<string, unknown>; metrics: Record<string, number>;
  created_at?: string | null; epistemic_mode?: string; extractor?: string | null; source?: string | null;
}
export interface Experiments { project: string; runs: ExperimentRun[]; count: number; degraded?: string | null }

const STUB_EXPERIMENTS: Experiments = {
  project: "demo", count: 2,
  runs: [
    { run_id: "proj-demo:run:8f2a", name: "sweep-lr", status: "finished", params: { lr: 0.01, batch: 64 }, metrics: { acc: 0.912, loss: 0.28 }, created_at: "2m ago", epistemic_mode: "observed", extractor: "studio/experiment-v0" },
    { run_id: "proj-demo:run:71c9", name: "baseline", status: "finished", params: { lr: 0.001 }, metrics: { acc: 0.874 }, created_at: "1h ago", epistemic_mode: "observed", extractor: "studio/experiment-v0" },
  ],
};

export async function loadExperiments(project: string): Promise<Experiments> {
  if (!BASE) return STUB_EXPERIMENTS;
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/experiments?project=${encodeURIComponent(project)}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`experiments failed: ${res.status}`);
  return (await res.json()) as Experiments;
}

export async function logExperiment(
  input: { project: string; name: string; params?: Record<string, unknown>; metrics?: Record<string, number>; status?: string },
  token: string,
): Promise<ExperimentRun> {
  if (!BASE) throw new Error("Studio backend not connected (set VITE_STUDIO_API)");
  if (!token) throw new Error("write token required");
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/experiments`, {
    method: "POST", headers: writeHeaders(token), body: JSON.stringify(input),
  });
  if (!res.ok) throw writeError("log experiment failed", res.status);
  return (await res.json()) as ExperimentRun;
}

// ── WS#35: sovereign persistent IDs + citation — DataCite-compatible, resolves to a proof-carrying record. ──
export interface Citation {
  pid: string; doi: string; resolve: string; content_hash: string; created_at?: string;
  citation: string; bibtex: string; datacite: unknown; proof_carrying: boolean;
}

const STUB_CITATION = (kind: string, ref: string): Citation => {
  const h = "8f2ad4c1b9e0";
  const pid = `sp:proj-demo/${kind}/${h.slice(0, 12)}`;
  const doi = `10.82044/proj-demo.${kind}.${h.slice(0, 8)}`;
  return {
    pid, doi, resolve: `https://studio.socioprophet.ai/resolve?pid=${pid}`, content_hash: h, created_at: "just now",
    citation: `SocioProphet Knowledge Commons (2026). ${kind} · ${ref || "proj-demo"}. SocioProphet Knowledge Commons. ${pid} (DOI: ${doi}).`,
    bibtex: `@misc{${h.slice(0, 8)},\n  author = {SocioProphet Knowledge Commons},\n  title = {${kind} · ${ref || "proj-demo"}},\n  year = {2026},\n  note = {${pid}},\n  doi = {${doi}}\n}`,
    datacite: { id: doi, type: "dois" }, proof_carrying: true,
  };
};

export async function mintCitation(
  input: { project: string; kind: string; ref?: string; title?: string; creators?: string[] },
  token: string,
): Promise<Citation> {
  if (!BASE) return STUB_CITATION(input.kind, input.ref ?? "");
  if (!token) throw new Error("write token required");
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/cite`, {
    method: "POST", headers: writeHeaders(token), body: JSON.stringify(input),
  });
  if (!res.ok) throw writeError("cite failed", res.status);
  return (await res.json()) as Citation;
}

// ── WS#36–39: the proof-carrying knowledge COMMONS — preservation, FAIR, scholarly/agent hooks, curation. ──
export interface SnapshotVersion { snapshot_id: string; version: number; content_hash: string; sealed_at?: string | null; parent?: string | null; note?: string | null; epistemic_mode?: string }
export interface Versions { project: string; target: string; versions: SnapshotVersion[]; count: number; degraded?: string | null }

export interface Fair {
  project: string; target: string; title: string; pid?: string | null; doi?: string | null;
  version?: number | null; content_hash?: string | null;
  fair: { findable: boolean; accessible: boolean; interoperable: boolean; reusable: boolean; score: number };
  fair_plus: { epistemic: boolean; provenance_chain: boolean; hash_sealed: boolean };
  hint?: string | null;
}

export interface OrcidContributor { name: string; orcid: string; orcid_url: string }
export interface AgentVerb { name: string; endpoint: string | null; verifiable: boolean }
export interface Ecosystem {
  project: string; target: string;
  scholarly: { doi?: string | null; doi_url?: string | null; orcid_contributors: OrcidContributor[]; openaire: { harvestable: boolean; datacite_doi?: string | null; metadata: string } };
  agent_manifest: { "@type": string; identifier?: string | null; proof_carrying: boolean; epistemic_status: boolean; sovereign: boolean; access: AgentVerb[]; consume_note: string };
}

export interface Commons {
  project: string; collection: string;
  scale: { facts: number; citations: number; preserved_versions: number; endorsements: number; contributors: number };
  epistemic_distribution: Record<string, number>; epistemic_quality_index?: number | null; degraded?: string | null;
}

export interface Endorsement { target: string; endorser: string; note?: string | null; at?: string | null }
export interface Curation { project: string; target?: string | null; endorsements: Endorsement[]; count: number; curation_score: number; epistemic_weighted: boolean; degraded?: string | null }

const STUB_COMMONS: Commons = {
  project: "demo", collection: "proj-demo",
  scale: { facts: 128, citations: 3, preserved_versions: 4, endorsements: 7, contributors: 2 },
  epistemic_distribution: { attested: 18, verified: 41, observed: 63, hypothesis: 6 }, epistemic_quality_index: 0.71,
};
const STUB_FAIR: Fair = {
  project: "demo", target: "proj-demo", title: "demo — knowledge graph", pid: "sp:proj-demo/graph/8f2ad4c1b9e0",
  doi: "10.82044/proj-demo.graph.8f2ad4c1", version: 4, content_hash: "8f2ad4c1b9e0",
  fair: { findable: true, accessible: true, interoperable: true, reusable: true, score: 1.0 },
  fair_plus: { epistemic: true, provenance_chain: true, hash_sealed: true }, hint: null,
};
const STUB_ECOSYSTEM: Ecosystem = {
  project: "demo", target: "proj-demo",
  scholarly: { doi: "10.82044/proj-demo.graph.8f2ad4c1", doi_url: "https://doi.org/10.82044/proj-demo.graph.8f2ad4c1",
    orcid_contributors: [{ name: "M. Heller", orcid: "0000-0002-1825-0097", orcid_url: "https://orcid.org/0000-0002-1825-0097" }],
    openaire: { harvestable: true, datacite_doi: "10.82044/proj-demo.graph.8f2ad4c1", metadata: "/api/studio/fair?project=demo" } },
  agent_manifest: { "@type": "AgentCapabilityManifest", identifier: "sp:proj-demo/graph/8f2ad4c1b9e0", proof_carrying: true, epistemic_status: true, sovereign: true,
    access: [
      { name: "resolve", endpoint: "/api/studio/resolve?pid=sp:proj-demo/graph/8f2ad4c1b9e0", verifiable: true },
      { name: "query", endpoint: "/api/studio/query", verifiable: true },
      { name: "provenance", endpoint: "/api/studio/provenance", verifiable: true },
      { name: "receipts", endpoint: "/api/studio/receipts", verifiable: true },
      { name: "rdf", endpoint: "/api/studio/graph.ttl?project=demo", verifiable: true },
      { name: "fair", endpoint: "/api/studio/fair?project=demo", verifiable: true },
    ], consume_note: "every result carries a queryHash + epistemic status; verify via the receipts/provenance verbs" },
};
const STUB_VERSIONS: Versions = {
  project: "demo", target: "proj-demo", count: 2,
  versions: [
    { snapshot_id: "proj-demo:snap:8f2ad4c1b9e0", version: 2, content_hash: "8f2ad4c1b9e0", sealed_at: "2m ago", parent: "proj-demo:snap:71c9", note: "post-review", epistemic_mode: "attested" },
    { snapshot_id: "proj-demo:snap:71c9", version: 1, content_hash: "71c9aa02", sealed_at: "1h ago", parent: null, note: "initial", epistemic_mode: "attested" },
  ],
};
const STUB_CURATION: Curation = {
  project: "demo", target: null, epistemic_weighted: true, count: 2, curation_score: 1.6,
  endorsements: [
    { target: "proj-demo:ent:hellgraph", endorser: "0000-0002-1825-0097", note: "verified independently", at: "5m ago" },
    { target: "proj-demo:ent:provenance", endorser: "curator:noetica", note: null, at: "1h ago" },
  ],
};

async function _read<T>(path: string, stub: T): Promise<T> {
  if (!BASE) return stub;
  const res = await fetch(`${BASE.replace(/\/$/, "")}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export const loadCommons = (project: string) => _read(`/api/studio/commons?project=${encodeURIComponent(project)}`, STUB_COMMONS);
export const loadFair = (project: string) => _read(`/api/studio/fair?project=${encodeURIComponent(project)}`, STUB_FAIR);
export const loadEcosystem = (project: string) => _read(`/api/studio/ecosystem?project=${encodeURIComponent(project)}`, STUB_ECOSYSTEM);
export const loadVersions = (project: string) => _read(`/api/studio/versions?project=${encodeURIComponent(project)}`, STUB_VERSIONS);
export const loadCuration = (project: string, target?: string) =>
  _read(`/api/studio/curation?project=${encodeURIComponent(project)}${target ? `&target=${encodeURIComponent(target)}` : ""}`, STUB_CURATION);

export async function endorse(
  input: { project: string; target: string; endorser: string; note?: string; revoke?: boolean },
  token: string,
): Promise<{ endorsement_id: string; target: string; endorser: string; revoked: boolean; proof_carrying: boolean }> {
  if (!BASE) return { endorsement_id: `stub:endorse:${input.target}`, target: input.target, endorser: input.endorser, revoked: !!input.revoke, proof_carrying: true };
  if (!token) throw new Error("write token required");
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/endorse`, {
    method: "POST", headers: writeHeaders(token), body: JSON.stringify(input),
  });
  if (!res.ok) throw writeError("endorse failed", res.status);
  return await res.json();
}

// ── Operations panel (Databricks/Foundry-parity): pipelines · model registry · catalog · compute · communities ──
export interface PipelineStepDef { id: string; kind: string; inputs?: string[]; outputs?: string[] }
export interface Pipeline { pipeline_id: string; name: string; steps: PipelineStepDef[]; step_count: number }
export interface ModelVersion { model_id: string; version: string; stage: string; metrics: Record<string, number>; run?: string | null }
export interface ModelEntry { name: string; versions: ModelVersion[] }
export interface Dataset { id: string; name: string; labels: string[]; connector?: string | null; epistemic_mode: string; columns: string[] }
export interface ComputeBackend { id: string; kind: string; note: string; entitled: boolean; default?: boolean }
export interface Compute { backends: ComputeBackend[]; entitled_any: boolean; model: string }
export interface Community { community: string; size: number; top_members: { id: string; label: string; degree: number }[]; epistemic_distribution: Record<string, number> }
export interface ExecReceipt { correlation_id: string; backend: string; replayable: boolean; bundle_ref: string; payload_sha256: string }
export type ExecResult =
  | { ok: true; execution_id: string; backend: string; status: string; receipt: ExecReceipt }
  | { ok: false; entitlement_required: true; backend: string; message: string };

const STUB_PIPELINES: { pipelines: Pipeline[]; count: number } = {
  count: 1,
  pipelines: [{ pipeline_id: "proj-demo:pipeline:etl_train", name: "ETL → train", step_count: 3,
    steps: [{ id: "load", kind: "extract", outputs: ["raw"] }, { id: "clean", kind: "transform", inputs: ["raw"], outputs: ["tidy"] }, { id: "fit", kind: "train", inputs: ["tidy"] }] }],
};
const STUB_MODELS: { models: ModelEntry[]; count: number } = {
  count: 2,
  models: [{ name: "classifier", versions: [
    { model_id: "proj-demo:model:classifier:2", version: "2", stage: "production", metrics: { acc: 0.93 }, run: "proj-demo:run:abc" },
    { model_id: "proj-demo:model:classifier:1", version: "1", stage: "archived", metrics: { acc: 0.88 }, run: "proj-demo:run:aa0" }] }],
};
const STUB_CATALOG: { datasets: Dataset[]; count: number } = {
  count: 2,
  datasets: [
    { id: "proj-demo:ingest:people", name: "people", labels: ["Person", "Ingested"], connector: "csv", epistemic_mode: "observed", columns: ["id", "name", "age"] },
    { id: "proj-demo:ingest:orders", name: "orders", labels: ["Order", "Ingested"], connector: "postgres", epistemic_mode: "observed", columns: ["order_id", "total"] }],
};
const STUB_COMPUTE: Compute = {
  entitled_any: false,
  model: "pay-gated full service — capability available, runtime provisioned only when entitled",
  backends: [
    { id: "mesh-k8s", kind: "sovereign", default: true, note: "self-hosted sandbox on the paid mesh (kind / k3s / k8s / DinD)", entitled: false },
    { id: "spark", kind: "sovereign", note: "a small Spark namespace on the mesh", entitled: false },
    { id: "databricks", kind: "external", note: "connect to your own Databricks workspace", entitled: false }],
};
const STUB_COMMUNITIES: { communities: Community[]; count: number; inter_community_edges: number; algorithm: string } = {
  count: 2, inter_community_edges: 3, algorithm: "louvain-modularity (deterministic, single-level)",
  communities: [
    { community: "proj-demo:community:a1b2", size: 7, epistemic_distribution: { verified: 3, observed: 4 }, top_members: [{ id: "proj-demo:ent:hellgraph", label: "HellGraph", degree: 6 }, { id: "proj-demo:ent:provenance", label: "provenance", degree: 4 }] },
    { community: "proj-demo:community:c3d4", size: 4, epistemic_distribution: { observed: 4 }, top_members: [{ id: "proj-demo:ent:foundry", label: "Foundry", degree: 3 }] }],
};

export const loadPipelines = (project: string) => _read(`/api/studio/pipelines?project=${encodeURIComponent(project)}`, STUB_PIPELINES);
export const loadModels = (project: string) => _read(`/api/studio/models?project=${encodeURIComponent(project)}`, STUB_MODELS);
export const loadCatalog = (project: string) => _read(`/api/studio/catalog?project=${encodeURIComponent(project)}`, STUB_CATALOG);
export const loadCompute = (project: string) => _read(`/api/studio/compute?project=${encodeURIComponent(project)}`, STUB_COMPUTE);
export const loadCommunities = (project: string) => _read(`/api/studio/communities?project=${encodeURIComponent(project)}`, STUB_COMMUNITIES);

export async function runPipeline(input: { project: string; pipeline: string; status?: string }, token: string): Promise<{ run_id: string; status: string }> {
  if (!BASE) return { run_id: `stub:run:${input.pipeline}`, status: input.status ?? "finished" };
  if (!token) throw new Error("write token required");
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/pipeline/run`, { method: "POST", headers: writeHeaders(token), body: JSON.stringify(input) });
  if (!res.ok) throw writeError("pipeline run failed", res.status);
  return await res.json();
}

export async function promoteModel(input: { project: string; name: string; version: string; stage: string }, token: string): Promise<{ model_id: string; stage: string; from_stage: string }> {
  if (!BASE) return { model_id: `stub:model:${input.name}:${input.version}`, stage: input.stage, from_stage: "staging" };
  if (!token) throw new Error("write token required");
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/model/promote`, { method: "POST", headers: writeHeaders(token), body: JSON.stringify(input) });
  if (!res.ok) throw writeError("promote failed", res.status);
  return await res.json();
}

export async function execute(
  input: { project: string; kind: string; backend: string; ref?: string; code?: string },
  token: string,
): Promise<ExecResult> {
  if (!BASE) return { ok: false, entitlement_required: true, backend: input.backend, message: "compute is a paid, provisioned service — provision an entitlement to run (dev stub)" };
  if (!token) throw new Error("write token required");
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/execute`, { method: "POST", headers: writeHeaders(token), body: JSON.stringify(input) });
  if (res.status === 402) {
    const d = (await res.json().catch(() => ({}))) as { detail?: { message?: string } };
    return { ok: false, entitlement_required: true, backend: input.backend, message: d.detail?.message ?? "compute entitlement required" };
  }
  if (!res.ok) throw writeError("execute failed", res.status);
  return { ok: true, ...(await res.json()) };
}

// ── Notebook runtime (lattice-forge, via the BFF) — governed, adapter-based, receipt-per-cell ──
export interface NbAdapter { role: string; capabilities: string[]; kernels: string[]; mode: string }
export interface NbSession {
  id: string; project: string; adapter: string; role: string; mode: string;
  kernel: string; name: string; status: string; url?: string | null;
}
export interface NbOutput { type: string; name?: string; text?: string; ename?: string; evalue?: string; mime?: string[]; png?: string; svg?: string; html?: string }
export interface NbReceipt {
  id: string; project: string; adapter: string; language: string; runtime: string;
  code_sha: string; outputs_sha: string; status: string; actor: string; prev?: string | null; ts: number;
}
export interface NbExecResult {
  status: string; outputs: NbOutput[]; error?: string | null; degraded?: string | null;
  receipt?: NbReceipt | null; adapter?: string; runtime?: string;
}

const NB_ADAPTERS_STUB: { default: string; adapters: Record<string, NbAdapter> } = {
  default: "jupyterlab",
  adapters: {
    jupyterlab: { role: "scientific-notebook", capabilities: ["python", "r", "julia", "terminal"], kernels: ["python3", "ir", "julia"], mode: "session" },
    zeppelin:   { role: "collaborative-analytics", capabilities: ["spark", "sql", "scala", "python"], kernels: ["spark", "python3"], mode: "session" },
    observable: { role: "reactive-visualization", capabilities: ["javascript", "sql", "markdown"], kernels: ["javascript"], mode: "reactive" },
    quarto:     { role: "publishing", capabilities: ["python", "r", "markdown", "slides"], kernels: ["python3"], mode: "headless" },
  },
};

function nbBase(): string | null { return BASE ? BASE.replace(/\/$/, "") : null; }

export async function loadNotebookAdapters(): Promise<{ default: string; adapters: Record<string, NbAdapter> }> {
  const b = nbBase(); if (!b) return NB_ADAPTERS_STUB;
  const r = await fetch(`${b}/api/studio/notebook/adapters`).catch(() => null);
  if (!r || !r.ok) return NB_ADAPTERS_STUB;
  const d = await r.json(); return d.adapters ? d : NB_ADAPTERS_STUB;
}

export async function createNotebookSession(input: { project: string; adapter?: string; name?: string }): Promise<NbSession> {
  const b = nbBase();
  if (!b) return { id: "stub-" + Math.random().toString(16).slice(2, 8), project: input.project, adapter: input.adapter || "jupyterlab",
                   role: "scientific-notebook", mode: "session", kernel: "python3", name: input.name || "Notebook session", status: "stub", url: null };
  const r = await fetch(`${b}/api/studio/notebook/session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (!r.ok) throw new Error(`session failed (HTTP ${r.status})`);
  return r.json();
}

export async function loadNotebookSessions(project: string): Promise<{ project: string; sessions: NbSession[]; degraded?: string }> {
  const b = nbBase(); if (!b) return { project, sessions: [] };
  const r = await fetch(`${b}/api/studio/notebook/sessions?project=${encodeURIComponent(project)}`).catch(() => null);
  if (!r || !r.ok) return { project, sessions: [], degraded: "runtime unreachable" };
  return r.json();
}

export async function executeCell(input: { project: string; code: string; language?: string; adapter?: string; session_id?: string }): Promise<NbExecResult> {
  const b = nbBase();
  // honest stub: no BASE → we do NOT fake compute; the surface shows "runtime not wired".
  if (!b) return { status: "degraded", outputs: [], error: null, degraded: "notebook runtime not wired (dev preview)", receipt: null };
  const r = await fetch(`${b}/api/studio/notebook/execute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (!r.ok) throw new Error(`execute failed (HTTP ${r.status})`);
  return r.json();
}

export async function loadNotebookReceipts(project: string): Promise<{ project: string; count: number; receipts: NbReceipt[]; degraded?: string }> {
  const b = nbBase(); if (!b) return { project, count: 0, receipts: [] };
  const r = await fetch(`${b}/api/studio/notebook/receipts?project=${encodeURIComponent(project)}`).catch(() => null);
  if (!r || !r.ok) return { project, count: 0, receipts: [], degraded: "runtime unreachable" };
  return r.json();
}

// ── Attested AI assistant — the moat applied to AI (Genie-parity, but proof-carrying) ──
// A model (or, offline, a deterministic heuristic) PROPOSES a cell. That proposal is epistemically a
// HYPOTHESIS — unproven — until the user RUNS it, at which point its sealed receipt attests it. We never
// pretend a heuristic is a model: source is labelled honestly so the surface can say "offline heuristic".
export interface NbProposal { code: string; rationale: string; source: "model" | "heuristic"; epistemic: "hypothesis" }

// Deterministic keyword scaffold — the honest offline fallback. Maps a natural-language prompt to a
// starter cell + a short rationale explaining the mapping. Never dressed up as a model answer.
function heuristicProposal(prompt: string): NbProposal {
  const p = prompt.trim();
  const low = p.toLowerCase();
  const has = (...ws: string[]) => ws.some((w) => low.includes(w));
  let code: string;
  let rationale: string;
  if (has("plot", "chart", "distribution", "bar", "histogram")) {
    code = "import matplotlib.pyplot as plt\ndf['<column>'].value_counts().plot.barh()\nplt.show()";
    rationale = "‘plot/chart’ → a matplotlib bar of a column’s value counts. Set <column> and run to attest it.";
  } else if (has("load", "dataset", "data")) {
    // pull a plausible dataset name out of the prompt (quoted, or the longest word-ish token)
    const quoted = p.match(/['"`]([^'"`]+)['"`]/)?.[1];
    const guess = quoted || (p.match(/[A-Za-z][A-Za-z0-9_]{3,}/g) || [])
      .filter((w) => !["load", "dataset", "data", "the", "please", "into", "from"].includes(w.toLowerCase()))
      .sort((a, b) => b.length - a.length)[0] || "my_dataset";
    code = `df = load('${guess}')   # governed dataset\ndf.head()`;
    rationale = `‘load/data’ → a governed load() scaffold; guessed dataset ‘${guess}’ from your prompt. Run to seal a receipt.`;
  } else if (has("count", "value")) {
    code = "df['<column>'].value_counts()";
    rationale = "‘count/value’ → value_counts() on a column. Set <column> and run to attest it.";
  } else if (has("shape", "rows", "columns", "size")) {
    code = "df.shape";
    rationale = "‘shape/rows’ → df.shape (rows, columns). Run to attest it.";
  } else if (has("head", "preview", "peek", "first")) {
    code = "df.head()";
    rationale = "‘head/preview’ → df.head() to inspect the first rows. Run to attest it.";
  } else if (has("describe", "summary", "summarize", "stats", "statistics")) {
    code = "df.describe()";
    rationale = "‘describe/summary’ → df.describe() for summary statistics. Run to attest it.";
  } else {
    const echo = p.replace(/\n/g, " ").slice(0, 120) || "your request";
    code = `# ${echo}\n# offline scaffold — no runtime wired to author this. Edit, then run to seal a receipt.\n`;
    rationale = "No keyword matched, so this is a commented scaffold echoing your request — nothing was inferred.";
  }
  return { code, rationale, source: "heuristic", epistemic: "hypothesis" };
}

export async function proposeCell(input: { project: string; prompt: string; context?: string }): Promise<NbProposal> {
  const b = nbBase();
  // Offline → deterministic heuristic, labelled honestly (never a fabricated "model" answer).
  if (!b) return heuristicProposal(input.prompt);
  try {
    const r = await fetch(`${b}/api/studio/notebook/assist`, {
      method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify(input),
    });
    if (!r.ok) return heuristicProposal(input.prompt);
    const d = (await r.json()) as { code?: string; rationale?: string };
    if (!d || typeof d.code !== "string") return heuristicProposal(input.prompt);
    return { code: d.code, rationale: d.rationale || "Proposed by the Studio assistant model.", source: "model", epistemic: "hypothesis" };
  } catch {
    return heuristicProposal(input.prompt);
  }
}

// ── Governance panel: the real ontology (Ontogenesis) · typed actions (Foundry-Workshop) · GAIA world-signals ──
export interface OntologyClassLite { iri: string; label?: string; subClassOf: string[]; property_count: number }
export interface OntologyProperty { iri: string; label?: string; kind: string; range?: string | null }
export interface OntologyView { base_iri: string; counts: Record<string, unknown>; classes: OntologyClassLite[]; total_matched: number }
export interface OntologyClassDetail { class: { iri: string; label?: string; subClassOf: string[]; inherited_properties: OntologyProperty[] }; base_iri: string }

export interface ActionEffectDef { op: string; property?: string; label?: string; value?: unknown; value_from?: string }
export interface ActionDef { action_id: string; name: string; target_type: string; description?: string | null; params: { name: string; type?: string }[]; effects: ActionEffectDef[] }

export interface WorldSignal { signal_id: string; feature_id: string; signal_type: string; promotion_state: string; epistemic_mode?: string | null; canonical: boolean; evidence_count: number; confidence?: number | null; submitted_at?: string | null }
export interface GaiaMembrane { state: string; epistemic_human: string; epistemic_model: string; canonical: boolean }
export interface GaiaOntology { promotion_states: string[]; promotion_epistemic_membrane: GaiaMembrane[]; invariant: string; three_twins: Record<string, string> }

const STUB_ONTOLOGY: OntologyView = {
  base_iri: "https://socioprophet.dev/ont/ontogenesis#", counts: { classes: 817, object_properties: 621, datatype_properties: 590 }, total_matched: 12,
  classes: [
    { iri: "upper:Entity", label: "Entity", subClassOf: [], property_count: 3 },
    { iri: "upper:Agent", label: "Agent", subClassOf: ["upper:Entity"], property_count: 4 },
    { iri: "upper:Evidence", label: "Evidence", subClassOf: ["upper:InformationArtifact"], property_count: 2 },
    { iri: "upper:Policy", label: "Policy", subClassOf: ["upper:InformationArtifact"], property_count: 2 }],
};
const STUB_ACTIONS: { actions: ActionDef[]; count: number } = {
  count: 1,
  actions: [{ action_id: "proj-demo:action:rename_attr", name: "Rename attr", target_type: "ACSETAttr", description: "typed against the real ontology",
    params: [{ name: "newname" }], effects: [{ op: "set_property", property: "acsetAttrName", value_from: "newname" }] }],
};
const STUB_WORLDSIGNALS: { world_signals: WorldSignal[]; count: number } = {
  count: 2,
  world_signals: [
    { signal_id: "proj-demo:worldsignal:ft-42", feature_id: "foot-traffic-poi-42", signal_type: "feature_registry", promotion_state: "Promoted", epistemic_mode: "attested", canonical: true, evidence_count: 3, confidence: 0.91, submitted_at: "2h ago" },
    { signal_id: "proj-demo:worldsignal:wx", feature_id: "weather-nowcast", signal_type: "weather", promotion_state: "EvidenceOnly", epistemic_mode: "derived", canonical: false, evidence_count: 0, confidence: 0.4, submitted_at: "5m ago" }],
};
const STUB_GAIA: GaiaOntology = {
  promotion_states: ["EvidenceOnly", "ReviewRequired", "Rejected", "Promoted"],
  invariant: "GAIA-2: a model may propose but only a human/policy actor may Promote to canonical (attested)",
  three_twins: { knowledge: "HellGraph fact · observed→attested", human: "HDT Observation → OmegaState", earth: "GAIA WorldSignal → PromotionState" },
  promotion_epistemic_membrane: [
    { state: "EvidenceOnly", epistemic_human: "observed", epistemic_model: "derived", canonical: false },
    { state: "ReviewRequired", epistemic_human: "observed", epistemic_model: "derived", canonical: false },
    { state: "Rejected", epistemic_human: "simulated", epistemic_model: "simulated", canonical: false },
    { state: "Promoted", epistemic_human: "attested", epistemic_model: "attested", canonical: true }],
};

export const loadOntology = (search: string) => _read<OntologyView>(`/api/studio/ontology${search ? `?search=${encodeURIComponent(search)}` : ""}`, STUB_ONTOLOGY);
export const loadOntologyClass = (cls: string) => _read<OntologyClassDetail>(`/api/studio/ontology?cls=${encodeURIComponent(cls)}`, { class: { iri: cls, subClassOf: [], inherited_properties: [] }, base_iri: "" });
export const loadActions = (project: string) => _read(`/api/studio/actions?project=${encodeURIComponent(project)}`, STUB_ACTIONS);
export const loadWorldsignals = (project: string) => _read(`/api/studio/worldsignals?project=${encodeURIComponent(project)}`, STUB_WORLDSIGNALS);
export const loadGaiaOntology = () => _read(`/api/studio/gaia/ontology`, STUB_GAIA);

// ── HDT — the human twin (closes the triangle) ──
export interface HdtObservation { observation_id: string; subject: string; code: string; omega_state: string; epistemic_mode?: string | null; canonical: boolean; recorded_at?: string | null }
export interface OmegaStep { state: string; epistemic_human: string; epistemic_model: string; canonical: boolean }
export interface HdtOntology { omega_states: string[]; omega_epistemic_lattice: OmegaStep[]; kfs_triad: Record<string, string>; invariant: string; three_twins_closed: Record<string, string> }

const STUB_HDT: { observations: HdtObservation[]; count: number } = {
  count: 2,
  observations: [
    { observation_id: "proj-demo:hdtobs:hr", subject: "person:kim", code: "8867-4", omega_state: "DELIVERED", epistemic_mode: "attested", canonical: true, recorded_at: "1h ago" },
    { observation_id: "proj-demo:hdtobs:bp", subject: "person:kim", code: "85354-9", omega_state: "SEEDED", epistemic_mode: "observed", canonical: false, recorded_at: "3m ago" }],
};
const STUB_HDT_ONT: HdtOntology = {
  omega_states: ["ABSENT", "SEEDED", "NORMALIZED", "LINKED", "TRUSTED", "ACTIONABLE", "DELIVERED"],
  kfs_triad: { CBD: "Cognition", CGT: "Values", NHY: "Action" },
  invariant: "a model may advance an observation but only a human/clinician/policy actor may DELIVER to canonical human-actionable truth",
  three_twins_closed: { knowledge: "HellGraph · observed→attested", human: "HDT · ABSENT→DELIVERED", earth: "GAIA · EvidenceOnly→Promoted" },
  omega_epistemic_lattice: [
    { state: "ABSENT", epistemic_human: "observed", epistemic_model: "hypothesis", canonical: false },
    { state: "SEEDED", epistemic_human: "observed", epistemic_model: "hypothesis", canonical: false },
    { state: "NORMALIZED", epistemic_human: "observed", epistemic_model: "derived", canonical: false },
    { state: "LINKED", epistemic_human: "observed", epistemic_model: "derived", canonical: false },
    { state: "TRUSTED", epistemic_human: "verified", epistemic_model: "verified", canonical: false },
    { state: "ACTIONABLE", epistemic_human: "verified", epistemic_model: "verified", canonical: false },
    { state: "DELIVERED", epistemic_human: "attested", epistemic_model: "attested", canonical: true }],
};

export const loadHdt = (project: string) => _read(`/api/studio/hdt?project=${encodeURIComponent(project)}`, STUB_HDT);
export const loadHdtOntology = () => _read(`/api/studio/hdt/ontology`, STUB_HDT_ONT);

export async function submitHdtObservation(input: { project: string; subject: string; code: string; value?: string; actor_kind?: string }, token: string): Promise<{ observation_id: string; omega_state: string; epistemic_mode: string }> {
  if (!BASE) return { observation_id: `stub:${input.code}`, omega_state: "SEEDED", epistemic_mode: input.actor_kind === "model" ? "hypothesis" : "observed" };
  if (!token) throw new Error("write token required");
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/hdt/observation`, { method: "POST", headers: writeHeaders(token), body: JSON.stringify(input) });
  if (!res.ok) throw writeError("submit failed", res.status);
  return await res.json();
}

export async function promoteHdt(input: { project: string; observation: string; to_state: string; actor_kind?: string }, token: string): Promise<{ to_state: string; epistemic_mode: string; canonical: boolean } | { blocked: true; message: string }> {
  if (!BASE) return input.actor_kind === "model" && input.to_state === "DELIVERED" ? { blocked: true, message: "HDT invariant — only a human/clinician/policy may DELIVER to canonical" } : { to_state: input.to_state, epistemic_mode: input.to_state === "DELIVERED" ? "attested" : "observed", canonical: input.to_state === "DELIVERED" };
  if (!token) throw new Error("write token required");
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/hdt/promote`, { method: "POST", headers: writeHeaders(token), body: JSON.stringify(input) });
  if (res.status === 403 || res.status === 422) {
    const d = (await res.json().catch(() => ({}))) as { detail?: { message?: string } | string };
    return { blocked: true, message: typeof d.detail === "object" ? (d.detail.message ?? "blocked") : (d.detail ?? "blocked") };
  }
  if (!res.ok) throw writeError("promote failed", res.status);
  return await res.json();
}

export async function invokeAction(input: { project: string; action: string; target: string; args: Record<string, unknown> }, token: string): Promise<{ invocation_id: string; applied: string[]; receipt: { correlation_id: string } }> {
  if (!BASE) return { invocation_id: "stub:inv", applied: ["set acsetAttrName"], receipt: { correlation_id: "act-stub" } };
  if (!token) throw new Error("write token required");
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/action/invoke`, { method: "POST", headers: writeHeaders(token), body: JSON.stringify(input) });
  if (!res.ok) {
    let msg = `${res.status}`;
    try { const j = await res.json(); msg = typeof j.detail === "object" ? JSON.stringify(j.detail.violations ?? j.detail) : (j.detail ?? msg); } catch { /* */ }
    throw new Error(`invoke failed: ${msg}`);
  }
  return await res.json();
}

export async function submitWorldsignal(input: { project: string; feature_id: string; signal_type: string; confidence?: number; evidence_refs?: string[]; actor_kind?: string }, token: string): Promise<{ signal_id: string; promotion_state: string; epistemic_mode: string }> {
  if (!BASE) return { signal_id: `stub:${input.feature_id}`, promotion_state: "EvidenceOnly", epistemic_mode: input.actor_kind === "model" ? "derived" : "observed" };
  if (!token) throw new Error("write token required");
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/worldsignal`, { method: "POST", headers: writeHeaders(token), body: JSON.stringify(input) });
  if (!res.ok) throw writeError("submit failed", res.status);
  return await res.json();
}

export async function promoteWorldsignal(input: { project: string; signal: string; to_state: string; actor_kind?: string; policy_id?: string }, token: string): Promise<{ to_state: string; epistemic_mode: string; canonical: boolean } | { blocked: true; message: string }> {
  if (!BASE) return input.actor_kind === "model" && input.to_state === "Promoted" ? { blocked: true, message: "GAIA invariant #2 — a model may not Promote to canonical" } : { to_state: input.to_state, epistemic_mode: input.to_state === "Promoted" ? "attested" : "observed", canonical: input.to_state === "Promoted" };
  if (!token) throw new Error("write token required");
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/worldsignal/promote`, { method: "POST", headers: writeHeaders(token), body: JSON.stringify(input) });
  if (res.status === 403 || res.status === 422) {
    const d = (await res.json().catch(() => ({}))) as { detail?: { message?: string } | string };
    return { blocked: true, message: typeof d.detail === "object" ? (d.detail.message ?? "blocked") : (d.detail ?? "blocked") };
  }
  if (!res.ok) throw writeError("promote failed", res.status);
  return await res.json();
}

// ── Universal Compute Plane — the compute-gateway: one governed door for ALL compute ──
// A single catalog of compute KINDS (notebook, graph-query, spark, inference, …), each declaring its
// backends, capabilities, a DEFAULT epistemic warrant, whether it executes user code, a live/declared
// status and whether the caller is entitled. Every run returns a proof-carrying receipt (optionally
// signed) + an epistemic status. The Studio BFF proxies to the gateway; unset BASE → honest STUB.
export interface ComputeKind {
  kind: string;
  backends: string[];
  default: string;              // default backend
  capabilities: string[];
  epistemic: string;            // default epistemic warrant for this kind's results (ramp mode)
  executes_user_code: boolean;
  status: "live" | "declared";  // live = runnable now; declared = catalogued, not yet provisioned
  entitled: boolean;
}
export interface ComputeOutput { type: string; text?: string; data?: unknown; mime?: string | string[] }
export interface ComputeReceipt {
  id: string; kind: string; backend: string; epistemic_status: string;
  inputs_sha?: string; outputs_sha?: string; prev?: string | null; ts?: number;
  signature?: string | null; public_key?: string | null;   // Ed25519 over the in-toto statement
  [k: string]: unknown;
}
// Zero-trust conformance (compute-gateway ⇄ OUR mcp-a2a-zero-trust kernel).
export interface ComputeGrantCheck { operation?: string; grant_id?: string; result?: { valid?: boolean; reason?: string } }
export interface ComputeAttestation { results?: { tpm_valid?: boolean; cosign_valid?: boolean; fido2_valid?: boolean } }
export interface ComputeResultLite {
  status: "ok" | "error" | "degraded" | "entitlement_required" | "grant_required";
  kind: string; backend: string; epistemic_status: string;
  outputs: ComputeOutput[];
  receipt?: ComputeReceipt | null;
  // the gateway returns the provenance subgraph itself (arrays), not counts.
  graph_delta?: { nodes?: unknown[]; edges?: unknown[]; written?: boolean } | null;
  degraded?: string | null;
  error?: string | null;
  entitlement_required?: boolean;
  message?: string | null;              // gateway's pay-gate / grant message (top-level)
  grant_check?: ComputeGrantCheck | null;
  attestation?: ComputeAttestation | null;
  memoized?: boolean;                   // served from the content-addressed compute memo
}

// STUB catalog — MIRRORS the real compute-gateway registry (backends + warrants) so the offline preview
// never misrepresents the live plane. notebook/graph/spark are live; inference is declared (adapter wired,
// endpoint unverified) and left un-entitled so the pay-gate card is demonstrable standalone.
const STUB_COMPUTE_REGISTRY: { kinds: ComputeKind[] } = {
  kinds: [
    { kind: "notebook", backends: ["forge"], default: "forge",
      capabilities: ["python", "r", "julia", "stateful-kernel"], epistemic: "derived",
      executes_user_code: true, status: "live", entitled: true },
    { kind: "graph-query", backends: ["hellgraph"], default: "hellgraph",
      capabilities: ["label-query", "subgraph"], epistemic: "observed",
      executes_user_code: false, status: "live", entitled: true },
    { kind: "graph-stats", backends: ["hellgraph"], default: "hellgraph",
      capabilities: ["counts", "analytics"], epistemic: "observed",
      executes_user_code: false, status: "live", entitled: true },
    { kind: "spark", backends: ["spark-runner"], default: "spark-runner",
      capabilities: ["sql", "dataframe"], epistemic: "derived",
      executes_user_code: true, status: "live", entitled: true },
    { kind: "inference", backends: ["model-server"], default: "model-server",
      capabilities: ["chat", "embed"], epistemic: "derived",
      executes_user_code: false, status: "declared", entitled: false },
    { kind: "workflow", backends: ["gateway"], default: "gateway",
      capabilities: ["dag", "compose", "fan-in", "memoized-steps"], epistemic: "derived",
      executes_user_code: false, status: "live", entitled: true },
  ],
};

export async function loadComputeRegistry(project: string): Promise<{ kinds: ComputeKind[] }> {
  const b = nbBase();
  if (!b) return STUB_COMPUTE_REGISTRY;
  const r = await fetch(`${b}/api/studio/compute/registry?project=${encodeURIComponent(project)}`, { headers: { accept: "application/json" } }).catch(() => null);
  if (!r || !r.ok) return STUB_COMPUTE_REGISTRY;
  const d = await r.json();
  return Array.isArray(d?.kinds) ? d : STUB_COMPUTE_REGISTRY;
}

export async function runCompute(input: { kind: string; spec: Record<string, unknown>; project: string; backend?: string }): Promise<ComputeResultLite> {
  const b = nbBase();
  // honest stub: no BASE → we do NOT fake a real result; the surface shows the compute plane isn't wired.
  if (!b) return {
    status: "degraded", kind: input.kind, backend: input.backend ?? "—",
    epistemic_status: "hypothesis", outputs: [], receipt: null,
    graph_delta: { nodes: [], edges: [] },
    degraded: "compute plane not wired (dev preview)",
  };
  const r = await fetch(`${b}/api/studio/compute/run`, {
    method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(input),
  });
  // the gateway returns 200 with status:"entitlement_required"|"grant_required" for a soft gate; a 402 is
  // also honoured for parity with a hard pay-gate. Either way the body carries the typed result.
  if (r.status === 402) return (await r.json()) as ComputeResultLite;
  if (!r.ok) throw new Error(`compute run failed (HTTP ${r.status})`);
  return (await r.json()) as ComputeResultLite;
}

// ── Planner — the capability registry as an agent ACTION SPACE (layer 6) ──
// Desired capabilities → a governed workflow PLAN (preview, free): observed reads fan
// out, then derivations fan in. The surface hands `plan` straight to runCompute to
// execute it under full governance. Deterministic (strategy=capability-dag).
export interface ComputePlanStep {
  id: string; kind: string; backend: string; satisfies: string;
  epistemic: string; executes_user_code?: boolean; status?: string; entitled: boolean;
}
export interface ComputePlan {
  strategy: string; intent?: string | null;
  plan?: { kind: string; project: string; spec: { steps: unknown[] } } | null;
  steps: ComputePlanStep[];
  warrant_preview?: string;
  unmet_capabilities?: string[];
  unmet_entitlements?: string[];
  runnable?: boolean;
  degraded?: string;
}

export async function planCompute(input: { capabilities: string[]; project: string; intent?: string }): Promise<ComputePlan> {
  const b = nbBase();
  if (!b) return { strategy: "stub", steps: [], plan: null, runnable: false,
    degraded: "planner not wired (dev preview)" };
  const r = await fetch(`${b}/api/studio/compute/plan`, {
    method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error(`plan failed (HTTP ${r.status})`);
  return (await r.json()) as ComputePlan;
}

export async function loadStudio(projectId?: string): Promise<StudioBundle> {
  if (!BASE) return STUB;
  const q = projectId ? `?project=${encodeURIComponent(projectId)}` : "";
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio${q}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`studio load failed: ${res.status}`);
  return (await res.json()) as StudioBundle;
}
