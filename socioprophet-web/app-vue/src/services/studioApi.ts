// studioApi — the client for the Lattice Studio product surface (notebooks + data catalog + model catalog +
// tuning + experiments), the integrated Watson-Studio-class plane. Calls the studio BFF, which fronts the deployed
// Tier-9 fabric (lattice-studio notebooks, prophet-core-catalog, model-zoo-api, tritfabric/Ray, governance-ledger).
// VITE_STUDIO_API unset → STUB mode so the surface renders standalone until the BFF is wired. Everything is
// PROJECT-SCOPED: a projectId (Noetica proj- collection) threads through so notebooks/data/models/experiments all
// live in the same knowledge scope an agent team already retrieves.

const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_STUDIO_API;

export type StudioSection = "notebooks" | "data" | "models" | "tuning" | "experiments";

export interface Notebook { id: string; name: string; runtime: string; status: "idle" | "running" | "stopped"; updatedAt: string; kernel?: string }
export interface DataAsset { id: string; name: string; kind: string; rows?: number; catalog: string; governed: boolean }
export interface ModelCard { id: string; name: string; task: string; stage: "candidate" | "staged" | "promoted"; metric?: string }
export interface TuningRun { id: string; name: string; method: "lora" | "sae" | "circuit-probe" | "full"; status: "queued" | "running" | "done" | "failed"; backend: string }
export interface Experiment { id: string; title: string; reproducible: boolean; provenance: string; createdAt: string }

export interface StudioBundle {
  notebooks: Notebook[];
  data: DataAsset[];
  models: ModelCard[];
  tuning: TuningRun[];
  experiments: Experiment[];
  stub?: boolean;
}

const STUB: StudioBundle = {
  notebooks: [
    { id: "nb-1", name: "Exploratory analysis.ipynb", runtime: "prophet-python-ml", status: "idle", updatedAt: new Date().toISOString(), kernel: "python3" },
    { id: "nb-2", name: "LoRA fine-tune.ipynb", runtime: "prophet-ray-ml", status: "running", updatedAt: new Date().toISOString(), kernel: "ray" },
  ],
  data: [
    { id: "da-1", name: "customer_events", kind: "table", rows: 1_240_000, catalog: "prophet-core-catalog", governed: true },
    { id: "da-2", name: "corpus_v3", kind: "dataset", catalog: "prophet-core-catalog", governed: true },
  ],
  models: [
    { id: "m-1", name: "prophet-7b-lora", task: "chat", stage: "staged", metric: "MMLU 64.2" },
    { id: "m-2", name: "sae-residual-l12", task: "interpretability", stage: "candidate" },
  ],
  tuning: [
    { id: "t-1", name: "SAE on residual stream L12", method: "sae", status: "running", backend: "tritfabric/ray" },
    { id: "t-2", name: "Circuit probe — induction heads", method: "circuit-probe", status: "queued", backend: "tritfabric/ray" },
  ],
  experiments: [
    { id: "e-1", title: "Reproduce: LoRA vs full FT", reproducible: true, provenance: "in-toto + lockfile", createdAt: new Date().toISOString() },
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
