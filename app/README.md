# Seyyahname AI Coach — Web App

Full-stack Next.js 16 (App Router, TypeScript, Tailwind v4) app for the coach in `../CLAUDE.md`. It runs as a self-contained Node.js server (`output: 'standalone'`): pages, the lock screen, file storage and the Gemini relay are all part of one process. Deployment guide: [`../DEPLOYMENT.md`](../DEPLOYMENT.md).

```bash
npm install
cp .env.example .env   # set APP_SECRET_PIN (and GEMINI_API_KEY for AI feedback)
npm run dev            # http://localhost:3000
npm test               # node --test: coach logic (src/lib/core) and server layer (src/lib/server)
npm run typecheck      # tsc --noEmit
npm run build          # next build --webpack → .next/standalone (+ public/, static/, CLAUDE.md copied in)
npm start              # node .next/standalone/server.js, port from $PORT (default 3000)
```

The production build uses Webpack (`next build --webpack`): Turbopack's PostCSS step runs in a child Node process that some shared Node hosts (e.g. Hostinger) cannot reach, which crashes the CSS build. `npm run dev` still uses Turbopack.

Interface: Concept C "Dark Elegance" with a light theme (tokens in `src/app/globals.css`, `src/lib/theme/`). The whole interface is in English. The views are Studio, Curriculum & Roadmap, Coach, Vault and Archive.

The marketing site for the root domain is a separate, self-contained page in [`../landing/index.html`](../landing/index.html) (single file, no build step).

It reads and writes the same state files as the coach does:

| File | Updated when |
|---|---|
| `profile.json` | Every finished activity and review: sub-bands, Can-Dos, gamification, SRS queue, progress, stats, history |
| `vocabulary.md` | Task key words and feedback upgrades, with SM-2 interval, ease factor, repetitions and next review |
| `error_ledger.md` | Errors from writing/speaking feedback, with count and correct-use streak |
| `sessions/YYYY-MM-DD.md` | A 5-line `## Session Summary` at the top, refreshed after every activity, plus the `## Activity Log` |

## Learning rules (from `../CLAUDE.md`)

Aligned with the **CEFR Companion Volume** (action-oriented Can-Do assessment), the **ACTFL Proficiency Guidelines** (error tolerance by level) and **SM-2** spaced repetition.

- **Sub-bands:** each skill moves A1.1 → A1.2 → A2.1 … after one **Transactional**, one **Interactional** and one **Evaluative** task at its current level, each passed at 80%+ and each a different task (tasks used for A1.1 cannot count again for A1.2). The overall sub-band is the floor of the four skills' average. Every skill has 6+ tasks per level at A1-A2, two of each function; B1-B2 coverage is still partial.
- **Master English Curriculum:** `src/data/curriculum.json` defines 12 sub-bands (A1.1-C2.2), each with grammar targets, lexical domains, 4 Can-Do statements, Turkish L1 interference alerts and speaking scenarios. A Can-Do is mastered after 3 different speaking/writing tasks at 80%+ that the feedback confirms (`can_do_ids`); it is then added to `can_do_mastered` with its curriculum id. When a band's 4 Can-Dos are done, the next band opens (`profile.curriculum`). Engine: `src/lib/core/curriculum.ts`; view: Curriculum & Roadmap. The API routes inject the active band (targets, i+1 language rules, next-band Polish) into Gemini's system instruction.
- **ACTFL tolerance:** at A1-A2, slips that keep the meaning clear cost little and are modelled through a natural **recast**; at B2+ register, idiomaticity and cultural fit are scored.
- **SM-2:** reviews are graded on the quality scale 0-5 (Vault flashcards) or Again / Hard / Good / Easy = 1 / 3 / 4 / 5 (warm-up); q < 3 is a lapse; intervals 1 → 3 → 7 → 14 → 30 days, then × ease factor (starts 2.50, minimum 1.30). A lapse returns to 1 day. The Studio opens with a 3-minute warm-up of up to 6 due words; the sidebar shows words due and the Vault Confidence Index (`src/lib/vault.ts`).
- **Error ledger:** a pattern resolves itself after correct use in 3 later sessions in a row.
- **Motivation:** XP, streak, confidence index (starts at 80), milestones, Frustration Shield after 2 rounds under 60%, Low-Effort Mode, Daily Loot, interest-led themes.
- **Older files:** `profile.json` blocks from earlier versions (`user` / `motivation`) are read and converted on the next save, keeping all data.

## `profile.json`

`overall_cefr`, `sub_band`, `target_cefr`, `skills`, `skill_bands`, `can_do_mastered`, `gamification` (`streak_days`, `xp_total`, `confidence_index`, …), `srs_queue` (derived snapshot of upcoming reviews), `interests`, `progress`, `stats`, `metrics`, `diagnostic`, `history`. Full template in `../CLAUDE.md`, section 6.C.

## Feedback engine

- **Gemini (recommended):** set `GEMINI_API_KEY`. Feedback follows the full `CLAUDE.md` rules (sent as the system instruction) with the learner profile and recurring errors in the prompt, and comes back as JSON against the feedback schema. The Coach chat streams through `/api/chat` (Server-Sent Events). Model: `GEMINI_MODEL` (default `gemini-flash-latest`).
- **Offline rules (default without a key):** a built-in rule engine for common Turkish-L1 errors (age with "have", 3rd-person -s, articles, prepositions of time, "listen music", …), i+1 vocabulary upgrades, register/cohesion notes, and IPA tips. It only catches known patterns.

## Browser features

