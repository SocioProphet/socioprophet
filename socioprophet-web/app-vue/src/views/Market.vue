<script setup lang="ts">
import { ref, computed } from "vue";
import { CATALOG, searchApps, validateManifest, installCommand, type PackageKind, type AppManifest } from "../services/marketplace";

const q = ref("");
const kind = ref<PackageKind | "">("");
const results = computed(() => searchApps(CATALOG, q.value, kind.value || undefined));
function assess(m: AppManifest) { return validateManifest(m); }
const kindLabel: Record<PackageKind, string> = { flatpak: "Flatpak", appimage: "AppImage", oci: "OCI", "mcp-plugin": "MCP" };
const riskColor: Record<string, string> = { low: "#137333", elevated: "#b06000", high: "#c5221f" };
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
.mkt { padding: 24px 32px; font: 14px/1.5 system-ui, sans-serif; color: #202124; overflow: auto; height: 100%; }
h1 { font-size: 26px; margin: 0 0 4px; } .tag { font-size: 12px; background: #e8f0fe; color: #1a73e8; padding: 2px 8px; border-radius: 10px; }
.lede { color: #5f6368; max-width: 720px; margin: 0 0 14px; }
.controls { display: flex; gap: 10px; margin-bottom: 18px; }
.controls input { flex: 1; max-width: 360px; padding: 6px 10px; border: 1px solid #dadce0; border-radius: 8px; }
.controls select { padding: 6px 10px; border: 1px solid #dadce0; border-radius: 8px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.card { border: 1px solid #e8eaed; border-radius: 10px; padding: 14px; background: #fff; }
.top { display: flex; justify-content: space-between; align-items: center; }
.name { font-weight: 600; font-size: 16px; } .badge { font-size: 11px; background: #f1f3f4; padding: 2px 8px; border-radius: 8px; }
.pub { color: #5f6368; font-size: 13px; } .remote { color: #1a73e8; }
.sum { font-size: 13px; margin: 8px 0; min-height: 32px; }
.meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
.pill { font-size: 11px; border: 1px solid #dadce0; border-radius: 10px; padding: 1px 7px; }
.pill.ok { color: #137333; border-color: #cde8d4; } .pill.warn { color: #b06000; border-color: #fde293; }
.warns { margin: 4px 0; padding-left: 16px; font-size: 12px; color: #c5221f; }
.install { display: block; background: #202124; color: #e8eaed; padding: 6px 8px; border-radius: 6px; font-size: 12px; overflow-x: auto; }
.none { color: #5f6368; padding: 20px 0; }
</style>
