# Repo Map and Prophet Understand

Prophet Understand is the repo-intelligence layer for SocioProphet. It turns important repositories into governed graph artifacts that humans and agents can inspect, search, validate, and use for bounded work planning.

The product surface is the `/repo-map` workbench. The initial implementation is fixture-backed, then repo-backed through the cross-repo vertical slice in `SocioProphet/prophet-platform`.

## What the workbench shows

The workbench should expose:

- graph overview for a repository
- node detail for files, modules, contracts, schemas, services, policies, tests, workflows, and documents
- edge/path explanations for contains, validates, tests, documents, depends-on, and governed-by relationships
- guided architecture tours
- PR diff impact sets
- source anchors and provenance receipts
- validation and policy state
- fixture/live mode indicators

## Canonical artifact

The canonical artifact is:

```text
.prophet/prophet-understanding.json
```

The artifact carries:

- repo metadata
- stable graph nodes and edges
- source anchors
- summaries
- guided tours
- diff impact sets
- provenance receipts
- validation results
- policy status

## Estate flow

The v0 flow is:

```text
Smart Tree emits .prophet/prophet-understanding.json
Prophet Platform validates the artifact
Lampstand indexes the artifact
Sherlock Search queries the index
Policy Fabric evaluates trust and review state
Delivery Excellence scores freshness, coverage, drift, and impact
SocioProphet renders the workbench
```

## UX rules

The workbench must not default to a force-directed hairball. Large repositories need collapsed containers, search-first navigation, lazy expansion, and layered views.

Every factual graph claim should preserve evidence. The UI should show source anchors, provenance receipt IDs, confidence, validation state, and policy state when available.

## Safety rules

The graph does not grant mutation authority. Agents can use graph context to scope work, but execution remains governed by AgentPlane and Policy Fabric.

The UI must not hide missing, stale, invalid, inferred, or low-confidence graph state.

No local file-serving surface should ship without a reviewed threat model.

## First operational target

The first repo-backed demo target is `SocioProphet/smart-tree`. The expected chain is:

```bash
cd ~/dev/prophet-platform
python3 tools/check_prophet_understand_estate_targets.py
python3 tools/run_prophet_understand_repo_backed_slice.py \
  --dev-root "$HOME/dev" \
  --target-repo smart-tree \
  --target-full-name SocioProphet/smart-tree \
  --query "what depends on this contract?"
```

A passing run proves that the estate can emit, validate, index, search, evaluate, and score a real repository graph.
