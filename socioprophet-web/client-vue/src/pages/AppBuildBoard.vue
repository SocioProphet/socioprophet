<template>
  <section class="ab2" aria-label="App development and builds">
    <header class="ab2-toolbar">
      <div class="ab2-title">
        <div>
          <p v-if="scope && !scope.isPrimary" class="ab2-eyebrow">{{ scope.domain }}</p>
          <h1>{{ scope && !scope.isPrimary ? scope.label : 'App Builds' }}</h1>
        </div>
        <span class="ab2-pill">fixture</span>
      </div>
      <div class="ab2-agg">
        <span class="ab2-agg-k">Apps</span><span class="ab2-num">{{ apps.length }}</span>
        <span class="ab2-agg-k">Building</span><span class="ab2-num">{{ buildingCount }}</span>
      </div>
    </header>

    <div class="ab2-body">
      <!-- App list -->
      <div ref="listEl" class="ab2-list" aria-label="Apps" @keydown="arrowRove($event, listEl, '.ab2-row')">
        <p class="ab2-count">{{ apps.length }} apps</p>
        <button v-for="a in apps" :key="a.id" class="ab2-row" :class="{ on: a.id === selectedId }" @click="selectedId = a.id">
          <div class="ab2-row-top">
            <span class="ab2-kind" :class="a.kind">{{ a.kind }}</span>
            <span class="ab2-status" :class="a.status">{{ a.status }}</span>
          </div>
          <div class="ab2-row-name">{{ a.name }} <span class="ab2-ver">v{{ a.version }}</span></div>
          <div v-if="a.status === 'building' || a.status === 'review'" class="ab2-prog"><div class="ab2-prog-fill" :style="{ width: a.progress + '%' }" /></div>
        </button>
      </div>

      <!-- Detail -->
      <article v-if="selected" class="ab2-detail" aria-label="App detail">
        <div class="ab2-d-head">
          <div>
            <div class="ab2-d-name">{{ selected.name }} <span class="ab2-status" :class="selected.status">{{ selected.status }}</span></div>
            <div class="ab2-d-sub">{{ selected.kind }} · v{{ selected.version }}</div>
          </div>
          <div class="ab2-artifact">
            <span class="ab2-art-k">artifact</span>
            <span class="ab2-art-f">{{ selected.artifact.format }}</span>
            <span class="ab2-art-m">{{ selected.artifact.size }} · <code>{{ selected.artifact.hash }}</code></span>
          </div>
        </div>

        <!-- Build pipeline -->
        <div class="ab2-block">
          <div class="ab2-block-h">Build pipeline</div>
          <div class="ab2-pipe">
            <div v-for="(s, i) in selected.pipeline" :key="i" class="ab2-step" :class="s.status">
              <span class="ab2-step-dot" />
              <span class="ab2-step-n">{{ s.step }}</span>
              <span class="ab2-step-s">{{ s.status }}</span>
            </div>
          </div>
        </div>

        <!-- Platform targets -->
        <div class="ab2-block">
          <div class="ab2-block-h">Platform targets</div>
          <div class="ab2-plats">
            <div v-for="(p, i) in selected.platforms" :key="i" class="ab2-plat">
              <div class="ab2-plat-os">{{ p.os }}</div>
              <div class="ab2-plat-meta">{{ p.channel }} · v{{ p.version }}</div>
              <span class="ab2-plat-s" :class="p.status">{{ p.status }}</span>
            </div>
          </div>
        </div>

        <!-- Releases -->
        <div class="ab2-block">
          <div class="ab2-block-h">Recent releases</div>
          <div v-for="(r, i) in selected.releases" :key="i" class="ab2-rel">
            <span class="ab2-rel-v">v{{ r.version }}</span>
            <span class="ab2-rel-d">{{ r.date }}</span>
            <span class="ab2-rel-n">{{ r.notes }}</span>
          </div>
        </div>

        <p class="ab2-note">{{ selected.note }}</p>
        <div class="ab2-boundary">Fixture board · no live CI or signing keys wired. A live build adapter (Forge / cross-platform packaging) swaps in behind this shape.</div>
      </article>
      <div v-else class="ab2-detail empty">Select an app</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { apps, type App } from '../data/mobileAppFixture';
import { navScopeForPath } from '../config/cockpitNav';
import { arrowRove } from '../utils/listKeys';

const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

const selectedId = ref<string>(apps[0]!.id);
const selected = computed<App | undefined>(() => apps.find((a) => a.id === selectedId.value));
const listEl = ref<HTMLElement | null>(null);
const buildingCount = apps.filter((a) => a.status === 'building').length;
</script>

<style scoped>
.ab2 { height: 100%; min-height: 0; display: grid; grid-template-rows: auto 1fr; gap: 0.75rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: var(--text); }
.ab2-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.ab2-title { display: flex; align-items: baseline; gap: 0.6rem; } .ab2-title h1 { margin: 0; font-size: 1.2rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.ab2-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.ab2-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); background: var(--accent-soft); border-radius: 5px; padding: 0.1rem 0.35rem; }
.ab2-agg { display: flex; align-items: center; gap: 0.5rem; font-size: 0.72rem; color: var(--text-3); } .ab2-agg-k { text-transform: uppercase; letter-spacing: 0.05em; } .ab2-agg .ab2-num { color: var(--text); font-variant-numeric: tabular-nums; margin-right: 0.4rem; }

