# .github Directory

## Purpose
This directory houses repository automation and metadata that GitHub consumes. It is intentionally small and keeps configuration that should not live in application code.

## Contents
- `dependabot.yml` – Configuration for Dependabot updates (dependency version checks, update cadence, and ecosystem selection).
- `workflows/codeql-analysis.yml` – CodeQL code-scanning workflow for JavaScript.

## Notes
- Changes here impact automation behavior rather than runtime behavior.
- Avoid placing app-specific documentation or source files in this directory.
