#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(".")
DOCTRINE = ROOT / "docs" / "philosophy" / "liberty-by-design.md"

def die(msg: str) -> int:
    print(f"ERR: {msg}", file=sys.stderr)
    return 2

def main() -> int:
    if not DOCTRINE.exists():
        return die("Doctrine file missing: docs/philosophy/liberty-by-design.md")

    s = DOCTRINE.read_text(encoding="utf-8")

    if "## Related Specs (stubs → formal specs)" not in s:
        return die("Doctrine missing Related Specs block (required).")

    # Extract markdown paths in the Related Specs block.
    # We accept lines like: "- Name: path/to/file.md"
    block = s.split("## Related Specs (stubs → formal specs)", 1)[1]
    # Stop at next top-level header
    m = re.search(r"\n#\s+", block)
    if m:
        block = block[:m.start()]

    paths = []
    for line in block.splitlines():
        line = line.strip()
        if not line.startswith("- "):
            continue
        if ": " not in line:
            continue
        _, p = line.split(": ", 1)
        p = p.strip()
        if p.endswith(".md"):
            paths.append(p)

    if not paths:
        return die("No spec paths found in Related Specs block.")

    missing = []
    for p in paths:
        if not (ROOT / p).exists():
            missing.append(p)

    if missing:
        return die("Missing referenced spec files:\n  - " + "\n  - ".join(missing))

    # Minimal content checks to prevent “empty shells”
    # Ensure audit/replay spec actually mentions replay.
    replay_candidates = [p for p in paths if "replay" in p or "audit" in p]
    for p in replay_candidates:
        txt = (ROOT / p).read_text(encoding="utf-8", errors="replace")
        if re.search(r"\breplay\b", txt, flags=re.I) is None:
            return die(f"Spec {p} must mention 'replay' (anti-proof-theater guard).")

    print("OK: doctrine links + minimal replay guards pass.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
