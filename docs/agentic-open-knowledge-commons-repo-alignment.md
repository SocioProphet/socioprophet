# Agentic Open Knowledge Commons repo alignment v0.1

## Purpose

This note records where the current Agentic Open Knowledge Commons work belongs in the SocioProphet GitHub organization.

## Current placement

### `socioprophet-standards-storage`
Owns the merged normative contract pack:
- `GeneralDescriptor`
- `OrderDescriptor`
- initial event contracts
- ADR for the descriptor split
- descriptor and order examples

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
- example envelopes and future fixture vectors

### `agentplane`
Owns the narrow execution bridge:
- `OrderDescriptor` to `Bundle` mapping note
- evidence linking for `orderId` and `descriptorId`
- implementation checklist

### `socioprophet`
Owns umbrella integration and temporary incubation for the commons runtime scaffold until a dedicated repository exists.

## Merged foundations

The following AOKC foundations are already merged:
- `socioprophet-standards-storage` PR #11
- `TriTRPC` PR #19
- `agentplane` PR #11
- `socioprophet-standards-knowledge` PR #22

## Remaining open umbrella work

- `socioprophet` PR #255 — umbrella alignment and stack-status lane
- `socioprophet` PR #256 — temporary runtime incubator lane

## Constraint

The commons runtime must not duplicate:
- transport responsibilities already owned by `TriTRPC`
- execution responsibilities already owned by `agentplane`
- normative schema ownership already held by the standards repositories
