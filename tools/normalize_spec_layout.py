#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(".")
SPEC_ROOT = ROOT / "spec"
DOCTRINE = ROOT / "docs" / "philosophy" / "liberty-by-design.md"
DOCS_INDEX = ROOT / "docs" / "README.md"
PHIL_INDEX = ROOT / "docs" / "philosophy" / "README.md"

def pick_target_root() -> Path:
    # Prefer an existing canonical spec/protocol root if the repo already has one.
    for name in ["protocol", "protocols", "rpc", "schemas"]:
        p = ROOT / name
        if p.is_dir():
            return p
    # Fall back to spec/ (already created by us)
    return SPEC_ROOT

def git_mv(src: Path, dst: Path) -> bool:
    try:
        subprocess.run(["git", "mv", str(src), str(dst)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except Exception:
        return False

def ensure_parent(p: Path) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)

def forwarding_stub(from_path: Path, to_path: Path) -> None:
    # Create a lightweight forwarder so old links don’t break.
    ensure_parent(from_path)
    rel = to_path.as_posix()
    from_path.write_text(
        f"# Moved\n\n"
        f"This spec moved to: `{rel}`\n\n"
        f"- Open: {rel}\n",
        encoding="utf-8"
    )

def replace_paths_in_doctrine(old_prefix: str, new_prefix: str) -> None:
    if not DOCTRINE.exists():
        return
    s = DOCTRINE.read_text(encoding="utf-8")
    if "## Related Specs (stubs → formal specs)" not in s:
        return
    # Replace only inside Related Specs block to avoid unintended edits.
    parts = s.split("## Related Specs (stubs → formal specs)")
    pre = parts[0]
    rest = "## Related Specs (stubs → formal specs)" + parts[1]
    # Stop replacement at next top-level heading if present
    m = re.search(r"\n#\s+", rest)
    if m:
        block = rest[:m.start()]
        tail = rest[m.start():]
 
    else:
        block = rest
        tail = ""
    block2 = block.replace(old_prefix, new_prefix)
    DOCTRINE.write_text(pre + block2 + tail, encoding="utf-8")

def replace_paths_in_docs_indices(old_prefix: str, new_prefix: str) -> None:
    for p in [DOCS_INDEX, PHIL_INDEX]:
        if not p.exists():
            continue
        s = p.read_text(encoding="utf-8")
        if old_prefix not in s:
            continue
        p.write_text(s.replace(old_prefix, new_prefix), encoding="utf-8")

def main() -> int:
    if not SPEC_ROOT.exists():
        print("OK: no spec/ directory to normalize; nothing to do.")
        return 0

    target_root = pick_target_root()
    if target_root == SPEC_ROOT:
        # Still ensure we have a canonical spec index within spec/
        idx = SPEC_ROOT / "README.md"
        if not idx.exists():
            idx.write_text(
                "# Specs\n\n"
                "This directory holds doctrine-linked specification stubs and evolving formal specs.\n\n"
                "## Domains\n"
                "- constitutional/\n"
                "- security/\n"
                "- governance/\n"
                "- metrics/\n"
                "- privacy/\n",
                encoding="utf-8"
            )
        print("OK: target root is spec/ (no relocation needed).")
        return 0

    # Relocate markdown specs from spec/** to target_root/**, leaving forwarding stubs behind.
    moved = 0
    for src in sorted(SPEC_ROOT.rglob("*.md")):
        rel = src.relative_to(SPEC_ROOT)
        dst = target_root / rel
        if dst.exists():
            continue
        ensure_parent(dst)
        # Try git mv (preserve history), else filesystem move.
        if not git_mv(src, dst):
            dst.write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
            src.unlink()
        forwarding_stub(src, dst)
        moved += 1

    # Update doctrine + doc indices from spec/... → <target_root>/...
    old_prefix = "spec/"
    new_prefix = f"{target_root.name}/"
    replace_paths_in_doctrine(old_prefix, new_prefix)
    replace_paths_in_docs_indices(old_prefix, new_prefix)

    # Create an index in the target root (if missing)
    idx = target_root / "README.md"
    if not idx.exists():
        idx.write_text(
            "# Specs\n\n"
            "This directory holds doctrine-linked specification stubs and evolving formal specs.\n\n"
            "## Domains\n"
            "- constitutional/\n"
            "- security/\n"
            "- governance/\n"
            "- metrics/\n"
            "- privacy/\n",
            encoding="utf-8"
        )

    print(f"OK: normalized specs into {target_root.name}/; moved {moved} file(s) and left forwarding stubs in spec/.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
