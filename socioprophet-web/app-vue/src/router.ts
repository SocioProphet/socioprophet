import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "./stores/auth";

const routes = [
  { path: "/", redirect: "/builder" },
  { path: "/login", component: () => import("./views/Login.vue"), meta: { public: true } },
  // socioprophet.ai — the agentic search surface. PUBLIC: you don't log in to search (login is for save/
  // personalize, later). Blends web + the sovereign commons via the search-gateway.
  { path: "/search", component: () => import("./views/Search.vue"), meta: { public: true } },
  { path: "/builder", component: () => import("./views/Builder.vue") },
  { path: "/builds", component: () => import("./views/Builds.vue") },
  { path: "/fleet", component: () => import("./views/Fleet.vue") },
  { path: "/mail", component: () => import("./views/Mail.vue") },
  { path: "/wiki", component: () => import("./views/Knowledge.vue") },
  { path: "/notes", component: () => import("./views/Knowledge.vue") },
  { path: "/cloud", component: () => import("./views/Cloud.vue") },
  { path: "/code", component: () => import("./views/Code.vue") },
  { path: "/market", component: () => import("./views/Market.vue") },
  // Lattice Studio — the integrated workbench (notebooks · data + model catalogs · tuning · reproducible
  // experiments), project-scoped so an agent team retrieves what's here. Authenticated.
  { path: "/studio", component: () => import("./views/Studio.vue") },
];

export const router = createRouter({ history: createWebHistory(), routes });

// Auth guard: wait for Socbase (Supabase) to resolve, then gate non-public routes.
router.beforeEach(async (to) => {
  const auth = useAuth();
  if (!auth.ready) {
    await new Promise<void>((resolve) => {
      const stop = (auth.$subscribe as any) ? null : null;
      const t = setInterval(() => { if (auth.ready) { clearInterval(t); resolve(); } }, 50);
    });
  }
  if (!to.meta.public && !auth.user) return "/login";
  if (to.path === "/login" && auth.user) return "/builder";
  return true;
});
