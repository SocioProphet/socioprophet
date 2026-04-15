"""Execution bridge bootstrap helpers for the temporary AOKC runtime incubator.

These helpers construct the narrow execution-bridge request envelopes that preserve
stable `orderId` and `descriptorId` values without tunneling the full descriptor graph.
"""

from __future__ import annotations

from typing import Any, Dict


def resolve_order_to_bundle_request(
    *,
    order_id: str,
    descriptor_id: str,
    policy_pack_ref: str,
    max_run_seconds: int,
) -> Dict[str, Any]:
    return {
        "service": "ExecutionBridgeService",
        "method": "ResolveOrderToBundle",
        "contextId": "ctx:aokc:v0.1",
        "schemaId": "schema:order-descriptor:v0.1",
        "request": {
            "orderId": order_id,
            "descriptorId": descriptor_id,
            "policyPackRef": policy_pack_ref,
            "maxRunSeconds": max_run_seconds,
        },
    }


def attach_run_artifact_request(
    *,
    order_id: str,
    descriptor_id: str,
    run_artifact: Dict[str, Any],
) -> Dict[str, Any]:
    return {
        "service": "ExecutionBridgeService",
        "method": "AttachRunArtifact",
        "contextId": "ctx:aokc:v0.1",
        "schemaId": "schema:run-artifact:v0.1",
        "request": {
            "orderId": order_id,
            "descriptorId": descriptor_id,
            "runArtifact": dict(run_artifact),
        },
    }
