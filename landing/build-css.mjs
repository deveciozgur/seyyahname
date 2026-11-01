// Recompiles the Tailwind CSS inlined in index.html. Run after changing classes in the page:
//   node landing/build-css.mjs
// Tailwind scans a copy of the page with the compiled block removed, so old CSS never feeds the next build.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TAILWIND = 'tailwindcss@3.4.16';
const START = '<style id="tailwind">';
const END = '</style><!-- /tailwind -->';

const dir = dirname(fileURLToPath(import.meta.url));
const page = join(dir, 'index.html');
const html = readFileSync(page, 'utf8');
// Each marker must appear exactly once; otherwise stop before touching the page.
const count = (s) => html.split(s).length - 1;
if (count(START) !== 1 || count(END) !== 1) throw new Error(`index.html must contain ${START} and ${END} exactly once each`);
const start = html.indexOf(START);
const end = html.indexOf(END);
if (end < start) throw new Error(`${END} must come after ${START}`);
const before = html.slice(0, start);
const after = html.slice(end + END.length);

const tmp = mkdtempSync(join(tmpdir(), 'seyyahname-tw-'));
try {
  writeFileSync(join(tmp, 'page.html'), before + after);
  execFileSync(
    'npx',
    ['--yes', TAILWIND, '-c', join(dir, 'tailwind.config.js'), '-i', join(dir, 'tailwind.css'), '--content', join(tmp, 'page.html'), '--minify', '-o', join(tmp, 'out.css')],
    { stdio: 'inherit' },
  );
  const css = readFileSync(join(tmp, 'out.css'), 'utf8').trim();
  writeFileSync(page, before + START + css + END + after);
  console.log(`Inlined ${(css.length / 1024).toFixed(1)} KB of Tailwind CSS into index.html`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
