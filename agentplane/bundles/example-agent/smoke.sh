#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-./artifacts/example-agent}"
mkdir -p "$OUT_DIR"

# Run Artifact stub (shape matches TrustFirst "Run Artifact" concept)
cat > "$OUT_DIR/run-artifact.json" <<JSON
{
  "kind": "RunArtifact",
  "bundle": "example-agent@0.1.0",
  "startedAt": "$(date -Iseconds)",
  "inputs": { "note": "stub - will be replaced by real VM run capture" },
  "toolCalls": [],
  "outputs": { "note": "stub" },
  "environment": { "note": "stub - will include kernel, nix store paths, module hashes" }
}
JSON

# Placement Receipt stub (even locally, we emit the receipt shape)
cat > "$OUT_DIR/placement-receipt.json" <<JSON
{
  "kind": "PlacementReceipt",
  "bundle": "example-agent@0.1.0",
  "decision": {
    "chosenSite": "local-host",
    "backend": "qemu-local",
    "constraints": { "networkMode": "nat", "lane": "staging" },
    "rejectedSites": [],
    "objective": { "note": "stub - fleet will populate scores later" }
  },
  "signedBy": "UNSET",
  "createdAt": "$(date -Iseconds)"
}
JSON

echo "[smoke] wrote artifacts to $OUT_DIR"
