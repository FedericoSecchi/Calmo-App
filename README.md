# Calmo

Healthy habits for computer work — a small, quiet PWA. [calmo.fit](https://calmo.fit).

## What it is

- Focus timer with screen-break nudges.
- Short mobility routines and guided breathing.
- Pain log that stays on your device.
- Water count and daily streaks.
- English and Spanish throughout the app (dictionary-based i18n). No ads, no cookies.

## Stack

Vite · React 18 + TypeScript · Tailwind · shadcn/ui · React Router · Supabase (auth + Postgres with RLS) · PWA · GitHub Pages.

## Running locally

Requirements: Node ≥ 20.

```bash
npm ci
npm run dev
# http://localhost:5173
```

The repository ships a committed `.env` with the public Supabase anon key. You can override it with a local `.env.local`.

## Scripts

- `npm run dev` — Vite dev server.
- `npm run build` — generates `dist/` with sitemap, robots and the build-id stamp.
- `npm run prerender` — renders every public route into `dist/<path>/index.html`.
- `npm run og` — regenerates the OG images in `dist/`.
- `npm run verify:dist` — asserts the prerendered output has title, description, canonical, hreflang and `<h1>` per route.
- `npm test` — unit tests (vitest).
- `npm run lint` — ESLint.
- `npm run e2e` — Playwright end-to-end (public + guest + language + waitlist + account round-trip + i18n regression).
- `bash scripts/verify.sh` — full verification suite before pushing to `main`.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds, prerenders every public route, generates OG images, injects a `build-id` meta into each HTML, and publishes to GitHub Pages at `calmo.fit`.

A separate `keepalive.yml` cron hits `rpc/ping` every 3 days so the Supabase free project doesn't pause.

## Verification

After a push, check that the live site serves the new build:

```bash
curl -s https://calmo.fit/ | grep build-id
```

Full documentation lives in `CLAUDE.md` and under `docs/`.
