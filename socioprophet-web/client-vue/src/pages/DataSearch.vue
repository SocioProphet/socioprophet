<template>
  <section class="surface" aria-label="Data Search">
    <header>
      <h1>Search</h1>
      <p>Local (<b>lampstand</b> desktop index) vs platform (<b>sherlock</b> evidence-answer) — side by side.</p>
    </header>
    <form class="bar" @submit.prevent="run">
      <input v-model="query" placeholder="Search files + knowledge…" />
      <button type="submit" :disabled="loading || !query.trim()">{{ loading ? '…' : 'Search' }}</button>
      <span class="scopes">
        <button v-for="sc in (['all', 'local', 'platform'] as const)" :key="sc" type="button" class="sc" :class="{ on: scope === sc }" @click="scope = sc">{{ sc }}</button>
      </span>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="cols">
      <div v-for="col in visibleCols" :key="col.key" class="col">
        <div class="ch" :style="{ color: col.tint }">{{ col.label }}
          <span v-if="col.r" class="count">{{ col.r.configured ? (col.r.ok ? `${col.r.hits.length} hits` : (col.r.error || 'unreachable')) : 'not configured' }}</span>
        </div>
        <template v-if="col.r">
          <p v-if="!col.r.configured" class="mut">Set the endpoint to enable {{ col.label.toLowerCase() }}.</p>
          <p v-else-if="!col.r.ok" class="err2">{{ col.r.error || 'unreachable' }}</p>
          <p v-else-if="col.r.hits.length === 0" class="mut">No results.</p>
          <div v-else v-for="(h, i) in col.r.hits" :key="i" class="hit">
            <div class="hrow"><span class="ht">{{ h.title || h.ref }}</span><span v-if="h.score > 0" class="hs">{{ h.score.toFixed(2) }}</span></div>
            <div v-if="h.snippet" class="hsnip">{{ h.snippet }}</div>
            <div v-if="h.ref" class="href">{{ h.ref }}</div>
          </div>
        </template>
        <p v-else class="mut">—</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { search, type SearchResult } from '../services/agentMachineApi';

const query = ref('');
const scope = ref<'all' | 'local' | 'platform'>('all');
const result = ref<SearchResult | null>(null);
const loading = ref(false);
const error = ref('');

async function run() {
  if (!query.value.trim() || loading.value) return;
  loading.value = true; error.value = '';
  try { result.value = await search(query.value.trim(), scope.value); }
  catch (e) { error.value = e instanceof Error ? e.message : 'search failed — is the Agent Machine running?'; }
  finally { loading.value = false; }
}

const visibleCols = computed(() => {
  const cols: Array<{ key: string; label: string; tint: string; r: SearchResult['local'] | undefined }> = [];
  if (scope.value !== 'platform') cols.push({ key: 'local', label: 'Local · lampstand', tint: '#4ade80', r: result.value?.local });
  if (scope.value !== 'local') cols.push({ key: 'platform', label: 'Platform · sherlock', tint: '#93c5fd', r: result.value?.platform });
  return cols;
});
</script>

<style scoped>
.surface { display: grid; gap: 1rem; max-width: 960px; margin: 1rem auto; padding: 1.5rem 1.75rem; background: #0d1117; color: rgba(255, 255, 255, 0.92); border: 1px solid #21262d; border-radius: 16px; }
h1 { margin: 0; font-size: 1.25rem; } header p { margin: 0.25rem 0 0; color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.bar input { flex: 1 1 240px; min-width: 0; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 10px; padding: 0.5rem 0.7rem; color: #fff; font-size: 0.9rem; }
.bar button { border: none; background: #2563eb; color: #fff; border-radius: 10px; padding: 0.5rem 0.9rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; } .bar button:disabled { opacity: 0.5; }
.scopes { display: flex; gap: 0.25rem; } .sc { background: transparent; border: none; color: rgba(255, 255, 255, 0.6); border-radius: 8px; padding: 0.4rem 0.6rem; font-size: 0.75rem; text-transform: capitalize; cursor: pointer; } .sc.on { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
.error, .err2 { color: #fca5a5; font-size: 0.82rem; } .mut { color: rgba(255, 255, 255, 0.45); font-size: 0.8rem; }
.cols { display: grid; grid-template-columns: 1fr; gap: 0.75rem; } @media (min-width: 720px) { .cols { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); } }
.col { border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 0.5rem; }
.ch { display: flex; justify-content: space-between; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.3rem 0.5rem; } .count { color: rgba(255, 255, 255, 0.4); }
.hit { padding: 0.4rem 0.55rem; border-radius: 8px; } .hit:hover { background: rgba(255, 255, 255, 0.05); }
.hrow { display: flex; gap: 0.5rem; } .ht { font-weight: 600; font-size: 0.82rem; } .hs { margin-left: auto; font-size: 0.66rem; color: rgba(255, 255, 255, 0.4); }
.hsnip { font-size: 0.76rem; color: rgba(255, 255, 255, 0.65); margin-top: 0.15rem; } .href { font-size: 0.64rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.15rem; }
</style>
