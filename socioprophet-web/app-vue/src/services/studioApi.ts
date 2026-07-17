// studioApi — client for the Lattice Studio product surface (notebooks + data catalog + model catalog + tuning +
// reproducible experiments), the integrated Watson-Studio-class plane. Calls the studio BFF, which fronts the
// deployed Tier-9 fabric (lattice-studio notebooks, prophet-core-catalog, model-zoo-api, tritfabric/Ray,
// governance-ledger). VITE_STUDIO_API unset → STUB mode so the surface renders standalone until the BFF is wired.
// Everything is PROJECT-SCOPED: a projectId (Noetica proj- collection) threads through so notebooks/data/models/
// experiments live in the same knowledge scope an agent team already retrieves.

const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_STUDIO_API;

export type StudioSection =
  | "notebooks" | "data" | "models" | "tuning" | "experiments"                 // Workbench
  | "extraction" | "ontology" | "graph" | "query" | "retrieval" | "generation"; // Knowledge engineering

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
export const EPISTEMIC_COLORS: Record<string, string> = {
  hypothesis: "#9aa0a6", observed: "#1a73e8", derived: "#8b5cf6",
  verified: "#137333", attested: "#00897b", simulated: "#b06000", unknown: "#c0c4c9",
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

export async function loadStudio(projectId?: string): Promise<StudioBundle> {
  if (!BASE) return STUB;
  const q = projectId ? `?project=${encodeURIComponent(projectId)}` : "";
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio${q}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`studio load failed: ${res.status}`);
  return (await res.json()) as StudioBundle;
}
