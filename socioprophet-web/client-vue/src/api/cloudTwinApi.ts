// Cloud-Twin API client.
//
// Fronts the cloud-twin service on prophet-platform (GenesisSeed -> verified Twin
// -> replayable TwinEventEnvelope stream; the Cybernetic Agentic Genesis model).
// Mirrors the personGraphApi.ts / gaiaMap.ts pattern: an env-configured base, a
// getJson wrapper, and *WithFallback variants that return a deterministic fixture
// when the backend is absent (so the SPA renders in fixture mode).
//
// Service contract (apps/cloud-twin): GET /twins, POST /twins (422 fail-closed on
// an invalid seed), GET /twins/{id}/events, GET /health. The list endpoint is the
// expected read seam; until it is live the SPA renders the fixture registry.

const API_BASE =
  (import.meta as any).env?.VITE_CLOUD_TWIN_API_BASE || '/api';

export type TwinState = 'created' | 'authorized' | 'verified';

export interface Twin {
  id: string;
  kind: string;
  label: string;
  hologram: string;
  state: TwinState;
  principal: string;
  events: number;
  created: string; // ISO-8601
}

// The lifecycle event the service emits on each transition (schema:
// sourceos-spec TwinEventEnvelope, vendored into apps/cloud-twin).
export interface TwinEventEnvelope {
  type: string; // twin.created | twin.authorized | twin.verified
  twin_id: string;
  seq: number;
  payload: string;
  ts: string; // ISO-8601
}

// The formation artifact POSTed to build a twin (schema: GenesisSeed).
export interface GenesisSeed {
  kind: string;
  label?: string;
  hologram_ref: string;
  authorization: string;
}

export interface TwinCounts {
  total: number;
  verified: number;
  authorized: number;
  created: number;
}

export interface TwinRegistrySnapshot {
  twins: Twin[];
  counts: TwinCounts;
}

export type TwinMode = 'live' | 'fixture';

export interface TwinRegistryLoadResult {
  snapshot: TwinRegistrySnapshot;
  mode: TwinMode;
  error?: string;
}

export function twinCounts(twins: Twin[]): TwinCounts {
  return {
    total: twins.length,
    verified: twins.filter((t) => t.state === 'verified').length,
    authorized: twins.filter((t) => t.state === 'authorized').length,
    created: twins.filter((t) => t.state === 'created').length,
  };
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${path}`);
  }
  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    // The service is fail-closed: an invalid GenesisSeed is a 422 with a reason.
    let reason = `${response.status} ${response.statusText}`;
    try {
      const detail = (await response.json()) as { detail?: unknown };
      if (detail?.detail) reason = `${response.status}: ${JSON.stringify(detail.detail)}`;
    } catch {
      /* non-JSON error body — keep the status line */
    }
    throw new Error(reason);
  }
  return response.json() as Promise<T>;
}

export async function fetchTwins(): Promise<Twin[]> {
  // Accept either a bare array or a { twins: [...] } envelope.
  const raw = await getJson<Twin[] | { twins: Twin[] }>('/twins');
  return Array.isArray(raw) ? raw : raw.twins;
}

export async function fetchTwinRegistryWithFallback(): Promise<TwinRegistryLoadResult> {
  try {
    const twins = await fetchTwins();
    return { snapshot: { twins, counts: twinCounts(twins) }, mode: 'live' };
  } catch (error) {
    const twins = demoTwins();
    return {
      snapshot: { twins, counts: twinCounts(twins) },
      mode: 'fixture',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function buildTwin(seed: GenesisSeed): Promise<Twin> {
  return postJson<Twin>('/twins', { type: 'GenesisSeed', ...seed });
}

export async function fetchTwinEvents(twinId: string): Promise<TwinEventEnvelope[]> {
  return getJson<TwinEventEnvelope[]>(`/twins/${encodeURIComponent(twinId)}/events`);
}

// ── Client-side fail-closed validation, mirroring the service's SeedValidationError ──
export function validateSeed(seed: Partial<GenesisSeed>): string | null {
  if (!seed.kind) return 'field "kind" is required';
  if (!seed.hologram_ref) return 'field "hologram_ref" is required (no base semantic rep)';
  if (!seed.authorization) return 'field "authorization" (principal) required to authorize the twin';
  return null;
}

// The lifecycle order the service walks a seed through.
export const TWIN_LIFECYCLE: TwinState[] = ['created', 'authorized', 'verified'];

// ── Fixture — the demo twin registry the service would return ──
function twin(
  id: string,
  kind: string,
  label: string,
  hologram: string,
  state: TwinState,
  principal: string,
): Twin {
  return {
    id,
    kind,
    label,
    hologram,
    state,
    principal,
    events: TWIN_LIFECYCLE.indexOf(state) + 1,
    created: new Date(Date.now() - (TWIN_LIFECYCLE.indexOf(state) + 1) * 3_600_000).toISOString(),
  };
}

export function demoTwins(): Twin[] {
  return [
    twin('twn_mkt-0001', 'market', 'ASX reporting twin', 'holo:mkt/asx-daily', 'verified', 'svc/market-replay'),
    twin('twn_dev-0002', 'device', 'Fog gateway edge-01', 'holo:dev/fog-edge-01', 'verified', 'svc/device-service'),
    twin('twn_prt-0003', 'portfolio', 'Capital-markets book', 'holo:pf/cm-book', 'authorized', 'user/analyst-3'),
    twin('twn_cit-0004', 'citizen', 'Citizen-IoT cohort β', 'holo:cit/iot-beta', 'created', 'user/ops-1'),
    twin('twn_hlt-0005', 'health', 'Digital health twin', 'holo:hlt/dht-wall3', 'verified', 'svc/health-twin'),
  ];
}

export function demoTwinEvents(t: Twin): TwinEventEnvelope[] {
  const upto = TWIN_LIFECYCLE.indexOf(t.state);
  const payloads: Record<TwinState, string> = {
    created: `hologram=${t.hologram}`,
    authorized: `principal=${t.principal}`,
    verified: `attestation=urn:sp:attest:${t.id}`,
  };
  return TWIN_LIFECYCLE.slice(0, upto + 1).map((st, i) => ({
    type: `twin.${st}`,
    twin_id: t.id,
    seq: i + 1,
    payload: payloads[st],
    ts: new Date(Date.parse(t.created) + i * 400).toISOString(),
  }));
}
