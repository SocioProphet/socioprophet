# Copy-ready Spec Replacements

This file provides copy-ready replacement text for the placeholder files currently under `spec/` on branch `docs/liberty-by-design-product-cleanup-20260404`.

The text below is intentionally **product-scoped**. It should remain focused on SocioProphet product behavior and should not pull cross-repo workspace-controller, OS-substrate, or broad agent-plane doctrine back into this repository.

---

## File: `spec/constitutional/rights-of-verification-charter-v1.md`

```md
# Rights of Verification Charter v1

This specification defines the product-facing verification charter for SocioProphet.
It translates doctrine into explicit acceptance criteria for user-facing product surfaces.

## Overview

SocioProphet should not require blind trust for consequential product behavior.
Users and institutions should be able to inspect, challenge, replay, and appeal important outcomes.

## User rights

Users interacting with consequential product workflows should have the following rights:

- inspect provenance for critical outputs and durable claims
- inspect the policy or rule basis for consequential product decisions
- inspect governance diffs when a visible institutional rule or decision surface changes
- request replay or equivalent audit reconstruction for critical outcomes
- challenge claims with counter-evidence through a structured review path
- export durable knowledge artifacts without silent loss of history or provenance

## System duties

SocioProphet product surfaces should:

- attach provenance references to consequential artifacts and decisions
- expose evidence pointers for governance, moderation, review, and publication actions where appropriate
- provide denial reasons when access, publication, or approval is blocked
- provide a structured appeal path for consequential denials or institutional review outcomes
- preserve product-visible diffs for state-changing governance actions
- default-deny when required proof or policy basis is missing

## Invariants

The following invariants should be treated as acceptance checks:

- no consequential action without evidence
- no durable artifact without provenance
- no enforcement without visible reason and appeal path
- no silent mutation of institutional truth
- privacy for persons and transparency for institutional power

## Example product checks

Examples of checks that should be expressible in tests or review gates:

- a moderation action emits a policy basis and evidence reference
- a publication denial includes an appeal path
- an institutional review decision is traceable to its evidence bundle
- a durable knowledge artifact includes provenance metadata or an external provenance pointer
```

---

## File: `spec/security/attestation-envelope-v1.md`

```md
# Attestation Envelope v1

This specification defines the minimal product-facing attestation envelope for SocioProphet.
It is concerned with product artifacts, evidence bundles, policy decisions, and user-visible consequential outputs.

## Scope

The attestation envelope should be usable for:

- durable product artifacts
- evidence bundles and publication bundles
- policy snapshots and governance decisions
- model output bundles when those outputs are consequential
- consequential review outcomes and institutional determinations

## Required fields

Minimum fields:

- subject hash or content address
- artifact or decision type
- producer identity
- producer scope or role
- timestamp
- nonce or equivalent uniqueness value
- policy snapshot hash or policy reference when applicable
- reproducibility metadata or replay pointer when applicable
- transparency-log pointer when an event is log-worthy

## Verification checks

A valid envelope should support the following checks:

- the subject hash matches the referenced artifact
- the producer identity is valid for the claimed scope
- the timestamp and uniqueness field are present
- the policy reference resolves when required
- the transparency pointer resolves when required

## Example envelope

```json
{
  "subject": "sha256:...",
  "kind": "governance-decision",
  "producer": {
    "id": "review-system",
    "scope": "institutional-review"
  },
  "timestamp": "2026-04-06T00:00:00Z",
  "nonce": "...",
  "policy_ref": "policy:publication:v3",
  "transparency_ref": "log:event:..."
}
```
```

---

## File: `spec/security/transparency-log-v1.md`

```md
# Transparency Log v1

This specification defines the product-facing transparency log for consequential SocioProphet events.
It focuses on visible product behavior, not generic infrastructure logging.

## Event classes

Representative event classes include:

- publication accepted
- publication denied
- moderation action applied
- governance rule adopted
- governance rule revised
- institutional review opened
- institutional review concluded
- evidence bundle published
- replay request fulfilled

## Entry fields

Each entry should include:

- event identifier
- event class
- timestamp
- actor or producing system
- scope or affected surface
- subject reference
- evidence pointer or bundle reference when applicable
- policy reference when applicable
- prior event linkage when this is a revision or follow-on event

## Query and export expectations

The transparency surface should support:

- filtering by event class
- filtering by subject
- filtering by actor or producing system
- retrieval of event-linked evidence pointers
- export of product-visible event history for review and audit

## Inclusion and consistency expectations

The product log should preserve durable event ordering and should not silently delete consequential entries.
Where log redaction is necessary for privacy or policy reasons, the redaction itself should be visible as an event class.
```

