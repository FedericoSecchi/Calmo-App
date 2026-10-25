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
- [x] Stage 2 — Shared focus rooms (verify PASS 2026-10-25)
- [x] Stage 3 — Garden with 3 styles (verify PASS 2026-10-25)

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

Rooms created by room.spec.ts persist with `created_by = NULL` after the e2e+
account is deleted (FK is `ON DELETE SET NULL`). They don't harm production
but can be dropped by running:

```sql
delete from public.room_events where room_id in (
  select id from public.focus_rooms where code = ANY($1)
);
delete from public.focus_rooms where code = ANY($1);
```

Known codes (2026-10-25):

- `ab4807ea` (first iteration — local)
- `025c5ebf` (local)
- `b2f9b541` (local verify)
- `18774c17` (manual script run)
- `686449b7` (remote e2e against prod, Stage 2 verify)
- `f7692a14` (local verify, Stage 3)
- `9ff5735f` (remote e2e against prod, Stage 3 verify)

## Garden (Stage 3)

- Deterministic engine; same counts + seed → same SVG.
- 3 skins: Zen (sand furrows + stones + moss), Sky (stars + constellations), Companion (desk character).
- Preference `calmo_garden_theme` in localStorage.
- PNG export at 1080x1080 via `<canvas>` + inlined SVG.

## Polish pass (2026-10-25)

Visual-review fixes across the whole stack. Highlights:

- Spanish neutro de tú across the entire dictionary, SEO, legal and route meta. Dedicated unit test `src/lib/i18n/es.test.ts` detects voseo (querés, hacé, registrate, cerrás, acá, vos, etc.); CLAUDE.md documents the rule.
- Room: no more hardcoded "Beto · you" leak — `youSuffix` lives in i18n, the garden card now reads "Jardín de la sala" + style, and anyone can pick a rhythm while the timer is paused. The creator's `selectedPreset` seeds the room's rhythm; broadcast state carries `rhythmId/focusSec/breakSec` so joiners sync.
- Garden empty states: zen now draws sand with straight parallel rake lines, concentric rings carved around a hero stone, and moss hugging the stones (no more "topographic map" look). Sky has a true sunset gradient with a soft sun and the first star for day zero. Companion renders a visible sapling and the plant sits on the LEFT side of the desk — opposite the stretching arm — so they never overlap. Weekly companion view uses a `weeklyBoost` scale factor so the plant reads bigger than today. Each style has a guidance line on empty: "Tu primera pausa traza el primer surco" / "Tu primera pausa enciende la primera estrella" / "Tu primera pausa le ayuda a estirarse" and English equivalents.
- Dashboard: Meditation coming-soon card removed; action buttons use `whitespace-normal min-w-0 flex-1` so Foco-con-amigos (and all other cards) wrap at 375/768/1280. New e2e `tests/e2e/layout.spec.ts` asserts `scrollWidth<=clientWidth` per card at those widths.
- Invite preview: new `/join/` + `/es/unirse/` prerendered pages respond 200 with og:title/description/image, `robots: noindex, nofollow` and a JS redirect to `/app/room/<code>` from `?c=`. Dedicated 1200×630 og images (`og-image-join-{en,es}.png`) generated by `scripts/generate-og-images.mjs`. Share/copy-link in Room now point at `/join/?c=` (`/es/unirse/?c=` under es). Not in the sitemap; verify.sh and verify-dist.mjs enforce the og tags + noindex per-build.
- Auth: client-side 8-char guard (fires `weakPassword` toast without a Supabase call), live counter and rule hint under the field, extra error mappings for "too many requests" and an `unknownWithReason` fallback that surfaces the server message. `useReminderSettings` switched to `maybeSingle()` and creates the default row when none exists → no more 406 after sign-up. Garden alt text moved to the dict so Spanish readers no longer see "Your zen garden today: nothing logged yet.". E2E `tests/e2e/auth-password.spec.ts` asserts a 5-char password never hits `/auth/v1/signup`.
- Rooms cascade-delete: `tests/e2e/room.spec.ts` now checks that `get_focus_room` returns `[]` after the creator's account is wiped (DB schema change already applied via Claude.ai).

### Room codes added (2026-10-25 polish pass)

- `30ab4ba0` (local verify run #1 — garden test failure)
- `1a27a08f` (local verify run #2 — all PASS; room cascade-delete assertion verified)
- `b6f96db7` (local verify run #3 — final PASS at 98/100/100/100; cascade-delete verified)
- `1d2a18d6` (remote e2e against prod — polish-pass verify PASS, build-id af22c4f)

## Rooms as a state (2026-10-25 pass 2)

- `supabase/migrations/007_room_names_and_my_rooms.sql` documents the live schema (already applied via Claude.ai): `focus_rooms.name`, `rename_focus_room`, `get_focus_room_meta`, `list_my_rooms`, and the FK swap to `ON DELETE CASCADE` for both `focus_rooms.created_by` and `room_events.room_id` so account deletes cascade their rooms (no more orphan e2e rooms).
- New global `ActiveRoomContext` wires an "active room" slot per-browser (localStorage key `calmo_active_room`). It's a single source of truth across every `/app` surface:
  - a thin fixed strip "En sala: <name> · <n> personas · Abrir · Salir" renders on every /app route except the room page itself;
  - the Dashboard timer card, the center FAB, the tab title and the PiP window all pull from `useAppTimer()`, which routes to the room's shared timer when a room is active and to the personal pomodoro otherwise;
  - when a room becomes active, the personal timer auto-pauses and PiP closes so the user never sees two timers.
- Dashboard's "Foco con amigos" is replaced by `MyRoomsCard` showing: "Volver a <name>" (when active), a merged list of `list_my_rooms()` + locally-visited rooms (dedup by code, newest-first, max 10), per-room Entrar/Copiar link/Renombrar (owner-only), and a "Crear sala nueva" dialog with an optional name (default "Sala de &lt;nickname&gt;").
- Room page now reads from the shared context, lets the owner rename inline, and ships a confirm-protected "Salir de la sala" that clears only the local slot — the room keeps running for everyone else.
- PWA: `start_url` → `/app`, `launch_handler.client_mode: "navigate-existing"`, `handle_links: "preferred"`. Chromium ≥92/≥102 honors these; Safari/iOS and Firefox/Android ignore both fields today (manifest still parses). `/join/?c=<code>` already handles the SPA redirect so the installed app lands directly in the room.
- `tests/e2e/active-room.spec.ts` covers the four flows the user asked for: link join + reconnect across a fresh browser context, Mis salas list + rename for the owner, center button pausing the room timer in <2 s on another browser, and invitee not seeing the rename button + strip-Leave clearing the active room. Rooms created by this spec cascade-delete with the account.
- `verify.sh`: PASS on all steps including Lighthouse mobile. Perf on cold-after-e2e runs dipped from 98 → 97 on both landings (JS +~300 B gzip from the extra i18n keys for the room UX); warm standalone runs still hit 98 reliably. Threshold stays at 95.

### Rooms-as-state room codes (2026-10-25)

- (fill in after remote verify)

## Pending / manual review

- Visual QA of garden styles.
- PiP window on real browser (Chromium) — e2e only feature-detects.
- Two-browser room sync test (manual).
- PWA link capture matrix: Chromium 92+ (`handle_links: "preferred"`) and 102+ (`launch_handler.client_mode: "navigate-existing"`) → calmo.fit links open the installed PWA (after user approval). Safari/iOS 17+ ignores both fields and still opens Safari; the user has to invoke the PWA manually. Firefox Android ignores both; opens the browser tab. Documented so no surprises when the owner installs the app on different platforms.
