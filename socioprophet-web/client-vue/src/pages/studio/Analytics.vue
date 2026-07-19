<script setup lang="ts">
import { ref } from 'vue'
import { graph, ApiError } from './api'

const busy = ref(false)
const err = ref('')
const pr = ref<any | null>(null)
const cc = ref<any | null>(null)

async function runPr() { busy.value = true; err.value = ''; try { pr.value = await graph.analytics('pagerank', 25) } catch (e) { err.value = fmt(e) } finally { busy.value = false } }
async function runCc() { busy.value = true; err.value = ''; try { cc.value = await graph.analytics('components', 1) } catch (e) { err.value = fmt(e) } finally { busy.value = false } }
function fmt(e: unknown) { return e instanceof ApiError ? `${e.status}: ${e.message}` : String(e) }
</script>

<template>
  <div class="card">
    <h3>Graph analytics — the benchmarked Rust CSR kernel</h3>
    <p class="desc">PageRank &amp; connected components run on the <code>hg_analytics</code> kernel measured in the published benchmark, compiled into the service via N-API. Every result reports which backend served it.</p>
    <div class="row"><button class="btn" :disabled="busy" @click="runPr">Run PageRank</button><button class="btn ghost" :disabled="busy" @click="runCc">Connected components</button></div>
    <div v-if="err" class="err" style="margin-top:.6rem">⚠ {{ err }}</div>
  </div>

  <div class="grid cols-2" v-if="pr || cc">
    <div class="card" v-if="pr">
      <div class="row" style="justify-content:space-between"><h3>PageRank</h3><span class="pill accent">{{ pr.backend }}</span></div>
      <div class="row" style="gap:2rem; margin:.5rem 0 .8rem">
        <div><div class="kpi">{{ pr.nodes }}</div><div class="kpi-l">nodes</div></div>
        <div><div class="kpi">{{ pr.edges }}</div><div class="kpi-l">edges</div></div>
      </div>
      <div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>node</th><th>score</th></tr></thead>
        <tbody><tr v-for="(t,i) in pr.top" :key="t.id"><td>{{ i+1 }}</td><td style="word-break:break-all">{{ t.id }}</td><td>{{ t.score }}</td></tr></tbody></table></div>
    </div>
    <div class="card" v-if="cc">
      <div class="row" style="justify-content:space-between"><h3>Connected components</h3><span class="pill accent">{{ cc.backend }}</span></div>
      <div class="row" style="gap:2rem; margin-top:.6rem">
        <div><div class="kpi">{{ cc.components }}</div><div class="kpi-l">components</div></div>
        <div><div class="kpi">{{ cc.largest }}</div><div class="kpi-l">largest</div></div>
        <div><div class="kpi">{{ cc.nodes }}</div><div class="kpi-l">nodes</div></div>
      </div>
    </div>
  </div>
</template>
