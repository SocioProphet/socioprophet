# Security Policy

## Supported Versions

SocioProphet is maintained as a rolling mainline project. Security fixes are applied to the latest `main` branch and released from there.

| Version | Supported |
| ------- | --------- |
| `main`  | ✅ |
| Legacy snapshots/tags | ❌ |

## Reporting a Vulnerability

Please do **not** open public GitHub issues for suspected vulnerabilities.

Instead, report privately by emailing: **security@socioprophet.com** with:
- A clear description of the issue and affected component(s).
- Reproduction steps or proof-of-concept details.
- Impact assessment (confidentiality, integrity, availability).
- Any suggested mitigation.

## Response Expectations

- Initial acknowledgement: **within 3 business days**.
- Triage decision: **within 7 business days** when reproducible details are provided.
- Remediation timeline: based on severity and exploitability.

We will coordinate disclosure timing with the reporter whenever possible and credit responsible disclosure unless anonymity is requested.

## Repository Security Practices

This repository is configured to reduce accidental secrets exposure and improve detection:
- Environment files are ignored by default while keeping `.env.example` tracked.
- Dependabot is enabled for dependency update monitoring.
- CodeQL analysis runs in GitHub Actions for JavaScript/TypeScript code scanning.
