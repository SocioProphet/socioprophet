# ChatGPT Web Privacy Boundary Defect Register

Date: 2026-04-09
Status: upstream-checked before filing
Owner: SocioProphet research / integration surface

## Summary

This memo records a browser-network privacy assessment of the ChatGPT web client.

The central conclusion is narrower and stronger after checking upstream public reverse-engineering repositories:

1. **Automatic third-party media fetches from within the chat UI remain the strongest privacy defect.**
2. **First-party telemetry and experimentation traffic remains a meaningful minimization concern.**
3. **Connector / capability enumeration remains questionable when eager rather than explicitly user-triggered.**
4. **Sentinel, websocket, and `/backend-api/f/conversation*` traffic should not be treated as primary tracking evidence.** Recent upstream work shows those lanes are part of the current browser control-plane and anti-abuse/session choreography.

This memo intentionally distinguishes **privacy outcome** from **motive attribution**. The evidence supports criticism of the privacy posture. It does **not** support a precise claim of a covert third-party tracker partnership.

## Upstream freshness check

Checked immediately before filing.

Latest representative upstream public repos/commits supporting the current classification:

- `pitiflautico/neobrowser` — `28085db3efe228e48ebcb9cd03aa01bb55573bec`
  - “fix: detect ChatGPT noauth session via Sentinel before sending”
  - https://github.com/pitiflautico/neobrowser/commit/28085db3efe228e48ebcb9cd03aa01bb55573bec
  - Key implication: Sentinel persona (`chatgpt-noauth`) is part of real session/auth state, not incidental noise.

- `pitiflautico/neobrowser` — `01a549d91f26df09e23531004df5cf2ede35ea1d`
  - “feat: add conduit token + Chrome-matching headers to __chatgpt_send”
  - https://github.com/pitiflautico/neobrowser/commit/01a549d91f26df09e23531004df5cf2ede35ea1d
  - Key implication: current browser flow includes `/f/conversation/prepare` and additional client/control headers.

- `pitiflautico/neobrowser` — `e1a4cabc1aac8f79246d172bba676448c1e967ee`
  - “feat: add /finalize endpoint + /f/conversation path (traced from Chrome)”
  - https://github.com/pitiflautico/neobrowser/commit/e1a4cabc1aac8f79246d172bba676448c1e967ee
  - Key implication: public reverse-engineering now models the browser flow as:
    1. `sentinel/chat-requirements/prepare`
    2. `sentinel/chat-requirements/finalize`
    3. `/backend-api/f/conversation/prepare`
    4. `/backend-api/f/conversation`
    5. `sentinel/ping`

- `pitiflautico/neobrowser` — `38073370354de65a8d2c59cd4c59bbaa4a0d6e4f`
  - “fix: remove /ces/ from telemetry skip list + root cause confirmed”
  - https://github.com/pitiflautico/neobrowser/commit/38073370354de65a8d2c59cd4c59bbaa4a0d6e4f
  - Key implication: `ces/*` endpoints are part of the fuller app runtime/telemetry lane and should be analyzed separately from the anti-abuse/session flow.

- `ChatGPTBox-dev/chatGPTBox` — `src/services/apis/chatgpt-web.mjs`
  - https://github.com/ChatGPTBox-dev/chatGPTBox/blob/c236a4b12818e62a4737237beeae171867098854/src/services/apis/chatgpt-web.mjs
  - Key implication: older but still useful public client code already mirrors sentinel requirements, Arkose token handling, proof token generation, cookies/device IDs, websocket registration, and `/backend-api` chat flow.

These sources were used only to classify current browser behavior more accurately. They are not treated as normative implementations.

## Defect register

### D1. External media boundary failure

Severity: **High**

Problem:
The browser was observed attempting direct third-party media fetches from within the ChatGPT page context.

Why this matters:
Even when the resource is “just an image,” the browser contact itself leaks request metadata across origin boundaries. In a sensitive conversation context, that is a privacy-boundary weakness regardless of whether the underlying cause is design choice, embedding rules, or sloppy architecture.

Why this remains the strongest defect after upstream review:
The upstream repos above explain the current session/security/control-plane behavior. They do **not** justify or explain automatic third-party media fetches from a chat surface.

Assessment:
- Strongest user-facing privacy defect
- Most directly supportable from browser behavior
- Highest remediation priority

Recommended product-side remediation:
- Default-deny automatic third-party media loads in chat rendering
- Require explicit click-to-load for third-party media
- Or proxy/cache remote media through a first-party gateway with strict referrer stripping and no direct third-party browser contact

### D2. First-party telemetry / observability overcollection

