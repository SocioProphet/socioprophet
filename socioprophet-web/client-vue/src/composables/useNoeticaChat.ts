// useNoeticaChat — the social surface's conversational link into Noetica.
// Streams the agent-machine /api/chat agentic loop: `delta` events carry the
// assistant text; intent/plan/step/narration/grounding/retrieval/deliberation
// events are surfaced as a live reasoning trace (you watch the twin think);
// `done` finalizes, `error` degrades honestly. One shared session below.
import { ref, watch } from 'vue';
import { AM_BASE } from '../services/agentMachineApi';
import { useSettings } from '../stores/settings';
import { useProjects, projectCollectionId } from '../stores/projects';
import { useMcp } from '../stores/mcp';
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
// Structured trace payloads (mirrors Noetica's message types; the agent-machine emits
// each under an event-specific key: plan→plan, retrieval→trace, grounding→grounding…).
export interface PlanStepT { id: string; label: string; status: string; detail?: string }
export interface PlanT { capability?: string; skill?: string; steps: PlanStepT[] }
export interface RetrievalT {
  patterns?: string[]; token_estimate?: number; beliefs_injected?: number;
  sources?: Array<{ id: string; label: string; score: number }>;
  document_sources?: Array<{ id: string; label: string; score: number }>;
}
export interface GroundingT { domain?: string; topics?: string[]; terms?: string[] }
export interface JudgmentT {
  verdict?: 'grounded' | 'speculative' | 'contradiction'; worth?: number; grounding?: number;
  notes?: string[]; contradictions?: Array<{ statement: string; detail?: string }>;
}
export interface ChatTurn {
  role: Role;
  content: string;
  streaming?: boolean;
  thinking?: string;   // streamed reasoning (thinking_delta), if the model emits it
  trace?: TraceItem[]; // remaining trace kinds (narration/discipline/…) as text chips
  intentName?: string;
  plan?: PlanT;
  retrieval?: RetrievalT;
  grounding?: GroundingT;
  judgment?: JudgmentT;
  error?: boolean;
  model?: string;   // model_routed from the done event
  badge?: string;   // verification badge (e.g. "Generated · best-effort · attested")
  rating?: 'up' | 'down';   // user feedback on an assistant turn
  awaitingApproval?: boolean;   // plan-mode: produced a plan, waiting for approve/reject
  fanoutModel?: string;   // when set, this turn is one column of a multi-model compare
  toolCalls?: Array<{ name: string; input?: unknown }>;   // MCP tool calls the agent made
}

const TRACE_EVENTS = new Set(['intent', 'plan', 'step', 'narration', 'grounding', 'retrieval', 'deliberation', 'action', 'effort', 'decidable', 'discipline', 'safety', 'escalation']);

export type AgentMode = 'auto' | 'plan' | 'ask';
export type ReplyLength = 'short' | 'medium' | 'long';

