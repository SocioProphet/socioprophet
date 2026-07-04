<template>
  <section class="news" aria-label="News feed">
    <!-- Toolbar -->
    <header class="nf-toolbar">
      <div class="nf-title"><h1>News</h1><span class="nf-pill">fixture</span></div>
      <div class="nf-tools">
        <span class="nf-count">{{ totalUnread }} unread</span>
        <div class="nf-seg">
          <button :class="{ on: view === 'titles' }" @click="view = 'titles'">Titles</button>
          <button :class="{ on: view === 'cards' }" @click="view = 'cards'">Cards</button>
          <button :class="{ on: view === 'magazine' }" @click="view = 'magazine'">Magazine</button>
        </div>
        <button class="nf-btn" :class="{ on: unreadOnly }" @click="unreadOnly = !unreadOnly">Unread only</button>
        <button class="nf-btn" :class="{ on: governedOnly }" title="Only items the membrane held / quarantined / rejected" @click="governedOnly = !governedOnly">Governed</button>
        <button class="nf-btn" @click="markAllRead">Mark all read</button>
      </div>
    </header>

    <!-- Ticker -->
    <div class="nf-ticker" aria-label="Top headlines">
      <span class="nf-ticker-label">Ticker</span>
      <div class="nf-ticker-track">
        <button v-for="it in items.slice(0, 8)" :key="it.id" class="nf-tick" :class="{ active: it.id === selectedId }" @click="select(it.id)">
          <b>{{ sourceOf(it)?.title }}</b> · {{ it.title }}
        </button>
      </div>
    </div>

    <!-- Three panes: sources rail · stream · reader -->
    <div class="nf-body">
      <!-- Rail -->
      <aside class="nf-rail" aria-label="Sources">
        <div class="nf-rail-head">Feeds</div>
        <button class="nf-src" :class="{ on: activeSourceId === 'all' }" @click="setSource('all')">
          <span class="nf-src-name">All feeds</span>
          <span v-if="unreadFor('all')" class="nf-badge">{{ unreadFor('all') }}</span>
        </button>
        <button v-for="s in sources" :key="s.id" class="nf-src" :class="{ on: activeSourceId === s.id }" @click="setSource(s.id)">
          <span class="nf-dot" :style="{ background: sourceColor(s.id) }" />
          <span class="nf-src-name">{{ s.title }}</span>
          <span v-if="unreadFor(s.id)" class="nf-badge">{{ unreadFor(s.id) }}</span>
        </button>
        <div class="nf-rail-hint">j/k to move · o to open · m read/unread · u unread-only</div>
      </aside>

      <!-- Stream -->
      <div ref="listEl" class="nf-list" :class="view" aria-label="Articles">
        <p v-if="items.length === 0" class="nf-empty">Nothing here — try “All feeds” or turn off the filters.</p>

        <!-- Titles / Cards -->
        <template v-if="view !== 'magazine'">
          <article
            v-for="it in items"
            :key="it.id"
            class="nf-row"
            :class="{ on: it.id === selectedId, unread: !isRead(it.id) }"
            @click="select(it.id)"
          >
            <span class="nf-unread-dot" :title="isRead(it.id) ? 'read' : 'unread'" />
            <div class="nf-row-main">
              <div class="nf-row-meta">
                <span class="nf-src-tag" :style="{ color: sourceColor(it.sourceId) }">{{ sourceOf(it)?.title }}</span>
                <span class="nf-time">{{ relative(it.publishedAt) }}</span>
                <span v-if="it.membraneDecision !== 'admit'" class="nf-mem" :class="it.membraneDecision">{{ it.membraneDecision }}</span>
                <span v-if="saved.has(it.id)" class="nf-saved">saved</span>
              </div>
              <h3 class="nf-row-title">{{ it.title }}</h3>
              <p v-if="view === 'cards'" class="nf-row-dek">{{ it.summary }}</p>
            </div>
          </article>
        </template>

        <!-- Magazine (cover images) -->
        <template v-else>
          <article
            v-for="it in items"
            :key="it.id"
            class="nf-mag"
            :class="{ on: it.id === selectedId, unread: !isRead(it.id) }"
            @click="select(it.id)"
          >
            <div class="nf-cover" :style="{ backgroundImage: cover(it) }">
              <span class="nf-cover-src" :style="{ color: sourceColor(it.sourceId) }">{{ sourceOf(it)?.title }}</span>
              <span v-if="it.membraneDecision !== 'admit'" class="nf-mem" :class="it.membraneDecision">{{ it.membraneDecision }}</span>
            </div>
            <div class="nf-mag-b">
              <div class="nf-row-meta"><span class="nf-time">{{ relative(it.publishedAt) }}</span><span v-if="saved.has(it.id)" class="nf-saved">saved</span></div>
              <h3 class="nf-row-title">{{ it.title }}</h3>
              <p class="nf-row-dek">{{ it.summary }}</p>
            </div>
          </article>
        </template>
      </div>

      <!-- Reader -->
      <article v-if="selected" class="nf-reader" aria-label="Reader">
        <div class="nf-reader-meta">
          <span class="nf-src-tag" :style="{ color: sourceColor(selected.sourceId) }">{{ sourceOf(selected)?.title }}</span>
          <span class="nf-time">{{ relative(selected.publishedAt) }}</span>
          <span class="nf-mem" :class="selected.membraneDecision">{{ selected.membraneDecision }}</span>
        </div>
        <h2 class="nf-reader-title">{{ selected.title }}</h2>
        <p class="nf-reader-body">{{ selected.summary }}</p>

        <div v-if="selected.entities.length" class="nf-block">
          <div class="nf-block-h">Entities</div>
          <div class="nf-chips"><span v-for="e in selected.entities" :key="e" class="nf-chip">{{ e }}</span></div>
        </div>
        <div v-if="selected.claims.length" class="nf-block">
          <div class="nf-block-h">Claims</div>
          <ul class="nf-claims"><li v-for="(c, i) in selected.claims" :key="i">{{ c }}</li></ul>
        </div>
        <div class="nf-block">
          <div class="nf-block-h">Scope · provenance</div>
          <div class="nf-kv"><span>Topic</span><code>{{ selected.topicScope }}</code></div>
          <div class="nf-kv"><span>Storage</span><code>{{ selected.storagePolicy }}</code></div>
          <div class="nf-kv"><span>Provenance</span><code class="nf-hash">{{ selected.provenanceHash }}</code></div>
        </div>

        <div class="nf-actions">
          <a class="nf-act primary" :href="selected.canonicalUrl" target="_blank" rel="noreferrer">Open ↗</a>
          <button class="nf-act" @click="toggleRead(selected.id)">{{ isRead(selected.id) ? 'Mark unread' : 'Mark read' }}</button>
          <button class="nf-act" :class="{ done: saved.has(selected.id) }" :disabled="saved.has(selected.id)" title="Capture into the Research list" @click="save(selected)">{{ saved.has(selected.id) ? 'Saved ✓' : 'Save' }}</button>
        </div>
      </article>
      <div v-else class="nf-reader empty">Select an article</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { newsSources, newsItems } from '../data/newsFeedFixture';
