# License and Rip-Out Policy (AgentOS)

## Core rule
If a repo has **no license**, treat it as **all rights reserved** (blocked for integration). Code may be read for learning, but not copied, modified, or redistributed as part of our system.

## Intake states
- **GREEN (Approved)**: MIT / Apache-2.0 / BSD-3-Clause / CC0-1.0 (track NOTICE/attribution when required)
- **YELLOW (Bounded use)**: GPL/AGPL, mixed/commercial tiers, ambiguous metadata, high-risk security surface
- **RED (Quarantine/Replace-first)**: No license, BUSL/BSL, CAL-1.0, proprietary source

## Rip-out design rule
Every non-trivial dependency must sit behind:
1) a named **Adapter Interface** (Executor/Orchestrator/BrowserOps/etc.)
2) a **runtime boundary** when feasible (separate process/container)
3) **contract tests** proving we can swap providers without rewriting callers

## Version pinning rule
We pin to a specific tag/commit and snapshot:
- LICENSE text hash
- NOTICE file (if present)
- dependency lockfile hash (package-lock/pnpm-lock/poetry.lock/etc.)

Upgrades are treated as new intake events.

## “Use them all” without entanglement
We can run multiple tools in the same layer as long as:
- there is exactly **one canonical system-of-record** for artifacts (git + AIWG artifacts)
- memory/services remain replaceable providers (Mem0/Fortemi/etc.)
- orchestration decisions are centralized (Gastown + AIWG stage gates)
