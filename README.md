# SocioProphet Public Surfaces + Integration Workspace

This repository currently serves **two different roles** at the same time:

1. **Public surface repo** for the SocioProphet site, docs, and intake/deployment wiring.
2. **Integration workspace** for adjacent AgentOS / Agentplane materials, registries, workspace controllers, and validation glue.

That dual use is real, but it can also be misleading.

The presence of `agentos/`, `agentplane/`, `registry/`, `inventory/`, `workspaces/`, and related scripts does **not** automatically mean this repository is the canonical home for every new control-plane, runtime, or specification artifact. In several places, this repo contains **integration state, staging state, workspace-controller glue, or mirrored structure** rather than the final source of truth for the underlying subsystem.

## What this repo should be treated as first

Treat this repo first as the **public-facing SocioProphet web/docs and integration surface**.

Today that includes, at minimum:

- Firebase-hosted docs output from `docs/.vitepress/dist`
- Firebase-hosted marketing/public surface from `marketing/public`
- server-side intake wiring from `functions/`
- repo-local glue that connects public surfaces to adjacent agentic/runtime work

## What also lives here

This repo also contains embedded work for broader platform integration:

- `agentos/` — AgentOS-adjacent structure and integration artifacts
- `agentplane/` — Agentplane-adjacent structure and execution/validation artifacts staged here
- `registry/` — registry and inventory materials
- `inventory/` — stack inventory / RACI style materials
- `workspaces/` — workspace-controller scaffolding
- `scripts/` — cross-cutting repo-local validation and glue

These directories are important, but their existence here should be read carefully:

- sometimes they are **active integration surfaces**;
- sometimes they are **staging areas**;
- sometimes they are **workspace-controller views across sibling repos**;
- sometimes they are **not the canonical upstream home** for future work.

## Placement rule for future changes

Use this repository when the change is primarily about:

- the public site
- public docs
- intake / deployment wiring
- repo-local integration between surfaces and adjacent subsystems
- workspace-controller glue needed by this repo itself

Do **not** assume this repository is the default home when the change is primarily about:

- core execution substrate
- control-plane runtime behavior
- subsystem-owned schemas / contracts that belong with a sibling runtime repo
- broad doctrine that should become canonical across multiple repos

As a working rule:

- **public/docs/integration for this repo** → belongs here
- **subsystem runtime/control-plane specifics** → should usually live in the subsystem repo
- **shared cross-repo doctrine/specs** → should live in a designated canonical spec/doctrine home once one is established

## Why this clarification matters

Without this distinction, the repo can look more integrated than it actually is. That is especially easy when workspace controllers and staged subsystem directories sit beside active site/docs deployment code.

This README is therefore intentionally explicit:

- this repo is **not just** the website repo;
- this repo is also **not automatically** the canonical home for every AgentOS / Agentplane artifact;
- it is a **public surface repo with embedded integration responsibilities**.

## Quick checks

- Validate the tool registry:
  - `python3 scripts/validate_registry.py registry/agentos-tool-registry.yaml config/base_image_tools.yaml`

- Validate the example agentplane bundle staged in this repo:
  - `python3 agentplane/scripts/validate_bundle.py agentplane/bundles/example-agent/bundle.json`

## Current ambiguity, stated plainly

If a new artifact is being added and we have to ask whether it belongs in the website repo, the Agentplane repo, or a separate doctrine/spec repo, that question should be answered **before** new canonical work is merged.

Until we establish a stricter canonical split, this repo should be read as:

**SocioProphet public surfaces first, integration workspace second, canonical subsystem ownership only where explicitly intended.**
