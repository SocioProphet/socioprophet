# One-line Commands

## Patch an existing OpenClaw config with the provenance plugin

```bash
cd /path/to/local_first_ai_stack_v5 && python3 scripts/patch_openclaw_config.py --base ~/.openclaw/openclaw.json --backup --plugin-path "$(pwd)/plugins/openclaw-socioprophet-provenance" --distiller-url http://127.0.0.1:8080/v1/turns
```

## Preflight the host

```bash
cd /path/to/local_first_ai_stack_v5 && python3 scripts/preflight_host.py
```

## Start the support plane

```bash
cd /path/to/local_first_ai_stack_v5 && ./scripts/run_support_plane.sh
```

## Install the linked plugin and inspect it

```bash
cd /path/to/local_first_ai_stack_v5 && ./scripts/install_plugin_linked.sh && openclaw plugins list --json && openclaw plugins inspect socioprophet-provenance --json && openclaw plugins doctor
```

## Smoke the plugin and service plane

```bash
cd /path/to/local_first_ai_stack_v5 && OPENCLAW_GATEWAY_TOKEN=... DISTILLER_SHARED_TOKEN=... REASONER_SHARED_TOKEN=... ./scripts/host_smoke_all.sh
```

## Capture a first evidence bundle without re-running writes

```bash
cd /path/to/local_first_ai_stack_v5 && OPENCLAW_GATEWAY_TOKEN=... ./scripts/capture_live_evidence.sh
```

## Run the Hyperon CLI bridge candidate directly

```bash
cd /path/to/local_first_ai_stack_v5 && python3 reasoner/hyperon_cli_bridge.py --job examples/reasoning-job.example.json --mode auto --output pretty
```
