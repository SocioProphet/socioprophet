# Interface Inventory (canonical)

This is the human-authored UI contract: screens, routes, ownership, contracts, and evidence events.

## apps/ui-workbench

### Home
- Route: `/`
- File: `apps/ui-workbench/src/routes/HomePage.vue`
- Purpose: landing / navigation hub
- Data contracts: none
- Evidence events: `ui.page.viewed(home)`
- Legacy parity: unknown (legacy not located)

### Search Results
- Route: `/search`
- File: `apps/ui-workbench/src/routes/SearchResultsPage.vue`
- Components:
  - `apps/ui-workbench/src/components/search/ResultCard.vue`
  - `packages/ui-kit/src/TrustBadge.vue`
- Data contracts:
  - `apps/ui-workbench/src/schemas/search.ts` (to migrate to `packages/schemas`)
- API:
  - `apps/ui-workbench/src/api/search.ts` (stubbed provider)
- State:
  - `apps/ui-workbench/src/stores/search.ts`
- Evidence events:
  - `search.executed`
  - `search.results.rendered`
  - `search.result.opened`
- Legacy parity: unknown

### Entity Profile
- Route: `/entity/:id`
- File: `apps/ui-workbench/src/routes/EntityProfilePage.vue`
- Purpose: entity detail surface (attributes, links, evidence, provenance)
- Evidence events: `entity.viewed`
- Legacy parity: unknown

### Graph Explorer
- Route: `/graph`
- File: `apps/ui-workbench/src/routes/GraphExplorerPage.vue`
- Purpose: graph traversal / neighborhood explorer
- Evidence events: `graph.viewed`, `graph.node.selected`, `graph.edge.selected`
- Legacy parity: unknown

### KB Home
- Route: `/kb`
- File: `apps/ui-workbench/src/routes/KbHomePage.vue`
- Purpose: knowledge base surfaces (collections, taxonomies, saved queries)
- Evidence events: `kb.viewed`
- Legacy parity: unknown

### Settings
- Route: `/settings`
- File: `apps/ui-workbench/src/routes/SettingsPage.vue`
- Purpose: user prefs (display, trust thresholds, evidence export, connector defaults)
- Evidence events: `settings.viewed`, `settings.updated`
- Legacy parity: unknown

### Admin: Connectors
- Route: `/admin/connectors`
- File: `apps/ui-workbench/src/routes/admin/ConnectorsPage.vue`
- Purpose: manage data connectors / sources
- Evidence events: `connector.created`, `connector.updated`, `connector.deleted`
- Legacy parity: unknown

### Admin: Curation
- Route: `/admin/curation`
- File: `apps/ui-workbench/src/routes/admin/CurationPage.vue`
- Purpose: HITL queue + label/override workflows
- Evidence events: `curation.task.opened`, `curation.label.applied`, `curation.override.saved`
- Legacy parity: unknown

### Admin: Trust Registry
- Route: `/admin/trust`
- File: `apps/ui-workbench/src/routes/admin/TrustRegistryPage.vue`
- Purpose: trust rules + provenance policy registry
- Evidence events: `trust.rule.created`, `trust.rule.updated`, `trust.rule.deleted`
- Legacy parity: unknown
