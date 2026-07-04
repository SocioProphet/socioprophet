<template>
  <section class="surface" aria-label="Workstation Services">
    <header class="head">
      <div>
        <h1>Services · DevSpaces</h1>
        <p>Trust namespaces as Nocalhost DevSpaces — <b>self</b> is an isolated BaseSpace (on-device); <b>workspace/collective</b> are MeshSpaces sharing a baseline.</p>
      </div>
      <button class="btn" @click="load">Refresh</button>
    </header>
    <p v-if="error" class="error">{{ error }} — run the Agent Machine (dev:app).</p>
    <p v-else-if="!d" class="muted">Loading…</p>
    <template v-else>
      <div class="chips">
        <span class="chip" :class="{ on: d.hasCluster }">{{ d.hasCluster ? 'cluster reachable' : 'no cluster' }}</span>
        <span class="chip" :class="{ on: d.nhctl }">nhctl {{ d.nhctl ? 'installed' : 'absent' }}</span>
        <span v-if="d.note" class="note">{{ d.note }}</span>
      </div>
      <div class="cards">
        <div v-for="sp in d.spaces" :key="sp.trustNamespace" class="card">
          <div class="row">
            <span class="dot" :style="{ background: statusColor(sp.status) }" />
            <b>{{ sp.name }}</b>
            <span class="tag" :class="sp.spaceType">{{ sp.spaceType === 'base' ? 'BaseSpace · isolated' : 'MeshSpace · shared' }}</span>
            <span class="tag muted">{{ sp.status.replace('_', ' ') }}</span>
            <span class="ns">{{ sp.kubeNamespace }}</span>
          </div>
          <div class="modes"><span v-for="m in sp.devMode" :key="m" class="mode">{{ m }}</span></div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { devSpaces, type DevSpace } from '../services/agentMachineApi';
const d = ref<{ hasCluster: boolean; nhctl: boolean; spaces: DevSpace[]; note?: string } | null>(null);
const error = ref('');
async function load() { error.value = ''; try { d.value = await devSpaces(); } catch (e) { error.value = e instanceof Error ? e.message : 'unreachable'; } }
onMounted(load);
const statusColor = (s: string) => (s === 'active' ? '#22c55e' : s === 'not_deployed' ? '#94a3b8' : '#f59e0b');
</script>

<style scoped>
.surface { display: grid; gap: 1rem; max-width: 820px; margin: 1rem auto; padding: 1.5rem 1.75rem; background: var(--bg); color: rgba(255, 255, 255, 0.92); border: 1px solid var(--line-2); border-radius: 16px; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
h1 { margin: 0; font-size: 1.25rem; } .head p { margin: 0.25rem 0 0; color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; }
.btn { border: 1px solid rgba(255, 255, 255, 0.18); background: transparent; color: rgba(255, 255, 255, 0.8); border-radius: 10px; padding: 0.35rem 0.7rem; font-size: 0.78rem; cursor: pointer; }
.error { color: #fca5a5; font-size: 0.85rem; } .muted, .note { color: rgba(255, 255, 255, 0.5); font-size: 0.78rem; }
.chips { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.chip { border-radius: 999px; padding: 0.2rem 0.6rem; font-size: 0.72rem; font-weight: 600; background: rgba(239, 68, 68, 0.14); color: #fca5a5; } .chip.on { background: rgba(34, 197, 94, 0.16); color: #4ade80; }
.cards { display: grid; gap: 0.6rem; }
.card { border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 0.75rem 1rem; }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.dot { width: 8px; height: 8px; border-radius: 50%; } .ns { margin-left: auto; font-family: ui-monospace, monospace; font-size: 0.7rem; color: rgba(255, 255, 255, 0.45); }
.tag { border-radius: 999px; padding: 0.1rem 0.5rem; font-size: 0.62rem; font-weight: 700; }
.tag.base { background: rgba(34, 197, 94, 0.16); color: #4ade80; } .tag.mesh { background: rgba(59, 130, 246, 0.16); color: #93c5fd; }
.tag.muted { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.55); font-weight: 500; }
.modes { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.5rem; }
.mode { background: rgba(255, 255, 255, 0.07); border-radius: 6px; padding: 0.1rem 0.4rem; font-size: 0.62rem; color: rgba(255, 255, 255, 0.6); }
</style>
