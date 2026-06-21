import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "./stores/auth";

const routes = [
  { path: "/", redirect: "/builder" },
  { path: "/login", component: () => import("./views/Login.vue"), meta: { public: true } },
  { path: "/builder", component: () => import("./views/Builder.vue") },
  { path: "/builds", component: () => import("./views/Builds.vue") },
];

export const router = createRouter({ history: createWebHistory(), routes });

// Auth guard: wait for Firebase to resolve, then gate non-public routes.
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
