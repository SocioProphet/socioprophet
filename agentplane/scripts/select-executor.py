#!/usr/bin/env python3
import json, sys, subprocess, datetime
from pathlib import Path

def die(msg: str, code: int = 2):
    print(f"[select-executor] ERROR: {msg}", file=sys.stderr)
    raise SystemExit(code)

def ssh_ok(ref: str) -> bool:
    r = subprocess.run(["ssh","-o","BatchMode=yes","-o","ConnectTimeout=3", ref, "echo OK"],
                       capture_output=True, text=True)
    return r.returncode == 0

def main():
    if len(sys.argv) != 2:
        die("usage: scripts/select-executor.py <bundle.json>", 2)

    bundle = json.load(open(sys.argv[1], "r", encoding="utf-8"))
    backend = bundle["spec"]["vm"]["backendIntent"]
    inv_path = Path("fleet/inventory.json")
    if not inv_path.exists():
        die("missing fleet/inventory.json", 2)

    inv = json.load(inv_path.open())
    default = inv.get("defaultExecutor")
    executors = inv.get("executors", [])

    # Basic policy: VM backends require kvm
    requires_kvm = backend in ("qemu", "microvm")
    candidates = []
    for ex in executors:
        name = ex.get("name")
        ref = ex.get("sshRef") or name
        caps = ex.get("caps") or {}
        if requires_kvm and not bool(caps.get("kvm")):
            continue
        candidates.append((name, ref, caps))

    if not candidates:
        die(f"no executor satisfies backend={backend} (requires_kvm={requires_kvm})", 2)

    # Prefer default if it’s in candidates and reachable
    for name, ref, caps in candidates:
        if name == default and ssh_ok(ref):
            chosen = (name, ref, caps)
            break
    else:
        # Otherwise first reachable
        chosen = None
        for name, ref, caps in candidates:
            if ssh_ok(ref):
                chosen = (name, ref, caps)
                break
        if chosen is None:
            die("no reachable executor in inventory", 2)

    name, ref, caps = chosen
    decision = {
        "kind": "PlacementDecision",
        "capturedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "backendIntent": backend,
        "requiresKvm": requires_kvm,
        "chosenExecutor": name,
        "sshRef": ref,
        "caps": caps,
        "rejected": []
    }
    print(json.dumps(decision, indent=2, sort_keys=True))

if __name__ == "__main__":
    main()