- **Listening** uses the Web Speech *synthesis* API (all modern browsers).
- **Speaking** uses Web Speech *recognition* for live dictation (Chrome / Edge; Chrome needs internet for it) and `MediaRecorder` so you can play back your own voice. In other browsers you can record and type the transcript.

## Configuration

Environment variables (hosting panel, or `app/.env` / `.env.local`). Template: `.env.example`.

| Variable | Default | Purpose |
|---|---|---|
| `APP_SECRET_PIN` | none | Lock-screen PIN. Required: without it the API answers 503 |
| `APP_SESSION_SECRET` | empty | Signs the session JWT (HS256, with the PIN); rotate it to sign everyone out |
| `SESSION_DAYS` | `7` | Session length |
| `GEMINI_API_KEY` | none | Enables the Coach chat and AI feedback |
| `GEMINI_MODEL` | `gemini-flash-latest` | Gemini model id |
| `DATA_DIR` | `data` | State files; relative to the app folder (also for the standalone server) or absolute |
| `SITE_URL` | `http://localhost:$PORT` | Public origin for OpenGraph / Twitter links |
| `PORT` | `3000` | Port of `npm start` |

## Architecture

```
browser                                   Node server (one process)
──────────────────────────────            ─────────────────────────────────────────────────
app/(coach)/* pages, CoachShell           proxy.ts            no session → /unlock
src/lib/core/store (coach logic) ──GET──▶ /api/state          files + version
          │ RemoteFS (in memory)  ──PUT──▶ /api/state          atomic write (.tmp → rename), lock, 409 on conflict
FeedbackCard                      ──POST─▶ /api/feedback       Gemini JSON (@google/genai)
ChatProvider                      ──POST─▶ /api/chat           Gemini stream → text/event-stream
Gatekeeper (/unlock)              ──POST─▶ /api/auth           PIN → JWT cookie (HttpOnly, SameSite=Lax, Secure)
```

Request and response shapes are shared types (`src/lib/api-contract.ts`). Mutating requests need the `x-requested-with: seyyahname` header. A missing data folder or file is recreated from `src/lib/server/templates.ts` on the first request; the first save of each day keeps a backup in `data/backups/` (14 days).

## Design system

Concept C "Dark Elegance", defined as CSS variables in `src/app/globals.css`. Dark is the base palette; `<html data-theme="light">` switches to the light one. The default is **System**: the page follows `prefers-color-scheme` live. The System / Dark / Light switch in the top bar stores a manual choice in `localStorage['seyyahname.theme']` that overrides the system (choosing System removes it). An inline script in `layout.tsx` applies it before first paint (no flash of the wrong theme); `ThemeProvider` keeps both switches in sync.

**Layout:** learner sheet and navigation on the left, the page in the centre and, from 1280px (`xl`), the coach chat as a persistent right-hand column. The frame lives in `app/(coach)/layout.tsx`, so it never unmounts while the learner moves between pages; the conversation (and a running stream) is held by `ChatProvider` above the pages. Below 1280px, Coach is its own page (`/koc`). Centre views use container queries (`@container` on `<main>`) so their grids follow the space left by the chat column.

- **Type:** Geist for everything (headings tight at -0.03em), Geist Mono for CEFR codes, figures and meta. Self-hosted via `@fontsource`, no external font requests.
- **Colour:** dark `#0A0A0B` / `#111113` surfaces with `#232327` hairlines and `#EDEDEF` ink; light `#F9FAFB` / `#FFFFFF` with `#18181B` ink. One accent, champagne `#E8C07D` (bronze `#946318` in light), for progress and the CEFR ladder. Meaning colours: emerald = strengths and correct answers, indigo = recasts and phonetics, brick = deletions.
- **Shape:** panels 14px with a coloured hairline on top of the feedback cards, inputs 10px, buttons, badges and tabs fully rounded. Shadows only in the light theme.
- **Motion:** `motion` for state changes only (tab indicator, accordion, score arc, theme switch). Respects `prefers-reduced-motion`.
- **Icons:** Phosphor.

## Structure

```
src/app/(coach)/         Signed-in pages: / (Studio), /mufredat (Curriculum & Roadmap), /koc (Coach), /kasa (Vault), /arsiv (Archive), sharing layout.tsx (the frame)
src/app/unlock/          Anonymous PIN screen
src/app/api/             Route handlers: auth, state, feedback, chat
src/app/layout.tsx       Metadata (title template, OpenGraph, Twitter), theme script, ThemeProvider
src/proxy.ts             Page gate (session check before rendering)
src/api.ts               Data layer: runs the coach store on the files from /api/state, saves after every change
src/lib/api-contract.ts  Shared request/response types
src/lib/remote-fs.ts     In-memory copy of the files, synced with /api/state (versioned)
src/lib/server/          env, session (jose JWT), rate limit, atomic storage, Gemini, coach prompt (+ tests)
src/lib/core/            Coach logic, shared with the tests: store, srs (SM-2 0-5), curriculum, motivation, schema,
                         markdown (table parser), heuristics (offline engine), feedback (Gemini JSON)
src/lib/theme/           Pre-paint theme script and ThemeProvider (System / Dark / Light)
src/components/          CoachShell, views, Sidebar, Studio (Reading / Writing / Listening / Speaking), Roadmap,
                         FeedbackCard, Flashcards (0-5), WarmUp, CoachChat (+ ChatProvider), Gatekeeper, Vault, SessionsView
src/data/                tasks.ts (task bank), curriculum.json (A1.1-C2.2)
scripts/standalone-assets.mjs   postbuild: copies public/, .next/static/ and CLAUDE.md into .next/standalone
```