.ab2-body { min-height: 0; display: grid; grid-template-columns: minmax(260px, 0.8fr) minmax(420px, 1.5fr); gap: 0.75rem; }
@media (max-width: 1080px) { .ab2-body { grid-template-columns: 1fr; } .ab2-detail { display: none; } }

.ab2-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; }
.ab2-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); border-bottom: 1px solid var(--line); }
.ab2-row { width: 100%; display: grid; gap: 0.35rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.65rem 0.85rem; cursor: pointer; text-align: left; } .ab2-row:hover { background: var(--surface-2); } .ab2-row.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.ab2-row-top { display: flex; align-items: center; gap: 0.4rem; }
.ab2-row-name { font-size: 0.9rem; font-weight: 600; } .ab2-ver { font-size: 0.72rem; color: var(--text-3); font-family: ui-monospace, monospace; }
.ab2-prog { height: 5px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden; } .ab2-prog-fill { height: 100%; background: var(--accent); border-radius: 3px; }

.ab2-kind, .ab2-status { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; }
.ab2-kind { color: #93c5fd; background: rgba(88,166,255,0.14); }
.ab2-status { margin-left: auto; } .ab2-status.published { color: var(--up); background: rgba(75,191,115,0.16); } .ab2-status.building { color: var(--accent); background: rgba(216,162,80,0.16); } .ab2-status.review { color: #93c5fd; background: rgba(88,166,255,0.14); } .ab2-status.failed { color: var(--down); background: rgba(240,101,106,0.16); }
.ab2-d-head .ab2-status { margin-left: 0; }

.ab2-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem 1.1rem; }
.ab2-detail.empty { display: grid; place-items: center; color: var(--text-3); font-size: 0.85rem; }
.ab2-d-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.ab2-d-name { font-size: 1.2rem; font-weight: 640; display: flex; align-items: center; gap: 0.5rem; } .ab2-d-sub { font-size: 0.78rem; color: var(--text-3); margin-top: 0.15rem; text-transform: capitalize; }
.ab2-artifact { text-align: right; font-size: 0.72rem; } .ab2-art-k { display: block; font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); } .ab2-art-f { color: var(--text-2); } .ab2-art-m { display: block; color: var(--text-3); } .ab2-art-m code { font-family: ui-monospace, monospace; }

.ab2-block { margin-top: 1.1rem; }
.ab2-block-h { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); margin-bottom: 0.6rem; }
.ab2-pipe { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.ab2-step { display: flex; align-items: center; gap: 0.4rem; border: 1px solid var(--line); border-radius: 8px; padding: 0.3rem 0.55rem; font-size: 0.76rem; background: var(--surface-2); }
.ab2-step-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; background: #8b949e; }
.ab2-step.done .ab2-step-dot { background: var(--up); } .ab2-step.active .ab2-step-dot { background: var(--accent); box-shadow: 0 0 0 3px rgba(216,162,80,0.2); } .ab2-step.blocked .ab2-step-dot { background: var(--down); } .ab2-step.pending .ab2-step-dot { background: #8b949e; opacity: 0.5; }
.ab2-step-s { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-3); }
.ab2-step.done .ab2-step-s { color: var(--up); } .ab2-step.active .ab2-step-s { color: var(--accent); } .ab2-step.blocked .ab2-step-s { color: var(--down); }

.ab2-plats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem; }
.ab2-plat { border: 1px solid var(--line); border-radius: 9px; padding: 0.55rem 0.65rem; background: var(--surface-2); position: relative; }
.ab2-plat-os { font-size: 0.84rem; font-weight: 600; } .ab2-plat-meta { font-size: 0.7rem; color: var(--text-3); margin-top: 0.1rem; }
.ab2-plat-s { position: absolute; top: 0.5rem; right: 0.55rem; font-size: 0.54rem; text-transform: uppercase; font-weight: 700; border-radius: 3px; padding: 0.05rem 0.3rem; } .ab2-plat-s.live { color: var(--up); background: rgba(75,191,115,0.16); } .ab2-plat-s.staged { color: var(--accent); background: rgba(216,162,80,0.16); } .ab2-plat-s.pending { color: #8b949e; background: rgba(139,148,158,0.16); } .ab2-plat-s.failed { color: var(--down); background: rgba(240,101,106,0.16); }

.ab2-rel { display: grid; grid-template-columns: auto auto 1fr; gap: 0.6rem; align-items: baseline; padding: 0.4rem 0; border-bottom: 1px solid var(--line); font-size: 0.8rem; } .ab2-rel:last-child { border-bottom: none; }
.ab2-rel-v { font-family: ui-monospace, monospace; color: var(--accent); font-weight: 600; } .ab2-rel-d { font-size: 0.72rem; color: var(--text-3); } .ab2-rel-n { color: var(--text-2); }
.ab2-note { margin: 0.9rem 0 0; font-size: 0.86rem; line-height: 1.6; color: var(--text-2); }
.ab2-boundary { font-size: 0.72rem; color: var(--text-3); padding-top: 0.7rem; line-height: 1.5; }
</style>
