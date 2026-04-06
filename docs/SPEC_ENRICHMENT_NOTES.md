# Spec Enrichment Notes

This file exists to support follow-up integration on branch `docs/liberty-by-design-product-cleanup-20260404`.
Some files under `spec/` are currently thin placeholders because direct rich writes through the connector were rejected on this pass.

These notes define the intended content shape for those files so a follow-up edit or Copilot-assisted patch can replace the placeholders mechanically.

## Target: `spec/constitutional/rights-of-verification-charter-v1.md`

Intent:
- define user inspection rights for critical outputs
- define system duties around provenance, replay, denial reasons, and appeal paths
- restate core invariants: no consequential action without evidence; privacy for persons and transparency for power

Recommended sections:
- Overview
- User rights
- System duties
- Invariants
- Example product checks

## Target: `spec/security/attestation-envelope-v1.md`

Intent:
- define the minimal product-facing attestation payload
- cover artifacts, evidence bundles, model outputs, policy snapshots, and consequential decisions
- include fields for subject hash, producer identity, scope, reproducibility metadata, timestamps, and transparency pointers

Recommended sections:
- Scope
- Required fields
- Verification checks
- Example envelope

## Target: `spec/security/transparency-log-v1.md`

Intent:
- define product-facing event logging for publication, moderation, review, and governance actions
- ensure entries are durable, queryable, and link back to evidence bundles

Recommended sections:
- Event classes
- Entry fields
- Query / export expectations
- Inclusion / consistency expectations

## Target: `spec/security/witness-diversity-policy-v1.md`

Intent:
- define diversity requirements for corroborating high-consequence actions
- prevent all confirming events from coming from one operator, one infra domain, or one governance cluster

Recommended sections:
- Diversity dimensions
- Quorum expectations
- Failure conditions
- Review guidance

## Target: `spec/security/audit-bundle-and-replay-v1.md`

Intent:
- define what a replayable audit bundle must include
- preserve the anti-proof-theater rule: if a workflow is critical, it should have a replay path or equivalent audit surface

Recommended sections:
- Bundle contents
- Replay contract
- Expected outputs
- Example verification command

## Target: `spec/governance/governance-lifecycle-v1.md`

Intent:
- define proposal, review, adoption, publication, and appeal stages for product governance changes
- require visible diffs and durable event logging for state-changing governance actions

Recommended sections:
- Lifecycle states
- Required evidence per state
- Denial and appeal behavior
- Publication rules

## Target: `spec/metrics/curvature-proxy-metrics-v1.md`

Intent:
- define operational proxies for concentration, suppression, unverifiable authority, and replay failure
- keep metrics product-facing rather than abstract

Recommended sections:
- Metric catalog
- Collection strategy
- Threshold guidance
- Dashboard / alert notes

## Target: `spec/privacy/privacy-boundaries-v1.md`

Intent:
- define privacy boundaries for persons and transparency expectations for institutional power
- document selective disclosure, audited restricted access, and publication boundaries

Recommended sections:
- Principles
- Data handling boundaries
- Access audit requirements
- Review / redaction notes

## Follow-up integration method

1. Replace each placeholder file with a full version matching the target intent above.
2. Keep the filenames stable so the doctrine-links workflow continues to resolve correctly.
3. Re-run PR checks.
4. Promote PR #257 out of draft only after the placeholder files are replaced.
