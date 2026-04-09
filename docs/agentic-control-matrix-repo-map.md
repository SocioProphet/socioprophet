# Agentic Control Matrix — repository map

This note records where the Agentic Control Matrix currently lives across the SocioProphet repository ecosystem.

## Canonical standards home

Repository: `SocioProphet/socioprophet-standards-storage`

Owns:
- ADR for canonical placement
- control-plane docs
- control-cell schemas
- package manifest
- reference compiler seed

## Runtime consumer lane

Repository: `SocioProphet/agentplane`

Owns:
- import manifest
- upstream pin to merged canonical commit
- runtime-governance integration notes
- reserved generated test / monitor landing points

## Transport implications

Repository: `SocioProphet/TriTRPC`

Owns only transport-facing control/event implications, not the full governance canon.

## Deployment and pinning

Repository: `SocioProphet/prophet-platform`

Expected future owner for rollout pinning and deployment wiring.

## Current status

The control-matrix work is partially normalized:
- runtime import lane exists in `agentplane`
- canonical standards package exists in `socioprophet-standards-storage`
- follow-on runtime bundle binding and tagged release/pinning remain to be completed

## Why this note exists

Without an umbrella index, the control-matrix work is easy to miss because the canon and the consumer live in different repositories.
