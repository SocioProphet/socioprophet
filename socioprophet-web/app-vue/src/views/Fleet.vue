<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuth } from "../stores/auth";
import { listDevices, registerDevice, assignBuild, listBuilds } from "../services/buildsApi";

const auth = useAuth();
const devices = ref<any[]>([]);
const builds = ref<any[]>([]);
const newName = ref("");
const err = ref(""); const busy = ref(false);

const refresh = async () => {
  try {
    devices.value = (await listDevices()).devices || [];
    builds.value = ((await listBuilds()).builds || []).filter((b: any) => b.status === "complete");
    err.value = "";
  } catch (e: any) { err.value = e.message; }
};
const add = async () => {
  if (!newName.value.trim()) return;
  busy.value = true;
  try { await registerDevice(newName.value.trim()); newName.value = ""; await refresh(); }
  catch (e: any) { err.value = e.message; } finally { busy.value = false; }
};
const assign = async (deviceId: string, ev: Event) => {
  const buildId = (ev.target as HTMLSelectElement).value;
  if (!buildId) return;
  try { await assignBuild(deviceId, buildId); await refresh(); }
  catch (e: any) { err.value = e.message; }
};

onMounted(refresh);
</script>

<template>
  <h2>Fleet <span class="pill">premium</span></h2>
  <p class="muted">Register devices, hand each its claim code (put it on the nlboot drive), and assign a built image. Devices fetch their assigned image on next boot/heartbeat — change the assignment and the fleet re-kexecs into the new image.</p>
  <p v-if="err" class="status-error">{{ err }}</p>

  <div class="card">
    <label>Register a device</label>
    <div class="row">
      <input v-model="newName" placeholder="rack-01" />
      <button class="btn" :disabled="busy" @click="add" style="flex:0 0 auto">Get claim code</button>
    </div>
  </div>

  <div class="card" v-for="d in devices" :key="d.id">
    <div class="row" style="align-items:center">
      <div>
        <strong>{{ d.name }}</strong>
        <div class="muted" style="font-family:monospace">claim: {{ d.claimCode }}</div>
        <div class="muted">last seen: {{ d.lastSeen ? new Date(d.lastSeen._seconds ? d.lastSeen._seconds*1000 : d.lastSeen).toLocaleString() : "never" }}</div>
      </div>
      <div style="flex:0 0 auto;text-align:right">
        <label style="margin:0">Assigned image</label>
        <select :value="d.assignedBuildId || ''" @change="assign(d.id, $event)">
          <option value="">— none —</option>
          <option v-for="b in builds" :key="b.id" :value="b.id">
            {{ b.spec?.edition }}/{{ b.spec?.arch }} · {{ b.spec?.hostname }}
          </option>
        </select>
      </div>
    </div>
  </div>
  <p v-if="!devices.length" class="muted">No devices yet.</p>
</template>
