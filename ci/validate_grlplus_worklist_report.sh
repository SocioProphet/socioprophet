#!/usr/bin/env bash
set -euo pipefail

python3 -m pip install "jsonschema>=4,<5"

python3 scripts/export_grlplus_worklist_report.py \
  --input standards/grlplus/examples/semantic_worklist_report.example.json \
  --platform github_issues \
  --output /tmp/grlplus-report-github-issues.json

python3 scripts/validate_grlplus_exports.py \
  github_issues \
  /tmp/grlplus-report-github-issues.json

python3 scripts/export_grlplus_worklist_report.py \
  --input standards/grlplus/examples/semantic_worklist_report.example.json \
  --platform ops_queue \
  --output /tmp/grlplus-report-ops-queue.json

python3 scripts/validate_grlplus_exports.py \
  ops_queue \
  /tmp/grlplus-report-ops-queue.json

printf '[grlplus-worklist-report-ci] OK\n'
