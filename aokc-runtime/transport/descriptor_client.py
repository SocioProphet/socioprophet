"""Typed transport bootstrap helpers for descriptor calls.

These helpers build request envelopes compatible with the staged TriTRPC service
surface. They do not perform network IO yet.
"""

from __future__ import annotations

from typing import Any, Dict


def register_general_descriptor_request(descriptor: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "service": "DescriptorService",
        "method": "RegisterGeneralDescriptor",
        "contextId": "ctx:aokc:v0.1",
        "schemaId": "schema:general-descriptor:v0.1",
        "request": {
            "descriptor": descriptor,
        },
    }
