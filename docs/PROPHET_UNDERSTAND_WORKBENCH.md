# Prophet Understand Workbench

## Purpose

The SocioProphet UI should expose Prophet Understand / Repo Intelligence v0 as a human-facing workbench for codebase, architecture, policy, and PR-impact understanding.

The workbench should be evidence-first. It should show what the graph knows, what it does not know, what evidence supports each claim, and what policy status applies.

## Route

Preferred route:

```text
/repo-map
```

Acceptable aliases:

```text
/understand
/graph
```

## Data source

Initial mode is fixture-backed and reads a `prophet-understanding.v0` artifact.

Canonical artifact:

```text
.prophet/prophet-understanding.json
```

Normative platform contract:

```text
SocioProphet/prophet-platform/schemas/repo-intelligence/prophet-understanding.schema.json
```

## Required panels

- graph overview
- node detail
- edge/path explanation
- guided tour
- diff impact set
- source anchor and provenance panel
- policy status panel
- validation status panel
- fixture/live mode indicator

## Large graph UX

The default view must avoid a force-directed hairball. Preferred layout behavior:

- collapsed containers by directory, package, service, or domain
- search-first navigation
- lazy expansion
- layered dependency view for architecture
- separate diff-impact view for changed paths
- warning badges for stale, invalid, inferred, or low-confidence facts

## Node detail minimum fields

- node ID
- kind
- label
- repo-relative path
- source anchor
- confidence
- provenance receipt IDs
- related edges
- policy state where applicable
- validation state where applicable

## Non-goals

- Do not vendor third-party graph dashboards as the trust root.
- Do not expose local file serving without a reviewed threat model.
- Do not hide missing, stale, invalid, or inferred graph state.
- Do not claim semantic certainty without evidence, confidence, and provenance.
