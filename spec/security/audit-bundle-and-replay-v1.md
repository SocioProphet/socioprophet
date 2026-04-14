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
