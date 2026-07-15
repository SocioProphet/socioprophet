// useNoeticaChat — the social surface's conversational link into Noetica.
// Streams the agent-machine /api/chat agentic loop: `delta` events carry the
// assistant text; intent/plan/step/narration/grounding/retrieval/deliberation
// events are surfaced as a live reasoning trace (you watch the twin think);
// `done` finalizes, `error` degrades honestly. One shared session below.
import { ref, watch } from 'vue';
import { AM_BASE } from '../services/agentMachineApi';
import { useSettings } from '../stores/settings';
import { meshChatStream } from '../config/mesh';

const STORE_KEY = 'noetica-chat-v1';
function loadPersisted(): ChatTurn[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatTurn[];
    return Array.isArray(parsed) ? parsed.map((t) => ({ ...t, streaming: false })) : [];
  } catch { return []; }
}

export type Role = 'user' | 'assistant';
export interface TraceItem { kind: string; text: string }
export interface ChatTurn {
  role: Role;
  content: string;
  streaming?: boolean;
  trace?: TraceItem[];
  error?: boolean;
  model?: string;   // model_routed from the done event
  badge?: string;   // verification badge (e.g. "Generated · best-effort · attested")
}

const TRACE_EVENTS = new Set(['intent', 'plan', 'step', 'narration', 'grounding', 'retrieval', 'deliberation', 'action', 'effort', 'decidable', 'discipline', 'safety', 'escalation']);

export function createNoeticaChat() {
  const sessionId = (globalThis.crypto?.randomUUID?.() ?? `sess-${Date.now()}`);
  const turns = ref<ChatTurn[]>(loadPersisted());
  const busy = ref(false);

  // Persist finalized history so a reload keeps the conversation.
  watch(turns, (t) => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(t.filter((x) => !x.streaming))); } catch { /* quota/private-mode */ }
  }, { deep: true });

  function reset() { turns.value = []; try { localStorage.removeItem(STORE_KEY); } catch { /* */ } }

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || busy.value) return;
    turns.value.push({ role: 'user', content: msg });
    const assistant: ChatTurn = { role: 'assistant', content: '', streaming: true, trace: [] };
    turns.value.push(assistant);
    busy.value = true;

    const history = turns.value
      .filter((t) => !(t.role === 'assistant' && t.streaming))
      .map((t) => ({ role: t.role, content: t.content }));

    // Prophet Cloud Mesh: when enabled in Settings, route the turn to the live GKE
    // conductor (model=prophet-mesh) instead of the local agent-machine. Non-streaming.
    if (useSettings().meshChat) {
      try {
        const r = await meshChatStream(history, (delta) => { assistant.content += delta; });
        if (!assistant.content) assistant.content = r.content;
        assistant.model = r.seat ? `${r.model} · seat ${r.seat}` : r.model;
        assistant.badge = 'Prophet Cloud Mesh';
      } catch (e) {
        assistant.content = `⚠ ${e instanceof Error ? e.message : 'mesh chat failed'}`;
        assistant.error = true;
      } finally {
        assistant.streaming = false;
        busy.value = false;
      }
      return;
    }

    try {
      const res = await fetch(`${AM_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, messages: history, reply_length: 'medium', agent_mode: 'auto' }),
      });
      if (!res.ok || !res.body) throw new Error(res.status === 423 ? 'agent halted (kill-switch armed)' : `chat unavailable (${res.status})`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let event = 'message';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('event:')) { event = line.slice(6).trim(); continue; }
          if (line.startsWith(':')) continue; // comment/keepalive
          if (!line.startsWith('data:')) { if (line.trim() === '') event = 'message'; continue; }
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const d = JSON.parse(payload) as Record<string, unknown>;
            if (event === 'delta' && typeof d.delta === 'string') {
              assistant.content += d.delta;
            } else if (event === 'done') {
              const result = d.result as { content?: string; model_routed?: string; verification?: { badge?: string } } | undefined;
              if (result?.content && !assistant.content) assistant.content = result.content;
              assistant.content = assistant.content.replace(/\n?<!--\s*c2pa:[^>]*-->\s*$/i, '').trimEnd();
              if (result?.model_routed) assistant.model = result.model_routed;
              if (result?.verification?.badge) assistant.badge = result.verification.badge;
              assistant.streaming = false;
            } else if (event === 'error') {
              assistant.content = assistant.content || `⚠ ${(d.error as string) ?? 'chat error'}`;
              assistant.error = true;
              assistant.streaming = false;
            } else if (TRACE_EVENTS.has(event)) {
              const t = (d.label ?? d.text ?? d.name ?? d.message ?? d.status ?? '') as string;
              if (t) assistant.trace!.push({ kind: event, text: String(t) });
            }
          } catch { /* skip partial/non-JSON frames */ }
        }
      }
    } catch (e) {
      assistant.content = assistant.content || `⚠ ${e instanceof Error ? e.message : 'chat failed'} — start the Agent Machine (dev:app) with a model available.`;
      assistant.error = true;
    } finally {
      assistant.streaming = false;
      busy.value = false;
    }
  }

  return { sessionId, turns, busy, send, reset };
}

export type NoeticaChat = ReturnType<typeof createNoeticaChat>;

let shared: NoeticaChat | null = null;
export function useNoeticaChat(): NoeticaChat {
  if (!shared) shared = createNoeticaChat();
  return shared;
}
