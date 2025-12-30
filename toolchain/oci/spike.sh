#!/usr/bin/env bash
set -euo pipefail

# MODE:
#   local-http-offline: local registry over HTTP, no tlog, allow-http flags
#   harbor-tls-online:  Harbor over HTTPS, tlog on (or policy-driven), no allow-http
MODE="${MODE:-local-http-offline}"

# Registry + image settings
REG="${REG:-host.containers.internal:5000}"         # destination registry host:port (local registry default)
SRC="${SRC:-ghcr.io/nginxinc/nginx-unprivileged:1.27}"
DEST_REPO="${DEST_REPO:-nginxinc/nginx-unprivileged}"
TAG="${TAG:-1.27}"

# Derived
REF="${REG}/${DEST_REPO}:${TAG}"

# Mode flags
COSIGN_HTTP_FLAGS=()
COSIGN_TLOG_FLAGS=()
SKOPEO_DEST_TLS_FLAGS=()
CRANE_FLAGS=()
SYFT_ENV=()

case "$MODE" in
  local-http-offline)
    COSIGN_HTTP_FLAGS+=(--allow-http-registry --allow-insecure-registry)
    COSIGN_TLOG_FLAGS+=(--tlog-upload=false)
    SKOPEO_DEST_TLS_FLAGS+=(--dest-tls-verify=false)
    CRANE_FLAGS+=(--insecure)
    SYFT_ENV+=(SYFT_REGISTRY_INSECURE_USE_HTTP=true SYFT_REGISTRY_INSECURE_SKIP_TLS_VERIFY=true)
    VERIFY_TLOG_FLAGS+=(--insecure-ignore-tlog=true)
    ;;
  harbor-tls-online)
    # Defaults assume TLS is correct and Harbor is reachable at REG over HTTPS
    # Enable tlog by policy/decision. For now: allow normal verify (no insecure-ignore-tlog).
    ;;
  *)
    echo "Unknown MODE=$MODE (expected local-http-offline or harbor-tls-online)" >&2
    exit 2
    ;;
esac

echo "[spike] MODE=$MODE"
echo "[spike] SRC=$SRC"
echo "[spike] REF=$REF"

# 1) Mirror (multi-arch safe)
skopeo copy --all "${SKOPEO_DEST_TLS_FLAGS[@]}" "docker://${SRC}" "docker://${REF}"

# 2) Resolve digest (immutable)
DIGEST="$(crane digest "${CRANE_FLAGS[@]}" "${REF}")"
DIGREF="${REG}/${DEST_REPO}@${DIGEST}"
echo "[spike] DIGEST=$DIGEST"
echo "[spike] DIGREF=$DIGREF"

# 3) Ensure keys exist (kept local; gitignored)
if [[ ! -f cosign.key || ! -f cosign.pub ]]; then
  # Non-interactive if COSIGN_PASSWORD is set in env (empty allowed)
  : "${COSIGN_PASSWORD:=}"
  export COSIGN_PASSWORD
  cosign generate-key-pair
fi

# 4) SBOM
env "${SYFT_ENV[@]}" syft "registry:${DIGREF}" -o spdx-json=sbom.spdx.json

# 5) Sign + attest
cosign sign --yes --key cosign.key "${COSIGN_HTTP_FLAGS[@]}" "${COSIGN_TLOG_FLAGS[@]}" "${DIGREF}"
cosign attest --yes --key cosign.key "${COSIGN_HTTP_FLAGS[@]}" "${COSIGN_TLOG_FLAGS[@]}" --predicate sbom.spdx.json --type spdxjson "${DIGREF}"

# 6) Verify (tlog behavior depends on mode)
cosign verify --key cosign.pub "${COSIGN_HTTP_FLAGS[@]}" "${VERIFY_TLOG_FLAGS[@]:-}" "${DIGREF}"
cosign verify-attestation --key cosign.pub "${COSIGN_HTTP_FLAGS[@]}" "${VERIFY_TLOG_FLAGS[@]:-}" --type spdxjson "${DIGREF}"

# 7) Show attached artifacts
cosign tree "${COSIGN_HTTP_FLAGS[@]}" "${DIGREF}"

echo "[spike] OK"
