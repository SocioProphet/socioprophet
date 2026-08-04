// Full route inventory for the Playwright route-smoke test.
//
// main.ts builds its final route table at runtime from three sources:
//   1. `explicitRoutes` — a hand-authored array of {path, component} entries.
//   2. `domainLeafRoutes` — every DOMAIN_MENU leaf (src/config/cockpitNav.ts)
//      not already in (1), pointed at its domain's flagship component.
//   3. `mockedSurfaceRoutes` — every domainSurfaces entry (src/config/domainRoutes.ts)
//      not already covered by (1) or (2), pointed at the generic mocked surface.
// Anything not covered by any of the three still resolves via the catch-all
// `/:pathMatch(.*)*` route, so no leaf/surface path is ever a dead link.
//
// main.ts itself can't be imported here — its module body calls
// `createApp(...).mount('#app')`, which requires a real DOM and would blow up
// under Node. So this file rebuilds the same *path* inventory from two angles:
//   - EXPLICIT_ROUTES is transcribed directly from main.ts's `explicitRoutes`
//     (dynamic `:id` segments resolved to one concrete sample value — both
//     components fall back to an <EmptyState> for an unrecognized id, so any
//     sample value exercises the real "not found" render path).
//   - NAV_ROUTES pulls live from the same config modules main.ts consumes
//     (ALL_SURFACES already flattens+dedupes DOMAIN_MENU + DRAWER_SECTIONS;
//     domainSurfaces covers the remaining mocked mega-menu leaves), so routes
//     added to the nav automatically get picked up here without editing this
//     file again.
// The two sets are unioned and deduped below.
import { domainSurfaces } from '../src/config/domainRoutes';
import { ALL_SURFACES } from '../src/config/cockpitNav';

const SAMPLE_ID = 'smoke-test-sample';

export const EXPLICIT_ROUTES: string[] = [
  '/login',
  '/capability/dashboard',
  '/agentic-os',
  '/marketplace',
  '/people/labor-market',
  '/delivery/wbs',
  '/delivery/cowork',
  '/capability/portfolios',
  '/operator/holograph-me',
  `/operator/${SAMPLE_ID}`,
  '/ontology',
  '/universe',
  '/space',
  '/situations',
  '/marketplace/orchestrate',
  '/capability/algorithmic-trading',
  '/capability/nlp-information-extraction',
  '/knowledge/studio',
  '/delivery',
  '/delivery/estate',
  '/capability/experiments-simulations',
  '/capability/behavioral-analytics',
  '/capability/mobile-app-development',
  '/analytics/supply-chain',
  '/analytics/digital-twin',
  '/analytics/twin-workshop',
  '/analytics/model-tournament',
  '/analytics/model-board',
  '/professional-intelligence/competitive/model-platforms',
  '/analytics/twin-world-model',
  '/weather/natural-resources',
  '/analytics/trending-infographics',
  '/analytics/charts-graphs',
  '/analytics',
  '/capability/entity-analytics',
  '/capability/sentiment-analytics',
  '/capability/ontology-epistemology',
  '/capability/economic-prophet',
  '/research',
  '/professional-intelligence/competitive',
  '/professional-intelligence/competitive/features',
  '/professional-intelligence/competitive/markets',
  '/professional-intelligence/competitive/enterprise',
  '/professional-intelligence/competitive/boards',
  `/professional-intelligence/competitive/${SAMPLE_ID}`,
  '/professional-intelligence',
  '/control-plane',
  '/control-plane/org',
  '/control-plane/executions',
  '/control-plane/containment',
  '/nlboot',
  '/reader',
  '/journal',
  '/code',
  '/person-graph',
  '/map',
  '/feed',
  '/workbench',
  '/workbench/scope-d',
  '/workstation/pipelines',
  '/workstation/deploy',
  '/workstation/services',
  '/workstation/terminal',
  '/ai/labs',
  '/studio',
  '/discovery',
  '/data/search',
  '/data/catalogue',
  '/knowledge/graph',
  '/forge/import',
  '/sourceos/image-builder',
  '/sourceos/builds',
  '/sourceos/fleet',
  '/sourceos/cloud',
  '/mail',
  '/news',
  '/markets/indices-funds',
  '/economy/macro-economics',
  '/economy/value-drivers',
  '/economy/causal-valuation',
  '/settings',
  '/control-plane/provenance',
  '/people/search',
  '/people/social-networks',
  '/law/international-law',
  '/noetica',
  '/noetica/reasoning-chain',
  '/weather/forecast',
];

// Nav-derived paths, pulled live so newly added menu/mega-menu leaves and
// mocked domain surfaces are covered automatically.
const NAV_ROUTES: string[] = [
  ...ALL_SURFACES.map((s) => s.to),
  ...domainSurfaces.map((s) => s.route),
];

// One path that matches nothing above, to exercise the `/:pathMatch(.*)*`
// catch-all -> DomainSurfacePage render (kept out of ALL_ROUTES proper since
// it's not "a route" so much as a probe of the fallback itself).
export const UNKNOWN_ROUTE = '/this-route-does-not-exist-smoke-probe';

// Note: Studio's `?section=` deep links (e.g. `/studio?section=graph`) all
// resolve to the same `/studio` Vue Router route, but each is still a
// distinct URL a user can land on directly (bookmarked, linked from the
// Operator mega-menu) and a distinct client-side render branch inside
// Studio.vue — ALL_SURFACES lists them individually, so they're kept as
// separate test cases here rather than collapsed into one.

function dedupe(paths: string[]): string[] {
  return Array.from(new Set(paths)).sort();
}

export const ALL_ROUTES: string[] = dedupe([...EXPLICIT_ROUTES, ...NAV_ROUTES]);
