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
import { useRouter } from 'vue-router';
import { routeRegistry } from '../config/routeRegistry';
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
// Real screens, from the route registry (deduped by path).
const destinations: Dest[] = (() => {
  const seen = new Set<string>();
  const out: Dest[] = [];
  for (const e of routeRegistry) {
    if (seen.has(e.path)) continue;
    seen.add(e.path);
    out.push({ id: e.path, to: e.path, label: e.label, sub: e.domain });
  }
  return out;
})();

type Kind = 'nav' | 'chat';
interface Result { id: string; kind: Kind; icon: string; label: string; sub?: string; hint: string; to?: string; idx: number }

const flat = computed<Result[]>(() => {
  const ql = q.value.trim().toLowerCase();
  const navs = destinations
    .filter((d) => !ql || d.label.toLowerCase().includes(ql) || d.sub.toLowerCase().includes(ql))
    .slice(0, 7)
    .map((d) => ({ id: 'nav:' + d.id, kind: 'nav' as Kind, icon: '→', label: d.label, sub: d.sub, hint: 'Go', to: d.to }));
  const actions: Omit<Result, 'idx'>[] = q.value.trim()
    ? [{ id: 'chat', kind: 'chat', icon: '◇', label: `Ask Noetica`, sub: `“${q.value.trim()}”`, hint: 'Chat' }]
    : [];
  return [...navs, ...actions].map((r, i) => ({ ...r, idx: i }));
});

const grouped = computed(() => [
  { title: 'Go to', items: flat.value.filter((r) => r.kind === 'nav') },
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
  if (r.kind === 'nav' && r.to) router.push(r.to);
  else if (r.kind === 'chat') askNoetica(q.value.trim());
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
.cp-icon.chat { color: #b9a6f2; }
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
