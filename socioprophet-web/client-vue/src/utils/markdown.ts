// Render agent output as SAFE HTML. LLM text is untrusted, so this is defence in depth:
// markdown-it runs with html:false (raw HTML in the source is escaped, not executed),
// and DOMPurify sanitises the rendered output before it ever reaches v-html.
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

// open links in a new tab, safely (noopener) — the default renderer doesn't add rel.
const defaultLink = md.renderer.rules.link_open
  ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const t = tokens[idx];
  t.attrSet('target', '_blank');
  t.attrSet('rel', 'noopener noreferrer');
  return defaultLink(tokens, idx, options, env, self);
};

export function renderMarkdown(src: string): string {
  if (!src) return '';
  return DOMPurify.sanitize(md.render(src), { ADD_ATTR: ['target', 'rel'] });
}
