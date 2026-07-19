<script setup lang="ts">
import { ref } from 'vue'
import { reasoner, ApiError } from './api'
import ForceGraph from './ForceGraph.vue'

const SAMPLE = `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix ex: <http://ex/> .
ex: a owl:Ontology ; rdfs:label "Example" .
ex:Animal a owl:Class ; rdfs:label "Animal" ; rdfs:comment "A living creature." .
ex:Dog a owl:Class ; rdfs:label "Dog" ; rdfs:subClassOf ex:Animal .
ex:Person a owl:Class ; rdfs:label "Person" .
ex:owns a owl:ObjectProperty ; rdfs:label "owns" ; rdfs:domain ex:Person ; rdfs:range ex:Dog .`
const turtle = ref(SAMPLE)
const busy = ref(false)
const err = ref('')
const doc = ref<any | null>(null)
const gnodes = ref<any[]>([])
const gedges = ref<any[]>([])

async function run() {
  busy.value = true; err.value = ''; doc.value = null
  try {
    const [d, g] = await Promise.all([reasoner.ontologyDoc(turtle.value), reasoner.ontologyGraph(turtle.value)])
    doc.value = d
    gnodes.value = (g.nodes || []).map((n: any) => ({ id: n.id, label: n.label, group: n.type }))
    gedges.value = (g.edges || []).map((e: any) => ({ source: e.source, target: e.target }))
  } catch (e) { err.value = e instanceof ApiError ? `${e.status}: ${e.message}` : String(e) }
  finally { busy.value = false }
}
</script>

<template>
  <div class="card">
    <h3>Ontology workbench — docs + VOWL-style class graph</h3>
    <p class="desc">Paste OWL/Turtle → browsable documentation (pyLODE/Widoco-class) and a rendered TBox graph of classes and object-property domain→range.</p>
    <textarea v-model="turtle" rows="8" spellcheck="false"></textarea>
    <div class="row" style="margin-top:.6rem"><button class="btn" :disabled="busy" @click="run">{{ busy ? 'Building…' : 'Render' }}</button></div>
    <div v-if="err" class="err" style="margin-top:.6rem">⚠ {{ err }}</div>
  </div>

  <div class="grid cols-2" v-if="doc" style="height: 60vh">
    <div class="card" style="display:flex; flex-direction:column; min-height:0">
      <h3>{{ doc.header?.title || 'Ontology' }}</h3>
      <p class="desc">{{ doc.counts?.classes }} classes · {{ doc.counts?.properties }} properties</p>
      <div class="scroll" style="flex:1">
        <table class="tbl"><thead><tr><th>class</th><th>super-classes</th><th>comment</th></tr></thead>
          <tbody><tr v-for="c in doc.classes" :key="c.uri"><td>{{ c.label }}</td><td class="muted">{{ (c.superClasses||[]).map((s:string)=>s.split(/[#/]/).pop()).join(', ') }}</td><td class="muted">{{ c.comment }}</td></tr></tbody></table>
      </div>
    </div>
    <div class="card" style="display:flex; flex-direction:column; min-height:0">
      <h3>TBox graph</h3>
      <div style="flex:1; min-height:0; border:1px solid var(--border); border-radius:8px; overflow:hidden"><ForceGraph :nodes="gnodes" :edges="gedges" /></div>
    </div>
  </div>
</template>
