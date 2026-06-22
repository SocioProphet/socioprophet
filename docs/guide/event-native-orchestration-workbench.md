# Event-Native Orchestration Workbench

The Event-Native Orchestration Workbench is the read-only public/integration surface for sovereign device orchestration.

It is not a smart-home remote. It is an evidence surface for governed event causality: what happened, what inferred it, which capability matched, what policy decided, whether AgentPlane admitted it, where SourceOS queued it, how Sherlock can search it, and which evidence receipts prove it.

## Current status

Status: fixture-first specification and implementation target.

Canonical upstream work:

- `SocioProphet/prophet-platform/specs/orchestration/world_class_event_loop_demo.py`
- `SocioProphet/prophet-platform/specs/orchestration/CROSS_REPO_INTEROP.md`
- `SocioProphet/guardrail-fabric/guardrail_fabric/event_capability_policy.py`
- `SourceOS-Linux/sourceos-syncd/src/sourceos_syncd/orchestration_events.py`
- `SocioProphet/agentplane/pull/130`
- `SocioProphet/sherlock-search/tools/search_event_capability_records.py`

## Target route

Candidate route:

`/orchestration`

Candidate secondary route:

`/orchestration/events`

The first implementation must be fixture-backed and read-only. It must not actuate a device, call a provider, collect credentials, or retain camera media.

## Control loop

The workbench renders this loop:

`event -> subscription -> capability -> policy -> reaction -> SourceOS queue -> AgentPlane admission -> Sherlock index`

The important property is not routine chaining. The important property is inspectable event causality.

Every visible row must carry evidence.

## Panels

### Event stream

The event stream shows policy-annotated event-capability records.

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

Rows should visually distinguish observed events, inferred events, agent proposals, policy decisions, queue transitions, and replay/dead-letter records.

### Capability graph

The capability graph shows the route from input event to system decision:

`event -> subscription -> capability -> policy -> reaction -> SourceOS queue -> AgentPlane admission -> Sherlock index`

Selecting a row should highlight the matched capability, policy outcome, queue state, admission state, receipt refs, and idempotency key.

### Queue board

The queue board has columns:

- pending
- waiting approval
- blocked
- dead letter
- replay

Each card should show event id, capability id, policy outcome, idempotency key, and receipt refs.

### Evidence drawer

The evidence drawer opens from an event row or queue card.

It should show:

- receipts
- policy decision
- AgentPlane admission details
- SourceOS queue envelope
- Sherlock indexed record
- causal chain / parent events
- privacy and redaction posture

Observed facts, inferred state, and proposed actions must be visually distinct.

### Sherlock search pane

The search pane queries event-capability records using Sherlock-style evidence packets.

Example queries:

- `security approval`
- `camera media denied`
- `fan allowed temperature`
- `degraded adapter`
- `waiting approval`

Results must show evidence refs, not just generated prose.

### Embodied trace pane

The embodied trace pane shows E2WM-style traces for:

- track and count
- object permanence
- plan generation
- policy-aware planning

This pane makes the world-model layer visible. It should explain why the system believes an object, device, room, or plan state is true.

## First fixture contract

The first UI fixture should be shaped as:

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

The fixture should be generated from Prophet Platform's world-class event loop demo artifacts.

## Interaction rules

1. The first slice is read-only.
2. No button may directly actuate a real device.
3. High-risk actions render as approval-required or blocked, never as silent execution.
4. Every displayed action links to evidence refs.
5. Every row exposes data mode: fixture, bounded-live, or live.
6. Camera-derived events default to metadata-only display.
7. Agent proposals are visually distinct from observed sensor/device events.
8. Queue replay is preview-only until an explicit runtime admission flow exists.

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
