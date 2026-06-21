import { useAuth } from "../stores/auth";

// Thin client for the authenticated /api/builds backend.
async function authed(path: string, init: RequestInit = {}) {
  const token = await useAuth().idToken();
  const res = await fetch(`/api/builds${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `request failed (${res.status})`);
  return data;
}

export interface BuildSpec {
  edition: "desktop" | "server" | "edge";
  arch: "x86_64" | "aarch64";
  hostname: string;
  packages: string[];
  services?: Record<string, boolean>;
  users?: { name: string; groups?: string[] }[];
  moduleSnippet?: string;
}

export const whoami = () => authed("/whoami");
export const createBuild = (spec: BuildSpec) =>
  authed("/", { method: "POST", body: JSON.stringify({ spec }) });
export const listBuilds = () => authed("/");
export const getBuild = (id: string) => authed(`/${id}`);

// Fleet (premium) — separate /api/fleet base.
async function fleet(path: string, init: RequestInit = {}) {
  const token = await useAuth().idToken();
  const res = await fetch(`/api/fleet${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `request failed (${res.status})`);
  return data;
}
export const listDevices = () => fleet("/devices");
export const registerDevice = (name: string) =>
  fleet("/devices", { method: "POST", body: JSON.stringify({ name }) });
export const assignBuild = (deviceId: string, buildId: string) =>
  fleet(`/devices/${deviceId}/assign`, { method: "POST", body: JSON.stringify({ buildId }) });
