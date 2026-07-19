<script setup lang="ts">
import { ref } from 'vue'
import { er, ApiError } from './api'

const SAMPLE = JSON.stringify([
  { id: 'r1', name: 'Acme Corporation', attributes: { city: 'NYC', email: 'info@acme.com' } },
  { id: 'r2', name: 'Acme Corp', attributes: { city: 'NYC' } },
  { id: 'r3', name: 'Acme Corporation', attributes: { city: 'NYC', email: 'other@acme.com' } },
], null, 2)
const input = ref(SAMPLE)
const busy = ref(false)
const err = ref('')
const res = ref<any | null>(null)

async function run() {
  busy.value = true; err.value = ''; res.value = null
  try { res.value = await er.resolve(JSON.parse(input.value)) }
  catch (e) { err.value = e instanceof ApiError ? `${e.status}: ${e.message}` : String(e) }
  finally { busy.value = false }
}
const decisionClass = (d: string) => d === 'MERGE_VERIFIED' ? 'good' : d === 'MERGE_BLOCKED' ? 'bad' : ''
</script>

<template>
  <div class="card">
    <h3>Entity resolution — proof-carrying, identity-is-prime-conformant</h3>
    <p class="desc">Blocking → similarity → margin-gated + conflict-aware clustering. Records with conflicting exclusive keys can never merge (not even transitively), and every decision is a replayable certificate.</p>
    <textarea v-model="input" rows="9" spellcheck="false"></textarea>
    <div class="row" style="margin-top:.6rem"><button class="btn" :disabled="busy" @click="run">{{ busy ? 'Resolving…' : 'Resolve ▶' }}</button></div>
    <div v-if="err" class="err" style="margin-top:.6rem">⚠ {{ err }}</div>
  </div>

  <template v-if="res">
    <div class="card">
      <div class="row" style="gap:2rem">
        <div><div class="kpi">{{ res.records }}</div><div class="kpi-l">records</div></div>
        <div><div class="kpi">{{ res.entities.length }}</div><div class="kpi-l">entities</div></div>
        <div><div class="kpi">{{ res.merged }}</div><div class="kpi-l">merged</div></div>
        <div><div class="kpi">{{ (res.review_queue||[]).length }}</div><div class="kpi-l">review</div></div>
        <div><div class="kpi">{{ (res.blocked||[]).length }}</div><div class="kpi-l">blocked</div></div>
      </div>
      <div class="muted mono" style="margin-top:.6rem; font-size:.72rem" v-if="res.replay_key">replay key · {{ res.replay_key.resolver_version }} / {{ res.replay_key.policy_version }} / {{ res.replay_key.template_version }}</div>
    </div>
    <div class="card">
      <h3>Golden records</h3>
      <div class="scroll"><table class="tbl"><thead><tr><th>entity</th><th>survivor</th><th>name</th><th>members</th></tr></thead>
        <tbody><tr v-for="(g,eid) in res.golden_records" :key="eid"><td>{{ eid }}</td><td>{{ g.survivor }}</td><td>{{ g.name }}</td><td>{{ (g.members||[]).join(', ') }}</td></tr></tbody></table></div>
    </div>
    <div class="card">
      <h3>Decision ledger</h3>
      <div class="scroll"><table class="tbl"><thead><tr><th>a</th><th>b</th><th>decision</th><th>score</th><th>evidence</th></tr></thead>
        <tbody><tr v-for="(d,i) in res.decision_ledger" :key="i">
          <td>{{ d.a }}</td><td>{{ d.b }}</td><td><span class="pill" :class="decisionClass(d.decision)">{{ d.decision }}</span></td>
          <td>{{ d.score }}</td><td class="muted">{{ d.evidence?.conflict_field ? 'conflict:'+d.evidence.conflict_field : (d.evidence?.prime_veto || (d.evidence?.matched_attributes||[]).join(',')) }}</td>
        </tr></tbody></table></div>
    </div>
  </template>
</template>
