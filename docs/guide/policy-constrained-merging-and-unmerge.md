# Policy-Constrained Merging and Unmerge

Confidence is not enough.

Entity Analytics can reject a high-confidence merge if that merge would violate trust, safeguarding, or cross-context protection rules.

## Merge rule

Merge requires:
- evidence
- policy compatibility
- acceptable harm profile
- reviewability

## Unmerge rule

Unmerge is a first-class operation, not a failure state.

The system supports:
- rollback of harmful merges
- preservation of evidence trails
- explanation of why a merge was blocked or reversed

## Why this matters

This is how we prevent contexts such as patient, child, parent, learner, citizen, or ad-target from collapsing into unsafe ambient identity leakage.
