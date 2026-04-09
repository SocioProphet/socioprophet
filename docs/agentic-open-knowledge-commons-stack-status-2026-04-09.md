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

## Remaining open PRs

### `socioprophet-standards-knowledge` PR #22
Still open.
This remains the knowledge-semantics layer:
- object class taxonomy
- promotion rules
- PARA projection rules
- content space model
- JSON-LD context skeleton

### `socioprophet` PR #255
Still open.
This remains the umbrella alignment and merge-order lane.

### `socioprophet` PR #256
Still open.
This remains the temporary umbrella-repo runtime incubator and now contains starter runtime stubs in addition to docs and examples.

## Immediate dependency order

Given the current live state, the remaining intended order is:
1. `socioprophet-standards-knowledge` PR #22
2. `socioprophet` PR #255
3. `socioprophet` PR #256

## Follow-on work

Now that the transport foundation in `TriTRPC` has merged, follow-on transport example and fixture work should land as new PRs against `main`, not as additions to the already-merged PR #19 branch.

## Exit condition

After the remaining open PRs land, the temporary `aokc-runtime/` incubator in `socioprophet` PR #256 should be extracted into a dedicated commons runtime repository.
