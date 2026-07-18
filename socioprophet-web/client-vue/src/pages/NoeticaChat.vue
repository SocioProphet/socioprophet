<template>
  <!-- Cockpit's Noetica surface, styled to match the real Noetica app
       (~/dev/Noetica: "claude" dark theme, blue #1D4ED8 accent, N₀ mark,
       avatar + flat-content assistant turns, trace disclosure, inverted send).
       The Noetica palette is scoped locally here so the surface looks like
       Noetica regardless of the cockpit's own (amber) theme. -->
  <section class="nx" aria-label="Noetica chat">
    <header class="nx-head">
      <div class="nx-id">
        <span class="nx-mark nx-mark--sm"><NoeticaMark /></span>
        <span class="nx-name">Noetica</span>
        <span class="nx-localpill" title="Local-first — your data never leaves this device">Local-first</span>
      </div>
      <div class="nx-head-r">
        <span class="nx-sess">session {{ chat.sessionId.slice(0, 8) }}</span>
        <button v-if="chat.turns.value.length" class="nx-clear" @click="chat.reset()">Clear</button>
      </div>
    </header>

    <div ref="scrollEl" class="nx-stream">
      <div class="nx-col">
        <!-- Empty / welcome state -->
        <div v-if="chat.turns.value.length === 0" class="nx-welcome">
          <div class="nx-welcome-id">
            <span class="nx-avatar nx-avatar--lg"><NoeticaMark /></span>
            <h1 class="nx-greeting">{{ greeting }}</h1>
          </div>
          <p class="nx-tagline">Local-first · your data never leaves this device</p>
          <div class="nx-suggest">
            <button v-for="s in suggestions" :key="s.text" class="nx-chip" @click="fillAndSend(s.text)">
              <span class="nx-chip-glyph" aria-hidden="true">{{ s.glyph }}</span>{{ s.label }}
            </button>
          </div>
        </div>

        <!-- Turns -->
        <template v-for="(t, i) in chat.turns.value" :key="i">
          <!-- User: right-aligned subtle bubble, capped at 60% -->
          <article v-if="t.role === 'user'" class="nx-turn nx-turn--user">
            <div class="nx-user-bubble">{{ t.content }}</div>
          </article>

          <!-- Assistant: avatar + flat content (no card) -->
          <article v-else class="nx-turn nx-turn--assistant">
            <div class="nx-avatar"><NoeticaMark /></div>
            <div class="nx-a-col">
              <div class="nx-a-label">Noetica</div>

              <!-- Reasoning trace disclosure (the moat, made visible) — structured -->
              <details v-if="hasTrace(t)" class="nx-trace" :open="t.streaming || expanded.has(i)">
                <summary class="nx-trace-summary" @click.prevent="toggleTrace(i)">
                  <span class="nx-trace-caret" :class="{ open: t.streaming || expanded.has(i) }">▶</span>
                  <span class="nx-trace-title">Reasoning</span>
                  <span v-if="traceCount(t)" class="nx-trace-count">{{ traceCount(t) }}</span>
                </summary>
                <div class="nx-trace-body">
                  <NoeticaTrace :turn="t" />
                </div>
              </details>

              <!-- Main content (reasoning split into a collapsible block) -->
              <div class="nx-a-body" :class="{ err: t.error }">
                <template v-if="t.content || t.thinking">
                  <details v-if="mparts(t).reasoning" class="nx-think" :open="mparts(t).thinkingOpen">
                    <summary>{{ mparts(t).thinkingOpen ? 'Thinking…' : 'Reasoning' }}</summary>
                    <div class="nx-think-body">{{ mparts(t).reasoning }}</div>
                  </details>
                  <div v-if="mparts(t).answer" class="nx-md" v-html="renderMarkdown(mparts(t).answer)" />
                  <span v-if="t.streaming" class="nx-cursor">▍</span>
                </template>
                <span v-else-if="t.streaming" class="nx-thinking">
                  <span class="nx-dot" /><span class="nx-dot" /><span class="nx-dot" /> thinking…
                </span>
              </div>

              <!-- Plan-mode approval gate -->
              <div v-if="t.awaitingApproval && !t.streaming" class="nx-gate">
                <span class="nx-gate-txt">Ready to execute — approve to run this plan, or reject to revise.</span>
                <button class="nx-gate-reject" @click="chat.rejectPlan(i)">Reject</button>
                <button class="nx-gate-approve" :disabled="chat.busy.value" @click="chat.approvePlan(i)">Approve &amp; Execute</button>
              </div>

              <!-- Governance / model footer -->
              <div v-if="t.model || t.badge" class="nx-meta">
                <span v-if="t.badge" class="nx-badge">◆ {{ t.badge }}</span>
                <span v-if="t.model" class="nx-model">{{ t.model }}</span>
              </div>

              <!-- Message actions -->
              <div v-if="!t.streaming && (t.content || t.thinking)" class="nx-actions">
                <button class="nx-act" @click="copyTurn(t)" title="Copy">⧉</button>
                <button class="nx-act" :class="{ on: speakingIdx === i }" @click="speakTurn(i, t)" title="Read aloud">🔊</button>
                <button class="nx-act" :class="{ on: t.rating === 'up' }" @click="chat.feedback(i, 'up')" title="Good answer" aria-label="Good answer">▲</button>
                <button class="nx-act" :class="{ on: t.rating === 'down' }" @click="chat.feedback(i, 'down')" title="Poor answer" aria-label="Poor answer">▼</button>
                <button v-if="i === lastAsstIdx" class="nx-act" :disabled="chat.busy.value" @click="chat.regenerate()" title="Regenerate">⟳</button>
              </div>
            </div>
          </article>
        </template>
      </div>
    </div>

    <!-- Composer -->
    <div class="nx-composer">
      <form class="nx-input" @submit.prevent="submit">
        <textarea
          ref="inputEl"
          v-model="draft"
          rows="1"
          aria-label="Message Noetica"
          placeholder="Ask Noetica…  (⏎ to send · ⇧⏎ for a new line)"
          @keydown="onKey"
        />
        <div class="nx-toolbar">
          <!-- knowledge scope -->
          <div class="nx-scope">
            <button type="button" class="nx-scope-btn" @click="showScope = !showScope" :title="'Knowledge scope'">
              ⌾ <span class="nx-scope-label">{{ scopeLabel }}</span> ▾
            </button>
            <div v-if="showScope" class="nx-scope-menu">
              <button type="button" :class="{ on: chat.retrievalScope.value === 'chat' }" @click="pickScope('chat')">This chat only</button>
              <div v-if="projects.projects.length" class="nx-scope-sec">Projects</div>
              <button v-for="p in projects.projects" :key="p.id"
                :class="{ on: chat.retrievalScope.value === 'project' && projects.activeId === p.id }" @click="pickProject(p.id)">{{ p.title }}</button>
              <button type="button" :class="{ on: chat.retrievalScope.value === 'everything' }" @click="pickScope('everything')">Everything</button>
              <button type="button" class="nx-scope-new" @click="newProject">+ New project</button>
            </div>
          </div>

          <!-- composer controls — all just shape the /api/chat request -->
          <div class="nx-seg" role="group" aria-label="Agent mode">
            <button v-for="m in agentModes" :key="m" type="button" :class="{ on: chat.agentMode.value === m }"
              @click="chat.agentMode.value = m" :title="'Agent mode: ' + m">{{ m }}</button>
          </div>
          <div class="nx-seg" role="group" aria-label="Reply length">
            <button v-for="l in replyLengths" :key="l" type="button" :class="{ on: chat.replyLength.value === l }"
              @click="chat.replyLength.value = l" :title="'Reply length: ' + l">{{ l[0].toUpperCase() }}</button>
          </div>
          <button type="button" class="nx-toggle" :class="{ on: chat.webMode.value }"
            @click="chat.webMode.value = !chat.webMode.value" :aria-pressed="chat.webMode.value" title="Search the web">web</button>

          <span class="nx-spacer" />
          <span class="nx-toolbar-hint">⏎ send</span>
          <button v-if="chat.busy.value" type="button" class="nx-send nx-stopbtn" @click="chat.stop()" aria-label="Stop">
            <span class="nx-stop" aria-hidden="true" />
          </button>
          <button v-else type="submit" class="nx-send" :disabled="!draft.trim()" aria-label="Send">
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path d="M12 19V5M12 5l-6 6M12 5l6 6" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from 'vue';
import { useNoeticaChat, type ChatTurn } from '../composables/useNoeticaChat';
import { useProjects } from '../stores/projects';
import { renderMarkdown } from '../utils/markdown';
import NoeticaMark from '../components/NoeticaMark.vue';
import NoeticaTrace from '../components/NoeticaTrace.vue';

