// Two-axis cockpit navigation, ported faithfully from Will's reference shell
// (willdvlpr/socioprophet socioprophet-web/src/components/Top.js).
//
//   DOMAIN axis  = top mega-menu (what you're looking at)
//   CAPABILITY axis = left rail (how you work it)
//
// `to` paths resolve either to a real registered route or, for not-yet-built
// cells, to the catch-all DomainSurfacePage (mocked surface) — never a dead
// link.

export interface NavLeaf {
  label: string;
  to: string;
}

export interface NavGroup {
  label: string;
  to: string; // domain/capability landing
  items: NavLeaf[];
  groups?: NavGroup[]; // optional sub-columns (grouped mega-menu, e.g. Operator)
}

// --- DOMAIN axis (top mega-menu) ---------------------------------------------
export const DOMAIN_MENU: NavGroup[] = [
  {
    label: 'News & Events',
    to: '/news',
    items: [
      { label: 'All News & Events', to: '/news' },
      { label: 'Recent Events', to: '/news/recent' },
      { label: 'Event Calendar', to: '/news/calendar' },
    ],
  },
  {
    label: 'Law & Regulation',
    to: '/law/international-law',
    items: [
      { label: 'International Law', to: '/law/international-law' },
      { label: 'Federal Law', to: '/law/federal-law' },
      { label: 'State & Local Law', to: '/law/state-local-law' },
      { label: 'Statutory Law', to: '/law/statutory-law' },
      { label: 'Case Law', to: '/law/case-law' },
    ],
  },
  {
    label: 'People & Society',
    to: '/people/search',
    items: [
      { label: 'People Search', to: '/people/search' },
      { label: 'Labor Market', to: '/people/labor-market' },
      { label: 'Government & Politics', to: '/people/government-politics' },
      { label: 'Population & Demographics', to: '/people/demographics' },
      { label: 'Polls & Opinion', to: '/people/polls-opinion' },
      { label: 'Health & Medicine', to: '/people/health-medicine' },
      { label: 'Art & Culture', to: '/people/art-culture' },
      { label: 'Social Networks', to: '/people/social-networks' },
    ],
  },
  {
    label: 'Economy & Industry',
    to: '/economy/macro-economics',
    items: [
      { label: 'Macro Economics', to: '/economy/macro-economics' },
      { label: 'Micro Economics', to: '/economy/micro-economics' },
      { label: 'Labor Economics', to: '/economy/labor-economics' },
      { label: 'Industry & Commerce', to: '/economy/industry-commerce' },
      { label: 'Value Drivers', to: '/economy/value-drivers' },
      { label: 'Causal Valuation', to: '/economy/causal-valuation' },
      { label: 'Farming & Agriculture', to: '/economy/farming-agriculture' },
      { label: 'Mining & Extraction', to: '/economy/mining-extraction' },
      { label: 'Processing & Refinement', to: '/economy/processing-refinement' },
      { label: 'Manufacturing & Assembly', to: '/economy/manufacturing-assembly' },
      { label: 'Technology & Information', to: '/economy/technology-information' },
      { label: 'Logistics & Transport', to: '/economy/logistics-transport' },
    ],
  },
  {
    label: 'Capital & Markets',
    to: '/markets/indices-funds',
    items: [
      { label: 'Indices & Funds', to: '/markets/indices-funds' },
      { label: 'Equities & Preferreds', to: '/markets/equities-preferreds' },
      { label: 'Debt & Fixed Income', to: '/markets/debt-fixed-income' },
      { label: 'Options & Derivatives', to: '/markets/options-derivatives' },
      { label: 'Currency / FX', to: '/markets/currency-fx' },
      { label: 'Crypto / Digital', to: '/markets/crypto-digital' },
      { label: 'Real-Assets', to: '/markets/real-assets' },
      { label: 'Alternative Investments', to: '/markets/alternative-investments' },
      { label: 'Portfolios & Watch Lists', to: '/capability/portfolios' },
      { label: 'Algorithmic Trading', to: '/capability/algorithmic-trading' },
    ],
  },
  {
    label: 'Weather & Natural Resources',
    to: '/weather/forecast',
    items: [
      { label: 'Weather & Forecast', to: '/weather/forecast' },
      { label: 'Climate & Environment', to: '/weather/climate-environment' },
      { label: 'Natural Resources', to: '/weather/natural-resources' },
    ],
  },
  {
    label: 'Maps & Analytics',
    to: '/map',
    items: [
      { label: 'Supply Chain', to: '/analytics/supply-chain' },
      { label: 'Digital Twin', to: '/analytics/digital-twin' },
      { label: 'Trending Infographics', to: '/analytics/trending-infographics' },
      { label: 'Charts & Graphs', to: '/analytics/charts-graphs' },
      { label: 'Maps & Interactives', to: '/map' },
      { label: 'Custom Analytics', to: '/analytics' },
    ],
  },
  {
    label: 'Knowledge',
    to: '/knowledge/graph',
    items: [
      { label: 'Knowledge Graph', to: '/knowledge/graph' },
      { label: 'Search', to: '/data/search' },
      { label: 'Discovery', to: '/discovery' },
      { label: 'Living Ontology', to: '/ontology' },
      { label: 'Noetica Chat', to: '/noetica' },
      { label: 'Research Capture', to: '/research' },
      { label: 'Reader', to: '/reader' },
      { label: 'Journal', to: '/journal' },
      { label: 'Feed', to: '/feed' },
    ],
  },
];

