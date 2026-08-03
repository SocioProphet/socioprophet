#!/usr/bin/env python3
"""Validate ProjectComputeSetting — fail-closed governed compute (cluster + mesh).

Schema conformance + the governance invariants the cockpit's Compute tab depends on:
  1. NO UNGOVERNED COMPUTE — every deployment is policy-drift COMPLIANT and carries a legal basis;
     a mesh deployment MUST be TPM-attested (the inception-twin ATTEST phase).
  2. A MESH PLANE MUST RIDE THE INCEPTION-TWIN — if planes.mesh.enabled, it names a twinRef, is
     REVOCABLE (revocation.required == true), and every trusted node carries an attestationRef.

Dependency-light CI guardrail (exit 2 on failure), matching this repo's validator convention.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import jsonschema

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "schemas" / "control-plane" / "project-compute-setting.schema.json"
EX = ROOT / "examples" / "control-plane"
VALID = EX / "project-compute-setting.example.json"
INVALID = [
    EX / "project-compute-setting.noncompliant-deploy.invalid.json",
    EX / "project-compute-setting.mesh-not-revocable.invalid.json",
    EX / "project-compute-setting.mesh-no-twin.invalid.json",
]


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def governance_errors(doc: dict) -> list[str]:
    errs = []
    spec = doc.get("spec", {})
    for d in spec.get("deployments", []):
        who = d.get("name", "?")
        # 1. no ungoverned compute
        if not (d.get("policyDrift") or {}).get("compliant") is True:
            errs.append(f"deployment {who}: policy-drift not compliant (ungoverned compute refused)")
        if not (d.get("legalBasis") or {}).get("ref"):
            errs.append(f"deployment {who}: missing legal basis")
        if d.get("type") == "mesh" and not (d.get("attestation") or {}).get("tpmVerified") is True:
            errs.append(f"deployment {who}: mesh compute must be TPM-attested (inception-twin ATTEST)")
    # 2. a mesh plane must ride the inception-twin and be revocable
    mesh = (spec.get("planes") or {}).get("mesh") or {}
    if mesh.get("enabled"):
        if not mesh.get("twinRef"):
            errs.append("planes.mesh.enabled but no twinRef (mesh must ride the inception-twin)")
        if not (mesh.get("revocation") or {}).get("required") is True:
            errs.append("planes.mesh.enabled but revocation.required != true (mesh must be revocable)")
        nodes = mesh.get("trustedNodes") or []
        if not nodes:
            errs.append("planes.mesh.enabled but no trustedNodes")
        for n in nodes:
            if not n.get("attestationRef"):
                errs.append(f"trusted node {n.get('nodeRef','?')} has no attestationRef")
    return errs


def main() -> int:
    schema = load(SCHEMA)
    validator = jsonschema.Draft202012Validator(schema)
    fails = []

    doc = load(VALID)
    for e in sorted(validator.iter_errors(doc), key=str):
        fails.append(f"{VALID.name}: schema: {e.message}")
    for g in governance_errors(doc):
        fails.append(f"{VALID.name}: governance: {g}")

    for path in INVALID:
        d = load(path)
        schema_ok = not list(validator.iter_errors(d))
        gov = governance_errors(d)
        if schema_ok and not gov:
            fails.append(f"{path.name}: expected rejection (schema or governance) but it passed")

    for m in fails:
        print(f"FAIL: {m}", file=sys.stderr)
    if fails:
        return 2
    print("OK: ProjectComputeSetting valid; 3 invalid rejected (governed compute + revocable mesh)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
