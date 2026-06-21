<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../stores/auth";
import { createBuild, type BuildSpec } from "../services/buildsApi";

const auth = useAuth();
const router = useRouter();

const edition = ref<BuildSpec["edition"]>("desktop");
const arch = ref<BuildSpec["arch"]>("x86_64");
const hostname = ref("sourceos");
const packagesText = ref("");
const enableSsh = ref(false);
const enableDocker = ref(false);
const usersText = ref("");
const err = ref(""); const busy = ref(false);

// Gates driven by the server-provided policy (server still enforces).
const advanced = computed(() => !!auth.policy?.services);   // services/users → paid+
const maxPackages = computed(() => auth.policy?.maxPackages ?? 10);
const lane = computed(() => (auth.tier === "free"
  ? "Built on shared CI runners (free tier)."
  : "Built on a private on-demand VM (paid tier)."));

const submit = async () => {
  err.value = ""; busy.value = true;
  const packages = packagesText.value.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
  const spec: BuildSpec = { edition: edition.value, arch: arch.value, hostname: hostname.value, packages };
  if (advanced.value) {
    spec.services = { openssh: enableSsh.value, docker: enableDocker.value };
    const users = usersText.value.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
      .map(name => ({ name, groups: ["wheel"] }));
    if (users.length) spec.users = users;
  }
  try {
    await createBuild(spec);
    router.push("/builds");
  } catch (e: any) { err.value = e.message; } finally { busy.value = false; }
};
</script>

<template>
  <h2>Build your SourceOS image</h2>
  <p class="muted">Start from a flavor, customize, and we build it. <span class="pill">{{ auth.tier }} tier</span></p>

  <div class="card">
    <div class="row">
      <div>
        <label>Edition</label>
        <select v-model="edition">
          <option value="desktop">Desktop (GNOME)</option>
          <option value="server">Server (headless)</option>
          <option value="edge">Edge (appliance)</option>
        </select>
      </div>
      <div>
        <label>Architecture</label>
        <select v-model="arch">
          <option value="x86_64">x86_64 (PC)</option>
          <option value="aarch64">ARM64</option>
        </select>
      </div>
    </div>

    <label>Hostname</label>
    <input v-model="hostname" placeholder="sourceos" />

    <label>Extra packages <span class="muted">(space/comma separated nixpkgs names · up to {{ maxPackages }})</span></label>
    <textarea v-model="packagesText" rows="3" placeholder="htop tmux ripgrep"></textarea>

    <div :class="{ gated: !advanced }" style="margin-top:8px">
      <label>Services <span v-if="!advanced" class="muted">— paid tier</span></label>
      <label style="display:inline-flex;gap:8px;align-items:center;width:auto">
        <input type="checkbox" style="width:auto" v-model="enableSsh" :disabled="!advanced" /> OpenSSH
      </label>
      <label style="display:inline-flex;gap:8px;align-items:center;width:auto;margin-left:18px">
        <input type="checkbox" style="width:auto" v-model="enableDocker" :disabled="!advanced" /> Docker
      </label>

      <label style="margin-top:12px">Users <span v-if="!advanced" class="muted">— paid tier</span>
        <span v-else class="muted">(space/comma separated; each added to wheel)</span></label>
      <input v-model="usersText" :disabled="!advanced" placeholder="alice bob" />
    </div>

    <div style="margin-top:18px">
      <button class="btn" :disabled="busy" @click="submit">{{ busy ? "Submitting…" : "Build image" }}</button>
      <span class="muted" style="margin-left:12px">{{ lane }}</span>
    </div>
    <p v-if="err" class="status-error" style="margin-top:12px">{{ err }}</p>
  </div>
</template>
