<template>
  <section class="news" aria-label="News">
    <!-- Toolbar -->
    <header class="nf-toolbar">
      <div class="nf-title">
        <div>
          <p v-if="scope && !scope.isPrimary" class="nf-eyebrow">{{ scope.domain }}</p>
          <h1>{{ scope && !scope.isPrimary ? scope.label : 'News' }}</h1>
        </div>
        <span class="nf-pill">fixture</span>
      </div>
      <div class="nf-tools">
        <div v-if="mode !== 'calendar'" class="nf-seg" role="tablist" aria-label="Ranking">
          <button role="tab" :class="{ on: sort === 'hot' }" @click="sort = 'hot'">Hot</button>
          <button role="tab" :class="{ on: sort === 'newest' }" @click="sort = 'newest'">Newest</button>
          <button role="tab" :class="{ on: sort === 'active' }" @click="sort = 'active'">Active</button>
        </div>
        <button class="nf-btn" :class="{ on: governedOnly }" title="Only items the membrane held / quarantined / rejected" @click="governedOnly = !governedOnly">Governed</button>
      </div>
    </header>

    <!-- Body: sources rail · story stream · reader -->
    <div class="nf-body">
      <!-- Feedly rail: subscribed sources -->
      <aside class="nf-rail" aria-label="Sources">
        <div class="nf-rail-head">Feeds</div>
        <button class="nf-src" :class="{ on: activeSourceId === 'all' }" @click="setSource('all')">
          <span class="nf-src-name">All feeds</span>
          <span class="nf-src-n">{{ all.length }}</span>
        </button>
        <button v-for="s in sources" :key="s.id" class="nf-src" :class="{ on: activeSourceId === s.id }" @click="setSource(s.id)">
          <span class="nf-dot" :style="{ background: sourceColor(s.id) }" />
          <span class="nf-src-name">{{ s.title }}</span>
          <span class="nf-src-n">{{ countFor(s.id) }}</span>
        </button>
        <div class="nf-rail-head" style="margin-top:0.6rem">Tags</div>
        <button v-for="t in topTags" :key="t" class="nf-tagrow" :class="{ on: activeTag === t }" @click="toggleTag(t)">
          <span class="nf-hash">#</span>{{ t }}
        </button>
        <div class="nf-rail-hint">j/k move · o open · u upvote</div>
      </aside>

      <!-- Lobsters stream -->
      <div ref="listEl" class="nf-list" :class="{ calendar: mode === 'calendar' }" aria-label="Stories">
        <p v-if="items.length === 0" class="nf-empty">Nothing here — clear the filters or pick “All feeds”.</p>

        <!-- Event Calendar lens (grouped by day) -->
        <template v-if="mode === 'calendar'">
          <section v-for="g in byDay" :key="g.day" class="nf-day">
            <div class="nf-day-h">{{ g.label }}<span class="nf-day-c">{{ g.items.length }}</span></div>
            <button v-for="it in g.items" :key="it.id" class="nf-agenda" :class="{ on: it.id === selectedId }" @click="select(it.id)">
              <span class="nf-agenda-time">{{ timeLabel(it.publishedAt) }}</span>
              <span class="nf-agenda-title">{{ it.title }}</span>
              <span class="nf-agenda-src" :style="{ color: sourceColor(it.sourceId) }">{{ sourceOf(it)?.title }}</span>
            </button>
          </section>
        </template>

        <!-- Story rows -->
        <template v-else>
          <article v-for="it in items" :key="it.id" class="nf-story" :class="{ on: it.id === selectedId }" @click="select(it.id)">
            <!-- Vote gutter — upvote only (content is never downvoted) -->
            <div class="nf-vote" @click.stop>
              <button class="nf-up" :class="{ on: upvoted.has(it.id) }" :aria-pressed="upvoted.has(it.id)" title="Upvote" @click="toggleUp(it.id)">▲</button>
              <span class="nf-score">{{ scoreOf(it) }}</span>
            </div>

            <div class="nf-story-main">
              <div class="nf-story-head">
                <a class="nf-story-title" :href="it.canonicalUrl" target="_blank" rel="noreferrer" @click.stop>{{ it.title }}</a>
                <span class="nf-domain">{{ domainOf(it.canonicalUrl) }}</span>
              </div>
              <div class="nf-story-meta">
                <button v-for="t in metaOf(it).tags" :key="t" class="nf-tag" @click.stop="toggleTag(t)">{{ t }}</button>
                <span class="nf-q" :class="metaOf(it).qualityBand" :title="`Truth/quality signal · membrane ${it.membraneDecision}`">◆ {{ Math.round(metaOf(it).quality * 100) }}</span>
                <span v-if="it.membraneDecision !== 'admit'" class="nf-mem" :class="it.membraneDecision">{{ it.membraneDecision }}</span>
              </div>
              <div class="nf-story-by">
                <span class="nf-src-tag" :style="{ color: sourceColor(it.sourceId) }">{{ sourceOf(it)?.title }}</span>
                <span class="nf-time">{{ relative(it.publishedAt) }}</span>
                <span class="nf-auth">by {{ metaOf(it).submitter }}<span v-if="metaOf(it).hat" class="nf-hat" :class="metaOf(it).hat!.kind">{{ metaOf(it).hat!.label }}</span></span>
                <button class="nf-link" @click.stop="select(it.id)">💬 {{ metaOf(it).comments }} comments</button>
                <button class="nf-flag" :class="{ done: flags.has(it.id) }" title="Flag with a reason" @click.stop="openFlag = openFlag === it.id ? '' : it.id">
                  {{ flags.has(it.id) ? `flagged: ${flags.get(it.id)}` : '⚑ flag' }}
                </button>
              </div>
              <!-- flag = reason-required (stories are flagged, never downvoted) -->
              <div v-if="openFlag === it.id" class="nf-reasons" @click.stop>
                <button v-for="r in FLAG_REASONS" :key="r" @click="setFlag(it.id, r)">{{ r }}</button>
              </div>
            </div>
          </article>
        </template>
      </div>

      <!-- Reader -->
      <article v-if="selected" class="nf-reader" aria-label="Reader">
        <div class="nf-reader-meta">
          <span class="nf-src-tag" :style="{ color: sourceColor(selected.sourceId) }">{{ sourceOf(selected)?.title }}</span>
          <span class="nf-time">{{ relative(selected.publishedAt) }}</span>
          <span class="nf-q" :class="metaOf(selected).qualityBand">◆ {{ Math.round(metaOf(selected).quality * 100) }} truth</span>
        </div>
        <h2 class="nf-reader-title">{{ selected.title }}</h2>
        <div class="nf-reader-tags">
          <button v-for="t in metaOf(selected).tags" :key="t" class="nf-tag" @click="toggleTag(t)">{{ t }}</button>
        </div>
        <p class="nf-reader-body">{{ selected.summary }}</p>

        <div class="nf-actions">
          <button class="nf-act" :class="{ on: upvoted.has(selected.id) }" @click="toggleUp(selected.id)">▲ Upvote · {{ scoreOf(selected) }}</button>
          <a class="nf-act primary" :href="selected.canonicalUrl" target="_blank" rel="noreferrer">Open ↗</a>
          <button class="nf-act" :class="{ done: saved.has(selected.id) }" :disabled="saved.has(selected.id)" @click="save(selected)">{{ saved.has(selected.id) ? 'Saved ✓' : 'Save' }}</button>
        </div>

        <div v-if="selected.claims.length" class="nf-block">
          <div class="nf-block-h">Claims</div>
          <ul class="nf-claims"><li v-for="(c, i) in selected.claims" :key="i">{{ c }}</li></ul>
        </div>
        <div class="nf-block">
          <div class="nf-block-h">Scope · provenance</div>
          <div class="nf-kv"><span>Topic</span><code>{{ selected.topicScope }}</code></div>
          <div class="nf-kv"><span>Membrane</span><code>{{ selected.membraneDecision }}</code></div>
          <div class="nf-kv"><span>Provenance</span><code class="nf-hashcode">{{ selected.provenanceHash }}</code></div>
        </div>

        <!-- Discussion — comments CAN be downvoted, but only with a reason -->
        <div class="nf-block">
          <div class="nf-block-h">Discussion · {{ metaOf(selected).comments }}</div>
          <div v-for="c in commentsFor(selected)" :key="c.id" class="nf-comment">
            <div class="nf-c-vote" @click.stop>
              <button class="nf-up sm" :class="{ on: cUp.has(c.id) }" title="Upvote" @click="toggleCUp(c.id)">▲</button>
              <button class="nf-down sm" :class="{ on: cDown.has(c.id) }" title="Downvote (reason required)" @click="openDown = openDown === c.id ? '' : c.id">▼</button>
            </div>
            <div class="nf-c-main">
              <div class="nf-c-by">{{ c.author }}<span v-if="c.hat" class="nf-hat" :class="c.hat.kind">{{ c.hat.label }}</span><span class="nf-c-score">{{ c.score + (cUp.has(c.id) ? 1 : 0) - (cDown.has(c.id) ? 1 : 0) }}</span></div>
              <p class="nf-c-body">{{ c.body }}</p>
              <div v-if="cDown.has(c.id)" class="nf-c-reason">downvoted: {{ cDown.get(c.id) }}</div>
              <div v-if="openDown === c.id" class="nf-reasons" @click.stop>
                <span class="nf-reasons-h">reason:</span>
                <button v-for="r in DOWNVOTE_REASONS" :key="r" @click="setCDown(c.id, r)">{{ r }}</button>
              </div>
            </div>
          </div>
        </div>
      </article>
      <div v-else class="nf-reader empty">Select a story</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { navScopeForPath } from '../config/cockpitNav';
