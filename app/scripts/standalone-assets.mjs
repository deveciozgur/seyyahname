// Runs after `next build` (npm "postbuild"): completes .next/standalone so it can run on its own with
// `npm start` (node .next/standalone/server.js) or be copied to a server as one folder.
//  - public/ and .next/static/  are served by server.js from inside the folder (Next leaves them out)
//  - ../CLAUDE.md               the coaching rules the API sends to Gemini
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(app, '.next', 'standalone');
if (!fs.existsSync(path.join(out, 'server.js'))) {
  console.error('standalone-assets: .next/standalone/server.js not found (is output: "standalone" set?)');
  process.exit(1);
}

const copy = (from, to) => fs.existsSync(from) && fs.cpSync(from, to, { recursive: true, force: true });
copy(path.join(app, 'public'), path.join(out, 'public'));
copy(path.join(app, '.next', 'static'), path.join(out, '.next', 'static'));
copy(path.resolve(app, '..', 'CLAUDE.md'), path.join(out, 'CLAUDE.md'));
console.log('standalone-assets: public/, .next/static/ and CLAUDE.md copied into .next/standalone');
