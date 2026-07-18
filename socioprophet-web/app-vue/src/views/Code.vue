<script setup lang="ts">
// Code = sovereign git + developer workspace, served by Gitea (git.<domain>) with single sovereign login via the
// broker (OIDC). Embedded here; opens full-screen in a new tab too.
const giteaUrl = (import.meta as { env?: Record<string, string> }).env?.VITE_GITEA_URL ?? "https://git.socioprophet.ai";
</script>

<template>
  <div class="code">
    <header>
      <div><strong>⌥ Code</strong> <span class="tag">Gitea · sovereign git</span></div>
      <a :href="giteaUrl" target="_blank" rel="noopener">Open full ↗</a>
    </header>
    <div class="note">If this stays blank, your Gitea blocks embedding (X-Frame-Options) — use <a :href="giteaUrl" target="_blank" rel="noopener">Open full ↗</a>.</div>
    <iframe :src="giteaUrl" title="Gitea" />
  </div>
</template>

<style scoped>
.code { display: flex; flex-direction: column; height: 100%; }
header { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; border-bottom: 1px solid var(--hairline); font: 14px var(--ui); }
.tag { font-size: 12px; background: var(--ok-wash); color: var(--ok); padding: 2px 8px; border-radius: 10px; }
header a { color: var(--accent); text-decoration: none; font-size: 13px; }
iframe { flex: 1; border: 0; width: 100%; }
.note { font-size: 12px; color: var(--warn); background: var(--warn-wash); padding: 4px 14px; } .note a { color: var(--accent); }
</style>
