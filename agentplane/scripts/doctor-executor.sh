#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

INV="fleet/inventory.json"
[[ -f "$INV" ]] || { echo "[doctor-executor] FAIL: missing $INV" >&2; exit 2; }

python3 - <<'PY'
import json, subprocess, sys, datetime
from pathlib import Path

inv = json.load(open("fleet/inventory.json","r",encoding="utf-8"))
default = inv.get("defaultExecutor")
executors = inv.get("executors", [])

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

results = []
for ex in executors:
    name = ex.get("name")
    sshref = ex.get("sshRef") or name
    caps = ex.get("caps") or {}
    # Reachability probe
    r = run(["ssh","-o","BatchMode=yes","-o","ConnectTimeout=3", sshref, "uname -srm && echo OK"])
    ok = (r.returncode == 0)
    results.append({
        "name": name,
        "sshRef": sshref,
        "isDefault": (name == default),
        "reachable": ok,
        "caps": caps,
        "probeOut": (r.stdout.strip() if ok else r.stderr.strip())
    })

artifact = {
    "kind": "ExecutorProbeArtifact",
    "capturedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "defaultExecutor": default,
    "results": results
}

Path("artifacts").mkdir(exist_ok=True)
Path("artifacts/executor-probe.json").write_text(json.dumps(artifact, indent=2, sort_keys=True)+"\n", encoding="utf-8")

print("[doctor-executor] wrote artifacts/executor-probe.json")
# Human-readable summary
for r in results:
    status = "OK" if r["reachable"] else "FAIL"
    mark = "*" if r["isDefault"] else " "
    print(f"{mark} {r['name']} ({r['sshRef']}): {status} caps.kvm={r['caps'].get('kvm')}")
PY
