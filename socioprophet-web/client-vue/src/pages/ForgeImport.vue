<template>
  <section class="surface" aria-label="Forge · Import Local Repo">
    <header>
      <h1>Forge · Add Local Repo</h1>
      <p>Pull a folder off this machine into your sovereign Gitea — creates the repo and git-pushes it. Nothing leaves the box.</p>
    </header>

    <!-- Folder picker -->
    <div class="picker">
      <div class="crumbs">
        <button class="up" :disabled="!browse?.parent || busy" @click="go(browse!.parent!)">↑ up</button>
        <code>{{ browse?.path ?? '…' }}</code>
      </div>
      <p v-if="browseErr" class="error">{{ browseErr }}</p>
      <ul v-else-if="browse" class="entries">
        <li v-if="browse.entries.length === 0" class="empty">No subfolders here.</li>
        <li v-for="e in browse.entries" :key="e.path" :class="{ repo: e.isGitRepo, sel: selected === e.path }">
          <button class="name" @click="go(e.path)">📁 {{ e.name }}</button>
          <span v-if="e.isGitRepo" class="gtag">git</span>
          <button class="pick" @click="select(e)">Select</button>
        </li>
      </ul>
      <p v-else class="muted">Loading folders…</p>
    </div>

    <!-- Import form (shown once a folder is selected) -->
    <form v-if="selected" class="form" @submit.prevent="run">
      <div class="selrow">Selected: <code>{{ selected }}</code></div>
      <div class="grid">
        <label>Repo name<input v-model="name" placeholder="basename" /></label>
        <label>Gitea base<input v-model="giteaBase" placeholder="http://localhost:3001" /></label>
        <label class="wide">Token<input v-model="token" type="password" placeholder="gitea token (Settings → Connections)" /></label>
        <label>Description<input v-model="description" placeholder="optional" /></label>
        <label class="chk"><input type="checkbox" v-model="isPrivate" /> Private</label>
      </div>
      <button type="submit" class="go" :disabled="busy || !token || !giteaBase">{{ busy ? 'Importing…' : 'Import into Forge' }}</button>
    </form>

    <!-- SSE progress -->
    <div v-if="steps.length" class="progress">
      <div v-for="(s, i) in steps" :key="i" class="step" :class="s.kind">
        <span class="ic">{{ s.kind === 'error' ? '✗' : s.kind === 'complete' ? '✓' : '•' }}</span>{{ s.text }}
      </div>
      <a v-if="doneUrl" class="link" :href="doneUrl" target="_blank" rel="noreferrer">Open {{ doneUrl }} ↗</a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { forgeBrowse, AM_BASE, type BrowseResult, type BrowseEntry } from '../services/agentMachineApi';

const browse = ref<BrowseResult | null>(null);
const browseErr = ref('');
const selected = ref('');
const name = ref('');
const giteaBase = ref('http://localhost:3001');
const token = ref('');
const description = ref('');
const isPrivate = ref(true);
const busy = ref(false);
const steps = ref<Array<{ text: string; kind: 'step' | 'error' | 'complete' }>>([]);
const doneUrl = ref('');

async function go(dir?: string) {
  browseErr.value = '';
  try { browse.value = await forgeBrowse(dir); }
  catch (e) { browseErr.value = e instanceof Error ? e.message : 'browse failed — is the Agent Machine running?'; }
}
function select(e: BrowseEntry) { selected.value = e.path; name.value = e.name; }

onMounted(() => { void go(); });

