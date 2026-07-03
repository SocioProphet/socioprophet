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
      { label: 'Trending Infographics', to: '/analytics/trending-infographics' },
      { label: 'Charts & Graphs', to: '/analytics/charts-graphs' },
      { label: 'Maps & Interactives', to: '/map' },
      { label: 'Custom Analytics', to: '/analytics' },
    ],
  },
];

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

// Real working surfaces that already exist — surfaced as direct rail links
// below the capability axis so nothing that works is buried.
export const OPERATOR_SHORTCUTS: NavLeaf[] = [
  { label: 'Research Capture', to: '/research' },
  { label: 'Feed', to: '/feed' },
  { label: 'Reader', to: '/reader' },
  { label: 'Journal', to: '/journal' },
  { label: 'Code Search', to: '/code' },
  { label: 'NLBoot Evidence', to: '/nlboot' },
  { label: 'Operator Workbench', to: '/workbench' },
];
