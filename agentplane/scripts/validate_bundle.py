#!/usr/bin/env python3
import json, sys, os, datetime

def die(msg: str, code: int = 2) -> None:
    print(f"[validate] ERROR: {msg}", file=sys.stderr)
    raise SystemExit(code)

def main() -> int:
    if len(sys.argv) != 2:
        die("usage: scripts/validate_bundle.py <path/to/bundle.json>", 2)

    bundle_path = sys.argv[1]
    if not os.path.exists(bundle_path):
        die(f"bundle not found: {bundle_path}", 2)

    with open(bundle_path, "r", encoding="utf-8") as f:
        try:
            b = json.load(f)
        except json.JSONDecodeError as e:
            die(f"invalid JSON: {e}", 2)

    # Minimal contract checks (v0.1)
    if b.get("apiVersion") != "agentplane.socioprophet.org/v0.1":
        die("apiVersion must be agentplane.socioprophet.org/v0.1", 2)
    if b.get("kind") != "Bundle":
        die("kind must be Bundle", 2)

    md = b.get("metadata") or {}
    spec = b.get("spec") or {}

    for k in ("name", "version", "createdAt"):
        if k not in md:
            die(f"metadata.{k} is required", 2)

    lp = md.get("licensePolicy") or {}
    # Our hard constraint: never allow AGPL in shipped content.
    if lp.get("allowAGPL", False) is not False:
        die("metadata.licensePolicy.allowAGPL must be false", 2)
    # Spec checks (v0.1)
    for k in ("vm", "policy", "secrets", "artifacts", "smoke"):
        if k not in spec:
            die(f"spec.{k} is required", 2)

    pol = spec.get("policy") or {}
    mrs = pol.get("maxRunSeconds")
    if mrs is None:
        die("spec.policy.maxRunSeconds is required", 2)
    if not isinstance(mrs, int) or mrs < 5 or mrs > 3600:
        die("spec.policy.maxRunSeconds must be an int in [5, 3600]", 2)


    vm = spec["vm"]
    backend_intent = vm.get("backendIntent")
    allowed = {"qemu","microvm","lima-process","fleet"}
    if backend_intent not in allowed:
        die(f"spec.vm.backendIntent must be one of {sorted(allowed)}", 2)
    if "modulePath" not in vm or "backendIntent" not in vm:
        die("spec.vm.modulePath and spec.vm.backendIntent are required", 2)

    artifacts = spec["artifacts"]
    out_dir = artifacts.get("outDir")
    if not out_dir:
        die("spec.artifacts.outDir is required", 2)

    # Evidence-forward: emit a validation artifact next to artifacts.outDir
    os.makedirs(out_dir, exist_ok=True)
    report = {
        "kind": "ValidationArtifact",
        "bundle": f'{md.get("name")}@{md.get("version")}',
        "bundlePath": os.path.abspath(bundle_path),
        "validatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "result": "pass",
    }
    report_path = os.path.join(out_dir, "validation-artifact.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, sort_keys=True)
    print(f"[validate] OK: wrote {report_path}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
