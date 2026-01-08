# Attestation Envelope v1 (Spec Stub)

Defines what must be signed and how it is verified for:
- code artifacts (build provenance)
- datasets (lineage + transforms)
- models (training/run manifests)
- policies (versioned diffs)
- decisions (inputs/constraints/output hashes)

## Required fields (draft)
- subject (hash / content-address)
- producer identity (key, role, capability scope)
- build/training/run metadata (repro inputs)
- policy snapshot hash
- timestamp + nonce
- transparency log pointer(s)