import { newsSources, newsItems } from '../data/newsFeedFixture';
import type { FeedItem } from '../features/feed-intelligence/types';
import {
  storyMeta, DOWNVOTE_REASONS, FLAG_REASONS,
  type DownvoteReason, type FlagReason, type Hat,
} from '../features/feed-intelligence/community';
import { useResearch } from '../stores/research';

const sources = newsSources;
const all = newsItems;
const research = useResearch();
const route = useRoute();

// Precompute the derived community layer once (deterministic per id).
const META = new Map(all.map((it) => [it.id, storyMeta(it)] as const));
const metaOf = (it: FeedItem) => META.get(it.id)!;

const activeSourceId = ref<'all' | string>('all');
const activeTag = ref<string>('');
const sort = ref<'hot' | 'newest' | 'active'>('hot');
const governedOnly = ref(false);
const selectedId = ref<string>('');
const upvoted = ref<Set<string>>(new Set());
const saved = ref<Set<string>>(new Set());
const flags = ref<Map<string, FlagReason>>(new Map());
const openFlag = ref<string>('');
const cUp = ref<Set<string>>(new Set());
const cDown = ref<Map<string, DownvoteReason>>(new Map());
const openDown = ref<string>('');
const listEl = ref<HTMLElement | null>(null);

const scope = computed(() => navScopeForPath(route.path));
const mode = computed<'feed' | 'calendar'>(() => (route.path.endsWith('/calendar') ? 'calendar' : 'feed'));

