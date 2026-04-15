# Agentic Open Knowledge Commons live stack status — 2026-04-09

## Purpose

This note records the updated live state of the staged AOKC stack after the latest repository changes.

## Merged foundation PRs

### `socioprophet-standards-storage` PR #11
Merged.
Contains:
- `GeneralDescriptor` schema v0.1
- `OrderDescriptor` schema v0.1
- initial event contracts
- ADR for descriptor split
- descriptor and order examples

### `socioprophet-standards-knowledge` PR #22
Merged.
Contains:
- object class taxonomy
- promotion rules
- PARA projection rules
- content space model
- JSON-LD context skeleton

### `TriTRPC` PR #19
Merged.
Contains:
- descriptor/order/execution-bridge contract notes
- descriptor and order example payloads
- initial fixture placeholders

### `agentplane` PR #11
Merged.
Contains:
- order-to-bundle bridge note
- evidence-linking note
- implementation checklist

## Open follow-on work

### `TriTRPC` PR #26
Open.
Adds follow-on transport example envelopes for:
- `ValidateOrder`
- `ResolveOrderToBundle`
- `AttachRunArtifact`

### `socioprophet` PR #255
Open.
This is the umbrella alignment and stack-status lane.

### `socioprophet` PR #256
Open.
This is the temporary umbrella-repo runtime incubator with docs, examples, transport helpers, bridge helpers, evidence linkage, and retrieval projection starter stubs.

## Immediate dependency order

Given the current live state, the remaining intended order is:
1. `socioprophet` PR #255
2. `socioprophet` PR #256

`TriTRPC` PR #26` is a follow-on transport enhancement on top of the already-merged transport foundation and is not a prerequisite for the umbrella alignment PR.

## Exit condition

After the remaining umbrella PRs land, the temporary `aokc-runtime/` incubator in `socioprophet` PR #256 should be extracted into a dedicated commons runtime repository.
