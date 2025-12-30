#!/usr/bin/env bash
set -euo pipefail

MODE="${MODE:-local-http-offline}"
REG="${REG:-host.containers.internal:5000}"
COSIGN_PASSWORD="${COSIGN_PASSWORD:-}"

command -v podman >/dev/null 2>&1 || { echo "podman not found on host" >&2; exit 127; }

# Ensure tool image exists (host-side).
podman image exists supplychain-tools:local >/dev/null 2>&1 || \
  podman build -t supplychain-tools:local -f toolchain/oci/Dockerfile toolchain/oci

# If we're targeting the local dev registry, ensure it exists (host-side).
if [[ "$REG" == "host.containers.internal:5000" || "$REG" == "localhost:5000" || "$REG" == "127.0.0.1:5000" ]]; then
  podman ps --format "{{.Names}}" | grep -qx local-registry || podman run -d --name local-registry -p 5000:5000 registry:2
fi

exec podman run --rm -it -v "$PWD:/work" -w /work supplychain-tools:local \
  bash -lc "MODE='$MODE' REG='$REG' COSIGN_PASSWORD='$COSIGN_PASSWORD' COSIGN_YES=true bash toolchain/oci/spike.sh"