import type { FeedItem } from '../features/feed-intelligence/types';
import { useResearch } from '../stores/research';

const sources = newsSources;
const all = newsItems;
const research = useResearch();

const read = ref<Set<string>>(new Set());
const saved = ref<Set<string>>(new Set());
const activeSourceId = ref<'all' | string>('all');
const unreadOnly = ref(false);
const governedOnly = ref(false);
const view = ref<'cards' | 'magazine' | 'titles'>('cards');
const selectedId = ref<string>('');
const listEl = ref<HTMLElement | null>(null);

const items = computed<FeedItem[]>(() => {
  let list = all;
  if (activeSourceId.value !== 'all') list = list.filter((i) => i.sourceId === activeSourceId.value);
  if (unreadOnly.value) list = list.filter((i) => !read.value.has(i.id));
  if (governedOnly.value) list = list.filter((i) => i.membraneDecision !== 'admit');
  return list;
});
const selected = computed<FeedItem | undefined>(() => all.find((i) => i.id === selectedId.value) ?? items.value[0]);
const totalUnread = computed(() => all.filter((i) => !read.value.has(i.id)).length);

const sourceById = new Map(sources.map((s) => [s.id, s]));
const sourceOf = (it: FeedItem) => sourceById.get(it.sourceId);
const isRead = (id: string) => read.value.has(id);
const unreadFor = (sid: string) => all.filter((i) => (sid === 'all' || i.sourceId === sid) && !read.value.has(i.id)).length;