const scoreOf = (it: FeedItem) => metaOf(it).score + (upvoted.value.has(it.id) ? 1 : 0);

const items = computed<FeedItem[]>(() => {
  let list = all;
  if (activeSourceId.value !== 'all') list = list.filter((i) => i.sourceId === activeSourceId.value);
  if (activeTag.value) list = list.filter((i) => metaOf(i).tags.includes(activeTag.value));
  if (governedOnly.value) list = list.filter((i) => i.membraneDecision !== 'admit');
  const byNew = (a: FeedItem, b: FeedItem) => +new Date(b.publishedAt) - +new Date(a.publishedAt);
  if (mode.value === 'calendar') return [...list].sort(byNew);
  const s = [...list];
  if (sort.value === 'newest') s.sort(byNew);
  else if (sort.value === 'active') s.sort((a, b) => metaOf(b).comments - metaOf(a).comments);
  else s.sort((a, b) => scoreOf(b) - scoreOf(a)); // hot
  return s;
});
const selected = computed<FeedItem | undefined>(() => all.find((i) => i.id === selectedId.value) ?? items.value[0]);

const sourceById = new Map(sources.map((s) => [s.id, s]));
const sourceOf = (it: FeedItem) => sourceById.get(it.sourceId);
const countFor = (sid: string) => all.filter((i) => i.sourceId === sid).length;

