# Live Host Runbook

## 1. Preflight

Run `python3 scripts/preflight_host.py`. OpenClaw currently requires Node 22.14+ and recommends Node 24. The first real host run should also have `openclaw` installed and either Docker or Podman available. OpenClaw rejects configs that fail schema validation, so do not skip validation before starting the gateway. See the OpenClaw getting-started, configuration, and troubleshooting pages.

## 2. Patch the existing config

Merge the provenance plugin into the active OpenClaw config with:

`python3 scripts/patch_openclaw_config.py --base ~/.openclaw/openclaw.json --backup --plugin-path /absolute/path/to/plugins/openclaw-socioprophet-provenance --distiller-url http://127.0.0.1:8080/v1/turns`

Then run:

- `openclaw config validate --json`
- `openclaw config schema > /tmp/openclaw-config-schema.json`

## 3. Start the support plane

Use `./scripts/run_support_plane.sh` and wait for health on LiteLLM, Qdrant, distiller, and reasoner.

## 4. Install and verify the plugin

Use `./scripts/install_plugin_linked.sh`, then:

- `openclaw plugins list --json`
- `openclaw plugins inspect socioprophet-provenance --json`
- `openclaw plugins doctor`

Restart or start the gateway as needed. OpenClaw’s plugin docs show `openclaw plugins install <path>` and then `openclaw gateway restart`.

## 5. Smoke test

Run the full smoke chain with exported tokens:

- `./scripts/smoke_openclaw_plugin.sh`
- `./scripts/smoke_distiller_commit.sh`
- `./scripts/smoke_reasoner_http.sh`

Or run `./scripts/host_smoke_all.sh` once everything is configured.

## 6. Capture immutable evidence

Run `./scripts/capture_live_evidence.sh` and keep the resulting timestamped directory as the first-pass proof packet.

## 7. Hyperon bridge proof

Run `./scripts/smoke_reasoner_hyperon.sh`. If local `metta-py`/`metta-repl` is not available, the bridge can try Docker/Podman based execution. Treat the result as `DerivedClaim` only until manually reviewed.
