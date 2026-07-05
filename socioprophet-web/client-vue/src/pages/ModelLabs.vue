<template>
  <section class="surface" aria-label="Model Labs">
    <header class="head">
      <div>
        <h1>Labs · Model Catalog</h1>
        <p>Apple-aligned: one on-device base + swappable per-lab LoRA adapters + a server tier. Routed by sensitivity — high stays on-device.</p>
      </div>
      <button class="btn" @click="load">Refresh</button>
    </header>
    <p v-if="error" class="error">{{ error }} — run the Agent Machine (dev:app).</p>
    <p v-else-if="!cat" class="muted">Loading…</p>
    <template v-else>
      <div v-for="grp in groups" :key="grp.lbl" class="grp">
        <div class="lbl">{{ grp.lbl }}</div>
        <div class="grid">
          <div v-for="m in grp.models" :key="m.id" class="card">
            <div class="crow">
              <span class="dot" :style="{ background: tierColor(m.tier) }" />
              <span class="cname">{{ m.modality ? `${m.modality} adapter` : m.id }}</span>
              <span class="params">{{ fmt(m.paramsB) }}</span>
            </div>
            <div class="meta">
              <span class="mtag">{{ m.tier }}</span>
              <span v-if="m.quantization" class="mtag">{{ m.quantization }}</span>
              <span class="mtag">{{ m.residencyState }}</span>
              <span class="mtag">{{ m.provider }}</span>
              <span v-if="m.lab" class="mtag lab">{{ m.lab }}</span>
            </div>
          </div>
        </div>
      </div>
      <p class="route">Routing (isolation ↔ residency): <b class="g">high → on-device</b> · <b class="a">medium → edge</b> · <b class="b">low → server</b>. {{ cat.note }}</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { labsCatalog, type ModelEntry } from '../services/agentMachineApi';

const cat = ref<{ models: ModelEntry[]; note: string } | null>(null);
const error = ref('');
async function load() { error.value = ''; try { cat.value = await labsCatalog(); } catch (e) { error.value = e instanceof Error ? e.message : 'unreachable'; } }
onMounted(load);

const groups = computed<Array<{ lbl: string; models: ModelEntry[] }>>(() => {
  const m = cat.value?.models ?? [];
  return [
    { lbl: 'On-device base', models: m.filter((x) => x.kind === 'base' && x.tier === 'on-device') },
    { lbl: 'SociOS lab adapters (opt-in tuning · LoRA)', models: m.filter((x) => x.kind === 'adapter') },
    { lbl: 'Server tier (larger · off-device)', models: m.filter((x) => x.tier === 'server') },
  ].filter((g) => g.models.length > 0);
});
const tierColor = (t: string) => (t === 'on-device' ? '#22c55e' : t === 'edge' ? '#f59e0b' : '#3b82f6');
const fmt = (b: number) => (b >= 1 ? `${b}B` : `${Math.round(b * 1000)}M`);
</script>

<style scoped>
.surface { display: grid; gap: 1rem; max-width: 820px; margin: 1rem auto; padding: 1.5rem 1.75rem; background: var(--bg); color: rgba(255, 255, 255, 0.92); border: 1px solid var(--line-2); border-radius: 16px; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
h1 { margin: 0; font-size: 1.25rem; } .head p { margin: 0.25rem 0 0; color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; }
.btn { border: 1px solid rgba(255, 255, 255, 0.18); background: transparent; color: rgba(255, 255, 255, 0.8); border-radius: 10px; padding: 0.35rem 0.7rem; font-size: 0.78rem; cursor: pointer; }
.error { color: #fca5a5; font-size: 0.85rem; } .muted { color: rgba(255, 255, 255, 0.5); font-size: 0.8rem; }
.grp { display: grid; gap: 0.4rem; } .lbl { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.45); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 0.5rem; }
.card { border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 0.6rem 0.75rem; }
.crow { display: flex; align-items: center; gap: 0.5rem; } .dot { width: 8px; height: 8px; border-radius: 50%; }
.cname { font-weight: 600; font-size: 0.82rem; } .params { margin-left: auto; font-size: 0.66rem; color: rgba(255, 255, 255, 0.5); background: rgba(255, 255, 255, 0.08); border-radius: 5px; padding: 0.05rem 0.35rem; }
.meta { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.4rem; }
.mtag { font-size: 0.62rem; color: rgba(255, 255, 255, 0.55); background: rgba(255, 255, 255, 0.07); border-radius: 5px; padding: 0.05rem 0.35rem; } .mtag.lab { color: #93c5fd; background: rgba(59, 130, 246, 0.14); }
.route { font-size: 0.72rem; color: rgba(255, 255, 255, 0.6); background: rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 0.5rem 0.7rem; }
.route .g { color: #4ade80; } .route .a { color: #fbbf24; } .route .b { color: #93c5fd; }
</style>
