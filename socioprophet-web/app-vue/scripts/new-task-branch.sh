#!/usr/bin/env bash
set -euo pipefail
task="${1:?usage: scripts/new-task-branch.sh T-001-short-slug}"
git fetch origin
git checkout -B "work/${task}" origin/main
echo "Now on branch: work/${task}"
