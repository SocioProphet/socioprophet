<template>
  <section class="pd" aria-label="People directory">
    <header class="pd-toolbar">
      <div class="pd-title"><h1>Directory</h1><span class="pd-pill">fixture</span></div>
      <form class="pd-search" @submit.prevent>
        <span class="pd-search-ic">⌕</span>
        <input v-model="query" type="text" placeholder="Search people, orgs, roles, tags…" spellcheck="false" />
      </form>
      <div class="pd-kinds">
        <button v-for="k in kinds" :key="k" class="pd-kbtn" :class="{ on: kind === k }" @click="setKind(k)">{{ k }}</button>
      </div>
    </header>

    <div class="pd-body">
      <!-- Directory list -->
      <div ref="listEl" class="pd-list" aria-label="Results">
        <p class="pd-count">{{ results.length }} result{{ results.length === 1 ? '' : 's' }}</p>
        <button
          v-for="e in results"
          :key="e.id"
          class="pd-row"
          :class="{ on: e.id === selectedId }"
          @click="selectedId = e.id"
        >
          <span class="pd-avatar" :style="{ background: kindColor(e.kind) }">{{ initials(e.name) }}</span>
          <div class="pd-row-main">
            <div class="pd-row-name">{{ e.name }} <span class="pd-kind" :style="{ color: kindColor(e.kind) }">{{ e.kind }}</span></div>
            <div class="pd-row-sub">{{ e.role }} · {{ e.affiliation }}</div>
            <div class="pd-row-loc">{{ e.location }}</div>
          </div>
          <span class="pd-conf" :title="`resolution confidence ${(e.confidence * 100).toFixed(0)}%`">{{ (e.confidence * 100).toFixed(0) }}%</span>
        </button>
        <p v-if="results.length === 0" class="pd-empty">No matches. Clear the search or pick a different type.</p>
      </div>

      <!-- Profile -->
      <article v-if="selected" class="pd-profile" aria-label="Profile">
        <div class="pd-p-head">
          <span class="pd-avatar lg" :style="{ background: kindColor(selected.kind) }">{{ initials(selected.name) }}</span>
          <div>
            <div class="pd-p-name">{{ selected.name }}</div>
            <div class="pd-p-role">{{ selected.role }} · {{ selected.affiliation }}</div>
            <div class="pd-p-loc">{{ selected.location }}</div>
          </div>
        </div>

        <p class="pd-p-summary">{{ selected.summary }}</p>
        <div class="pd-tags"><span v-for="t in selected.tags" :key="t" class="pd-tag">{{ t }}</span></div>

        <!-- Ego graph -->
        <div class="pd-block">
          <div class="pd-block-h">Relationships</div>
          <svg class="pd-ego" viewBox="0 0 300 210" role="img" aria-label="relationship graph">
            <line v-for="(n, i) in egoNodes" :key="'e' + i" x1="150" y1="105" :x2="n.x" :y2="n.y" class="pd-edge" />
            <g v-for="(n, i) in egoNodes" :key="'n' + i" :transform="`translate(${n.x},${n.y})`" :class="{ link: n.exists }" @click="n.exists && (selectedId = n.id)">
              <circle r="15" :fill="kindColor(n.kind)" />
              <text class="pd-ego-init" y="4" text-anchor="middle">{{ initials(n.name) }}</text>
              <text class="pd-ego-lbl" y="30" text-anchor="middle">{{ n.short }}</text>
              <text class="pd-ego-rel" y="-20" text-anchor="middle">{{ n.label }}</text>
            </g>
            <g transform="translate(150,105)">
              <circle r="22" :fill="kindColor(selected.kind)" stroke="#0d1117" stroke-width="2" />
              <text class="pd-ego-init self" y="5" text-anchor="middle">{{ initials(selected.name) }}</text>
            </g>
          </svg>
        </div>

        <!-- Resolution -->
        <div class="pd-block">
          <div class="pd-block-h">Identity resolution</div>
          <div class="pd-res">
            <div class="pd-res-bar"><div class="pd-res-fill" :style="{ width: (selected.confidence * 100) + '%', background: confColor(selected.confidence) }" /></div>
            <span class="pd-res-cap">{{ (selected.confidence * 100).toFixed(0) }}% confidence · {{ selected.sources }} corroborating sources</span>
          </div>
        </div>

        <div class="pd-block">
          <div class="pd-block-h">Provenance</div>
          <div class="pd-kv"><span>Source</span><code>fixture · entity-resolution stub</code></div>
          <div class="pd-kv"><span>As of</span><code>{{ asOfLabel }}</code></div>
        </div>
      </article>
      <div v-else class="pd-profile empty">Select an entity</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { entities, asOf, type Entity, type EntityKind } from '../data/peopleFixture';

