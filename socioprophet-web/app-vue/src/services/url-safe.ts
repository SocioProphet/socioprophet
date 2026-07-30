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
 * ftp:, custom schemes). If a caller genuinely wants mailto: or tel:, pass a second
 * argument extending the allow-list — but be sure the caller has thought about phishing.
 */
export function isSafeHttp(url: unknown, extra: readonly string[] = []): boolean {
  if (typeof url !== "string") return false;
  // Leading whitespace or control characters (0x00-0x20) historically let some
  // browsers strip them and re-parse a URL as its trailing scheme — a payload of
  // `"\tjavascript:..."` was executable in older Chromium and remains inconsistently
  // handled. If the caller wanted a URL it does not start with whitespace.
  if (/^[\s\x00-\x20]/.test(url)) return false;
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(url);
  if (!m) return false;
  const s = m[1].toLowerCase();
  return s === "http" || s === "https" || extra.includes(s);
}
