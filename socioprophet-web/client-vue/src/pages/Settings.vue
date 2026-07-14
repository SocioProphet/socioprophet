<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../stores/auth';
import { useSettings } from '../stores/settings';
import { meshBase, setMeshBase, checkMesh, DEFAULT_MESH_BASE, type MeshStatus } from '../config/mesh';

const auth = useAuth();
const settings = useSettings();

// Prophet Mesh connection (ST011). Endpoint is editable + persisted; the check reports
// the real reachability observed from the browser.
const meshUrl = ref(meshBase());
const meshStatus = ref<MeshStatus | null>(null);
const meshChecking = ref(false);
async function checkMeshConnection() {
  meshChecking.value = true;
  setMeshBase(meshUrl.value);
  meshStatus.value = await checkMesh(meshUrl.value.replace(/\/$/, ''));
  meshChecking.value = false;
}

// Connections (Watson Studio "Git integrations / credentials for connections"). Local-only for now —
// persisted to localStorage; a live build wires these to the platform connection store.
const giteaToken = ref(localStorage.getItem('sp.conn.gitea') ?? '');
const savedNote = ref('');
function saveConnections() {
  localStorage.setItem('sp.conn.gitea', giteaToken.value);
  savedNote.value = 'Saved locally';
  setTimeout(() => (savedNote.value = ''), 2000);
}
</script>

<template>
  <section class="st" aria-label="Settings">
    <header class="st-top">
      <p class="st-eyebrow">Account</p>
      <h1 class="st-title">Settings</h1>
    </header>

    <nav class="st-toc" aria-label="Settings sections">
      <a href="#profile">Profile</a>
      <a href="#appearance">Appearance</a>
      <a href="#operator">Operator mode</a>
      <a href="#connections">Connections</a>
    </nav>

    <section id="profile" class="st-card">
      <h2>Profile</h2>
      <div class="st-row"><span class="st-label">Signed in as</span><span>{{ auth.user?.email ?? 'not signed in' }}</span></div>
      <div class="st-row"><span class="st-label">Display name</span><span>{{ auth.user?.displayName ?? '—' }}</span></div>
      <div class="st-row"><span class="st-label">Tier</span><span class="st-pill">{{ auth.tier }}</span></div>
      <p class="st-hint">Profile fields are read from your authenticated session. Editing name/avatar arrives with the account service (ST007 login work).</p>
    </section>

    <section id="appearance" class="st-card">
      <h2>Appearance</h2>
      <div class="st-row">
        <span class="st-label">Theme</span>
        <span class="st-seg">
          <button :class="{ active: settings.theme === 'dark' }" @click="settings.setTheme('dark')">Dark</button>
          <button :class="{ active: settings.theme === 'light' }" @click="settings.setTheme('light')">Light</button>
        </span>
      </div>
      <p class="st-hint">Theme preference persists across reloads. Full light-mode theming of every surface is in progress; the shell chrome responds today.</p>
    </section>

    <section id="operator" class="st-card">
      <h2>Operator mode</h2>
      <div class="st-row">
        <span class="st-label">SourceOS / operator surfaces</span>
        <button class="st-toggle" :class="{ on: settings.operatorMode }" role="switch" :aria-checked="settings.operatorMode" @click="settings.toggleOperatorMode()">
          <span class="st-knob"></span><span class="st-toggle-txt">{{ settings.operatorMode ? 'On' : 'Off' }}</span>
        </button>
      </div>
      <p class="st-hint">Off by default. When on, the Operator menu (Infrastructure, Models &amp; Pipelines, Workstation, SourceOS, Marketplace) appears in the top bar and side drawer. Most users never need this.</p>
    </section>

    <section id="connections" class="st-card">
      <h2>Connections &amp; integrations</h2>
      <div class="st-row col">
        <label class="st-label" for="mesh">Prophet Mesh endpoint <span class="st-hint-inline">(hosted Model Choir / Conductor — ST011)</span></label>
        <input id="mesh" v-model="meshUrl" type="text" :placeholder="DEFAULT_MESH_BASE" />
      </div>
      <div class="st-actions">
        <button class="st-save" @click="checkMeshConnection">{{ meshChecking ? 'Checking…' : 'Check connection' }}</button>
        <span v-if="meshStatus" class="st-mesh" :class="{ ok: meshStatus.ok }">
          <span class="st-dot" :class="{ ok: meshStatus.ok }"></span>{{ meshStatus.detail }}
        </span>
      </div>
      <p class="st-hint">When the mesh exposes the platform routes, set <code>VITE_MESH_BASE</code> to this endpoint and the whole SPA runs against the hosted cloud instance — the same build Michael and Gus use proves it works for a client on their own mesh.</p>
      <div class="st-row col" style="margin-top:.75rem;">
        <label class="st-label" for="gitea">Gitea token <span class="st-hint-inline">(for Add Local Repo / Forge import)</span></label>
        <input id="gitea" v-model="giteaToken" type="password" placeholder="gitea personal access token" />
      </div>
      <div class="st-actions">
        <button class="st-save" @click="saveConnections">Save connections</button>
        <span class="st-saved" v-if="savedNote">{{ savedNote }}</span>
      </div>
      <p class="st-hint">Stored locally in this browser for now. A live build binds connection credentials to the platform connection store (Watson Studio-style integrations).</p>
    </section>
  </section>