// Operator mega-menu — the operational cockpit (marketplace, operator/infra,
// knowledge, models) surfaced as a top-bar domain with grouped columns, so it
// isn't buried in the hamburger. Backed by AGENT_COCKPIT (defined below).
export const OPERATOR_MENU: NavGroup = {
  label: 'Operator',
  to: '/agentic-os',
  items: [],
  get groups() { return AGENT_COCKPIT; },
};

// Resolve the DOMAIN-axis scope for a route path — the parent domain plus the
// active sub-domain leaf label — so a flagship surface can show which lens the
// operator is in (e.g. Capital & Markets · Equities & Preferreds) and scope its
// data to that sub-domain instead of every sibling rendering an identical board.
export interface NavScope {
  domain: string; // parent domain label, e.g. "Capital & Markets"
  label: string; // active leaf label, e.g. "Equities & Preferreds"
  domainTo: string; // the domain's landing route
  isPrimary: boolean; // true when this leaf is the domain's landing route
}

export function navScopeForPath(path: string): NavScope | undefined {
  for (const group of DOMAIN_MENU) {
    const leaf = group.items.find((item) => item.to === path);
    if (leaf) {
      return { domain: group.label, label: leaf.label, domainTo: group.to, isPrimary: leaf.to === group.to };
    }
  }
  // CAPABILITY axis: a rail capability realized through an existing surface
  // (e.g. Portfolios via the market watchlist, Entity Analytics via the People
  // directory) shows its capability label as the lens — never 'primary', so the
  // host screen swaps its own title for the capability it's standing in for.
  const cap = CAPABILITY_RAIL.find((group) => group.to === path);
  if (cap) return { domain: 'Capabilities', label: cap.label, domainTo: cap.to, isPrimary: false };
  return undefined;
}

// --- CAPABILITY axis (left rail) ---------------------------------------------
// Will's 11 capabilities. Sub-items were `sub-heading1/2/3` stubs in the
// reference; left as capability landings until the operator screens land.
export const CAPABILITY_RAIL: NavGroup[] = [
  { label: 'User Dashboard', to: '/capability/dashboard', items: [] },
  { label: 'Portfolios & Watch Lists', to: '/capability/portfolios', items: [] },
  { label: 'Algorithmic Trading', to: '/capability/algorithmic-trading', items: [] },
  { label: 'Economic Prophet', to: '/capability/economic-prophet', items: [] },
  { label: 'Ontology & Epistemology', to: '/capability/ontology-epistemology', items: [] },
  { label: 'NLP & Information Extraction', to: '/capability/nlp-information-extraction', items: [] },
  { label: 'Sentiment Analytics', to: '/capability/sentiment-analytics', items: [] },
  { label: 'Entity Analytics', to: '/capability/entity-analytics', items: [] },
  { label: 'Behavioral Analytics', to: '/capability/behavioral-analytics', items: [] },
  { label: 'Mobile & App Development', to: '/capability/mobile-app-development', items: [] },
  { label: 'Experiments & Simulations', to: '/capability/experiments-simulations', items: [] },
];

// Everyday working surfaces surfaced as direct rail links (always visible). The
// former dev/SourceOS shortcuts (Code Search, NLBoot Evidence, Operator Workbench)
// moved into the operator-mode-gated AGENT_COCKPIT · SourceOS group; the reading/
// capture surfaces now also live in the Knowledge domain menu.
export const OPERATOR_SHORTCUTS: NavLeaf[] = [
  { label: 'Research Capture', to: '/research' },
  { label: 'Reader', to: '/reader' },
  { label: 'Journal', to: '/journal' },
];

