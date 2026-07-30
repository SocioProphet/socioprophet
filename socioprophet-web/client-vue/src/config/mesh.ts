// Prophet Mesh connection (ST011) — LIVE on GKE.
//
// mesh.socioprophet.ai is the Model Choir / Conductor: an OpenAI-compatible gateway
// (GET /v1/models, POST /v1/chat/completions) that routes model=prophet-mesh to a
// vLLM seat. /v1/models is open; chat requires the mesh bearer token (MESH_AUTH_TOKEN,
// k8s secret prophet-mesh-auth). The operator pastes the token in Settings → Connections.
//
// STORAGE — token in sessionStorage, endpoint in localStorage.
// The endpoint URL is not sensitive; localStorage is fine.
// The bearer token was previously in localStorage, which meant any DOM-XSS anywhere in
// the app (or a malicious extension) could exfiltrate the token indefinitely — the raw
// grant stayed available across sessions until manually cleared. Moved to sessionStorage
// so an exfil's blast radius ends when the tab closes; a browser-restart re-entry is a
// small cost for closing that surface. A one-shot migration copies the legacy token from
// localStorage into sessionStorage on first read, then clears the localStorage entry so
// the raw secret does not linger.

const ENV_MESH = (import.meta as any).env?.VITE_MESH_BASE as string | undefined;
const LS_BASE = 'sp.conn.mesh';
const SS_TOKEN = 'sp.conn.mesh-token';
const LS_TOKEN_LEGACY = 'sp.conn.mesh-token';

export const DEFAULT_MESH_BASE = 'https://mesh.socioprophet.ai';
// Default to the muscular seat (Qwen3-32B on A100). The conductor routes 'xl' → that seat;
// it falls back to the always-on T4 'default' seat if xl is scaled down.
export const MESH_MODEL = 'xl';

// The mesh sends no CORS headers, so the browser can't call it cross-origin directly.
// Fetches go through a SAME-ORIGIN proxy path ('/mesh' → mesh.socioprophet.ai): the Vite
// dev server proxies it in dev; in prod the serving gateway must proxy /mesh the same way
// (or the conductor must add CORS). meshBase() below is the logical endpoint shown in the UI.
const MESH_FETCH = '/mesh';

function ls(key: string): string | null {
  try { return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; } catch { return null; }
}
function ss(key: string): string | null {
  try { return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null; } catch { return null; }
}

// One-time migration from the old localStorage location. If the legacy key EXISTS
// (present at all — including empty or whitespace-only), it is cleared. A real
// non-whitespace legacy token is copied to sessionStorage ONLY when sessionStorage
// has no live token; an empty/whitespace legacy value is discarded, not migrated
// verbatim.
// Copilot round-3: the legacy key must be cleared even when a live sessionStorage
// token already exists — otherwise the raw secret keeps lingering in localStorage
// for anyone who already re-set the token this session, which is the whole surface
// this move was meant to close. And an explicit '' in sessionStorage (a deliberate
// clear) must NOT trigger re-migration: distinguish `null` (missing) from `''`.
// Idempotent: after the legacy key is cleared, this is a no-op.
function runLegacyMigration(): void {
  const legacy = ls(LS_TOKEN_LEGACY);
  if (legacy === null) return;
  // Present — always clear, whatever the shape.
  try { localStorage.removeItem(LS_TOKEN_LEGACY); } catch { /* ignore */ }
  const trimmed = legacy.trim();
  if (!trimmed) return;
  // Only overwrite session when it has NO value at all (null). An explicitly-empty
  // session value is a user-intentional clear and must be respected.
  const current = ss(SS_TOKEN);
  if (current !== null) return;
  try { sessionStorage.setItem(SS_TOKEN, trimmed); } catch { /* private mode / disabled */ }
}

export function meshBase(): string {
  return (ls(LS_BASE) || ENV_MESH || DEFAULT_MESH_BASE).replace(/\/$/, '');
}
export function setMeshBase(url: string) { try { localStorage.setItem(LS_BASE, url.replace(/\/$/, '')); } catch { /* ignore */ } }
export function meshToken(): string {
  // Always run migration first: it clears the legacy key even if session already
  // has a value, and no-ops once the legacy key is gone.
  runLegacyMigration();
  return ss(SS_TOKEN) ?? '';
}
export function setMeshToken(t: string) { try { sessionStorage.setItem(SS_TOKEN, t.trim()); } catch { /* ignore */ } }

export interface MeshStatus { ok: boolean; status: number | null; detail: string; models: string[] }

// Real reachability probe against the live OpenAI-compatible gateway (via the same-origin proxy).
export async function checkMesh(_base = meshBase()): Promise<MeshStatus> {
  try {
    const res = await fetch(`${MESH_FETCH}/v1/models`, { headers: { accept: 'application/json' } });
    if (!res.ok) return { ok: false, status: res.status, detail: `reachable — HTTP ${res.status} at /v1/models`, models: [] };
    const body = await res.json();
    const models = Array.isArray(body?.data) ? body.data.map((m: any) => m.id) : [];
    return { ok: true, status: 200, detail: `connected — ${models.length} model(s)`, models };
  } catch {
    return { ok: false, status: null, detail: 'unreachable from browser (network or CORS)', models: [] };
  }
}

export interface MeshChatResult { content: string; model: string; seat?: string }

// Streaming chat through the mesh conductor (OpenAI SSE, stream=true). Calls onDelta for each
// token chunk so the UI renders as it generates — the Claude/OpenAI feel. Returns the final text.
export async function meshChatStream(
  messages: { role: string; content: string }[],
  onDelta: (t: string) => void,
): Promise<MeshChatResult> {
  const token = meshToken();
  if (!token) throw new Error('no mesh token — set it in Settings → Connections');
  const res = await fetch(`${MESH_FETCH}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ model: MESH_MODEL, messages, max_tokens: 1024, stream: true }),
  });
  if (!res.ok || !res.body) throw new Error(`mesh chat failed: HTTP ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '', content = '', model = MESH_MODEL;
  let seat: string | undefined;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      const l = line.trim();
      if (!l.startsWith('data:')) continue;
      const p = l.slice(5).trim();
      if (!p || p === '[DONE]') continue;
      try {
        const d = JSON.parse(p);
        const delta = d?.choices?.[0]?.delta?.content;
        if (delta) { content += delta; onDelta(delta); }
        if (d?.model) model = d.model;
        if (d?.prophet_mesh?.seat) seat = d.prophet_mesh.seat;
      } catch { /* skip partial frame */ }
    }
  }
  return { content, model, seat };
}

// Route a chat turn through the mesh conductor (OpenAI /v1/chat/completions). Requires the
// bearer token from Settings → Connections. Non-streaming for simplicity.
export async function meshChat(messages: { role: string; content: string }[]): Promise<MeshChatResult> {
  const token = meshToken();
  if (!token) throw new Error('no mesh token — set it in Settings → Connections');
  const res = await fetch(`${MESH_FETCH}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ model: MESH_MODEL, messages, max_tokens: 512 }),
  });
  if (!res.ok) throw new Error(`mesh chat failed: HTTP ${res.status}`);
  const body = await res.json();
  return {
    content: body?.choices?.[0]?.message?.content ?? '',
    model: body?.model ?? MESH_MODEL,
    seat: body?.prophet_mesh?.seat,
  };
}