</template>

<style scoped>
.st { padding: 1rem 1.25rem; max-width: 780px; font-family: ui-sans-serif, system-ui; }
.st-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; opacity: .6; margin: 0; }
.st-title { font-size: 1.5rem; font-weight: 700; margin: .25rem 0 1rem; }
.st-toc { display: flex; gap: 1rem; margin-bottom: 1rem; font-size: .85rem; }
.st-toc a { color: inherit; opacity: .7; text-decoration: none; border-bottom: 1px solid transparent; }
.st-toc a:hover { opacity: 1; border-bottom-color: currentColor; }
.st-card { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: 1rem 1.1rem; margin-bottom: 1rem; }
.st-card h2 { margin: 0 0 .75rem; font-size: 1.05rem; }
.st-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .4rem 0; border-bottom: 1px solid #f1f5f9; }
.st-row:last-of-type { border-bottom: 0; }
.st-row.col { flex-direction: column; align-items: stretch; }
.st-label { font-size: .85rem; opacity: .7; }
.st-hint { font-size: .78rem; opacity: .6; margin: .6rem 0 0; }
.st-hint-inline { opacity: .5; font-weight: 400; }
.st-pill { border: 1px solid #cbd5e1; border-radius: 999px; padding: .1rem .55rem; font-size: .75rem; text-transform: uppercase; }
.st-seg { display: inline-flex; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
.st-seg button { border: 0; background: #fff; padding: .35rem .8rem; cursor: pointer; font-size: .82rem; }
.st-seg button.active { background: #0f172a; color: #fff; }
.st-toggle { display: inline-flex; align-items: center; gap: .5rem; border: 1px solid #cbd5e1; border-radius: 999px; background: #eef2f7; padding: .2rem .5rem .2rem .2rem; cursor: pointer; }
.st-toggle .st-knob { width: 18px; height: 18px; border-radius: 50%; background: #94a3b8; transition: transform .15s, background .15s; }
.st-toggle.on { background: #ecfdf5; border-color: #a7f3d0; }
.st-toggle.on .st-knob { background: #10b981; transform: translateX(4px); }
.st-toggle-txt { font-size: .8rem; }
.st-row.col input { padding: .5rem .7rem; border: 1px solid #cbd5e1; border-radius: 8px; margin-top: .35rem; }
.st-actions { display: flex; align-items: center; gap: .75rem; margin-top: .6rem; }
.st-save { padding: .4rem .9rem; border: 1px solid #10b981; background: #10b981; color: #fff; border-radius: 8px; cursor: pointer; }
.st-saved { font-size: .8rem; color: #065f46; }
.st-mesh { font-size: .8rem; display: inline-flex; align-items: center; gap: .4rem; color: #991b1b; }
.st-mesh.ok { color: #065f46; }
.st-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; }
.st-dot.ok { background: #10b981; }
</style>
