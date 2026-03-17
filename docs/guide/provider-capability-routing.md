# Provider Capability Routing

Provider connections are not separate product islands. They are capability routes inside one SocioProphet system.

## Capability model

Each provider maps to one or more capabilities:

- coding
- research
- browsing
- local execution
- recovery / fallback

A provider is therefore not just a logo or an API key. It is a capability endpoint with health, scope, and routing semantics.

## Routing principles

Capability routing follows a few public-facing principles:

### One platform identity
The user signs in once to SocioProphet.

### Explicit provider state
Each provider has a visible state:
- not connected
- connecting
- connected
- needs re-auth
- limited capability
- failed test
- revoked

### Graceful degradation
When a capability cannot execute through one provider, the system can route to fallback paths or present the correct recovery action.

### Human-legible explanation
Routing should never feel like unexplained black-box switching. The user should understand what is connected, what is usable, and what requires action.

## Digital surface connection

The `.digital` surface is where provider capability routing becomes visible as part of public-facing trust and identity. Digital trust is not only presentation. It is also the governed connection between identity, capability, and recoverability.
