#!/usr/bin/env bash
set -euo pipefail

# Run node tests, capture combined output, preserve exit code.
tmp="$(mktemp)"
set +e
node --test test/firestore.rules.test.js >"$tmp" 2>&1
rc=$?
set -e

# Filter known noisy Firestore SDK lines produced by expected PERMISSION_DENIED in our tests.
# - The first line has @firebase/firestore:
# - The next lines may include "false for 'create'..." etc.
grep -v -E '^(\[[0-9]{4}-[0-9]{2}-[0-9]{2}T.*\]\s+@firebase/firestore:)|^(false for '\''(create|update)'\'' @ L[0-9]+)' "$tmp" || true

rm -f "$tmp"
exit "$rc"
