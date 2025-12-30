# OCI Supply Chain Spike (canonical)

This folder is our pinned, repeatable “mirror → digest → SBOM → sign → attest → verify” loop.

## Modes

### Local HTTP + Offline (today)
- Uses local registry (HTTP)
- Disables tlog upload and skips tlog verification (expected warning)
- Requires: podman registry container running on :5000

Run:
  MODE=local-http-offline REG=host.containers.internal:5000 bash toolchain/oci/spike.sh

### Harbor TLS + Online (later)
- Uses Harbor over HTTPS
- No allow-http flags
- Decide tlog policy (on by default in production)

Run (example):
  MODE=harbor-tls-online REG=harbor.example.com bash toolchain/oci/spike.sh

## Keys
Keys are generated locally and are gitignored:
- cosign.key
- cosign.pub

For non-interactive use, set COSIGN_PASSWORD in the environment.
