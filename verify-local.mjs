// Seyyahname local migration check. Run from the repository root:  node verify-local.mjs
// Read-only for the repository: it changes no tracked file, commits nothing, and pushes only with --dry-run.
// Secrets are never printed: .env.local keys are reported as "set" / "empty".
import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const EXPECTED_REMOTE = 'https://github.com/deveciozgur/seyyahname.git';
const PORT = 3123;
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`); };
const sh = (cmd, opts = {}) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
const tryShell = (cmd, opts) => { try { return { out: sh(cmd, opts), code: 0 }; } catch (e) { return { out: `${e.stdout ?? ''}${e.stderr ?? ''}`.trim(), code: e.status ?? 1 }; } };
const app = join(process.cwd(), 'app');

console.log(`\n== Machine ==\n${process.platform} ${process.arch}`);
const nodeMajor = Number(process.versions.node.split('.')[0]);
ok('Node.js 22', nodeMajor === 22, `v${process.versions.node}`);
const npmV = tryShell('npm -v');
ok('npm available', npmV.code === 0, npmV.out);
const gitV = tryShell('git --version');
ok('Git available', gitV.code === 0, gitV.out);

console.log('\n== Repository ==');
const remote = tryShell('git remote get-url origin').out;
ok('origin is the existing repository', remote.replace(/\.git$/, '') === EXPECTED_REMOTE.replace(/\.git$/, ''), remote);
const branch = tryShell('git rev-parse --abbrev-ref HEAD').out;
ok('on main', branch === 'main', branch);
tryShell('git fetch -q origin main');
const [behind, ahead] = tryShell('git rev-list --left-right --count origin/main...HEAD').out.split(/\s+/).map(Number);
ok('in sync with origin/main', behind === 0 && ahead === 0, `behind ${behind}, ahead ${ahead}; HEAD ${tryShell('git rev-parse --short HEAD').out}`);
const dirty = tryShell('git status --porcelain').out;
ok('no uncommitted changes', dirty === '', dirty ? dirty.split('\n').slice(0, 5).join('; ') : 'clean');
const ident = `${tryShell('git config user.name').out} <${tryShell('git config user.email').out}>`;
ok('git identity set', !ident.startsWith(' <'), ident);
const push = tryShell('git push --dry-run origin main');
ok('GitHub push access (dry run, nothing sent)', push.code === 0, push.out.split('\n').pop());

console.log('\n== Environment ==');
const envPath = join(app, '.env.local');
if (!existsSync(envPath)) ok('app/.env.local exists', false);
else {
  const env = Object.fromEntries(readFileSync(envPath, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
  ok('app/.env.local exists', true, Object.entries(env).map(([k, v]) => `${k}: ${v ? 'set' : 'empty'}`).join(', '));
  ok('APP_SECRET_PIN set', Boolean(env.APP_SECRET_PIN) && env.APP_SECRET_PIN !== 'change-me');
  ok('APP_SESSION_SECRET set (32+ chars)', (env.APP_SESSION_SECRET ?? '').length >= 32);
  process.env.__PIN = env.APP_SECRET_PIN ?? '';
}
ok('app/.env.local is git-ignored', tryShell('git check-ignore -q app/.env.local').code === 0);
ok('no .env file tracked by git', tryShell('git ls-files "*.env" "*.env.*" ".env*"').out.split('\n').filter((f) => f && !f.endsWith('.env.example')).length === 0);

console.log('\n== Dependencies and checks (app/) ==');
ok('node_modules installed', existsSync(join(app, 'node_modules', 'next')));
const ls = tryShell('npm ls --depth=0', { cwd: app });
ok('npm ls clean', ls.code === 0, ls.code ? ls.out.split('\n').slice(-3).join('; ') : '');
const tc = tryShell('npm run typecheck', { cwd: app });
ok('typecheck', tc.code === 0, tc.code ? tc.out.split('\n').slice(-3).join('; ') : '');
const test = tryShell('npm test', { cwd: app });
const pass = test.out.match(/^# pass (\d+)/m)?.[1], fail = test.out.match(/^# fail (\d+)/m)?.[1];
ok('tests', test.code === 0, `pass ${pass}, fail ${fail}`);

console.log(`\n== Dev server (port ${PORT}) ==`);
const dev = spawn('npx', ['next', 'dev', '-p', String(PORT)], { cwd: app, shell: true, detached: process.platform !== 'win32', stdio: 'ignore' });
const stop = () => { try { process.platform === 'win32' ? execSync(`taskkill /pid ${dev.pid} /T /F`, { stdio: 'ignore' }) : process.kill(-dev.pid); } catch {} };
const base = `http://localhost:${PORT}`;
try {
  let up = false;
  for (let i = 0; i < 90 && !up; i++) { try { await fetch(`${base}/api/auth`); up = true; } catch { await new Promise((r) => setTimeout(r, 1000)); } }
  ok('dev server started', up);
  if (up) {
    const get = (p, init) => fetch(base + p, { redirect: 'manual', ...init });
    let r = await get('/'); ok('/ redirects to /unlock when signed out', r.status === 307 && (r.headers.get('location') ?? '').includes('/unlock'), String(r.status));
    r = await get('/unlock'); ok('/unlock renders', r.status === 200, String(r.status));
    r = await get('/api/auth'); const a = await r.json(); ok('GET /api/auth', r.status === 200 && a.authenticated === false, `AI chat ${a.ai ? 'on' : 'off (no GEMINI_API_KEY)'}`);
    r = await get('/api/state'); ok('/api/state needs a session', r.status === 401, String(r.status));
    if (process.env.__PIN) {
      r = await get('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json', 'x-requested-with': 'seyyahname' }, body: JSON.stringify({ pin: process.env.__PIN }) });
      const cookie = (r.headers.get('set-cookie') ?? '').split(';')[0];
      ok('sign in with the local PIN', r.status === 200 && cookie.startsWith('seyyahname_session='), String(r.status));
      for (const p of ['/', '/curriculum', '/vault', '/archive', '/coach']) { const s = await get(p, { headers: { cookie } }); ok(`page ${p}`, s.status === 200, String(s.status)); }
      const st = await get('/api/state', { headers: { cookie } }); ok('learner data loads (local app/data)', st.status === 200, String(st.status));
    }
  }
} finally { stop(); }

const failed = results.filter((r) => !r.pass);
console.log(`\n== Result: ${results.length - failed.length}/${results.length} passed ==`);
if (failed.length) console.log('Failed: ' + failed.map((f) => f.name).join('; '));
console.log('Production build check (optional, about a minute): cd app && npm run build');
