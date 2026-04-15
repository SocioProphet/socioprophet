# ChatGPT Web Privacy Boundary Evidence Addendum

Date: 2026-04-09
Status: upstream-checked before filing
Companion to: `inventory/research/chatgpt-web-privacy-boundary-defect-register-2026-04-09.md`

## Purpose

This addendum records what we **know**, what we **do not yet know**, and what evidence is still required to close the remaining gaps in the ChatGPT web privacy-boundary assessment.

The companion defect register is the decision document. This addendum is the evidence-scoping document.

## Freshness confirmation

Immediately before writing this addendum, the narrow upstream recheck still showed the same representative public control-plane model:

- `pitiflautico/neobrowser` — `28085db3efe228e48ebcb9cd03aa01bb55573bec`
  - Sentinel persona / `chatgpt-noauth` state before send
- `pitiflautico/neobrowser` — `01a549d91f26df09e23531004df5cf2ede35ea1d`
  - conduit token + `/f/conversation/prepare` + additional Chrome-like control headers
- `pitiflautico/neobrowser` — `e1a4cabc1aac8f79246d172bba676448c1e967ee`
  - `prepare -> finalize -> /f/conversation/prepare -> /f/conversation -> sentinel/ping`
- `pitiflautico/neobrowser` — `38073370354de65a8d2c59cd4c59bbaa4a0d6e4f`
  - `ces/*` retained as part of the fuller app runtime/telemetry lane

No newer contradictory upstream commit surfaced in the narrow recheck performed just before this file was written.

## What we know with high confidence

### 1. External third-party media loads occurred or were attempted

From the browser evidence already reviewed, the page attempted direct browser contact to external media/CDN origins from within ChatGPT context.

This is enough to support the external-media defect in the companion register.

### 2. The browser client is heavily instrumented

Observed first-party lanes include at least:

- `chatgpt.com/ces/v1/t`
- `chatgpt.com/ces/v1/telemetry/intake?...ddforward=...`
- `chatgpt.com/ces/statsc/flush`
- `ab.chatgpt.com/v1/rgstr?...`
- `chatgpt.com/backend-api/lat/r`
- `chatgpt.com/backend-api/sentinel/ping`
- `chatgpt.com/backend-api/f/conversation/prepare`
- `chatgpt.com/backend-api/f/conversation/resume`
- `chatgpt.com/backend-api/conversation/<id>/async-status`
- `chatgpt.com/backend-api/aip/connectors/links/list_accessible`
- `chatgpt.com/backend-api/feed/entrypoint`
- `wss://ws.chatgpt.com/...`

### 3. Sentinel and `/f/conversation` are now corroborated control-plane behavior

Recent upstream public reverse-engineering strongly supports the conclusion that:

- Sentinel prepare/finalize/ping
- `/f/conversation` and `/f/conversation/prepare`
- associated device/header/token lanes

are part of current browser control-plane and anti-abuse/session mechanics.

That means they should not be misfiled as the strongest privacy accusation.

## What we do not yet know

### 1. Exact semantics of the telemetry payloads

We do **not** yet have request-body field maps for:

- `ces/v1/t`
- `ces/v1/telemetry/intake`
- `ab.chatgpt.com/v1/rgstr`

Without those payload schemas, we cannot cleanly separate:

- operational health metrics,
- browser/runtime diagnostics,
- experiment enrollment,
- behavioral analytics,
- or other app-state emissions.

### 2. Exact initiator chain for third-party media loads

We do **not** yet have one confirmed captured example showing:

- the third-party media request,
- its Initiator chain,
- the corresponding request headers,
- and referrer/referrer-policy context.

Without that, we know the browser attempted the cross-origin request, but not the exact code path that triggered it.

### 3. Exact scope of connector discovery

We observed repeated `aip/connectors/links/list_accessible`, but we do not yet know whether:

- it is always-on bootstrap behavior,
- feature-gated lazy behavior,
- or repeated only under specific UI states.

## Evidence we still need

## E1. Telemetry payload field maps

Capture one request body schema each for:

- `chatgpt.com/ces/v1/t`
- `chatgpt.com/ces/v1/telemetry/intake?...ddforward=...`
- `ab.chatgpt.com/v1/rgstr?...`

Minimum useful capture:

- request URL
- request method
- request headers field names
- request payload field names / top-level JSON keys
- whether identifiers are stable or rotating

This is enough to classify the lane without requiring full sensitive payload content.

## E2. Third-party media initiator proof

Capture one example of an external media request with:

- URL
- Initiator tab / stack
- Request headers
- Referrer policy
- Timing relative to page render or chat interaction

This would convert the external-media defect from “strongly inferable” to “directly pinned to a render/code path.”

## E3. Connector enumeration trigger condition

Capture a small before/after trace showing:

- baseline load without opening connector features
- transition after entering connector UI or requesting linked content
- count and timing of `list_accessible` calls in each state

This would tell us whether the capability probing is eager by default or feature-driven.

## Current evidence matrix

### Supported now

- External media boundary weakness
- First-party telemetry density concern
- Connector-enumeration concern
- Sentinel/control-plane is real and current browser behavior

### Not yet supported with payload-level precision

- A claim that the `ces` lane definitely includes broad behavioral analytics rather than primarily operational telemetry
- A claim that `ab.chatgpt.com/v1/rgstr` definitely represents a specific experimentation or identity regime beyond probable client registration
- A precise claim that the external media loads were directly caused by one known render path rather than an extension/content-script interaction, absent an Initiator chain

## Recommended evidence-collection order

1. `ces/v1/t` request body field names
2. `telemetry/intake` request body field names
3. `ab.chatgpt.com/v1/rgstr` request body field names
4. one third-party media request with Initiator chain
5. one connector enumeration state-differential capture

This order is chosen because it closes the largest remaining semantic gap first.

## Interim publication posture

Until E1-E3 are collected, the safest language remains:

- **Strong** on external third-party media/browser exposure
- **Strong** on heavy first-party instrumentation / minimization concern
- **Moderate** on eager connector/capability enumeration
- **Careful / non-accusatory** on Sentinel and `/f/conversation` control-plane traffic

## SocioProphet note

This addendum should be read together with the companion defect register. The defect register is sufficient for internal prioritization and publication-draft work. This addendum simply marks the remaining evidence debt required to tighten payload semantics and causality.
