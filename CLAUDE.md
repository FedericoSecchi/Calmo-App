# CLAUDE.md — Guía interna de Calmo

Calmo (calmo.fit) es una PWA de hábitos saludables para trabajar con la computadora: timer de foco/pausas, ejercicios de movilidad, respiración, registro de dolor, agua y rachas. Side project con objetivo comercial.

## Stack

- **Vite + React 18 + TypeScript**, Tailwind + shadcn/ui, React Router.
- **Supabase** (auth + Postgres con RLS) solo para persistir datos de la cuenta (pausas, agua, ajustes manuales y ejercicios completados). El dolor NO viaja al servidor.
- **GitHub Pages** sirve el sitio estático en calmo.fit, deploy por GitHub Actions al pushear a `main`. Las rutas públicas se **prerenderizan a HTML estático** en el build.
- **PWA** vía `vite-plugin-pwa`.
- **Fuentes auto-hospedadas** (sin Google Fonts).

## Mapa del código

```
src/
  App.tsx               — rutas; i18n por URL para páginas públicas (/..., /es/...)
  main.tsx              — bootstrap
  contexts/
    AuthContext.tsx     — email+pass + modo invitado (sin OAuth)
    FocusTimerContext.tsx — timer, aviso pre-fin, título de pestaña, Document Picture-in-Picture
  hooks/
    useWaterLogs.ts     — vasos (server auth; localStorage invitado)
    useBreakLogs.ts     — pausas realizadas (server auth; localStorage invitado)
    useManualBreakAdjustments.ts — ajustes +/- por día (server auth; localStorage invitado)
    usePainRecords.ts   — SOLO localStorage, en ambos modos
    useExerciseCompletions.ts — ejercicios (server auth; localStorage invitado)
    useReminderSettings.ts — ajustes de recordatorios (server)
    useTimerPrefs.ts    — volumen (0-100) y aviso previo (0/60/120/300 s), SOLO localStorage en ambos modos
  lib/
    supabaseClient.ts
    analytics.ts        — track() anónimo (session_id en memoria)
    i18n/               — diccionarios en/es tipados
    exercises.ts
    prerender.ts        — helpers de hidratación segura
    timer.ts            — helpers puros (`shouldFirePreEndWarning`, `formatTimerTitle`)
    timerAudio.ts       — tonos sintetizados con Web Audio (focus end, break end, pre-end, countdown)
  pages/
    Index.tsx           — landing (en por defecto; variantes /es/)
    Auth.tsx            — email+pass con mensajes claros
    Onboarding.tsx
    app/                — Dashboard, Exercises, Reminders, Pain, Settings
    seo/                — páginas SEO en/es con slugs localizados
    legal/              — Privacy, Terms (en/es)
  components/
  layouts/
scripts/
  prerender.mjs         — Playwright + vite preview; genera HTML por ruta
  generate-sitemap.mjs
  generate-og-images.mjs
supabase/migrations/    — 002/003/004/005 (001 obsoleto)
tests/
  unit/                 — vitest (timer, stats, breathing, timer logic/warn/title)
  e2e/                  — Playwright (invitado, cuenta round-trip, idioma, waitlist, i18n-app, timer)
    i18n-app.spec.ts    — renderiza cada pantalla en inglés y falla si encuentra palabras típicas en español
    account.spec.ts     — round-trip de cuenta usando contextos de navegador separados
    timer.spec.ts       — título de pestaña + persistencia de volumen + feature-detection de PiP
    helpers.ts          — helpers (deleteAccountByCredentials, e2eEmail)
scripts/verify.sh       — ciclo de verificación local
```

## Reglas de trabajo

- `main` es producción. Cada push a `main` despliega. Solo pushear con `scripts/verify.sh` en PASS local.
- Idiomas: **inglés en la raíz** con slugs actuales; **español bajo `/es/`** con slugs en español. hreflang en/es + x-default → inglés.
- **i18n completa en la app**: todo texto visible (Dashboard, Reminders, Exercises, Pain, Settings, Onboarding, Auth, dialogs, toasts, errores) sale del diccionario tipado en `src/lib/i18n/{en,es}.ts`. En las páginas públicas el idioma lo define la URL; en la app, la preferencia guardada → navegador → inglés.
- **Privacidad mínima**: sin cookies de terceros, sin GA, sin banner. Fuentes locales. Analítica propia anónima (`events`) con `session_id` en memoria. La analítica se omite en navegadores automatizados (Playwright, Lighthouse) para no inflar métricas.
- Auth: email + contraseña nomás. Sin Google OAuth. Confirmación por email desactivada en Supabase; sin "forgot password" (no hay SMTP). `persistSession: true` siempre.
- `@supabase/supabase-js` 2.118+ (v2.107 reemplazó `navigator.locks` por un commit guard). Mantener actualizado: login/logout/delete deben completar en segundos. Si vuelve a aparecer latencia, revisar changelog de auth antes de agregar workarounds.
- Borrado de cuenta: `supabase.rpc("delete_my_account")` seguido de `supabase.auth.signOut({ scope: "local" })`. Sin REST directo ni limpieza manual de `sb-*`.
- **Dolor solo en el dispositivo** (localStorage), también para usuarios logueados. La UI lo dice en una línea.
- **Plan Pro en lista de espera** (USD 4,99/mes, "en desarrollo"), inserta en `waitlist` (unique email → duplicado es éxito). Tests envían `source="e2e"` vía `?source=e2e` para filtrar métricas.
- No agregar features ni abstracciones no pedidas. No logs de debug en prod.

## Datos / Supabase

Proyecto: `wtquhlfodfqjcggaqxwk` · URL: `https://wtquhlfodfqjcggaqxwk.supabase.co`
Anon key: pública por diseño, protegida por RLS, vive en `.env` commiteado.

Tablas:
- `profiles` (preexistente, poco usada)
- `reminder_settings`, `water_logs`, `break_logs`, `manual_break_adjustments`, `exercise_completions`: datos del usuario, RLS por `auth.uid()`.
- `events`: insert anónimo (sin user_id, sin IP, sin cookie). Nombre, path, lang, session_id, referrer_host, props.
- `waitlist`: insert anónimo, email único. Duplicado = éxito para el usuario.

Funciones:
- `delete_my_account()` (authenticated): borra `auth.users` del usuario → cascada a todo lo suyo.
- `ping()` (anon): devuelve 1 para keepalive.

Si falta esquema: escribí migración nueva, marcala PENDIENTE, adaptá el código para no romper.

## Despliegue y verificación

- Workflow `deploy.yml` buildea, inyecta `build-id` (sha corto) en el HTML prerenderizado como `<meta name="build-id">`, y publica a GitHub Pages.
- Workflow `keepalive.yml` llama `rpc/ping` cada 3 días; falla visible si no responde 200.
- Dominio: calmo.fit con CNAME en `public/`.
- Verificación local: `bash scripts/verify.sh` (build, tsc, vitest, lint, prerender, grep de prohibidos, e2e Playwright). Debe quedar todo en PASS antes de push.
- Verificación producción: polling de `build-id` en `https://calmo.fit`, `curl -sI` a canónicas, e2e remoto.

## Checks rápidos

- `curl -s -X POST https://wtquhlfodfqjcggaqxwk.supabase.co/rest/v1/rpc/ping -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Content-Type: application/json"` → `1`
- `npm run build && grep -R "calm-desk-companion\|signInWithOAuth\|pain_records\|Telegram\|Spotify\|fonts.googleapis\|lovable" src dist` → sin resultados
- `curl -sI https://calmo.fit/` → `200`
