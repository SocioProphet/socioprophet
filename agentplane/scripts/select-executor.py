#!/usr/bin/env python3
import datetime
import json
import os
import subprocess
import sys
from pathlib import Path


def die(msg: str, code: int = 2):
    print(f"[select-executor] ERROR: {msg}", file=sys.stderr)
    raise SystemExit(code)


def ssh_ok(ref: str) -> bool:
    if os.environ.get("AGENTPLANE_SKIP_SSH") == "1":
        return True
    r = subprocess.run(
        ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=3", ref, "echo OK"],
        capture_output=True,
        text=True,
    )
    return r.returncode == 0


def admissible(backend: str, ex: dict) -> bool:
    caps = ex.get("caps") or {}
    if backend in ("qemu", "microvm") and not bool(caps.get("kvm")):
        return False
    return True


def main():
    if len(sys.argv) != 2:
        die("usage: scripts/select-executor.py <bundle.json>", 2)

    bundle = json.load(open(sys.argv[1], "r", encoding="utf-8"))
    requested_backend = bundle["spec"]["vm"]["backendIntent"]
    requested_ref = ((bundle.get("spec") or {}).get("executor") or {}).get("ref")

    inv_path = Path("fleet/inventory.json")
    if not inv_path.exists():
        die("missing fleet/inventory.json", 2)

    inv = json.load(inv_path.open())
    default = inv.get("defaultExecutor")
    executors = inv.get("executors", [])

    def choose_for_backend(backend: str):
        candidates = []
        rejected = []
        for ex in executors:
            name = ex.get("name")
            ref = ex.get("sshRef") or name
            caps = ex.get("caps") or {}
            if admissible(backend, ex):
                candidates.append((name, ref, caps))
            else:
                rejected.append(
                    {
                        "name": name,
                        "sshRef": ref,
                        "reason": f"inadmissible-for-backend:{backend}",
                    }
                )

        if requested_ref:
            for name, ref, caps in candidates:
                if ref == requested_ref:
                    if ssh_ok(ref):
                        return (name, ref, caps), rejected
                    die(f"requested executor {requested_ref} is unreachable", 2)
            # requested_ref was not found among admissible candidates; check if it
            # exists in the inventory at all (inadmissible or unknown)
            all_refs = {ex.get("sshRef") or ex.get("name") for ex in executors}
            if requested_ref not in all_refs:
                die(
                    f"requested executor ref '{requested_ref}' not found in inventory"
                    f" (known refs: {sorted(r for r in all_refs if r)})",
                    2,
                )
            die(
                f"requested executor ref '{requested_ref}' is inadmissible for"
                f" backend={backend} (does not satisfy backend constraints)",
                2,
            )

        for name, ref, caps in candidates:
            if name == default and ssh_ok(ref):
                return (name, ref, caps), rejected

        for name, ref, caps in candidates:
            if ssh_ok(ref):
                return (name, ref, caps), rejected

        return None, rejected

    effective_backend = requested_backend
    normalization_reason = None
    chosen, rejected = choose_for_backend(effective_backend)

    if chosen is None and requested_backend in ("qemu", "microvm"):
        effective_backend = "lima-process"
        normalization_reason = "no-reachable-kvm-executor"
        chosen, rejected = choose_for_backend(effective_backend)

    if chosen is None:
        die(f"no reachable executor satisfies backend={effective_backend} (backendIntent={requested_backend})", 2)

    name, ref, caps = chosen
    decision = {
        "kind": "PlacementDecision",
        "capturedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "backendIntent": requested_backend,
        "effectiveBackend": effective_backend,
        "requiresKvm": effective_backend in ("qemu", "microvm"),
        "requestedExecutorRef": requested_ref,
        "normalized": (effective_backend != requested_backend),
        "normalizationReason": normalization_reason,
        "chosenExecutor": name,
        "sshRef": ref,
        "caps": caps,
        "rejected": rejected,
    }
    print(json.dumps(decision, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
