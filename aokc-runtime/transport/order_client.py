"""Typed transport bootstrap helpers for order calls.

These helpers build request envelopes compatible with the staged TriTRPC order
surface. They do not perform network IO yet.
"""

from __future__ import annotations

from typing import Any, Dict


def create_order_request(order: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "service": "OrderService",
        "method": "CreateOrder",
        "contextId": "ctx:aokc:v0.1",
        "schemaId": "schema:order-descriptor:v0.1",
        "request": {
            "order": order,
        },
    }


def validate_order_request(order_id: str) -> Dict[str, Any]:
    return {
        "service": "OrderService",
        "method": "ValidateOrder",
        "contextId": "ctx:aokc:v0.1",
        "schemaId": "schema:order-descriptor:v0.1",
        "request": {
            "orderId": order_id,
        },
    }
