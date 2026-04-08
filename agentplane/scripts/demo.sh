#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

BUNDLE_DIR="${1:-bundles/example-agent}"
PROFILE="${2:-staging}"
SYSTEM="${3:-aarch64-linux}"

rm -rf artifacts/example-agent
mkdir -p artifacts/example-agent

./scripts/hygiene.sh
./scripts/doctor.sh "${SYSTEM}"
./runners/qemu-local.sh run "${BUNDLE_DIR}" --profile "${PROFILE}" --system "${SYSTEM}" --watch

echo
echo "[demo] artifacts/example-agent:"
ls -la artifacts/example-agent
echo
echo "[demo] run-artifact.json:"
cat artifacts/example-agent/run-artifact.json
echo
echo "[demo] placement-receipt.json:"
cat artifacts/example-agent/placement-receipt.json
echo
echo "[demo] replay-artifact.json:"
cat artifacts/example-agent/replay-artifact.json
