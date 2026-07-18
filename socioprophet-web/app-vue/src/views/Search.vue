<script setup lang="ts">
import { ref, computed } from "vue";
import { search, type BlendedResults, type SearchResult } from "../services/searchApi";

const q = ref("");
const loading = ref(false);
const error = ref("");
const data = ref<BlendedResults | null>(null);

const commons = computed(() => (data.value?.results ?? []).filter((r) => r.source === "commons"));
const web = computed(() => (data.value?.results ?? []).filter((r) => r.source === "web"));

async function run() {
  const query = q.value.trim();
  if (!query) return;
  loading.value = true;
  error.value = "";
  try {
    data.value = await search(query);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "search failed";
    data.value = null;
  } finally {
    loading.value = false;
  }
}

function hostOf(url: string): string {
  const m = url.match(/^[a-z]+:\/\/([^/]+)/i);
  return m ? m[1] : url.split("/")[0];
}
function isExternal(url: string): boolean {
  return url.startsWith("http");
}
</script>

<template>
  <div class="search" :class="{ landing: !data && !loading }">
    <header class="masthead">
      <div class="brand">socioprophet<span class="ai">.ai</span></div>
      <p class="tagline">Agentic search over the web <em>and</em> a sovereign commons the web can't index — grounded, cited, yours.</p>
    </header>

    <form class="box" @submit.prevent="run">
      <input
        v-model="q"
        type="search"
        placeholder="Ask anything…"
        aria-label="Search query"
        autofocus
      />
      <button type="submit" :disabled="loading">{{ loading ? "…" : "Search" }}</button>
    </form>

    <p v-if="data?.stub" class="note stub">Preview mode — showing sample results. Live results appear once the search gateway is connected.</p>
    <p v-if="data?.degraded?.web" class="note warn">Web results are temporarily unavailable — showing commons only.</p>
    <p v-if="data?.degraded?.commons" class="note warn">Commons results are temporarily unavailable — showing web only.</p>
    <p v-if="error" class="note err">{{ error }}</p>

    <section v-if="data && !loading" class="results">
      <div v-if="commons.length" class="group">
        <h2>⬡ Community commons <span class="count">{{ commons.length }}</span></h2>
        <article v-for="(r, i) in commons" :key="'c' + i" class="hit commons">
          <a v-if="isExternal(r.url)" :href="r.url" target="_blank" rel="noopener" class="title">{{ r.title }}</a>
          <span v-else class="title plain">{{ r.title }}</span>
          <div class="src">{{ hostOf(r.url) }} · <span class="badge sov">sovereign commons</span><span v-if="r.publishedDate" class="date"> · {{ new Date(r.publishedDate).toLocaleDateString() }}</span></div>
          <p class="snippet">{{ r.snippet }}</p>
        </article>
      </div>

      <div v-if="web.length" class="group">
        <h2>◍ Web <span class="count">{{ web.length }}</span></h2>
        <article v-for="(r, i) in web" :key="'w' + i" class="hit">
          <a :href="r.url" target="_blank" rel="noopener" class="title">{{ r.title }}</a>
          <div class="src">{{ hostOf(r.url) }} · <span class="badge">{{ r.engine }}</span></div>
          <p class="snippet">{{ r.snippet }}</p>
        </article>
      </div>

      <p v-if="!commons.length && !web.length" class="empty">Nothing found for “{{ data.query }}”. Try different words.</p>
    </section>
  </div>
</template>

<style scoped>
.search { padding: 24px 32px; font: 15px/1.55 var(--ui); color: var(--ink); height: 100%; overflow: auto; max-width: 780px; margin: 0 auto; }
.search.landing { display: flex; flex-direction: column; justify-content: center; }
.masthead { text-align: center; margin-bottom: 20px; }
.brand { font-size: 34px; font-weight: 700; letter-spacing: -0.5px; }
.brand .ai { color: var(--accent); }
.tagline { color: var(--muted); max-width: 560px; margin: 6px auto 0; }
.tagline em { color: var(--ink); font-style: normal; font-weight: 600; }

.search :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: var(--r-1); }
.box { display: flex; gap: var(--sp-2); margin: 8px 0 4px; }
.box input { flex: 1; padding: 13px 16px; font-size: 16px; border: 1px solid var(--hairline-strong); border-radius: var(--pill); outline: none; background: var(--surface); color: var(--ink); }
.box input:focus { border-color: var(--accent); box-shadow: 0 1px 6px color-mix(in srgb, var(--accent) 22%, transparent); }
.box button { padding: 0 22px; font-size: 15px; font-weight: 600; color: #fff; background: var(--accent); border: none; border-radius: var(--pill); cursor: pointer; }
.box button:disabled { opacity: 0.6; cursor: default; }

.note { font-size: 13px; margin: 10px 2px; padding: 8px 12px; border-radius: var(--r-2); }
.note.stub { background: var(--accent-wash); color: var(--accent-ink); }
.note.warn { background: var(--warn-wash); color: var(--warn); }
.note.err { background: var(--fail-wash); color: var(--fail); }

.results { margin-top: 14px; }
.group { margin-bottom: 26px; }
.group h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); border-bottom: 1px solid var(--sunken); padding-bottom: 6px; margin: 0 0 12px; }
.group h2 .count { color: var(--faint); font-weight: 400; font-variant-numeric: tabular-nums; }
.hit { margin-bottom: 16px; }
.hit .title { font-size: 18px; color: var(--accent-ink); text-decoration: none; }
.hit .title:hover { text-decoration: underline; }
.hit .title.plain { color: var(--ink); }
.hit .src { font-size: 12px; color: var(--muted); margin: 2px 0 3px; }
.hit .snippet { color: var(--ink-2); margin: 0; }
.hit.commons { border-left: 3px solid var(--accent); padding-left: 12px; }
.badge { font-size: 11px; border: 1px solid var(--hairline-strong); border-radius: var(--r-2); padding: 1px 6px; color: var(--muted); }
.badge.sov { border-color: var(--accent); color: var(--accent); }
.empty { color: var(--muted); }
</style>
