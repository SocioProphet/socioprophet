# Entity Graph and Safe Linkage

Entity Analytics prefers a governed graph over a naive monolithic profile.

## Safe linkage

Linkage decisions consider:
- evidence quality
- scope compatibility
- policy restrictions
- downstream harm if contexts are merged incorrectly

## Graph rule

A link can be useful without becoming an irreversible merge.

The system can preserve:
- candidate links
- asserted links
- policy-blocked links
- revoked or unmerged links

## Product implication

The surface should make clear when:
- two contexts are related
- two contexts are candidates
- a link is forbidden
- an earlier merge has been reversed
