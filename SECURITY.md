# Security Policy

Security is foundational to the SocioProphet knowledge commons.

## Reporting a vulnerability

Do not open public issues for security bugs.

Use:
- GitHub Security Advisories (preferred)
- security@socioprophet.ai

Include:
- Affected file/component
- Reproduction steps
- Impact description
- Environment details

## Security invariants

1. No secrets in git.
2. Firestore rules are deny-by-default.
3. Rule changes require emulator-backed tests.
4. Least privilege is enforced everywhere.
