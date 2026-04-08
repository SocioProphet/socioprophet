# Orchestrator Interface

## Purpose
Coordinate **multiple executors** across multiple repos/worktrees with role separation.

## Required capabilities
- `spawn(role, workspace)` -> returns executor handle
- `assign(executor, task, completion_criteria)` -> tracked work item
- `collect()` -> unify reports + diffs + gate results
- `gate(stage)` -> pass/fail decision based on evidence (tests, security checks, etc.)

## Example providers
Gastown (primary). AIWG provides stage-gate semantics, not workspace spawning.
