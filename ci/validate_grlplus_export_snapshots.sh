#!/usr/bin/env bash
set -euo pipefail

python3 -m pip install "jsonschema>=4,<5"
python3 scripts/validate_grlplus_export_snapshots.py

printf '[grlplus-export-snapshot-ci] OK\n'
