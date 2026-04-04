# Audit Bundle + Replay Recipe v1 (Spec Stub)

Prevents "proof theater" by requiring one-command replay.

## Audit Bundle
- pointers to attestations
- transparency log inclusion proofs
- policy snapshot(s)
- reproducible replay recipe (commands + hashes)
- human-readable report template

## Replay Contract
- deterministic entrypoint
- produces:
  - pass/fail
  - diff against claimed output
  - evidence pointers
