# Graph-native knowledge layer — the Notion leapfrog

The offensive flagship of Workspace/one. Notion's whole thesis is "connected workspace": docs, wikis, tasks, and
databases as one linked substrate, via relations + rollups bolted onto a page database. **That's a poor-man's graph.**
We have a real one (HellGraph + GDS), so we project documents onto it and the connected-workspace features become
first-class graph operations — plus several Notion *structurally cannot* offer.

## Model (built + proven — `noetica/agent-machine/lib/knowledge-graph.ts`, 7/7)
Docs are trees of **blocks**. `projectDoc()` projects a page into graph **nodes** (page · heading · text · todo ·
database · row · **entity**) and **edges** (`CONTAINS` · `LINKS_TO` · `MENTIONS` · `RELATES`). `mergeGraphs()` builds
the workspace graph; same-id pages/entities dedupe into shared **hub** nodes. This projection is exactly what we
persist to HellGraph.

## The five superpowers (each proven; each a thing Notion fakes or can't do)
1. **Automatic cross-doc backlinks** — incoming `LINKS_TO` edges. No manual relation column; `[[wikilinks]]` in any
   block in any doc backlink automatically.
2. **Entity hubs** — `@gus` / `#tag` becomes ONE shared node every mention points at → directly **PageRank /
   community-detectable** (who/what is central across the whole workspace). Notion has no entity graph.
3. **Graph-native rollups** — aggregate a property over nodes connected by *any* edge type and depth, not one
   relation hop. Arbitrary traversal vs Notion's single-relation rollup.
4. **Related-discovery** — the real graph neighbourhood surfaces related pages/blocks; not a hand-maintained relation.
5. **Cross-doc block queries** — a predicate over *every block in the workspace* ("all open todos", "all blocks
   mentioning X"), not scoped to one database.

## Why it beats Notion (and everyone else)
- **It's a real graph** → GDS analytics (PageRank/Louvain/betweenness) run over your *knowledge*: importance,
  clusters, bridges between topics. Notion can't compute "the 10 most central ideas in this workspace."
- **Ontology-typed** (GAIA/IOES) → pages/databases are typed entities, not freeform — queryable + governed.
- **Governed by scope-d** → block/page-level sharing is ontology-policy, not flat ACLs.
- **Choir-native** → the AI is grounded in the actual knowledge graph (HippoRAG/tiered memory already exist), so it
  cites real nodes, not a vector blur — and agents read/write blocks as first-class.
- **CRDT-synced (S0)** → offline-first, federated collaborative editing; sovereign + self-hosted.
- **Unified search** via sherlock over the same graph.

## Roadmap
- ✅ **Core model + projection + 5 superpowers** (proven, this turn).
- ⬜ Persist projection → HellGraph (write path) + incremental refresh (reuse `graph-revision.ts`).
- ⬜ Block editor (Vue) — the Notion-grade authoring surface over the model.
- ⬜ Database views (table/board/gallery) backed by graph queries + graph-native rollups.
- ⬜ Choir agents on blocks (summarize/draft/restructure, grounded + governed).
- ⬜ GDS surfacing in the UI (central ideas, clusters, "what connects A and B").
- ⬜ CRDT collaborative editing (wire S0) + scope-d block governance.

This is the one app where we aren't catching up — we're ahead by construction. Wiki + Notes both ride it.
