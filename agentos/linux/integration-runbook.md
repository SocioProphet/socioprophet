# Linux Integration Runbook (Order of Operations)

## Phase 0 — Governance gates (must exist before shipping anything)
1) Tool Registry becomes the single inventory (YAML/CSV).
2) CI enforces: RED/BLOCKED tools cannot land in base images.
3) Pin versions + snapshot LICENSE/NOTICE hashes.

## Phase 1 — Base runtime substrate
- Provide: node>=18, python>=3.10, rust, go, git, jq, container runtime (podman/docker)
- Provide a sandbox runner: unprivileged user, constrained filesystem, optional network egress policy.

## Phase 2 — Executor layer
- Install + wrap: OpenCode, Aider, Continue, Goose.
- Provide a single entrypoint: `agentctl exec|review|fix-tests ...` that dispatches to chosen provider.

## Phase 3 — Orchestration spine
- Install Gastown.
- Standardize “Rig” layout and map roles->executors.
- AIWG stage gates become the canonical workflow across rigs.

## Phase 4 — BrowserOps + DesktopOps
- Install Stagehand + browser-use (as providers).
- Add hardened sandbox profiles.
- Add Agent-S behind explicit enable flags only.

## Phase 5 — Memory + extraction
- Stand up Mem0 as local service.
- Feed it from AIWG artifacts.
- Add extractors: OntoGPT + VLM Run schema hub + Skill Seekers pipeline.

## Phase 6 — Optional services
- TabbyML as self-hosted completion backend (community tier).
- Soft-serve as optional internal git hosting.

## Phase 7 — Quarantine lane
- Fortemi (BUSL), AD4M (CAL), Subconscious Systems (mixed): run only behind service/API boundaries until cleared.
