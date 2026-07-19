<script setup lang="ts">
import { ref } from 'vue'
import { graph, ApiError } from './api'

const lang = ref<'sparql' | 'cypher' | 'gremlin'>('sparql')
const samples: Record<string, string> = {
  sparql: 'SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 25',
  cypher: 'MATCH (n) RETURN n LIMIT 25',
  gremlin: 'g.V().limit(25)',
}
const q = ref(samples.sparql)
const busy = ref(false)
const err = ref('')
const cols = ref<string[]>([])
const rows = ref<any[]>([])
const meta = ref<Record<string, any>>({})

function pick(l: 'sparql' | 'cypher' | 'gremlin') { lang.value = l; q.value = samples[l]; cols.value = []; rows.value = []; err.value = '' }

async function run() {
  busy.value = true; err.value = ''; cols.value = []; rows.value = []; meta.value = {}
  try {
    const r = lang.value === 'sparql' ? await graph.sparql(q.value)
      : lang.value === 'cypher' ? await graph.cypher(q.value)
        : await graph.gremlin(q.value)
    if (lang.value === 'sparql') { cols.value = r.variables ?? []; rows.value = (r.bindings ?? []).map((b: any) => cols.value.map((c) => b[c])) ; meta.value = { evaluatedAtSeq: r.evaluatedAtSeq } }
    else if (lang.value === 'cypher') { cols.value = r.columns ?? []; rows.value = (r.rows ?? []).map((row: any) => cols.value.map((c) => row[c])); meta.value = { queryHash: r.queryHash, evaluatedAtSeq: r.evaluatedAtSeq } }
    else { cols.value = ['value']; rows.value = (r.values ?? []).map((v: any) => [typeof v === 'object' ? JSON.stringify(v) : v]); meta.value = { count: r.count } }
  } catch (e) { err.value = e instanceof ApiError ? `${e.status}: ${e.message}` : String(e) }
  finally { busy.value = false }
}
</script>

<template>
  <div class="card">
    <div class="row" style="justify-content:space-between">
      <div class="row">
        <button v-for="l in (['sparql','cypher','gremlin'] as const)" :key="l" class="btn ghost"
          :style="lang===l ? 'border-color:var(--accent); color:var(--accent)' : ''" @click="pick(l)">{{ l.toUpperCase() }}</button>
      </div>
      <button class="btn" :disabled="busy" @click="run">{{ busy ? 'Running…' : 'Run ▶' }}</button>
    </div>
    <p class="desc" style="margin-top:.7rem">Proof-carrying query surface. Unsupported syntax throws an explicit error — never a silently-wrong empty result.</p>
    <textarea v-model="q" rows="5" spellcheck="false"></textarea>
  </div>

  <div class="card" v-if="err"><div class="err">⚠ {{ err }}</div></div>

  <div class="card" v-if="cols.length">
    <div class="row" style="justify-content:space-between; margin-bottom:.6rem">
      <h3>{{ rows.length }} rows</h3>
      <div class="row">
        <span v-if="meta.queryHash" class="pill accent mono" :title="meta.queryHash">⛓ {{ String(meta.queryHash).slice(0, 18) }}…</span>
        <span v-if="meta.evaluatedAtSeq!=null" class="pill">seq {{ meta.evaluatedAtSeq }}</span>
      </div>
    </div>
    <div class="scroll">
      <table class="tbl">
        <thead><tr><th v-for="c in cols" :key="c">{{ c }}</th></tr></thead>
        <tbody><tr v-for="(r,i) in rows" :key="i"><td v-for="(cell,j) in r" :key="j">{{ cell }}</td></tr></tbody>
      </table>
    </div>
  </div>
</template>
