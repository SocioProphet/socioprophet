# .github Directory

## Purpose
This directory houses repository automation and metadata that GitHub consumes. It is intentionally small and keeps configuration that should not live in application code.

## Contents
- `dependabot.yml` – Configuration for Dependabot updates (dependency version checks, update cadence, and ecosystem selection).
- `workflows/codeql-analysis.yml` – CodeQL code-scanning workflow for JavaScript/TypeScript, plus guarded Python dynamic analysis that is skipped when no Python source files exist.
- `workflows/gitleaks.yml` – Secret scanning workflow (`gitleaks/scan`) for push and pull request events.

## Notes
- Changes here impact automation behavior rather than runtime behavior.
- Avoid placing app-specific documentation or source files in this directory.
- Security workflows target self-hosted Fedora/CoreOS runner labels: `self-hosted`, `linux`, `x64`, `fedora`, `coreos`.
