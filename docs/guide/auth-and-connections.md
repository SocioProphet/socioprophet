# Auth and Connections

SocioProphet presents a single platform identity and then manages provider connections as capabilities.

Users do not need to assemble agents, providers, callbacks, keys, and recovery flows manually. They sign into SocioProphet once, then connect providers under that workspace identity.

## Platform sign-in

Platform sign-in is the first layer of identity:

- passkey-first when available
- magic-link fallback
- workspace and role context
- audit-aware identity surface

This is the user's anchor identity. Provider-specific auth does not replace it.

## Provider connections

Providers are represented as capability backends:

- OpenAI / Codex for coding capability
- Anthropic for research capability
- browser automation for login-required browsing
- local runtime for private or offline capability

The user sees connection state, health, and recovery. They do not have to think in terms of scattered credential surfaces.

## Why this matters

The orchestration burden is the product value.

Most users will never successfully assemble:

- multiple providers
- multiple callback flows
- multiple auth states
- degraded fallback behavior

SocioProphet absorbs that complexity and turns it into a governed identity-and-capability surface.
