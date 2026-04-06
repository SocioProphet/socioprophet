# Agentic Open Knowledge Commons live stack status

## Purpose

This note records the current staged AOKC pull-request stack as it exists today in the SocioProphet GitHub organization.

## Live staged PR set

1. `socioprophet-standards-storage` PR #11
   - descriptor contract pack
   - event contracts
   - ADR for descriptor split
   - descriptor and order examples

2. `socioprophet-standards-knowledge` PR #22
   - object class taxonomy
   - promotion rules
   - PARA projection rules
   - content space model
   - JSON-LD context skeleton

3. `TriTRPC` PR #19
   - descriptor/order/execution-bridge contract notes
   - descriptor and order example payloads
   - fixture placeholders

4. `agentplane` PR #11
   - order-to-bundle bridge note
   - evidence-linking note
   - implementation checklist

5. `socioprophet` PR #255
   - umbrella repo alignment note
   - merge-order note

6. `socioprophet` PR #256
   - temporary runtime bootstrap scaffold
   - first-slice flow
   - runtime implementation checklist
   - concrete example descriptor/order payloads for the first slice

## Intended merge order

The intended merge order is:
1. `socioprophet-standards-storage` PR #11
2. `socioprophet-standards-knowledge` PR #22
3. `TriTRPC` PR #19
4. `agentplane` PR #11
5. `socioprophet` PR #255
6. `socioprophet` PR #256

## Dependency rule

PR #256 is downstream of the preceding five PRs.
It is a temporary incubator in the umbrella repo and must not be treated as a substitute for a dedicated commons runtime repository.

## Exit condition

After the stack above lands, the temporary `aokc-runtime/` scaffold should be extracted into a dedicated commons runtime repository and continue from there.
