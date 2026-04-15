#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def require_json(path: Path, errors: list[str]) -> dict[str, Any] | None:
    if not path.exists():
        errors.append(f"missing artifact: {path}")
        return None
    try:
        return load_json(path)
    except Exception as e:
        errors.append(f"invalid JSON in {path}: {e}")
        return None


def repo_root(start: Path) -> Path:
    for p in [start, *start.parents]:
        if (p / "agentplane").exists():
            return p
    return start.parent


def out_dir(bundle: dict[str, Any], bundle_path: Path) -> Path:
    raw = (((bundle.get("spec") or {}).get("artifacts") or {}).get("outDir"))
    if not raw:
        raise ValueError("bundle missing spec.artifacts.outDir")
    p = Path(raw)
    if p.is_absolute():
        return p
    root = repo_root(bundle_path.parent)
    ap_root = root / "agentplane"
    candidate_ap = (ap_root / p).resolve()
    candidate_bundle = (bundle_path.parent / p).resolve()
    if candidate_ap.exists():
        return candidate_ap
    if candidate_bundle.exists():
        return candidate_bundle
    return candidate_ap


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: check_deployment_invariants.py <bundle.json> [profile]", file=sys.stderr)
        return 2

    bundle_path = Path(sys.argv[1]).resolve()
    profile = sys.argv[2] if len(sys.argv) > 2 else "staging"
    errors: list[str] = []
    warnings: list[str] = []

    if not bundle_path.exists():
        print(json.dumps({"status": "FAIL", "errors": [f"bundle not found: {bundle_path}"], "warnings": []}, indent=2))
        return 1

    bundle = load_json(bundle_path)
    md = bundle.get("metadata") or {}
    spec = bundle.get("spec") or {}
    policy = spec.get("policy") or {}
    git = ((md.get("source") or {}).get("git") or {})
    lane = policy.get("lane")
    requested_ref = ((spec.get("executor") or {}).get("ref"))
    backend_intent = ((spec.get("vm") or {}).get("backendIntent"))

    if lane in {"staging", "prod"}:
        if git.get("dirty") is not False:
            errors.append("GovernedLaneProvenanceCompleteness: source.git.dirty must be false")
        if git.get("rev") in (None, "", "UNSET"):
            errors.append("GovernedLaneProvenanceCompleteness: source.git.rev must be pinned")
        if policy.get("policyPackHash") in (None, "", "UNSET"):
            errors.append("GovernedLaneProvenanceCompleteness: policyPackHash must be pinned")

    odir = out_dir(bundle, bundle_path)
    validation = require_json(odir / "validation-artifact.json", errors)
    placement = require_json(odir / "placement-decision.json", errors)
    receipt = require_json(odir / "placement-receipt.json", errors)
    run_artifact = require_json(odir / "run-artifact.json", errors)
    replay_path = odir / "replay-artifact.json"
    if not replay_path.exists():
        errors.append("PointerTargetHasClosure: missing replay-artifact.json")

    if validation:
        expected = f"{md.get('name')}@{md.get('version')}"
        if validation.get("kind") != "ValidationArtifact":
            errors.append("validation-artifact.kind must be ValidationArtifact")
        if validation.get("bundle") != expected:
            errors.append("validation-artifact.bundle mismatch")
        if validation.get("result") != "pass":
            errors.append("validation-artifact.result must be pass")

    root = repo_root(bundle_path.parent)
    inv_path = root / "agentplane" / "fleet" / "inventory.json"
    inv = None
    if inv_path.exists():
        try:
            inv = load_json(inv_path)
        except Exception as e:
            errors.append(f"invalid JSON in {inv_path}: {e}")

    if placement:
        if placement.get("kind") != "PlacementDecision":
            errors.append("placement-decision.kind must be PlacementDecision")
        if placement.get("backendIntent") != backend_intent:
            errors.append("placement-decision.backendIntent must match spec.vm.backendIntent")
        if requested_ref and placement.get("sshRef") != requested_ref:
            errors.append("ExecutorPrecedenceConsistency: planner did not choose requested executor ref")
        if backend_intent in {"qemu", "microvm"}:
            eff = placement.get("effectiveBackend")
            if eff not in {"qemu", "microvm", "lima-process"}:
                errors.append("NormalizationBeforePlanning: missing or invalid effectiveBackend")
            elif inv is not None:
                any_kvm = any(bool((ex.get("caps") or {}).get("kvm")) for ex in inv.get("executors", []))
                if not any_kvm and eff != "lima-process":
                    errors.append("NormalizationBeforePlanning: expected lima-process effectiveBackend when no KVM executor exists")

    if receipt and run_artifact:
        decision = receipt.get("decision") or {}
        scheduler = decision.get("scheduler") or {}
        if not scheduler.get("sshRef"):
            errors.append("placement-receipt missing decision.scheduler.sshRef")
        if not decision.get("backend"):
            errors.append("placement-receipt missing decision.backend")
        if not run_artifact.get("backend"):
            errors.append("run-artifact missing backend")
        if decision.get("backend") and run_artifact.get("backend") and decision.get("backend") != run_artifact.get("backend"):
            errors.append("BackendCoherence: receipt backend != run-artifact backend")
        if placement and scheduler.get("sshRef") and placement.get("sshRef") != scheduler.get("sshRef"):
            errors.append("PointerTargetIsCoherent: receipt scheduler sshRef != placement decision sshRef")

    if profile == "prod" and lane != "prod":
        errors.append("ProfileBundleLaneConsistency: prod profile requires bundle lane=prod")

    pdir = root / "state" / "pointers"
    if pdir.exists():
        for name in ("current-staging", "current-prod", "previous-good"):
            p = pdir / name
            if p.exists():
                target = p.read_text(encoding="utf-8").strip()
                if not target:
                    errors.append(f"{name}: pointer file is empty")
                    continue
                tdir = Path(target)
                if not (tdir.exists() and (tdir / "bundle.json").exists()):
                    errors.append(f"PointerTargetExists: {name} points to missing bundle dir {target}")
                    continue
                tb = require_json(tdir / "bundle.json", errors)
                if tb is None:
                    continue
                tlane = (((tb.get("spec") or {}).get("policy") or {}).get("lane"))
                if name == "current-prod" and tlane != "prod":
                    errors.append("ProfileBundleLaneConsistency: current-prod points to non-prod lane bundle")
                todir = out_dir(tb, tdir / "bundle.json")
                for req in ("validation-artifact.json", "run-artifact.json", "placement-receipt.json", "replay-artifact.json"):
                    if not (todir / req).exists():
                        errors.append(f"PointerTargetHasClosure: {name} target missing {req}")

    print(json.dumps({"status": "FAIL" if errors else "PASS", "errors": errors, "warnings": warnings}, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
