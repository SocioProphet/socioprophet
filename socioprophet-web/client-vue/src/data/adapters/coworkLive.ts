import { fetchT } from './http';
import { resolveBase } from '../../config/cockpitRuntime';
import { liveToThreads, type LiveThread, type CoworkThread } from '../coworkFixture';

// Live overlay for cowork: pull collaboration threads from the sovereign endpoint
// (`/api/cowork/threads`). Sovereign-safe — base resolved via `resolveBase` with NO
// code fallback, so an un-configured build returns null immediately (no egress) and
// the surface stays on the fixture. Any failure also returns null (fail-closed).

interface CoworkThreadsResponse {
  threads?: LiveThread[];
}

export async function fetchCoworkThreadsLive(): Promise<CoworkThread[] | null> {
  const base = resolveBase('delivery', 'VITE_DELIVERY_API');
  if (!base) return null;
  try {
    const res = await fetchT(`${base.replace(/\/$/, '')}/api/cowork/threads`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as CoworkThreadsResponse;
    const rooms = (body.threads ?? []).filter((t) => t && t.id && t.title && t.subject_ref);
    if (!rooms.length) return null;
    return liveToThreads(rooms);
  } catch {
    return null;
  }
}
