# Seyyahname AI Coach v2: Deploying to a Node.js Server

Seyyahname runs as a single Node.js server: the pages, the lock screen, the data files and the Gemini connection all live in one process. There is no separate PHP bridge or static bundle.

## How it works

| Part | Where | What it does |
|---|---|---|
| Interface | `app/src/app/(coach)/*`, `/unlock` | Next.js App Router pages. The coaching logic (SM-2, sub-bands, curriculum, error ledger) runs in the browser. |
| Gate | `app/src/proxy.ts` | Without a session, every page redirects to `/unlock`. |
| API | `/api/auth`, `/api/state`, `/api/feedback`, `/api/chat` | PIN → JWT session cookie; atomic reads and writes of the data files; Gemini JSON feedback and streaming chat. |
| Rules | `CLAUDE.md` | Copied into `.next/standalone/` at build time and sent to Gemini as the system instruction. |
| Data | `DATA_DIR` (default `app/data/`) | `profile.json`, `vocabulary.md`, `error_ledger.md`, `sessions/`. Created from templates on the first request if missing. |

The marketing site for the root domain is a separate, self-contained page in `landing/index.html` (no build step; upload it to `public_html`).

## Requirements

- **Node.js 20.9 or later** (22 LTS recommended). On shared hosting, the control panel must offer a "Node.js application" feature (cPanel "Setup Node.js App", Plesk "Node.js", DirectAdmin, Hostinger, etc.). Plans that only offer PHP/FTP will not work.
- Write access to the data folder.

## 1. Get the code onto the server

```bash
git clone https://github.com/deveciozgur/seyyahname.git seyyahname
cd seyyahname/app
npm ci
npm run build          # creates .next/standalone/ and copies public/, static/ and CLAUDE.md into it
```

When `npm run build` finishes, every `/api/*` route is listed as `ƒ (Dynamic)`.

The production build uses Webpack (`next build --webpack`). Turbopack's PostCSS step runs in a child Node process that some shared hosts (for example Hostinger) cannot reach, which crashes the CSS build with a `TurbopackInternalError`. `npm run dev` still uses Turbopack locally.

## 2. Environment variables

Open the panel's "Environment variables" section (or create `app/.env`; template: `app/.env.example`).

| Variable | Required | Description |
|---|---|---|
| `APP_SECRET_PIN` | **Yes** | The PIN the lock screen asks for. If empty, the API returns 503. |
| `APP_SESSION_SECRET` | **Yes** (in production) | A long random string that signs the session JWT. Changing it signs everyone out. Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GEMINI_API_KEY` | Recommended | Enables the coach chat and AI feedback. Without it, the offline feedback engine runs. |
| `GEMINI_MODEL` | No | Defaults to `gemini-flash-latest` (Google's current Flash model). |
| `DATA_DIR` | No | Data folder. Relative paths start at the `app/` folder; safest is an absolute path outside the app (`/home/USER/seyyahname-data`). |
| `SESSION_DAYS` | No | Session length in days (default 7). |
| `SITE_URL` | No | Public address used for share previews (OpenGraph/Twitter), e.g. `https://app.seyyahname.com`. |
| `PORT` | Set by the panel | Port for `npm start` (default 3000). |

## 3. Start the app

**Hosting panel (cPanel / Plesk / Hostinger):**
- Application root: `seyyahname/app`
- Startup file: `.next/standalone/server.js`
- Node version: 22
- Save and click "Restart". The panel provides `PORT` itself; `server.js` reads it.

**VPS (pm2 + Nginx):**

```bash
cd seyyahname/app
PORT=3000 pm2 start npm --name seyyahname -- start
pm2 save
```

Route traffic in Nginx with `proxy_pass http://127.0.0.1:3000;`. Add `proxy_buffering off;` so the chat streams; the API already sends `X-Accel-Buffering: no`. For the real visitor IP add `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`, and for HTTPS add `proxy_set_header X-Forwarded-Proto $scheme;`.