const SRC_COLORS: Record<string, string> = {
  'src-world': '#58a6ff', 'src-tech': '#c58af9', 'src-markets': 'var(--up)', 'src-reg': '#f0883e', 'src-capture': '#e3b341',
};
const sourceColor = (sid: string) => SRC_COLORS[sid] ?? '#8b949e';

function select(id: string) { selectedId.value = id; read.value.add(id); }
function toggleRead(id?: string) { if (!id) return; if (read.value.has(id)) read.value.delete(id); else read.value.add(id); }
function setSource(sid: 'all' | string) { activeSourceId.value = sid; if (!items.value.some((i) => i.id === selectedId.value)) selectedId.value = items.value[0]?.id ?? ''; }
function markAllRead() { for (const i of all) read.value.add(i.id); }

// Save → the durable Research capture list (source: manual). Same store the
// footer "Snapshot" and /research page read, so saved articles land there.
function save(it?: FeedItem) {
  if (!it || saved.value.has(it.id)) return;
  research.capture({ path: it.canonicalUrl, title: it.title, domain: 'News & Events', openedAt: Date.now() }, 'manual');
  saved.value.add(it.id);
}

// Deterministic gradient "cover" for magazine view — no external images (offline/CSP-safe).
function hashOf(s: string): number { let h = 0; for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function darken(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
  return `rgb(${r},${g},${b})`;
}
function cover(it: FeedItem): string {
  const c = sourceColor(it.sourceId);
  const a = (hashOf(it.id) % 90) + 25;
  return `radial-gradient(circle at ${20 + (hashOf(it.id) % 60)}% 20%, ${c}66, transparent 60%), linear-gradient(${a}deg, ${c}, ${darken(c, 0.3)} 55%, var(--bg) 100%)`;
}

// Deterministic "time ago" against the fixture's afternoon "now".
const NOW = new Date('2026-07-03T14:00:00-04:00').getTime();
function relative(iso: string): string {
  const mins = Math.max(0, Math.round((NOW - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

function onKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = (e.target as HTMLElement | null)?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const list = items.value;
  if (!list.length) return;
  const idx = list.findIndex((i) => i.id === selectedId.value);
  if (e.key === 'j') { e.preventDefault(); select(list[Math.min(list.length - 1, idx + 1)]!.id); }
  else if (e.key === 'k') { e.preventDefault(); select(list[Math.max(0, idx < 0 ? 0 : idx - 1)]!.id); }
  else if (e.key === 'o' || e.key === 'Enter') { if (selected.value) window.open(selected.value.canonicalUrl, '_blank', 'noreferrer'); }
  else if (e.key === 'm') { toggleRead(selected.value?.id); }
  else if (e.key === 'u') { unreadOnly.value = !unreadOnly.value; }
}

watch(selectedId, async () => { await nextTick(); listEl.value?.querySelector('.nf-row.on')?.scrollIntoView({ block: 'nearest' }); });

onMounted(() => { selectedId.value = items.value[0]?.id ?? ''; window.addEventListener('keydown', onKey); });
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.news { height: 100%; min-height: 0; display: grid; grid-template-rows: auto auto 1fr; gap: 0.75rem; padding: 1rem 1.25rem 1.25rem; background: var(--bg); color: rgba(255, 255, 255, 0.92); }
.nf-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.nf-title { display: flex; align-items: baseline; gap: 0.6rem; } .nf-title h1 { margin: 0; font-size: 1.3rem; }
.nf-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: #e3b341; background: rgba(227, 179, 65, 0.14); border-radius: 5px; padding: 0.1rem 0.35rem; }
.nf-tools { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.nf-count { font-size: 0.78rem; color: rgba(255, 255, 255, 0.5); }
.nf-seg { display: inline-flex; border: 1px solid var(--line-2); border-radius: 8px; overflow: hidden; }
.nf-seg button { border: none; background: transparent; color: rgba(255, 255, 255, 0.6); padding: 0.3rem 0.6rem; font-size: 0.76rem; cursor: pointer; } .nf-seg button.on { background: rgba(88, 166, 255, 0.18); color: #58a6ff; }
.nf-btn { border: 1px solid var(--line-2); background: transparent; color: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 0.3rem 0.6rem; font-size: 0.76rem; cursor: pointer; } .nf-btn.on { border-color: #58a6ff; color: #58a6ff; background: rgba(88, 166, 255, 0.12); }

.nf-ticker { display: flex; align-items: stretch; border: 1px solid var(--line-2); border-radius: 10px; overflow: hidden; background: var(--surface); }
.nf-ticker-label { display: grid; place-items: center; padding: 0 0.8rem; background: var(--line); color: #8b949e; font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
.nf-ticker-track { display: flex; gap: 0; overflow-x: auto; }
.nf-tick { flex: 0 0 auto; max-width: 30rem; border: none; border-right: 1px solid var(--line-2); background: transparent; color: rgba(255, 255, 255, 0.7); padding: 0.45rem 0.8rem; font-size: 0.74rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; } .nf-tick b { color: rgba(255, 255, 255, 0.92); } .nf-tick.active { background: rgba(88, 166, 255, 0.12); }

.nf-body { min-height: 0; display: grid; grid-template-columns: 210px minmax(320px, 460px) 1fr; gap: 0.75rem; }
@media (max-width: 1080px) { .nf-body { grid-template-columns: 180px 1fr; } .nf-reader { display: none; } }

.nf-rail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 0.5rem; display: flex; flex-direction: column; gap: 0.15rem; }
.nf-rail-head { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); padding: 0.3rem 0.5rem; }
.nf-src { display: flex; align-items: center; gap: 0.5rem; border: none; background: transparent; color: rgba(255, 255, 255, 0.78); border-radius: 8px; padding: 0.4rem 0.5rem; font-size: 0.82rem; cursor: pointer; text-align: left; } .nf-src:hover { background: rgba(255, 255, 255, 0.05); } .nf-src.on { background: rgba(88, 166, 255, 0.14); color: #fff; }
.nf-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
.nf-src-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nf-badge { font-size: 0.66rem; font-weight: 700; color: #58a6ff; background: rgba(88, 166, 255, 0.16); border-radius: 999px; padding: 0.05rem 0.4rem; }
.nf-rail-hint { margin-top: auto; padding: 0.5rem; font-size: 0.64rem; color: rgba(255, 255, 255, 0.35); line-height: 1.5; }

.nf-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; }
.nf-empty { padding: 1.5rem; color: rgba(255, 255, 255, 0.45); font-size: 0.85rem; }
.nf-row { display: flex; gap: 0.6rem; padding: 0.7rem 0.85rem; border-bottom: 1px solid var(--line); cursor: pointer; } .nf-row:hover { background: rgba(255, 255, 255, 0.03); } .nf-row.on { background: rgba(88, 166, 255, 0.1); box-shadow: inset 3px 0 0 #58a6ff; }
.nf-unread-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 0.35rem; flex: 0 0 auto; background: transparent; } .nf-row.unread .nf-unread-dot { background: #58a6ff; }
.nf-row-main { min-width: 0; flex: 1; }
.nf-row-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; }
.nf-src-tag { font-weight: 700; } .nf-time { color: rgba(255, 255, 255, 0.4); }
.nf-mem { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.06em; border-radius: 4px; padding: 0.03rem 0.3rem; font-weight: 700; }
.nf-mem.admit { color: var(--up); background: rgba(63, 185, 80, 0.14); } .nf-mem.hold { color: #e3b341; background: rgba(227, 179, 65, 0.16); } .nf-mem.quarantine { color: var(--down); background: rgba(248, 81, 73, 0.16); } .nf-mem.reject { color: #8b949e; background: rgba(139, 148, 158, 0.16); }
.nf-row-title { margin: 0.2rem 0 0; font-size: 0.9rem; font-weight: 600; line-height: 1.35; color: rgba(255, 255, 255, 0.7); } .nf-row.unread .nf-row-title { color: #fff; }
.nf-list.titles .nf-row-title { font-size: 0.84rem; }
.nf-row-dek { margin: 0.25rem 0 0; font-size: 0.78rem; color: rgba(255, 255, 255, 0.5); line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.nf-saved { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: var(--up); background: rgba(63, 185, 80, 0.14); border-radius: 4px; padding: 0.03rem 0.3rem; }

/* Magazine view — cover-image cards in a responsive grid */
.nf-list.magazine { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.7rem; padding: 0.7rem; align-content: start; align-items: start; }
.nf-mag { border: 1px solid var(--line-2); border-radius: 10px; cursor: pointer; background: var(--surface); display: flex; flex-direction: column; } .nf-mag:hover { border-color: rgba(255, 255, 255, 0.2); } .nf-mag.on { border-color: #58a6ff; box-shadow: 0 0 0 1px #58a6ff; }
.nf-cover { position: relative; height: 96px; border-radius: 10px 10px 0 0; display: flex; align-items: flex-end; justify-content: space-between; padding: 0.45rem 0.55rem; }
.nf-cover-src { font-size: 0.66rem; font-weight: 800; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6); }
.nf-mag-b { padding: 0.55rem 0.65rem 0.7rem; display: grid; gap: 0.2rem; }
.nf-mag .nf-row-title { margin: 0.1rem 0 0; font-size: 0.86rem; }
.nf-mag.unread .nf-row-title { color: #fff; }
.nf-mag .nf-row-dek { -webkit-line-clamp: 3; }

.nf-reader { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1.1rem 1.25rem; }
.nf-reader.empty { display: grid; place-items: center; color: rgba(255, 255, 255, 0.35); font-size: 0.85rem; }
.nf-reader-meta { display: flex; align-items: center; gap: 0.6rem; font-size: 0.72rem; }
.nf-reader-title { margin: 0.5rem 0 0.7rem; font-size: 1.4rem; line-height: 1.25; letter-spacing: -0.02em; }
.nf-reader-body { margin: 0 0 1.1rem; font-size: 0.95rem; line-height: 1.6; color: rgba(255, 255, 255, 0.82); }
.nf-block { border-top: 1px solid var(--line-2); padding: 0.8rem 0; }
.nf-block-h { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); margin-bottom: 0.5rem; }
.nf-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.nf-chip { font-size: 0.72rem; color: rgba(255, 255, 255, 0.75); background: rgba(255, 255, 255, 0.06); border: 1px solid var(--line-2); border-radius: 6px; padding: 0.12rem 0.45rem; }
.nf-claims { margin: 0; padding-left: 1.1rem; color: rgba(255, 255, 255, 0.72); font-size: 0.82rem; line-height: 1.6; }
.nf-kv { display: grid; grid-template-columns: 6rem 1fr; gap: 0.5rem; font-size: 0.76rem; padding: 0.15rem 0; } .nf-kv span { color: rgba(255, 255, 255, 0.4); } .nf-kv code { color: rgba(255, 255, 255, 0.75); font-family: ui-monospace, monospace; overflow-wrap: anywhere; } .nf-hash { color: rgba(255, 255, 255, 0.5) !important; font-size: 0.68rem; }
.nf-actions { display: flex; gap: 0.5rem; margin-top: 0.9rem; flex-wrap: wrap; }
.nf-act { border: 1px solid var(--line-2); background: transparent; color: rgba(255, 255, 255, 0.8); border-radius: 8px; padding: 0.4rem 0.8rem; font-size: 0.8rem; cursor: pointer; text-decoration: none; } .nf-act:hover { border-color: rgba(255, 255, 255, 0.3); } .nf-act.primary { background: #1f6feb; border-color: #1f6feb; color: #fff; }
.nf-act.done { color: var(--up); border-color: rgba(63, 185, 80, 0.4); cursor: default; }
</style>
