// Prophet Mesh connection.
//
// The hosted Model Choir / Conductor mesh (ST011) at mesh.socioprophet.ai fronts the
// platform's data + model-routing backend. Setting VITE_MESH_BASE (or the per-browser
// override saved in Settings → Connections) points the app's API clients at the mesh
// instead of the local dev proxy, so the same SPA runs against a hosted cloud instance.

const ENV_MESH = (import.meta as any).env?.VITE_MESH_BASE as string | undefined;
const LS_KEY = 'sp.conn.mesh';

export const DEFAULT_MESH_BASE = 'https://mesh.socioprophet.ai';

export function meshBase(): string {
  let override: string | null = null;
  try { override = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null; } catch { /* ignore */ }
  return (override || ENV_MESH || DEFAULT_MESH_BASE).replace(/\/$/, '');
}

export function setMeshBase(url: string) {
  try { localStorage.setItem(LS_KEY, url.replace(/\/$/, '')); } catch { /* ignore */ }
}

export interface MeshStatus { ok: boolean; status: number | null; detail: string }

// Honest reachability probe. A browser fetch to the mesh will succeed, 404 (host up,
// route not exposed), or throw (network / CORS). We report exactly what we observe —
// never a fake "connected".
export async function checkMesh(base = meshBase()): Promise<MeshStatus> {
  for (const path of ['/health', '/v1/overview', '/']) {
    try {
      const res = await fetch(`${base}${path}`, { method: 'GET', mode: 'cors' });
      if (res.ok) return { ok: true, status: res.status, detail: `connected (${path})` };
      // reachable but this route isn't there — keep trying, remember the last status
      if (path === '/') return { ok: false, status: res.status, detail: `reachable — host up, BFF routes not exposed yet (HTTP ${res.status})` };
    } catch {
      if (path === '/') return { ok: false, status: null, detail: 'unreachable from browser (network or CORS)' };
    }
  }
  return { ok: false, status: null, detail: 'unreachable' };
}
