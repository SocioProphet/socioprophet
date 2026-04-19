#!/usr/bin/env python3
"""Export a semantic worklist report shape into strict GRLPlus platform bundles.

Usage:
  python3 scripts/export_grlplus_worklist_report.py \
    --input standards/grlplus/examples/semantic_worklist_report.example.json \
    --platform github_issues \
    --output /tmp/github.json

  python3 scripts/export_grlplus_worklist_report.py \
    --input standards/grlplus/examples/semantic_worklist_report.example.json \
    --platform ops_queue \
    --output /tmp/queue.json

This shim accepts the report-like surface already used in practice and emits the
strict repo-bound bundle formats defined under standards/grlplus/.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List


def die(msg: str, code: int = 2) -> None:
    print(f"[grlplus-export-report] ERROR: {msg}", file=sys.stderr)
    raise SystemExit(code)


def load_json(path: Path) -> Dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        die(f"failed to parse JSON {path}: {e}")
    if not isinstance(data, dict):
        die(f"{path} must parse to a JSON object")
    return data


def main(argv: List[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--platform", required=True, choices=["github_issues", "ops_queue"])
    ap.add_argument("--output", required=True)
    args = ap.parse_args(argv[1:])

    input_path = Path(args.input)
    report = load_json(input_path)
    profile = report.get("active_domain_profile") or report.get("profile") or "strategy"
    items = report.get("items")
    if not isinstance(items, list):
        die("input report JSON must contain an 'items' list")

    # Repackage to the generic input surface expected by export_grlplus_worklist.py
    generic_payload = {
        "profile": profile,
        "items": items,
    }
    temp_generic = Path(args.output).with_suffix(".generic-input.json")
    temp_generic.write_text(json.dumps(generic_payload, indent=2, sort_keys=True), encoding="utf-8")

    cmd = [
        sys.executable,
        str(Path(__file__).resolve().parent / "export_grlplus_worklist.py"),
        "--input", str(temp_generic),
        "--platform", args.platform,
        "--profile", str(profile),
        "--output", str(args.output),
    ]

    try:
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            die(f"delegated export failed: {e}")
    finally:
        try:
            temp_generic.unlink()
        except FileNotFoundError:
            pass
        except OSError as e:
            die(f"failed to remove temporary file {temp_generic}: {e}")

    print(f"[grlplus-export-report] OK: wrote {args.platform} bundle to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
