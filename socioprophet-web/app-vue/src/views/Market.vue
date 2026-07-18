<script setup lang="ts">
import { ref, computed } from "vue";
import { CATALOG, searchApps, validateManifest, installCommand, type PackageKind, type AppManifest } from "../services/marketplace";

const q = ref("");
const kind = ref<PackageKind | "">("");
const results = computed(() => searchApps(CATALOG, q.value, kind.value || undefined));
function assess(m: AppManifest) { return validateManifest(m); }
const kindLabel: Record<PackageKind, string> = { flatpak: "Flatpak", appimage: "AppImage", oci: "OCI", "mcp-plugin": "MCP" };
const riskColor: Record<string, string> = { low: "var(--ok)", elevated: "var(--warn)", high: "var(--fail)" };
</script>

<template>
  <div class="mkt">
    <header>
      <h1>⬢ Marketplace <span class="tag">Linux-first · Flatpak-native</span></h1>
      <p class="lede">Federates Flathub + our sovereign OSTree remote. Every app's sandbox permissions are governed by scope-d — we don't just show permissions, we gate them.</p>
      <div class="controls">
        <input v-model="q" placeholder="Search apps…" />
        <select v-model="kind">
          <option value="">all kinds</option>
          <option value="flatpak">Flatpak</option><option value="oci">OCI</option><option value="mcp-plugin">MCP</option>
        </select>
      </div>
    </header>

    <p v-if="!results.length" class="none">No apps match “{{ q }}”. Try a different search or kind.</p>
    <div class="grid">
      <article v-for="m in results" :key="m.id" class="card">
        <div class="top">
          <span class="name">{{ m.name }}</span>
          <span class="badge">{{ kindLabel[m.kind] }}</span>
        </div>
        <div class="pub">{{ m.publisher }} <span v-if="m.flatpak" class="remote">· {{ m.flatpak.remote }}</span></div>
        <p class="sum">{{ m.summary }}</p>
        <div class="meta">
          <span v-if="m.localFirst" class="pill ok">local-first</span>
          <span v-else class="pill warn">not local-first</span>
          <span v-if="m.signature" class="pill ok">signed</span>
          <span v-else class="pill warn">unsigned</span>
          <span class="pill" :style="{ color: riskColor[assess(m).risk], borderColor: riskColor[assess(m).risk] }">perm: {{ assess(m).risk }}</span>
        </div>
        <ul v-if="assess(m).warnings.length" class="warns">
          <li v-for="w in assess(m).warnings.filter(x => x.startsWith('HIGH') || x.startsWith('elevated'))" :key="w">{{ w }}</li>
        </ul>
        <code class="install">{{ installCommand(m) }}</code>
      </article>
    </div>
  </div>
</template>

<style scoped>
.mkt { padding: 24px 32px; font: 14px/1.5 var(--ui); color: var(--ink); overflow: auto; height: 100%; }
h1 { font-size: 26px; margin: 0 0 4px; } .tag { font-size: 12px; background: var(--accent-wash); color: var(--accent); padding: 2px 8px; border-radius: 10px; }
.lede { color: var(--muted); max-width: 720px; margin: 0 0 14px; }
.controls { display: flex; gap: 10px; margin-bottom: 18px; }
.controls input { flex: 1; max-width: 360px; padding: 6px 10px; border: 1px solid var(--hairline-strong); border-radius: 8px; }
.controls select { padding: 6px 10px; border: 1px solid var(--hairline-strong); border-radius: 8px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.card { border: 1px solid var(--hairline); border-radius: 10px; padding: 14px; background: #fff; }
.top { display: flex; justify-content: space-between; align-items: center; }
.name { font-weight: 600; font-size: 16px; } .badge { font-size: 11px; background: var(--sunken); padding: 2px 8px; border-radius: 8px; }
.pub { color: var(--muted); font-size: 13px; } .remote { color: var(--accent); }
.sum { font-size: 13px; margin: 8px 0; min-height: 32px; }
.meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
.pill { font-size: 11px; border: 1px solid var(--hairline-strong); border-radius: 10px; padding: 1px 7px; }
.pill.ok { color: var(--ok); border-color: #cde8d4; } .pill.warn { color: var(--warn); border-color: #fde293; }
.warns { margin: 4px 0; padding-left: 16px; font-size: 12px; color: var(--fail); }
.install { display: block; background: var(--ink); color: var(--hairline); padding: 6px 8px; border-radius: 6px; font-size: 12px; overflow-x: auto; }
.none { color: var(--muted); padding: 20px 0; }
</style>
