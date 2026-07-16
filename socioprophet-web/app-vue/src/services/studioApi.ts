// studioApi — client for the Lattice Studio product surface (notebooks + data catalog + model catalog + tuning +
// reproducible experiments), the integrated Watson-Studio-class plane. Calls the studio BFF, which fronts the
// deployed Tier-9 fabric (lattice-studio notebooks, prophet-core-catalog, model-zoo-api, tritfabric/Ray,
// governance-ledger). VITE_STUDIO_API unset → STUB mode so the surface renders standalone until the BFF is wired.
// Everything is PROJECT-SCOPED: a projectId (Noetica proj- collection) threads through so notebooks/data/models/
// experiments live in the same knowledge scope an agent team already retrieves.

const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_STUDIO_API;

export type StudioSection =
  | "notebooks" | "data" | "models" | "tuning" | "experiments"          // Workbench
  | "extraction" | "ontology" | "graph" | "retrieval" | "generation";   // Knowledge engineering

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

export interface StudioBundle {
  notebooks: Notebook[]; data: DataAsset[]; models: ModelCard[]; tuning: TuningRun[]; experiments: Experiment[];
  extraction: ExtractionSource[]; ontology: OntologyItem[]; graph: GraphStat[]; retrieval: RetrievalIndex[]; generation: GenerationRun[];
  stub?: boolean;
}

export const SECTION_COUNT = (b: StudioBundle | null, s: StudioSection): number => (b ? (b[s]?.length ?? 0) : 0);

const now = () => new Date().toISOString();
const STUB: StudioBundle = {
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
export interface GraphView {
  project: string; projectCollection: string;
  nodes: GraphNode[]; count: number; epistemic_distribution: Record<string, number>;
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
  count: 5, epistemic_distribution: { verified: 1, observed: 2, derived: 1, hypothesis: 1 }, stub: true,
};

export async function loadGraph(project: string): Promise<GraphView> {
  if (!BASE) return STUB_GRAPH;
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio/graph?project=${encodeURIComponent(project)}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`graph load failed: ${res.status}`);
  return (await res.json()) as GraphView;
}

export async function loadStudio(projectId?: string): Promise<StudioBundle> {
  if (!BASE) return STUB;
  const q = projectId ? `?project=${encodeURIComponent(projectId)}` : "";
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio${q}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`studio load failed: ${res.status}`);
  return (await res.json()) as StudioBundle;
}
