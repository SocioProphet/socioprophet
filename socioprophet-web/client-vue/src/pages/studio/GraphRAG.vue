<script setup lang="ts">
import { ref } from 'vue'
import { graph, ApiError } from './api'

const q = ref('')
const hops = ref(1)
const busy = ref(false)
const err = ref('')
const res = ref<any | null>(null)

async function ask() {
  if (!q.value.trim()) return
  busy.value = true; err.value = ''; res.value = null
  try { res.value = await graph.ask(q.value) } catch (e) { err.value = e instanceof ApiError ? `${e.status}: ${e.message}` : String(e) }
  finally { busy.value = false }
}
async function ground() {
  if (!q.value.trim()) return
  busy.value = true; err.value = ''; res.value = null
  try { res.value = { grounding: await graph.ground(q.value, hops.value) } } catch (e) { err.value = String(e) } finally { busy.value = false }
}
</script>

<template>
  <div class="card">
    <h3>GraphRAG — ask the graph, get a provenance-cited answer</h3>
    <p class="desc">Retrieval seeds semantically (embedding cosine) when a sovereign embeddings endpoint is configured, else lexically; the answer may only cite retrieved facts — every citation carries an assertion-time receipt.</p>
    <textarea v-model="q" rows="2" placeholder="e.g. what is Acme Aerospace connected to?" @keyup.ctrl.enter="ask"></textarea>
    <div class="row" style="margin-top:.6rem">
      <button class="btn" :disabled="busy" @click="ask">Ask ▶</button>
      <button class="btn ghost" :disabled="busy" @click="ground">Show grounding</button>
      <span class="muted">hops</span>
      <select v-model.number="hops" style="width:auto"><option :value="1">1</option><option :value="2">2</option><option :value="3">3</option></select>
    </div>
    <div v-if="err" class="err" style="margin-top:.6rem">⚠ {{ err }}</div>
  </div>

  <div class="card" v-if="res && res.answer">
    <div class="row" style="justify-content:space-between"><h3>Answer</h3>
      <span class="pill" :class="res.synthesized ? 'good' : ''">{{ res.synthesized ? 'synthesized' : 'extractive (no LLM configured)' }}</span></div>
    <p v-if="res.answer" style="line-height:1.55; white-space:pre-wrap">{{ res.answer }}</p>
    <p v-else class="muted">No LLM configured — the citations below are the grounded answer.</p>
  </div>

  <div class="card" v-if="res">
    <div class="row" style="justify-content:space-between"><h3>Citations ({{ (res.citations ?? res.grounding?.citations ?? []).length }})</h3>
      <span v-if="res.grounding?.retrieval || res.retrieval" class="pill accent">{{ res.grounding?.retrieval || res.retrieval }}</span></div>
    <div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>fact</th><th>asserted</th></tr></thead>
      <tbody><tr v-for="c in (res.citations ?? res.grounding?.citations ?? [])" :key="c.n">
        <td>{{ c.n }}</td><td style="word-break:break-word">{{ c.fact }}</td><td class="muted">{{ (c.assertedAt||'').slice(0,19) }}</td>
      </tr></tbody></table></div>
  </div>
</template>
