# ProofPack and Entity Proof Contract

This page defines the minimum public contract sketch for entity-side proof bundles.

It is intentionally docs-first. It is not yet the full serialized schema family for the entity lane.

## 1. Purpose

A `ProofPack` is the public-safe review and replay bundle for a consequential entity-side decision.

It exists so the platform can explain:

- what claim was evaluated
- what result was reached
- what evidence classes were used
- what policy or admissibility rule applied
- what replay or reversal handle exists
- what safe alternative was offered where relevant

## 2. Relation to the cross-lane canon

`ProofPack` is not a separate proof model.

It is a packaging profile over the already-existing authorities described in the cross-lane artifact canon:

- Capability Fabric receipt and proof semantics
- AgentPlane decision artifacts and evidence records
- Knowledge Context claims, relations, artifacts, and provenance
- Entity Analytics proof artifacts and governed decisions
- public-safe product and operator evidence where those surfaces expose provenance, receipts, or replay state

Primary companion references:

- [Cross-Lane Artifact Canon](./cross-lane-artifact-canon)
- [Entity Analytics Reference](./entity-analytics-reference)
- [Legal Entity Reference Fabric](./legal-entity-reference-fabric)

## 3. When to emit a ProofPack

A `ProofPack` should exist for decisions such as:

- merge allow / review / block
- unmerge or reversal
- export allow / review / block
- suppression or coarsening
- sanctions or screening adjudication
- protected-context block decisions
- any high-consequence analyst-reviewed outcome

## 4. Minimum public contract

A `ProofPack` should expose at least:

- `proofpack_id`
- `version`
- `result`
- `decision_artifact_refs`
- `claim_refs`
- `evidence_refs`
- `provenance_refs`
- `policy_refs`
- `replay_refs`
- `signature_refs`
- `scope_set`
- `temporal_profile`
- `trust_profile`
- `safe_summary`
- `counterexample_refs`
- `safe_alternative_refs`

Not every pack will populate every optional field, but the semantic slots should remain stable.

## 5. Field meanings

### `result`

The outcome, such as:

- `allowed`
- `review_required`
- `blocked`
- `reversed`
- `suppressed`
- `coarsened`

### `decision_artifact_refs`

References to the underlying governed decisions that produced the pack.

### `claim_refs`

The claims or candidate propositions at issue.

### `evidence_refs`

The bounded set of evidence objects, source records, artifacts, anchors, or summaries used for the decision.

### `provenance_refs`

References to lineage objects that explain how the evidence or decision state was formed.

### `policy_refs`

The policy, rule set, version, or gate that made the decision admissible, reviewable, or blocked.

### `replay_refs`

Hooks required to reconstruct the decision path or rerun the explanation path.

### `scope_set`

The scopes involved in the decision, such as local, citizen-cloud, institutional, commercial, or other trust-relevant boundaries.

### `temporal_profile`

The relevant time semantics for the decision, including when it occurred, when it was captured, and any validity window that matters.

### `trust_profile`

The trust and admissibility semantics for the decision, including validation state, checks, confidence where applicable, review state, rights constraints, freshness, controllability, proof strength, and signatures or witnesses.

### `safe_summary`

A public-safe explanation of the result that does not reveal restricted tactical internals.

### `counterexample_refs`

References to the contradictory or blocking evidence path where the result was rejected or reversed.

### `safe_alternative_refs`

References to the approved bounded alternative when the original action was blocked.

## 6. Entity-side DecisionArtifact mapping

In the entity lane, the following should be treated as `DecisionArtifact` specializations:

- link review decision
- merge decision
- unmerge decision
- export decision
- suppression or coarsening decision
- screening or sanctions decision
- replay or remediation decision
- safe-alternative selection decision

## 7. Public-safe boundary

A `ProofPack` may explain:

- the claim at issue
- the result
- the evidence classes used
- the scopes involved
- the policy or gate applied
- the replay and reversal path
- the safe alternative

A `ProofPack` should not expose:

- restricted operator kits
- sensitive thresholds
- secret-bearing raw handles
- prohibited protected-context exports
- misuse-enabling tactical internals

## 8. Minimal sketch

```json
{
  "proofpack_id": "pp_...",
  "version": "v0",
  "result": "blocked",
  "decision_artifact_refs": ["da_..."],
  "claim_refs": ["claim_..."],
  "evidence_refs": ["ev_...", "src_..."],
  "provenance_refs": ["prov_..."],
  "policy_refs": ["policy_..."],
  "replay_refs": ["replay_..."],
  "signature_refs": ["sig_..."],
  "scope_set": ["local", "health", "ads"],
  "temporal_profile": {
    "captured_time": "...",
    "occurred_time": "...",
    "effective_start": null,
    "effective_end": null
  },
  "trust_profile": {
    "validation_state": "blocked",
    "confidence": 0.91,
    "review_state": "operator-reviewed"
  },
  "safe_summary": "Patient-bearing local event was evidentially related but export to ad-tech scope was blocked by policy.",
  "counterexample_refs": ["cx_..."],
  "safe_alternative_refs": ["alt_..."]
}
```

## 9. Relation to the Michael cross-context example

The Michael cross-context example already contains the right proof ingredients:

- claim
- result
- evidence atoms
- blocking policy
- scopes involved
- decision rule
- replay hook
- safe alternative

This page makes that sketch explicit as a reusable public contract.

## 10. Relation to the legal-entity lane

The legal-entity reference fabric already names proof and export as a distinct plane and explicitly calls proof/export artifact standardization one of the remaining implementation gaps.

This page is the public contract bridge for that work. It lets the legal-entity lane describe replayable proof/export bundles without pretending the final schema pack is already frozen.

## 11. Next evolution

This page is a contract sketch, not yet a finished schema pack.

A later tranche may promote it into:

- JSON Schema
- Avro payload contract
- exported review bundle format
- stronger links to entity or legal-entity implementation artifacts
