# Security Policy

## Supported Versions

SocioProphet is maintained as a rolling mainline project. Security fixes are applied to the latest `main` branch and released from there.

| Version | Supported |
| ------- | --------- |
| `main`  | ✅ |
| Legacy snapshots/tags | ❌ |

## Reporting a Vulnerability

Please do **not** open public GitHub issues for suspected vulnerabilities.

Use GitHub's private vulnerability reporting flow instead:
1. Open the repository **Security** tab.
2. Select **Advisories**.
3. Click **Report a vulnerability** and include reproduction details, impact, and any suggested mitigation.

If GitHub private reporting is unavailable for your account context, open a minimal issue asking maintainers for a secure reporting channel without disclosing exploit details.

## Response Expectations

- Initial acknowledgement target: **within 3 business days**.
- Triage decision target: **within 7 business days** when reproducible details are provided.
- Remediation timeline: based on severity and exploitability.

We will coordinate disclosure timing with the reporter whenever possible and credit responsible disclosure unless anonymity is requested.

## Repository Security Practices

This repository is configured to reduce accidental secrets exposure and improve detection:
- Environment files are ignored by default while keeping `.env.example` tracked.
- Dependabot is enabled for dependency update monitoring.
- CodeQL analysis runs in GitHub Actions for JavaScript code scanning.
