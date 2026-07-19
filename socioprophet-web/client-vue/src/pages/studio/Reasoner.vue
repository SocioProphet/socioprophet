<script setup lang="ts">
import { ref } from 'vue'
import { reasoner, ApiError } from './api'

const SAMPLE = `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix ex: <http://ex/> .
ex:A rdfs:subClassOf ex:B .
ex:B rdfs:subClassOf ex:C .
ex:C rdfs:subClassOf ex:D .
ex:x a ex:A .`
const turtle = ref(SAMPLE)
const inference = ref('rdfs')
const busy = ref(false)
const err = ref('')
const res = ref<any | null>(null)

async function run() {
  busy.value = true; err.value = ''; res.value = null
  try { res.value = await reasoner.reason(turtle.value, inference.value, true) }
  catch (e) { err.value = e instanceof ApiError ? `${e.status}: ${e.message}` : String(e) }
  finally { busy.value = false }
}
function renderProof(node: any, depth = 0): string {
  const pad = '  '.repeat(depth)
  if (node.asserted) return `${pad}• ${node.conclusion}  (asserted)`
  const head = `${pad}⊢ ${node.conclusion}   [${node.rule}]`
  return [head, ...(node.premises ?? []).map((p: any) => renderProof(p, depth + 1))].join('\n')
}
</script>

<template>
  <div class="card">
    <h3>Reasoner — RDFS / OWL 2 RL entailment with SOUND proof trees</h3>
    <p class="desc">Every entailment is justified by a proof grounded in <em>asserted</em> facts (never underived premises), and coverage is reported honestly — the "why" opaque reasoners hide.</p>
    <textarea v-model="turtle" rows="7" spellcheck="false"></textarea>
    <div class="row" style="margin-top:.6rem">
      <select v-model="inference" style="width:auto"><option value="rdfs">RDFS</option><option value="owl2rl">OWL 2 RL</option><option value="both">Both</option></select>
      <button class="btn" :disabled="busy" @click="run">{{ busy ? 'Reasoning…' : 'Reason ▶' }}</button>
    </div>
    <div v-if="err" class="err" style="margin-top:.6rem">⚠ {{ err }}</div>
  </div>

  <div class="grid cols-2" v-if="res">
    <div class="card">
      <div class="row" style="gap:2rem">
        <div><div class="kpi">{{ res.entailed_triples }}</div><div class="kpi-l">entailed</div></div>
        <div><div class="kpi">{{ res.justification_coverage?.explained ?? '—' }}</div><div class="kpi-l">explained</div></div>
        <div><div class="kpi">{{ res.profile }}</div><div class="kpi-l">profile</div></div>
      </div>
      <h3 style="margin-top:1rem">Entailments</h3>
      <div class="scroll"><table class="tbl"><tbody><tr v-for="(e,i) in res.entailments" :key="i"><td>{{ e }}</td></tr></tbody></table></div>
    </div>
    <div class="card">
      <h3>Proof trees</h3>
      <p class="desc" v-if="res.justification_coverage">{{ res.justification_coverage.explained }} of {{ res.justification_coverage.of }} explained; the rest are OWL-RL axiomatic noise or rules outside the covered subset — counted, not hidden.</p>
      <pre class="out" v-for="(j,i) in (res.justifications ?? [])" :key="i">{{ renderProof(j) }}</pre>
      <div v-if="!(res.justifications ?? []).length" class="muted">No attributable proofs for this input.</div>
    </div>
  </div>
</template>
