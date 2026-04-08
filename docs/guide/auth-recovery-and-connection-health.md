# Auth Recovery and Connection Health

Real auth flows fail. The product must make those failures survivable.

## Recovery states

SocioProphet treats auth and provider failures as explicit states rather than generic errors.

Common states include:

- callback capture failure
- expired auth
- insufficient scopes
- limited capability
- revoked token
- unavailable browser session
- local runtime not installed

## Recovery patterns

The recovery UX includes:

- re-auth
- alternate auth method
- paste callback URL
- reconnect provider
- manage scopes
- install local runtime
- review capability health

## Why recovery is first-class

Browser/OAuth and provider flows are messy in the real world. A platform that hides this mess without giving users recovery paths becomes brittle. SocioProphet instead turns auth failure into a managed workflow.

## Public website role

The public website surfaces this reality through `/auth/`, `/auth/sign-in/`, `/auth/connections/`, and `/auth/recovery/`.

The website is not merely describing a sign-in page. It is describing the product contract:
- one SocioProphet login
- providers as capabilities
- graceful recovery when auth gets weird
