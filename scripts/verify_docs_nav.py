#!/usr/bin/env python3
from __future__ import annotations

import pathlib
import re
import sys
from typing import Any

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'docs' / '.vitepress' / 'config.ts'
STANDARDS = ROOT / '.github' / 'repo-standards.yml'


def load_yaml(path: pathlib.Path) -> Any:
    with path.open('r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    return data or {}


def expected_link(md_file: pathlib.Path) -> str:
    rel = md_file.relative_to(ROOT / 'docs').with_suffix('')
    parts = rel.parts
    return '/' + '/'.join(parts)


def main() -> int:
    standards = load_yaml(STANDARDS)
    exceptions = set(standards.get('docs', {}).get('nav_exceptions', []))
    config_text = CONFIG.read_text(encoding='utf-8')
    links = set(re.findall(r'link:\s*["\']([^"\']+)["\']', config_text))

    missing: list[str] = []
    for md in sorted((ROOT / 'docs' / 'guide').rglob('*.md')):
        rel = md.relative_to(ROOT).as_posix()
        if rel in exceptions:
            continue
        target = expected_link(md)
        if target not in links:
            missing.append(f'{rel} -> expected {target}')

    if missing:
        print('docs navigation verification failed:', file=sys.stderr)
        for item in missing:
            print(f' - {item}', file=sys.stderr)
        return 1

    print('docs navigation verification passed')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
