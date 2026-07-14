<template>
  <Transition name="cp">
    <div v-if="open" class="cp-backdrop" @click="close" @keydown.esc="close">
      <div class="cp" role="dialog" aria-label="Command palette" @click.stop>
        <div class="cp-input-row">
          <span class="cp-glyph">⌕</span>
          <input
            ref="inputEl"
            v-model="q"
            type="text"
            spellcheck="false"
            aria-label="Search, jump to a screen, or ask Noetica"
            placeholder="Search, jump to a screen, or ask Noetica…"
            @keydown="onKey"
          />
          <kbd class="cp-esc">esc</kbd>
        </div>
        <div ref="listEl" class="cp-results">
          <template v-for="(grp, gi) in grouped" :key="gi">
            <div v-if="grp.items.length" class="cp-group">{{ grp.title }}</div>
            <button
              v-for="r in grp.items"
              :key="r.id"
              class="cp-item"
              :class="{ on: r.idx === active }"
              @click="run(r)"
              @mousemove="active = r.idx"
            >
              <span class="cp-icon" :class="r.kind">{{ r.icon }}</span>
              <span class="cp-text"><span class="cp-label">{{ r.label }}</span><span v-if="r.sub" class="cp-sub">{{ r.sub }}</span></span>
              <span class="cp-hint">{{ r.hint }}</span>
            </button>
          </template>
          <p v-if="flat.length === 0" class="cp-empty">No matches — press ⏎ to ask Noetica.</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useRouter, type RouteLocationRaw } from 'vue-router';
import { ALL_SURFACES } from '../config/cockpitNav';
import { newsItems, newsSources } from '../data/newsFeedFixture';
import { entities } from '../data/peopleFixture';
import { indices, watchlist } from '../data/marketsFixture';
import { dockets } from '../data/lawFixture';
import { regions } from '../data/weatherFixture';
import { indicators, sectors } from '../data/economyFixture';
import { useNoeticaChat } from '../composables/useNoeticaChat';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const router = useRouter();
const chat = useNoeticaChat();
const q = ref('');
const active = ref(0);
const inputEl = ref<HTMLInputElement | null>(null);
const listEl = ref<HTMLElement | null>(null);

interface Dest { id: string; to: string; label: string; sub: string }
// Every reachable surface across the domain menus + drawer sections (deduped),
// so ⌘K can jump to anything — including operator/SourceOS surfaces not in the
// curated route registry.
const destinations: Dest[] = ALL_SURFACES.map((s) => ({ id: s.to, to: s.to, label: s.label, sub: s.group }));

type Kind = 'nav' | 'article' | 'entity' | 'market' | 'docket' | 'region' | 'econ' | 'chat';
interface Result { id: string; kind: Kind; icon: string; label: string; sub?: string; hint: string; route?: RouteLocationRaw; idx: number }

const srcTitle = new Map(newsSources.map((s) => [s.id, s.title]));

const flat = computed<Result[]>(() => {
  const ql = q.value.trim().toLowerCase();
  const navs = destinations
    .filter((d) => !ql || d.label.toLowerCase().includes(ql) || d.sub.toLowerCase().includes(ql))
    .slice(0, ql ? 5 : 7)
    .map((d) => ({ id: 'nav:' + d.id, kind: 'nav' as Kind, icon: '→', label: d.label, sub: d.sub, hint: 'Go', route: d.to }));

  const articles = ql
    ? newsItems
        .filter((n) => n.title.toLowerCase().includes(ql) || n.summary.toLowerCase().includes(ql) || n.entities.some((e) => e.toLowerCase().includes(ql)))
        .slice(0, 5)
        .map((n) => ({ id: 'art:' + n.id, kind: 'article' as Kind, icon: '📰', label: n.title, sub: srcTitle.get(n.sourceId) ?? 'News', hint: 'Read', route: { path: '/news', query: { item: n.id } } }))
    : [];

  const ents = ql
    ? entities
        .filter((e) => e.name.toLowerCase().includes(ql) || e.role.toLowerCase().includes(ql) || e.affiliation.toLowerCase().includes(ql) || e.tags.some((t) => t.toLowerCase().includes(ql)))
        .slice(0, 5)
        .map((e) => ({ id: 'ent:' + e.id, kind: 'entity' as Kind, icon: '◉', label: e.name, sub: `${e.role} · ${e.affiliation}`, hint: 'Open', route: { path: '/people/search', query: { id: e.id } } }))
    : [];

  const markets = ql
    ? [...indices, ...watchlist]
        .filter((i) => i.symbol.toLowerCase().includes(ql) || i.name.toLowerCase().includes(ql))
        .slice(0, 4)
        .map((i) => ({ id: 'mkt:' + i.symbol, kind: 'market' as Kind, icon: '▤', label: i.symbol, sub: i.name, hint: 'Markets', route: { path: '/markets/indices-funds', query: { sym: i.symbol } } }))
    : [];

  const law = ql
    ? dockets
        .filter((d) => d.title.toLowerCase().includes(ql) || d.cite.toLowerCase().includes(ql))
        .slice(0, 4)
        .map((d) => ({ id: 'law:' + d.id, kind: 'docket' as Kind, icon: '§', label: d.title, sub: d.cite, hint: 'Docket', route: { path: '/law/international-law', query: { d: d.id } } }))
    : [];

  const weather = ql
    ? regions
        .filter((r) => r.name.toLowerCase().includes(ql) || r.country.toLowerCase().includes(ql))
        .slice(0, 4)
        .map((r) => ({ id: 'wx:' + r.id, kind: 'region' as Kind, icon: '☁', label: r.name, sub: r.country, hint: 'Weather', route: { path: '/weather/forecast', query: { r: r.id } } }))
    : [];

  const econ = ql
    ? [...indicators.map((k) => ({ t: 'indicator', id: k.id, name: k.name })), ...sectors.map((s) => ({ t: 'sector', id: s.id, name: s.name }))]
        .filter((x) => x.name.toLowerCase().includes(ql))
        .slice(0, 4)
        .map((x) => ({ id: 'ec:' + x.id, kind: 'econ' as Kind, icon: '⌁', label: x.name, sub: x.t, hint: 'Economy', route: { path: '/economy/macro-economics', query: { k: x.id, kind: x.t } } }))
    : [];

  const actions: Omit<Result, 'idx'>[] = q.value.trim()
    ? [{ id: 'chat', kind: 'chat', icon: '◇', label: `Ask Noetica`, sub: `“${q.value.trim()}”`, hint: 'Chat' }]
    : [];
  return [...navs, ...articles, ...ents, ...markets, ...law, ...weather, ...econ, ...actions].map((r, i) => ({ ...r, idx: i }));
});

