<template>
  <section class="pipelines" aria-label="Workstation Pipelines">
    <header class="head">
      <div>
        <h1>Pipelines · GitOps</h1>
        <p>PR-driven GitOps — Argo CD reconciles the local cluster. The porter-shim writes to Git; Argo applies.</p>
      </div>
      <button class="refresh" @click="load">Refresh</button>
    </header>

    <p v-if="error" class="error">{{ error }} — is the Agent Machine running (dev:app on :8080)?</p>
    <p v-else-if="!data" class="muted">Loading…</p>

    <template v-else>
      <div class="chips">
        <span class="chip" :class="{ on: data.gitops.kubectl }">kubectl</span>
        <span class="chip" :class="{ on: data.gitops.argocd }">Argo CD</span>
        <span class="chip" :class="{ on: data.ci.gh }">gh (CI)</span>
        <span v-if="data.note" class="note">{{ data.note }}</span>
      </div>

      <p v-if="data.apps.length === 0" class="empty">
        No Argo applications. Bring the control plane up (Workstation → Deploy → dev-up).
      </p>
      <table v-else class="apps">
        <thead>
          <tr><th>Application</th><th>Namespace</th><th>Sync</th><th>Health</th></tr>
        </thead>
        <tbody>
          <tr v-for="a in data.apps" :key="a.name">
            <td class="name">{{ a.name }}</td>
            <td class="ns">{{ a.namespace }}</td>
            <td><span class="dot" :style="{ background: syncColor(a.sync) }" />{{ a.sync }}</td>
            <td><span class="dot" :style="{ background: healthColor(a.health) }" />{{ a.health }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { pipelineStatus, type PipelineStatus } from '../services/agentMachineApi';

const data = ref<PipelineStatus | null>(null);
const error = ref('');

async function load() {
  error.value = '';
  try {
    data.value = await pipelineStatus();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not reach the Agent Machine';
  }
}
onMounted(load);

const syncColor = (s: string) => (s === 'Synced' ? '#22c55e' : s === 'OutOfSync' ? '#f59e0b' : '#94a3b8');
const healthColor = (h: string) => (h === 'Healthy' ? '#22c55e' : h === 'Degraded' ? '#ef4444' : h === 'Progressing' ? '#3b82f6' : '#94a3b8');
</script>

<style scoped>
.pipelines { display: grid; gap: 1rem; max-width: 900px; margin: 1rem auto; padding: 1.5rem 1.75rem; background: var(--bg); color: rgba(255, 255, 255, 0.92); border: 1px solid var(--line-2); border-radius: 16px; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
h1 { margin: 0; font-size: 1.25rem; }
.head p { margin: 0.25rem 0 0; color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; }
.refresh { border: 1px solid rgba(255, 255, 255, 0.18); background: transparent; color: rgba(255, 255, 255, 0.8); border-radius: 10px; padding: 0.35rem 0.7rem; font-size: 0.78rem; cursor: pointer; }
.refresh:hover { background: rgba(255, 255, 255, 0.06); }
.error { color: #fca5a5; font-size: 0.85rem; }
.muted, .note { color: rgba(255, 255, 255, 0.5); font-size: 0.8rem; }
.chips { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.chip { border-radius: 999px; padding: 0.2rem 0.6rem; font-size: 0.72rem; font-weight: 600; background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.55); }
.chip.on { background: rgba(34, 197, 94, 0.16); color: #4ade80; }
.empty { border: 1px dashed rgba(255, 255, 255, 0.16); border-radius: 14px; padding: 2rem; text-align: center; color: rgba(255, 255, 255, 0.5); font-size: 0.85rem; }
.apps { width: 100%; border-collapse: collapse; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; overflow: hidden; font-size: 0.85rem; }
.apps th { text-align: left; padding: 0.55rem 0.9rem; background: rgba(255, 255, 255, 0.05); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255, 255, 255, 0.5); }
.apps td { padding: 0.55rem 0.9rem; border-top: 1px solid rgba(255, 255, 255, 0.08); }
.name { font-weight: 600; }
.ns { font-family: ui-monospace, monospace; font-size: 0.72rem; color: rgba(255, 255, 255, 0.5); }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.4rem; vertical-align: middle; }
</style>
