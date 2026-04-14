"""Projection helpers for the temporary AOKC runtime incubator.

These helpers keep the first runtime slice honest about retrieval surfaces:
descriptor-id lookup, task/content-space lookup, and PARA projection without
turning PARA into the canonical ontology.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable


def project_for_lookup(
    *,
    descriptor_id: str,
    tasks: Iterable[str],
    content_spaces: Iterable[str],
    para_projects: Iterable[str],
    para_areas: Iterable[str],
    para_resources: Iterable[str],
) -> Dict[str, Any]:
    return {
        "descriptorId": descriptor_id,
        "lookup": {
            "tasks": list(tasks),
            "contentSpaces": list(content_spaces),
        },
        "para": {
            "projects": list(para_projects),
            "areas": list(para_areas),
            "resources": list(para_resources),
        },
    }
