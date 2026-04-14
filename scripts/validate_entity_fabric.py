#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import sys
from typing import Any

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
STANDARDS = ROOT / '.github' / 'repo-standards.yml'


def load_yaml(path: pathlib.Path) -> Any:
    with path.open('r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    return data or {}


def main() -> int:
    standards = load_yaml(STANDARDS)
    spec = standards.get('entity_fabric', {})

    required_paths = [ROOT / p for p in spec.get('required_paths', [])]
    required_sql = [ROOT / p for p in spec.get('required_sql', [])]

    if not any(p.exists() for p in required_paths + required_sql):
        print('entity-fabric not present in this checkout; skipping')
        return 0

    missing = []
    for p in required_paths + required_sql:
        if not p.exists():
            missing.append(str(p.relative_to(ROOT)))

    avro_path = ROOT / 'entity-fabric' / 'contracts' / 'entity_fabric_avro.avsc'
    if avro_path.exists():
        try:
            with avro_path.open('r', encoding='utf-8') as f:
                json.load(f)
        except Exception as e:
            missing.append(f'invalid avro bundle JSON: {e}')

    if missing:
        print('entity-fabric validation failed:', file=sys.stderr)
        for item in missing:
            print(f' - {item}', file=sys.stderr)
        return 1

    print('entity-fabric validation passed')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