const topTags = computed(() => {
  const c = new Map<string, number>();
  for (const it of all) for (const t of metaOf(it).tags) c.set(t, (c.get(t) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);
});

const SRC_COLORS: Record<string, string> = {
  'src-world': '#58a6ff', 'src-tech': '#c58af9', 'src-markets': 'var(--up)', 'src-reg': '#f0883e', 'src-capture': '#e3b341',
};
const sourceColor = (sid: string) => SRC_COLORS[sid] ?? '#8b949e';
function domainOf(url: string): string { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'source'; } }

function select(id: string) { selectedId.value = id; }
function setSource(sid: 'all' | string) { activeSourceId.value = sid; }
function toggleTag(t: string) { activeTag.value = activeTag.value === t ? '' : t; }
function toggleUp(id: string) { if (upvoted.value.has(id)) upvoted.value.delete(id); else upvoted.value.add(id); upvoted.value = new Set(upvoted.value); }
function setFlag(id: string, r: FlagReason) { flags.value.set(id, r); flags.value = new Map(flags.value); openFlag.value = ''; }
function toggleCUp(id: string) { if (cUp.value.has(id)) cUp.value.delete(id); else cUp.value.add(id); cUp.value = new Set(cUp.value); }
function setCDown(id: string, r: DownvoteReason) { cDown.value.set(id, r); cDown.value = new Map(cDown.value); openDown.value = ''; }

function save(it?: FeedItem) {
  if (!it || saved.value.has(it.id)) return;
  research.capture({ path: it.canonicalUrl, title: it.title, domain: 'News & Events', openedAt: Date.now() }, 'manual');
  saved.value.add(it.id);
}

// Deterministic discussion stubs so the reasoned-downvote is demonstrable offline.
type CommentVM = { id: string; author: string; hat: Hat | null; body: string; score: number };
const COMMENT_BODIES = [
  'Solid write-up. The provenance chain checks out against the primary source.',
  'This conflates correlation with causation in the third paragraph.',
  'Counterpoint: the underlying dataset was revised last quarter.',
  'Anyone have a mirror? The canonical link is rate-limiting.',
  'The membrane held a near-duplicate of this yesterday — worth merging.',
];
function commentsFor(it: FeedItem): CommentVM[] {
  const n = Math.min(3, metaOf(it).comments === 0 ? 0 : (metaOf(it).comments % 3) + 1);
  const m = metaOf(it);
  return Array.from({ length: n }, (_, i) => ({
    id: `${it.id}-c${i}`,
    author: [m.submitter, 'reader', 'skeptic'][i] ?? 'reader',
    hat: i === 0 ? m.hat : null,
    body: COMMENT_BODIES[(it.title.length + i) % COMMENT_BODIES.length]!,
    score: ((it.title.length + i * 7) % 24) - 4,
  }));
}

