# Transparency Log v1

This specification defines the product-facing transparency log for consequential SocioProphet events.
It focuses on visible product behavior, not generic infrastructure logging.

## Event classes

Representative event classes include:

- publication accepted
- publication denied
- moderation action applied
- governance rule adopted
- governance rule revised
- institutional review opened
- institutional review concluded
- evidence bundle published
- replay request fulfilled

## Entry fields

Each entry should include:

- event identifier
- event class
- timestamp
- actor or producing system
- scope or affected surface
- subject reference
- evidence pointer or bundle reference when applicable
- policy reference when applicable
- prior event linkage when this is a revision or follow-on event

## Query and export expectations

The transparency surface should support:

- filtering by event class
- filtering by subject
- filtering by actor or producing system
- retrieval of event-linked evidence pointers
- export of product-visible event history for review and audit

## Inclusion and consistency expectations

The product log should preserve durable event ordering and should not silently delete consequential entries.
Where log redaction is necessary for privacy or policy reasons, the redaction itself should be visible as an event class.
