#!/usr/bin/env bash
# Local verification suite. Exits non-zero on any failure.
# Prints a PASS/FAIL summary at the end.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STATUS=0
RESULTS=()

run() {
  local label="$1"; shift
  echo "---"
  echo "[verify] $label"
  if "$@"; then
    RESULTS+=("PASS  $label")
  else
    STATUS=1
    RESULTS+=("FAIL  $label")
  fi
}

echo "[verify] Node $(node --version), npm $(npm --version)"

run "tsc --noEmit" npx tsc --noEmit
run "eslint" npx eslint .
run "vitest (unit)" npx vitest run
run "build" npm run build

run "prerender" node scripts/prerender.mjs
run "og-images" node scripts/generate-og-images.mjs
run "verify-dist" node scripts/verify-dist.mjs

echo "---"
echo "[verify] grep for forbidden strings in src/ and dist/"
BAD_SRC=$(grep -RIn "calm-desk-companion\|signInWithOAuth\|fonts.googleapis\|lovable\|t\.me/\|Spotify\|open\.spotify\|pain_records\|console\\.log" src/ 2>/dev/null | grep -vE "test\.ts|spec\.ts|CLAUDE\\.md|scripts/" | grep -vE "^$" || true)
if [ -n "$BAD_SRC" ]; then
  echo "$BAD_SRC"
  RESULTS+=("FAIL  grep src")
  STATUS=1
else
  RESULTS+=("PASS  grep src")
fi

BAD_DIST=$(grep -RIn "calm-desk-companion\|fonts.googleapis\|lovable\|t\.me/\|open\.spotify" dist/ 2>/dev/null || true)
if [ -n "$BAD_DIST" ]; then
  echo "$BAD_DIST"
  RESULTS+=("FAIL  grep dist")
  STATUS=1
else
  RESULTS+=("PASS  grep dist")
fi

run "e2e (Playwright)" npx playwright test --reporter=line

# Lighthouse mobile on the landing pages. The script boots its own Playwright
# chromium so we don't double-start a browser; we just need vite preview up.
echo "---"
echo "[verify] lighthouse (mobile) on / and /es/"
PREVIEW_PID=""
if ! lsof -i :4173 >/dev/null 2>&1; then
  npx vite preview --port 4173 --strictPort >/tmp/calmo-verify-preview.log 2>&1 &
  PREVIEW_PID=$!
  # Give preview a moment to come up.
  for _ in $(seq 1 20); do
    if curl -sf http://localhost:4173/ -o /dev/null; then break; fi
    sleep 0.3
  done
fi
if LH_MIN_PERF=95 LH_MIN_A11Y=100 LH_MIN_SEO=95 LH_MIN_BP=95 \
    node scripts/lighthouse-mobile.mjs http://localhost:4173/ http://localhost:4173/es/; then
  RESULTS+=("PASS  lighthouse (mobile) on / and /es/")
else
  RESULTS+=("FAIL  lighthouse (mobile) on / and /es/")
  STATUS=1
fi
if [ -n "$PREVIEW_PID" ]; then
  kill "$PREVIEW_PID" >/dev/null 2>&1 || true
fi

echo
echo "========= VERIFY SUMMARY ========="
for line in "${RESULTS[@]}"; do
  echo "$line"
done
echo "=================================="
exit $STATUS
