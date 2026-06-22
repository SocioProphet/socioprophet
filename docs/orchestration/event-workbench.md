# Event-Native Orchestration Workbench

Status: public-surface and integration specification

This document defines the UI target for the sovereign device orchestration work now spanning Prophet Platform, Guardrail Fabric, SourceOS, AgentPlane, Sherlock Search, and SocioProphet.

The workbench is not a smart-home remote. It is an event-native cybernetic control surface. The user sees what happened, what inferred it, which capability matched, what policy decided, whether AgentPlane admitted it, where SourceOS queued it, how Sherlock can search it, and which evidence receipts prove it.

## Core route

Candidate route:

`/orchestration`

Candidate secondary route:

`/orchestration/events`

The route should be fixture-backed first. No live device actuation, cloud provider calls, proprietary credentials, or camera-media retention are allowed in the first slice.

## Data sources

Initial fixture files are produced by `SocioProphet/prophet-platform`:

- `specs/orchestration/world_class_event_loop_demo.py`
- `artifacts/orchestration/world-class-event-loop/demo-report.json`
- `artifacts/orchestration/world-class-event-loop/event-capability.policy-annotated.records.json`
- `artifacts/orchestration/world-class-event-loop/sourceos-queue.snapshot.json`
- `artifacts/orchestration/world-class-event-loop/agentplane-admission.artifact.json`
- `artifacts/orchestration/world-class-event-loop/sherlock-event-capability-index.json`

Runtime data should later come from SourceOS queue state, AgentPlane admission artifacts, Guardrail policy artifacts, and Sherlock search packets.

## Panels

### 1. Event stream

Shows each event-capability record as a timeline row.

Required fields:

- event id
- event type
- target node id
- capability id
- capability display name
- effect class
- policy outcome
- reaction status
- idempotency key
- policy epoch
- receipt refs

Visual states:

- `admitted` / pending execution
- `waiting_for_approval`
- `blocked`
- `dead_letter`
- `degraded`

### 2. Capability graph

Shows the route from event to capability to policy to queue/admission/search:

`event -> subscription -> capability -> policy -> reaction -> SourceOS queue -> AgentPlane admission -> Sherlock index`

Required interactions:

- select an event row
- highlight matched capability
- show policy decision reasons
- show queue state and admission state
- show receipt refs and idempotency key

### 3. Queue board

Columns:

- pending
- waiting approval
- blocked
- dead letter
- replay

Each card shows event id, capability id, outcome, idempotency key, and receipt refs.

### 4. Evidence drawer

When a user selects an event, show:

- receipts
- policy decision
- AgentPlane admission details
- SourceOS queue envelope
- Sherlock indexed record
- causal chain / parent events
- privacy and redaction posture

The drawer must distinguish observed facts from inferred state and from proposed actions.

### 5. Search pane

Search over Sherlock event-capability packets.

Example queries:

- `security approval`
- `camera media denied`
- `fan allowed temperature`
- `degraded adapter`
- `waiting approval`

Results must show evidence refs, not just generated prose.

### 6. Embodied trace pane

Shows E2WM-style trace records for:

- track and count
- object permanence
- plan generation
- policy-aware planning

This panel exists to make the world-model layer visible. It should answer why the system believes an object, device, room, or plan state is true.

## Interaction rules

1. The first slice is read-only.
2. No button may directly actuate a real device.
3. High-risk actions render as approval-required or blocked, never as silent execution.
4. Every displayed action must link to evidence refs.
5. Every row must expose data mode: fixture, bounded-live, or live.
6. Camera-derived events default to metadata-only display.
7. Agent proposals must be visually distinct from observed sensor/device events.
8. Queue replay is preview-only until an explicit runtime admission flow exists.

## Fixture contract

A minimal UI fixture should be shaped as:

```json
{
  "mode": "fixture",
  "demoReport": {},
  "eventCapabilityRecords": [],
  "sourceosQueue": {},
  "agentplaneAdmission": {},
  "sherlockIndex": {},
  "embodiedTraceRecords": []
}
```

## Acceptance criteria

- Render fixture event rows from policy-annotated records.
- Render queue counts for pending, waiting approval, blocked, and dead-letter.
- Render one evidence drawer with receipt refs and idempotency key.
- Render one search panel backed by Sherlock-style fixture records.
- Render one embodied trace panel for object permanence or plan generation.
- Clearly show read-only fixture mode.
- No UI path can trigger live actuation in the first slice.

## Product standard

Apple has strong device continuity. Google has strong AI-home direction. Samsung has appliance graph depth. Home Assistant has local-first control. Our differentiator is governed event causality: every observation, inference, proposal, policy decision, admission result, queue transition, search result, and replay artifact is visible, inspectable, and evidence-backed.
