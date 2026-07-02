export type RouteMaturity = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type RouteStateMode = 'design' | 'fixture' | 'mock-adapter' | 'live-fallback' | 'live-only' | 'taxonomy';
export type NavTier = 'top' | 'left-rail' | 'tab-only' | 'hidden';

export type RouteRegistryEntry = {
  path: string;
  label: string;
  domain: string;
  maturity: RouteMaturity;
  stateMode: RouteStateMode;
  navTier: NavTier;
  userJob: string;
  ownerPlane: string;
  boundary: string;
  primaryObject: string;
  breadcrumbs: string[];
  railLabel?: string;
  tabs?: Array<{ label: string; to: string }>;
};

export const routeRegistry: RouteRegistryEntry[] = [
  {
    path: '/news',
    label: 'News & Events',
    domain: 'News & Events',
    maturity: 'L1',
    stateMode: 'taxonomy',
    navTier: 'top',
    userJob: 'Enter the news and event intelligence taxonomy.',
    ownerPlane: 'client-vue taxonomy scaffold',
    boundary: 'Mock taxonomy route; not a live feed surface.',
    primaryObject: 'domain route',
    breadcrumbs: ['News & Events'],
    railLabel: '☷',
  },
  {
    path: '/map',
    label: 'Maps',
    domain: 'Maps & Analytics',
    maturity: 'L4',
    stateMode: 'live-fallback',
    navTier: 'top',
    userJob: 'Review GAIA/OpenStreetMap world-model evidence and fallback posture.',
    ownerPlane: 'Prophet Platform OSM Map API + client-vue shell',
    boundary: 'Live API or deterministic demo fallback; no production tile serving or safety-critical navigation.',
    primaryObject: 'map workbench',
    breadcrumbs: ['Maps & Analytics', 'OpenStreetMap', 'GAIA world model'],
    railLabel: '⌖',
    tabs: [{ label: 'Map Workbench', to: '/map' }],
  },
  {
    path: '/professional-intelligence',
    label: 'Professional Intelligence',
    domain: 'Professional Intelligence',
    maturity: 'L2',
    stateMode: 'fixture',
    navTier: 'top',
    userJob: 'Review operating alignment, gates, controls, and replayed evidence posture.',
    ownerPlane: 'client-vue product-control fixture; future live source in Prophet Platform/DelEx',
    boundary: 'Fixture-backed evidence surface; no live telemetry or runtime authority.',
    primaryObject: 'operating dashboard state',
    breadcrumbs: ['Professional Intelligence OS', 'Operating dashboard'],
    railLabel: 'PI',
    tabs: [
      { label: 'Operating Dashboard', to: '/professional-intelligence' },
      { label: 'Gates', to: '/gates' },
      { label: 'Policies', to: '/policies' },
      { label: 'Runs', to: '/runs' },
      { label: 'Attestations', to: '/attestations' },
    ],
  },
  {
    path: '/control-plane',
    label: 'SourceOS',
    domain: 'SourceOS Lifecycle',
    maturity: 'L2',
    stateMode: 'fixture',
    navTier: 'top',
    userJob: 'Review SourceOS ReleaseSet and BootReleaseSet lifecycle posture.',
    ownerPlane: 'client-vue evidence surface; contracts owned by SourceOS/NLBoot repos',
    boundary: 'Evidence-only; no enrollment, device assignment, disk write, reboot, or host mutation.',
    primaryObject: 'lifecycle evidence state',
    breadcrumbs: ['SourceOS Lifecycle', 'Control-plane evidence'],
    railLabel: 'CP',
    tabs: [
      { label: 'Lifecycle Control', to: '/control-plane' },
      { label: 'NLBoot Evidence', to: '/nlboot' },
      { label: 'Gates', to: '/gates' },
      { label: 'Attestations', to: '/attestations' },
    ],
  },
  {
    path: '/nlboot',
    label: 'NLBoot Evidence',
    domain: 'SourceOS Lifecycle',
    maturity: 'L2',
    stateMode: 'fixture',
    navTier: 'left-rail',
    userJob: 'Inspect NLBoot plan, artifact cache, proof, adapter, and boot-entry records.',
    ownerPlane: 'client-vue evidence surface; NLBoot owns executable contracts',
    boundary: 'Evidence-only; no boot commands, EFI mutation, disk writes, reboots, or hardware contact.',
    primaryObject: 'boot evidence records',
    breadcrumbs: ['SourceOS Lifecycle', 'NLBoot evidence'],
    railLabel: 'NB',
  },
  {
    path: '/reader',
    label: 'Reader',
    domain: 'Feed Intelligence',
    maturity: 'L2',
    stateMode: 'fixture',
    navTier: 'left-rail',
    userJob: 'Review feed-intelligence item normalization, membrane, memory, and graph intent.',
    ownerPlane: 'client-vue fixture; future contracts in BearBrowser, SlashTopics, New Hope, MemoryMesh, MeshRush',
    boundary: 'UI-first fixture; no live feed fetching, ActivityPub, MemoryMesh writeback, MeshRush traversal, or browser bridge.',
    primaryObject: 'canonical feed item',
    breadcrumbs: ['Feed Intelligence', 'Reader'],
    railLabel: '▤',
  },
  {
    path: '/journal',
    label: 'Adapter Seams',
    domain: 'Adapter Seams',
    maturity: 'L3',
    stateMode: 'mock-adapter',
    navTier: 'left-rail',
    userJob: 'Inspect fixture-backed journal event stream shape.',
    ownerPlane: 'client-vue mock TriRPC seam',
    boundary: 'Mock/test mode only; no live backend stream, authorization, or writeback.',
    primaryObject: 'journal event',
    breadcrumbs: ['Adapter Seams', 'Journal stream'],
    railLabel: 'J',
    tabs: [
      { label: 'Journal', to: '/journal' },
      { label: 'Code Search', to: '/code' },
      { label: 'Reader', to: '/reader' },
    ],
  },
  {
    path: '/code',
    label: 'Code Search',
    domain: 'Adapter Seams',
    maturity: 'L3',
    stateMode: 'mock-adapter',
    navTier: 'left-rail',
    userJob: 'Inspect fixture-backed code-search result shape.',
    ownerPlane: 'client-vue mock TriRPC seam',
    boundary: 'Mock/test mode only; no GitHub, Sourcegraph, credential access, or repository indexing.',
    primaryObject: 'code search result',
    breadcrumbs: ['Adapter Seams', 'Code search'],
    railLabel: 'CS',
  },
  {
    path: '/law/international-law',
    label: 'Law & Regulation',
    domain: 'Law & Regulation',
    maturity: 'L1',
    stateMode: 'taxonomy',
    navTier: 'top',
    userJob: 'Enter the law and regulation taxonomy.',
    ownerPlane: 'client-vue taxonomy scaffold',
    boundary: 'Mock taxonomy route; not a live legal intelligence feature.',
    primaryObject: 'domain route',
    breadcrumbs: ['Law & Regulation', 'International Law'],
  },
  {
    path: '/people/search',
    label: 'People & Society',
    domain: 'People & Society',
    maturity: 'L1',
    stateMode: 'taxonomy',
    navTier: 'top',
    userJob: 'Enter the people and society taxonomy.',
    ownerPlane: 'client-vue taxonomy scaffold',
    boundary: 'Mock taxonomy route; not a live people-search feature.',
    primaryObject: 'domain route',
    breadcrumbs: ['People & Society', 'Search'],
    railLabel: '◫',
  },
  {
    path: '/economy/macro-economics',
    label: 'Economy & Industry',
    domain: 'Economy & Industry',
    maturity: 'L1',
    stateMode: 'taxonomy',
    navTier: 'top',
    userJob: 'Enter the economy and industry taxonomy.',
    ownerPlane: 'client-vue taxonomy scaffold',
    boundary: 'Mock taxonomy route; not a live economic-intelligence feature.',
    primaryObject: 'domain route',
    breadcrumbs: ['Economy & Industry', 'Macro Economics'],
    railLabel: '◔',
  },
  {
    path: '/markets/indices-funds',
    label: 'Capital & Markets',
    domain: 'Capital & Markets',
    maturity: 'L1',
    stateMode: 'taxonomy',
    navTier: 'top',
    userJob: 'Enter the capital and markets taxonomy.',
    ownerPlane: 'client-vue taxonomy scaffold',
    boundary: 'Mock taxonomy route; not a live markets feature.',
    primaryObject: 'domain route',
    breadcrumbs: ['Capital & Markets', 'Indices & Funds'],
    railLabel: '▥',
  },
  {
    path: '/weather/forecast',
    label: 'Weather & Resources',
    domain: 'Weather & Resources',
    maturity: 'L1',
    stateMode: 'taxonomy',
    navTier: 'top',
    userJob: 'Enter the weather and resources taxonomy.',
    ownerPlane: 'client-vue taxonomy scaffold',
    boundary: 'Mock taxonomy route; not a live weather feature.',
    primaryObject: 'domain route',
    breadcrumbs: ['Weather & Resources', 'Forecast'],
  },
  {
    path: '/analytics',
    label: 'Analytics',
    domain: 'Maps & Analytics',
    maturity: 'L1',
    stateMode: 'taxonomy',
    navTier: 'left-rail',
    userJob: 'Enter analytics scaffold.',
    ownerPlane: 'client-vue taxonomy scaffold',
    boundary: 'Mock taxonomy route; not a live analytics feature.',
    primaryObject: 'domain route',
    breadcrumbs: ['Maps & Analytics', 'Analytics'],
    railLabel: '⌁',
  },
  {
    path: '/workbench',
    label: 'Operator Workbench',
    domain: 'Operator Workbench',
    maturity: 'L1',
    stateMode: 'design',
    navTier: 'top',
    userJob: 'Navigate the IBM-Carbon operator surfaces (Axonius asset graph, SCOPE-D, Orion, wargames) and the estate/cognitive-systems architecture maps.',
    ownerPlane: 'client-vue static render-harness (public/workbench); IBM-Carbon fidelity mirror, migrating to native components',
    boundary: 'Design render-harness mounted in an iframe; no live data or runtime authority.',
    primaryObject: 'operator surface',
    breadcrumbs: ['Operator Workbench', 'Surfaces'],
    railLabel: 'WB',
    tabs: [
      { label: 'Render-harness', to: '/workbench' },
      { label: 'SCOPE-D (native)', to: '/workbench/scope-d' },
    ],
  },
  {
    path: '/workbench/scope-d',
    label: 'SCOPE-D Fabric',
    domain: 'Operator Workbench',
    maturity: 'L1',
    stateMode: 'design',
    navTier: 'tab-only',
    userJob: 'Inspect the SCOPE-D collector-policy fabric (axiom chain A1–A7, E4/E5/E6 lanes, admissibility gate) as native Vue+Carbon components.',
    ownerPlane: 'client-vue native components (src/components/workbench); first screen of the render-harness → native migration',
    boundary: 'Design surface with static spec data; no live collector telemetry, PEP verdict resolution, or runtime authority.',
    primaryObject: 'collector-policy fabric',
    breadcrumbs: ['Operator Workbench', 'SCOPE-D'],
    railLabel: 'SD',
    tabs: [
      { label: 'Render-harness', to: '/workbench' },
      { label: 'SCOPE-D (native)', to: '/workbench/scope-d' },
    ],
  },
];

export function routesForNavTier(tier: NavTier): RouteRegistryEntry[] {
  return routeRegistry.filter((route) => route.navTier === tier);
}

export function registryEntryForPath(path: string): RouteRegistryEntry | undefined {
  return routeRegistry.find((entry) => path === entry.path || path.startsWith(`${entry.path}/`));
}

export function entriesForDomain(domain: string): RouteRegistryEntry[] {
  return routeRegistry.filter((entry) => entry.domain === domain);
}

export function topNavRoutes(): RouteRegistryEntry[] {
  return routesForNavTier('top');
}

export function leftRailRoutes(): RouteRegistryEntry[] {
  return routeRegistry.filter((entry) => entry.navTier === 'top' || entry.navTier === 'left-rail');
}
