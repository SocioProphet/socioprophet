#!/usr/bin/env bash
set -euo pipefail
MODE="${MODE:-local-http-offline}"
REG="${REG:-host.containers.internal:5000}"
COSIGN_PASSWORD="${COSIGN_PASSWORD:-}"

# If we're targeting the local dev registry, ensure it exists (host-side).
if [[ "$REG" == "host.containers.internal:5000" || "$REG" == "localhost:5000" || "$REG" == "127.0.0.1:5000" ]]; then
  podman ps --format "{{.Names}}" | grep -qx local-registry || podman run -d --name local-registry -p 5000:5000 registry:2
fi

exec podman run --rm -it -v "$PWD:/work" -w /work supplychain-tools:local \
  bash -lc "MODE='${MODE}' REG='${REG}' COSIGN_PASSWORD='${COSIGN_PASSWORD}' bash toolchain/oci/spike.sh"