---

## File: `spec/security/witness-diversity-policy-v1.md`

```md
# Witness Diversity Policy v1

This specification defines diversity requirements for corroborating high-consequence product events.
The goal is to avoid a monoculture confirmation pattern for product-visible institutional actions.

## Diversity dimensions

Where corroboration is required, diversity should be evaluated across dimensions such as:

- organizational control domain
- review role or reviewer cluster
- infrastructure or execution domain
- policy path or evidence source family

## Quorum expectations

For high-consequence events, corroboration should not come entirely from one tightly coupled source cluster.
A quorum policy should require meaningful diversity rather than repeated confirmation from the same operational locus.

## Failure conditions

A diversity check should fail when:

- all corroborating events come from one control domain
- all reviewers or producing systems belong to one tightly coupled cluster
- evidence pointers collapse onto one non-independent source without justification

## Review guidance

This policy should be applied to product-visible actions such as:

- major governance changes
- institutional determinations with durable downstream effect
- moderation or publication actions that carry strong review expectations
```

---

## File: `spec/security/audit-bundle-and-replay-v1.md`

```md
# Audit Bundle and Replay v1

This specification defines the minimum audit-bundle and replay contract for critical SocioProphet workflows.
It exists to prevent proof theater.

## Bundle contents

A product audit bundle should contain, as applicable:

- artifact or decision references
- provenance or attestation references
- policy snapshot or rule reference
- evidence bundle pointers
- event-log pointers
- replay instructions or equivalent audit reconstruction path

## Replay contract

For workflows marked critical, the system should provide either:

- a direct replay path, or
- an equivalent audit reconstruction path that allows an authorized reviewer to reproduce the reasoning surface

## Expected outputs

A replay or audit reconstruction should ideally yield:

- pass or fail result
- diff against claimed output or outcome when applicable
- evidence references used during reconstruction
- policy basis used during reconstruction

## Example verification command

```bash
socio verify run --bundle BUNDLE_ID --replay
```

The exact command surface may change, but the replay requirement should not disappear.
```

---

## File: `spec/governance/governance-lifecycle-v1.md`

```md
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
```

---

## File: `spec/metrics/curvature-proxy-metrics-v1.md`

```md
# Curvature Proxy Metrics v1

This specification defines product-facing proxy metrics for concentration, suppression, unverifiable authority, and replay failure.

## Metric catalog

Examples include:

- concentration of consequential decisions in too few actors or systems
- ratio of denials without sufficient evidence references
- rate of replay failure across critical workflows
- ratio of unverifiable summary outputs to evidence-linked outputs
- concentration of publication or moderation actions in too few review paths

## Collection strategy

Metrics should be computable from product-visible events, governance events, denial surfaces, and replay surfaces.
They should not depend on hidden operator-only dashboards.

## Threshold guidance

Thresholds should be defined by domain and reviewed over time.
The important point is not one magic number; it is durable visibility into when authority or suppression is concentrating.

## Dashboard and alert notes

Metrics should support:

- trend view over time
- segmentation by product surface
- review when thresholds are exceeded
- linkage back to the relevant evidence or event history
```

---

## File: `spec/privacy/privacy-boundaries-v1.md`

```md
# Privacy Boundaries v1

This specification defines product privacy boundaries for SocioProphet.
The governing asymmetry is simple: privacy for persons, transparency for institutional power.

## Principles

- persons should not be exposed without clear policy basis
- consequential institutional actions should remain inspectable
- restricted access should itself be auditable
- publication boundaries should be intentional and reviewable

## Data handling boundaries

The product should distinguish among:

- public institutional artifacts
- restricted institutional artifacts
- personal or sensitive artifacts
- derived summaries that still require source-handling discipline

## Access audit requirements

Access to restricted material should generate durable audit traces when policy requires it.
The existence of restricted handling should not turn the product into a silent surveillance surface.

## Review and redaction notes

When redaction or restricted publication is applied, the product should preserve:

- visible statement that a boundary was applied
- policy basis when appropriate
- review path when a user needs to challenge the boundary
```

---

## Integration note

After these texts are copied into the corresponding files under `spec/`, the branch should be rechecked and PR #257 can be reassessed for promotion out of draft.
