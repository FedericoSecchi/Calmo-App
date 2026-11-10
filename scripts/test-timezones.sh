#!/usr/bin/env bash
# Runs the date-sensitive unit tests under several timezones. Every zone must
# pass: "a day" is the user's local calendar day (src/lib/localDay.ts).
# Each zone has a hard time limit so a stuck vitest worker fails the run
# instead of hanging verify.sh forever.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ZONES=(UTC Europe/Zagreb America/Argentina/Buenos_Aires America/Los_Angeles Pacific/Auckland)
FILES=(src/lib/localDay.test.ts src/lib/stats.test.ts src/lib/dayReset.test.ts src/lib/garden/engine.test.ts)
LIMIT_SEC="${TZ_TEST_LIMIT_SEC:-180}"

STATUS=0
SUMMARY=()
for tz in "${ZONES[@]}"; do
  echo "[tz] $tz"
  # perl alarm: portable timeout (macOS has no coreutils `timeout`).
  if TZ="$tz" perl -e 'alarm shift; exec @ARGV' "$LIMIT_SEC" \
      npx vitest run "${FILES[@]}" --testTimeout=10000; then
    SUMMARY+=("PASS  $tz")
  else
    STATUS=1
    SUMMARY+=("FAIL  $tz (exit $?; 142 = timed out after ${LIMIT_SEC}s)")
  fi
done

echo "[tz] ---"
for line in "${SUMMARY[@]}"; do echo "[tz] $line"; done
exit $STATUS
