#!/usr/bin/env python3
from __future__ import annotations

import pathlib
import sys
from collections import defaultdict
from typing import Any

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
STANDARDS = ROOT / '.github' / 'repo-standards.yml'


def load_yaml(path: pathlib.Path) -> Any:
    with path.open('r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    return data or {}


def parse_sections(text: str) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = defaultdict(list)
    current = None
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith('## '):
            current = line[3:].strip().lower()
            continue
        if current and line.startswith('- '):
            sections[current].append(line[2:].strip())
    return sections


def main() -> int:
    standards = load_yaml(STANDARDS)
    udm = standards.get('udm', {})
    doc_path = ROOT / udm.get('doc_path', 'docs/guide/intake-udm-schema.md')
    text = doc_path.read_text(encoding='utf-8')
    sections = parse_sections(text)

    required_blocks = set(udm.get('required_top_level_blocks', []))
    required_shape = set(udm.get('required_udm_shape', []))

    blocks = set(sections.get('top-level blocks', []))
    shape = set(sections.get('udm shape', []))

    missing = []
    for item in sorted(required_blocks - blocks):
        missing.append(f'missing top-level block: {item}')
    for item in sorted(required_shape - shape):
        missing.append(f'missing UDM shape entry: {item}')

    if missing:
        print('UDM release schema validation failed:', file=sys.stderr)
        for item in missing:
            print(f' - {item}', file=sys.stderr)
        return 1

    print('UDM release schema validation passed')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
