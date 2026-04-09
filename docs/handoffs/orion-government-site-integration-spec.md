# Orion Field Intelligence → Government / Public Sector Site Integration Spec

## Objective

Integrate **Orion Field Intelligence** into the SocioProphet site as a concrete capability inside the **Organizations → Government / Public Sector** surface.

This should not become generic defense-tech marketing. The integration must preserve the site’s existing institutional posture:

- governed AI
- bounded execution
- evidence-bearing workflows
- explicit public-safe vs restricted boundary
- human oversight and reversibility
- readiness, continuity, and doctrine transfer

Orion should make that institutional surface more concrete by providing a mission-facing operational example: field reasoning under uncertainty.

## Source-truth summary for Orion

Canonical name in source:

- **Orion Field Intelligence Framework (OFIF)**

Canonical short description:

- **Event-driven sensor fusion and reasoning for field operations**

Current source repo:

- `mdheller/orion-field-intelligence` (private)

Current implementation surface already visible in source:

- typed JSON Schema contracts
- validated examples
- ontology modules
- local validator
- CI validation
- scrub-scan gate

Core domain concepts already present:

- fog-of-war state
- confidence summary, decay, coverage, and staleness
- knowledge gaps
- contradictions
- integrity risk
- scouting task
- refresh cadence
- adversary considerations
- legitimacy considerations
- assets / comms / environment / operations / adversary-control ontology modules

Public-facing interpretation:

Orion is a governed operational reasoning layer that structures uncertainty, surfaces contradictions, tracks freshness and degradation, and issues bounded collection / refresh guidance under integrity and legitimacy constraints.

## Current website state

### Important finding on `master`

On `master`, the file at:

- `marketing/public/organizations/government-public-sector/index.html`

is effectively duplicating the general Organizations page rather than serving as a distinct Government / Public Sector page.

### Correct baseline already exists

There is already a better implementation baseline on:

- `feat/org-gov-page-and-segmentation`

That branch contains the real segmented Government / Public Sector page with the correct institutional framing:

- readiness
- continuity
- secure learning
- institutional memory
- bounded workflows
- public-safe vs restricted boundary
- evidence / reversibility / oversight

This branch should be treated as the implementation base.

## Primary decision

**Orion belongs on the Government / Public Sector page, not as the hero of Organizations.**

Reasoning:

- Organizations is the umbrella institutional surface.
- Government / Public Sector is the correct mission-specific surface.
- Orion is operationally concrete and field-facing.
- It should appear as a capability module inside Government / Public Sector, not as a competing top-level brand.

### Placement rule

- Do **not** replace the main Organizations hero with Orion.
- Do **not** lead the whole Organizations page with Orion branding.
- Do **add** Orion as the first major capability section on Government / Public Sector.
- Do **reference Orion lightly** from the Organizations page as a segment-level signal for the public-sector card.

## Patch targets

Required files:

1. `marketing/public/organizations/government-public-sector/index.html`
2. `marketing/public/organizations/index.html`

Recommended branch strategy:

- continue from `feat/org-gov-page-and-segmentation`
- layer Orion integration onto that work
- then merge onward

## Government / Public Sector page integration

### Page order

Recommended order:

1. Government / Public Sector hero
2. **Orion Field Intelligence module**
3. Mission readiness and continuity cards
4. Public proof / restricted operations section
5. Intake path

### New section placement

Insert a new full-width section **immediately after the hero** and before the current six-card mission grid.

### Section title

**Orion Field Intelligence**

### Section subtitle

**Event-driven sensor fusion and reasoning for field operations**

### Section body copy

Proposed copy:

> Orion turns fragmented field observations into time-stamped fog-of-war states. It tracks confidence decay, freshness, and source coverage; surfaces material knowledge gaps and contradictions; and issues bounded scouting and refresh policies in response to integrity alarms, degraded links, custody breaks, and changing mission conditions. By joining assets, communications, environment, adversary controls, and mission tasks into one typed operational frame, Orion helps organizations reason under uncertainty without collapsing reviewability, legitimacy, or control.

### Tone requirements

This must read as:

- institutional
- disciplined
- governed
- evidence-oriented
- bounded

It must **not** read as:

- hypey defense marketing
- covert / surveillance branding
- tactical tradecraft exposition
- autonomous-agent bravado

### Orion capability cards

Add a 2x3 capability grid below the intro.

#### Card 1

**Fog-of-war state estimation**

Time-stamped uncertainty states over an entity, area, network, or operation with explicit confidence, coverage, decay, and staleness semantics.

#### Card 2

**Gap and contradiction management**

Named knowledge gaps and explicit contradictions tied to decision impact, evidence references, and recommended collection paths.

#### Card 3

**Refresh and degradation policy**

Refresh cadences that respond to contradictions, degraded links, custody breaks, and integrity alarms with bounded downgrade, stale-marking, suspension, or verification actions.

#### Card 4

**Legitimacy-aware scouting**

Scouting tasks that reduce uncertainty while keeping collection posture constrained, reviewable, and sensitive to community and mission legitimacy concerns.

#### Card 5

**Integrity and anti-deception controls**

Structured handling of spoofing, replay, tamper, jamming, poisoning, and related attacks, paired with signing, attestation, replay detection, lineage governance, and rollback control concepts.

#### Card 6

**Multi-plane mission context**

A shared operational model spanning assets, communications, environment, teams, missions, zones, and decision support surfaces.

### Proof strip

Below the capability cards, add a compact proof strip or chip row.

Suggested labels:

- Typed contracts
- Validated examples
- Ontology-backed semantics
- CI-enforced checks
- Integrity-aware refresh policies
- Reviewable bounded workflows

### Public-safe constraint note

