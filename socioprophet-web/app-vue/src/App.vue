<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand-block">
        <div class="brand">SocioProphet</div>
        <div class="subbrand">Portal shell · Vue migration pass</div>
      </div>

      <nav class="toplinks">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/research">Research</RouterLink>
        <RouterLink to="/builder">Builder</RouterLink>
        <RouterLink to="/policies">Policies</RouterLink>
        <RouterLink to="/terminal">Terminal</RouterLink>
        <RouterLink to="/settings">Settings</RouterLink>
      </nav>
    </header>

    <div class="body">
      <aside class="sidebar">
        <div class="section">Workspace</div>
        <RouterLink v-for="item in workspace" :key="item.to" class="item" :to="item.to">{{ item.label }}</RouterLink>

        <div class="section">Governance</div>
        <RouterLink v-for="item in governance" :key="item.to" class="item" :to="item.to">{{ item.label }}</RouterLink>

        <div class="section">Platform</div>
        <RouterLink v-for="item in platform" :key="item.to" class="item" :to="item.to">{{ item.label }}</RouterLink>
      </aside>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";

type NavItem = { label: string; to: string };

const workspace: NavItem[] = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Research", to: "/research" },
  { label: "Builder", to: "/builder" },
  { label: "Entities", to: "/entities" },
  { label: "Reader", to: "/reader" },
  { label: "Code Search", to: "/code" },
  { label: "Journal", to: "/journal" },
];

const governance: NavItem[] = [
  { label: "Policies", to: "/policies" },
  { label: "Datasets", to: "/datasets" },
  { label: "Gates", to: "/gates" },
  { label: "Attestations", to: "/attestations" },
  { label: "Credentials", to: "/credentials" },
  { label: "Filters", to: "/filters" },
  { label: "Compliance", to: "/compliance" },
];

const platform: NavItem[] = [
  { label: "Layouts", to: "/layouts" },
  { label: "Stories", to: "/stories" },
  { label: "Specs", to: "/specs" },
  { label: "Runs", to: "/runs" },
  { label: "Experiments", to: "/experiments" },
  { label: "Console", to: "/console" },
  { label: "Terminal", to: "/terminal" },
  { label: "Settings", to: "/settings" },
  { label: "UI Kit", to: "/uikit" },
];
</script>

<style scoped>
.app-shell { min-height: 100vh; background: #0b0f19; color: #f8fafc; }
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.15rem;
  border-bottom: 1px solid rgba(255,255,255,0.12);
  background: rgba(11, 15, 25, 0.84);
  backdrop-filter: blur(12px);
}
.brand-block { display: flex; flex-direction: column; gap: 0.15rem; }
.brand { font-weight: 800; letter-spacing: 0.02em; }
.subbrand { font-size: 0.82rem; color: rgba(255,255,255,0.68); }
.toplinks { display: flex; gap: 0.85rem; flex-wrap: wrap; }
.toplinks a { color: #f8fafc; text-decoration: none; opacity: 0.84; }
.toplinks a.router-link-active { opacity: 1; text-decoration: underline; font-weight: 700; }

.body { display: grid; grid-template-columns: 270px 1fr; min-height: calc(100vh - 64px); }
.sidebar {
  border-right: 1px solid rgba(255,255,255,0.10);
  padding: 1rem 0.85rem;
  background: rgba(255,255,255,0.02);
}
.section {
  margin: 1rem 0.5rem 0.55rem;
  font-size: 0.72rem;
  opacity: 0.72;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.item {
  display: block;
  padding: 0.55rem 0.75rem;
  border-radius: 0.75rem;
  color: #f8fafc;
  text-decoration: none;
  opacity: 0.86;
}
.item:hover { background: rgba(255,255,255,0.06); opacity: 1; }
.item.router-link-active {
  background: rgba(255,255,255,0.10);
  font-weight: 700;
  opacity: 1;
}
.content { padding: 1.1rem 1.25rem; }

@media (max-width: 960px) {
  .body { grid-template-columns: 1fr; }
  .sidebar { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.10); }
  .topbar { align-items: flex-start; flex-direction: column; }
}
</style>
