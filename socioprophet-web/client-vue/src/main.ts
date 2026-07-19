import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import { useAuth } from './stores/auth';
import { useResearch } from './stores/research';
import { domainSurfaces, surfaceForRoute } from './config/domainRoutes';
import { DOMAIN_MENU } from './config/cockpitNav';
import { registryEntryForPath } from './config/routeRegistry';
import Login from './pages/Login.vue';
import ResearchList from './pages/ResearchList.vue';
import CodeSearch from './pages/CodeSearch.vue';
import WorkstationPipelines from './pages/WorkstationPipelines.vue';
import WorkstationDeploy from './pages/WorkstationDeploy.vue';
import WorkstationServices from './pages/WorkstationServices.vue';
import WorkstationTerminal from './pages/WorkstationTerminal.vue';
import ModelLabs from './pages/ModelLabs.vue';
import Studio from './pages/Studio.vue';
import Discovery from './pages/Discovery.vue';
import DataSearch from './pages/DataSearch.vue';
import KnowledgeGraph from './pages/KnowledgeGraph.vue';
import ForgeImport from './pages/ForgeImport.vue';
import NewsFeed from './pages/NewsFeed.vue';
import MarketMonitor from './pages/MarketMonitor.vue';
import EconomySectorBoard from './pages/EconomySectorBoard.vue';
import ValueDriverTree from './pages/ValueDriverTree.vue';
import CausalValuation from './pages/CausalValuation.vue';
import Settings from './pages/Settings.vue';
import Provenance from './pages/Provenance.vue';
import PeopleDirectory from './pages/PeopleDirectory.vue';
import SocialSignals from './pages/SocialSignals.vue';
import LawDocket from './pages/LawDocket.vue';
import NoeticaChat from './pages/NoeticaChat.vue';
import WeatherMonitor from './pages/WeatherMonitor.vue';
import ControlPlaneLifecycle from './pages/ControlPlaneLifecycle.vue';
import NoeticaControlPlane from './pages/NoeticaControlPlane.vue';
import DomainSurfacePage from './pages/DomainSurfacePage.vue';
import FeedPage from './pages/FeedPage.vue';
import Journal from './pages/Journal.vue';
import MapPage from './pages/MapPage.vue';
import NLBootEvidence from './pages/NLBootEvidence.vue';
import PersonGraph from './pages/PersonGraph.vue';
import ProfessionalIntelligence from './pages/ProfessionalIntelligence.vue';
import Reader from './pages/Reader.vue';
import OperatorDashboard from './pages/OperatorDashboard.vue';
import AlgoTradingBoard from './pages/AlgoTradingBoard.vue';
import PortfolioBoard from './pages/PortfolioBoard.vue';
import OperatorSurface from './pages/OperatorSurface.vue';
import OntologySurface from './pages/OntologySurface.vue';
import UniverseViewer from './pages/UniverseViewer.vue';
import SupplyChainOrchestrator from './pages/SupplyChainOrchestrator.vue';
import HolographMe from './pages/HolographMe.vue';
import SituationsSurface from './pages/SituationsSurface.vue';
import NlpExtractionBench from './pages/NlpExtractionBench.vue';
import ExperimentsBoard from './pages/ExperimentsBoard.vue';
import BehavioralAnalytics from './pages/BehavioralAnalytics.vue';
import AppBuildBoard from './pages/AppBuildBoard.vue';
import AnalyticsStudio from './pages/AnalyticsStudio.vue';
import SupplyChainMap from './pages/SupplyChainMap.vue';
import DigitalTwin from './pages/DigitalTwin.vue';
import LandResources from './pages/LandResources.vue';
import AgenticOS from './pages/AgenticOS.vue';
import Marketplace from './pages/Marketplace.vue';
import LaborMarket from './pages/LaborMarket.vue';
import WorkbenchPage from './pages/WorkbenchPage.vue';
import ScopeDFabric from './pages/workbench/ScopeDFabric.vue';
import './styles.css';
import './components/workbench/primitives.css';

