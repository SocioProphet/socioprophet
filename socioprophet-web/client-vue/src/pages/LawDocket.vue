<template>
  <section class="lw" aria-label="Legal docket">
    <header class="lw-toolbar">
      <div class="lw-title">
        <div>
          <p v-if="scope" class="lw-eyebrow">{{ scope.domain }}</p>
          <h1>{{ scope?.label ?? 'Docket' }}</h1>
        </div>
        <span class="lw-pill">fixture</span>
      </div>
      <form class="term-cmd" @submit.prevent="runCmd">
        <span class="term-cmd-prompt">›</span>
        <input v-model="cmd" spellcheck="false" placeholder="Jump to a cite or title (e.g. HR-2026-882)" />
        <button type="submit" class="term-cmd-go">&lt;GO&gt;</button>
      </form>
      <div class="lw-filters">
        <button v-for="s in statuses" :key="s" class="lw-fbtn" :class="{ on: status === s }" @click="setStatus(s)">{{ s }}</button>
      </div>
    </header>

    <div class="lw-body">
      <!-- Docket list -->
      <div ref="listEl" class="lw-list" aria-label="Dockets" @keydown="arrowRove($event, listEl, '.lw-row')">
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
        <p v-if="results.length === 0" class="lw-empty">No items in this scope.</p>
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
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { dockets, asOf, type Docket, type DocketStatus } from '../data/lawFixture';
import { navScopeForPath } from '../config/cockpitNav';
import { arrowRove } from '../utils/listKeys';

const statuses = ['all', 'comment', 'pending', 'enacted', 'open'] as const;
const status = ref<(typeof statuses)[number]>('all');
const selectedId = ref<string>(dockets[0]!.id);
const listEl = ref<HTMLElement | null>(null);
const route = useRoute();

// Sub-domain scope: each Law nav leaf narrows the docket set by jurisdiction or
// instrument type, so /law/federal-law, /law/case-law, etc. are real slices of
// the corpus rather than identical boards. A specific ?d= deep-link bypasses the
// scope so palette jumps always resolve, whatever slice the item belongs to.
const scope = computed(() => navScopeForPath(route.path));
const deepLinked = ref(false);
function inScope(d: Docket): boolean {
  if (deepLinked.value) return true;
  switch (route.path) {
    case '/law/federal-law': return d.jurisdiction === 'Federal';
    case '/law/state-local-law': return ['Regional', 'State', 'Local'].includes(d.jurisdiction);
    case '/law/statutory-law': return d.type === 'bill';
    case '/law/case-law': return d.type === 'case';
    case '/law/international-law': return d.jurisdiction === 'International';
    default: return true;
  }
}
onMounted(() => { const d = typeof route.query.d === 'string' ? route.query.d : ''; if (d && dockets.some((x) => x.id === d)) { deepLinked.value = true; status.value = 'all'; selectedId.value = d; } });
const cmd = ref('');
function runCmd() {
  const q = cmd.value.trim().toLowerCase();
  if (!q) return;
  const hit = dockets.find((d) => d.cite.toLowerCase() === q) ?? dockets.find((d) => d.cite.toLowerCase().includes(q) || d.title.toLowerCase().includes(q));
  if (hit) { status.value = 'all'; selectedId.value = hit.id; cmd.value = ''; }
}

const results = computed<Docket[]>(() =>
  dockets.filter((d) => inScope(d) && (status.value === 'all' || d.status === (status.value as DocketStatus))),
);
const selected = computed<Docket | undefined>(() => dockets.find((d) => d.id === selectedId.value));
function setStatus(s: (typeof statuses)[number]) { status.value = s; }
// Keep a valid selection as the scope/status narrows the visible set.
watch(results, (r) => { if (!r.some((d) => d.id === selectedId.value) && r[0]) selectedId.value = r[0].id; }, { immediate: true });
// Moving between sub-domains resumes scope filtering (deep-link was one-shot).
watch(() => route.path, () => { deepLinked.value = false; });

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
.lw { height: 100%; min-height: 0; display: grid; grid-template-rows: auto 1fr; gap: 0.75rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: rgba(255, 255, 255, 0.9); }
.lw-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.lw-title { display: flex; align-items: baseline; gap: 0.6rem; } .lw-title h1 { margin: 0; font-size: 1.2rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.lw-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.lw-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: #e3b341; background: rgba(227, 179, 65, 0.14); border-radius: 5px; padding: 0.1rem 0.35rem; }
.lw-filters { display: flex; gap: 0.25rem; }
.lw-fbtn { border: 1px solid var(--line-2); background: transparent; color: rgba(255, 255, 255, 0.6); border-radius: 8px; padding: 0.3rem 0.6rem; font-size: 0.74rem; text-transform: capitalize; cursor: pointer; } .lw-fbtn.on { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

.lw-body { min-height: 0; display: grid; grid-template-columns: minmax(340px, 1fr) minmax(400px, 1.3fr); gap: 0.75rem; }
@media (max-width: 1080px) { .lw-body { grid-template-columns: 1fr; } .lw-detail { display: none; } }

.lw-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; }
.lw-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255, 255, 255, 0.4); border-bottom: 1px solid var(--line); }
.lw-row { width: 100%; display: grid; gap: 0.25rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.65rem 0.85rem; cursor: pointer; text-align: left; } .lw-row:hover { background: rgba(255, 255, 255, 0.03); } .lw-row.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.lw-row-top { display: flex; align-items: center; gap: 0.5rem; }
.lw-cite { font-size: 0.68rem; color: rgba(255, 255, 255, 0.45); font-family: ui-monospace, monospace; }
.lw-row-title { font-size: 0.9rem; font-weight: 600; } .lw-row-meta { font-size: 0.7rem; color: rgba(255, 255, 255, 0.45); }
.lw-empty { padding: 1.5rem; color: rgba(255, 255, 255, 0.45); font-size: 0.85rem; }

