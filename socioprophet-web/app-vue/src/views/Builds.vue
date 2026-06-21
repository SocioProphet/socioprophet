<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { listBuilds } from "../services/buildsApi";

const builds = ref<any[]>([]);
const err = ref(""); let timer: any = null;

const refresh = async () => {
  try { builds.value = (await listBuilds()).builds || []; err.value = ""; }
  catch (e: any) { err.value = e.message; }
};
const gsToHttps = (u: string) =>
  u?.startsWith("gs://") ? "https://storage.googleapis.com/" + u.slice(5) : u;

onMounted(() => { refresh(); timer = setInterval(refresh, 8000); });   // poll for status
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <h2>My builds</h2>
  <p class="muted"><router-link to="/builder">+ New build</router-link></p>
  <p v-if="err" class="status-error">{{ err }}</p>
  <p v-if="!builds.length" class="muted">No builds yet.</p>

  <div class="card" v-for="b in builds" :key="b.id">
    <div class="row" style="align-items:center">
      <div>
        <strong>{{ b.spec?.edition }}</strong> · {{ b.spec?.arch }} · {{ b.spec?.hostname }}
        <div class="muted">{{ (b.spec?.packages || []).join(", ") || "no extra packages" }}</div>
      </div>
      <div style="text-align:right;flex:0 0 auto">
        <span :class="'status-' + b.status">{{ b.status }}</span><br />
        <a v-if="b.status === 'complete' && b.artifact" class="btn" style="margin-top:6px"
           :href="gsToHttps(b.artifact)">Download ISO</a>
      </div>
    </div>
  </div>
</template>
