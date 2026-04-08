# Sociosphere Ecosystem (AgentOS + Agentplane)

This repo is a **single work product** that unifies:

- **AgentOS**: a *layered* agent stack definition (interfaces, policies, tool registry, Linux integration runbook).
- **Agentplane**: a *fleet-shaped control plane* for reproducible execution (bundles → validate → place → run → evidence → replay).

The intended result is a coherent “agent platform” where:

- the **AgentOS tool registry** is the compliance + inventory source of truth
- **agentplane bundles** become the unit of deployment/execution across your executor fleet
- **AIWG artifacts** (system-of-record) and **agentplane evidence artifacts** (validation/placement/run) reconcile into one auditable trail

## Layout

- `agentos/` — AgentOS skeleton (interfaces, policy, integration runbook).
- `agentplane/` — agentplane repo (Nix flake, bundle schema, runner scripts).
- `registry/` — canonical tool registry (YAML + CSV).
- `inventory/` — stack inventory + RACI (spreadsheet).
- `workspaces/` — workspace controllers (socio-linux + socioprophet) as Nix-first stubs.
- `scripts/` — cross-cutting validation glue.

## Quick checks

- Validate the tool registry:
  - `python3 scripts/validate_registry.py registry/agentos-tool-registry.yaml config/base_image_tools.yaml`

- Validate the example agentplane bundle:
  - `python3 agentplane/scripts/validate_bundle.py agentplane/bundles/example-agent/bundle.json`

## Why this split exists

**Gastown/AIWG/OpenCode/etc.** are *agentic* runtime pieces.

**agentplane** is *system-space orchestration* — it answers: “Where does this run, under what constraints, and where is the evidence?”

They are complementary, not redundant.
