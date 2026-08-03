/**
 * Scheme allow-list for URLs whose source is not this app.
 *
 * Mirrors `app-vue/src/services/url-safe.ts` (same defect class, same fix — see
 * SocioProphet/socioprophet#477). Any `:href` bound from JSON an upstream service
 * returned is untrusted by construction: Vue does not sanitise `:href`, and
 * `rel="noopener"` blocks only the tab reference, not a `javascript:` payload,
 * which runs before a tab exists. Today's callers (dashboard-bff / catalog-gateway
 * evidence links) are estate-internal and effectively trusted, but the guard costs
 * nothing and closes the door before any producer becomes less trusted.
 *
 * Fail closed to plain text for everything else (data:, vbscript:, javascript:,
 * file:, ftp:, custom schemes). A caller wanting mailto:/tel: opts in via the
 * second argument; SAFE_EXTRAS makes that opt-in incapable of re-enabling an
 * executable scheme regardless of what the caller passes.
 */

const SAFE_EXTRAS: ReadonlySet<string> = new Set(['mailto', 'tel']);

export function isSafeHttp(url: unknown, extra: readonly string[] = []): boolean {
  if (typeof url !== 'string') return false;
  // Leading whitespace / control chars (0x00-0x20): some browsers have historically
  // stripped these before the scheme parse, so "\tjavascript:..." was executable.
  if (/^[\s\x00-\x20]/.test(url)) return false;
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(url);
  if (!m) return false;
  const s = m[1].toLowerCase();
  if (s === 'http' || s === 'https') return true;
  for (const raw of extra) {
    if (typeof raw !== 'string') continue;
    const norm = raw.trim().toLowerCase();
    if (norm === s && SAFE_EXTRAS.has(norm)) return true;
  }
  return false;
}
