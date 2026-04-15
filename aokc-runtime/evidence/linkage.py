"""Evidence-linkage helpers for the temporary AOKC runtime incubator.

The first runtime slice must preserve stable identifiers across descriptor,
order, transport, and execution layers. These helpers keep that linkage shape
explicit until the code is moved into a dedicated commons runtime repository.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable


def build_linkage_record(
    *,
    descriptor_id: str,
    order_id: str,
    evidence_refs: Iterable[str],
    artifact_refs: Iterable[str],
) -> Dict[str, Any]:
    return {
        "descriptorId": descriptor_id,
        "orderId": order_id,
        "evidenceRefs": list(evidence_refs),
        "artifactRefs": list(artifact_refs),
    }


def attach_linkage(payload: Dict[str, Any], linkage: Dict[str, Any]) -> Dict[str, Any]:
    enriched = dict(payload)
    enriched["linkage"] = dict(linkage)
    return enriched
