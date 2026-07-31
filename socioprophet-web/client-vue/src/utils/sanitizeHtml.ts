// Sanitise HTML/SVG that arrives from the notebook runtime before it is committed
// to `v-html`. Cell outputs are untrusted by construction — pandas' `_repr_html_`,
// an `IPython.display.HTML(...)`, an `<img onerror>` slipped into a shared cell, or
// a compromised BFF response over `/api/studio/notebook/execute` all render through
// the same path. Vue does NOT sanitise `v-html`; without this the event handlers
// run in the operator's tab, against every endpoint the cockpit is authenticated to.
//
// DOMPurify is already the shipped pattern for the chat markdown path — see
// `renderMarkdown` in `./markdown.ts`. Using it here keeps notebook rendering on
// the same audited allowlist rather than inventing a second, weaker one.
import DOMPurify, { type Config } from 'dompurify';

// dompurify v3 exports `Config` as a named type (the old `DOMPurify.Config`
// namespace is gone). Typing the options as `Config` also lets `sanitize`
// resolve to its `(dirty, cfg?: Config): string` overload instead of the
// `RETURN_TRUSTED_TYPE: true` one that returns TrustedHTML.
const HTML_OPTS: Config = {
  // Copilot round-2: pin the sanitiser to the HTML profile. Without this DOMPurify
  // permits SVG and MathML inside an HTML payload, which reopens the SVG-smuggle
  // surface `sanitizeCellSvg` was split out to police — an attacker could ship an
  // `<svg><foreignObject>` carrying `<script>` inside what claims to be
  // pandas' `_repr_html_` and bypass the stricter SVG allowlist. SVG cells go
  // through `sanitizeCellSvg`; anything shaped like SVG in an HTML cell is
  // deliberately dropped here.
  USE_PROFILES: { html: true },
  // The chat path opts in `target` and `rel` for its markdown links; notebook HTML
  // can carry the same on plain <a>, so keep the same additions.
  ADD_ATTR: ['target', 'rel'],
};

const SVG_OPTS: Config = {
  // Cell PNGs go through `:src="'data:image/png;base64,'+..."`, but SVG plots
  // (matplotlib, plotly static) come in as raw markup. Restrict DOMPurify to the
  // SVG grammar rather than the HTML grammar so a stray `<script>` in an SVG is
  // stripped and cannot smuggle in event handlers via foreignObject.
  USE_PROFILES: { svg: true, svgFilters: true },
};

export function sanitizeCellHtml(input: unknown): string {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, HTML_OPTS);
}

export function sanitizeCellSvg(input: unknown): string {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, SVG_OPTS);
}

// Copilot round-2: sanitising in the template means DOMPurify runs on every render
// (a large DataFrame HTML repr can be tens of KB — Vue reactivity re-runs it any
// time an unrelated cell mutates). Memoise by INPUT-STRING IDENTITY so a stable
// cell output is sanitised exactly once per lifetime, and the cache is bounded
// (~200 entries) with LRU-lite eviction so a chatty runtime cannot balloon it.
const CACHE_MAX = 200;
const htmlCache = new Map<string, string>();
const svgCache = new Map<string, string>();

function cached(cache: Map<string, string>, input: string, run: (s: string) => string): string {
  const hit = cache.get(input);
  if (hit !== undefined) {
    // Touch: re-insert to move to the end of the Map's insertion order (JS Map is
    // insertion-ordered, so the OLDEST key is `keys().next().value`).
    cache.delete(input);
    cache.set(input, hit);
    return hit;
  }
  const out = run(input);
  cache.set(input, out);
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return out;
}

export function sanitizeCellHtmlMemo(input: unknown): string {
  if (typeof input !== 'string') return '';
  return cached(htmlCache, input, (s) => DOMPurify.sanitize(s, HTML_OPTS));
}

export function sanitizeCellSvgMemo(input: unknown): string {
  if (typeof input !== 'string') return '';
  return cached(svgCache, input, (s) => DOMPurify.sanitize(s, SVG_OPTS));
}
