# ChatGPT Web Privacy Boundary Operator Playbook

Date: 2026-04-09
Status: upstream-checked before filing
Companion documents:
- `inventory/research/chatgpt-web-privacy-boundary-defect-register-2026-04-09.md`
- `inventory/research/chatgpt-web-privacy-boundary-evidence-addendum-2026-04-09.md`

## Purpose

This playbook converts the existing defect register and evidence addendum into an operator-ready collection and triage workflow.

It is designed for fast repeatable use when investigating ChatGPT web-client privacy-boundary behavior in a real browser session.

## Freshness check

Immediately before writing this playbook, the narrow upstream recheck still matched the same current public control-plane model:

- `pitiflautico/neobrowser` — `28085db3efe228e48ebcb9cd03aa01bb55573bec`
- `pitiflautico/neobrowser` — `01a549d91f26df09e23531004df5cf2ede35ea1d`
- `pitiflautico/neobrowser` — `e1a4cabc1aac8f79246d172bba676448c1e967ee`
- `pitiflautico/neobrowser` — `38073370354de65a8d2c59cd4c59bbaa4a0d6e4f`

No newer contradictory upstream movement surfaced in that narrow check.

## Investigation priorities

Priority order remains:

1. **External third-party media/browser exposure**
2. **First-party telemetry / experimentation minimization**
3. **Connector / capability enumeration scope**
4. **Control-plane explanation only** for Sentinel, websocket, and `/f/conversation*`

The fourth category is not ignored. It is simply not the lead accusation lane after upstream verification.

## Minimal reproducible capture workflow

### Phase 1 — Baseline capture

Use a dedicated browser profile/container.

Required conditions:
- ChatGPT open in a single clean browser profile if possible
- privacy blocker status recorded
- connector status recorded
- extensions noted
- DevTools Network tab recording enabled before page load or interaction

Capture baseline evidence for:
- full page bootstrap
- idle state after load
- one prompt send / conversation resume event
- one navigation to feed/home if relevant

### Phase 2 — Third-party media check

Goal:
Confirm whether the page causes browser contact to non-OpenAI media/CDN origins.

Required capture per request:
- full URL
- request method
- status/outcome
- Initiator tab / stack
- Request headers
- Referrer policy if shown
- whether a blocker prevented the request

Minimum sufficient proof:
one confirmed third-party media request whose Initiator chain points to page/application render logic rather than an unrelated extension.

Classification rule:
- If direct browser contact to third-party media is user-untriggered or automatic, classify as **D1 High**.
- If it occurs only after explicit click and is clearly labeled, downgrade severity.

### Phase 3 — Telemetry lane check

Goal:
Classify `ces` / telemetry / experiment registration traffic by schema rather than by naming alone.

Capture these three lanes first:
- `chatgpt.com/ces/v1/t`
- `chatgpt.com/ces/v1/telemetry/intake?...ddforward=...`
- `ab.chatgpt.com/v1/rgstr?...`

For each request capture:
- request URL
- request method
- top-level request body keys
- obvious nested field group names if visible
- response code
- request cadence / repetition pattern
- whether identifiers appear stable or rotating

Classification rule:
- operational health/performance metrics only → lower privacy concern
- experiment or client-registration schema → governance/minimization concern
- detailed user-behavior/action schema → elevate to stronger observability concern

### Phase 4 — Connector enumeration check

Goal:
Determine whether `backend-api/aip/connectors/links/list_accessible` is eager by default or feature-triggered.

Run two traces:
1. baseline page load with no connector interaction
2. explicit connector feature entry or linked-resource interaction

Capture:
- count of `list_accessible` requests
- timing relative to page load / feature entry
- whether feed/bootstrap also triggers enumeration

Classification rule:
- default bootstrap enumeration without explicit user action → **D3 Medium** or higher if broad
- lazy feature-triggered enumeration → lower concern

### Phase 5 — Control-plane explanation check

Goal:
Keep current browser control-plane traffic from being mislabeled as the lead privacy accusation.

Track but do not over-accuse by default:
- `sentinel/chat-requirements/*`
- `sentinel/ping`
- `/backend-api/f/conversation*`
- websocket to `ws.chatgpt.com`

Use these questions:
- is the lane session/auth/attestation related?
- is it strongly corroborated by current upstream reverse-engineering?
- does it appear required for active chat flow?

If yes, keep it in the control-plane bucket unless payload evidence later changes the interpretation.

## Decision table

### Bucket A — High-severity privacy defect

Criteria:
- browser contacts third-party domains from chat context automatically
- third-party media/CDN loads are not clearly user-triggered
- request metadata crosses origin boundary unnecessarily

Action:
- file under external media boundary failure
- prioritize remediation first

### Bucket B — Medium-high first-party observability concern

Criteria:
- high-frequency `ces` or telemetry bursts
- repeated event submission with unclear necessity
- payloads show broad app-state or behavioral exhaust

Action:
- file under telemetry minimization / observability overcollection
- separate from external third-party tracking claims

### Bucket C — Medium connector/capability concern

Criteria:
- capability enumeration occurs before feature entry
- linked-resource accessibility is probed broadly at bootstrap

Action:
- file under eager connector enumeration

### Bucket D — Control-plane / anti-abuse / session integrity

Criteria:
- request path aligns with Sentinel / `/f/conversation` / websocket session flow
- corroborated by current upstream reverse-engineering
- functionally required for chat/browser security flow

Action:
- document for completeness
- do not lead with this as the tracker claim

## Evidence packaging standard

For each future addendum, include:
- exact request URL
- request category
- why it matters
- what it proves
- what it does **not** prove
- whether it changes severity or only semantics

This prevents category drift and overclaiming.

## Minimal addenda still expected

### Addendum A — telemetry payload semantics

Needed fields:
- `ces/v1/t` top-level keys
- `telemetry/intake` top-level keys
- `ab.chatgpt.com/v1/rgstr` top-level keys

Output:
A classification note separating operational metrics, experiment enrollment, and behavioral analytics.

### Addendum B — external media causality

Needed fields:
- one third-party media request
- Initiator chain
- headers/referrer context

Output:
A causality note proving whether the page/application render path triggered the cross-origin request.

### Addendum C — connector trigger differential

Needed fields:
- baseline no-connector trace
- explicit connector-use trace

Output:
A scope note on whether connector enumeration is eager or feature-driven.

## Publication posture

Until Addenda A-C are collected, the strongest publication-safe line remains:

> The ChatGPT web client exhibits weak privacy-boundary discipline through automatic third-party media fetches, high-frequency first-party telemetry emission, and potentially over-eager capability enumeration, while Sentinel and `/f/conversation` traffic appears to be current anti-abuse/session control-plane rather than standalone tracking evidence.

## SocioProphet operational note

Use this playbook to keep future investigation artifacts tight, comparable, and non-duplicative. The goal is not just to collect more data, but to collect the **smallest evidence set that materially changes confidence**.
