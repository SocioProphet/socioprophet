# Provider Safety and Capability Eligibility

Provider connections are not only technical integrations. They are trust boundaries.

## Capability states

Providers can occupy explicit states such as:

- not connected
- connecting
- connected
- needs re-auth
- limited capability
- failed test
- revoked

## Eligibility rule

Not every actor and not every surface must be allowed to attach every capability.

## Safety examples

### Provider self-connection
Adult self-managed accounts may connect providers directly.

Minor or supervised accounts require stronger constraints.

### Browser automation
Browser-driven login and capability recovery may require additional human oversight because the auth boundary is more fragile and more privacy-sensitive.

### Local runtime
Local runtime may be appropriate for private or offline work, but it is not a default capability for every participant class.

### Elevated domains
Medical, legal, and other elevated domains require stricter role, trust, and explanation controls.

## Product consequence

The public site and product docs must describe not only what providers exist, but which capability classes are appropriate for which users and surfaces.
