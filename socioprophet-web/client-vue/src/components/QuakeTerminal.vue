<template>
  <section class="qt" :class="variant" role="region" aria-label="Operator terminal">
    <!-- Cloud Shell–style toolbar -->
    <header class="qt-bar">
      <div class="qt-title">
        <span class="qt-glyph">›_</span>
        <span class="qt-name">SourceOS Shell</span>
      </div>
      <div class="qt-tabs">
        <button
          v-for="t in tools"
          :key="t"
          type="button"
          class="qt-tab"
          :class="{ on: term.tool.value === t }"
          @click="term.tool.value = t"
        >
          <span class="qt-tdot" :class="{ up: term.status.value?.tools[t]?.installed }" />{{ t }}
        </button>
      </div>
      <div class="qt-actions">
        <span v-if="term.exitCode.value !== null" class="qt-exit" :class="{ ok: term.exitCode.value === 0 }">
          exit {{ term.exitCode.value }}
        </span>
        <button type="button" class="qt-ic" title="Clear (⌃L)" aria-label="Clear" @click="term.clear()">⟲</button>
        <button
          v-if="variant !== 'docked'"
          type="button"
          class="qt-ic"
          :title="variant === 'popout' ? 'Restore to drop-down' : 'Open in full window'"
          :aria-label="variant === 'popout' ? 'Restore' : 'Maximize'"
          @click="emit('toggle-popout')"
        >{{ variant === 'popout' ? '❐' : '⤢' }}</button>
        <button
          v-if="variant !== 'docked'"
          type="button"
          class="qt-ic close"
          title="Close (⌃`)"
          aria-label="Close"
          @click="emit('close')"
        >✕</button>
      </div>
    </header>

    <!-- Console -->
    <div ref="bodyEl" class="qt-body" @click="focusInput">
      <div v-for="(l, i) in term.log.value" :key="i" class="qt-line" :class="l.kind">
        <template v-if="l.kind === 'cmd'"><span class="qt-prompt"><b>you</b>@sourceos<span class="qt-cwd">:~</span>$</span> {{ l.text }}</template>
        <template v-else>{{ l.text }}</template>
      </div>
      <div v-if="term.running.value" class="qt-line running"><span class="qt-spin">▍</span> running…</div>

      <!-- live prompt -->
      <form class="qt-input" @submit.prevent="term.run()">
        <span class="qt-prompt"><b>you</b>@sourceos<span class="qt-cwd">:~</span> <span class="qt-tool">({{ term.tool.value }})</span>$</span>
        <input
          ref="inputEl"
          v-model="term.input.value"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          :placeholder="term.cur.value?.installed === false ? `${term.cur.value.bin} not installed — commands echo only` : 'type a command…'"
          @keydown.up.prevent="term.recallPrev()"
          @keydown.down.prevent="term.recallNext()"
        />
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue';
import { useOperatorTerminal, type ToolName } from '../composables/useOperatorTerminal';

const props = withDefaults(defineProps<{ variant?: 'quake' | 'popout' | 'docked' }>(), { variant: 'quake' });
const emit = defineEmits<{ (e: 'close'): void; (e: 'toggle-popout'): void }>();

const tools: ToolName[] = ['prophet', 'sourceosctl'];
const term = useOperatorTerminal();
const bodyEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);

function focusInput() { inputEl.value?.focus(); }
function scrollToEnd() { const el = bodyEl.value; if (el) el.scrollTop = el.scrollHeight; }

onMounted(async () => {
  await term.loadStatus();
  await nextTick();
  scrollToEnd();
  if (props.variant !== 'docked') focusInput();
});

// Keep the console pinned to the newest line.
watch(() => term.log.value.length, async () => { await nextTick(); scrollToEnd(); });
watch(() => term.running.value, async () => { await nextTick(); scrollToEnd(); });
</script>

<style scoped>
/* Google Cloud Shell chrome: dark toolbar, near-black console, monospace. */
.qt {
  display: flex;
  flex-direction: column;
  background: #1b1b1d;
  color: #e8eaed;
  font-family: 'Roboto Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  overflow: hidden;
  border: 1px solid #000;
}

/* Quake / Tilix drop-down: slams down from the top edge, full width. */
.qt.quake {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 46vh;
  z-index: 1200;
  border-top: none;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.55);
}

/* Pop-out: near-fullscreen floating window. */
.qt.popout {
  position: fixed;
  top: 4vh; left: 5vw; right: 5vw; bottom: 5vh;
  height: auto;
  z-index: 1200;
  border-radius: 12px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
}

/* Docked: fills its container (the route page panel). */
.qt.docked {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 26rem;
  border-radius: 12px;
}

.qt-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.5rem 0 0.85rem;
  height: 2.4rem;
  background: #2b2c2f;
  border-bottom: 1px solid #000;
  flex: 0 0 auto;
}
.qt-title { display: flex; align-items: center; gap: 0.45rem; }
.qt-glyph { color: #8ab4f8; font-weight: 700; letter-spacing: -1px; }
.qt-name { font-size: 0.78rem; color: #e8eaed; font-family: Roboto, system-ui, sans-serif; }
.qt-tabs { display: flex; gap: 0.25rem; margin-left: 0.5rem; }
.qt-tab {
  display: inline-flex; align-items: center; gap: 0.4rem;
  border: none; background: transparent; color: #9aa0a6;
  border-radius: 6px 6px 0 0; padding: 0.3rem 0.6rem; font-size: 0.74rem; cursor: pointer;
  font-family: 'Roboto Mono', monospace;
}
.qt-tab.on { background: #1b1b1d; color: #e8eaed; }
.qt-tdot { width: 6px; height: 6px; border-radius: 50%; background: #5f6368; }
.qt-tdot.up { background: #81c995; }
.qt-actions { margin-left: auto; display: flex; align-items: center; gap: 0.15rem; }
.qt-exit { font-size: 0.68rem; color: #f28b82; margin-right: 0.4rem; } .qt-exit.ok { color: #81c995; }
.qt-ic {
  width: 1.8rem; height: 1.8rem; display: inline-flex; align-items: center; justify-content: center;
  border: none; background: transparent; color: #9aa0a6; border-radius: 6px; cursor: pointer; font-size: 0.9rem;
}
.qt-ic:hover { background: rgba(255, 255, 255, 0.08); color: #e8eaed; }
.qt-ic.close:hover { background: rgba(242, 139, 130, 0.18); color: #f28b82; }

.qt-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0.6rem 0.85rem 0.9rem;
  background: #1b1b1d;
  font-size: 0.8rem;
  line-height: 1.55;
  cursor: text;
}
.qt-line { white-space: pre-wrap; word-break: break-word; }
.qt-line.out { color: #e8eaed; }
.qt-line.err { color: #f28b82; }
.qt-line.sys { color: #9aa0a6; }
.qt-line.cmd { color: #fff; }
.qt-line.running { color: #fdd663; }
.qt-prompt { color: #81c995; user-select: none; }
.qt-prompt b { color: #81c995; font-weight: 700; }
.qt-cwd { color: #8ab4f8; }
.qt-tool { color: #c58af9; }
.qt-spin { color: #fdd663; }

.qt-input { display: flex; align-items: baseline; gap: 0.4rem; margin-top: 0.1rem; }
.qt-input input {
  flex: 1; min-width: 0; background: transparent; border: none; outline: none;
  color: #fff; font-family: inherit; font-size: 0.8rem; caret-color: #8ab4f8;
}
.qt-input input::placeholder { color: #5f6368; }
</style>