const NOW = new Date('2026-07-03T14:00:00-04:00').getTime();
function relative(iso: string): string {
  const mins = Math.max(0, Math.round((NOW - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
}

const byDay = computed(() => {
  const groups: Array<{ day: string; label: string; items: FeedItem[] }> = [];
  for (const it of items.value) {
    const day = it.publishedAt.slice(0, 10);
    let g = groups.find((x) => x.day === day);
    if (!g) { g = { day, label: dayLabel(it.publishedAt), items: [] }; groups.push(g); }
    g.items.push(it);
  }
  return groups;
});
function dayLabel(iso: string): string { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
function timeLabel(iso: string): string { return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }

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
  else if (e.key === 'u') { if (selected.value) toggleUp(selected.value.id); }
}

watch(selectedId, async () => { await nextTick(); listEl.value?.querySelector('.nf-story.on')?.scrollIntoView({ block: 'nearest' }); });
watch(mode, (m) => { if (m === 'feed' && route.path.endsWith('/recent')) sort.value = 'newest'; }, { immediate: true });

onMounted(() => {
  if (route.path.endsWith('/recent')) sort.value = 'newest';
  const deep = typeof route.query.item === 'string' ? route.query.item : '';
  selectedId.value = (deep && all.some((i) => i.id === deep)) ? deep : (items.value[0]?.id ?? '');
  window.addEventListener('keydown', onKey);
});
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.news { height: 100%; min-height: 0; display: grid; grid-template-rows: auto 1fr; gap: 0.75rem; padding: 1rem 1.25rem 1.25rem; background: var(--bg); color: rgba(255, 255, 255, 0.92); }
.nf-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.nf-title { display: flex; align-items: baseline; gap: 0.6rem; } .nf-title h1 { margin: 0; font-size: 1.3rem; }
.nf-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.nf-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: #e3b341; background: rgba(227, 179, 65, 0.14); border-radius: 5px; padding: 0.1rem 0.35rem; }
.nf-tools { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.nf-seg { display: inline-flex; border: 1px solid var(--line-2); border-radius: 8px; overflow: hidden; }
.nf-seg button { border: none; background: transparent; color: rgba(255, 255, 255, 0.6); padding: 0.3rem 0.7rem; font-size: 0.78rem; cursor: pointer; } .nf-seg button.on { background: rgba(88, 166, 255, 0.18); color: #58a6ff; }
.nf-btn { border: 1px solid var(--line-2); background: transparent; color: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 0.3rem 0.6rem; font-size: 0.76rem; cursor: pointer; } .nf-btn.on { border-color: #58a6ff; color: #58a6ff; background: rgba(88, 166, 255, 0.12); }

.nf-body { min-height: 0; display: grid; grid-template-columns: 208px minmax(360px, 1.4fr) minmax(320px, 1fr); gap: 0.75rem; }
@media (max-width: 1080px) { .nf-body { grid-template-columns: 170px 1fr; } .nf-reader:not(.empty) { display: none; } .nf-reader.empty { display: none; } }

.nf-rail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 0.5rem; display: flex; flex-direction: column; gap: 0.12rem; }
.nf-rail-head { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); padding: 0.3rem 0.5rem; }
.nf-src { display: flex; align-items: center; gap: 0.5rem; border: none; background: transparent; color: rgba(255, 255, 255, 0.78); border-radius: 8px; padding: 0.4rem 0.5rem; font-size: 0.82rem; cursor: pointer; text-align: left; } .nf-src:hover { background: rgba(255, 255, 255, 0.05); } .nf-src.on { background: rgba(88, 166, 255, 0.14); color: #fff; }
.nf-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
.nf-src-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nf-src-n { font-size: 0.66rem; color: rgba(255, 255, 255, 0.4); }
.nf-tagrow { display: flex; align-items: center; gap: 0.15rem; border: none; background: transparent; color: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 0.28rem 0.5rem; font-size: 0.8rem; cursor: pointer; text-align: left; } .nf-tagrow:hover { background: rgba(255, 255, 255, 0.05); } .nf-tagrow.on { background: rgba(88, 166, 255, 0.14); color: #58a6ff; }
.nf-hash { color: var(--text-3); }
.nf-rail-hint { margin-top: auto; padding: 0.5rem; font-size: 0.64rem; color: rgba(255, 255, 255, 0.35); line-height: 1.5; }

.nf-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; }
.nf-empty { padding: 1.5rem; color: rgba(255, 255, 255, 0.45); font-size: 0.85rem; }

/* Lobsters story row */
.nf-story { display: flex; gap: 0.7rem; padding: 0.7rem 0.85rem; border-bottom: 1px solid var(--line); cursor: pointer; } .nf-story:hover { background: rgba(255, 255, 255, 0.03); } .nf-story.on { background: rgba(88, 166, 255, 0.1); box-shadow: inset 3px 0 0 #58a6ff; }
.nf-vote { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; flex: 0 0 2rem; padding-top: 0.1rem; }
.nf-up { border: none; background: transparent; color: rgba(255, 255, 255, 0.35); font-size: 0.9rem; line-height: 1; cursor: pointer; padding: 0.1rem; } .nf-up:hover { color: rgba(255, 255, 255, 0.7); } .nf-up.on { color: var(--up); }
.nf-up.sm, .nf-down.sm { font-size: 0.72rem; }
.nf-down { border: none; background: transparent; color: rgba(255, 255, 255, 0.3); font-size: 0.9rem; line-height: 1; cursor: pointer; padding: 0.1rem; } .nf-down:hover { color: var(--down); } .nf-down.on { color: var(--down); }
.nf-score { font-size: 0.82rem; font-weight: 700; color: rgba(255, 255, 255, 0.75); font-variant-numeric: tabular-nums; }
.nf-story-main { min-width: 0; flex: 1; }
.nf-story-head { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
.nf-story-title { font-size: 0.95rem; font-weight: 600; line-height: 1.35; color: #fff; text-decoration: none; } .nf-story-title:hover { color: #58a6ff; text-decoration: underline; }
.nf-domain { font-size: 0.7rem; color: rgba(255, 255, 255, 0.4); }
.nf-story-meta { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.35rem; }
.nf-tag { font-size: 0.68rem; color: #c9d1d9; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--line-2); border-radius: 999px; padding: 0.05rem 0.45rem; cursor: pointer; } .nf-tag:hover { border-color: #58a6ff; color: #58a6ff; }
.nf-q { font-size: 0.68rem; font-weight: 700; border-radius: 5px; padding: 0.03rem 0.34rem; } .nf-q.high { color: var(--up); background: rgba(63, 185, 80, 0.14); } .nf-q.medium { color: #e3b341; background: rgba(227, 179, 65, 0.16); } .nf-q.low { color: var(--down); background: rgba(248, 81, 73, 0.16); }
.nf-mem { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.06em; border-radius: 4px; padding: 0.03rem 0.3rem; font-weight: 700; }
.nf-mem.hold { color: #e3b341; background: rgba(227, 179, 65, 0.16); } .nf-mem.quarantine { color: var(--down); background: rgba(248, 81, 73, 0.16); } .nf-mem.reject { color: #8b949e; background: rgba(139, 148, 158, 0.16); } .nf-mem.admit { color: var(--up); background: rgba(63, 185, 80, 0.14); }
.nf-story-by { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; margin-top: 0.35rem; font-size: 0.72rem; color: rgba(255, 255, 255, 0.45); }
.nf-src-tag { font-weight: 700; } .nf-time { color: rgba(255, 255, 255, 0.4); }
.nf-auth { color: rgba(255, 255, 255, 0.5); }
.nf-hat { margin-left: 0.3rem; font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; border-radius: 4px; padding: 0.03rem 0.3rem; } .nf-hat.mod { color: #f0883e; background: rgba(240, 136, 62, 0.16); } .nf-hat.sme { color: #58a6ff; background: rgba(88, 166, 255, 0.16); } .nf-hat.source { color: var(--up); background: rgba(63, 185, 80, 0.14); }
.nf-link, .nf-flag { border: none; background: transparent; color: rgba(255, 255, 255, 0.5); font-size: 0.72rem; cursor: pointer; padding: 0; } .nf-link:hover { color: #58a6ff; } .nf-flag:hover { color: var(--down); } .nf-flag.done { color: var(--down); }
.nf-reasons { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.4rem; }
.nf-reasons-h { font-size: 0.68rem; color: var(--text-3); }
.nf-reasons button { border: 1px solid var(--line-2); background: var(--surface-2); color: rgba(255, 255, 255, 0.75); border-radius: 6px; padding: 0.12rem 0.45rem; font-size: 0.7rem; cursor: pointer; } .nf-reasons button:hover { border-color: var(--down); color: var(--down); }

/* Event Calendar lens */
.nf-list.calendar { padding: 0.35rem 0; }
.nf-day { border-bottom: 1px solid var(--line); } .nf-day:last-child { border-bottom: none; }
.nf-day-h { position: sticky; top: 0; z-index: 1; display: flex; align-items: baseline; gap: 0.5rem; padding: 0.45rem 0.85rem; background: var(--surface); border-bottom: 1px solid var(--line); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-2); font-weight: 700; }
.nf-day-c { font-size: 0.62rem; color: var(--text-3); background: var(--surface-2); border-radius: 999px; padding: 0.02rem 0.4rem; }
.nf-agenda { width: 100%; display: flex; align-items: baseline; gap: 0.7rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.55rem 0.85rem; cursor: pointer; text-align: left; } .nf-agenda:hover { background: var(--surface-2); } .nf-agenda.on { background: rgba(88, 166, 255, 0.1); box-shadow: inset 3px 0 0 #58a6ff; }
.nf-agenda-time { flex: 0 0 4rem; font-size: 0.72rem; color: var(--text-3); font-variant-numeric: tabular-nums; }
.nf-agenda-title { flex: 1; min-width: 0; font-size: 0.86rem; color: rgba(255, 255, 255, 0.85); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nf-agenda-src { flex: 0 0 auto; font-size: 0.72rem; }

/* Reader */
.nf-reader { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1.1rem 1.25rem; }
.nf-reader.empty { display: grid; place-items: center; color: rgba(255, 255, 255, 0.35); font-size: 0.85rem; }
.nf-reader-meta { display: flex; align-items: center; gap: 0.6rem; font-size: 0.72rem; }
.nf-reader-title { margin: 0.5rem 0 0.5rem; font-size: 1.35rem; line-height: 1.25; letter-spacing: -0.02em; }
.nf-reader-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.8rem; }
.nf-reader-body { margin: 0 0 1rem; font-size: 0.95rem; line-height: 1.6; color: rgba(255, 255, 255, 0.82); }
.nf-actions { display: flex; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap; }
.nf-act { border: 1px solid var(--line-2); background: transparent; color: rgba(255, 255, 255, 0.8); border-radius: 8px; padding: 0.4rem 0.8rem; font-size: 0.8rem; cursor: pointer; text-decoration: none; } .nf-act:hover { border-color: rgba(255, 255, 255, 0.3); } .nf-act.on { color: var(--up); border-color: rgba(63, 185, 80, 0.4); } .nf-act.primary { background: #1f6feb; border-color: #1f6feb; color: #fff; } .nf-act.done { color: var(--up); border-color: rgba(63, 185, 80, 0.4); cursor: default; }
.nf-block { border-top: 1px solid var(--line-2); padding: 0.8rem 0; }
.nf-block-h { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); margin-bottom: 0.5rem; }
.nf-claims { margin: 0; padding-left: 1.1rem; color: rgba(255, 255, 255, 0.72); font-size: 0.82rem; line-height: 1.6; }
.nf-kv { display: grid; grid-template-columns: 6rem 1fr; gap: 0.5rem; font-size: 0.76rem; padding: 0.15rem 0; } .nf-kv span { color: rgba(255, 255, 255, 0.4); } .nf-kv code { color: rgba(255, 255, 255, 0.75); font-family: ui-monospace, monospace; overflow-wrap: anywhere; } .nf-hashcode { color: rgba(255, 255, 255, 0.5) !important; font-size: 0.68rem; }
.nf-comment { display: flex; gap: 0.55rem; padding: 0.5rem 0; border-top: 1px solid var(--line); }
.nf-c-vote { display: flex; flex-direction: column; align-items: center; }
.nf-c-main { min-width: 0; flex: 1; }
.nf-c-by { font-size: 0.72rem; color: rgba(255, 255, 255, 0.6); font-weight: 600; } .nf-c-score { margin-left: 0.4rem; color: var(--text-3); font-weight: 700; }
.nf-c-body { margin: 0.2rem 0 0; font-size: 0.82rem; line-height: 1.5; color: rgba(255, 255, 255, 0.78); }
.nf-c-reason { margin-top: 0.25rem; font-size: 0.68rem; color: var(--down); }
</style>
