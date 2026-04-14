"""Bootstrap builder for GeneralDescriptor payloads.

This is a temporary scaffold inside the umbrella repo. It exists so the first
runtime slice can be reviewed against the staged contract pack before the code is
moved into a dedicated commons runtime repository.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable

from aokc_runtime.connectors.github_ingest import GitHubSourceObject


def build_general_descriptor(
    source: GitHubSourceObject,
    *,
    descriptor_id: str,
    name: str,
    display_name: str,
    created_at: str,
    version: str,
    domains: Iterable[str],
    tasks: Iterable[str],
    owners: Iterable[str],
    content_spaces: Iterable[str],
    evidence_refs: Iterable[str],
) -> Dict[str, Any]:
    return {
        "apiVersion": "knowledge.socioprophet.org/v0.1",
        "kind": "GeneralDescriptor",
        "metadata": {
            "id": descriptor_id,
            "name": name,
            "displayName": display_name,
            "createdAt": created_at,
            "version": version,
        },
        "spec": {
            "object": {
                "objectType": "DocumentAsset",
                "schemaRef": "schema:knowledge.asset.document/v0.1",
                "sourceSystem": "github",
                "sourceRef": {
                    "repo": source.repo,
                    "path": source.path,
                    "ref": source.ref,
                },
                "contentHash": source.content_hash,
            },
            "relationships": {
                "domains": list(domains),
                "tasks": list(tasks),
                "owners": list(owners),
                "contentSpaces": list(content_spaces),
                "repos": [source.repo],
            },
            "policies": {
                "visibility": "internal",
                "stewardReviewRequired": True,
            },
            "provenance": {
                "hash": source.content_hash,
                "evidenceRefs": list(evidence_refs),
            },
        },
    }
