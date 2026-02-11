#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Use a temp dir so we don't create ./artifacts in the repo
OUTDIR="$(mktemp -d)"
trap 'rm -rf "$OUTDIR"' EXIT

python3 "$ROOT/scripts/validate_registry.py" \
  "$ROOT/registry/agentos-tool-registry.yaml" \
  "$ROOT/registry/base-image-tools.yaml" \
  --strict

python3 "$ROOT/agentplane/scripts/validate_bundle.py" \
  "$ROOT/agentplane/bundles/example-agent/bundle.json" \
  --out-dir "$OUTDIR"
