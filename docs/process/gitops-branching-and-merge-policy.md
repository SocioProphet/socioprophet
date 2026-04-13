# GitOps Branching and Merge Policy v0.1

Status: draft
Scope: `SocioProphet/socioprophet`

## Purpose

This repository is moving to a three-tier branching model so that proposal work, integration work, and production work are separated clearly.

The goal is to reduce branch sprawl, keep review state explicit, and make GitOps promotion predictable.

## Branch tiers

### 1. `proposal/*`
Proposal branches are short-lived work branches.

Rules:
- branch from `development`
- open a **draft PR** into `development`
- use these branches for scoped changes, experiments, and reviewable work-in-progress
- do not treat a long-lived proposal branch as an integration branch

Examples:
- `proposal/public-sector-copy-pass`
- `proposal/aokc-runtime-bootstrap-r1`
- `proposal/openclaw-pack-r2`

### 2. `development`
`development` is the integration branch.

Rules:
- proposal PRs merge here first
- this branch is the staging and integration surface
- preview or staging deployments should track this branch
- do not push directly; use PRs
- squash merge or rebase policy should keep history readable

### 3. `master`
`master` remains the production branch.

Rules:
- production-ready work reaches `master` only through promotion from `development`
- production deployment tracks `master`
- no direct pushes
- branch protection should be strongest here

## Merge sequence

Canonical sequence:

1. create `proposal/*` branch from `development`
2. open draft PR from `proposal/*` to `development`
3. review, revise, and land into `development`
4. when a coherent set of integrated changes is ready, open a promotion PR from `development` to `master`
5. merge promotion PR to `master`

## Pull request expectations

### Proposal PRs
- default state: draft
- must say what repo role they touch: public surface, integration workspace, or subsystem staging
- should be small enough to review without hidden stacked dependency chains

### Promotion PRs
- compare `development` to `master`
- summarize all features or fixes being promoted
- list any intentionally deferred items that remain on `development`
- should be the only regular path into `master`

## GitOps mapping

- `proposal/*` -> ephemeral review or preview context
- `development` -> staging / integration deployment
- `master` -> production deployment

## Protection rules

Recommended enforcement:

- protect `master`
- protect `development`
- require PRs for both
- require CI checks before merge
- prevent force-push on both protected branches
- use squash merges by default unless a repo-specific exception is justified

## Branch hygiene

- close stale proposal PRs aggressively
- delete merged proposal branches
- do not keep dozens of unreviewed long-lived feature branches alive
- if a proposal branch goes stale, recut it from current `development` rather than trying to merge a heavily diverged branch

## Hotfix rule

If a production fix must bypass the normal sequence:
- cut a short-lived `hotfix/*` branch from `master`
- PR into `master`
- after merge, immediately backport the same change into `development`

This should be exceptional, not normal practice.

## Immediate adoption note

This policy is being introduced after a period of branch sprawl. During transition, stale PRs may be closed or recut so that future work can follow the `proposal/* -> development -> master` model cleanly.
