# Architecture

This page is the manual map for the public SocioProphet architecture.

SocioProphet is a governed operational intelligence system built for institutions, operators, learners, and builders. The public architecture is organized around bounded execution, deterministic safety claims, proof-bearing workflows, and explicit separation between public-safe documentation and restricted operational detail.

## 1. Core architectural thesis

The platform is organized around a few core claims:

- intelligence must be governed
- important transitions must be attributable
- consequential actions must produce evidence
- reversibility is a design property, not an afterthought
- institutional deployment requires explicit safeguards and review boundaries
- public documentation must explain the architecture honestly without disclosing restricted tactical internals

This is not a chat-first architecture. It is a controlled systems architecture.

Across all layers, the platform uses a shared cross-lane artifact canon that connects runtime artifacts, knowledge artifacts, Entity Analytics proof artifacts, Capability Fabric receipts, and public-safe product evidence into one governed evidence model.

Primary reference:
- [Cross-Lane Artifact Canon](/guide/cross-lane-artifact-canon)

## 2. Primary layers

### Organizations and institutional deployment

Organizations is the institutional umbrella surface. It is where public-sector, nonprofit, educational, sovereign, and mission-aligned deployments are framed.

Key references:
- [Organizations Governance and Institutional Safety](/guide/organizations-governance-and-institutional-safety)
- [Platform Human Protection and Safeguarding](/guide/platform-human-protection-and-safeguarding)
- [Public vs Restricted Security Boundary](/guide/public-vs-restricted-security-boundary)

### Governed AI and cybernetics

This layer explains how bounded execution, human oversight, and proof-bearing control loops are organized.

Key references:
- [Governed AI and Cybernetics](/guide/governed-ai-and-cybernetics)
- [Deterministic AI and Mathematical Safety](/guide/deterministic-ai-and-mathematical-safety)
- [Provenance, Promotion, and Reversibility](/guide/provenance-promotion-and-reversibility)
- [Cross-Lane Artifact Canon](/guide/cross-lane-artifact-canon)

### Agent plane and operator workflows

This layer describes operator roles, workflow states, capability routing, review, and bounded execution.

Key references:
- [Agent Plane and Operator Workflows](/guide/agent-plane-and-operator-workflows)
- [Auth and Connections](/guide/auth-and-connections)
- [Provider Capability Routing](/guide/provider-capability-routing)
- [Provider Safety and Capability Eligibility](/guide/provider-safety-and-capability-eligibility)
- [Auth Recovery and Connection Health](/guide/auth-recovery-and-connection-health)
- [Cross-Lane Artifact Canon](/guide/cross-lane-artifact-canon)

### Entity Analytics

Entity Analytics is the governed identity, event, graph, merge, and proof subsystem.

Key references:
- [Entity Analytics Reference](/guide/entity-analytics-reference)
- [Worked Example: Michael Cross-Context](/guide/worked-example-michael-cross-context)
- [Entity Analytics Overview](/guide/entity-analytics-overview)
- [Identity Prime and Event-IR](/guide/identity-prime-and-event-ir)
- [Entity Graph and Safe Linkage](/guide/entity-graph-and-safe-linkage)
- [Policy-Constrained Merging and Unmerge](/guide/policy-constrained-merging-and-unmerge)
- [Marketer-Safe Outputs and Segment Proofs](/guide/marketer-safe-outputs-and-segment-proofs)
- [Cross-Lane Artifact Canon](/guide/cross-lane-artifact-canon)

### Authorized cyberdefense and simulation

This layer is public-safe and defense-first. It covers defensive validation, simulation boundaries, evidence, and institutional review posture.

Key references:
- [Authorized Cyberdefense and Simulation](/guide/authorized-cyberdefense-and-simulation)
- [Boundary-Centric Cyber Hypergraph](/guide/boundary-centric-cyber-hypergraph)
- [Public vs Restricted Security Boundary](/guide/public-vs-restricted-security-boundary)

## 3. Learning and theory layer

SocioProphet also includes a learning, theory, and semantic-model layer. This is where the system’s representational logic, topic organization, and curriculum-facing structure are documented.