Add a small inset at the bottom of the Orion section.

Suggested copy:

> Orion is not an ambient-autonomy or unrestricted surveillance surface. It is a governed framework for structuring uncertainty, planning bounded collection, tracking integrity and legitimacy risk, and keeping field reasoning reviewable.

### CTA row for Orion

Add 2–3 CTAs below the Orion section.

Recommended CTAs:

1. **Request government and public-sector intake** → `/organizations/#orgForm`
2. **Review public-safe boundary** → `/documentation/guide/public-vs-restricted-security-boundary/`
3. **Review architecture** → `/documentation/guide/architecture/`

Do **not** link publicly to the private Orion repo.

## Government / Public Sector graph update

Update the D3 graph on the Government / Public Sector page.

### Add node

- **Orion**
- note: `field reasoning`

### Recommended edges

Primary:

- Gov / Public → Orion
- Orion → Readiness
- Orion → Agent Plane
- Orion → Boundary
- Orion → Continuity

Secondary:

- Orion → Governance
- Orion → Secure Learning (optional)

Visual intent:

Orion should appear as a concrete operational node bridging mission-facing uncertainty, bounded workflow execution, and public-safe boundary discipline. It should not overpower the root Government / Public node.

## Organizations page integration

### Keep Organizations as umbrella surface

The Organizations page should remain the umbrella institutional page.

### Update Public Sector / Sovereign Systems card

Current card is too generic. Update it so it points toward the real Government / Public Sector page and lightly signals Orion.

Recommended card title:

**Public Sector & Sovereign Systems**

Recommended body copy:

Support readiness, continuity, secure learning, and governed public-service operations. Includes mission-facing field reasoning through Orion Field Intelligence within a public-safe, bounded operational perimeter.

Recommended CTA treatment:

- make the full card clickable to `/organizations/government-public-sector/`

or

- add a small inline link: `Explore government and public sector →`

Prefer the full-card click if consistent with current page patterns.

### Organizations graph

No mandatory Orion node is required on the main Organizations graph.

Preferred approach:

- leave the umbrella graph high-level
- keep Orion-specific graphing to Government / Public Sector

## Content boundaries

### Public-safe content allowed

The site may say that Orion supports:

- fog-of-war state modeling
- knowledge gaps and contradictions
- refresh and degradation policy
- integrity-aware collection posture
- legitimacy-aware scouting
- bounded workflows
- evidence-bearing field reasoning
- mission readiness and continuity

### Content that must stay out of the public layer

Do not publish:

- tactical thresholds
- operator kits
- exact restricted procedures
- sensitive collection tactics
- exploit / intrusion detail
- misuse-enabling playbooks
- sensitive adversary-handling mechanics
- concrete restricted response thresholds

## Design / implementation notes

Stay inside the existing static marketing HTML + Tailwind pattern.

Reuse the current site grammar:

- rounded-2xl cards
- white cards on slate-50 background
- compact uppercase eyebrow labels
- clear CTA hierarchy
- shadow-sm and border-slate-200

The Orion section should be a distinct full-width block above the current mission-card grid, composed of:

- intro
- capability cards
- proof strip
- public-safe note
- CTA row

Preferred vocabulary:

- governed
- bounded
- evidence-bearing
- reviewable
- integrity-aware
- readiness
- continuity
- mission context
- public-safe boundary

Avoid:

- edgy operator jargon
- warfighter hype
- “AI battlespace” language
- generic surveillance branding

## Analytics suggestions

Follow the existing `spTrack(...)` pattern.

Suggested event names:

- `gov_orion_intake_click`
- `gov_orion_boundary_click`
- `gov_orion_architecture_click`
- `org_gov_orion_segment_click`

## Acceptance criteria

The patch is complete when all of the following are true:

1. Government / Public Sector no longer duplicates the general Organizations page on the active shipping branch.
2. Orion appears as a concrete capability module on Government / Public Sector.
3. Orion copy reflects source semantics:
   - fog-of-war
   - gaps / contradictions
   - refresh / degradation policy
   - integrity risk
   - legitimacy-aware scouting
   - multi-plane operational context
4. Orion is not positioned as unrestricted autonomy or surveillance.
5. Organizations remains the umbrella institutional surface.
6. The Public Sector / Sovereign Systems card routes into Government / Public Sector and lightly signals Orion.
7. No public link exposes the private Orion repo.
8. Public-safe vs restricted boundary language remains intact and visible.
9. CTA tracking events are added for Orion-specific actions if new CTAs are introduced.
10. Visual treatment remains consistent with the existing site grammar.

## Recommended implementation order

### Step 1

Use `feat/org-gov-page-and-segmentation` as the starting point for Government / Public Sector, not the duplicated `master` page.

### Step 2

Patch:

- `marketing/public/organizations/government-public-sector/index.html`

Add the new Orion section directly below the hero.

### Step 3

Patch:

- `marketing/public/organizations/index.html`

Update the Public Sector / Sovereign Systems card to route to Government / Public Sector and mention Orion lightly.

### Step 4

Update the Government / Public Sector D3 graph to add the Orion node and relevant edges.

### Step 5

QA boundary language and CTA tracking.

## Handoff note to website agent

Work from the segmented Government / Public Sector branch/file, not the duplicated `master` page.

Treat Orion as a governed operational capability module, not a replacement brand for the umbrella Organizations surface.

The integration should communicate:

- field reasoning under uncertainty
- bounded collection and refresh policy
- integrity-aware operational logic
- legitimacy-aware collection posture
- mission readiness and continuity
- public proof with restricted operations kept out of the public layer

If copy feels like surveillance marketing or tactical hype, it is wrong.

If copy feels like governed institutional capability under constraint, it is on target.
