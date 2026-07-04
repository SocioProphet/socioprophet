// useOperatorTerminal — shared state + run loop for the operator terminal, so the
// Quake drop-down, the pop-out, and the docked route page all drive the same session.
// Talks to the Noetica agent-machine: /api/terminal/status + SSE /api/terminal/run
// (allow-listed binaries only, no shell). One shared instance is exported below.
import { ref, computed } from 'vue';
import { terminalStatus, AM_BASE, type TerminalStatus } from '../services/agentMachineApi';

export type LineKind = 'cmd' | 'out' | 'err' | 'sys';
export interface TermLine { text: string; kind: LineKind }
export type ToolName = 'prophet' | 'sourceosctl';

export function createOperatorTerminal() {
  const status = ref<TerminalStatus | null>(null);
  const statusErr = ref('');
  const tool = ref<ToolName>('prophet');
  const input = ref('');
  const log = ref<TermLine[]>([]);
  const exitCode = ref<number | null>(null);
  const running = ref(false);
  const history = ref<string[]>([]);
  let histIdx = -1;
  let loaded = false;

  const cur = computed(() => status.value?.tools[tool.value]);

  async function loadStatus() {
    if (loaded) return;
    loaded = true;
    try {
      status.value = await terminalStatus();
      log.value.push({ text: 'SourceOS operator shell — allow-listed CLIs, no shell interpolation.', kind: 'sys' });
      const avail = status.value
        ? (Object.entries(status.value.tools) as [ToolName, { installed: boolean }][])
            .map(([k, v]) => `${k}${v.installed ? '' : ' (not installed)'}`).join(' · ')
        : '';
      if (avail) log.value.push({ text: `tools: ${avail}`, kind: 'sys' });
    } catch (e) {
      statusErr.value = e instanceof Error ? e.message : 'unreachable';
      log.value.push({ text: `agent-machine unreachable (${statusErr.value}) — start it with dev:app`, kind: 'err' });
    }
  }

  function recallPrev() {
    if (!history.value.length) return;
    histIdx = Math.min(histIdx + 1, history.value.length - 1);
    input.value = history.value[history.value.length - 1 - histIdx] ?? '';
  }
  function recallNext() {
    if (histIdx <= 0) { histIdx = -1; input.value = ''; return; }
    histIdx -= 1;
    input.value = history.value[history.value.length - 1 - histIdx] ?? '';
  }

  function clear() { log.value = []; exitCode.value = null; }

  async function run() {
    const raw = input.value.trim();
    if (running.value) return;
    if (!raw) return;
    if (raw === 'clear' || raw === 'cls') { clear(); input.value = ''; return; }
    log.value.push({ text: `${tool.value} ${raw}`, kind: 'cmd' });
    history.value.push(raw);
    histIdx = -1;
    input.value = '';
    if (cur.value && !cur.value.installed) {
      log.value.push({ text: `${cur.value.bin} is not installed on this host`, kind: 'err' });
      return;
    }
    running.value = true;
    exitCode.value = null;
    try {
      const res = await fetch(`${AM_BASE}/api/terminal/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: tool.value, args: raw.split(/\s+/) }),
      });
      if (!res.ok || !res.body) throw new Error(`failed to start (${res.status})`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const ev = JSON.parse(line.slice(5)) as { line?: string; stream?: string; error?: string; code?: number };
            if (ev.error) log.value.push({ text: ev.error, kind: 'err' });
            else if (ev.line != null) log.value.push({ text: ev.line, kind: ev.stream === 'err' ? 'err' : 'out' });
            else if (ev.code != null) exitCode.value = ev.code;
          } catch { /* ignore keep-alives / partials */ }
        }
      }
    } catch (e) {
      log.value.push({ text: e instanceof Error ? e.message : 'run failed', kind: 'err' });
    } finally {
      running.value = false;
    }
  }

  return { status, statusErr, tool, input, log, exitCode, running, history, cur, loadStatus, run, clear, recallPrev, recallNext };
}

export type OperatorTerminal = ReturnType<typeof createOperatorTerminal>;

// Shared singleton so the drop-down / pop-out / docked views are one live session.
let shared: OperatorTerminal | null = null;
export function useOperatorTerminal(): OperatorTerminal {
  if (!shared) shared = createOperatorTerminal();
  return shared;
}
