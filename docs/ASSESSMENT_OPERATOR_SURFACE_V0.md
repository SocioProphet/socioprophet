# Evidence-Native Assessment Operator Surface v0

## Status

Plan document.

This document defines how the first evidence-native assessment slice should appear on the public and operator-facing `socioprophet` surfaces.

## Repository role reminder

This repository is the public surface and integration workspace. It should render the outward operator workflow, not become the canonical owner of assessment ontology or runtime semantics.

Normative ownership remains upstream:
- contracts: `socioprophet-standards-storage`
- semantic context: `socioprophet-standards-knowledge`
- policy binding: `policy-fabric`
- execution and receipt ownership: `agentplane`
- running service slice: `prophet-platform`

## Desired external workflow

The first operator-visible workflow should be legible and simple:

1. connect or upload evidence
2. choose assessment scope / framework
3. run evaluation
4. review cited findings
5. assign or track remediation
6. reassess

That simplicity is allowed only because deeper drill-down remains available.

## Required drill-down paths

For every visible finding, the UI should expose navigation to:
- receipt reference
- control row id
- evaluation status and decision
- supporting evidence refs
- missing proof classes where applicable
- replay / reassessment status

A dashboard that cannot drill to those surfaces is incomplete.

## Initial page surfaces

### 1. Assessment intake view

Capabilities:
- select subject under assessment
- select framework / policy bundle
- attach evidence references or evidence upload handles
- display evidence classification and processing posture

### 2. Assessment run status view

Capabilities:
- display run / trace status
- show evaluator versions
- show control counts in progress / pass / fail / warn states
- show receipt sealing state

### 3. Findings view

Capabilities:
- list findings with severity and disposition
- show citations count and affected control rows
- filter by framework section, severity, owner, status
- link each finding to evaluation and evidence references

### 4. Control coverage view

Capabilities:
- display row-level or section-level coverage summaries
- distinguish pass, partial, fail, warn, not evaluated, not applicable
- avoid score theater by exposing method and receipt linkage

### 5. Remediation view

Capabilities:
- show open findings, owners, due dates, and closure criteria
- show exception / incident linkage where present
- show reassessment state after remediation work lands

## UX invariants

1. Reports are derived views, not the source of truth.
2. Percentages or coverage rollups must be traceable to evaluations and receipts.
3. Findings must expose evidence citations.
4. Users must be able to distinguish missing proof from contradictory proof.
5. Approval-gated or denied results must be visible as policy outcomes, not hidden as generic errors.

## Non-goals for v0

This surface does not yet require:
- full portfolio benchmarking across many entities
- custom narrative report builders
- advanced vendor questionnaire flows
- executive-only scorecards without drill-down

## Acceptance gate

The operator surface is acceptable for v0 when an operator can:
- start one assessment
- inspect one finding
- open its underlying control evaluation
- inspect its evidence references
- confirm its receipt linkage
- observe a reassessment after remediation
