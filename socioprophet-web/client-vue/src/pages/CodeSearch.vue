<template>
  <section class="adapter-page" aria-labelledby="code-search-title">
    <header class="adapter-hero">
      <div>
        <p class="adapter-kicker">Code Search · TriRPC fixture seam</p>
        <h1 id="code-search-title">Code Search</h1>
        <p>
          Fixture-backed code-search surface. This page exercises the UI contract only and does not
          query GitHub, Sourcegraph, or any live code index.
        </p>
      </div>
      <span class="adapter-pill adapter-pill--warn">mock only</span>
    </header>

    <section class="adapter-card search-row">
      <input v-model="query" placeholder="query" @keyup.enter="run" />
      <button type="button" @click="run">Search</button>
    </section>

    <section class="adapter-card adapter-boundary">
      <strong>Boundary</strong>
      <p>Results come from the local mock adapter. No repository indexing, credential access, or remote search is declared here.</p>
    </section>

    <section class="adapter-grid">
      <article v-for="result in results" :key="result.repo + result.path" class="adapter-card">
        <strong>{{ result.repo }}:{{ result.path }}</strong>
        <p>{{ result.preview }}</p>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { triRpc, type CodeSearchResult } from '../services/triRpc';

const query = ref('main');
const results = ref<CodeSearchResult[]>([]);

async function run() {
  const response = await triRpc.code.search({ query: query.value });
  results.value = response.results || [];
}
</script>

<style scoped>
.adapter-page { display: grid; gap: 1rem; color: var(--text, #f4f4f4); }
.adapter-hero, .adapter-card { border: 1px solid rgba(255,255,255,.14); border-radius: 18px; background: rgba(20,24,31,.82); box-shadow: 0 18px 48px rgba(0,0,0,.22); }
.adapter-hero { display: flex; justify-content: space-between; gap: 1rem; padding: 1.5rem; }
.adapter-kicker { margin: 0 0 .4rem; color: var(--accent, #78a9ff); font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
h1, p { margin-top: 0; }
p { color: rgba(255,255,255,.70); }
.adapter-card { padding: 1rem; }
.adapter-boundary { border-color: rgba(241,194,27,.45); background: rgba(241,194,27,.08); }
.adapter-pill { display: inline-flex; align-items: center; height: fit-content; border-radius: 999px; padding: .2rem .55rem; font-size: .72rem; font-weight: 800; text-transform: uppercase; background: rgba(120,169,255,.15); color: var(--accent, #78a9ff); }
.adapter-pill--warn { background: rgba(241,194,27,.18); color: #f1c21b; }
.adapter-grid { display: grid; gap: 1rem; }
.search-row { display: flex; gap: .75rem; }
input { flex: 1; min-width: 0; border: 1px solid rgba(255,255,255,.24); border-radius: 12px; padding: .75rem; background: rgba(255,255,255,.08); color: var(--text, #f4f4f4); }
button { border: 0; border-radius: 12px; padding: .75rem 1rem; background: var(--accent, #78a9ff); color: #06111f; font-weight: 800; cursor: pointer; }
</style>
