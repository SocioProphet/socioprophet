/**
 * Scheme allow-list for URLs whose source is not this app.
 *
 * Search results, ontology hits, mail links, ledger provenance — anything that lands in
 * a `:href` from an upstream we do not control (SearXNG federates to arbitrary engines;
 * mail arrives from anywhere; an evidence receipt may cite any URI) must NOT render as a
 * live `<a>` unless the scheme is one a click cannot execute in-origin. Vue does not
 * sanitise `:href`, and `rel="noopener"` blocks only the tab reference — the JS in a
 * `javascript:` link runs before a tab exists.
 *
 * Fail closed to plain text for everything else (data:, vbscript:, javascript:, file:,
 * ftp:, custom schemes). If a caller genuinely wants mailto: or tel:, opt in via the
 * second argument. That second argument is INTERSECTED with a fixed safe-extras set —
 * a caller CANNOT re-enable `javascript:` / `data:` / `vbscript:` by passing them in.
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
  // Copilot round-2: normalise the extras callers pass — lowercase + trim — so a
  // callsite passing `['Mailto']` or `['MAILTO ']` is not mysteriously refused. The
  // SAFE_EXTRAS filter is what keeps this from becoming an XSS vector: only schemes
  // in the fixed safe-extras set can be enabled, regardless of what the caller passed.
  for (const raw of extra) {
    if (typeof raw !== 'string') continue;
    const norm = raw.trim().toLowerCase();
    if (norm === s && SAFE_EXTRAS.has(norm)) return true;
  }
  return false;
}
