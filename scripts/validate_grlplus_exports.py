#!/usr/bin/env python3
"""Validate GRLPlus export bundles against strict platform schemas.

Usage:
  python3 scripts/validate_grlplus_exports.py github_issues <bundle.json>
  python3 scripts/validate_grlplus_exports.py ops_queue <bundle.json>

Exit codes:
  0 = OK
  2 = validation failure

Notes:
- dependency-light by design
- uses jsonschema when available
- treats this repo as an integration/export guardrail, not canonical subsystem runtime ownership
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict


REPO_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_MAP = {
    "github_issues": REPO_ROOT / "standards/grlplus/github_issue_export.schema.json",
    "ops_queue": REPO_ROOT / "standards/grlplus/ops_queue_export.schema.json",
}


def die(msg: str, code: int = 2) -> None:
    print(f"[grlplus-export-validate] ERROR: {msg}", file=sys.stderr)
    raise SystemExit(code)


def load_json(path: Path) -> Dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        die(f"failed to parse JSON {path}: {e}")
    if not isinstance(data, dict):
        die(f"{path} must parse to a JSON object")
    return data


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        die("usage: scripts/validate_grlplus_exports.py <github_issues|ops_queue> <bundle.json>")

    platform = argv[1].strip()
    bundle_path = Path(argv[2])
    if platform not in SCHEMA_MAP:
        die(f"unknown platform {platform!r}; expected one of: {', '.join(sorted(SCHEMA_MAP))}")
    if not bundle_path.exists():
        die(f"bundle not found: {bundle_path}")

    schema_path = SCHEMA_MAP[platform]
    if not schema_path.exists():
        die(f"schema not found: {schema_path}")

    bundle = load_json(bundle_path)
    schema = load_json(schema_path)

    try:
        import jsonschema  # type: ignore
    except Exception as e:
        die(f"missing dependency: jsonschema is required ({e})")

    try:
        jsonschema.validate(bundle, schema)
    except Exception as e:
        die(f"schema validation failed for {bundle_path}: {e}")

    print(f"[grlplus-export-validate] OK: {platform} {bundle_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