.lw-type { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; } .lw-type.rule { color: #58a6ff; background: rgba(88, 166, 255, 0.14); } .lw-type.bill { color: #c58af9; background: rgba(197, 138, 249, 0.14); } .lw-type.case { color: #e3b341; background: rgba(227, 179, 65, 0.14); }
.lw-status { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; border-radius: 999px; padding: 0.05rem 0.4rem; margin-left: auto; } .lw-status.comment { color: #58a6ff; background: rgba(88, 166, 255, 0.14); } .lw-status.pending { color: #e3b341; background: rgba(227, 179, 65, 0.16); } .lw-status.enacted { color: var(--up); background: rgba(63, 185, 80, 0.16); } .lw-status.open { color: #8b949e; background: rgba(139, 148, 158, 0.16); }

.lw-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 0 1.1rem 1.1rem; }
.lw-detail.empty { display: grid; place-items: center; color: rgba(255, 255, 255, 0.35); font-size: 0.85rem; padding: 1.1rem; }
.lw-ribbon { display: flex; align-items: center; gap: 0.6rem; margin: 0 -1.1rem 0.9rem; padding: 0.4rem 1.1rem; background: var(--accent-soft); border-bottom: 1px solid var(--line-2); font-size: 0.7rem; }
.lw-ribbon-k { text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); font-weight: 700; font-size: 0.6rem; } .lw-ribbon code { color: rgba(255, 255, 255, 0.6); font-family: ui-monospace, monospace; } .lw-ribbon-as { margin-left: auto; color: rgba(255, 255, 255, 0.4); }
.lw-d-head { display: flex; gap: 0.5rem; margin-top: 1rem; }
.lw-d-head .lw-status { margin-left: 0; }
.lw-d-title { margin: 0.5rem 0 0.3rem; font-size: 1.35rem; line-height: 1.25; }
.lw-d-meta { font-size: 0.76rem; color: rgba(255, 255, 255, 0.5); font-family: ui-monospace, monospace; }
.lw-d-summary { margin: 0.7rem 0 0; font-size: 0.9rem; line-height: 1.6; color: rgba(255, 255, 255, 0.8); }
.lw-block { margin-top: 1rem; border-top: 1px solid var(--line-2); padding-top: 0.85rem; }
.lw-block-h { display: flex; align-items: center; justify-content: space-between; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); margin-bottom: 0.6rem; }
.lw-legend { display: flex; align-items: center; gap: 0.4rem; text-transform: none; letter-spacing: 0; color: rgba(255, 255, 255, 0.4); } .lw-legend i { width: 9px; height: 9px; border-radius: 2px; display: inline-block; margin-right: 0.2rem; } .lw-legend i.add { background: var(--up); } .lw-legend i.del { background: var(--down); }
.lw-redline { border: 1px solid var(--line-2); border-radius: 8px; overflow: hidden; font-family: ui-monospace, 'SF Mono', monospace; font-size: 0.8rem; }
.lw-seg { display: flex; gap: 0.5rem; padding: 0.2rem 0.6rem; line-height: 1.5; white-space: pre-wrap; }
.lw-seg.ctx { color: rgba(255, 255, 255, 0.6); } .lw-seg.add { background: rgba(63, 185, 80, 0.12); color: #86efac; } .lw-seg.del { background: rgba(248, 81, 73, 0.12); color: #fca5a5; }
.lw-gutter { width: 0.8rem; flex: 0 0 auto; text-align: center; color: inherit; opacity: 0.7; } .lw-seg-text { flex: 1; }
</style>
