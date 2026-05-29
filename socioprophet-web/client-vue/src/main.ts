import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import { domainSurfaces } from './config/domainRoutes';
import ControlPlaneLifecycle from './pages/ControlPlaneLifecycle.vue';
import DomainSurfacePage from './pages/DomainSurfacePage.vue';
import FeedPage from './pages/FeedPage.vue';
import MapPage from './pages/MapPage.vue';
import NLBootEvidence from './pages/NLBootEvidence.vue';
import ProfessionalIntelligence from './pages/ProfessionalIntelligence.vue';
import Reader from './pages/Reader.vue';
import './styles.css';

const mockedSurfaceRoutes = domainSurfaces
  .filter((surface) => surface.route !== '/map')
  .map((surface) => ({ path: surface.route, component: DomainSurfacePage }));

const routes = [
  { path: '/', redirect: '/news' },
  { path: '/professional-intelligence', component: ProfessionalIntelligence },
  { path: '/control-plane', component: ControlPlaneLifecycle },
  { path: '/nlboot', component: NLBootEvidence },
  { path: '/reader', component: Reader },
  { path: '/map', component: MapPage },
  { path: '/feed', component: FeedPage },
  ...mockedSurfaceRoutes,
  { path: '/:pathMatch(.*)*', component: DomainSurfacePage },
];

const router = createRouter({
  history: createWebHistory((import.meta as any).env.VITE_ROUTER_BASE || '/'),
  routes,
});

createApp(App).use(router).mount('#app');
