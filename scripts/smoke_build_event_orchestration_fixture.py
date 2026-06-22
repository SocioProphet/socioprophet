#!/usr/bin/env python3
"""Smoke-test the Event-Native Orchestration Workbench fixture builder."""

from __future__ import annotations

import importlib.util
import json
import pathlib
import tempfile
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
BUILDER_PATH = ROOT / "scripts" / "build_event_orchestration_fixture.py"


def load_builder() -> Any:
    spec = importlib.util.spec_from_file_location("build_event_orchestration_fixture", BUILDER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("could not load fixture builder")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def write_json(path: pathlib.Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def make_source_artifacts(source: pathlib.Path) -> None:
    record_allowed = {
        "record_id": "record:cool-room-with-fan",
        "event": {
            "event_id": "event:sensor:living-room-temp-high",
            "event_type": "sensor.threshold_crossed",
            "target_node_id": "node:living-room-fan-01",
            "causality": {
                "idempotency_key": "idem:fan",
                "policy_epoch": "policy-epoch-0",
            },
        },
        "capability": {
            "capability_id": "capability:cool-room-with-fan",
            "display_name": "Cool room with fan when hot",
            "effect_class": "low_risk_actuation",
            "required_policy_outcome": "allowed",
        },
        "reaction": {
            "reaction_id": "reaction:cool-room-with-fan",
            "policy_outcome": "allowed",
            "status": "scheduled",
            "receipt_refs": ["receipt:fan"],
        },
        "evidence_refs": ["receipt:fan"],
    }
    record_waiting = {
        "record_id": "record:security-arm-needs-approval",
        "event": {
            "event_id": "event:agent:propose-arm-security",
            "event_type": "agent.plan_proposed",
            "target_node_id": "node:security-system-01",
            "causality": {
                "idempotency_key": "idem:security",
                "policy_epoch": "policy-epoch-0",
            },
        },
        "capability": {
            "capability_id": "capability:arm-security-system",
            "display_name": "Arm household security system",
            "effect_class": "high_risk_actuation",
            "required_policy_outcome": "requires_approval",
        },
        "reaction": {
            "reaction_id": "reaction:security-arm-needs-approval",
            "policy_outcome": "requires_approval",
            "status": "blocked_or_waiting",
            "receipt_refs": ["receipt:security"],
        },
        "evidence_refs": ["receipt:security"],
    }
    record_blocked = {
        "record_id": "record:block-camera-media-release",
        "event": {
            "event_id": "event:agent:request-camera-media-release",
            "event_type": "agent.plan_proposed",
            "target_node_id": "node:front-door-camera-01",
            "causality": {
                "idempotency_key": "idem:media-release",
                "policy_epoch": "policy-epoch-0",
            },
        },
        "capability": {
            "capability_id": "capability:block-camera-media-release",
            "display_name": "Block camera media release",
            "effect_class": "high_risk_actuation",
            "required_policy_outcome": "denied",
        },
        "reaction": {
            "reaction_id": "reaction:block-camera-media-release",
            "policy_outcome": "denied",
            "status": "blocked_or_waiting",
            "receipt_refs": ["receipt:media-denied"],
        },
        "evidence_refs": ["receipt:media-denied"],
    }
    records = [record_allowed, record_waiting, record_blocked]
    admission = {
        "schema": "agentplane.event_capability_admission.v0.1",
        "agentMayExecute": True,
        "summary": {"total": 3, "admitted": 1, "waiting_for_approval": 1, "blocked": 1, "invalid": 0},
        "decisions": [
            {"record_id": "record:cool-room-with-fan", "admission": "admitted", "receipt_refs": ["receipt:fan"]},
            {"record_id": "record:security-arm-needs-approval", "admission": "waiting_for_approval", "receipt_refs": ["receipt:security"]},
            {"record_id": "record:block-camera-media-release", "admission": "blocked", "receipt_refs": ["receipt:media-denied"]},
        ],
    }

    write_json(source / "demo-report.json", {"status": "pass", "summary": {"records": 3}})
    write_json(source / "event-capability.policy-annotated.records.json", records)
    write_json(source / "sourceos-queue.snapshot.json", {"schema": "sourceos.orchestration.event-queue.v0.1", "non_mutating": True, "counts": {"pending": 1, "waiting-approval": 1, "blocked": 1, "dead-letter": 0}})
    write_json(source / "agentplane-admission.artifact.json", admission)
    write_json(source / "sherlock-event-capability-index.json", {"schema": "sherlock.event-capability-index.v0.1", "record_count": 3})
    write_json(source / "embodied-training-records.json", [{"record_id": "record:trace", "task_family": "track_permanence", "input": {"query": "Where was the object?"}, "target": {"answer_type": "location", "value": "sofa"}, "state_assertions": ["object on sofa"]}])


def main() -> int:
    builder = load_builder()
    with tempfile.TemporaryDirectory() as tmp:
        base = pathlib.Path(tmp)
        source = base / "source"
        out = base / "fixture.json"
        make_source_artifacts(source)
        fixture = builder.build_fixture(source)
        errors = builder.validate_fixture(fixture)
        if errors:
            raise SystemExit("fixture validation failed: " + "; ".join(errors))
        builder.write_json(out, fixture)
        reloaded = json.loads(out.read_text(encoding="utf-8"))
        assert reloaded["readOnly"] is True
        assert reloaded["mode"] == "fixture"
        assert len(reloaded["eventCapabilityRecords"]) == 3
        assert reloaded["agentplaneAdmission"]["summary"]["invalid"] == 0
        assert reloaded["sourceosQueue"]["non_mutating"] is True
    print("event orchestration fixture builder smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
