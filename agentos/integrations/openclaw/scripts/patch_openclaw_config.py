#!/usr/bin/env python3
import argparse
import json
import shutil
from pathlib import Path
from typing import Any

DEFAULT_PLUGIN_ID = "socioprophet-provenance"
DEFAULT_PLUGIN_PATH = "./plugins/openclaw-socioprophet-provenance"


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    raw = path.read_text(encoding="utf-8").strip()
    return json.loads(raw) if raw else {}


def ensure_list(parent: dict[str, Any], key: str) -> list[Any]:
    cur = parent.get(key)
    if not isinstance(cur, list):
        cur = []
        parent[key] = cur
    return cur


def ensure_dict(parent: dict[str, Any], key: str) -> dict[str, Any]:
    cur = parent.get(key)
    if not isinstance(cur, dict):
        cur = {}
        parent[key] = cur
    return cur


def main() -> int:
    ap = argparse.ArgumentParser(description="Merge the Socioprophet provenance plugin into an existing OpenClaw config.")
    ap.add_argument("--base", required=True, help="Path to existing openclaw.json")
    ap.add_argument("--output", help="Write merged config here; defaults to in-place")
    ap.add_argument("--backup", action="store_true", help="Write <base>.bak before in-place update")
    ap.add_argument("--plugin-id", default=DEFAULT_PLUGIN_ID)
    ap.add_argument("--plugin-path", default=DEFAULT_PLUGIN_PATH)
    ap.add_argument("--distiller-url", default="http://127.0.0.1:8080/v1/turns")
    ap.add_argument("--bearer-token-env-var", default="DISTILLER_SHARED_TOKEN")
    ap.add_argument("--route-path", default="/sp/provenance/health")
    ap.add_argument("--emit-message-events", choices=["true", "false"], default="true")
    ap.add_argument("--emit-tool-events", choices=["true", "false"], default="true")
    args = ap.parse_args()

    base_path = Path(args.base).expanduser().resolve()
    out_path = Path(args.output).expanduser().resolve() if args.output else base_path
    cfg = load_json(base_path)
    if args.backup and out_path == base_path and base_path.exists():
        backup_path = base_path.with_suffix(base_path.suffix + ".bak")
        shutil.copy2(base_path, backup_path)

    plugins = ensure_dict(cfg, "plugins")
    plugins["enabled"] = True
    load = ensure_dict(plugins, "load")
    paths = ensure_list(load, "paths")
    if args.plugin_path not in paths:
        paths.append(args.plugin_path)
    entries = ensure_dict(plugins, "entries")
    entry = ensure_dict(entries, args.plugin_id)
    entry["enabled"] = True
    entry["config"] = {
        "distillerUrl": args.distiller_url,
        "bearerTokenEnvVar": args.bearer_token_env_var,
        "emitMessageEvents": args.emit_message_events == "true",
        "emitToolEvents": args.emit_tool_events == "true",
        "routePath": args.route_path,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(cfg, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "ok": True,
        "base": str(base_path),
        "output": str(out_path),
        "plugin_id": args.plugin_id,
        "plugin_path_present": args.plugin_path in paths,
        "distiller_url": entry["config"]["distillerUrl"],
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
