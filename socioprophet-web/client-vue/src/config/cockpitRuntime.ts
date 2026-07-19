// Runtime endpoint resolver — the ONE place that decides where each cockpit surface
// talks to, so a single build runs three ways without rebuilding:
//
//   • BearBrowser-embedded (sovereign) — the host injects loopback sidecar bases
//     (127.0.0.1) via window.__COCKPIT_CONFIG__; nothing egresses off-device.
//   • prophet-platform-hosted (connected) — the in-cluster nginx /svc/* + /api
//     proxies (the code fallbacks below).
//   • Firebase / local dev — VITE_* build-time env, unchanged.
//
// Precedence per service base:
//   host-injected runtime config  >  VITE_* build env  >  code fallback
//
// This preserves every existing default, so it's a no-op for the current hosted
// build; it only ADDS the ability for a host (BearBrowser, or a /config.json) to
// repoint surfaces at runtime. See BearBrowser docs/cockpit-composition-plan.md.

export type CockpitMode = 'sovereign' | 'connected';

interface CockpitRuntimeConfig {
  mode?: CockpitMode;
  bases?: Record<string, string>;
}

function injected(): CockpitRuntimeConfig {
  if (typeof window === 'undefined') return {};
  const c = (window as unknown as { __COCKPIT_CONFIG__?: CockpitRuntimeConfig }).__COCKPIT_CONFIG__;
  return c && typeof c === 'object' ? c : {};
}

const env = (import.meta as { env?: Record<string, string> }).env ?? {};

/**
 * Resolve a service base URL.
 * @param key      stable service key used in the injected runtime config (e.g. 'algo')
 * @param envVar   the build-time VITE_* var name (back-compat)
 * @param fallback code default (e.g. '/svc/algo'); omit for services that stub when unset
 */
export function resolveBase(key: string, envVar: string, fallback: string): string;
export function resolveBase(key: string, envVar: string): string | undefined;
export function resolveBase(key: string, envVar: string, fallback?: string): string | undefined {
  const host = injected().bases?.[key];
  if (host) return host;
  const fromEnv = env[envVar];
  if (fromEnv) return fromEnv;
  return fallback;
}

// Local-first is the sovereign stance, but a plain hosted build has no injected
// config, so 'connected' is the default there; BearBrowser explicitly declares
// 'sovereign' when it embeds the cockpit against loopback sidecars.
export const cockpitMode: CockpitMode = injected().mode ?? 'connected';
