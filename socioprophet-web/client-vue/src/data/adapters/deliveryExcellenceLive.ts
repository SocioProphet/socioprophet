import { fetchT } from './http';
import { resolveBase } from '../../config/cockpitRuntime';
import { githubIssuesToTasks, type GithubIssue, type WbsTask } from '../wbsFixture';

// Live overlay for the sovereign WBS: pull open tasks from the sovereign delivery
// endpoint (`/api/delivery/tasks`) — the estate's own store, which itself mirrors
// GitHub issues / Taskwarrior during cutover. Sovereign-safe by construction:
//
//   • The base is resolved via `resolveBase` with NO code fallback. When a host
//     hasn't injected a delivery base (the default hosted/dev build), this returns
//     `undefined` → we return null immediately and NOTHING egresses off-device.
//   • Any failure returns null → the surface falls back to the sovereign fixture.
//
// There is no direct GitHub API call here (per AGENTS.md "do not invent GitHub
// integration"); GitHub issues reach us only THROUGH the sovereign endpoint, which
// is exactly the cutover posture — the platform owns the tasks, GitHub is a mirror.

interface DeliveryTasksResponse {
  issues?: GithubIssue[];
}

export async function fetchDeliveryTasksLive(): Promise<WbsTask[] | null> {
  const base = resolveBase('delivery', 'VITE_DELIVERY_API');
  if (!base) return null; // fail-closed: no sovereign base configured → fixture only
  try {
    const res = await fetchT(`${base.replace(/\/$/, '')}/api/delivery/tasks`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as DeliveryTasksResponse;
    const issues = (body.issues ?? []).filter((i) => i && i.number != null && i.title && i.html_url);
    if (!issues.length) return null;
    return githubIssuesToTasks(issues);
  } catch {
    return null;
  }
}
