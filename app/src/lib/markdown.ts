import { Marked, type RendererObject } from 'marked';

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Markdown (session logs, coach replies) always sits under the page's own <h1>, so every heading
 * renders one level lower (# → h2, capped at h6). The md-hN class keeps the look of the level as
 * written; .prose-session styles those classes, not the tags.
 */
export const demotedHeading: RendererObject['heading'] = function ({ tokens, depth }) {
  const level = Math.min(depth + 1, 6);
  return `<h${level} class="md-h${depth}">${this.parser.parseInline(tokens)}</h${level}>\n`;
};

/**
 * The one Markdown renderer for learner content. Session logs and coach replies can quote the learner,
 * so raw HTML in the source is shown as text, never rendered. `breaks` keeps single line breaks (chat).
 */
export function createMarkdown({ breaks = false } = {}) {
  return new Marked({ gfm: true, breaks, renderer: { html: ({ text }) => escapeHtml(text), heading: demotedHeading } });
}
