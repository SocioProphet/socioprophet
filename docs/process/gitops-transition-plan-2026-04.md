# GitOps Transition Plan — 2026-04

Status: draft
Scope: `SocioProphet/socioprophet`

## Why this exists

The repository accumulated too many long-lived branches and PRs targeting `master` directly.

The new target model is:
- `proposal/*` -> draft PR into `development`
- `development` -> integration and staging
- `master` -> production promotion only

This note explains how to transition from the old branch state to the new one.

## Transition rule

During the cleanup window, a very small number of already-open PRs may still land directly into `master` as a **bootstrap exception** if all of the following are true:

- the PR is small and additive
- the PR is already cleanly recut from current `master`
- the PR reduces branch debt rather than increasing it
- the PR does not introduce a new subsystem ownership ambiguity

All other open work should be:
- closed if stale or superseded, or
- recut from current `development` after the new policy lands

## Bootstrap exception candidates

The intended bootstrap exception class is narrow:
- small docs corrections
- small additive public-surface docs
- tiny fix recuts already cut from current `master`

## Not bootstrap exceptions

The following should normally not merge directly to `master` during transition:
- subsystem runtime packs
- control-plane hardening branches
- staging/integration packs that are still incomplete
- large scaffold branches that should first integrate on `development`

## Immediate queue handling

### Merge-to-master bootstrap exceptions
Use only where the branch is already fresh and trivially reviewable.

### Recut-to-development candidates
These should be recut after the policy PR lands:
- larger AOKC runtime scaffold work
- agentplane hardening
- integration packs such as OpenClaw
- any stale branch that is behind current `master`

### Close-now candidates
Close stale, superseded, or no-op branches aggressively rather than carrying them forward.

## Target steady state

After transition:
1. work starts on `proposal/*`
2. draft PRs target `development`
3. integrated work accumulates on `development`
4. promotion PRs move reviewed sets from `development` to `master`
5. stale proposal branches are deleted quickly
