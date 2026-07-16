// studioApi — client for the Lattice Studio product surface (notebooks + data catalog + model catalog + tuning +
// reproducible experiments), the integrated Watson-Studio-class plane. Calls the studio BFF, which fronts the
// deployed Tier-9 fabric (lattice-studio notebooks, prophet-core-catalog, model-zoo-api, tritfabric/Ray,
// governance-ledger). VITE_STUDIO_API unset → STUB mode so the surface renders standalone until the BFF is wired.
// Everything is PROJECT-SCOPED: a projectId (Noetica proj- collection) threads through so notebooks/data/models/
// experiments live in the same knowledge scope an agent team already retrieves.

const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_STUDIO_API;

export type StudioSection = "notebooks" | "data" | "models" | "tuning" | "experiments";

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

export interface StudioBundle {
  notebooks: Notebook[]; data: DataAsset[]; models: ModelCard[]; tuning: TuningRun[]; experiments: Experiment[];
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
  stub: true,
};

export async function loadStudio(projectId?: string): Promise<StudioBundle> {
  if (!BASE) return STUB;
  const q = projectId ? `?project=${encodeURIComponent(projectId)}` : "";
  const res = await fetch(`${BASE.replace(/\/$/, "")}/api/studio${q}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`studio load failed: ${res.status}`);
  return (await res.json()) as StudioBundle;
}
