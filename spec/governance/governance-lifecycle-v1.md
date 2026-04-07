# Governance Lifecycle v1

This specification defines the lifecycle for product-facing governance changes in SocioProphet.

## Lifecycle states

Representative lifecycle states:

- proposed
- under review
- accepted
- denied
- published
- appealed
- revised
- superseded

## Required evidence per state

Examples:

- proposed: rationale and scope
- under review: reviewers and evidence references
- accepted: decision basis and resulting diff
- denied: denial reason and appeal path
- published: durable event reference and visible policy version
- appealed: appeal submission and review linkage

## Denial and appeal behavior

When a governance proposal or product-facing determination is denied, the system should provide:

- denial reason
- policy or rule basis when applicable
- appeal path or review escalation path when applicable

## Publication rules

Published governance changes should not be silent.
A product-visible governance change should have:

- a durable diff or version reference
- a visible effective state
- event-log linkage
