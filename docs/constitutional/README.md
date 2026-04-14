# Constitutional Mapping

This directory holds the machine-checkable mapping between product doctrine and the specification files that operationalize it.

## Purpose

The goal is to keep doctrine from drifting into slogan space.
Each major doctrine claim should point to one or more concrete specification files, and review tooling should be able to verify that those files exist and contain the required structural sections.

## Canonical files

- `docs/constitutional/doctrine-map.yaml` — contract map linking doctrine to spec files and required headings
- `docs/philosophy/liberty-by-design.md` — product doctrine source document
- `tools/ci/check_doctrine_contract.py` — CI enforcement script for the doctrine map

## Review posture

When doctrine changes:
- update the doctrine text
- update the doctrine map if linked specs or required sections change
- keep the spec files aligned so the doctrine remains auditable
