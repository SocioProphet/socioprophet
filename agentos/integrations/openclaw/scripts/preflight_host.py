#!/usr/bin/env python3
import json
import os
import shutil
import socket
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PORTS = [18789, 4000, 6333, 11434, 8000, 8080]


def which(name: str) -> str | None:
    return shutil.which(name)


def parse_version(text: str) -> list[int]:
    nums = []
    cur = ''
    for ch in text:
        if ch.isdigit():
            cur += ch
        elif cur:
            nums.append(int(cur))
            cur = ''
            if len(nums) >= 3:
                break
    if cur and len(nums) < 3:
        nums.append(int(cur))
    return nums or [0]


def cmd_out(cmd: list[str]) -> dict[str, Any]:
    try:
        proc = subprocess.run(cmd, text=True, capture_output=True, timeout=10)
        return {
            'ok': proc.returncode == 0,
            'returncode': proc.returncode,
            'stdout': proc.stdout.strip(),
            'stderr': proc.stderr.strip(),
        }
    except Exception as exc:
        return {'ok': False, 'error': str(exc), 'stdout': '', 'stderr': ''}


def check_node() -> dict[str, Any]:
    path = which('node')
    if not path:
        return {'present': False, 'required': 'Node 22.14+; Node 24 recommended'}
    info = cmd_out([path, '--version'])
    version = info.get('stdout', '')
    parsed = parse_version(version)
    meets_min = parsed >= [22, 14]
    recommended = parsed >= [24]
    return {
        'present': True,
        'path': path,
        'version': version,
        'meets_min': meets_min,
        'recommended': recommended,
        'required': 'Node 22.14+; Node 24 recommended',
    }


def check_openclaw() -> dict[str, Any]:
    path = which('openclaw')
    result = {'present': bool(path), 'path': path}
    if path:
        result['version'] = cmd_out([path, '--version'])
        result['status'] = cmd_out([path, 'status', '--all'])
        result['gateway_status'] = cmd_out([path, 'gateway', 'status', '--json'])
        result['plugin_list'] = cmd_out([path, 'plugins', 'list', '--json'])
    return result


def check_container_runtime() -> dict[str, Any]:
    runtimes = {}
    for name in ('docker', 'podman'):
        path = which(name)
        runtimes[name] = {'present': bool(path), 'path': path}
        if path:
            runtimes[name]['version'] = cmd_out([path, '--version'])
    return runtimes


def check_ports() -> list[dict[str, Any]]:
    rows = []
    for port in DEFAULT_PORTS:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind(('127.0.0.1', port))
            status = 'free'
        except OSError as exc:
            status = f'in_use_or_blocked: {exc}'
        finally:
            sock.close()
        rows.append({'port': port, 'status': status})
    return rows


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding='utf-8'))


def check_pack_files() -> dict[str, Any]:
    files = {
        'openclaw_plugin_config': ROOT / 'configs' / 'openclaw.plugins.example.json',
        'plugin_manifest': ROOT / 'plugins' / 'openclaw-socioprophet-provenance' / 'openclaw.plugin.json',
        'plugin_entry': ROOT / 'plugins' / 'openclaw-socioprophet-provenance' / 'index.ts',
        'hyperon_bridge': ROOT / 'reasoner' / 'hyperon_cli_bridge.py',
    }
    out = {}
    for key, path in files.items():
        out[key] = {'exists': path.exists(), 'path': str(path)}
    try:
        cfg = read_json(files['openclaw_plugin_config'])
        entry = cfg['plugins']['entries']['socioprophet-provenance']
        out['plugin_entry_enabled'] = bool(entry.get('enabled'))
        out['plugin_distiller_url'] = entry.get('config', {}).get('distillerUrl')
    except Exception as exc:
        out['plugin_config_error'] = str(exc)
    return out


def main() -> int:
    report = {
        'python': {'version': sys.version.split()[0], 'path': sys.executable},
        'node': check_node(),
        'openclaw': check_openclaw(),
        'container_runtimes': check_container_runtime(),
        'other_bins': {name: {'present': bool(which(name)), 'path': which(name)} for name in ('pnpm', 'curl', 'jq', 'cosign')},
        'ports': check_ports(),
        'pack': check_pack_files(),
        'environment': {
            'OPENCLAW_CONFIG_PATH': os.getenv('OPENCLAW_CONFIG_PATH'),
            'OPENCLAW_GATEWAY_TOKEN_set': bool(os.getenv('OPENCLAW_GATEWAY_TOKEN')),
            'DISTILLER_SHARED_TOKEN_set': bool(os.getenv('DISTILLER_SHARED_TOKEN')),
            'REASONER_SHARED_TOKEN_set': bool(os.getenv('REASONER_SHARED_TOKEN')),
        },
    }
    print(json.dumps(report, indent=2))
    node_ok = report['node'].get('meets_min', False)
    openclaw_ok = report['openclaw'].get('present', False)
    runtime_ok = any(v.get('present') for v in report['container_runtimes'].values())
    if node_ok and openclaw_ok and runtime_ok:
        return 0
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
