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
import DOMPurify from 'dompurify';

const HTML_OPTS: DOMPurify.Config = {
  // The chat path opts in `target` and `rel` for its markdown links; notebook HTML
  // can carry the same on plain <a>, so keep the same additions.
  ADD_ATTR: ['target', 'rel'],
};

const SVG_OPTS: DOMPurify.Config = {
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