export function createNoeticaChat() {
  const sessionId = (globalThis.crypto?.randomUUID?.() ?? `sess-${Date.now()}`);
  const turns = ref<ChatTurn[]>(loadPersisted());
  const busy = ref(false);
  // composer request-shaping — all map to fields the agent-machine /api/chat already reads.
  const agentMode = ref<AgentMode>('auto');
  const replyLength = ref<ReplyLength>('medium');
  const webMode = ref(false);
  const systemPrompt = ref('');
  const retrievalScope = ref<'chat' | 'project' | 'everything'>('chat');   // knowledge scope
  // the in-flight request, so Stop can abort it.
  let controller: AbortController | null = null;
  function stop() { controller?.abort(); stopFanout(); }

  // Persist finalized history so a reload keeps the conversation.
  watch(turns, (t) => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(t.filter((x) => !x.streaming))); } catch { /* quota/private-mode */ }
  }, { deep: true });

  function reset() { turns.value = []; try { localStorage.removeItem(STORE_KEY); } catch { /* */ } }

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || busy.value) return;
    turns.value.push({ role: 'user', content: msg });
    await stream();
  }

  // Re-run the model against the current history, appending a fresh assistant turn.
  // Shared by send() and regenerate().
  async function stream() {
    if (busy.value) return;
    const modeAtSend = agentMode.value;   // plan-mode turns gate on approval when done
    const activeProject = retrievalScope.value === 'project' ? useProjects().active : null;
    const toolDefs = useMcp().selectedDefs();   // MCP tools the agent may call this turn
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

    controller = new AbortController();
    try {
      const res = await fetch(`${AM_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          session_id: sessionId, messages: history,
          reply_length: replyLength.value, agent_mode: agentMode.value,
          web: webMode.value, ...(systemPrompt.value.trim() ? { system_prompt: systemPrompt.value.trim() } : {}),
          retrieval_scope: retrievalScope.value,
          ...(activeProject ? { collection_id: projectCollectionId(activeProject.id) } : {}),
          ...(toolDefs.length ? { tools: toolDefs } : {}),
        }),
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
            } else if (event === 'thinking_delta' && typeof d.delta === 'string') {
              assistant.thinking = (assistant.thinking ?? '') + d.delta;
            } else if (event === 'done') {
              const result = d.result as { content?: string; model_routed?: string; verification?: { badge?: string } } | undefined;
              if (result?.content && !assistant.content) assistant.content = result.content;
              assistant.content = assistant.content.replace(/\n?<!--\s*c2pa:[^>]*-->\s*$/i, '').trimEnd();
              if (result?.model_routed) assistant.model = result.model_routed;
              if (result?.verification?.badge) assistant.badge = result.verification.badge;
              if (modeAtSend === 'plan') assistant.awaitingApproval = true;
              assistant.streaming = false;
            } else if (event === 'error') {
              assistant.content = assistant.content || `⚠ ${(d.error as string) ?? 'chat error'}`;
              assistant.error = true;
              assistant.streaming = false;
            } else if (event === 'plan' && d.plan) {
              assistant.plan = d.plan as PlanT;
            } else if (event === 'step' && d.step) {
              const su = d.step as { id: string; status: string; detail?: string };
              const step = assistant.plan?.steps.find((x) => x.id === su.id);
              if (step) { step.status = su.status; if (su.detail) step.detail = su.detail; }
            } else if (event === 'retrieval' && d.trace) {
              assistant.retrieval = d.trace as RetrievalT;
            } else if (event === 'grounding' && d.grounding) {
              assistant.grounding = d.grounding as GroundingT;
            } else if (event === 'value_judgment' && d.value_judgment) {
              assistant.judgment = d.value_judgment as JudgmentT;
            } else if (event === 'intent' && d.intent) {
              assistant.intentName = (d.intent as { name?: string }).name;
            } else if (event === 'tool_calls' && Array.isArray(d.tool_calls)) {
              // informational when the AM drives the loop server-side: show what it called
              assistant.toolCalls = (d.tool_calls as Array<{ name?: string; input?: unknown }>)
                .map((c) => ({ name: c.name ?? 'tool', input: c.input }));
            } else if (TRACE_EVENTS.has(event)) {
              const t = (d.label ?? d.text ?? d.name ?? d.message ?? d.status ?? '') as string;
              if (t) assistant.trace!.push({ kind: event, text: String(t) });
            }
          } catch { /* skip partial/non-JSON frames */ }
        }
      }
    } catch (e) {
      // an abort is a user Stop, not a failure — keep whatever streamed so far.
      if (e instanceof DOMException && e.name === 'AbortError') {
        if (!assistant.content) assistant.content = '⏹ stopped';
      } else {
        assistant.content = assistant.content || `⚠ ${e instanceof Error ? e.message : 'chat failed'} — start the Agent Machine (dev:app) with a model available.`;
        assistant.error = true;
      }
    } finally {
      controller = null;
      assistant.streaming = false;
      busy.value = false;
    }
  }

  // Regenerate: drop the last assistant turn and re-run against the history.
  function regenerate() {
    if (busy.value) return;
    if (turns.value.at(-1)?.role === 'assistant') turns.value.pop();
    void stream();
  }

  // Feedback on an assistant turn → the agent-machine learning loop (best-effort).
  async function feedback(index: number, rating: 'up' | 'down') {
    const t = turns.value[index];
    if (!t || t.role !== 'assistant') return;
    t.rating = t.rating === rating ? undefined : rating;
    try {
      await fetch(`${AM_BASE}/api/learning/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, rating, content: t.content }),
      });
    } catch { /* best-effort — the rating still shows locally */ }
  }

  // ── fan-out: one prompt → several models, side by side ──
  // Self-contained (does NOT touch stream()): a minimal SSE consumer per compare slot,
  // reading just the text + model so the single-chat path carries zero regression risk.
  let fanControllers: AbortController[] = [];
  function stopFanout() { fanControllers.forEach((c) => c.abort()); fanControllers = []; }

  async function fanoutSlot(history: Array<{ role: Role; content: string }>, modelId: string, assistant: ChatTurn) {
    const ctrl = new AbortController();
    fanControllers.push(ctrl);
    try {
      const res = await fetch(`${AM_BASE}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
        body: JSON.stringify({ session_id: sessionId, messages: history, reply_length: replyLength.value,
          agent_mode: 'auto', model_id: modelId }),
      });
      if (!res.ok || !res.body) throw new Error(`model unavailable (${res.status})`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '', event = 'message';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('event:')) { event = line.slice(6).trim(); continue; }
          if (!line.startsWith('data:')) { if (line.trim() === '') event = 'message'; continue; }
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const d = JSON.parse(payload) as Record<string, unknown>;
            if (event === 'delta' && typeof d.delta === 'string') assistant.content += d.delta;
            else if (event === 'done') {
              const r = d.result as { content?: string; model_routed?: string } | undefined;
              if (r?.content && !assistant.content) assistant.content = r.content;
              assistant.content = assistant.content.replace(/\n?<!--\s*c2pa:[^>]*-->\s*$/i, '').trimEnd();
              if (r?.model_routed) assistant.model = r.model_routed;
            } else if (event === 'error') { assistant.error = true; assistant.content ||= `⚠ ${(d.error as string) ?? 'error'}`; }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        assistant.error = true; assistant.content ||= `⚠ ${e instanceof Error ? e.message : 'failed'}`;
      }
    } finally {
      assistant.streaming = false;
    }
  }

  async function fanout(text: string, modelIds: string[]) {
    const msg = text.trim();
    if (!msg || busy.value || modelIds.length === 0) return;
    turns.value.push({ role: 'user', content: msg });
    const history = turns.value.filter((t) => t.role === 'user').map((t) => ({ role: t.role, content: t.content }));
    const slots = modelIds.map((mid) => {
      const a: ChatTurn = { role: 'assistant', content: '', streaming: true, fanoutModel: mid };
      turns.value.push(a);
      return { mid, a };
    });
    busy.value = true;
    try { await Promise.all(slots.map(({ mid, a }) => fanoutSlot(history, mid, a))); }
    finally { fanControllers = []; busy.value = false; }
  }

  // Plan-mode gate: approve → execute the plan in auto mode; reject → discard.
  async function approvePlan(index: number) {
    const t = turns.value[index];
    if (!t || !t.awaitingApproval) return;
    t.awaitingApproval = false;
    const prev = agentMode.value;
    agentMode.value = 'auto';
    try { await send('Approved. Execute the plan exactly as outlined, step by step.'); }
    finally { agentMode.value = prev; }
  }
  function rejectPlan(index: number) {
    const t = turns.value[index];
    if (t) t.awaitingApproval = false;
  }

  return { sessionId, turns, busy, send, stop, reset, regenerate, feedback, approvePlan, rejectPlan, fanout,
    agentMode, replyLength, webMode, systemPrompt, retrievalScope };
}

export type NoeticaChat = ReturnType<typeof createNoeticaChat>;

let shared: NoeticaChat | null = null;
export function useNoeticaChat(): NoeticaChat {
  if (!shared) shared = createNoeticaChat();
  return shared;
}
