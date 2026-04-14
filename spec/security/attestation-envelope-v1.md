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