function hasTrace(t: ChatTurn): boolean {
  return !!(t.trace?.length || t.plan?.steps?.length || t.retrieval || t.grounding || t.judgment?.verdict || t.intentName);
}
function traceCount(t: ChatTurn): number {
  return (t.trace?.length ?? 0) + (t.plan?.steps?.length ?? 0);
}

const chat = useNoeticaChat();
const projects = useProjects();
const agentModes = ['auto', 'plan', 'ask'] as const;
const replyLengths = ['short', 'medium', 'long'] as const;
const draft = ref('');

// ── knowledge-scope picker ──
const showScope = ref(false);
const scopeLabel = computed(() => {
  if (chat.retrievalScope.value === 'everything') return 'Everything';
  if (chat.retrievalScope.value === 'project') return projects.active?.title ?? 'This chat';
  return 'This chat';
});
function pickScope(s: 'chat' | 'project' | 'everything') { chat.retrievalScope.value = s; showScope.value = false; }
function pickProject(id: string) { projects.setActive(id); chat.retrievalScope.value = 'project'; showScope.value = false; }
function newProject() {
  const name = window.prompt('New project name');
  if (name && name.trim()) { const p = projects.create(name); chat.retrievalScope.value = 'project'; void p; }
  showScope.value = false;
}
const expanded = ref<Set<number>>(new Set());
function toggleTrace(i: number) { if (expanded.value.has(i)) expanded.value.delete(i); else expanded.value.add(i); }
const scrollEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLTextAreaElement | null>(null);

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
});

