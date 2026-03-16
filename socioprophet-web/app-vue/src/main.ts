import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import "./styles.css";

import Attestations from "./pages/Attestations.vue";
import Builder from "./pages/Builder.vue";
import CodeSearch from "./pages/CodeSearch.vue";
import Compliance from "./pages/Compliance.vue";
import Credentials from "./pages/Credentials.vue";
import Dashboard from "./pages/Dashboard.vue";
import Datasets from "./pages/Datasets.vue";
import Entities from "./pages/Entities.vue";
import Experiments from "./pages/Experiments.vue";
import Filters from "./pages/Filters.vue";
import Gates from "./pages/Gates.vue";
import Journal from "./pages/Journal.vue";
import Layouts from "./pages/Layouts.vue";
import NotFound from "./pages/NotFound.vue";
import Policies from "./pages/Policies.vue";
import PorterConsole from "./pages/PorterConsole.vue";
import Reader from "./pages/Reader.vue";
import Research from "./pages/Research.vue";
import Runs from "./pages/Runs.vue";
import Settings from "./pages/Settings.vue";
import SpecManager from "./pages/SpecManager.vue";
import Stories from "./pages/Stories.vue";
import Terminal from "./pages/Terminal.vue";
import UiKit from "./pages/UiKit.vue";

const routes = [
  { path: "/", redirect: "/dashboard" },
  { path: "/dashboard", component: Dashboard },
  { path: "/research", component: Research },
  { path: "/builder", component: Builder },
  { path: "/entities", component: Entities },
  { path: "/layouts", component: Layouts },
  { path: "/reader", component: Reader },
  { path: "/code", component: CodeSearch },
  { path: "/journal", component: Journal },
  { path: "/stories", component: Stories },
  { path: "/specs", component: SpecManager },
  { path: "/runs", component: Runs },
  { path: "/experiments", component: Experiments },
  { path: "/policies", component: Policies },
  { path: "/datasets", component: Datasets },
  { path: "/gates", component: Gates },
  { path: "/attestations", component: Attestations },
  { path: "/credentials", component: Credentials },
  { path: "/filters", component: Filters },
  { path: "/compliance", component: Compliance },
  { path: "/terminal", component: Terminal },
  { path: "/console", component: PorterConsole },
  { path: "/settings", component: Settings },
  { path: "/uikit", component: UiKit },
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

const base = (import.meta as any).env?.VITE_ROUTER_BASE || "/";

const router = createRouter({
  history: createWebHistory(base),
  routes,
});

createApp(App).use(router).mount("#app");