const grouped = computed(() => [
  { title: 'Go to', items: flat.value.filter((r) => r.kind === 'nav') },
  { title: 'Articles', items: flat.value.filter((r) => r.kind === 'article') },
  { title: 'People', items: flat.value.filter((r) => r.kind === 'entity') },
  { title: 'Markets', items: flat.value.filter((r) => r.kind === 'market') },
  { title: 'Dockets', items: flat.value.filter((r) => r.kind === 'docket') },
  { title: 'Weather', items: flat.value.filter((r) => r.kind === 'region') },
  { title: 'Economy', items: flat.value.filter((r) => r.kind === 'econ') },
  { title: 'Assistant', items: flat.value.filter((r) => r.kind === 'chat') },
]);

watch(() => props.open, async (o) => {
  if (o) { q.value = ''; active.value = 0; await nextTick(); inputEl.value?.focus(); }
});
watch(flat, () => { active.value = 0; });

function close() { emit('close'); }
function onKey(e: KeyboardEvent) {
  const n = flat.value.length;
  if (e.key === 'Escape') { e.preventDefault(); close(); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); if (n) active.value = (active.value + 1) % n; scrollActive(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) active.value = (active.value - 1 + n) % n; scrollActive(); }
  else if (e.key === 'Enter') { e.preventDefault(); const r = flat.value[active.value]; if (r) run(r); else if (q.value.trim()) askNoetica(q.value.trim()); }
}
async function scrollActive() { await nextTick(); listEl.value?.querySelector('.cp-item.on')?.scrollIntoView({ block: 'nearest' }); }

function run(r: Result) {
  close();
  if (r.kind === 'chat') askNoetica(q.value.trim());
  else if (r.route) router.push(r.route);
}
async function askNoetica(text: string) {
  if (!text) return;
  await router.push('/noetica');
  chat.send(text);
}
</script>

<style scoped>
.cp-backdrop { position: fixed; inset: 0; z-index: 1300; display: flex; justify-content: center; align-items: flex-start; padding-top: 14vh; background: rgba(4, 5, 8, 0.55); backdrop-filter: blur(4px); }
.cp { width: min(600px, 92vw); background: var(--surface); border: 1px solid var(--line-2); border-radius: 16px; box-shadow: var(--shadow, 0 24px 60px rgba(0, 0, 0, 0.5)); overflow: hidden; }
.cp-input-row { display: flex; align-items: center; gap: 0.7rem; padding: 0.9rem 1.1rem; border-bottom: 1px solid var(--line); }
.cp-glyph { color: var(--text-3); font-size: 1.1rem; }
.cp-input-row input { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-size: 1.05rem; }
.cp-input-row input::placeholder { color: var(--text-3); }
.cp-esc { font-size: 0.62rem; color: var(--text-3); border: 1px solid var(--line-2); border-radius: 5px; padding: 0.1rem 0.35rem; }
.cp-results { max-height: 52vh; overflow-y: auto; padding: 0.4rem; }
.cp-group { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.09em; color: var(--text-3); padding: 0.5rem 0.6rem 0.3rem; }
.cp-item { width: 100%; display: flex; align-items: center; gap: 0.7rem; border: none; background: transparent; color: inherit; padding: 0.55rem 0.6rem; border-radius: 10px; cursor: pointer; text-align: left; }
.cp-item.on { background: var(--accent-soft); }
.cp-icon { flex: 0 0 auto; width: 1.6rem; height: 1.6rem; display: grid; place-items: center; border-radius: 8px; background: rgba(255, 255, 255, 0.05); color: var(--text-2); font-size: 0.85rem; }
.cp-item.on .cp-icon { color: var(--accent); }
.cp-icon.chat { color: var(--accent); }
.cp-text { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 0.5rem; }
.cp-label { font-size: 0.9rem; color: var(--text); white-space: nowrap; }
.cp-sub { font-size: 0.78rem; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp-hint { font-size: 0.66rem; color: var(--text-3); }
.cp-empty { padding: 1rem 0.6rem; color: var(--text-3); font-size: 0.85rem; }
.cp-enter-active, .cp-leave-active { transition: opacity 0.14s ease; }
.cp-enter-active .cp, .cp-leave-active .cp { transition: transform 0.14s ease, opacity 0.14s ease; }
.cp-enter-from, .cp-leave-to { opacity: 0; }
.cp-enter-from .cp, .cp-leave-to .cp { transform: translateY(-8px) scale(0.99); opacity: 0; }
</style>