const kinds = ['All', 'person', 'org', 'gov'] as const;
const kind = ref<(typeof kinds)[number]>('All');
const query = ref('');
const selectedId = ref<string>(entities[0]!.id);
const listEl = ref<HTMLElement | null>(null);

const byId = new Map(entities.map((e) => [e.id, e]));
const results = computed<Entity[]>(() => {
  const q = query.value.trim().toLowerCase();
  return entities.filter((e) => {
    if (kind.value !== 'All' && e.kind !== kind.value) return false;
    if (!q) return true;
    return [e.name, e.role, e.affiliation, e.location, ...e.tags].some((f) => f.toLowerCase().includes(q));
  });
});
const selected = computed<Entity | undefined>(() => byId.get(selectedId.value));
function setKind(k: (typeof kinds)[number]) { kind.value = k; if (!results.value.some((r) => r.id === selectedId.value) && results.value[0]) selectedId.value = results.value[0].id; }
watch(query, () => { if (!results.value.some((r) => r.id === selectedId.value) && results.value[0]) selectedId.value = results.value[0].id; });

const KIND_COLORS: Record<EntityKind, string> = { person: '#58a6ff', org: '#c58af9', gov: '#e3b341', place: '#3fb950' };
const kindColor = (k: EntityKind) => KIND_COLORS[k];
const confColor = (c: number) => (c >= 0.9 ? '#3fb950' : c >= 0.8 ? '#e3b341' : '#f85149');
function initials(name: string): string { return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join(''); }

// Ego graph: relations of the selected entity placed on a ring around it.
const egoNodes = computed(() => {
  const rels = selected.value?.relations ?? [];
  const cx = 150, cy = 105, r = 78;
  return rels.map((rel, i) => {
    const ang = (i / Math.max(1, rels.length)) * Math.PI * 2 - Math.PI / 2;
    const target = byId.get(rel.to);
    const name = target?.name ?? rel.to;
    return {
      id: rel.to,
      exists: !!target,
      kind: (target?.kind ?? 'org') as EntityKind,
      name,
      short: name.length > 14 ? name.slice(0, 13) + '…' : name,
      label: rel.label,
      x: cx + Math.cos(ang) * r,
      y: cy + Math.sin(ang) * r * 0.86,
    };
  });
});

