<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { loadStudio, type StudioBundle, type StudioSection } from "../services/studioApi";

const bundle = ref<StudioBundle | null>(null);
const error = ref("");
const loading = ref(true);
const section = ref<StudioSection>("notebooks");
// Project scope — a notebook/asset/model lives in a project's proj- collection so an agent team already retrieves
// it. Wired to the active Noetica project when the projects store lands; a placeholder scope until then.
const project = ref("Untitled project");

const sections: { id: StudioSection; label: string; icon: string; blurb: string }[] = [
  { id: "notebooks",   label: "Notebooks",     icon: "⬢", blurb: "Ray-backed notebooks — NotebookLM meets Jupyter, in your project scope." },
  { id: "data",        label: "Data catalog",  icon: "▤", blurb: "Governed datasets + tables from the core catalog." },
  { id: "models",      label: "Model catalog", icon: "◈", blurb: "The model zoo — candidates, staged, promoted." },
  { id: "tuning",      label: "Tune",          icon: "✳", blurb: "LoRA, SAEs, transformer-circuit probes — on the Ray fabric." },
  { id: "experiments", label: "Experiments",   icon: "⟳", blurb: "Reproducible science — provenance + lockfiles, ck.org-style." },
];

onMounted(async () => {
  try { bundle.value = await loadStudio(); }
  catch (e) { error.value = e instanceof Error ? e.message : "failed to load studio"; }
  finally { loading.value = false; }
});

const items = computed(() => {
  const b = bundle.value;
  if (!b) return [];
  return (b[section.value] ?? []) as Record<string, unknown>[];
});
const activeMeta = computed(() => sections.find((s) => s.id === section.value)!);
</script>

<template>
  <div class="studio">
    <aside class="rail">
      <div class="head">
        <div class="title">⬢ Studio</div>
        <div class="proj" :title="'Project scope — shared with your agent team'">{{ project }}</div>
      </div>
      <nav>
        <button v-for="s in sections" :key="s.id" :class="{ on: section === s.id }" @click="section = s.id">
          <span class="ic">{{ s.icon }}</span> {{ s.label }}
        </button>
      </nav>
      <div class="foot">
        <span v-if="bundle?.stub" class="stub">preview · fabric not yet wired</span>
      </div>
    </aside>

    <main class="panel">
      <header>
        <h1>{{ activeMeta.icon }} {{ activeMeta.label }}</h1>
        <p class="blurb">{{ activeMeta.blurb }}</p>
        <div class="actions">
          <button class="primary">＋ New</button>
          <button title="Everything here is in the project's collection — your agent team can already read it.">⤳ Share to agent team</button>
        </div>
      </header>

      <p v-if="loading" class="msg">Loading…</p>
      <p v-else-if="error" class="msg err">{{ error }}</p>

      <div v-else class="grid">
        <!-- notebooks -->
        <template v-if="section === 'notebooks'">
          <article v-for="n in (items as any[])" :key="n.id" class="card">
            <div class="row"><span class="name">{{ n.name }}</span><span class="pill" :class="n.status">{{ n.status }}</span></div>
            <div class="sub">{{ n.runtime }} · kernel {{ n.kernel }}</div>
          </article>
        </template>
        <!-- data -->
        <template v-else-if="section === 'data'">
          <article v-for="d in (items as any[])" :key="d.id" class="card">
            <div class="row"><span class="name">{{ d.name }}</span><span v-if="d.governed" class="pill ok">governed</span></div>
            <div class="sub">{{ d.kind }}<span v-if="d.rows"> · {{ d.rows.toLocaleString() }} rows</span> · {{ d.catalog }}</div>
          </article>
        </template>
        <!-- models -->
        <template v-else-if="section === 'models'">
          <article v-for="m in (items as any[])" :key="m.id" class="card">
            <div class="row"><span class="name">{{ m.name }}</span><span class="pill" :class="m.stage">{{ m.stage }}</span></div>
            <div class="sub">{{ m.task }}<span v-if="m.metric"> · {{ m.metric }}</span></div>
          </article>
        </template>
        <!-- tuning -->
        <template v-else-if="section === 'tuning'">
          <article v-for="t in (items as any[])" :key="t.id" class="card">
            <div class="row"><span class="name">{{ t.name }}</span><span class="pill" :class="t.status">{{ t.status }}</span></div>
            <div class="sub">{{ t.method }} · {{ t.backend }}</div>
          </article>
        </template>
        <!-- experiments -->
        <template v-else>
          <article v-for="x in (items as any[])" :key="x.id" class="card">
            <div class="row"><span class="name">{{ x.title }}</span><span v-if="x.reproducible" class="pill ok">reproducible</span></div>
            <div class="sub">{{ x.provenance }}</div>
          </article>
        </template>

        <p v-if="!items.length" class="msg">Nothing here yet.</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.studio { display: flex; height: 100%; font: 14px/1.5 system-ui, sans-serif; color: #202124; }
.rail { width: 220px; flex-shrink: 0; border-right: 1px solid #e8eaed; display: flex; flex-direction: column; background: #fafafa; }
.rail .head { padding: 18px 16px 10px; }
.rail .title { font-size: 18px; font-weight: 700; }
.rail .proj { margin-top: 4px; font-size: 12px; color: #1a73e8; background: #e8f0fe; border-radius: 10px; padding: 2px 8px; display: inline-block; }
.rail nav { display: flex; flex-direction: column; padding: 6px; gap: 2px; }
.rail nav button { text-align: left; padding: 8px 12px; border: none; background: none; border-radius: 8px; cursor: pointer; color: #3c4043; font-size: 14px; }
.rail nav button:hover { background: #f1f3f4; }
.rail nav button.on { background: #e8f0fe; color: #1a73e8; font-weight: 600; }
.rail nav .ic { display: inline-block; width: 20px; }
.rail .foot { margin-top: auto; padding: 12px 16px; }
.rail .stub { font-size: 11px; color: #b06000; background: #fef7e0; border-radius: 8px; padding: 3px 8px; }

.panel { flex: 1; overflow: auto; padding: 24px 28px; }
.panel header h1 { font-size: 22px; margin: 0; }
.panel .blurb { color: #5f6368; margin: 4px 0 14px; max-width: 640px; }
.panel .actions { display: flex; gap: 8px; margin-bottom: 18px; }
.panel .actions button { border: 1px solid #dadce0; background: #fff; border-radius: 18px; padding: 6px 14px; font-size: 13px; cursor: pointer; }
.panel .actions button.primary { background: #1a73e8; color: #fff; border-color: #1a73e8; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.card { border: 1px solid #e8eaed; border-radius: 12px; padding: 14px 16px; background: #fff; }
.card .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.card .name { font-weight: 600; }
.card .sub { color: #5f6368; font-size: 12px; margin-top: 4px; }
.pill { font-size: 11px; border-radius: 8px; padding: 1px 8px; border: 1px solid #dadce0; color: #5f6368; }
.pill.ok, .pill.promoted, .pill.done { border-color: #137333; color: #137333; }
.pill.running { border-color: #1a73e8; color: #1a73e8; }
.pill.failed { border-color: #c5221f; color: #c5221f; }
.pill.staged, .pill.queued { border-color: #b06000; color: #b06000; }
.msg { color: #5f6368; } .msg.err { color: #c5221f; }
</style>
