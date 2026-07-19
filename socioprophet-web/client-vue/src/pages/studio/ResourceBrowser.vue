<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { graph, ApiError } from './api'

const uri = ref('')
const busy = ref(false)
const err = ref('')
const cbd = ref<any | null>(null)

async function load() {
  if (!uri.value.trim()) return
  busy.value = true; err.value = ''; cbd.value = null
  try { cbd.value = await graph.resource(uri.value) }
  catch (e) { err.value = e instanceof ApiError ? `${e.status}: ${e.message}` : String(e) }
  finally { busy.value = false }
}
function open(u: string) { uri.value = u; load() }
onMounted(() => {
  const m = location.hash.match(/^#resource:(.+)$/)
  if (m) { uri.value = decodeURIComponent(m[1]); load() }
})
</script>

<template>
  <div class="card">
    <h3>Resource browser — dereferenceable Linked Data</h3>
    <p class="desc">Paste any resource URI → its Concise Bounded Description (facts + back-links), the gist/Prez/Pubby affordance. Object IRIs are clickable — walk the graph.</p>
    <div class="row"><input v-model="uri" type="text" placeholder="e.g. proj-x:ent:acme" @keyup.enter="load" /><button class="btn" :disabled="busy" @click="load">Resolve</button></div>
    <div v-if="err" class="err" style="margin-top:.6rem">⚠ {{ err }}</div>
  </div>

  <div class="grid cols-2" v-if="cbd">
    <div class="card">
      <h3>Facts ({{ (cbd.outgoing||[]).length }})</h3>
      <div class="scroll"><table class="tbl"><thead><tr><th>predicate</th><th>object</th></tr></thead>
        <tbody><tr v-for="(t,i) in cbd.outgoing" :key="i"><td class="muted">{{ t.predicate }}</td>
          <td><a v-if="t.isIri" class="link" @click="open(String(t.object))">{{ t.object }}</a><span v-else>{{ t.object }}</span></td></tr></tbody></table></div>
    </div>
    <div class="card">
      <h3>Referenced by ({{ (cbd.incoming||[]).length }})</h3>
      <div class="scroll"><table class="tbl"><thead><tr><th>subject</th><th>via</th></tr></thead>
        <tbody><tr v-for="(t,i) in cbd.incoming" :key="i"><td><a class="link" @click="open(t.subject)">{{ t.subject }}</a></td><td class="muted">{{ t.predicate }}</td></tr></tbody></table></div>
    </div>
  </div>
</template>