const suggestions = [
  { glyph: '◆', label: 'Explain verified compute', text: 'What is verified compute, in one paragraph?' },
  { glyph: '⌕', label: 'Summarize a rule change', text: 'Summarize what changed in the provenance disclosure rule' },
  { glyph: '✎', label: 'Draft a brief', text: 'Draft a short brief on cross-border data flows' },
];

function autoGrow() { const el = inputEl.value; if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(200, el.scrollHeight)}px`; }
watch(draft, () => nextTick(autoGrow));

// Qwen3 (and other reasoning models) emit a <think>…</think> block before the answer.
// Split it out so the UI shows a collapsible "reasoning" section, not raw tags.
function splitThink(content: string): { reasoning: string; answer: string; thinking: boolean } {
  const open = content.indexOf('<think>');
  if (open === -1) return { reasoning: '', answer: content, thinking: false };
  const close = content.indexOf('</think>');
  if (close === -1) return { reasoning: content.slice(open + 7), answer: '', thinking: true };
  return { reasoning: content.slice(open + 7, close).trim(), answer: content.slice(close + 8).trim(), thinking: false };
}

// Reasoning + answer for a turn: prefer the separately-streamed `thinking` channel
// (thinking_delta); fall back to splitting an inline <think> block out of the content.
function mparts(t: ChatTurn): { reasoning: string; answer: string; thinkingOpen: boolean } {
  if (t.thinking) return { reasoning: t.thinking, answer: t.content, thinkingOpen: !!t.streaming && !t.content };
  const s = splitThink(t.content);
  return { reasoning: s.reasoning, answer: s.answer, thinkingOpen: s.thinking };
}

// ── message actions ──
const lastAsstIdx = computed(() => {
  const ts = chat.turns.value;
  for (let i = ts.length - 1; i >= 0; i--) if (ts[i].role === 'assistant') return i;
  return -1;
});
function copyTurn(t: ChatTurn) { void navigator.clipboard?.writeText(mparts(t).answer || t.content); }
const speakingIdx = ref<number | null>(null);
function speakTurn(i: number, t: ChatTurn) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  if (speakingIdx.value === i) { synth.cancel(); speakingIdx.value = null; return; }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(mparts(t).answer || t.content);
  u.onend = () => { if (speakingIdx.value === i) speakingIdx.value = null; };
  speakingIdx.value = i;
  synth.speak(u);
}

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
/* Noetica "claude" dark theme tokens — scoped so this surface looks like the
   real Noetica app independent of the cockpit's global (amber) theme. */
.nx {
  --nb: #1e1e1e;      /* background primary */
  --ns: #262626;      /* background secondary */
  --nt: #2d2d2d;      /* background tertiary */
  --ntext: #ece9e3;   /* text primary */
  --ntext2: #a8a29e;  /* text secondary */
  --ntext3: #78716c;  /* text tertiary */
  --nline: rgba(255, 255, 255, 0.08);
  --nline-weak: rgba(255, 255, 255, 0.04);
  --nline-strong: rgba(255, 255, 255, 0.12);
  --nblue: #1d4ed8;
  --nblue-tint: rgba(29, 78, 216, 0.14);

  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: var(--nb);
  color: var(--ntext);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ── Header ── */
.nx-head {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  height: 40px; padding: 0 1rem;
  border-bottom: 1px solid var(--nline-weak); background: var(--nb);
}
.nx-id { display: flex; align-items: center; gap: 0.5rem; }
.nx-name { font-size: 13px; font-weight: 500; color: var(--ntext); }
.nx-localpill {
  font-size: 10px; color: var(--ntext3);
  border: 1px solid var(--nline); border-radius: 999px; padding: 0.05rem 0.45rem;
}
.nx-head-r { display: flex; align-items: center; gap: 0.75rem; }
.nx-sess { font-size: 11px; color: var(--ntext3); font-family: ui-monospace, 'SF Mono', monospace; }
.nx-clear {
  border: 1px solid var(--nline); background: transparent; color: var(--ntext2);
  border-radius: 8px; padding: 0.2rem 0.55rem; font-size: 12px; cursor: pointer;
}
.nx-clear:hover { border-color: var(--nline-strong); color: var(--ntext); }

/* The N₀ mark, in an inverted circle avatar */
.nx-avatar, .nx-mark {
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--nb); background: var(--ntext);
  border-radius: 50%; flex-shrink: 0;
}
.nx-avatar { width: 24px; height: 24px; padding: 4px; margin-top: 2px; }
.nx-avatar--lg { width: 32px; height: 32px; padding: 5px; margin-top: 0; }
.nx-mark--sm { width: 20px; height: 20px; padding: 3px; }

/* ── Stream ── */
.nx-stream { min-height: 0; overflow-y: auto; padding: 24px 16px; }
.nx-col { max-width: 768px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
@media (min-width: 640px) { .nx-stream { padding: 24px 32px; } }

/* Welcome */
.nx-welcome { min-height: 46vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; text-align: center; }
.nx-welcome-id { display: flex; align-items: center; gap: 12px; }
.nx-greeting { margin: 0; font-size: 28px; font-weight: 500; letter-spacing: -0.01em; color: var(--ntext); }
.nx-tagline { margin: -8px 0 0; font-size: 13px; color: var(--ntext3); }
.nx-suggest { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 34rem; }
.nx-chip {
  display: inline-flex; align-items: center; gap: 7px;
  border: 1px solid var(--nline-weak); background: var(--ns); color: var(--ntext2);
  border-radius: 999px; padding: 0.35rem 0.85rem; font-size: 13px; cursor: pointer;
}
.nx-chip:hover { border-color: var(--nline); color: var(--ntext); }
.nx-chip-glyph { color: var(--nblue); font-size: 12px; }

/* User turn */
.nx-turn--user { display: flex; justify-content: flex-end; }
.nx-user-bubble {
  max-width: 60%;
  background: var(--ns);
  border-radius: 16px;
  padding: 0.5rem 0.875rem;
  font-size: 14px; line-height: 24px; color: var(--ntext);
  white-space: pre-wrap; word-break: break-word;
}

/* Assistant turn */
.nx-turn--assistant { display: flex; gap: 12px; }
.nx-a-col { min-width: 0; flex: 1; }
.nx-a-label { font-size: 11px; font-weight: 500; color: var(--ntext2); margin-bottom: 4px; }
.nx-a-body { font-size: 14px; line-height: 1.75; color: var(--ntext); white-space: pre-wrap; word-break: break-word; }
.nx-a-body.err { color: #fca5a5; }
.nx-cursor { color: var(--nblue); }

/* rendered markdown (sanitized) */
.nx-md { white-space: normal; }
.nx-md > :first-child { margin-top: 0; }
.nx-md > :last-child { margin-bottom: 0; }
.nx-md p { margin: 0 0 10px; }
.nx-md ul, .nx-md ol { margin: 0 0 10px; padding-left: 22px; }
.nx-md li { margin: 2px 0; }
.nx-md code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px;
  background: rgba(127,127,127,.18); padding: 1px 5px; border-radius: 5px; }
.nx-md pre { background: rgba(0,0,0,.28); border: 1px solid var(--nline-weak); border-radius: 8px;
  padding: 10px 12px; overflow-x: auto; margin: 0 0 10px; }
.nx-md pre code { background: none; padding: 0; }
.nx-md a { color: var(--nblue); text-decoration: underline; }
.nx-md h1, .nx-md h2, .nx-md h3 { margin: 12px 0 6px; line-height: 1.3; }
.nx-md h1 { font-size: 18px; } .nx-md h2 { font-size: 16px; } .nx-md h3 { font-size: 14.5px; }
.nx-md blockquote { border-left: 3px solid var(--nline-weak); margin: 0 0 10px; padding: 2px 0 2px 12px; color: var(--ntext3); }
.nx-md table { border-collapse: collapse; margin: 0 0 10px; font-size: 13px; display: block; overflow-x: auto; }
.nx-md th, .nx-md td { border: 1px solid var(--nline-weak); padding: 5px 9px; text-align: left; }
.nx-md hr { border: 0; border-top: 1px solid var(--nline-weak); margin: 12px 0; }
.nx-thinking { display: inline-flex; align-items: center; gap: 5px; color: var(--ntext3); font-size: 13px; }
.nx-think { margin: 0 0 8px; border-left: 2px solid var(--nline-weak); padding-left: 10px; }
.nx-think > summary { cursor: pointer; color: var(--ntext3); font-size: 12px; list-style: none; user-select: none; }
.nx-think > summary::-webkit-details-marker { display: none; }
.nx-think > summary::before { content: '▸ '; }
.nx-think[open] > summary::before { content: '▾ '; }
.nx-think-body { color: var(--ntext3); font-size: 13px; line-height: 1.6; white-space: pre-wrap; margin-top: 4px; opacity: 0.85; }
.nx-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ntext3); animation: nx-pulse 1.2s infinite ease-in-out; }
.nx-dot:nth-child(2) { animation-delay: 0.15s; }
.nx-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes nx-pulse { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }

/* Trace disclosure */
.nx-trace { margin-bottom: 8px; }
.nx-trace-summary { list-style: none; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; padding: 2px 0; color: var(--ntext3); font-size: 11px; }
.nx-trace-summary::-webkit-details-marker { display: none; }
.nx-trace-caret { font-size: 9px; transition: transform 0.15s ease; }
.nx-trace-caret.open { transform: rotate(90deg); }
.nx-trace-title { font-weight: 500; }
.nx-trace-count { border: 1px solid var(--nline); border-radius: 999px; padding: 0 0.4rem; font-size: 10px; color: var(--ntext3); }
.nx-trace-body { margin-top: 6px; display: flex; flex-direction: column; gap: 4px; border: 1px solid var(--nline-weak); background: var(--ns); border-radius: 12px; padding: 10px 12px; }
.nx-tr { display: flex; gap: 8px; font-size: 11px; line-height: 1.5; }
.nx-tr-kind { flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.03em; font-size: 9px; font-weight: 600; color: var(--nblue); padding-top: 1px; min-width: 4.5rem; }
.nx-tr-text { color: var(--ntext2); min-width: 0; word-break: break-word; }

/* Governance footer */
.nx-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 6px; font-size: 10px; color: var(--ntext3); }
.nx-model { font-family: ui-monospace, 'SF Mono', monospace; }
.nx-badge { display: inline-flex; align-items: center; gap: 4px; color: #22c55e; }
.nx-gate { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; padding: 8px 12px;
  border: 1px solid var(--nline-weak); border-radius: 8px; background: var(--nline-weak); }
.nx-gate-txt { flex: 1 1 auto; font-size: 11px; color: var(--ntext3); }
.nx-gate-reject, .nx-gate-approve { border: 1px solid transparent; border-radius: 6px; padding: 4px 10px;
  font-size: 11px; font-weight: 600; cursor: pointer; }
.nx-gate-reject { background: transparent; border-color: var(--nline-strong, var(--nline-weak)); color: var(--ntext3); }
.nx-gate-reject:hover { color: var(--ntext); }
.nx-gate-approve { background: var(--nblue); color: #fff; }
.nx-gate-approve:disabled { opacity: .5; cursor: default; }
.nx-actions { display: flex; gap: 4px; margin-top: 6px; opacity: 0; transition: opacity .12s; }
.nx-turn:hover .nx-actions, .nx-actions:focus-within { opacity: 1; }
.nx-act { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px;
  border: 1px solid transparent; border-radius: 6px; background: transparent; color: var(--ntext3); font-size: 12px;
  cursor: pointer; transition: background .12s, color .12s; }
.nx-act:hover:not(:disabled) { background: var(--nline-weak); color: var(--ntext); }
.nx-act.on { color: var(--nblue); }
.nx-act:disabled { opacity: .4; cursor: default; }

/* ── Composer ── */
.nx-composer { padding: 8px 16px 20px; }
.nx-input {
  max-width: 768px; margin: 0 auto;
  border: 1px solid var(--nline-weak); border-radius: 16px; background: var(--nb);
  overflow: hidden; transition: border-color 0.15s ease;
}
.nx-input:focus-within { border-color: var(--nline-strong); }
.nx-input textarea {
  display: block; width: 100%; resize: none; min-height: 1.5rem; max-height: 200px;
  border: 0; background: transparent; color: var(--ntext); font: inherit; font-size: 13px; line-height: 24px;
  padding: 12px; outline: none;
}
.nx-input textarea::placeholder { color: var(--ntext3); }
.nx-toolbar { display: flex; align-items: center; gap: 8px; border-top: 1px solid var(--nline-weak); padding: 6px 8px; flex-wrap: wrap; }
.nx-toolbar-hint { font-size: 10px; color: var(--ntext3); padding-left: 4px; }
.nx-spacer { flex: 1 1 auto; }
.nx-scope { position: relative; }
.nx-scope-btn { display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--nline-weak); background: transparent;
  color: var(--ntext3); font: inherit; font-size: 10.5px; font-weight: 600; padding: 3px 8px; border-radius: 7px; cursor: pointer; }
.nx-scope-label { max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nx-scope-menu { position: absolute; bottom: calc(100% + 6px); left: 0; z-index: 20; min-width: 180px; max-height: 260px; overflow-y: auto;
  background: var(--nsurface, #14161c); border: 1px solid var(--nline-weak); border-radius: 10px; padding: 4px; box-shadow: 0 8px 24px rgba(0,0,0,.4); }
.nx-scope-menu button { display: block; width: 100%; text-align: left; border: 0; background: transparent; color: var(--ntext2, var(--ntext));
  font: inherit; font-size: 12px; padding: 6px 10px; border-radius: 6px; cursor: pointer; }
.nx-scope-menu button:hover { background: var(--nline-weak); }
.nx-scope-menu button.on { color: var(--nblue); }
.nx-scope-sec { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--ntext3); padding: 5px 10px 2px; }
.nx-scope-new { color: var(--nblue) !important; border-top: 1px solid var(--nline-weak); margin-top: 3px; }
.nx-seg { display: inline-flex; border: 1px solid var(--nline-weak); border-radius: 7px; overflow: hidden; }
.nx-seg button { border: 0; background: transparent; color: var(--ntext3); font: inherit; font-size: 10.5px; font-weight: 600;
  padding: 3px 8px; cursor: pointer; text-transform: capitalize; }
.nx-seg button.on { background: var(--nblue); color: #fff; }
.nx-toggle { border: 1px solid var(--nline-weak); background: transparent; color: var(--ntext3); font: inherit; font-size: 10.5px;
  font-weight: 600; padding: 3px 9px; border-radius: 7px; cursor: pointer; }
.nx-toggle.on { background: var(--nblue); color: #fff; border-color: var(--nblue); }
.nx-stopbtn { background: var(--nsurface, transparent); color: #dc2626; }
.nx-send {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: none; border-radius: 8px; cursor: pointer;
  background: var(--ntext); color: var(--nb);
}
.nx-send:disabled { opacity: 0.3; cursor: default; }
.nx-stop { width: 10px; height: 10px; background: currentColor; border-radius: 2px; }
</style>
