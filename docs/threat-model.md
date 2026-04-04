# Threat Model

This document captures baseline risks, trust boundaries, and security invariants for SocioProphet.

---

## Trust boundaries

- The browser is untrusted.
- Firestore rules are the authoritative access control boundary for client-originated reads/writes.
- CI is the merge gate that prevents policy regression.
- Production deploy is assumed hostile-by-default until proven otherwise.

---

## Primary risks and controls

### 1) Secret leakage
Risk:
- Secrets committed to git.
- Build-time environment variables embedded into client artifacts.

Controls:
- Secret scanning in CI (gitleaks/other scanners).
- Runtime public config pattern (`public/firebase-config.js`) instead of env injection.
- `.gitignore` rules that keep local config untracked.

---

### 2) Over-permissive Firestore rules
Risk:
- Public read/write exposure.
- Rule drift over time.
- “Temporary allow-all” becoming permanent.

Controls:
- Deny-by-default as the baseline.
- Explicit allow rules only when backed by tests.
- Emulator-backed rules tests running locally and in CI.
- Small, reviewable changes to rules.

---

### 3) CI bypass / unsafe merges
Risk:
- Direct pushes to protected branch.
- Merging without security checks.

Controls:
- Branch protection with required status checks.
- CI workflows for secret scanning and rules tests.
- Minimal, auditable workflows stored in-repo.

---

### 4) Privilege escalation via mutable fields
Risk:
- Changing ownership fields to hijack records.
- Mutating fields that must be immutable.

Controls:
- Immutable-field constraints in Firestore rules when collections are introduced.
- Owner-based checks (`request.auth.uid`) where applicable.
- Tests that prove the invariants.

---

## Security invariants

1. Default deny everywhere unless explicitly opened.
2. No secrets in git history or build artifacts.
3. All datastore expansions must be test-backed.
4. Public config is intentionally public and loaded at runtime.
