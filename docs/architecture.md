# Architecture Overview

SocioProphet is structured around three principles:

1. Client-visible configuration is public by design.
2. Datastore access is deny-by-default.
3. Security invariants are test-backed.

---

## System Components

### 1. Web Client (`socioprophet-web/client`)
- Webpack-built frontend
- Loads Firebase configuration at runtime from `public/firebase-config.js`
- Does not embed environment variables into build artifacts

### 2. Firestore
- Rules-as-code (`socioprophet-web/firestore.rules`)
- Deny-by-default policy
- Explicit allow rules only (when backed by tests)
- Emulator-backed tests enforce invariants

### 3. CI Guardrails
- Gitleaks scanning in CI
- Firestore emulator rules tests in CI
- CodeQL static analysis

---

## Runtime Configuration Model

Instead of injecting environment variables into the bundle, the client loads a runtime config file:

- `socioprophet-web/client/public/firebase-config.js`

This file defines:

- `window.__FIREBASE_CONFIG__`

This prevents:
- Build-time secret taint
- CodeQL build-artifact leak alerts
- Accidental secret bundling

---

## Security Flow

Developer → Git → CI → Emulator Tests → Merge → Deploy

Rules changes cannot merge unless:
- emulator rules tests pass
- secret scanning passes
- CodeQL passes (no new alerts)

---

## Knowledge Commons Direction

This repository currently contains:
- Web interface scaffolding
- Security enforcement primitives
- Configuration discipline

Planned layers (as the system stabilizes):
- Knowledge graph / datastore abstraction
- Interoperable export formats
- Provenance and attribution
- Local-first sync and federation model
- Governance and contribution crediting

This document will evolve as the architecture hardens.
