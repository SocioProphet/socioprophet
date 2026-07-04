<template>
  <section class="surface" aria-label="Workstation Deploy">
    <header class="head">
      <div>
        <h1>Deploy · Local PaaS</h1>
        <p>Bring up the SourceOS Continuum / Porter control plane (kind + ingress + Argo + Cloud Shell + porter-shim) on-device.</p>
      </div>
      <button class="btn" @click="load">Refresh</button>
    </header>
    <p v-if="error" class="error">{{ error }} — run the Agent Machine (dev:app on :8080).</p>
    <p v-else-if="!s" class="muted">Checking…</p>
    <template v-else>
      <div class="chips">
        <span class="chip" :class="{ on: s.hasRepo }">continuum repo</span>
        <span class="chip" :class="{ on: s.runtime.make }">make</span>
        <span class="chip" :class="{ on: s.runtime.kind }">kind</span>
        <span class="chip" :class="{ on: s.runtime.podman || s.runtime.docker }">{{ s.runtime.podman ? 'podman' : s.runtime.docker ? 'docker' : 'runtime' }}</span>
        <span class="chip" :class="{ on: s.runtime.go }">go</span>
        <span class="chip" :class="{ on: s.runtime.kubectl }">kubectl</span>
        <span class="chip" :class="{ on: s.clusterUp }">{{ s.clusterUp ? `cluster up (${s.clusters.join(', ')})` : 'no cluster' }}</span>
      </div>
      <p class="path">path: {{ s.continuumPath }}</p>
      <ul v-if="s.notes.length" class="notes"><li v-for="(n, i) in s.notes" :key="i">• {{ n }}</li></ul>
      <p class="ready" :class="{ ok: s.ready }">{{ s.ready ? 'Ready to bring up (make dev-up).' : 'Prereqs missing — see notes.' }}</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { deployStatus, type DeployStatus } from '../services/agentMachineApi';
const s = ref<DeployStatus | null>(null);
const error = ref('');
async function load() { error.value = ''; try { s.value = await deployStatus(); } catch (e) { error.value = e instanceof Error ? e.message : 'unreachable'; } }
onMounted(load);
</script>

<style scoped>
.surface { display: grid; gap: 1rem; max-width: 820px; margin: 1rem auto; padding: 1.5rem 1.75rem; background: var(--bg); color: rgba(255, 255, 255, 0.92); border: 1px solid var(--line-2); border-radius: 16px; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
h1 { margin: 0; font-size: 1.25rem; }
.head p { margin: 0.25rem 0 0; color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; }
.btn { border: 1px solid rgba(255, 255, 255, 0.18); background: transparent; color: rgba(255, 255, 255, 0.8); border-radius: 10px; padding: 0.35rem 0.7rem; font-size: 0.78rem; cursor: pointer; }
.error { color: #fca5a5; font-size: 0.85rem; }
.muted, .path { color: rgba(255, 255, 255, 0.5); font-size: 0.8rem; }
.path { font-family: ui-monospace, monospace; font-size: 0.72rem; }
.chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.chip { border-radius: 999px; padding: 0.2rem 0.6rem; font-size: 0.72rem; font-weight: 600; background: rgba(239, 68, 68, 0.14); color: #fca5a5; }
.chip.on { background: rgba(34, 197, 94, 0.16); color: #4ade80; }
.notes { margin: 0; padding: 0.6rem 1rem; list-style: none; background: rgba(255, 255, 255, 0.05); border-radius: 12px; font-size: 0.78rem; color: rgba(255, 255, 255, 0.65); display: grid; gap: 0.25rem; }
.ready { font-size: 0.85rem; color: #fbbf24; } .ready.ok { color: #4ade80; }
</style>
