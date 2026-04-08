# Guardian Consent and Minor Access Model

SocioProphet uses a conservative minor-access model.

Legal requirements vary by jurisdiction, but the product default is simple: minors receive more protection, not less.

## Participation classes

### Adult / independent participant
Full self-managed account and connection flow, subject to role and policy.

### Guardian-linked minor participant
Minor participation is tied to a guardian or authorized institutional sponsor.

### Institution-governed minor participant
Minor participation may be mediated through an approved program, school, or supervised learning setting, but still remains more restricted than ordinary adult use.

## Capability classes

SocioProphet separates capabilities into classes:

- learning and reading
- collaboration and messaging
- provider connections
- automation and browsing
- local runtime / execution
- elevated or sensitive domains

## Default access model

| Capability class | Adult | Guardian-linked minor | Institution-governed minor |
| --- | --- | --- | --- |
| Learning / reading | Allowed | Allowed | Allowed |
| Collaboration / messaging | Allowed | Conditional | Conditional |
| Provider self-connection | Allowed | Restricted | Restricted |
| Browser automation | Allowed | Restricted | Restricted |
| Local runtime / execution | Allowed | Restricted | Restricted |
| Sensitive / elevated domains | Conditional | Restricted | Conditional |

## Product rule

Minors do not self-assemble high-risk provider or runtime capability by default.

Guardian and institutional controls are not an afterthought. They are part of the default operating model.

## Required platform behaviors

The platform must support:

- guardian-linked visibility
- explicit consent checkpoints
- capability restrictions by participant class
- incident reporting and escalation
- recoverable auth and connection flows that do not bypass supervision
