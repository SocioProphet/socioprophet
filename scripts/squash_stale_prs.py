#!/usr/bin/env python3
"""Squash-merge stale pull requests via GitHub CLI.

A PR is considered stale when its `updatedAt` timestamp is older than the
configured age threshold (default: 365 days).

Examples:
  # Preview what would be merged (dry-run)
  scripts/squash_stale_prs.py --repo owner/name

  # Actually squash-merge stale PRs
  scripts/squash_stale_prs.py --repo owner/name --apply
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import subprocess
import sys
from typing import Any


def run_gh(args: list[str]) -> str:
    proc = subprocess.run(["gh", *args], capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "gh command failed")
    return proc.stdout


def iso_to_datetime(value: str) -> dt.datetime:
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00"))


def list_open_prs(repo: str) -> list[dict[str, Any]]:
    output = run_gh(
        [
            "pr",
            "list",
            "--repo",
            repo,
            "--state",
            "open",
            "--limit",
            "500",
            "--json",
            "number,title,updatedAt,isDraft,url",
        ]
    )
    return json.loads(output)


def squash_merge(repo: str, number: int) -> None:
    run_gh(
        [
            "pr",
            "merge",
            str(number),
            "--repo",
            repo,
            "--squash",
            "--delete-branch",
            "--auto",
        ]
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True, help="GitHub repo in owner/name format")
    parser.add_argument(
        "--stale-days",
        type=int,
        default=365,
        help="PRs older than this number of days are considered stale (default: 365)",
    )
    parser.add_argument(
        "--include-drafts",
        action="store_true",
        help="Include draft PRs. Drafts are excluded by default.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually perform squash merges. Without this flag, runs as a dry-run.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    now = dt.datetime.now(dt.timezone.utc)
    cutoff = now - dt.timedelta(days=args.stale_days)

    try:
        prs = list_open_prs(args.repo)
    except RuntimeError as err:
        print(f"error: {err}", file=sys.stderr)
        return 2

    stale: list[dict[str, Any]] = []
    for pr in prs:
        if pr.get("isDraft") and not args.include_drafts:
            continue
        updated_at = iso_to_datetime(pr["updatedAt"])
        if updated_at < cutoff:
            stale.append(pr)

    if not stale:
        print(
            f"No open PRs older than {args.stale_days} days were found in {args.repo}."
        )
        return 0

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(
        f"{mode}: found {len(stale)} stale PR(s) in {args.repo} (cutoff: {cutoff.date().isoformat()})"
    )
    for pr in sorted(stale, key=lambda item: item["number"]):
        print(f"- #{pr['number']} | updated {pr['updatedAt']} | {pr['title']} | {pr['url']}")

    if not args.apply:
        print("\nDry-run only. Re-run with --apply to squash-merge these PRs.")
        return 0

    failures = 0
    for pr in sorted(stale, key=lambda item: item["number"]):
        number = pr["number"]
        try:
            squash_merge(args.repo, number)
            print(f"merged: #{number}")
        except RuntimeError as err:
            failures += 1
            print(f"failed: #{number} ({err})", file=sys.stderr)

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