const asOfLabel = new Date(asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
</script>

<style scoped>
.pd { height: 100%; min-height: 0; display: grid; grid-template-rows: auto 1fr; gap: 0.75rem; padding: 0.85rem 1rem 1rem; background: #05070a; color: rgba(255, 255, 255, 0.9); }
.pd-toolbar { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.pd-title { display: flex; align-items: baseline; gap: 0.6rem; } .pd-title h1 { margin: 0; font-size: 1rem; letter-spacing: 0.06em; color: #ffa028; font-weight: 700; font-family: 'Roboto Mono', ui-monospace, monospace; text-transform: uppercase; }
.pd-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: #e3b341; background: rgba(227, 179, 65, 0.14); border-radius: 5px; padding: 0.1rem 0.35rem; }
.pd-search { flex: 1 1 260px; display: flex; align-items: center; gap: 0.5rem; border: 1px solid #21262d; border-radius: 10px; background: #010409; padding: 0.4rem 0.7rem; } .pd-search:focus-within { border-color: #ffa028; } .pd-search-ic { color: rgba(255, 255, 255, 0.4); }
.pd-search input { flex: 1; min-width: 0; background: transparent; border: none; outline: none; color: #fff; font-size: 0.9rem; }
.pd-kinds { display: flex; gap: 0.25rem; }
.pd-kbtn { border: 1px solid #21262d; background: transparent; color: rgba(255, 255, 255, 0.6); border-radius: 8px; padding: 0.3rem 0.6rem; font-size: 0.75rem; text-transform: capitalize; cursor: pointer; } .pd-kbtn.on { border-color: #ffa028; color: #ffa028; background: rgba(255, 160, 40, 0.12); }

.pd-body { min-height: 0; display: grid; grid-template-columns: minmax(360px, 1.1fr) minmax(340px, 1fr); gap: 0.75rem; }
@media (max-width: 1080px) { .pd-body { grid-template-columns: 1fr; } .pd-profile { display: none; } }

.pd-list { min-height: 0; overflow-y: auto; border: 1px solid #21262d; border-radius: 12px; }
.pd-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255, 255, 255, 0.4); border-bottom: 1px solid #161b22; }
.pd-row { width: 100%; display: flex; align-items: center; gap: 0.7rem; border: none; border-bottom: 1px solid #161b22; background: transparent; color: inherit; padding: 0.6rem 0.85rem; cursor: pointer; text-align: left; } .pd-row:hover { background: rgba(255, 255, 255, 0.03); } .pd-row.on { background: rgba(255, 160, 40, 0.1); box-shadow: inset 3px 0 0 #ffa028; }
.pd-avatar { flex: 0 0 auto; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-size: 0.72rem; font-weight: 800; color: #04121f; } .pd-avatar.lg { width: 52px; height: 52px; font-size: 1rem; }
.pd-row-main { min-width: 0; flex: 1; }
.pd-row-name { font-size: 0.86rem; font-weight: 600; } .pd-kind { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; margin-left: 0.35rem; }
.pd-row-sub { font-size: 0.74rem; color: rgba(255, 255, 255, 0.6); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .pd-row-loc { font-size: 0.68rem; color: rgba(255, 255, 255, 0.4); }
.pd-conf { font-size: 0.72rem; font-variant-numeric: tabular-nums; color: rgba(255, 255, 255, 0.5); }
.pd-empty { padding: 1.5rem; color: rgba(255, 255, 255, 0.45); font-size: 0.85rem; }

.pd-profile { min-height: 0; overflow-y: auto; border: 1px solid #21262d; border-radius: 12px; padding: 1.1rem 1.2rem; }
.pd-profile.empty { display: grid; place-items: center; color: rgba(255, 255, 255, 0.35); font-size: 0.85rem; }
.pd-p-head { display: flex; align-items: center; gap: 0.9rem; }
.pd-p-name { font-size: 1.25rem; font-weight: 700; } .pd-p-role { font-size: 0.85rem; color: rgba(255, 255, 255, 0.65); margin-top: 0.15rem; } .pd-p-loc { font-size: 0.75rem; color: rgba(255, 255, 255, 0.45); }
.pd-p-summary { margin: 0.9rem 0 0.6rem; font-size: 0.9rem; line-height: 1.6; color: rgba(255, 255, 255, 0.82); }
.pd-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.pd-tag { font-size: 0.72rem; color: rgba(255, 255, 255, 0.75); background: rgba(255, 255, 255, 0.06); border: 1px solid #21262d; border-radius: 6px; padding: 0.12rem 0.45rem; }
.pd-block { margin-top: 0.9rem; border-top: 1px solid #21262d; padding-top: 0.8rem; }
.pd-block-h { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); margin-bottom: 0.5rem; }
.pd-ego { width: 100%; height: 210px; }
.pd-edge { stroke: rgba(255, 255, 255, 0.14); stroke-width: 1; }
.pd-ego .link { cursor: pointer; } .pd-ego .link:hover circle { stroke: #fff; stroke-width: 2; }
.pd-ego circle { stroke: #0d1117; stroke-width: 1.5; }
.pd-ego-init { fill: #04121f; font-size: 9px; font-weight: 800; } .pd-ego-init.self { fill: #04121f; font-size: 11px; }
.pd-ego-lbl { fill: rgba(255, 255, 255, 0.7); font-size: 8px; } .pd-ego-rel { fill: rgba(255, 255, 255, 0.4); font-size: 7px; text-transform: uppercase; letter-spacing: 0.04em; }
.pd-res { display: grid; gap: 0.4rem; } .pd-res-bar { height: 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.08); overflow: hidden; } .pd-res-fill { height: 100%; border-radius: 4px; } .pd-res-cap { font-size: 0.74rem; color: rgba(255, 255, 255, 0.55); }
.pd-kv { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; font-size: 0.8rem; padding: 0.2rem 0; } .pd-kv span { color: rgba(255, 255, 255, 0.45); } .pd-kv code { color: rgba(255, 255, 255, 0.7); font-family: ui-monospace, monospace; font-size: 0.72rem; }
</style>
