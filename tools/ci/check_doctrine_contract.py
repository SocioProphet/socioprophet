#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path('.')
MAP = ROOT / 'docs' / 'constitutional' / 'doctrine-map.yaml'


def die(msg: str) -> int:
    print(f'ERR: {msg}', file=sys.stderr)
    return 2


def parse_map(text: str) -> list[dict[str, object]]:
    specs: list[dict[str, object]] = []
    current: dict[str, object] | None = None
    in_headings = False
    for raw in text.splitlines():
        line = raw.rstrip()
        if re.match(r'^\s*- path:\s+', line):
            if current:
                specs.append(current)
            current = {'path': line.split('path:', 1)[1].strip(), 'require_headings': []}
            in_headings = False
            continue
        if current and re.match(r'^\s*require_headings:\s*$', line):
            in_headings = True
            continue
        if current and in_headings and re.match(r'^\s*-\s+.+$', line):
            heading = line.split('-', 1)[1].strip()
            cast = current['require_headings']
            assert isinstance(cast, list)
            cast.append(heading)
    if current:
        specs.append(current)
    return specs


def has_heading(text: str, heading: str) -> bool:
    return re.search(rf'^##\s+{re.escape(heading)}\s*$', text, flags=re.M) is not None


def main() -> int:
    if not MAP.exists():
        return die('Missing doctrine map: docs/constitutional/doctrine-map.yaml')
    specs = parse_map(MAP.read_text(encoding='utf-8'))
    if not specs:
        return die('Doctrine map contains no spec entries')

    missing_files: list[str] = []
    missing_headings: list[str] = []

    for item in specs:
        path = str(item['path'])
        headings = list(item['require_headings'])
        file_path = ROOT / path
        if not file_path.exists():
            missing_files.append(path)
            continue
        content = file_path.read_text(encoding='utf-8', errors='replace')
        for heading in headings:
            if not has_heading(content, heading):
                missing_headings.append(f'{path}: missing heading ## {heading}')

    if missing_files:
        return die('Missing spec files:\n  - ' + '\n  - '.join(missing_files))
    if missing_headings:
        return die('Doctrine contract failed:\n  - ' + '\n  - '.join(missing_headings))

    print('OK: doctrine contract passes')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
