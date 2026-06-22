#!/usr/bin/env python3
"""Validate stable GRLPlus export output invariants against snapshot expectations.

This intentionally checks stable, reviewable invariants rather than comparing entire
JSON files byte-for-byte. Full output can include ordering/formatting details that
are less important than the platform contract, repo binding, item counts, and first
item identity/intervention posture.
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict


ROOT = Path(__file__).resolve().parents[1]
EXPECTATIONS = ROOT / "standards/grlplus/examples/export_snapshot_expectations.json"
FIXTURES = {
    "generated_semantic_contradictory": ROOT / "standards/grlplus/examples/semantic_worklist_report.generated_semantic_contradictory.json",
    "generated_semantic_valid": ROOT / "standards/grlplus/examples/semantic_worklist_report.generated_semantic_valid.json",
}


def die(msg: str, code: int = 2) -> None:
    print(f"[grlplus-export-snapshots] ERROR: {msg}", file=sys.stderr)
    raise SystemExit(code)


def load_json(path: Path) -> Dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        die(f"failed to parse JSON {path}: {e}")
    if not isinstance(data, dict):
        die(f"{path} must parse to a JSON object")
    return data


def run_export(fixture: Path, platform: str, output: Path) -> Dict[str, Any]:
    cmd = [
        sys.executable,
        str(ROOT / "scripts/export_grlplus_worklist_report.py"),
        "--input",
        str(fixture),
        "--platform",
        platform,
        "--output",
        str(output),
    ]
    subprocess.run(cmd, check=True)
    return load_json(output)


def assert_eq(label: str, actual: Any, expected: Any) -> None:
    if actual != expected:
        die(f"{label}: expected {expected!r}, got {actual!r}")


def validate_github(name: str, payload: Dict[str, Any], expected: Dict[str, Any]) -> None:
    assert_eq(f"{name}.github.repo_full_name", payload.get("repo_full_name"), expected.get("repo_full_name"))
    items = payload.get("items")
    if not isinstance(items, list):
        die(f"{name}.github.items must be a list")
    assert_eq(f"{name}.github.item_count", len(items), expected.get("items"))
    if items:
        first = items[0]
        for field, value in (expected.get("first_item") or {}).items():
            assert_eq(f"{name}.github.first_item.{field}", first.get(field), value)


def validate_queue(name: str, payload: Dict[str, Any], expected: Dict[str, Any]) -> None:
    items = payload.get("items")
    if not isinstance(items, list):
        die(f"{name}.ops_queue.items must be a list")
    assert_eq(f"{name}.ops_queue.item_count", len(items), expected.get("items"))
    if items:
        first = items[0]
        for field, value in (expected.get("first_item") or {}).items():
            assert_eq(f"{name}.ops_queue.first_item.{field}", first.get(field), value)


def main() -> int:
    expectations = load_json(EXPECTATIONS).get("expectations")
    if not isinstance(expectations, dict):
        die("expectations file must contain an expectations object")

    with tempfile.TemporaryDirectory(prefix="grlplus-export-snapshots-") as td:
        tmp = Path(td)
        for name, fixture in FIXTURES.items():
            if name not in expectations:
                die(f"missing expectation block for {name}")
            if not fixture.exists():
                die(f"missing fixture for {name}: {fixture}")
            expected = expectations[name]
            github_payload = run_export(fixture, "github_issues", tmp / f"{name}.github.json")
            queue_payload = run_export(fixture, "ops_queue", tmp / f"{name}.queue.json")
            validate_github(name, github_payload, expected["github_issues"])
            validate_queue(name, queue_payload, expected["ops_queue"])

    print("[grlplus-export-snapshots] OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