const explicitRoutes = [
  { path: '/', redirect: '/capability/dashboard' },
  { path: '/login', component: Login, meta: { public: true } },
  { path: '/capability/dashboard', component: OperatorDashboard },
  { path: '/agentic-os', component: AgenticOS },
  { path: '/marketplace', component: Marketplace },
  { path: '/people/labor-market', component: LaborMarket },
  // Capability-rail cells that are realized through an existing surface — the
  // capability keeps its own /capability/* URL + rail highlight, and the host
  // screen shows the capability as its header lens (via navScopeForPath).
  { path: '/capability/portfolios', component: PortfolioBoard },
  { path: '/operator/holograph-me', component: HolographMe },
  { path: '/operator/:id', component: OperatorSurface },
  { path: '/ontology', component: OntologySurface },
  { path: '/universe', component: UniverseViewer },
  { path: '/situations', component: SituationsSurface },
  { path: '/marketplace/orchestrate', component: SupplyChainOrchestrator },
  { path: '/capability/algorithmic-trading', component: AlgoTradingBoard },
  { path: '/capability/nlp-information-extraction', component: NlpExtractionBench },
  { path: '/capability/experiments-simulations', component: ExperimentsBoard },
  { path: '/capability/behavioral-analytics', component: BehavioralAnalytics },
  { path: '/capability/mobile-app-development', component: AppBuildBoard },
  // Maps & Analytics — the analytics trio (Maps itself is MapPage) shares one
  // Analytics Studio that charts the platform's existing fixtures.
  { path: '/analytics/supply-chain', component: SupplyChainMap },
  { path: '/analytics/digital-twin', component: DigitalTwin },
  // Layer 0 — Land & Natural Resources (the base of the economic model). Also
  // gives the Weather domain's "Natural Resources" sub-domain a real surface.
  { path: '/weather/natural-resources', component: LandResources },
  { path: '/analytics/trending-infographics', component: AnalyticsStudio },
  { path: '/analytics/charts-graphs', component: AnalyticsStudio },
  { path: '/analytics', component: AnalyticsStudio },
  { path: '/capability/entity-analytics', component: PeopleDirectory },
  { path: '/capability/sentiment-analytics', component: SocialSignals },
  { path: '/capability/ontology-epistemology', component: KnowledgeGraph },
  { path: '/capability/economic-prophet', component: CausalValuation },
  { path: '/research', component: ResearchList },
  { path: '/professional-intelligence', component: ProfessionalIntelligence },
  { path: '/control-plane', component: ControlPlaneLifecycle },
  { path: '/control-plane/org', component: NoeticaControlPlane },
  { path: '/nlboot', component: NLBootEvidence },
  { path: '/reader', component: Reader },
  { path: '/journal', component: Journal },
  { path: '/code', component: CodeSearch },
  { path: '/person-graph', component: PersonGraph },
  { path: '/map', component: MapPage },
  { path: '/feed', component: FeedPage },
  { path: '/workbench', component: WorkbenchPage },
  { path: '/workbench/scope-d', component: ScopeDFabric },
  { path: '/workstation/pipelines', component: WorkstationPipelines },
  { path: '/workstation/deploy', component: WorkstationDeploy },
  { path: '/workstation/services', component: WorkstationServices },
  { path: '/workstation/terminal', component: WorkstationTerminal },
  { path: '/ai/labs', component: ModelLabs },
  { path: '/studio', component: Studio },
  { path: '/discovery', component: Discovery },
  { path: '/data/search', component: DataSearch },
  { path: '/knowledge/graph', component: KnowledgeGraph },
  { path: '/forge/import', component: ForgeImport },
  { path: '/news', component: NewsFeed },
  { path: '/markets/indices-funds', component: MarketMonitor },
  { path: '/economy/macro-economics', component: EconomySectorBoard },
  { path: '/economy/value-drivers', component: ValueDriverTree },
  { path: '/economy/causal-valuation', component: CausalValuation },
  { path: '/settings', component: Settings },
  { path: '/control-plane/provenance', component: Provenance },
  { path: '/people/search', component: PeopleDirectory },
  { path: '/people/social-networks', component: SocialSignals },
  { path: '/law/international-law', component: LawDocket },
  { path: '/noetica', component: NoeticaChat },
  { path: '/weather/forecast', component: WeatherMonitor },
];

// Integration: every DOMAIN-axis sub-domain lands on its family's real flagship
// surface (scoped to that sub-domain in the header), instead of dead-ending on a
// generic mocked placeholder. A sub-domain with its own dedicated surface
// (e.g. Social Networks) is pinned via LEAF_OVERRIDE; the rest inherit the
// flagship keyed by their leading path segment.
const DOMAIN_FLAGSHIP: Record<string, unknown> = {
  news: NewsFeed,
  law: LawDocket,
  people: PeopleDirectory,
  economy: EconomySectorBoard,
  markets: MarketMonitor,
  weather: WeatherMonitor,
};
const LEAF_OVERRIDE: Record<string, unknown> = {
  '/people/social-networks': SocialSignals,
  '/map': MapPage,
};
const explicitPaths = new Set(explicitRoutes.map((r) => r.path));
const domainLeafRoutes = DOMAIN_MENU.flatMap((group) => group.items)
  .filter((leaf) => !explicitPaths.has(leaf.to))
  .map((leaf) => {
    const segment = leaf.to.split('/')[1];
    const component = LEAF_OVERRIDE[leaf.to] ?? DOMAIN_FLAGSHIP[segment];
    return component ? { path: leaf.to, component: component as never } : null;
  })
  .filter((r): r is { path: string; component: never } => r !== null);
const flagshipPaths = new Set(domainLeafRoutes.map((r) => r.path));

// Remaining not-yet-built cells (capability rail, analytics) keep the mocked
// surface — but only where a real flagship hasn't claimed the path.
const mockedSurfaceRoutes = domainSurfaces
  .filter((surface) => surface.route !== '/map' && !explicitPaths.has(surface.route) && !flagshipPaths.has(surface.route))
  .map((surface) => ({ path: surface.route, component: DomainSurfacePage }));

const routes = [
  ...explicitRoutes,
  ...domainLeafRoutes,
  ...mockedSurfaceRoutes,
  { path: '/:pathMatch(.*)*', component: DomainSurfacePage },
];

const router = createRouter({
  history: createWebHistory((import.meta as any).env.VITE_ROUTER_BASE || '/'),
  routes,
});

// Auth guard: wait for Firebase to resolve, then gate non-public routes.
// In local dev with no Firebase project, the auth store's DEV_AUTH_BYPASS
// resolves a stub user so this passes straight through.
router.beforeEach(async (to) => {
  const auth = useAuth();
  if (!auth.ready) {
    await new Promise<void>((resolve) => {
      const t = setInterval(() => { if (auth.ready) { clearInterval(t); resolve(); } }, 50);
    });
  }
  if (!to.meta.public && !auth.user) return '/login';
  if (to.path === '/login' && auth.user) return '/';
  return true;
});

// Track every visited route as an open working tab, so closing one can capture
// it into the durable research list (never lose research).
router.afterEach((to) => {
  if (to.path === '/login') return;
  const entry = registryEntryForPath(to.path);
  const surface = surfaceForRoute(to.path);
  const title = entry?.label || surface?.item || to.path;
  const domain = entry?.domain || surface?.domain;
  useResearch().trackVisit({ path: to.path, title, domain });
});

createApp(App).use(createPinia()).use(router).mount('#app');
