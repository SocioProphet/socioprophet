# MeshRush Omni

This page explains Omni as the exploratory diffusion and reduction layer inside MeshRush.

MeshRush is the graph-operating runtime for agents acting over graph views derived from a richer hypergraph world model. Within MeshRush, Omni is the layer that lets an agent move through a graph view in a grounded, bounded, and reviewable way before any compiled artifact exists.

## 1. What Omni does

Omni is responsible for controlled exploratory motion over a graph-derived runtime surface.

It is the layer that:

- starts from a grounded local context
- expands through a graph view without detaching from provenance
- maintains an active frontier
- reduces local structure while exploring
- surfaces candidate stop conditions
- produces evidence for replay, evaluation, and later compilation

Omni does **not** confer final artifact status.
It prepares candidate bounded structure for Crystal.

## 2. Why Omni exists

Agents working over graph-structured state need more than raw traversal.

Without a disciplined exploration layer, they either:

- stay too local and fail to discover meaningful structure, or
- diffuse indefinitely and fail to converge into reusable local knowledge

Omni exists to solve that tension.

## 3. Runtime posture

Omni is not a global crawler and not an all-graph sweep.
It is a local-first diffusion layer.

Its runtime posture is:

- anchored rather than free-floating
- exploratory rather than declarative
- reversible rather than absolute
- reducing while moving rather than only after the fact
- stop-aware rather than endless

## 4. Main runtime concepts

### Graph view
A graph-derived runtime surface suitable for navigation and bounded local reasoning.

### Grounding state
The local context that explains where the agent is operating and what current graph view is authoritative.

### Frontier
The active edge between explored and not-yet-explored local structure.

### Reduction surface
The compressed or summarized local picture maintained during diffusion.

### Stop candidate
A signal that continued diffusion may no longer be worth its cost.

### Probe family
A bounded set of interventions or measurements used to test local behavior while exploring.

## 5. Stop-surface categories

Omni should be able to emit at least the following kinds of stop candidates:

- frontier exhaustion
- signal saturation
- coherence concentration
- budget exhaustion
- policy-directed pause

Omni may emit these signals.
Crystal decides whether they justify bounded compilation.

## 6. Relationship to Crystal

The MeshRush dual is simple:

- **Omni explores**
- **Crystal stops and compiles**

Omni may say that a local region appears bounded, coherent, and worth review.
Crystal may then decide whether that candidate deserves compiled status.

## 7. Integration surfaces

Omni produces outputs useful to the wider system, including:

- exploration traces
- frontier state
- stop candidates
- candidate bounded regions
- probe outputs
- evidence surfaces

Those outputs can be consumed by:

- MeshRush Core
- MeshRush Crystal
- Sociosphere
- agentplane
- Alexandrian Academy

## 8. Why Omni matters publicly

Omni is one of the reasons MeshRush is not just a traversal utility.
It gives public shape to the idea that graph-native agents need disciplined exploration before they can act in a bounded and reviewable way.

That is a runtime idea, not just a mathematical one.
