#!/usr/bin/env python3
"""Verify the read-only Event-Native Orchestration Workbench fixture and page."""

from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "marketing" / "public" / "orchestration" / "event-native-fixture.json"
PAGE = ROOT / "marketing" / "public" / "orchestration" / "index.html"
DOC = ROOT / "docs" / "guide" / "event-native-orchestration-workbench.md"
CONFIG = ROOT / "docs" / ".vitepress" / "config.ts"
BUILDER = ROOT / "scripts" / "build_event_orchestration_fixture.py"

REQUIRED_RECORD_FIELDS = {"record_id", "event", "capability", "reaction", "admission", "queue_state", "receipt_refs"}
REQUIRED_QUEUE_STATES = {"pending", "waiting-approval", "blocked", "dead-letter"}
EXPECTED_GENERATOR = "SocioProphet/prophet-platform/specs/orchestration/world_class_event_loop_demo.py"
FORBIDDEN_FIRST_SLICE_STRINGS = {
    "navigator.credentials.create",
    "navigator.credentials.get",
    "fetch('/actuate",
    "fetch(\"/actuate",
    "camera_media_blob",
    "raw_video_url",
}


def error(message: str) -> str:
    return f"ERROR: {message}"


def load_json(path: pathlib.Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001 - verifier should return concise file error.
        raise SystemExit(error(f"{path}: invalid JSON: {exc}")) from exc
    if not isinstance(data, dict):
        raise SystemExit(error(f"{path}: expected top-level object"))
    return data


def verify_fixture(data: dict) -> list[str]:
    errors: list[str] = []
    if data.get("mode") != "fixture":
        errors.append("fixture mode must be 'fixture'")
    if data.get("readOnly") is not True:
        errors.append("fixture must be explicitly readOnly")
    if data.get("generatedFrom") != EXPECTED_GENERATOR:
        errors.append("fixture generatedFrom must point to the Prophet Platform world-class event loop demo")
    if data.get("demoReport", {}).get("status") != "pass":
        errors.append("demoReport.status must be pass")

    records = data.get("eventCapabilityRecords")
    if not isinstance(records, list) or not records:
        errors.append("eventCapabilityRecords must be a non-empty list")
        records = []

    queue_counts = data.get("sourceosQueue", {}).get("counts", {})
    for state in REQUIRED_QUEUE_STATES:
        if state not in queue_counts:
            errors.append(f"queue counts missing {state}")

    observed_states: set[str] = set()
    observed_outcomes: set[str] = set()
    ids: set[str] = set()
    for index, record in enumerate(records):
        missing = REQUIRED_RECORD_FIELDS - set(record)
        if missing:
            errors.append(f"record {index} missing fields: {sorted(missing)}")
            continue
        record_id = record["record_id"]
        if record_id in ids:
            errors.append(f"duplicate record_id: {record_id}")
        ids.add(record_id)
        event = record.get("event") or {}
        capability = record.get("capability") or {}
        reaction = record.get("reaction") or {}
        causality = event.get("causality") or {}
        if not event.get("event_id"):
            errors.append(f"{record_id}: missing event.event_id")
        if not capability.get("capability_id"):
            errors.append(f"{record_id}: missing capability.capability_id")
        if not capability.get("display_name"):
            errors.append(f"{record_id}: missing capability.display_name")
        if not reaction.get("reaction_id"):
            errors.append(f"{record_id}: missing reaction.reaction_id")
        if not causality.get("idempotency_key"):
            errors.append(f"{record_id}: missing idempotency key")
        if not causality.get("policy_epoch"):
            errors.append(f"{record_id}: missing policy_epoch")
        if not record.get("receipt_refs"):
            errors.append(f"{record_id}: missing receipt_refs")
        observed_states.add(str(record.get("queue_state")))
        observed_outcomes.add(str(reaction.get("policy_outcome")))
        if capability.get("effect_class") == "high_risk_actuation" and reaction.get("policy_outcome") == "allowed":
            errors.append(f"{record_id}: high-risk action cannot be directly allowed")
        if "camera" in str(capability.get("capability_id")) and "media" in str(capability.get("capability_id")):
            if reaction.get("policy_outcome") != "denied":
                errors.append(f"{record_id}: camera-media capability must be denied in first slice")

    for state in ("pending", "waiting-approval", "blocked"):
        if state not in observed_states:
            errors.append(f"fixture must include a {state} record")
    for outcome in ("allowed", "requires_approval", "denied", "redacted"):
        if outcome not in observed_outcomes:
            errors.append(f"fixture must include policy outcome {outcome}")

    admission = data.get("agentplaneAdmission", {}).get("summary", {})
    if admission.get("invalid") != 0:
        errors.append("agentplaneAdmission.summary.invalid must be 0")

    if data.get("sourceosQueue", {}).get("non_mutating") is not True:
        errors.append("sourceosQueue must be non_mutating")

    if data.get("sherlockIndex", {}).get("record_count") != len(records):
        errors.append("sherlockIndex.record_count must match eventCapabilityRecords length")

    traces = data.get("embodiedTraceRecords")
    if not isinstance(traces, list) or not traces:
        errors.append("embodiedTraceRecords must be non-empty")
    else:
        families = {str(trace.get("task_family")) for trace in traces if isinstance(trace, dict)}
        if not ({"track_permanence", "plan_generation"} & families):
            errors.append("embodiedTraceRecords should include permanence or planning traces")

    return errors


def verify_page() -> list[str]:
    errors: list[str] = []
    text = PAGE.read_text(encoding="utf-8")
    if "/orchestration/event-native-fixture.json" not in text:
        errors.append("workbench page must fetch event-native fixture")
    for phrase in ("read-only", "cannot actuate", "retain camera media", "Evidence drawer", "SourceOS queue", "Sherlock index"):
        if phrase not in text:
            errors.append(f"workbench page missing phrase: {phrase}")
    for forbidden in FORBIDDEN_FIRST_SLICE_STRINGS:
        if forbidden in text:
            errors.append(f"workbench page contains forbidden first-slice string: {forbidden}")
    return errors


def verify_docs() -> list[str]:
    errors: list[str] = []
    doc_text = DOC.read_text(encoding="utf-8")
    config_text = CONFIG.read_text(encoding="utf-8")
    if "Event-Native Orchestration Workbench" not in doc_text:
        errors.append("guide page missing title")
    if "/guide/event-native-orchestration-workbench" not in config_text:
        errors.append("VitePress config missing guide nav link")
    if "No UI path can trigger live actuation" not in doc_text:
        errors.append("guide page missing no-live-actuation boundary")
    if "world_class_event_loop_demo.py" not in doc_text:
        errors.append("guide page should reference the canonical Prophet Platform demo generator")
    return errors


def verify_builder() -> list[str]:
    errors: list[str] = []
    text = BUILDER.read_text(encoding="utf-8")
    for required in ("demo-report.json", "event-capability.policy-annotated.records.json", "sourceos-queue.snapshot.json", "agentplane-admission.artifact.json", "sherlock-event-capability-index.json"):
        if required not in text:
            errors.append(f"fixture builder missing input artifact reference: {required}")
    if "readOnly" not in text or "True" not in text:
        errors.append("fixture builder must force readOnly true")
    return errors


def main() -> int:
    errors: list[str] = []
    for path in (FIXTURE, PAGE, DOC, CONFIG, BUILDER):
        if not path.exists():
            errors.append(f"missing required path: {path.relative_to(ROOT)}")

    if not errors:
        errors.extend(verify_fixture(load_json(FIXTURE)))
        errors.extend(verify_page())
        errors.extend(verify_docs())
        errors.extend(verify_builder())

    if errors:
        print("event orchestration workbench verification failed", file=sys.stderr)
        for item in errors:
            print(" - " + item, file=sys.stderr)
        return 1

    print("event orchestration workbench verification passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
