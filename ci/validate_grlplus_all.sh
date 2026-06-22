#!/usr/bin/env bash
set -euo pipefail

bash ci/validate_grlplus_exports.sh
bash ci/validate_grlplus_worklist_report.sh
bash ci/validate_grlplus_generated_worklist_report.sh
bash ci/validate_grlplus_generated_valid_worklist_report.sh

printf '[grlplus-all-ci] OK\n'
