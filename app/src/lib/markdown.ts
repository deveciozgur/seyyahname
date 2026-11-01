import type { RendererObject } from 'marked';

/**
 * Markdown (session logs, coach replies) always sits under the page's own <h1>, so every heading
 * renders one level lower (# → h2, capped at h6). The md-hN class keeps the look of the level as
 * written; .prose-session styles those classes, not the tags.
 */
export const demotedHeading: RendererObject['heading'] = function ({ tokens, depth }) {
  const level = Math.min(depth + 1, 6);
  return `<h${level} class="md-h${depth}">${this.parser.parseInline(tokens)}</h${level}>\n`;
};
