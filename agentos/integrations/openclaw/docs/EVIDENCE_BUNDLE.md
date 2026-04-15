# Evidence Bundle Layout

`scripts/capture_live_evidence.sh` writes a timestamped directory under `evidence/` containing:

- `manifest.jsonl`: one line per command, with success flag
- `preflight.json`: host capability probe
- OpenClaw status/config/plugin diagnostics when `openclaw` is installed
- plugin, distiller, and reasoner health payloads when those surfaces are reachable
- container runtime inventory and compose status when Docker or Podman is present

This bundle is the minimum proof packet for the first live run. Keep it immutable once captured.
