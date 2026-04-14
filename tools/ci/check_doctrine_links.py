#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path('.')
DOCTRINE = ROOT / 'docs' / 'philosophy' / 'liberty-by-design.md'


def die(msg: str) -> int:
    print(f'ERR: {msg}', file=sys.stderr)
    return 2


def main() -> int:
    if not DOCTRINE.exists():
        return die('Doctrine file missing: docs/philosophy/liberty-by-design.md')

    text = DOCTRINE.read_text(encoding='utf-8')
    marker = '## Related Specs (stubs → formal specs)'
    if marker not in text:
        return die('Doctrine missing Related Specs block.')

    block = text.split(marker, 1)[1]
    next_header = re.search(r'\n##?\s+', block)
    if next_header:
        block = block[:next_header.start()]

    paths: list[str] = []
    for line in block.splitlines():
        line = line.strip()
        if not line.startswith('- '):
            continue
        if ': ' not in line:
            continue
        _, path = line.split(': ', 1)
        path = path.strip()
        if path.endswith('.md'):
            paths.append(path)

    if not paths:
        return die('No spec paths found in doctrine block.')

    missing = [path for path in paths if not (ROOT / path).exists()]
    if missing:
        return die('Missing referenced spec files:\n  - ' + '\n  - '.join(missing))

    replay_candidates = [path for path in paths if 'replay' in path or 'audit' in path]
    for path in replay_candidates:
        candidate = (ROOT / path).read_text(encoding='utf-8', errors='replace')
        if re.search(r'\breplay\b', candidate, flags=re.I) is None:
            return die(f'Spec {path} must mention replay.')

    print('OK: doctrine links and replay checks pass.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
