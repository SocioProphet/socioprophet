# Worked Example: Michael Cross-Context

This page expands the Michael example into a technical walkthrough.

## Actor

Michael appears in multiple contexts:

- patient
- parent
- learner
- citizen
- digital participant

## Context classes

Let:

$$
\mathcal{S} = \{\mathrm{medical},\ \mathrm{parent},\ \mathrm{academy},\ \mathrm{citizen},\ \mathrm{adtech}\}
$$

## Evidence

Assume the system sees:
- overlapping identifiers
- repeated household references
- common device/session traces
- time-adjacent institution events
- messaging and provider-connection actions

A conventional stack would likely maximize confidence and compress these into one profile.

## Policy gate

We define a context-block policy:

$$
B(\mathrm{medical}, \mathrm{adtech}) = 1
$$

and more generally:

$$
B(c_i, c_j) = 1 \Rightarrow M_{ij} = 0
$$

for any context pair whose merger would create prohibited downstream use.

## Result

The system may:
- acknowledge the same human reference
- preserve candidate relationships
- permit safe continuity where context allows it

The system must not:
- leak patient context into ad-tech
- collapse protected family/learner context into unrestricted operator state
- pretend that evidence outranks policy

## Proof artifact

A proof artifact for an export should be able to say:

- which evidence was used
- which contexts were retained
- which contexts were suppressed
- which merge edges were blocked
- which policy rule caused the block

That is the point of the system: not only to infer, but to prove what was *not* allowed.
