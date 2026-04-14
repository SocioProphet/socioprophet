#!/usr/bin/env bash
set -euo pipefail

python3 -m pip install --upgrade pip jsonschema

python3 scripts/export_grlplus_worklist.py \
  --input standards/grlplus/examples/worklist_input.example.json \
  --platform github_issues \
  --profile strategy \
  --output /tmp/grlplus-github-issues.json

python3 scripts/validate_grlplus_exports.py \
  github_issues \
  /tmp/grlplus-github-issues.json

python3 scripts/export_grlplus_worklist.py \
  --input standards/grlplus/examples/worklist_input.example.json \
  --platform ops_queue \
  --profile strategy \
  --output /tmp/grlplus-ops-queue.json

python3 scripts/validate_grlplus_exports.py \
  ops_queue \
  /tmp/grlplus-ops-queue.json

printf '[grlplus-export-ci] OK\n'
