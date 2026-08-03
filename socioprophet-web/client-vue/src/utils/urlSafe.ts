/**
 * Scheme allow-list for URLs whose source is not the app rendering them.
 *
 * ESTATE SAFETY KIT — canonical source (SourceOS-Linux/sourceos-spec's estate-safety-kit/).
 * See estate-safety-kit/PROVENANCE.md in that repo for what this closes,
 * which repos hit the defect independently, and the vendoring contract every consumer
 * must follow (verbatim copy + PROVENANCE.txt + `tools/check_vendored_safety_kit.py`).
 * Do not edit a vendored copy directly — edit this file, re-vendor, done.
 *
 * Search results, ontology hits, mail links, ledger provenance, evidence-board links —
 * anything that lands in a `:href` from an upstream the app does not control (SearXNG
 * federates to arbitrary engines; mail arrives from anywhere; an evidence receipt may
 * cite any URI; a BFF's JSON is still an upstream even when it is estate-internal) must
 * NOT render as a live `<a>` unless the scheme is one a click cannot execute in-origin.
 * Vue does not sanitise `:href`, and `rel="noopener"` blocks only the tab reference —
 * the JS in a `javascript:` link runs before a tab exists.
 *
 * Fail closed to plain text for everything else (data:, vbscript:, javascript:, file:,
 * ftp:, blob:, about:, custom schemes, protocol-relative `//`). If a caller genuinely
 * wants mailto: or tel:, opt in via the second argument. That argument is INTERSECTED
 * with a fixed safe-extras set — a caller CANNOT re-enable `javascript:` / `data:` /
 * `vbscript:` by passing them in.
 *
 * Independently written twice before this file existed: `socioprophet-web/app-vue/src/
 * services/url-safe.ts` (SocioProphet/socioprophet#477, the Search.vue click-XSS) and
 * `socioprophet-web/client-vue/src/utils/urlSafe.ts` (SocioProphet/socioprophet#550, the
 * BoardTable evidence-link hardening) — copy-pasted rather than shared because the two
 * Vue packages do not share a workspace. Same logic both times; this is that logic, once.
 */

// The extras a caller may opt into. Everything not in this set is silently ignored
// when passed in `extra`, so `isSafeHttp(x, ['javascript'])` still returns false for
// a `javascript:` URL — the deny-list on executable schemes is ABSOLUTE.
const SAFE_EXTRAS: ReadonlySet<string> = new Set(['mailto', 'tel']);

export function isSafeHttp(url: unknown, extra: readonly string[] = []): boolean {
  if (typeof url !== 'string') return false;
  // Leading whitespace or control characters (0x00-0x20) historically let some
  // browsers strip them and re-parse a URL as its trailing scheme — a payload of
  // `"\tjavascript:..."` was executable in older Chromium and remains inconsistently
  // handled. If the caller wanted a URL it does not start with whitespace.
  if (/^[\s\x00-\x20]/.test(url)) return false;
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(url);
  if (!m) return false;
  const s = m[1].toLowerCase();
  if (s === 'http' || s === 'https') return true;
  // Normalise the extras callers pass — lowercase + trim — so a callsite passing
  // `['Mailto']` or `['MAILTO ']` is not mysteriously refused. The SAFE_EXTRAS filter
  // is what keeps this from becoming an XSS vector: only schemes in the fixed
  // safe-extras set can be enabled, regardless of what the caller passed in.
  for (const raw of extra) {
    if (typeof raw !== 'string') continue;
    const norm = raw.trim().toLowerCase();
    if (norm === s && SAFE_EXTRAS.has(norm)) return true;
  }
  return false;
}