Key references:
- [Operating Modes: Learning and Defense](/guide/operating-modes-learning-and-defense)
- [23-Topic Canon](/guide/twenty-three-topic-canon)
- [Governed Cybernetic Stack](/guide/governed-cybernetic-stack)
- [Semantic Vector Stack](/guide/semantic-vector-stack)
- [Semantic Representation Ladder](/guide/semantic-representation-ladder)
- [LSA / LSI / LDA Geometry](/guide/lsa-lsi-lda-geometry)
- [Semantic Model Workstreams](/guide/semantic-model-workstreams)
- [Hybrid Representation Builder](/guide/hybrid-representation-builder)
- [Temporal Graph Evolution](/guide/temporal-graph-evolution)

## 4. Product and surface layer

The public site exposes multiple surfaces, but they are not all equivalent. Some are institutional, some are learning-oriented, and some are domain or product extensions.

Key references:
- [Products Overview](/guide/products/overview)
- [Product Surface Standard](/guide/product-surface-standard)
- [Product Surface Maturity Matrix](/guide/product-surface-maturity-matrix)
- [Domain Surface](/guide/domain-surface)
- [Digital Trust and Capability Routing](/guide/digital-trust-and-capability-routing)
- [Academy Policy Index](/guide/academy-policy-index)

## 5. Boundary-first model

One of the key public-safe architectural ideas is that the boundary is the unit of truth.

The system models crossings through explicit structures such as:

- component
- port
- contract
- boundary event
- evidence
- expectation
- finding
- artifact

This keeps the architecture explainable at the point where action, policy, and observation meet.

Primary reference:
- [Boundary-Centric Cyber Hypergraph](/guide/boundary-centric-cyber-hypergraph)

## 6. Deterministic and bounded posture

SocioProphet presents itself publicly as deterministic AI because it is built around bounded execution, measurable safety, and proof-bearing transitions rather than ambient improvisation.

Primary references:
- [Deterministic AI and Mathematical Safety](/guide/deterministic-ai-and-mathematical-safety)
- [Governed AI and Cybernetics](/guide/governed-ai-and-cybernetics)
- [Provenance, Promotion, and Reversibility](/guide/provenance-promotion-and-reversibility)
- [Cross-Lane Artifact Canon](/guide/cross-lane-artifact-canon)

## 7. Public-safe versus restricted material

The public docs explain the architecture, the control model, the safety posture, the governance boundary, and the evidence model.

The public docs do not contain restricted tactical internals such as:

- sensitive operator kits
- high-fidelity adversary simulation mechanics
- exact detection thresholds
- exploit or persistence workflows
- privileged runbooks
- misuse-enabling tradecraft

Primary reference:
- [Public vs Restricted Security Boundary](/guide/public-vs-restricted-security-boundary)

## 8. Reading paths

### Executive and institutional path
- [Getting Started](/guide/getting-started)
- [Organizations Governance and Institutional Safety](/guide/organizations-governance-and-institutional-safety)
- [Deterministic AI and Mathematical Safety](/guide/deterministic-ai-and-mathematical-safety)
- [Authorized Cyberdefense and Simulation](/guide/authorized-cyberdefense-and-simulation)
- [Cross-Lane Artifact Canon](/guide/cross-lane-artifact-canon)

### Operator and security path
- [Governed AI and Cybernetics](/guide/governed-ai-and-cybernetics)
- [Agent Plane and Operator Workflows](/guide/agent-plane-and-operator-workflows)
- [Boundary-Centric Cyber Hypergraph](/guide/boundary-centric-cyber-hypergraph)
- [Entity Analytics Reference](/guide/entity-analytics-reference)
- [Cross-Lane Artifact Canon](/guide/cross-lane-artifact-canon)

### Builder and researcher path
- [Semantic Vector Stack](/guide/semantic-vector-stack)
- [Hybrid Representation Builder](/guide/hybrid-representation-builder)
- [Operating Modes: Learning and Defense](/guide/operating-modes-learning-and-defense)
- [23-Topic Canon](/guide/twenty-three-topic-canon)
- [Cross-Lane Artifact Canon](/guide/cross-lane-artifact-canon)

## 9. Use this page

Use this page as the architecture map.

Use the sidebar to move into the layer that matches the question at hand:
- institutional deployment
- governed execution
- agent operations
- analytics and evidence
- defense and validation
- learning and theory
- product surfaces
