#!/usr/bin/env bash
set -euo pipefail

python3 -m pip install "pip==24.3.1" "jsonschema==4.23.0"

python3 scripts/export_grlplus_worklist_report.py \
  --input standards/grlplus/examples/semantic_worklist_report.generated_semantic_contradictory.json \
  --platform github_issues \
  --output /tmp/grlplus-generated-github-issues.json

python3 scripts/validate_grlplus_exports.py \
  github_issues \
  /tmp/grlplus-generated-github-issues.json

python3 scripts/export_grlplus_worklist_report.py \
  --input standards/grlplus/examples/semantic_worklist_report.generated_semantic_contradictory.json \
  --platform ops_queue \
  --output /tmp/grlplus-generated-ops-queue.json

python3 scripts/validate_grlplus_exports.py \
  ops_queue \
  /tmp/grlplus-generated-ops-queue.json

printf '[grlplus-generated-worklist-report-ci] OK\n'
