#!/usr/bin/env python3
import argparse
import json
import shutil
import subprocess
from pathlib import Path
from typing import Any


def read_job(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding='utf-8'))


def build_claim(job: dict[str, Any], text: str) -> list[dict[str, Any]]:
    return [{
        'claim_id': f"claim-{job.get('job_id', 'unknown')}-1",
        'job_id': job.get('job_id', 'unknown'),
        'claim_type': 'hypothesis',
        'text': text,
        'support_refs': [],
        'confidence': 0.5,
        'acceptance_state': 'proposed',
    }]


def main() -> int:
    parser = argparse.ArgumentParser(description='Minimal Hyperon bridge candidate for staging.')
    parser.add_argument('--job', required=True)
    parser.add_argument('--mode', default='auto', choices=['auto', 'metta-py', 'metta-repl'])
    args = parser.parse_args()

    job = read_job(Path(args.job))
    binary = None
    if args.mode in ('auto', 'metta-py'):
        binary = shutil.which('metta-py') or binary
    if args.mode in ('auto', 'metta-repl') and binary is None:
        binary = shutil.which('metta-repl') or binary

    if binary is None:
        print(json.dumps({
            'ok': False,
            'error': 'no Hyperon executable found',
            'claims': build_claim(job, 'Hyperon executable missing; bridge invocation not yet proven on this host.'),
        }, indent=2))
        return 1

    try:
        proc = subprocess.run([binary, '--version'], text=True, capture_output=True, timeout=10)
    except subprocess.TimeoutExpired:
        print(json.dumps({
            'ok': False,
            'mode': args.mode,
            'binary': binary,
            'error': 'Hyperon executable timed out in non-interactive probe mode',
            'claims': build_claim(job, 'Hyperon bridge execution timed out while probing the CLI.'),
        }, indent=2))
        return 1

    stdout = proc.stdout.strip()
    print(json.dumps({
        'ok': proc.returncode == 0,
        'mode': args.mode,
        'binary': binary,
        'stdout_excerpt': stdout[:500],
        'claims': build_claim(job, 'Hyperon bridge executed and produced output.' if proc.returncode == 0 else 'Hyperon bridge execution failed.'),
    }, indent=2))
    return 0 if proc.returncode == 0 else 1


if __name__ == '__main__':
    raise SystemExit(main())
