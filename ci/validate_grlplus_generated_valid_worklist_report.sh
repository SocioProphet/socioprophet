#!/usr/bin/env bash
set -euo pipefail

python3 -m pip install "jsonschema>=4,<5"

python3 scripts/export_grlplus_worklist_report.py \
  --input standards/grlplus/examples/semantic_worklist_report.generated_semantic_valid.json \
  --platform github_issues \
  --output /tmp/grlplus-generated-valid-github-issues.json

python3 scripts/validate_grlplus_exports.py \
  github_issues \
  /tmp/grlplus-generated-valid-github-issues.json

python3 scripts/export_grlplus_worklist_report.py \
  --input standards/grlplus/examples/semantic_worklist_report.generated_semantic_valid.json \
  --platform ops_queue \
  --output /tmp/grlplus-generated-valid-ops-queue.json

python3 scripts/validate_grlplus_exports.py \
  ops_queue \
  /tmp/grlplus-generated-valid-ops-queue.json

printf '[grlplus-generated-valid-worklist-report-ci] OK\n'
