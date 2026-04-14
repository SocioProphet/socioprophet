"""Bootstrap builder for AssetPromotionOrder payloads.

This module stays intentionally narrow. It builds the governed-work envelope used
by the first runtime slice without introducing a competing contract surface.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable


def build_promotion_order(
    *,
    order_id: str,
    created_at: str,
    created_by: str,
    target_ref: str,
    target_type: str,
    requested_output_type: str,
    content_space: str,
    destination_repo: str,
    required_checks: Iterable[str],
    expected_artifacts: Iterable[str],
) -> Dict[str, Any]:
    return {
        "apiVersion": "orders.socioprophet.org/v0.1",
        "kind": "OrderDescriptor",
        "metadata": {
            "id": order_id,
            "name": "promote-to-canonical-asset",
            "createdAt": created_at,
            "createdBy": created_by,
        },
        "spec": {
            "orderType": "AssetPromotionOrder",
            "action": "promote_to_canonical_asset",
            "targets": [
                {
                    "targetRef": target_ref,
                    "targetType": target_type,
                }
            ],
            "inputs": {
                "requestedOutputType": requested_output_type,
                "contentSpace": content_space,
                "destinationRepo": destination_repo,
            },
            "lifecycle": {
                "state": "requested",
                "allowedTransitions": [
                    "classified",
                    "validated",
                    "needs-human-review",
                    "approved",
                    "published",
                    "rejected",
                    "archived",
                ],
            },
            "validation": {
                "requiredChecks": list(required_checks),
                "humanGateRequired": True,
                "maxRunSeconds": 900,
            },
            "outputs": {
                "expectedArtifacts": list(expected_artifacts),
            },
        },
    }
