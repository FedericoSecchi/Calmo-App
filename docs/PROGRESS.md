# PROGRESS — Multi-stage Calmo rework

Start date: 2026-10-25. Target branch: `main`.

## Overview

Three stages. Each stage must end with:
- `scripts/verify.sh` PASS (incl. Lighthouse ≥ existing values).
- Commit + push to `main`.
- Production verification: build-id polling, `curl -sI` on sitemap URLs, remote e2e without retries.
- Only after that: next stage.

## Status

- [x] Stage 1 — Simplify app + polish timer (verify PASS 2026-10-25)
  - [x] 1.0 Remove `google-site-verification` placeholder meta
  - [x] 1.1 Single control center on Home (/app); /app/reminders → Navigate to /app
  - [x] 1.2 "Start new day" button + automatic calendar-day reset
  - [x] 1.3 Auto PiP, visual phase-end alert, tab-close warning
- [ ] Stage 2 — Shared focus rooms
- [ ] Stage 3 — Garden with 3 styles

## Stage 1 verify (2026-10-25)

- scripts/verify.sh → PASS (incl. Lighthouse perf=98 a11y=100 seo=100 bp=100 for / and /es/).
- 51 unit tests, 14 e2e tests pass.
- Lighthouse ≥ baseline (prior builds also ~98/100/100/100).

## Decisions

- Routing: `/app/reminders` becomes a server-side redirect in the SPA to `/app` (Navigate replace). Keep settings-only knobs that already live on `/app/settings` where they are; move the rhythm/notifications/exercise-recommendation UI from Reminders into the Dashboard. Nothing from Reminders will survive as a route — but all meaningful UI must survive on Home.
- Visual phase-end alert: full-window logo on PiP, full-screen overlay on main tab, system notification icon. Setting `visualAlert` default true. Honors `prefers-reduced-motion`.
- Tab-close safety: `beforeunload` only while timer is running. Shows browser native text (cannot be customized). The copy "Si cerrás esta pestaña…" is shown next to the PiP button on Home and inside the PiP window, plus a one-time toast on first PiP open.
- Day reset: `calmo_last_active_day` key in localStorage tracks `YYYY-MM-DD` (local). When app opens and timer not running, compare to today → if different, hard-reset to initial WORK, zero cycle counter, zero manual adjustments for today, do not touch history.
- i18n: all new copy added in `src/lib/i18n/{en,es}.ts`. Keeping EN pure vs. anti-Spanish test.

## Shared focus rooms (Stage 2)

Backend already applied in Supabase (2026-10-25). The migration file `supabase/migrations/006_shared_focus_rooms.sql` mirrors what's live, with the header comment `Aplicada en producción el 2026-10-25 desde Claude.ai`.

- RPCs used: `create_focus_room(p_theme text default 'zen') → text`, `get_focus_room(p_code text) → json`, `log_room_event(p_code text, p_kind text)`.
- Realtime channel: `room:<code>` — presence for users, broadcast for timer state.
- Only lowest-presence-key client calls `log_room_event` on phase complete to avoid double logging.
- E2E rooms created by tests: list codes here when added.

### Room codes created by tests (clean up manually)

(none yet)

## Garden (Stage 3)

- Deterministic engine; same counts + seed → same SVG.
- 3 skins: Zen (sand furrows + stones + moss), Sky (stars + constellations), Companion (desk character).
- Preference `calmo_garden_theme` in localStorage.
- PNG export at 1080x1080 via `<canvas>` + inlined SVG.

## Pending / manual review

- Visual QA of garden styles.
- PiP window on real browser (Chromium) — e2e only feature-detects.
- Two-browser room sync test (manual).
