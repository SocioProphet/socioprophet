#!/usr/bin/env python3
"""Build the public Event-Native Orchestration Workbench fixture.

Input is the artifact directory emitted by:

  SocioProphet/prophet-platform/specs/orchestration/world_class_event_loop_demo.py

Example:

  python scripts/build_event_orchestration_fixture.py \
    --source-dir /tmp/sdo-world-class-event-loop \
    --out marketing/public/orchestration/event-native-fixture.json

The generated fixture is intentionally read-only. It projects the canonical
interop artifacts into the compact shape consumed by
`marketing/public/orchestration/index.html`.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys
from typing import Any

SCHEMA = "socioprophet.event-native-orchestration-workbench.fixture.v0.1"

REQUIRED_INPUTS = {
    "demo_report": "demo-report.json",
    "records": "event-capability.policy-annotated.records.json",
    "queue": "sourceos-queue.snapshot.json",
    "admission": "agentplane-admission.artifact.json",
    "sherlock": "sherlock-event-capability-index.json",
    "traces": "embodied-training-records.json",
}


def load_json(path: pathlib.Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001 - CLI boundary should print concise file error.
        raise SystemExit(f"{path}: failed to load JSON: {exc}") from exc


def write_json(path: pathlib.Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def queue_state_for(record: dict[str, Any], admission_decisions: dict[str, dict[str, Any]]) -> str:
    decision = admission_decisions.get(str(record.get("record_id")), {})
    state = decision.get("admission")
    if state == "admitted":
        return "pending"
    if state == "waiting_for_approval":
        return "waiting-approval"
    if state == "blocked":
        return "blocked"
    return "dead-letter"


def compact_event_record(record: dict[str, Any], admission_decisions: dict[str, dict[str, Any]]) -> dict[str, Any]:
    event = record.get("event") if isinstance(record.get("event"), dict) else {}
    capability = record.get("capability") if isinstance(record.get("capability"), dict) else {}
    reaction = record.get("reaction") if isinstance(record.get("reaction"), dict) else {}
    decision = admission_decisions.get(str(record.get("record_id")), {})
    return {
        "record_id": record.get("record_id"),
        "event": event,
        "capability": {
            "capability_id": capability.get("capability_id"),
            "display_name": capability.get("display_name"),
            "effect_class": capability.get("effect_class"),
            "required_policy_outcome": capability.get("required_policy_outcome"),
        },
        "reaction": {
            "reaction_id": reaction.get("reaction_id"),
            "policy_outcome": reaction.get("policy_outcome"),
            "status": reaction.get("status"),
        },
        "admission": decision.get("admission", "unknown"),
        "queue_state": queue_state_for(record, admission_decisions),
        "receipt_refs": record.get("evidence_refs") or reaction.get("receipt_refs") or decision.get("receipt_refs") or [],
    }


def compact_trace(record: dict[str, Any]) -> dict[str, Any]:
    input_obj = record.get("input") if isinstance(record.get("input"), dict) else {}
    target = record.get("target") if isinstance(record.get("target"), dict) else {}
    assertions = record.get("state_assertions") or []
    return {
        "record_id": record.get("record_id"),
        "task_family": record.get("task_family"),
        "query": input_obj.get("query"),
        "target": target,
        "state_assertions": [json.dumps(item, sort_keys=True) if isinstance(item, dict) else str(item) for item in assertions],
    }


def build_fixture(source_dir: pathlib.Path) -> dict[str, Any]:
    inputs = {name: load_json(source_dir / filename) for name, filename in REQUIRED_INPUTS.items()}
    admission_decisions = {
        str(item.get("record_id")): item
        for item in inputs["admission"].get("decisions", [])
        if isinstance(item, dict)
    }
    records = [compact_event_record(record, admission_decisions) for record in inputs["records"]]
    traces = [compact_trace(record) for record in inputs["traces"][:4]]

    return {
        "schema": SCHEMA,
        "mode": "fixture",
        "readOnly": True,
        "generatedFrom": "SocioProphet/prophet-platform/specs/orchestration/world_class_event_loop_demo.py",
        "demoReport": inputs["demo_report"],
        "eventCapabilityRecords": records,
        "sourceosQueue": inputs["queue"],
        "agentplaneAdmission": inputs["admission"],
        "sherlockIndex": inputs["sherlock"],
        "embodiedTraceRecords": traces,
    }


def validate_fixture(fixture: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if fixture.get("schema") != SCHEMA:
        errors.append("schema mismatch")
    if fixture.get("mode") != "fixture":
        errors.append("mode must be fixture")
    if fixture.get("readOnly") is not True:
        errors.append("readOnly must be true")
    if fixture.get("demoReport", {}).get("status") != "pass":
        errors.append("demoReport.status must be pass")
    records = fixture.get("eventCapabilityRecords")
    if not isinstance(records, list) or not records:
        errors.append("eventCapabilityRecords must be non-empty")
    else:
        for record in records:
            if not record.get("record_id"):
                errors.append("record missing record_id")
            if not (record.get("event") or {}).get("event_id"):
                errors.append(str(record.get("record_id")) + ": missing event_id")
            if not (record.get("event") or {}).get("causality", {}).get("idempotency_key"):
                errors.append(str(record.get("record_id")) + ": missing idempotency_key")
            if not record.get("receipt_refs"):
                errors.append(str(record.get("record_id")) + ": missing receipt refs")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the Event-Native Orchestration Workbench fixture from Prophet Platform demo artifacts.")
    parser.add_argument("--source-dir", required=True, help="directory emitted by world_class_event_loop_demo.py")
    parser.add_argument("--out", default="marketing/public/orchestration/event-native-fixture.json", help="fixture output path")
    parser.add_argument("--check", action="store_true", help="validate but do not write")
    args = parser.parse_args()

    fixture = build_fixture(pathlib.Path(args.source_dir))
    errors = validate_fixture(fixture)
    if errors:
        print("fixture build failed", file=sys.stderr)
        for item in errors:
            print(" - " + item, file=sys.stderr)
        return 1

    if not args.check:
        write_json(pathlib.Path(args.out), fixture)
        print("wrote " + args.out)
    else:
        print("event orchestration fixture build check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
