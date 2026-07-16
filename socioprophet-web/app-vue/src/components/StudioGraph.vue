<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { loadGraph, EPISTEMIC_COLORS, type GraphView, type GraphNode } from "../services/studioApi";

const props = defineProps<{ project: string }>();
const view = ref<GraphView | null>(null);
const loading = ref(true);
const error = ref("");
const selected = ref<GraphNode | null>(null);

async function load() {
  loading.value = true; error.value = "";
  try { view.value = await loadGraph(props.project); }
  catch (e) { error.value = e instanceof Error ? e.message : "failed to load graph"; }
  finally { loading.value = false; }
}
onMounted(load);
watch(() => props.project, load);

const dist = computed(() => Object.entries(view.value?.epistemic_distribution ?? {}).sort((a, b) => b[1] - a[1]));
const total = computed(() => view.value?.count ?? 0);
function color(mode: string) { return EPISTEMIC_COLORS[mode] ?? EPISTEMIC_COLORS.unknown; }
</script>

<template>
  <div class="ge">
    <header class="ge-head">
      <div>
        <h2>⧉ Knowledge graph <span class="cnt">{{ total }} nodes</span></h2>
        <p class="sub">Every node carries its <b>epistemic status</b> and <b>provenance</b> — what a graph explorer shows that Bloom can't.</p>
      </div>
      <button class="refresh" @click="load" :disabled="loading">↻</button>
    </header>

    <!-- epistemic distribution — the governance readout no incumbent surfaces -->
    <div v-if="total" class="dist">
      <div class="bar">
        <span v-for="[mode, n] in dist" :key="mode" :style="{ width: (n / total * 100) + '%', background: color(mode) }" :title="`${mode}: ${n}`" />
      </div>
      <div class="legend">
        <span v-for="[mode, n] in dist" :key="mode" class="lg"><i :style="{ background: color(mode) }" /> {{ mode }} · {{ n }}</span>
      </div>
    </div>

    <p v-if="view?.stub" class="note">Preview — sample provenance nodes. Live once VITE_STUDIO_API is wired.</p>
    <p v-if="loading" class="msg">Loading graph…</p>
    <p v-else-if="error" class="msg err">{{ error }}</p>
    <p v-else-if="!total" class="msg">Graph is empty for this project. Run an extraction to populate it (Extraction → Run).</p>

    <div v-else class="cloud">
      <button v-for="n in view!.nodes" :key="n.id" class="node" :class="{ sel: selected?.id === n.id }"
              :style="{ borderColor: color(n.epistemic_mode), color: color(n.epistemic_mode) }"
              @click="selected = n" :title="n.epistemic_mode">
        <span class="dot" :style="{ background: color(n.epistemic_mode) }" />{{ n.name }}
      </button>
    </div>

    <transition name="slide">
      <aside v-if="selected" class="prov">
        <button class="x" @click="selected = null">✕</button>
        <div class="pk">Node</div>
        <h3>{{ selected.name }}</h3>
        <dl>
          <div><dt>epistemic mode</dt><dd><span class="pill" :style="{ borderColor: color(selected.epistemic_mode), color: color(selected.epistemic_mode) }">{{ selected.epistemic_mode }}</span></dd></div>
          <div v-if="selected.source"><dt>source</dt><dd>{{ selected.source }}</dd></div>
          <div v-if="selected.extractor"><dt>extractor</dt><dd>{{ selected.extractor }}</dd></div>
          <div><dt>labels</dt><dd>{{ selected.labels.join(", ") }}</dd></div>
          <div><dt>atom id</dt><dd class="mono">{{ selected.id }}</dd></div>
        </dl>
        <div class="acts"><button class="primary" title="replay how this fact was derived (KE-5)">How derived?</button><button title="agents in this project already retrieve this">Share to team</button></div>
      </aside>
    </transition>
  </div>
</template>

<style scoped>
.ge { font: 14px/1.5 system-ui, sans-serif; color: #202124; position: relative; }
.ge-head { display: flex; justify-content: space-between; align-items: flex-start; }
.ge-head h2 { font-size: 18px; margin: 0; } .ge-head .cnt { font-size: 12px; color: #5f6368; font-weight: 400; }
.ge-head .sub { color: #5f6368; margin: 4px 0 12px; max-width: 620px; } .ge-head .sub b { color: #202124; }
.refresh { border: 1px solid #dadce0; background: #fff; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; }

.dist { margin: 4px 0 16px; }
.dist .bar { display: flex; height: 8px; border-radius: 5px; overflow: hidden; background: #eceff1; }
.dist .bar span { display: block; }
.dist .legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; font-size: 12px; color: #5f6368; }
.dist .lg i { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 4px; vertical-align: middle; }

.cloud { display: flex; flex-wrap: wrap; gap: 8px; }
.node { display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid; background: #fff; border-radius: 18px; padding: 5px 13px; font-size: 13px; font-weight: 500; cursor: pointer; transition: box-shadow .12s; }
.node:hover { box-shadow: 0 1px 6px rgba(60,64,67,.18); }
.node.sel { box-shadow: 0 0 0 2px currentColor; }
.node .dot { width: 8px; height: 8px; border-radius: 50%; }

.note { font-size: 12px; color: #b06000; background: #fef7e0; border-radius: 8px; padding: 6px 10px; margin: 0 0 12px; }
.msg { color: #5f6368; } .msg.err { color: #c5221f; }

.prov { position: absolute; top: 0; right: 0; width: 300px; background: #fff; border: 1px solid #e8eaed; border-radius: 12px; padding: 16px 18px; box-shadow: -2px 2px 16px rgba(60,64,67,.14); }
.prov .x { position: absolute; top: 10px; right: 12px; border: none; background: none; cursor: pointer; color: #5f6368; }
.prov .pk { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #5f6368; }
.prov h3 { margin: 4px 0 12px; font-size: 17px; }
.prov dl { margin: 0; } .prov dl > div { display: flex; gap: 10px; padding: 5px 0; border-bottom: 1px solid #f1f3f4; }
.prov dt { color: #5f6368; min-width: 96px; font-size: 12px; } .prov dd { margin: 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; }
.prov .mono { font-family: ui-monospace, monospace; font-size: 11px; }
.prov .pill { border: 1.5px solid; border-radius: 8px; padding: 0 8px; font-size: 12px; font-weight: 600; }
.prov .acts { display: flex; gap: 8px; margin-top: 14px; }
.prov .acts button { border: 1px solid #dadce0; background: #fff; border-radius: 16px; padding: 5px 12px; font-size: 12px; cursor: pointer; }
.prov .acts button.primary { background: #1a73e8; color: #fff; border-color: #1a73e8; }
.slide-enter-active, .slide-leave-active { transition: transform .18s, opacity .18s; }
.slide-enter-from, .slide-leave-to { transform: translateX(16px); opacity: 0; }
</style>
