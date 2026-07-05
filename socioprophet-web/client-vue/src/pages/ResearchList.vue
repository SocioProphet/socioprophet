<script setup lang="ts">
import { computed } from 'vue';
import { useResearch } from '../stores/research';

const research = useResearch();
const openTabs = computed(() => research.openTabs);
const list = computed(() => [...research.researchList].sort((a, b) => b.capturedAt - a.capturedAt));

const fmt = (t?: number) => (t ? new Date(t).toLocaleString() : '—');

function copyExport() {
  const text = research.exportList();
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}
</script>

<template>
  <div class="research">
    <header class="research-header">
      <h1>Research Capture</h1>
      <p class="muted">
        Every open tab is disposable; the research is not. Closing a tab captures it here first —
        nothing is lost.
      </p>
    </header>

    <section class="card">
      <div class="row-between">
        <div class="section-title">Open working set ({{ openTabs.length }})</div>
        <div class="actions">
          <button class="btn" :disabled="!openTabs.length" @click="research.snapshotOpen()">
            Snapshot open → list
          </button>
          <button class="btn alt" :disabled="!openTabs.length" @click="research.closeAll()">
            Close all &amp; capture
          </button>
        </div>
      </div>
      <ul v-if="openTabs.length" class="tab-list">
        <li v-for="tab in openTabs" :key="tab.id">
          <div class="main">
            <span class="title">{{ tab.title }}</span>
            <span class="path">{{ tab.path }}</span>
            <span v-if="tab.domain" class="tag">{{ tab.domain }}</span>
          </div>
          <button class="btn small" @click="research.closeTab(tab.id)">Close &amp; capture</button>
        </li>
      </ul>
      <p v-else class="muted">No open tabs tracked yet — navigate around and they'll appear here.</p>
    </section>

    <section class="card">
      <div class="row-between">
        <div class="section-title">Research list ({{ list.length }})</div>
        <button class="btn small" :disabled="!list.length" @click="copyExport">Copy JSON</button>
      </div>
      <ul v-if="list.length" class="cap-list">
        <li v-for="item in list" :key="item.id">
          <div class="main">
            <span class="title">{{ item.title }}</span>
            <span class="path">{{ item.path }}</span>
            <span v-if="item.domain" class="tag">{{ item.domain }}</span>
            <span class="tag source">{{ item.source }}</span>
            <span class="time">{{ fmt(item.capturedAt) }}</span>
          </div>
          <div class="verbs">
            <span class="verb" title="Inferred / ML enrichment — pending adapter">Find similar</span>
            <span class="verb" title="Inferred / ML enrichment — pending adapter">Extract entities</span>
            <button class="btn small ghost" @click="research.removeCaptured(item.id)">Remove</button>
          </div>
        </li>
      </ul>
      <p v-else class="muted">Nothing captured yet.</p>
    </section>
  </div>
</template>

<style scoped>
.research { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0.25rem; }
.research-header h1 { margin: 0 0 0.25rem; font-size: 1.25rem; }
.muted { color: rgba(255, 255, 255, 0.55); font-size: 0.85rem; margin: 0; }
.card {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 0.9rem 1rem;
  background: rgba(255, 255, 255, 0.02);
}
.row-between { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.section-title { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.6); }
.actions { display: flex; gap: 0.5rem; }
.tab-list, .cap-list { list-style: none; margin: 0.75rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.tab-list li, .cap-list li {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 0.5rem 0.7rem;
}
.main { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; min-width: 0; }
.title { font-weight: 600; }
.path { color: rgba(255, 255, 255, 0.5); font-family: 'Roboto Mono', monospace; font-size: 0.78rem; }
.time { color: rgba(255, 255, 255, 0.4); font-size: 0.72rem; }
.tag {
  border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 999px; padding: 0.05rem 0.5rem;
  font-size: 0.7rem; color: rgba(255, 255, 255, 0.7);
}
.tag.source { text-transform: uppercase; letter-spacing: 0.03em; }
.verbs { display: flex; align-items: center; gap: 0.5rem; }
.verb { font-size: 0.72rem; color: rgba(255, 255, 255, 0.45); border-bottom: 1px dotted rgba(255, 255, 255, 0.3); cursor: default; }
.btn {
  border: 1px solid rgba(255, 255, 255, 0.22); border-radius: 6px; background: transparent;
  color: rgba(255, 255, 255, 0.88); padding: 0.3rem 0.7rem; font-size: 0.78rem; cursor: pointer;
}
.btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.08); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn.small { padding: 0.2rem 0.5rem; font-size: 0.74rem; }
.btn.alt { border-color: rgba(255, 180, 80, 0.5); color: rgba(255, 200, 130, 0.9); }
.btn.ghost { border-color: transparent; color: rgba(255, 120, 120, 0.8); }
</style>
