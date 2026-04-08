#!/usr/bin/env bash
set -euo pipefail
echo "[hygiene] bash syntax..."
bash -n runners/qemu-local.sh
echo "[hygiene] python syntax..."
python3 -m py_compile scripts/*.py
echo "[hygiene] OK"
