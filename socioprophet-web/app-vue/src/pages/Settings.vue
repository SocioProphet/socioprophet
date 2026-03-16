<template><div><h3 style='color: var(--accent);'>Settings</h3>
<label>Bearer Token</label><input v-model="bearer"/><label style="margin-top:8px">API Key</label><input v-model="apiKey"/>
<div style="display:flex;gap:8px;margin-top:8px"><button @click="save">Save</button><button @click="ping">Test API</button></div>
<div class='small' style='margin-top:8px;color:#7ee787'>{{ status }}</div></div></template>
<script setup lang='ts'>
import { ref } from 'vue'; import { apiGet } from '../services/api'
const bearer=ref(localStorage.getItem('agent_bearer_token')||''); const apiKey=ref(localStorage.getItem('agent_api_key')||''); const status=ref('')
function save(){ if(bearer.value){localStorage.setItem('agent_bearer_token',bearer.value)}else localStorage.removeItem('agent_bearer_token'); if(apiKey.value){localStorage.setItem('agent_api_key',apiKey.value)}else localStorage.removeItem('agent_api_key'); status.value='Saved.'}
async function ping(){ try{ await apiGet('/specs'); status.value='API OK' } catch(e:any){ status.value='API error: '+String(e) } }
</script>