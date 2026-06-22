# Client Vue Agent Operating Instructions

Scope: `socioprophet-web/client-vue`

This file applies to the Vue product/app shell only. It does not override broader repository governance outside this subtree.

## Operating rules

- Work issue-first when an issue exists.
- Inspect the live repository before editing.
- Keep the PR bounded to the requested feature slice.
- Do not touch unrelated files.
- Do not claim production readiness unless acceptance criteria prove it.
- Include validation evidence in the PR body.
- Leave known gaps explicit.

## Product-shell boundary

This is the SocioProphet Web Vue product shell, not the marketing site.

Product-shell dashboards may use mock fixtures unless backend integration is explicitly scoped. When using mock fixtures, label the page or docs clearly as fixture-backed, read-only, mock-only, or evidence-only.

Do not invent:

- backend behavior;
- live device authority;
- release-management authority;
- production tile serving;
- live OSM ingestion;
- MemoryMesh writeback;
- MeshRush traversal;
- ActivityPub federation;
- Sourcegraph/GitHub code search;
- secrets, checksums, SBOMs, or provenance not present in source evidence.

## PR body requirements

Every PR should include:

- what changed;
- exact commands run;
- pass/fail output summary;
- known gaps;
- anything blocked;
- non-goals preserved.

## Validation

Use repository-native validation/build commands:

```bash
cd socioprophet-web/client-vue
npm run typecheck
npm test
npm run build
```

When validation cannot be run in the current tool environment, state that explicitly and list the expected command sequence.

## NLBoot and SourceOS pages

For NLBoot evidence work, display plan records, cache evidence, proof records, adapter records, and boot-entry records as evidence artifacts only.

Do not claim real host control from mock fixtures. Do not issue boot commands, mutate EFI state, reboot devices, write disks, or contact host hardware from the Vue shell.

## Adapter seams

TriRPC, journal, code search, reader, feed intelligence, and related adapter surfaces must fail closed unless explicitly wired to a real backend contract in an owning repository.

Mock adapter seams are acceptable only when they are visibly labelled and tested as mock/fixture surfaces.
