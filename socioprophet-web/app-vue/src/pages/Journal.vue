<template><div><h3 style='color: var(--accent);'>Journal</h3>
<div class='card small'>Stream (VITE_MOCK=1 for demo)</div>
<div class='card small' v-for="e in events" :key="e.ts + e.kind"><b>{{ e.kind }}</b> — <span class='small'>{{ e.ts }}</span></div></div></template>
<script setup lang='ts'>
import { ref, onMounted } from 'vue'; import { triRpc } from '../services/triRpc'
const events=ref<any[]>([]); onMounted(async()=>{ for await (const ev of triRpc.journal.subscribe({})) { events.value.push(ev); if(events.value.length>100) events.value.shift() } })
</script>