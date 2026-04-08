#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Use a temp dir so we don't create ./artifacts in the repo
OUTDIR="$(mktemp -d)"
trap 'rm -rf "$OUTDIR"' EXIT

if ! python3 -c 'import yaml' >/dev/null 2>&1; then
  echo "[check] ERROR: missing dependency: PyYAML (import yaml failed)." >&2
  echo "[check] Hint: install dev dependencies with: python3 -m pip install -r requirements-dev.txt" >&2
  exit 2
fi

python3 "$ROOT/scripts/validate_registry.py" \
  "$ROOT/registry/agentos-tool-registry.yaml" \
  "$ROOT/registry/base-image-tools.yaml" \
  --strict

python3 "$ROOT/agentplane/scripts/validate_bundle.py" \
  "$ROOT/agentplane/bundles/example-agent/bundle.json"

(
  cd "$ROOT/agentplane"
  bash scripts/hygiene.sh
)