async function run() {
  if (busy.value || !selected.value) return;
  busy.value = true; steps.value = []; doneUrl.value = '';
  try {
    const res = await fetch(`${AM_BASE}/api/forge/import-local`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localPath: selected.value, name: name.value || undefined, description: description.value || undefined, private: isPrivate.value, giteaBase: giteaBase.value, token: token.value }),
    });
    if (!res.ok || !res.body) throw new Error('import failed to start');
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '', ev = '';
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('event:')) { ev = line.slice(6).trim(); continue; }
        if (!line.startsWith('data:')) continue;
        try {
          const d = JSON.parse(line.slice(5)) as { label?: string; error?: string; html_url?: string };
          if (ev === 'error' || d.error) steps.value.push({ text: d.error ?? 'error', kind: 'error' });
          else if (ev === 'complete') { steps.value.push({ text: 'Imported', kind: 'complete' }); if (d.html_url) doneUrl.value = d.html_url; }
          else if (ev === 'created' && d.html_url) doneUrl.value = d.html_url;
          else if (d.label) steps.value.push({ text: d.label, kind: 'step' });
        } catch { /* skip keep-alives */ }
      }
    }
  } catch (e) { steps.value.push({ text: e instanceof Error ? e.message : 'import failed', kind: 'error' }); }
  finally { busy.value = false; }
}
</script>

<style scoped>
.surface { display: grid; gap: 1rem; max-width: 760px; margin: 1rem auto; padding: 1.5rem 1.75rem; background: var(--bg); color: rgba(255, 255, 255, 0.92); border: 1px solid var(--line-2); border-radius: 16px; }
h1 { margin: 0; font-size: 1.25rem; } header p { margin: 0.25rem 0 0; color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; }
.picker { border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; overflow: hidden; }
.crumbs { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.7rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.03); }
.crumbs code { font-size: 0.72rem; color: rgba(255, 255, 255, 0.6); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.up { border: 1px solid rgba(255, 255, 255, 0.16); background: transparent; color: rgba(255, 255, 255, 0.75); border-radius: 7px; padding: 0.15rem 0.5rem; font-size: 0.72rem; cursor: pointer; } .up:disabled { opacity: 0.4; }
.entries { list-style: none; margin: 0; padding: 0.3rem; max-height: 300px; overflow-y: auto; }
.entries li { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.4rem; border-radius: 8px; } .entries li:hover { background: rgba(255, 255, 255, 0.04); } .entries li.sel { background: rgba(59, 130, 246, 0.14); }
.name { flex: 1; text-align: left; background: transparent; border: none; color: rgba(255, 255, 255, 0.85); font-size: 0.8rem; cursor: pointer; overflow: hidden; text-overflow: ellipsis; }
.gtag { font-size: 0.6rem; color: #4ade80; background: rgba(34, 197, 94, 0.14); border-radius: 5px; padding: 0.05rem 0.35rem; }
.pick { border: 1px solid rgba(59, 130, 246, 0.4); background: transparent; color: #93c5fd; border-radius: 7px; padding: 0.1rem 0.5rem; font-size: 0.7rem; cursor: pointer; }
.empty, .muted { color: rgba(255, 255, 255, 0.45); font-size: 0.8rem; padding: 0.5rem; } .error { color: #fca5a5; font-size: 0.82rem; padding: 0.5rem; }
.form { display: grid; gap: 0.7rem; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 0.9rem; }
.selrow { font-size: 0.76rem; color: rgba(255, 255, 255, 0.6); } .selrow code { color: #93c5fd; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.grid label { display: grid; gap: 0.2rem; font-size: 0.7rem; color: rgba(255, 255, 255, 0.6); } .grid label.wide { grid-column: 1 / -1; }
.grid input[type=text], .grid input:not([type]), .grid input[type=password] { background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 8px; padding: 0.35rem 0.5rem; color: #fff; font-size: 0.8rem; }
.chk { flex-direction: row; align-items: center; gap: 0.4rem; }
.go { border: none; background: #2563eb; color: #fff; border-radius: 10px; padding: 0.5rem 0.9rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; justify-self: start; } .go:disabled { opacity: 0.5; }
.progress { display: grid; gap: 0.25rem; border: 1px solid var(--line-2); border-radius: 12px; padding: 0.7rem 0.9rem; background: var(--surface-2); font-size: 0.78rem; }
.step { display: flex; gap: 0.5rem; color: rgba(255, 255, 255, 0.75); } .step .ic { color: rgba(255, 255, 255, 0.4); }
.step.error { color: #f87171; } .step.error .ic { color: #f87171; } .step.complete { color: #4ade80; } .step.complete .ic { color: #4ade80; }
.link { color: #93c5fd; font-size: 0.78rem; margin-top: 0.3rem; }
</style>
