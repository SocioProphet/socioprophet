"""GitHub ingestion bootstrap for the temporary AOKC runtime scaffold.

This module is intentionally minimal. It defines the source-object shape the
runtime will need to extract before building a GeneralDescriptor.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass(frozen=True)
class GitHubSourceObject:
    repo: str
    path: str
    ref: str
    content_hash: str
    metadata: Dict[str, Any]


def build_source_object(repo: str, path: str, ref: str, content_hash: str, metadata: Dict[str, Any]) -> GitHubSourceObject:
    """Return the normalized source-object envelope used by the runtime bootstrap.

    The runtime must not skip this normalization step. Descriptor construction is
    downstream of a stable source-object shape.
    """
    return GitHubSourceObject(
        repo=repo,
        path=path,
        ref=ref,
        content_hash=content_hash,
        metadata=dict(metadata),
    )
