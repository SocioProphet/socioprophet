export type DomainSurface = {
  domain: string;
  item: string;
  route: string;
  template: string;
  provenanceRibbon: boolean;
  commentCard: boolean;
  status: string;
  implementation?: 'mocked' | 'live' | 'alias';
};

export const domainSurfaces: DomainSurface[] = [
  { domain: 'News & Events', item: 'All News & Events', route: '/news', template: 'Hub List (All)', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'News & Events', item: 'Recent Events', route: '/news/recent', template: 'Hub List (Recent)', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'News & Events', item: 'Event Calendar', route: '/news/calendar', template: 'Calendar View', provenanceRibbon: true, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Law & Regulation', item: 'International Law', route: '/law/international-law', template: 'Docket List + Redline', provenanceRibbon: true, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Law & Regulation', item: 'Federal Law', route: '/law/federal-law', template: 'Docket List + Redline', provenanceRibbon: true, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Law & Regulation', item: 'State & Local Law', route: '/law/state-local-law', template: 'Docket List + Redline', provenanceRibbon: true, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Law & Regulation', item: 'Statutory Law', route: '/law/statutory-law', template: 'Docket List + Redline', provenanceRibbon: true, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Law & Regulation', item: 'Case Law', route: '/law/case-law', template: 'Docket List + Redline', provenanceRibbon: true, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'People & Society', item: 'People Search', route: '/people/search', template: 'Directory / Search', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'People & Society', item: 'Government & Politics', route: '/people/government-politics', template: 'Signal Boards', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'People & Society', item: 'Population & Demographics', route: '/people/population-demographics', template: 'Signal Boards', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'People & Society', item: 'Polls & Opinion', route: '/people/polls-opinion', template: 'Signal Boards', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'People & Society', item: 'Health & Medicine', route: '/people/health-medicine', template: 'Signal Boards', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'People & Society', item: 'Art & Culture', route: '/people/art-culture', template: 'Signal Boards', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'People & Society', item: 'Social Networks', route: '/people/social-networks', template: 'Signal Boards', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Economy & Industry', item: 'Macro Economics', route: '/economy/macro-economics', template: 'Sector Board / KPI + Signals', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Economy & Industry', item: 'Value Drivers', route: '/economy/value-drivers', template: 'Value Driver Tree', provenanceRibbon: true, commentCard: false, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Economy & Industry', item: 'Micro Economics', route: '/economy/micro-economics', template: 'Sector Board / KPI + Signals', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Economy & Industry', item: 'Labor Economics', route: '/economy/labor-economics', template: 'Sector Board / KPI + Signals', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Economy & Industry', item: 'Industry & Commerce', route: '/economy/industry-commerce', template: 'Sector Board / KPI + Signals', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Economy & Industry', item: 'Farming & Agriculture', route: '/economy/farming-agriculture', template: 'Sector Board / KPI + Signals', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Economy & Industry', item: 'Mining & Extraction', route: '/economy/mining-extraction', template: 'Sector Board / KPI + Signals', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Economy & Industry', item: 'Processing & Refinement', route: '/economy/processing-refinement', template: 'Sector Board / KPI + Signals', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Economy & Industry', item: 'Manufacturing & Assembly', route: '/economy/manufacturing-assembly', template: 'Sector Board / KPI + Signals', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Economy & Industry', item: 'Technology & Information', route: '/economy/technology-information', template: 'Sector Board / KPI + Signals', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Economy & Industry', item: 'Logistics Transport', route: '/economy/logistics-transport', template: 'Sector Board / KPI + Signals', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Capital & Markets', item: 'Indices & Funds', route: '/markets/indices-funds', template: 'Market Monitor / Watchlists', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Capital & Markets', item: 'Equities & Preferreds', route: '/markets/equities-preferreds', template: 'Market Monitor / Watchlists', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Capital & Markets', item: 'Debt & Fixed Income', route: '/markets/debt-fixed-income', template: 'Market Monitor / Watchlists', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Capital & Markets', item: 'Options & Derivatives', route: '/markets/options-derivatives', template: 'Market Monitor / Watchlists', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Capital & Markets', item: 'Currency / FX', route: '/markets/currency-fx', template: 'Market Monitor / Watchlists', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Capital & Markets', item: 'Crypto / Digital', route: '/markets/crypto-digital', template: 'Market Monitor / Watchlists', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Capital & Markets', item: 'Real-Assets', route: '/markets/real-assets', template: 'Market Monitor / Watchlists', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Capital & Markets', item: 'Alternative Investments', route: '/markets/alternative-investments', template: 'Market Monitor / Watchlists', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Weather & Natural Resources', item: 'Weather & Forecast', route: '/weather/forecast', template: 'Map Explorer + Timelines', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Weather & Natural Resources', item: 'Climate & Environment', route: '/weather/climate', template: 'Map Explorer + Indicators', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Weather & Natural Resources', item: 'Natural Resources', route: '/weather/resources', template: 'Resource Catalog + Map Layers', provenanceRibbon: false, commentCard: true, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Maps & Analytics', item: 'Map Workbench', route: '/map', template: 'GAIA OSM Map Explorer + Evidence', provenanceRibbon: true, commentCard: true, status: 'Exists (live)', implementation: 'live' },
  { domain: 'Maps & Analytics', item: '(Landing)', route: '/analytics', template: 'Workspace (Catalog • Models • Pipelines)', provenanceRibbon: false, commentCard: false, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Maps & Analytics', item: 'Portfolios & Watch Lists', route: '/analytics/portfolios-watch-lists', template: 'Analytics Module', provenanceRibbon: false, commentCard: false, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Maps & Analytics', item: 'Algorithmic Trading', route: '/analytics/algorithmic-trading', template: 'Analytics Module', provenanceRibbon: false, commentCard: false, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Maps & Analytics', item: 'Economic Programs', route: '/analytics/economic-programs', template: 'Analytics Module', provenanceRibbon: false, commentCard: false, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Maps & Analytics', item: 'Ontology & Epistemology', route: '/analytics/ontology-epistemology', template: 'Analytics Module', provenanceRibbon: false, commentCard: false, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Maps & Analytics', item: 'NLP & Information Extraction', route: '/analytics/nlp-information-extraction', template: 'Analytics Module', provenanceRibbon: false, commentCard: false, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Maps & Analytics', item: 'Sentiment Analytics', route: '/analytics/sentiment-analytics', template: 'Analytics Module', provenanceRibbon: false, commentCard: false, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Maps & Analytics', item: 'Entity Analytics', route: '/analytics/entity-analytics', template: 'Analytics Module', provenanceRibbon: false, commentCard: false, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Maps & Analytics', item: 'Behavioral Analytics', route: '/analytics/behavioral-analytics', template: 'Analytics Module', provenanceRibbon: false, commentCard: false, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Maps & Analytics', item: 'Mobile & App Development', route: '/analytics/mobile-app-development', template: 'Analytics Module', provenanceRibbon: false, commentCard: false, status: 'Exists (mocked)', implementation: 'mocked' },
  { domain: 'Maps & Analytics', item: 'Experiments & Simulations', route: '/analytics/experiments-simulations', template: 'Analytics Module', provenanceRibbon: false, commentCard: false, status: 'Exists (mocked)', implementation: 'mocked' },
];

export const topDomains = Array.from(new Set(domainSurfaces.map((surface) => surface.domain)));

export function surfacesForDomain(domain: string): DomainSurface[] {
  return domainSurfaces.filter((surface) => surface.domain === domain);
}

export function surfaceForRoute(route: string): DomainSurface | undefined {
  return domainSurfaces.find((surface) => surface.route === route);
}
