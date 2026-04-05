# Agentic Open Knowledge Commons repo alignment v0.1

## Purpose

This note records where the first Agentic Open Knowledge Commons work belongs in the current SocioProphet GitHub organization.

## Current placement

### `socioprophet-standards-storage`
Owns the normative contract pack:
- `GeneralDescriptor`
- `OrderDescriptor`
- initial event contracts
- ADR for the descriptor split

### `socioprophet-standards-knowledge`
Owns knowledge semantics:
- object class taxonomy
- promotion rules
- PARA projection rules
- content space model
- JSON-LD context skeleton

### `TriTRPC`
Owns typed carriage and deterministic transport notes for:
- descriptor services
- order services
- execution bridge services
- future fixture vectors

### `agentplane`
Owns the narrow execution bridge:
- `OrderDescriptor` to `Bundle` mapping note
- evidence linking for `orderId` and `descriptorId`

### `socioprophet`
Owns umbrella integration and cross-repo alignment.
It should not absorb the full commons runtime, but it should document the dependency chain and integration seams.

## Open PR set

- `socioprophet-standards-storage` PR #11 — descriptor contract pack
- `socioprophet-standards-knowledge` PR #22 — taxonomy and promotion rules
- `TriTRPC` PR #19 — descriptor and order transport notes
- `agentplane` PR #11 — order-to-bundle bridge notes

## Merge order

The intended merge order is:
1. `socioprophet-standards-storage`
2. `socioprophet-standards-knowledge`
3. `TriTRPC`
4. `agentplane`

This preserves dependency direction:
- contracts first
- semantics second
- transport third
- execution bridge fourth

## Next runtime step

After the four PRs above land, the next step is to create the dedicated commons runtime repository and wire it to the staged contracts rather than inventing new ones.

## Constraint

The commons runtime must not duplicate:
- transport responsibilities already owned by `TriTRPC`
- execution responsibilities already owned by `agentplane`
- normative schema ownership already held by the standards repositories