// Agent Machine cockpit — live on-device surfaces backed by the Noetica
// agent-machine /api/* endpoints (sovereign, no auth). These are the ported
// command-center surfaces: workstation ops, models, knowledge, forge.
// Operator / SourceOS cockpit — revealed only when the user enables Operator mode
// in Settings (off by default, so a normal user never meets SourceOS). Regrouped
// for clarity; Model Labs deduped to /ai/labs; NLBoot Evidence / Operator Workbench
// / Code Search collected under SourceOS. Noetica Chat and HolographMe moved OUT to
// user-facing places (Knowledge menu and the user dropdown).
export const AGENT_COCKPIT: NavGroup[] = [
  {
    label: 'Studio',
    to: '/studio',
    items: [
      { label: 'Notebooks', to: '/studio?section=notebooks' },
      { label: 'Compute Plane', to: '/studio?section=compute' },
      { label: 'Graph Explorer', to: '/studio?section=graph' },
      { label: 'Query Console', to: '/studio?section=query' },
      { label: 'Analytics', to: '/studio?section=analytics' },
      { label: 'GraphRAG', to: '/studio?section=graphrag' },
      { label: 'Resource Browser', to: '/studio?section=resource' },
      { label: 'Reasoner', to: '/studio?section=reasoner' },
      { label: 'Entity Resolution', to: '/studio?section=er' },
      { label: 'Ontology', to: '/studio?section=ontology' },
      { label: 'Experiments', to: '/studio?section=experiments' },
      { label: 'Operations', to: '/studio?section=operations' },
      { label: 'Governance', to: '/studio?section=governance' },
      { label: 'Commons', to: '/studio?section=commons' },
    ],
  },
  {
    label: 'Infrastructure',
    to: '/agentic-os',
    items: [
      { label: 'Agentic OS', to: '/agentic-os' },
      { label: 'Control Plane', to: '/control-plane/org' },
      { label: 'Provenance (why a decision)', to: '/control-plane/provenance' },
      { label: 'Universe Viewer', to: '/universe' },
      { label: 'Situations (n-ary)', to: '/situations' },
    ],
  },
  {
    label: 'Models & Pipelines',
    to: '/ai/labs',
    items: [
      { label: 'Model Labs', to: '/ai/labs' },
      { label: 'Studio', to: '/operator/studio' },
      { label: 'Pipelines (Beam / Ray)', to: '/operator/pipelines' },
      { label: 'Lattice Forge', to: '/operator/lattice-forge' },
      { label: 'RAG Inspect', to: '/operator/rag-inspect' },
      { label: 'Data Catalog', to: '/operator/data-catalog' },
    ],
  },
  {
    label: 'Workstation',
    to: '/workstation/pipelines',
    items: [
      { label: 'Pipelines', to: '/workstation/pipelines' },
      { label: 'Deploy', to: '/workstation/deploy' },
      { label: 'Services · DevSpaces', to: '/workstation/services' },
      { label: 'Terminal', to: '/workstation/terminal' },
      { label: 'Add Local Repo', to: '/forge/import' },
    ],
  },
  {
    label: 'SourceOS',
    to: '/nlboot',
    items: [
      { label: 'NLBoot Evidence', to: '/nlboot' },
      { label: 'Operator Workbench', to: '/workbench' },
      { label: 'Code Search', to: '/code' },
    ],
  },
  {
    label: 'Marketplace',
    to: '/marketplace',
    items: [
      { label: 'Triparty Netting', to: '/marketplace' },
      { label: 'Supply-chain Orchestrator', to: '/marketplace/orchestrate' },
    ],
  },
];

// --- Accordion drawer sections -----------------------------------------------
// Progressive disclosure: everyday sections open by default, everything else
// collapsed but PRESENT (nothing removed). `operator: true` sections default to the
// user's Operator-mode preference (on → expanded/pinned) but stay reachable regardless.
export interface DrawerSection {
  id: string;
  label: string;
  defaultOpen: boolean;
  operator?: boolean;
  items: NavLeaf[];
}

const _slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const DRAWER_SECTIONS: DrawerSection[] = [
  {
    id: 'capabilities',
    label: 'Capabilities',
    defaultOpen: true,
    items: CAPABILITY_RAIL.map((c) => ({ label: c.label, to: c.to })),
  },
  {
    id: 'working',
    label: 'Working surfaces',
    defaultOpen: true,
    items: [...OPERATOR_SHORTCUTS, { label: 'Feed', to: '/feed' }],
  },
  {
    id: 'knowledge',
    label: 'Knowledge & Data',
    defaultOpen: false,
    items: [
      { label: 'Knowledge Graph', to: '/knowledge/graph' },
      { label: 'Search', to: '/data/search' },
      { label: 'Living Ontology', to: '/ontology' },
      { label: 'Noetica Chat', to: '/noetica' },
    ],
  },
  ...AGENT_COCKPIT.map((g) => ({ id: _slug(g.label), label: g.label, defaultOpen: false, operator: true, items: g.items })),
];

// Flat, de-duplicated surface index for the ⌘K command palette — every reachable
// leaf across the domain menus and the drawer sections, tagged with its group.
export interface SurfaceEntry { label: string; to: string; group: string }

export const ALL_SURFACES: SurfaceEntry[] = (() => {
  const seen = new Set<string>();
  const out: SurfaceEntry[] = [];
  const push = (label: string, to: string, group: string) => {
    if (seen.has(to)) return;
    seen.add(to);
    out.push({ label, to, group });
  };
  for (const d of DOMAIN_MENU) for (const leaf of d.items) push(leaf.label, leaf.to, d.label);
  for (const s of DRAWER_SECTIONS) for (const leaf of s.items) push(leaf.label, leaf.to, s.label);
  push('Settings', '/settings', 'Account');
  return out;
})();
