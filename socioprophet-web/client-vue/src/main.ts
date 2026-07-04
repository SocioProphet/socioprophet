import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import { useAuth } from './stores/auth';
import { useResearch } from './stores/research';
import { domainSurfaces, surfaceForRoute } from './config/domainRoutes';
import { registryEntryForPath } from './config/routeRegistry';
import Login from './pages/Login.vue';
import ResearchList from './pages/ResearchList.vue';
import CodeSearch from './pages/CodeSearch.vue';
import WorkstationPipelines from './pages/WorkstationPipelines.vue';
import WorkstationDeploy from './pages/WorkstationDeploy.vue';
import WorkstationServices from './pages/WorkstationServices.vue';
import WorkstationTerminal from './pages/WorkstationTerminal.vue';
import ModelLabs from './pages/ModelLabs.vue';
import DataSearch from './pages/DataSearch.vue';
import KnowledgeGraph from './pages/KnowledgeGraph.vue';
import ForgeImport from './pages/ForgeImport.vue';
import NewsFeed from './pages/NewsFeed.vue';
import MarketMonitor from './pages/MarketMonitor.vue';
import EconomySectorBoard from './pages/EconomySectorBoard.vue';
import PeopleDirectory from './pages/PeopleDirectory.vue';
import SocialSignals from './pages/SocialSignals.vue';
import LawDocket from './pages/LawDocket.vue';
import NoeticaChat from './pages/NoeticaChat.vue';
import ControlPlaneLifecycle from './pages/ControlPlaneLifecycle.vue';
import DomainSurfacePage from './pages/DomainSurfacePage.vue';
import FeedPage from './pages/FeedPage.vue';
import Journal from './pages/Journal.vue';
import MapPage from './pages/MapPage.vue';
import NLBootEvidence from './pages/NLBootEvidence.vue';
import PersonGraph from './pages/PersonGraph.vue';
import ProfessionalIntelligence from './pages/ProfessionalIntelligence.vue';
import Reader from './pages/Reader.vue';
import WorkbenchPage from './pages/WorkbenchPage.vue';
import ScopeDFabric from './pages/workbench/ScopeDFabric.vue';
import './styles.css';
import './components/workbench/primitives.css';

const mockedSurfaceRoutes = domainSurfaces
  .filter((surface) => surface.route !== '/map')
  .map((surface) => ({ path: surface.route, component: DomainSurfacePage }));

const routes = [
  { path: '/', redirect: '/news' },
  { path: '/login', component: Login, meta: { public: true } },
  { path: '/research', component: ResearchList },
  { path: '/professional-intelligence', component: ProfessionalIntelligence },
  { path: '/control-plane', component: ControlPlaneLifecycle },
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
  { path: '/data/search', component: DataSearch },
  { path: '/knowledge/graph', component: KnowledgeGraph },
  { path: '/forge/import', component: ForgeImport },
  { path: '/news', component: NewsFeed },
  { path: '/markets/indices-funds', component: MarketMonitor },
  { path: '/economy/macro-economics', component: EconomySectorBoard },
  { path: '/people/search', component: PeopleDirectory },
  { path: '/people/social-networks', component: SocialSignals },
  { path: '/law/international-law', component: LawDocket },
  { path: '/noetica', component: NoeticaChat },
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
