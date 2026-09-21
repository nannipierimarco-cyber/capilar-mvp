<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Product overview

Single **Next.js 16** app (`capilar-mvp` / Perfecto) at the repo root. The only process you run locally is the Next dev or production server on port **3000**. **Supabase is hosted** (no `supabase start` / Docker in this repo).

### Commands (see `package.json`)

| Task | Command |
|------|---------|
| Install | `npm ci` |
| Dev server | `npm run dev` → http://localhost:3000 |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Production serve | `npm run start` (after build) |

There is **no** `npm test` script. Optional Playwright scripts at repo root (`screenshot-demo.mjs`, `test-quiz.mjs`) target localhost or production depending on the file.

### Environment variables

Copy `.env.example` → `.env.local` (gitignored). **Build fails** if `NEXT_PUBLIC_SUPABASE_URL` contains angle-bracket placeholders from the template; use a real project URL or a syntactically valid placeholder such as `https://placeholder.supabase.co` with JWT-shaped keys (see `.env.example`).

**Tier A (UI / demo, no real DB):** dev server only — e.g. `/`, `/mapa-capilar/reporte/demo`.

**Tier B (quiz, admin, persistence):** real `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET`, `NEXT_PUBLIC_APP_URL`.

**Tier C (payments, webhooks, full AI):** also `OPENAI_API_KEY`, `FLOW_*`, WhatsApp/Calendly vars as needed.

PostHog and several AI routes degrade gracefully when keys are missing.

### Dev server (tmux)

Long-running `npm run dev` should run in a named tmux session (e.g. `next-dev-server`) so it survives backgrounding. Reattach or send keys with the portal tmux config under `/exec-daemon/tmux.portal.conf`.

### Lint note

`npm run lint` may report **pre-existing** errors in the repo; use `npm run build` as the compile gate for large changes (per `CLAUDE.md`).

### Hello-world smoke test (no secrets)

1. `npm run dev`
2. Open `/` — landing shows **Perfecto**
3. Open `/mapa-capilar/reporte/demo` — static hair report with score **62**

Or: `npx playwright install chromium && node screenshot-demo.mjs` (writes `reference/demo-screenshot.png`).
