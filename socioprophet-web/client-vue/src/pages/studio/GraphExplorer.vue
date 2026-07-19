<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { graph, ApiError } from './api'
import ForceGraph from './ForceGraph.vue'

const label = ref('')
const limit = ref(300)
const busy = ref(false)
const err = ref('')
const nodes = ref<{ id: string; label?: string; group?: string }[]>([])
const edges = ref<{ source: string; target: string }[]>([])
const stats = ref<{ count: number; edges: number }>({ count: 0, edges: 0 })
const selected = ref<any | null>(null)
const rawNodes = ref<Record<string, any>>({})

async function load() {
  busy.value = true; err.value = ''; selected.value = null
  try {
    const r = await graph.subgraph(label.value, limit.value)
    stats.value = { count: r.count, edges: r.edges }
    rawNodes.value = Object.fromEntries(r.nodes.map((n: any) => [n.id, n]))
    nodes.value = r.nodes.map((n: any) => ({ id: n.id, label: n.properties?.name ?? n.labels?.[0] ?? n.id, group: n.labels?.[0] }))
    edges.value = r.edgeList.map((e: any) => ({ source: e.from, target: e.to }))
  } catch (e) { err.value = e instanceof ApiError ? `${e.status}: ${e.message}` : String(e) }
  finally { busy.value = false }
}
function onSelect(id: string) { selected.value = rawNodes.value[id] ?? { id } }
onMounted(load)
</script>

<template>
  <div class="grid" style="grid-template-columns: 1fr 320px; height: calc(100vh - 132px)">
    <div class="card" style="display:flex; flex-direction:column; min-height:0">
      <div class="row" style="margin-bottom:.7rem">
        <input v-model="label" type="text" placeholder="filter by label (blank = whole graph)" style="max-width:280px" @keyup.enter="load" />
        <select v-model.number="limit" style="width:auto"><option :value="100">100</option><option :value="300">300</option><option :value="600">600</option></select>
        <button class="btn" :disabled="busy" @click="load">{{ busy ? 'Loading…' : 'Explore' }}</button>
        <span class="muted">·</span>
        <span class="pill">{{ stats.count }} nodes</span><span class="pill">{{ stats.edges }} edges</span>
      </div>
      <div v-if="err" class="err" style="margin-bottom:.5rem">⚠ {{ err }}</div>
      <div style="flex:1; min-height:0; border:1px solid var(--border); border-radius:8px; overflow:hidden">
        <ForceGraph :nodes="nodes" :edges="edges" @select="onSelect" />
      </div>
    </div>

    <div class="card" style="overflow:auto">
      <h3>Inspector</h3>
      <p class="desc">Click a node. Every node carries its provenance — the moat a plain graph viewer can't show.</p>
      <div v-if="!selected" class="muted">No selection.</div>
      <template v-else>
        <div class="kpi-l">ID</div>
        <div class="mono" style="word-break:break-all; margin-bottom:.6rem">{{ selected.id }}</div>
        <div class="kpi-l">Labels</div>
        <div class="row" style="margin-bottom:.6rem"><span v-for="l in (selected.labels ?? [])" :key="l" class="pill accent">{{ l }}</span></div>
        <div class="kpi-l">Properties</div>
        <table class="tbl" style="margin-top:.3rem"><tbody>
          <tr v-for="(v,k) in (selected.properties ?? {})" :key="k"><td class="muted">{{ k }}</td><td>{{ v }}</td></tr>
        </tbody></table>
        <div style="margin-top:.8rem"><a class="link" :href="`#resource:${encodeURIComponent(selected.id)}`">Open in Resource Browser →</a></div>
      </template>
    </div>
  </div>
</template>
