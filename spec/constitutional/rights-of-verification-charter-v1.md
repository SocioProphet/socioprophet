# Rights of Verification Charter v1

This specification defines the product-facing verification charter for SocioProphet.
It translates doctrine into explicit acceptance criteria for user-facing product surfaces.

## Overview

SocioProphet should not require blind trust for consequential product behavior.
Users and institutions should be able to inspect, challenge, replay, and appeal important outcomes.

## User rights

Users interacting with consequential product workflows should have the following rights:

- inspect provenance for critical outputs and durable claims
- inspect the policy or rule basis for consequential product decisions
- inspect governance diffs when a visible institutional rule or decision surface changes
- request replay or equivalent audit reconstruction for critical outcomes
- challenge claims with counter-evidence through a structured review path
- export durable knowledge artifacts without silent loss of history or provenance

## System duties

SocioProphet product surfaces should:

- attach provenance references to consequential artifacts and decisions
- expose evidence pointers for governance, moderation, review, and publication actions where appropriate
- provide denial reasons when access, publication, or approval is blocked
- provide a structured appeal path for consequential denials or institutional review outcomes
- preserve product-visible diffs for state-changing governance actions
- default-deny when required proof or policy basis is missing

## Invariants

The following invariants should be treated as acceptance checks:

- no consequential action without evidence
- no durable artifact without provenance
- no enforcement without visible reason and appeal path
- no silent mutation of institutional truth
- privacy for persons and transparency for institutional power

## Example product checks

Examples of checks that should be expressible in tests or review gates:

- a moderation action emits a policy basis and evidence reference
- a publication denial includes an appeal path
- an institutional review decision is traceable to its evidence bundle
- a durable knowledge artifact includes provenance metadata or an external provenance pointer
