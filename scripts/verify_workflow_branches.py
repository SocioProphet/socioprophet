#!/usr/bin/env python3
from __future__ import annotations

import pathlib
import sys
from typing import Any

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
STANDARDS = ROOT / '.github' / 'repo-standards.yml'
WORKFLOWS = ROOT / '.github' / 'workflows'


def load_yaml(path: pathlib.Path) -> Any:
    with path.open('r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    return data or {}


def get_on_block(data: dict[str, Any]) -> Any:
    if 'on' in data:
        return data['on']
    if True in data:
        return data[True]
    return {}


def normalize_branches(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        return [str(v) for v in value]
    return []


def main() -> int:
    standards = load_yaml(STANDARDS)
    default_branch = standards.get('default_branch', 'master')
    docs_standards = standards.get('docs', {})
    docs_deploy_branches = set(docs_standards.get('deploy_branches', [default_branch]))
    transitional = set(docs_standards.get('transitional_allowed_branches', []))

    problems: list[str] = []
    saw_master_docs_deploy = False

    for wf in sorted(WORKFLOWS.glob('*.yml')) + sorted(WORKFLOWS.glob('*.yaml')):
        data = load_yaml(wf)
        on_block = get_on_block(data)
        push = on_block.get('push', {}) if isinstance(on_block, dict) else {}
        if not isinstance(push, dict):
            push = {}
        branches = set(normalize_branches(push.get('branches')))
        text = wf.read_text(encoding='utf-8')
        is_docs_deploy = 'Deploy Docs' in text or 'upload-pages-artifact' in text or 'deploy-pages' in text

        if wf.name in {'check.yml', 'gitleaks.yml'}:
            if default_branch not in branches:
                problems.append(f'{wf}: expected push.branches to include {default_branch}, found {sorted(branches) or "<none>"}')

        if is_docs_deploy:
            if branches & docs_deploy_branches:
                saw_master_docs_deploy = True
            elif not branches.issubset(transitional):
                problems.append(
                    f'{wf}: docs deploy branches {sorted(branches) or "<none>"} do not include required {sorted(docs_deploy_branches)}'
                )

    if not saw_master_docs_deploy:
        problems.append(f'no docs deployment workflow targets required branch(es): {sorted(docs_deploy_branches)}')

    if problems:
        print('workflow branch verification failed:', file=sys.stderr)
        for p in problems:
            print(f' - {p}', file=sys.stderr)
        return 1

    print('workflow branch verification passed')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
