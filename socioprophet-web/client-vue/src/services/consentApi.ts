// Consent board API client.
//
// The transparency surface for the self-sovereign consent plane: it reads the
// person's own consent state (what could be observed about them, and what could
// be done on their behalf) and lets them grant/revoke each one. Mirrors the
// personGraphApi pattern: an env-configured base via resolveBase, a getJson
// wrapper, and a *WithFallback variant returning a deterministic fixture
// (everything off) so the SPA renders with no backend.
//
// This client shows consent STATE and toggles it; it defines no capture path.
import { resolveBase } from '../config/cockpitRuntime';

const BASE = resolveBase('consent', 'VITE_CONSENT_BASE', '/svc/consent');

export type ConsentState = 'granted' | 'denied' | 'revoked';
export type EffectiveMode = 'off' | 'per-use' | 'standing-session' | 'standing-persistent';
export type Sensitivity = 'benign' | 'personal' | 'sensitive';
export type SurfaceCategory = 'model' | 'policy' | 'app' | 'device';
export type ConsentMode = 'live' | 'fixture';

export interface TelemetrySurface {
  surfaceId: string;
  category: SurfaceCategory;
  sensitivity: Sensitivity;
  pii: boolean;
  defaultStandard: 'standing-persistent';
  effectiveMode: EffectiveMode;
  userOverride: boolean;
  explanation: string;
  projectionMode: 'LOSSLESS' | 'LOSSY' | 'OPAQUE_HANDLE_ONLY';
  purpose: string;
  consent: { state: ConsentState; grantedAt?: string | null; revokedAt?: string | null; grantRef?: string };
}

export interface Capability {
  capabilityId: string;
  riskClass: string;
  defaultStandard: EffectiveMode;
  effectiveMode: EffectiveMode;
  userOverride: boolean;
  defaultState: 'enabled' | 'disabled';
  explanation: string;
  oneShot?: boolean;
  consent?: { state: ConsentState };
}

export interface ConsentSnapshot {
  subjectPrincipal: string;
  collectorPrincipal: string; // self-sovereign: equals subjectPrincipal
  surfaces: TelemetrySurface[];
  capabilities: Capability[];
}

export interface ConsentLoadResult {
  snapshot: ConsentSnapshot;
  mode: ConsentMode;
  error?: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json() as Promise<T>;
}

export async function fetchConsentSnapshot(): Promise<ConsentSnapshot> {
  return getJson<ConsentSnapshot>('/snapshot');
}

export async function fetchConsentWithFallback(): Promise<ConsentLoadResult> {
  try {
    const snapshot = await fetchConsentSnapshot();
    return { snapshot, mode: 'live' };
  } catch (error) {
    return {
      snapshot: demoConsentSnapshot(),
      mode: 'fixture',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Grant or revoke a surface/capability. Fail-open-local: with no backend the change is local-only.
 *
 * POST, not GET. These calls change what may be observed about a person, and a state-changing GET
 * is reachable by a link, a browser prefetch or a cross-site <img> — consent could be granted or
 * revoked without the person acting. Credentials ride along so the server binds the change to the
 * authenticated subject rather than trusting an id in the URL.
 */
export async function setConsent(id: string, grant: boolean): Promise<{ id: string; state: ConsentState; mode: ConsentMode }> {
  try {
    const res = await fetch(`${BASE}/${grant ? 'grant' : 'revoke'}/${encodeURIComponent(id)}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${id}`);
    const r = (await res.json()) as { id: string; state: ConsentState };
    return { ...r, mode: 'live' };
  } catch {
    return { id, state: grant ? 'granted' : 'revoked', mode: 'fixture' };
  }
}

// ── Fixture — everything OFF, every row explained (the honest default view) ──
const SELF = 'urn:srcos:principal:self';

function surface(
  surfaceId: string, category: SurfaceCategory, sensitivity: Sensitivity, pii: boolean,
  projectionMode: TelemetrySurface['projectionMode'], explanation: string, purpose: string,
): TelemetrySurface {
  return {
    surfaceId, category, sensitivity, pii,
    defaultStandard: 'standing-persistent', effectiveMode: 'off', userOverride: false,
    explanation, projectionMode, purpose, consent: { state: 'denied' },
  };
}

function capability(
  capabilityId: string, riskClass: string, defaultStandard: EffectiveMode,
  explanation: string, oneShot: boolean,
): Capability {
  return {
    capabilityId, riskClass, defaultStandard, effectiveMode: 'off', userOverride: false,
    defaultState: 'disabled', explanation, oneShot, consent: { state: 'denied' },
  };
}

export function demoConsentSnapshot(): ConsentSnapshot {
  return {
    subjectPrincipal: SELF,
    collectorPrincipal: SELF, // self-sovereign: same principal
    surfaces: [
      surface('telemetry:model:tokens_used', 'model', 'benign', false, 'LOSSLESS', 'Track how many tokens you use.', 'operate'),
      surface('telemetry:model:inference_route', 'model', 'benign', false, 'LOSSLESS', 'See which model handled each request.', 'operate'),
      surface('telemetry:model:latency', 'model', 'benign', false, 'LOSSLESS', 'See how fast responses come back.', 'operate'),
      surface('telemetry:policy:gate_verdict', 'policy', 'benign', false, 'LOSSLESS', 'See every time the agent asked to use a tool, and what was decided.', 'operate'),
      surface('telemetry:policy:consent_change', 'policy', 'benign', false, 'LOSSLESS', 'Keep an audit trail of your own privacy choices.', 'operate'),
      surface('telemetry:app:session_lifecycle', 'app', 'personal', false, 'LOSSY', 'Know when sessions start, stop, or crash.', 'operate'),
      surface('telemetry:app:active_surface', 'app', 'personal', false, 'LOSSY', 'A coarse label of which kind of surface is active — never what is in it.', 'operate'),
      surface('telemetry:device:node_id', 'device', 'sensitive', true, 'OPAQUE_HANDLE_ONLY', 'A random ID for this install so your fleet view can tell your own devices apart. Not tied to your hardware.', 'operate'),
      surface('telemetry:device:os_release', 'device', 'benign', false, 'LOSSLESS', 'Which OS and version this device runs.', 'operate'),
    ],
    capabilities: [
      capability('microphone', 'sensor', 'standing-session', 'Listen while you are talking to the agent. Audio stays on this device and is not kept.', false),
      capability('camera', 'sensor', 'per-use', 'Use the camera. You are asked every single time; there is no always-allow.', true),
      capability('screen_capture', 'sensor', 'per-use', 'Read your screen. Asked every single time.', true),
      capability('control_my_computer', 'high_actuator', 'per-use', 'Act on this computer for you. Every action asks first.', true),
      capability('send_on_behalf', 'outward_action', 'per-use', 'Send a message or post as you. Asked every time.', true),
    ],
  };
}
