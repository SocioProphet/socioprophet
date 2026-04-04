#!/usr/bin/env python3
"""Validate the AgentOS tool registry and enforce a basic license/risk gate.

Usage:
  python3 scripts/validate_registry.py registry/agentos-tool-registry.yaml config/base_image_tools.yaml [--strict]

Exit codes:
  0 = OK
  2 = validation failure

Notes:
- This is intentionally small and dependency-light.
- Treat this as a CI guardrail, not a full compliance system.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple


def die(msg: str, code: int = 2) -> None:
    print(f"[registry-validate] ERROR: {msg}", file=sys.stderr)
    raise SystemExit(code)


def warn(msg: str) -> None:
    print(f"[registry-validate] WARN: {msg}", file=sys.stderr)


def load_yaml(path: Path) -> Dict[str, Any]:
    try:
        import yaml  # type: ignore
    except Exception as e:
        die(f"missing dependency: pyyaml is required ({e})")

    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
    except Exception as e:
        die(f"failed to parse YAML {path}: {e}")

    if not isinstance(data, dict):
        die(f"{path} must parse to a YAML object")
    return data


def normalize_risk(risk: str) -> str:
    return (risk or "").strip().lower()


def has_red(risk: str) -> bool:
    r = normalize_risk(risk)
    # simple but effective: catches 'red', 'red/yellow', 'red (if bundled)', etc.
    return "red" in r


def main(argv: List[str]) -> int:
    if len(argv) < 3:
        die("usage: scripts/validate_registry.py <registry.yaml> <base_image_tools.yaml> [--strict]")

    registry_path = Path(argv[1])
    base_tools_path = Path(argv[2])
    strict = "--strict" in argv[3:]

    if not registry_path.exists():
        die(f"registry not found: {registry_path}")
    if not base_tools_path.exists():
        die(f"base-image tool list not found: {base_tools_path}")

    reg = load_yaml(registry_path)
    base_cfg = load_yaml(base_tools_path)

    tools = reg.get("tools")
    if not isinstance(tools, list):
        die("registry must contain a top-level 'tools: [...]' list")

    base_tools = base_cfg.get("base_image_tools")
    if not isinstance(base_tools, list) or not all(isinstance(x, str) for x in base_tools):
        die("base_image_tools.yaml must contain: base_image_tools: [id, id, ...]")

    # Index tools by id and validate uniqueness
    by_id: Dict[str, Dict[str, Any]] = {}
    for i, t in enumerate(tools):
        if not isinstance(t, dict):
            die(f"tools[{i}] must be an object")
        tid = t.get("id")
        if not isinstance(tid, str) or not tid.strip():
            die(f"tools[{i}].id is required")
        if tid in by_id:
            die(f"duplicate tool id: {tid}")
        by_id[tid] = t

        # Minimal required fields
        for k in ("name", "layer", "license_spdx", "license_source", "risk", "adapter", "default_context"):
            if k not in t:
                die(f"tool '{tid}' missing required field: {k}")

        ls = str(t.get("license_source") or "").strip().lower()
        if ls in ("", "unknown", "none", "n/a"):
            die(f"tool '{tid}' has invalid license_source: {t.get('license_source')!r}")

        # Surface license conflicts as warnings.
        for zm in (t.get("zip_meta") or []):
            if isinstance(zm, dict) and zm.get("license_conflict"):
                warn(
                    f"tool '{tid}' has license_conflict=true in zip metadata; "
                    f"signals={zm.get('license_signals')} package_json_license={zm.get('package_json_license')}"
                )

    errors: List[str] = []

    # Base image gate
    for tid in base_tools:
        if tid not in by_id:
            errors.append(f"base_image_tools includes unknown tool id: {tid}")
            continue
        t = by_id[tid]
        risk = str(t.get("risk") or "")
        if has_red(risk):
            errors.append(f"base_image_tools includes RED tool '{tid}' (risk={risk!r})")

        # For base images, license conflicts should be treated as at least a warning.
        for zm in (t.get("zip_meta") or []):
            if isinstance(zm, dict) and zm.get("license_conflict"):
                msg = (
                    f"base image tool '{tid}' has license_conflict=true; "
                    f"resolve before 'prod' builds"
                )
                if strict:
                    errors.append(msg)
                else:
                    warn(msg)

    if errors:
        for e in errors:
            print(f"[registry-validate] ERROR: {e}", file=sys.stderr)
        raise SystemExit(2)

    print("[registry-validate] OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
