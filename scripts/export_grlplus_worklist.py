#!/usr/bin/env python3
"""Normalize a generic GRLPlus semantic worklist into strict platform export bundles.

Usage:
  python3 scripts/export_grlplus_worklist.py --input standards/grlplus/examples/worklist_input.example.json --platform github_issues --profile strategy --output /tmp/github.json
  python3 scripts/export_grlplus_worklist.py --input standards/grlplus/examples/worklist_input.example.json --platform ops_queue --profile strategy --output /tmp/queue.json

This is an integration/export shim for this repository. It is intentionally small and dependency-light.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List


REPO_ROOT = Path(__file__).resolve().parents[1]
POLICY_PATH = REPO_ROOT / "standards/grlplus/domain_action_policy_matrix.json"
BINDING_PATH = REPO_ROOT / "standards/grlplus/github_binding_socioprophet_socioprophet.json"


def die(msg: str, code: int = 2) -> None:
    print(f"[grlplus-export] ERROR: {msg}", file=sys.stderr)
    raise SystemExit(code)


def load_json(path: Path) -> Dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        die(f"failed to parse JSON {path}: {e}")
    if not isinstance(data, dict):
        die(f"{path} must parse to a JSON object")
    return data


def ensure_list_of_items(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    items = data.get("items")
    if not isinstance(items, list):
        die("input JSON must contain an 'items' list")
    out: List[Dict[str, Any]] = []
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            die(f"items[{i}] must be an object")
        out.append(item)
    return out


def normalize_labels(profile: str, severity: str, intervention: str, extra: List[str] | None = None) -> List[str]:
    labels = [
        "grlplus",
        "semantic-worklist",
        f"profile:{profile}",
        f"severity:{severity}",
        f"intervention:{intervention}",
    ]
    if extra is None:
        extras: List[str] = []
    else:
        if not isinstance(extra, list):
            die("labels must be a list of strings")
        for i, x in enumerate(extra):
            if not isinstance(x, str):
                die(f"labels[{i}] must be a string")
        extras = extra
    for x in extras:
        if x not in labels:
            labels.append(x)
    return labels


def build_issue_body(binding: Dict[str, Any], element_id: str, closure_rule_code: str, escalation_rule_code: str) -> str:
    tmpl = binding.get("github_issue_body_template") or "Goal: {goal_summary}\n"
    return tmpl.format(
        goal_summary=f"address semantic governance for {element_id}",
        closure_rule_code=closure_rule_code,
        escalation_rule_code=escalation_rule_code,
    )


def main(argv: List[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--platform", required=True, choices=["github_issues", "ops_queue"])
    ap.add_argument("--profile", required=True, choices=["strategy", "cyber", "safety"])
    ap.add_argument("--output", required=True)
    args = ap.parse_args(argv[1:])

    inp = load_json(Path(args.input))
    items = ensure_list_of_items(inp)
    policy = load_json(POLICY_PATH)
    binding = load_json(BINDING_PATH)
    p = policy["profiles"][args.profile]

    if args.platform == "github_issues":
        out_items = []
        for item in items:
            raw_element_id = item.get("element_id")
            if not isinstance(raw_element_id, str) or not raw_element_id.strip():
                die(f"Worklist item is missing required non-empty element_id: {item!r}")
            element_id = raw_element_id.strip()
            intervention = item.get("intervention_category") or item.get("intervention") or "gather_evidence"
            severity = item.get("severity") or p.get("severity_mapping", {}).get(intervention, "medium")
            owner = item.get("owner_actor_id") or item.get("owner") or p.get("review_owner_template")
            assignee = item.get("github_assignee") or item.get("assignee")
            closure_rule_code = item.get("closure_rule_code") or p.get("closure_rule_code")
            escalation_rule_code = item.get("escalation_rule_code") or p.get("escalation_rule_code")
            out_items.append({
                "title": item.get("title") or f"[{intervention}] {element_id}",
                "body": item.get("body") or build_issue_body(binding, element_id, closure_rule_code, escalation_rule_code),
                "labels": normalize_labels(args.profile, severity, intervention, item.get("labels")),
                "assignee": assignee,
                "severity": severity,
                "owner_actor_id": owner,
                "element_id": element_id,
                "intervention_category": intervention,
                "reason_codes": item.get("reason_codes", []),
                "sla_due_in_days": int(item.get("sla_due_in_days", p.get("default_sla_due_in_days", 7))),
                "review_cadence_days": int(item.get("review_cadence_days", p.get("default_review_cadence_days", 7))),
                "closure_rule_code": closure_rule_code,
                "escalation_rule_code": escalation_rule_code,
                "closure_criteria": item.get("closure_criteria") or p.get("closure_criteria_template"),
                "escalation_trigger": item.get("escalation_trigger") or p.get("escalation_trigger_template"),
                "metadata": {
                    "criticality": item.get("criticality"),
                    "dependencies": item.get("dependency_targets", []),
                },
            })
        payload = {
            "schema_version": "grlplus-github-issue-export/0.1",
            "platform": "github_issues",
            "profile": args.profile,
            "repo_full_name": binding.get("repo_full_name", "SocioProphet/socioprophet"),
            "items": out_items,
        }
    else:
        out_items = []
        for item in items:
            element_id = item.get("element_id")
            if not isinstance(element_id, str) or not element_id.strip():
                die("ops_queue export requires each item to include a non-empty element_id")
            element_id = element_id.strip()
            intervention = item.get("intervention") or item.get("intervention_category") or "gather_evidence"
            severity = item.get("severity") or p.get("severity_mapping", {}).get(intervention, "medium")
            owner = item.get("owner") or item.get("owner_actor_id") or p.get("review_owner_template")
            out_items.append({
                "kind": "semantic_work_item",
                "element_id": element_id,
                "owner": owner,
                "severity": severity,
                "intervention": intervention,
                "reason_codes": item.get("reason_codes", []),
                "sla_due_in_days": int(item.get("sla_due_in_days", p.get("default_sla_due_in_days", 7))),
                "review_cadence_days": int(item.get("review_cadence_days", p.get("default_review_cadence_days", 7))),
                "closure_rule_code": item.get("closure_rule_code") or p.get("closure_rule_code"),
                "escalation_rule_code": item.get("escalation_rule_code") or p.get("escalation_rule_code"),
                "closure_criteria": item.get("closure_criteria") or p.get("closure_criteria_template"),
                "escalation_trigger": item.get("escalation_trigger") or p.get("escalation_trigger_template"),
                "task_payload": {
                    "title": item.get("title") or f"[{intervention}] {element_id}",
                    "next_action": item.get("next_action") or item.get("suggested_evidence_ask") or p.get("evidence_request_template"),
                },
            })
        payload = {
            "schema_version": "grlplus-ops-queue-export/0.1",
            "platform": "ops_queue",
            "profile": args.profile,
            "items": out_items,
        }

    Path(args.output).write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
    print(f"[grlplus-export] OK: wrote {args.platform} bundle to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
