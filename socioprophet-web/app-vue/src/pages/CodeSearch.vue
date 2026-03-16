<template><div><h3 style='color: var(--accent);'>Code Search</h3>
<div class='card'><input v-model="q" placeholder="query"/><button @click="run">Search</button></div>
<div class='card small' v-for="r in results" :key="r.repo + r.path">{{ r.repo }}:{{ r.path }} — {{ r.preview }}</div></div></template>
<script setup lang='ts'>
import { ref } from 'vue'; import { triRpc } from '../services/triRpc'
const q=ref('main'); const results=ref<any[]>([])
async function run(){ const res = await triRpc.code.search({query:q.value}); results.value = res.results || [] }
</script>