# Executor Interface

## Purpose
A provider that can **apply changes** to a repo/worktree and run commands/tests.

## Required capabilities
- `plan(task)` -> structured plan + required tools
- `apply(patch|instructions)` -> repo modifications (git diff-able)
- `run(cmd, cwd, env)` -> command execution with captured stdout/stderr/exit code
- `report()` -> JSON report including provenance: inputs, outputs, tool calls, exit codes

## Hard constraints
- Must be runnable in a sandboxed context (non-root, constrained FS)
- Must never store secrets in logs

## Example providers
OpenCode, Aider, Continue, Goose.
