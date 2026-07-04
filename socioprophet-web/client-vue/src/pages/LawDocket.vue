<template>
  <section class="lw" aria-label="Legal docket">
    <header class="lw-toolbar">
      <div class="lw-title"><h1>Docket</h1><span class="lw-pill">fixture</span></div>
      <div class="lw-filters">
        <button v-for="s in statuses" :key="s" class="lw-fbtn" :class="{ on: status === s }" @click="setStatus(s)">{{ s }}</button>
      </div>
    </header>

    <div class="lw-body">
      <!-- Docket list -->
      <div class="lw-list" aria-label="Dockets">
        <p class="lw-count">{{ results.length }} item{{ results.length === 1 ? '' : 's' }}</p>
        <button
          v-for="d in results"
          :key="d.id"
          class="lw-row"
          :class="{ on: d.id === selectedId }"
          @click="selectedId = d.id"
        >
          <div class="lw-row-top">
            <span class="lw-type" :class="d.type">{{ d.type }}</span>
            <span class="lw-cite">{{ d.cite }}</span>
            <span class="lw-status" :class="d.status">{{ d.status }}</span>
          </div>
          <div class="lw-row-title">{{ d.title }}</div>
          <div class="lw-row-meta">{{ d.jurisdiction }} · updated {{ relative(d.updated) }}</div>
        </button>
        <p v-if="results.length === 0" class="lw-empty">No items with that status.</p>
      </div>

      <!-- Detail + redline -->
      <article v-if="selected" class="lw-detail" aria-label="Docket detail">
        <!-- provenance ribbon -->
        <div class="lw-ribbon">
          <span class="lw-ribbon-k">provenance</span>
          <code>{{ selected.provenanceHash }}</code>
          <span class="lw-ribbon-as">as of {{ asOfLabel }}</span>
        </div>

        <div class="lw-d-head">
          <span class="lw-type" :class="selected.type">{{ selected.type }}</span>
          <span class="lw-status" :class="selected.status">{{ selected.status }}</span>
        </div>
        <h2 class="lw-d-title">{{ selected.title }}</h2>
        <div class="lw-d-meta">{{ selected.cite }} · {{ selected.jurisdiction }} · updated {{ relative(selected.updated) }}</div>
        <p class="lw-d-summary">{{ selected.summary }}</p>

        <div class="lw-block">
          <div class="lw-block-h">Redline <span class="lw-legend"><i class="add" />added <i class="del" />removed</span></div>
          <div class="lw-redline">
            <div v-for="(seg, i) in selected.redline" :key="i" class="lw-seg" :class="seg.type">
              <span class="lw-gutter">{{ seg.type === 'add' ? '+' : seg.type === 'del' ? '−' : '' }}</span>
              <span class="lw-seg-text">{{ seg.text }}</span>
            </div>
          </div>
        </div>
      </article>
      <div v-else class="lw-detail empty">Select a docket item</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { dockets, asOf, type Docket, type DocketStatus } from '../data/lawFixture';

const statuses = ['all', 'comment', 'pending', 'enacted', 'open'] as const;
const status = ref<(typeof statuses)[number]>('all');
const selectedId = ref<string>(dockets[0]!.id);

const results = computed<Docket[]>(() => (status.value === 'all' ? dockets : dockets.filter((d) => d.status === (status.value as DocketStatus))));
const selected = computed<Docket | undefined>(() => dockets.find((d) => d.id === selectedId.value));
function setStatus(s: (typeof statuses)[number]) { status.value = s; if (!results.value.some((d) => d.id === selectedId.value) && results.value[0]) selectedId.value = results.value[0].id; }
watch(status, () => { /* keep selection valid handled in setStatus */ });