## 4. Migrating data from the PHP version

Your progress from the old installation lives in the server's `data/` folder (`profile.json`, `vocabulary.md`, `error_ledger.md`, `sessions/`).

1. Download the `data/` folder from the old server over FTP.
2. Copy it as-is into `DATA_DIR` on the new server (default `app/data/`). Files such as `.version` or `backups/` may come along; they are harmless.
3. Restart the app. The file formats have not changed; no key is deleted or renamed.

The saved theme preference moves to a new browser key (`seyyahname.theme`), so it resets to the default (System) once. Old session cookies are no longer valid; entering the PIN once is enough.

## 5. Security

- **The data folder is not reachable from the web:** Next.js only serves `public/` and the build output; `DATA_DIR`, `.env` and `CLAUDE.md` cannot be read from any URL.
- **Session:** a correct PIN produces an expiring JWT (default 7 days) signed with HS256 via `jose`. Cookie: `seyyahname_session; HttpOnly; Path=/; SameSite=Lax; Secure` (always `Secure` in production and behind HTTPS).
- **PIN comparison:** constant-time (`timingSafeEqual`).
- **Rate limiting:** 5 wrong PINs from one IP lock that IP for 15 minutes; 30 wrong attempts across all IPs lock everyone out for 15 minutes. The IP is the last `X-Forwarded-For` entry, the one added by the reverse proxy (entries written by the client are ignored).
- **Cross-site requests:** every request that changes data must carry the `x-requested-with: seyyahname` header; together with the `SameSite=Lax` cookie this blocks cross-site requests.
- **Saving:** only `profile.json`, `vocabulary.md`, `error_ledger.md` and `sessions/YYYY-MM-DD.md` can be written (at most 1 MB each; `profile.json` must be a valid JSON object). Writes go to a temporary file and are moved into place with an atomic `rename`; a lock file prevents two simultaneous writes; a version number stops two devices from overwriting each other (409 → the latest data is reloaded and the operation retried).
- **Headers:** `X-Powered-By` is off; `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy` and `Permissions-Policy` (microphone for this site only) are sent. API responses are `no-store` and `noindex`.
- **Anonymous lock screen:** `/unlock` shows only a PIN field and a sign-in button, with a neutral tab title. Note: for share previews, the page head (invisible meta tags) contains the Seyyahname name and description.

## 6. Updating

```bash
cd seyyahname && git pull
cd app && npm ci && npm run build
# "Restart" in the panel, or: pm2 restart seyyahname
```

The data folder sits outside the build output, so updates never touch your progress.

## 7. Backups

- **Automatic:** before the first save of each day, a copy is written to `DATA_DIR/backups/YYYY-MM-DD/`; the last 14 days are kept.
- **Manual:** download the `DATA_DIR` folder from time to time.

## 8. Continuous integration

`.github/workflows/ci.yml` runs `npm ci`, `npm run typecheck`, `npm test` and `npm run build` on every push and pull request.

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| "APP_SECRET_PIN is not set" | Add the environment variable in the panel and restart the app. |
| The data folder cannot be prepared | Give write access to the `DATA_DIR` folder, or set a writable absolute path. |
| The PIN is correct but the lock screen keeps coming back | The site may be served over HTTP (a `Secure` cookie is only stored over HTTPS). Use HTTPS; behind a proxy, make sure `X-Forwarded-Proto` is sent. |
| Chat replies arrive all at once instead of streaming | The reverse proxy is buffering the response: set `proxy_buffering off;` in Nginx. |
| `TurbopackInternalError` / PostCSS panic during the build | Make sure the build runs `next build --webpack` (the `build` script in `app/package.json`). |
| "Gemini model … was not found" | Fix `GEMINI_MODEL` (e.g. `gemini-flash-latest`). |
| "Gemini rejected the API key" | Check `GEMINI_API_KEY`. |
| Page styles do not load | The `postbuild` step may not have run after `npm run build`: `node scripts/standalone-assets.mjs`. |
