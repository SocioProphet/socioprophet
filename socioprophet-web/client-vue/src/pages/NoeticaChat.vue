<template>
  <section class="nx" aria-label="Noetica chat">
    <header class="nx-head">
      <div class="nx-id">
        <span class="nx-glyph">◇</span>
        <div>
          <h1>Noetica</h1>
          <p>Your social surface into the agent — ask, and watch it reason.</p>
        </div>
      </div>
      <div class="nx-head-r">
        <span class="nx-sess">session {{ chat.sessionId.slice(0, 8) }}</span>
        <button v-if="chat.turns.value.length" class="nx-clear" @click="chat.reset()">Clear</button>
      </div>
    </header>

    <div ref="scrollEl" class="nx-stream">
      <!-- Empty state -->
      <div v-if="chat.turns.value.length === 0" class="nx-welcome">
        <div class="nx-w-glyph">◇</div>
        <h2>Talk to Noetica</h2>
        <p>The conversational counterpart to the cognition engine. Streamed answers with a live reasoning trace.</p>
        <div class="nx-suggest">
          <button v-for="s in suggestions" :key="s" class="nx-chip" @click="fillAndSend(s)">{{ s }}</button>
        </div>
      </div>

      <!-- Turns -->
      <div v-for="(t, i) in chat.turns.value" :key="i" class="nx-turn" :class="t.role">
        <template v-if="t.role === 'user'">
          <div class="nx-user"><div class="nx-bubble">{{ t.content }}</div></div>
        </template>
        <template v-else>
          <div class="nx-assistant">
            <div class="nx-a-label">
              <span class="nx-glyph sm">◇</span> Noetica
              <button v-if="t.trace && t.trace.length && !t.streaming" class="nx-trace-toggle" @click="toggleTrace(i)">
                {{ expanded.has(i) ? '▾' : '▸' }} reasoning ({{ t.trace.length }})
              </button>
            </div>
            <div v-if="t.trace && t.trace.length && (t.streaming || expanded.has(i))" class="nx-trace">
              <span v-for="(tr, j) in t.trace" :key="j" class="nx-tr" :class="tr.kind"><b>{{ tr.kind }}</b> {{ tr.text }}</span>
            </div>
            <div class="nx-a-body" :class="{ err: t.error }">
              {{ t.content }}<span v-if="t.streaming" class="nx-cursor">▍</span>
            </div>
            <div v-if="t.model || t.badge" class="nx-meta">
              <span v-if="t.model" class="nx-model">{{ t.model }}</span>
              <span v-if="t.badge" class="nx-badge">{{ t.badge }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Prompt -->
    <form class="nx-prompt" @submit.prevent="submit">
      <span class="nx-prompt-glyph">◇</span>
      <textarea
        ref="inputEl"
        v-model="draft"
        rows="1"
        placeholder="Ask Noetica…  (⏎ to send · ⇧⏎ for a new line)"
        @keydown="onKey"
      />
      <button type="submit" class="nx-send" :disabled="chat.busy.value || !draft.trim()">{{ chat.busy.value ? '…' : 'Send' }}</button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { useNoeticaChat } from '../composables/useNoeticaChat';

const chat = useNoeticaChat();
const draft = ref('');
const expanded = ref<Set<number>>(new Set());
function toggleTrace(i: number) { if (expanded.value.has(i)) expanded.value.delete(i); else expanded.value.add(i); }
const scrollEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLTextAreaElement | null>(null);

const suggestions = [
  'Summarize what changed in the provenance disclosure rule',
  'What is verified compute, in one paragraph?',
  'Draft a short brief on cross-border data flows',
];

function autoGrow() { const el = inputEl.value; if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(160, el.scrollHeight)}px`; }
watch(draft, () => nextTick(autoGrow));

function scrollToEnd() { const el = scrollEl.value; if (el) el.scrollTop = el.scrollHeight; }
watch(() => chat.turns.value.map((t) => t.content).join('|'), async () => { await nextTick(); scrollToEnd(); });
watch(() => chat.turns.value.length, async () => { await nextTick(); scrollToEnd(); });

async function submit() {
  const text = draft.value.trim();
  if (!text || chat.busy.value) return;
  draft.value = '';
  nextTick(autoGrow);
  await chat.send(text);
}
function fillAndSend(s: string) { draft.value = s; submit(); }
function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
}
onMounted(() => inputEl.value?.focus());
</script>

<style scoped>
.nx { height: 100%; min-height: 0; display: grid; grid-template-rows: auto 1fr auto; background: var(--bg); color: rgba(255, 255, 255, 0.92); }
.nx-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.9rem 1.25rem; border-bottom: 1px solid var(--line-2); }
.nx-id { display: flex; align-items: center; gap: 0.75rem; }
.nx-glyph { color: #c58af9; font-size: 1.3rem; } .nx-glyph.sm { font-size: 0.85rem; }
.nx-id h1 { margin: 0; font-size: 1.15rem; } .nx-id p { margin: 0.1rem 0 0; font-size: 0.78rem; color: rgba(255, 255, 255, 0.5); }
.nx-head-r { display: flex; align-items: center; gap: 0.75rem; }
.nx-sess { font-size: 0.7rem; color: rgba(255, 255, 255, 0.4); font-family: ui-monospace, monospace; }
.nx-clear { border: 1px solid var(--line-2); background: transparent; color: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 0.25rem 0.6rem; font-size: 0.74rem; cursor: pointer; }

.nx-stream { min-height: 0; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1.1rem; }
.nx-welcome { margin: auto; max-width: 30rem; text-align: center; color: rgba(255, 255, 255, 0.7); }
.nx-w-glyph { font-size: 2.4rem; color: #c58af9; } .nx-welcome h2 { margin: 0.4rem 0 0.3rem; font-size: 1.35rem; color: #fff; } .nx-welcome p { margin: 0 0 1.1rem; font-size: 0.9rem; color: rgba(255, 255, 255, 0.55); }
.nx-suggest { display: grid; gap: 0.5rem; }
.nx-chip { border: 1px solid var(--line-2); background: var(--surface); color: rgba(255, 255, 255, 0.8); border-radius: 10px; padding: 0.55rem 0.8rem; font-size: 0.82rem; cursor: pointer; text-align: left; } .nx-chip:hover { border-color: #c58af9; }

.nx-turn { display: flex; }
.nx-user { margin-left: auto; max-width: 78%; } .nx-bubble { background: #1f6feb; color: #fff; border-radius: 14px 14px 4px 14px; padding: 0.6rem 0.85rem; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap; }
.nx-assistant { max-width: 82%; }
.nx-a-label { display: flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; color: #c58af9; margin-bottom: 0.35rem; }
.nx-trace-toggle { border: none; background: transparent; color: rgba(255, 255, 255, 0.4); font-size: 0.66rem; cursor: pointer; padding: 0 0.2rem; } .nx-trace-toggle:hover { color: rgba(197, 138, 249, 0.9); }
.nx-trace { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.45rem; }
.nx-tr { font-size: 0.66rem; color: rgba(255, 255, 255, 0.6); background: rgba(255, 255, 255, 0.04); border: 1px solid var(--line-2); border-radius: 5px; padding: 0.08rem 0.4rem; } .nx-tr b { color: rgba(197, 138, 249, 0.9); text-transform: uppercase; letter-spacing: 0.03em; font-size: 0.58rem; margin-right: 0.25rem; }
.nx-a-body { background: var(--surface); border: 1px solid var(--line-2); border-radius: 4px 14px 14px 14px; padding: 0.7rem 0.9rem; font-size: 0.92rem; line-height: 1.6; white-space: pre-wrap; color: rgba(255, 255, 255, 0.9); } .nx-a-body.err { color: #fca5a5; }
.nx-cursor { color: #c58af9; }
.nx-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; margin-top: 0.35rem; }
.nx-model { font-size: 0.64rem; font-family: ui-monospace, monospace; color: rgba(255, 255, 255, 0.5); }
.nx-badge { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--up); background: rgba(63, 185, 80, 0.12); border: 1px solid rgba(63, 185, 80, 0.3); border-radius: 5px; padding: 0.05rem 0.4rem; }

.nx-prompt { display: flex; align-items: flex-end; gap: 0.6rem; padding: 0.85rem 1.1rem; border-top: 1px solid var(--line-2); background: #0b0f14; }
.nx-prompt-glyph { color: #c58af9; font-size: 1.05rem; padding-bottom: 0.4rem; }
.nx-prompt textarea { flex: 1; resize: none; min-height: 1.4rem; max-height: 160px; background: var(--surface); border: 1px solid var(--line-2); border-radius: 12px; color: #fff; font: inherit; font-size: 0.92rem; line-height: 1.5; padding: 0.55rem 0.8rem; outline: none; } .nx-prompt textarea:focus { border-color: #c58af9; }
.nx-send { border: none; background: #7c3aed; color: #fff; border-radius: 10px; padding: 0.55rem 1rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; } .nx-send:disabled { opacity: 0.5; }
</style>