const NOW = new Date('2026-07-03T14:00:00-04:00').getTime();
function relative(iso: string): string {
  const mins = Math.max(0, Math.round((NOW - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}
const asOfLabel = new Date(asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
</script>

<style scoped>
.lw { height: 100%; min-height: 0; display: grid; grid-template-rows: auto 1fr; gap: 0.75rem; padding: 1rem 1.25rem 1.25rem; background: #0d1117; color: rgba(255, 255, 255, 0.92); }
.lw-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.lw-title { display: flex; align-items: baseline; gap: 0.6rem; } .lw-title h1 { margin: 0; font-size: 1.3rem; }
.lw-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: #e3b341; background: rgba(227, 179, 65, 0.14); border-radius: 5px; padding: 0.1rem 0.35rem; }
.lw-filters { display: flex; gap: 0.25rem; }
.lw-fbtn { border: 1px solid #21262d; background: transparent; color: rgba(255, 255, 255, 0.6); border-radius: 8px; padding: 0.3rem 0.6rem; font-size: 0.74rem; text-transform: capitalize; cursor: pointer; } .lw-fbtn.on { border-color: #58a6ff; color: #58a6ff; background: rgba(88, 166, 255, 0.12); }

.lw-body { min-height: 0; display: grid; grid-template-columns: minmax(340px, 1fr) minmax(400px, 1.3fr); gap: 0.75rem; }
@media (max-width: 1080px) { .lw-body { grid-template-columns: 1fr; } .lw-detail { display: none; } }

.lw-list { min-height: 0; overflow-y: auto; border: 1px solid #21262d; border-radius: 12px; }
.lw-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255, 255, 255, 0.4); border-bottom: 1px solid #161b22; }
.lw-row { width: 100%; display: grid; gap: 0.25rem; border: none; border-bottom: 1px solid #161b22; background: transparent; color: inherit; padding: 0.65rem 0.85rem; cursor: pointer; text-align: left; } .lw-row:hover { background: rgba(255, 255, 255, 0.03); } .lw-row.on { background: rgba(88, 166, 255, 0.1); box-shadow: inset 3px 0 0 #58a6ff; }
.lw-row-top { display: flex; align-items: center; gap: 0.5rem; }
.lw-cite { font-size: 0.68rem; color: rgba(255, 255, 255, 0.45); font-family: ui-monospace, monospace; }
.lw-row-title { font-size: 0.9rem; font-weight: 600; } .lw-row-meta { font-size: 0.7rem; color: rgba(255, 255, 255, 0.45); }
.lw-empty { padding: 1.5rem; color: rgba(255, 255, 255, 0.45); font-size: 0.85rem; }

.lw-type { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; } .lw-type.rule { color: #58a6ff; background: rgba(88, 166, 255, 0.14); } .lw-type.bill { color: #c58af9; background: rgba(197, 138, 249, 0.14); } .lw-type.case { color: #e3b341; background: rgba(227, 179, 65, 0.14); }
.lw-status { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; border-radius: 999px; padding: 0.05rem 0.4rem; margin-left: auto; } .lw-status.comment { color: #58a6ff; background: rgba(88, 166, 255, 0.14); } .lw-status.pending { color: #e3b341; background: rgba(227, 179, 65, 0.16); } .lw-status.enacted { color: #3fb950; background: rgba(63, 185, 80, 0.16); } .lw-status.open { color: #8b949e; background: rgba(139, 148, 158, 0.16); }

.lw-detail { min-height: 0; overflow-y: auto; border: 1px solid #21262d; border-radius: 12px; padding: 0 1.1rem 1.1rem; }
.lw-detail.empty { display: grid; place-items: center; color: rgba(255, 255, 255, 0.35); font-size: 0.85rem; padding: 1.1rem; }
.lw-ribbon { display: flex; align-items: center; gap: 0.6rem; margin: 0 -1.1rem 0.9rem; padding: 0.4rem 1.1rem; background: rgba(88, 166, 255, 0.06); border-bottom: 1px solid #21262d; font-size: 0.7rem; }
.lw-ribbon-k { text-transform: uppercase; letter-spacing: 0.08em; color: #58a6ff; font-weight: 700; font-size: 0.6rem; } .lw-ribbon code { color: rgba(255, 255, 255, 0.6); font-family: ui-monospace, monospace; } .lw-ribbon-as { margin-left: auto; color: rgba(255, 255, 255, 0.4); }
.lw-d-head { display: flex; gap: 0.5rem; margin-top: 1rem; }
.lw-d-head .lw-status { margin-left: 0; }
.lw-d-title { margin: 0.5rem 0 0.3rem; font-size: 1.35rem; line-height: 1.25; }
.lw-d-meta { font-size: 0.76rem; color: rgba(255, 255, 255, 0.5); font-family: ui-monospace, monospace; }
.lw-d-summary { margin: 0.7rem 0 0; font-size: 0.9rem; line-height: 1.6; color: rgba(255, 255, 255, 0.8); }
.lw-block { margin-top: 1rem; border-top: 1px solid #21262d; padding-top: 0.85rem; }
.lw-block-h { display: flex; align-items: center; justify-content: space-between; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); margin-bottom: 0.6rem; }
.lw-legend { display: flex; align-items: center; gap: 0.4rem; text-transform: none; letter-spacing: 0; color: rgba(255, 255, 255, 0.4); } .lw-legend i { width: 9px; height: 9px; border-radius: 2px; display: inline-block; margin-right: 0.2rem; } .lw-legend i.add { background: #3fb950; } .lw-legend i.del { background: #f85149; }
.lw-redline { border: 1px solid #21262d; border-radius: 8px; overflow: hidden; font-family: ui-monospace, 'SF Mono', monospace; font-size: 0.8rem; }
.lw-seg { display: flex; gap: 0.5rem; padding: 0.2rem 0.6rem; line-height: 1.5; white-space: pre-wrap; }
.lw-seg.ctx { color: rgba(255, 255, 255, 0.6); } .lw-seg.add { background: rgba(63, 185, 80, 0.12); color: #86efac; } .lw-seg.del { background: rgba(248, 81, 73, 0.12); color: #fca5a5; }
.lw-gutter { width: 0.8rem; flex: 0 0 auto; text-align: center; color: inherit; opacity: 0.7; } .lw-seg-text { flex: 1; }
</style>
