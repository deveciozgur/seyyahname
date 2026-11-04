# Seyyahname: developer notes

The root `CLAUDE.md` is **not** a developer guide: it is the coaching rulebook that the app sends to Gemini as the
coach's system instruction (`app/src/lib/server/coach-prompt.ts`, copied next to the standalone server by
`app/scripts/standalone-assets.mjs`). Anything written there changes how the AI coach behaves. Keep development notes
here instead; this file is read by Claude Code only.

## Layout

- `app/`: the web app (Next.js 16 App Router, `output: 'standalone'`, Node server). Read `app/AGENTS.md` before
  writing Next.js code: this Next version differs from older docs.
- `landing/index.html`: the marketing page for seyyahname.com, one self-contained file.
- Learner data at the repo root: `profile.json`, `vocabulary.md`, `error_ledger.md`, `sessions/`. Their formats are
  fixed by section 6 of the root `CLAUDE.md`; the app reads and writes the same files (`DATA_DIR` in production).
- UI copy is US English. Keep the proper nouns Özgür Deveci, Kadıköy, Ayşe and Yılmaz as they are.

## App commands (run in `app/`)

- `npm run build`: uses `next build --webpack` (Turbopack's PostCSS worker panics on the Hostinger host). `postbuild`
  copies `public/`, `.next/static/` and `CLAUDE.md` into `.next/standalone`.
- `npm start`: `node .next/standalone/server.js`.
- The signed-in pages (`app/src/app/(coach)/layout.tsx`) are `force-dynamic` on purpose. Prerendered pages go out
  with `s-maxage=31536000`, and Hostinger's CDN caches them in front of the `proxy.ts` gate: it served the Studio frame to
  signed-out visitors and would keep serving stale HTML after a deploy.
- `npm test`: Node's test runner over `src/lib/core/*.test.ts` and `src/lib/server/*.test.ts`.
- `npm run typecheck`: `tsc --noEmit`. `noUnusedLocals` and `noUnusedParameters` are on and act as the lint gate
  (there is no ESLint config).
- Environment: `APP_SECRET_PIN`, `APP_SESSION_SECRET`, `SESSION_DAYS`, `DATA_DIR`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
  `GEMINI_BASE_URL`, `COACH_RULES_FILE`, `PORT`, and `SITE_URL` (read at build time; defaults to
  `https://app.seyyahname.com` in production). See `app/.env.example`; never commit a real `.env`.

## Local development

- Copy `app/.env.example` to `app/.env.local` (git-ignored by `.env*`). Use a local `APP_SECRET_PIN`, never the
  production one; generate `APP_SESSION_SECRET` with `crypto.randomBytes(32).toString('hex')` written straight to the
  file. `GEMINI_API_KEY` is optional (without it the Coach chat is off and offline feedback runs).
- `DATA_DIR=data`: `app/data/` is created from the templates on first run and is git-ignored. Never download or edit
  the production learner data.
- CI uses Node 22; local development on Node 24 also works (`engines` is `>=20.9`).
- `npm start` (standalone) does not read `.env.local`; pass variables on the command line. Production cookies are
  `Secure`: Chrome accepts that on localhost, Safari may not.

## Landing page

- Tailwind is compiled into the inline `tailwind` style block in `<head>`. After changing classes run
  `node landing/build-css.mjs` (config: `landing/tailwind.config.js`). The script stops without writing if its
  markers do not appear exactly once.
- Icons are Phosphor SVGs in the sprite right after `<body>`; add a `<symbol>` to use a new one.
- Deploy by uploading `index.html` and `favicon.ico` (the two files in `landing-page.zip`). The page head carries the
  icon inline; `favicon.ico` is the same mark for clients that request `/favicon.ico` directly.

## UI rules (from the UI UX Pro Max reviews of both surfaces)

- Text is at least 12px. Text contrast is at least 4.5:1 in both themes, including on the `-soft` accent tints
  (tokens in `app/src/app/globals.css`).
- Disabled controls stay readable (no opacity fades) and say why they are disabled (`aria-describedby`).
- Motion that loops for more than 5 seconds has a visible Pause control or stops within 5 seconds; reduced motion
  stops it. `[hidden]` must win over display utilities.
- Streaming or animated content reserves its space: no layout shift.
- Sticky UI must not cover the focused element (`scroll-padding-top` on the landing page, `keepFocusVisible` in
  `CoachChat`).
- Live regions announce outcomes, not streamed chunks. Modals move focus in, trap Tab, close on Escape and return
  focus. Each app page starts with a "Skip to content" link. Markdown headings render one level lower
  (`app/src/lib/markdown.ts`), so a page keeps a single `h1`.

## UI UX Pro Max skill

- Installed in `.claude/skills/ui-ux-pro-max` with `npx ui-ux-pro-max-cli@2.15.0 init --ai claude`. The CLI also
  copies six companion skills (banner-design, brand, design, design-system, slides, ui-styling); they were removed on
  purpose. Running `init` or `update` again adds them back.
- Search it with `python3 -B .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux` (`-B` keeps
  `__pycache__` out of the tree).
- Its generated design-system suggestion (claymorphism, purple primary) does not fit this product; keep the existing
  dark, champagne-accent direction.

## Git

- Work on `main` and push to `origin main`. Commit as `gamedev.ist`, the author of the existing history.
