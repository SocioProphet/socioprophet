<template>
  <section class="surface" aria-label="Workstation Terminal">
    <header>
      <h1>Terminal</h1>
      <p>Run allow-listed operator commands (prophet · sourceosctl) on-device. Injection-safe (no shell).</p>
    </header>
    <div class="tools">
      <button v-for="t in (['prophet', 'sourceosctl'] as const)" :key="t" class="tool" :class="{ on: tool === t }" @click="tool = t; input = ''">
        <span class="dot" :class="{ up: status?.tools[t]?.installed }" />{{ t }}
      </button>
      <span v-if="statusErr" class="err">{{ statusErr }} — run dev:app</span>
      <span v-else-if="cur && !cur.installed" class="mut">{{ cur.bin }} not installed</span>
    </div>
    <div v-if="cur" class="quick">
      <button v-for="s in cur.subcommands.filter((x) => !x.startsWith('-'))" :key="s" class="q" @click="input = s">{{ s }}</button>
    </div>
    <form class="cmd" @submit.prevent="run()">
      <span class="prompt">{{ tool }}</span>
      <input v-model="input" placeholder="infra status" spellcheck="false" />
      <button type="submit" :disabled="running || !input.trim() || !cur?.installed">{{ running ? 'Running…' : 'Run' }}</button>
    </form>
    <div v-if="log.length || running" class="console">
      <div class="chead"><span>Console</span><span v-if="exitCode !== null" class="ex" :class="{ ok: exitCode === 0 }">exit {{ exitCode }}</span></div>
      <div class="body">
        <div v-for="(l, i) in log" :key="i" :class="{ e: l.startsWith('✗'), w: l.startsWith('⚠') }">{{ l }}</div>
        <div v-if="running" class="dim">…</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { terminalStatus, AM_BASE, type TerminalStatus } from '../services/agentMachineApi';

const status = ref<TerminalStatus | null>(null);
const statusErr = ref('');
const tool = ref<'prophet' | 'sourceosctl'>('prophet');
const input = ref('');
const log = ref<string[]>([]);
const exitCode = ref<number | null>(null);
const running = ref(false);
const cur = computed(() => status.value?.tools[tool.value]);

onMounted(async () => {
  try { status.value = await terminalStatus(); }
  catch (e) { statusErr.value = e instanceof Error ? e.message : 'unreachable'; }
});

async function run() {
  const raw = input.value.trim();
  if (!raw || running.value) return;
  running.value = true; log.value = []; exitCode.value = null;
  try {
    const res = await fetch(`${AM_BASE}/api/terminal/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool: tool.value, args: raw.split(/\s+/) }) });
    if (!res.ok || !res.body) throw new Error('failed to start');
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const ev = JSON.parse(line.slice(5)) as { line?: string; stream?: string; error?: string; code?: number };
          if (ev.error) log.value.push(`✗ ${ev.error}`);
          else if (ev.line != null) log.value.push((ev.stream === 'err' ? '⚠ ' : '') + ev.line);
          else if (ev.code != null) exitCode.value = ev.code;
        } catch { /* skip */ }
      }
    }
  } catch (e) { log.value.push(`✗ ${e instanceof Error ? e.message : 'run failed'}`); }
  finally { running.value = false; }
}
</script>

<style scoped>
.surface { display: grid; gap: 1rem; max-width: 820px; margin: 0 auto; padding: 1.5rem; }
h1 { margin: 0; font-size: 1.25rem; } header p { margin: 0.25rem 0 0; color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; }
.tools { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.tool { display: inline-flex; align-items: center; gap: 0.4rem; border: 1px solid rgba(255, 255, 255, 0.16); background: transparent; color: rgba(255, 255, 255, 0.75); border-radius: 10px; padding: 0.35rem 0.7rem; font-size: 0.8rem; cursor: pointer; } .tool.on { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border-color: transparent; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; } .dot.up { background: #22c55e; }
.err { color: #fca5a5; font-size: 0.78rem; } .mut { color: rgba(255, 255, 255, 0.5); font-size: 0.78rem; }
.quick { display: flex; flex-wrap: wrap; gap: 0.3rem; } .q { border: 1px solid rgba(255, 255, 255, 0.14); background: transparent; color: rgba(255, 255, 255, 0.6); border-radius: 6px; padding: 0.1rem 0.4rem; font-size: 0.68rem; cursor: pointer; }
.cmd { display: flex; align-items: center; gap: 0.5rem; border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 12px; padding: 0.5rem 0.7rem; font-family: ui-monospace, monospace; }
.prompt { color: rgba(255, 255, 255, 0.4); font-size: 0.8rem; } .cmd input { flex: 1; min-width: 0; background: transparent; border: none; outline: none; color: #fff; font-size: 0.82rem; }
.cmd button { border: none; background: #2563eb; color: #fff; border-radius: 8px; padding: 0.3rem 0.7rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; } .cmd button:disabled { opacity: 0.5; }
.console { border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; overflow: hidden; background: #0b1020; }
.chead { display: flex; justify-content: space-between; padding: 0.4rem 0.8rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.5); }
.ex { color: #f87171; } .ex.ok { color: #4ade80; }
.body { max-height: 320px; overflow-y: auto; padding: 0.6rem 0.8rem; font-family: ui-monospace, monospace; font-size: 0.74rem; line-height: 1.5; color: rgba(255, 255, 255, 0.8); }
.body .e { color: #f87171; } .body .w { color: #fbbf24; } .dim { color: rgba(255, 255, 255, 0.35); }
</style>