Severity: **Medium-High**

Representative endpoints observed:
- `chatgpt.com/ces/v1/t`
- `chatgpt.com/ces/v1/telemetry/intake?...ddforward=...`
- `chatgpt.com/ces/statsc/flush`
- `ab.chatgpt.com/v1/rgstr?...`
- `backend-api/lat/r`

Problem:
The browser client appears to emit a high-frequency first-party telemetry / experimentation stream whose minimization and scope are not yet demonstrated.

Why this matters:
This is not the same as direct third-party tracking. It is still a meaningful privacy concern because the client can become an unnecessarily broad internal observability surface.

Upstream adjustment:
Recent upstream corroboration is much stronger for Sentinel and `/f/conversation` than for the exact semantics of `ces` or `rgstr`. Therefore this defect should be framed as a **minimization/governance** concern, not as proof of an external tracker deal.

Recommended product-side remediation:
- Event budget per page state
- Deduplicate bursty or repeated submissions
- Separate operational metrics from UX/behavioral analytics
- Minimize or rotate client/session identifiers
- Document event classes and purpose
- Offer a lower-telemetry mode for sensitive usage

### D3. Eager connector / capability enumeration

Severity: **Medium**

Representative endpoint observed:
- `backend-api/aip/connectors/links/list_accessible`

Problem:
The client appears to probe connector-accessible surfaces more eagerly than ideal.

Why this matters:
Capability enumeration expands the inferred user-context surface even when the user has not explicitly entered a connector feature path.

Recommended remediation:
- Lazy-load connector accessibility only on explicit connector entry/use
- Cache locally to avoid repeated probing
- Keep generic feed/bootstrap routes from enumerating connector surfaces by default

### D4. Sentinel / websocket / `/f/conversation` control-plane

Severity: **Low-to-Moderate privacy concern, High operational significance**

Problem statement:
These requests are noisy and materially increase browser exhaust, but they now appear to be current control-plane/session-security behavior rather than the primary privacy indictment.

Why this classification changed:
Upstream public work now consistently models:
- Sentinel prepare/finalize
- `/backend-api/f/conversation*`
- sentinel persona checks
- continuous sentinel ping
- additional conduit / browser-attestation headers

Therefore these lanes should be treated as:
- anti-abuse
- session integrity
- browser attestation
- conversation routing
- realtime control-plane behavior

This lane should not be over-accused absent stronger proof.

## Accusation boundary

### Supportable now

- The web client exhibits **weak privacy-boundary discipline** through automatic third-party media fetches.
- The web client appears **over-instrumented** on the first-party telemetry/experimentation side.
- The web client may perform **connector capability enumeration** too eagerly.

### Not supportable yet

- A precise claim that OpenAI has an undisclosed commercial third-party tracking deal based solely on the captured requests.
- A precise semantic claim about the payload contents of `ces/v1/t`, `telemetry/intake`, or `ab.chatgpt.com/v1/rgstr` without request-body inspection.

## Evidence still needed

To close the remaining gaps:

1. Capture one request body schema each for:
   - `ces/v1/t`
   - `ces/v1/telemetry/intake`
   - `ab.chatgpt.com/v1/rgstr`

2. Capture one third-party media request with:
   - Initiator chain
   - Request headers
   - Referrer/referrer-policy context

Those two additions would let us distinguish:
- operational metrics,
- experimentation registration,
- behavioral analytics,
- and exact causality for the third-party media loads.

## Mitigation matrix

### Product-side

- Proxy or suppress external media by default
- Minimize telemetry schemas and cadence
- Scope connector discovery to explicit feature entry
- Keep security/control-plane traffic separate from analytics lanes
- Document browser event classes and retention

### Browser-side / user-side

- Keep privacy blockers enabled
- Use dedicated browser containers/profiles for ChatGPT
- Disable nonessential extensions during causal testing
- Inspect Initiator chains for all non-OpenAI requests

## Recommended next actions for SocioProphet

1. Treat **external third-party media leakage** as the first-priority defect.
2. Treat **first-party telemetry minimization** as the second-priority defect.
3. Treat **connector enumeration scope** as the third-priority defect.
4. Explicitly exclude corroborated **Sentinel / `/f/conversation` control-plane** behavior from the accusation set unless later payload evidence changes the picture.

## Proposed publication-grade headline

> ChatGPT web client exhibits weak privacy-boundary discipline through automatic third-party media fetches, high-frequency first-party telemetry emission, and potentially over-eager capability enumeration, while its Sentinel and `/f/conversation` traffic appears to be current anti-abuse/session control-plane rather than standalone tracking evidence.
