#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if ! command -v apalache-mc >/dev/null 2>&1; then
  echo "[apalache] apalache-mc not installed; falling back to Python state exploration"
  python3 "${ROOT}/check_deploy_model.py"
  exit 0
fi
apalache-mc check --config "${ROOT}/AgentplaneDeploy.cfg" "${ROOT}/AgentplaneDeploy.tla"
