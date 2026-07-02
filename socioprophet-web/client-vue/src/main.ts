import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import { domainSurfaces } from './config/domainRoutes';
import CodeSearch from './pages/CodeSearch.vue';
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
  ...mockedSurfaceRoutes,
  { path: '/:pathMatch(.*)*', component: DomainSurfacePage },
];

const router = createRouter({
  history: createWebHistory((import.meta as any).env.VITE_ROUTER_BASE || '/'),
  routes,
});

createApp(App).use(router).mount('#app');
