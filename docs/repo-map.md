# Repo Map

Repo Map is the Prophet Understand workbench: a governed repository graph surface for architecture, PR impact, policy state, provenance, and agent work planning.

This page is the fixture-backed product route. The live route should read `prophet-understanding.v0` artifacts produced by Smart Tree and validated through Prophet Platform.

<div class="repo-map-hero">
  <div>
    <p class="eyebrow">Prophet Understand v0</p>
    <h2>Codebase understanding as a governed graph artifact.</h2>
    <p>Smart Tree emits the graph. Prophet Platform validates it. Lampstand indexes it. Sherlock searches it. Policy Fabric evaluates trust. Delivery Excellence scores adoption and drift.</p>
  </div>
  <div class="status-card">
    <strong>Demo target</strong>
    <span>SocioProphet/smart-tree</span>
    <strong>Mode</strong>
    <span>Fixture-backed → repo-backed</span>
    <strong>Policy</strong>
    <span class="warn">warn / require review until live artifacts are stable</span>
  </div>
</div>

## Workbench panels

<div class="repo-grid">
  <section>
    <h3>Graph Overview</h3>
    <p>Collapsed repository, directory, package, contract, policy, schema, test, and workflow nodes. The default view avoids force-directed hairballs.</p>
  </section>
  <section>
    <h3>Node Detail</h3>
    <p>Node ID, kind, label, repo-relative path, source anchor, confidence, provenance receipts, validation state, and policy state.</p>
  </section>
  <section>
    <h3>Search</h3>
    <p>Sherlock query lane over Lampstand records. v0 is lexical/graph/evidence search until embedding evidence is present.</p>
  </section>
  <section>
    <h3>PR Impact</h3>
    <p>Changed paths mapped to affected nodes, edges, tests, docs, contracts, and policies before agent dispatch or merge review.</p>
  </section>
  <section>
    <h3>Evidence</h3>
    <p>Every graph-backed claim should expose source anchors and provenance receipt IDs. Missing evidence remains visible.</p>
  </section>
  <section>
    <h3>Policy</h3>
    <p>Policy Fabric states: allow, warn, require_review, deny, unknown. Graph context informs scope; it does not grant mutation authority.</p>
  </section>
</div>

## v0 chain

```text
Smart Tree emits .prophet/prophet-understanding.json
Prophet Platform validates the artifact
Lampstand indexes the artifact
Sherlock Search queries the index
Policy Fabric evaluates graph trust and review state
Delivery Excellence scores coverage, freshness, drift, and impact
SocioProphet renders the Repo Map workbench
```

## Example search result shape

```json
{
  "query": "what depends on this contract?",
  "mode": "lexical-graph-evidence-v0",
  "results": [
    {
      "record_family": "repo_graph_edge",
      "record_id": "edge:schema-validates-contract",
      "edge_id": "edge:schema-validates-contract",
      "policy_state": "allow",
      "provenance_receipt_ids": ["receipt:schema-fixture"]
    }
  ]
}
```

## Local demo command

```bash
cd ~/dev/prophet-platform
python3 tools/check_prophet_understand_estate_targets.py
python3 tools/run_prophet_understand_repo_backed_slice.py \
  --dev-root "$HOME/dev" \
  --target-repo smart-tree \
  --target-full-name SocioProphet/smart-tree \
  --query "what depends on this contract?"
```

## Safety stance

Repo Map must show uncertainty. Missing, stale, invalid, inferred, low-confidence, or policy-risk graph state should be visible in the UI. Agents can use graph context to scope work, but execution remains governed by AgentPlane and Policy Fabric.

<style>
.repo-map-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(240px, 0.8fr);
  gap: 1rem;
  align-items: stretch;
  padding: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
}
.repo-map-hero h2 { margin-top: .25rem; }
.eyebrow {
  margin: 0;
  font-size: .8rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  font-weight: 700;
}
.status-card {
  display: grid;
  gap: .25rem;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg);
}
.status-card span { margin-bottom: .5rem; color: var(--vp-c-text-2); }
.status-card .warn { color: var(--vp-c-warning-1); }
.repo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}
.repo-grid section {
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
}
.repo-grid h3 { margin-top: 0; }
@media (max-width: 720px) {
  .repo-map-hero { grid-template-columns: 1fr; }
}
</style>
