#!/usr/bin/env bash
set -euo pipefail
repo="${1:-}"
if ! command -v gh >/dev/null 2>&1; then
  echo "ERR: gh CLI not found. Install GitHub CLI or use the markdown files under docs/backlog/issues." >&2
  exit 2
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "ERR: gh not authenticated. Run: gh auth login" >&2
  exit 2
fi
dir="docs/backlog/issues"
for f in "$dir"/*.md; do
  title=$(python3 - <<PY
from pathlib import Path
p=Path("$f");
line=p.read_text(encoding="utf-8").splitlines()[0]
print(line.lstrip('# ').strip())
PY
)
  body=$(python3 - <<PY
from pathlib import Path
p=Path("$f");
print('\n'.join(p.read_text(encoding="utf-8").splitlines()[1:]).strip())
PY
)
  echo "Creating issue: $title" >&2
  gh issue create ${repo:+--repo "$repo"} --title "$title" --body "$body" >/dev/null
done
echo "OK: promoted backlog markdown to GitHub Issues" >&2
