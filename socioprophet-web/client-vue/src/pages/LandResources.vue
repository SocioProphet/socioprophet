<template>
  <section class="lr" aria-label="Land and natural resources">
    <header class="lr-toolbar">
      <div class="lr-title">
        <div>
          <p class="lr-eyebrow">{{ scope?.domain ?? 'Weather & Natural Resources' }}</p>
          <h1>{{ scope?.label ?? 'Land & Resources' }}</h1>
        </div>
        <span class="lr-pill">Layer 0 · fixture</span>
      </div>
      <div class="lr-kinds">
        <button class="lr-kbtn" :class="{ on: kind === 'all' }" @click="kind = 'all'">all</button>
        <button v-for="k in kinds" :key="k" class="lr-kbtn" :class="{ on: kind === k }" @click="kind = k">{{ k }}</button>
      </div>
    </header>
    <p class="lr-note">The base layer of the economy: land, minerals, water, energy, forests, and fisheries — with reserves, renewability, and tenure. Everything upstream (extraction → commodities → markets → trade) is built on these.</p>

    <div class="lr-body">
      <!-- Endowment list -->
      <div ref="listEl" class="lr-list" aria-label="Endowments" @keydown="arrowRove($event, listEl, '.lr-row')">
        <p class="lr-count">{{ results.length }} endowment{{ results.length === 1 ? '' : 's' }}</p>
        <button v-for="e in results" :key="e.id" class="lr-row" :class="{ on: e.id === selectedId }" @click="selectedId = e.id">
          <span class="lr-ic" :class="e.kind">{{ icon(e.kind) }}</span>
          <div class="lr-row-b">
            <div class="lr-row-name">{{ e.name }}</div>
            <div class="lr-row-sub">{{ e.subtype }} · {{ e.geo.country }}</div>
          </div>
          <span class="lr-ren" :class="e.renewability" :title="e.renewability">{{ renGlyph(e.renewability) }}</span>
        </button>
      </div>

      <!-- Detail -->
      <article v-if="selected" class="lr-detail" aria-label="Endowment detail">
        <div class="lr-d-head">
          <div>
            <div class="lr-d-name">{{ selected.name }} <span class="lr-badge" :class="selected.status">{{ selected.status }}</span></div>
            <div class="lr-d-sub">{{ selected.kind }} · {{ selected.subtype }} · {{ selected.geo.place }}, {{ selected.geo.country }}</div>
          </div>
          <code class="lr-gid">{{ selected.graphId }}</code>
        </div>

        <!-- Endowment stats -->
        <div class="lr-stats">
          <div class="lr-stat"><span>Reserves</span><strong>{{ selected.reserves.toLocaleString() }} <small>{{ selected.reservesUnit }}</small></strong></div>
          <div v-if="selected.flow !== undefined" class="lr-stat"><span>Flow</span><strong>{{ selected.flow.toLocaleString() }} <small>{{ selected.flowUnit }}</small></strong></div>
          <div v-if="selected.grade" class="lr-stat"><span>Grade</span><strong>{{ selected.grade }}</strong></div>
          <div class="lr-stat"><span>Renewability</span><strong :class="renClass(selected.renewability)">{{ selected.renewability }}</strong></div>
          <div v-if="selected.depletionYears" class="lr-stat"><span>Depletion</span><strong :class="selected.depletionYears < 20 ? 'down' : ''">~{{ selected.depletionYears }} yr</strong></div>
          <div class="lr-stat"><span>Tenure</span><strong class="lr-tenure" :class="selected.tenure">{{ selected.tenure }}</strong></div>
        </div>

        <p class="lr-d-note">{{ selected.note }}</p>

        <!-- Value chain up -->
        <div class="lr-block">
          <div class="lr-block-h">Value chain up</div>
          <div class="lr-vc">
            <span class="lr-vc-node base">{{ selected.name }}</span>
            <template v-if="feeds.length">
              <span class="lr-vc-arr">→</span>
              <button v-for="n in feeds" :key="n.id" class="lr-vc-node link" @click="openChain(n.id)">{{ n.name }}</button>
            </template>
            <template v-if="commodity">
              <span class="lr-vc-arr">→</span>
              <button class="lr-vc-node link" @click="openMarket(commodity!.symbol)">{{ commodity!.symbol }} market</button>
            </template>
            <span v-if="!feeds.length && !commodity" class="lr-vc-pending">extraction chain not yet modeled</span>
          </div>
        </div>

        <!-- Model links -->
        <div class="lr-links">
          <button class="lr-link graph" @click="openGraph(selected)"><span class="lr-link-ic">◉</span> Open in Graph</button>
          <button class="lr-link map" @click="openMap(selected)"><span class="lr-link-ic">⌖</span> Show on Map</button>
          <button v-if="selected.twinRef" class="lr-link twin" @click="openTwin(selected)"><span class="lr-link-ic">◇</span> Digital Twin</button>
        </div>

        <div v-if="relEcon.length" class="lr-refs">
          <span class="lr-ref-k">Economy</span>
          <button v-for="e in relEcon" :key="e.id" class="lr-chip" @click="openEcon(e)">{{ e.name }}</button>
        </div>

        <!-- Cross-cutting human spine (capital / labor / supply) -->
        <HumanNetworks :entity-id="selectedId" />

        <div class="lr-boundary">Endowments carry a HellGraph ref + geo + twin handle — live land-registry / GAIA / economic-prophet adapters resolve the same identities.</div>
      </article>
      <div v-else class="lr-detail empty">Select an endowment</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { navScopeForPath } from '../config/cockpitNav';
import HumanNetworks from '../components/HumanNetworks.vue';
import { endowments, endowmentById, kinds, type Endowment, type ResourceKind, type Renewability } from '../data/landResourceFixture';
import { nodeById } from '../data/supplyChainFixture';
import { instruments } from '../data/marketsFixture';
import { indicators, SUBDOMAIN_GROUP, type EcoGroup } from '../data/economyFixture';
import { arrowRove } from '../utils/listKeys';

const router = useRouter();
const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

const kind = ref<'all' | ResourceKind>('all');
const results = computed<Endowment[]>(() => (kind.value === 'all' ? endowments : endowments.filter((e) => e.kind === kind.value)));
const selectedId = ref<string>(endowments[0]!.id);
const selected = computed<Endowment | undefined>(() => endowmentById(selectedId.value));
const listEl = ref<HTMLElement | null>(null);
watch(results, (r) => { if (!r.some((e) => e.id === selectedId.value) && r[0]) selectedId.value = r[0].id; });
onMounted(() => {
  const e = typeof route.query.e === 'string' ? route.query.e : '';
  if (e && endowmentById(e)) { selectedId.value = e; kind.value = 'all'; }
});

const feeds = computed(() => (selected.value?.feedsNodes ?? []).map((id) => nodeById(id)).filter((x): x is NonNullable<typeof x> => !!x));
const commodity = computed(() => {
  const c = selected.value?.commodity; if (!c) return undefined;
  const n = nodeById(c); const sym = n?.marketSymbols?.[0] ?? (c === 'copper' ? 'COPPER' : c === 'silicon' ? 'SILVER' : '');
  return sym ? { symbol: sym } : undefined;
});
const relEcon = computed(() => (selected.value?.economyIndicators ?? []).map((id) => indicators.find((x) => x.id === id)).filter(Boolean).map((x) => ({ id: x!.id, name: x!.name, group: x!.group })));

const GROUP_PATH = Object.fromEntries(Object.entries(SUBDOMAIN_GROUP).map(([p, g]) => [g, p])) as Record<EcoGroup, string>;
function icon(k: ResourceKind): string {
  return { land: '▦', soil: '▤', mineral: '◆', water: '≋', energy: '⚡', forest: '♣', fishery: '⋔' }[k] ?? '◇';
}
function renGlyph(r: Renewability): string { return r === 'renewable' ? '♻' : r === 'depleting' ? '▼' : '◔'; }
function renClass(r: Renewability): string { return r === 'renewable' ? 'up' : r === 'depleting' ? 'down' : ''; }

function openChain(id: string) { router.push({ path: '/analytics/supply-chain', query: { node: id } }); }
function openMarket(sym: string) { router.push({ path: '/markets/indices-funds', query: { sym } }); }
function openGraph(e: Endowment) { router.push({ path: '/knowledge/graph', query: { root: e.graphId } }); }
function openMap(e: Endowment) { router.push({ path: '/map', query: { focus: `${e.geo.lat},${e.geo.lon}` } }); }
function openTwin(e: Endowment) { router.push({ path: '/capability/economic-prophet', query: { twin: e.twinRef ?? '' } }); }
function openEcon(e: { id: string; group?: EcoGroup }) { router.push({ path: e.group ? (GROUP_PATH[e.group] ?? '/economy/macro-economics') : '/economy/macro-economics', query: { k: e.id, kind: 'indicator' } }); }
</script>

<style scoped>
.lr { height: 100%; min-height: 0; display: grid; grid-template-rows: auto auto 1fr; gap: 0.6rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: var(--text); }
.lr-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.lr-title { display: flex; align-items: baseline; gap: 0.6rem; } .lr-title h1 { margin: 0; font-size: 1.3rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.lr-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.lr-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); background: var(--accent-soft); border-radius: 5px; padding: 0.1rem 0.4rem; }
.lr-kinds { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.lr-kbtn { border: 1px solid var(--line-2); background: transparent; color: var(--text-2); border-radius: 8px; padding: 0.25rem 0.55rem; font-size: 0.72rem; text-transform: capitalize; cursor: pointer; } .lr-kbtn.on { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
.lr-note { margin: 0; font-size: 0.8rem; color: var(--text-3); max-width: 90ch; }

.lr-body { min-height: 0; display: grid; grid-template-columns: minmax(280px, 0.85fr) minmax(400px, 1.5fr); gap: 0.75rem; }
@media (max-width: 1080px) { .lr-body { grid-template-columns: 1fr; } .lr-detail { display: none; } }

.lr-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; }
.lr-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); border-bottom: 1px solid var(--line); }
.lr-row { width: 100%; display: flex; align-items: center; gap: 0.6rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.6rem 0.85rem; cursor: pointer; text-align: left; } .lr-row:hover { background: var(--surface-2); } .lr-row.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.lr-ic { flex: 0 0 auto; width: 1.9rem; height: 1.9rem; display: grid; place-items: center; border-radius: 8px; background: rgba(255,255,255,0.05); font-size: 0.95rem; }
.lr-ic.mineral { color: var(--accent); } .lr-ic.water { color: #4aa3ff; } .lr-ic.energy { color: #f0883e; } .lr-ic.forest { color: var(--up); } .lr-ic.soil, .lr-ic.land { color: #c9a227; } .lr-ic.fishery { color: #58a6ff; }
.lr-row-b { flex: 1; min-width: 0; } .lr-row-name { font-size: 0.86rem; font-weight: 600; } .lr-row-sub { font-size: 0.72rem; color: var(--text-3); }
.lr-ren { flex: 0 0 auto; font-size: 0.9rem; } .lr-ren.renewable { color: var(--up); } .lr-ren.depleting { color: var(--down); } .lr-ren.finite { color: var(--text-3); }

.lr-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem 1.1rem; }
.lr-detail.empty { display: grid; place-items: center; color: var(--text-3); font-size: 0.85rem; }
.lr-d-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.lr-d-name { font-size: 1.15rem; font-weight: 640; display: flex; align-items: center; gap: 0.5rem; } .lr-d-sub { font-size: 0.76rem; color: var(--text-3); margin-top: 0.15rem; text-transform: capitalize; }
.lr-badge { font-size: 0.56rem; text-transform: uppercase; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; } .lr-badge.nominal { color: var(--up); background: rgba(75,191,115,0.15); } .lr-badge.stressed { color: var(--accent); background: rgba(216,162,80,0.16); } .lr-badge.depleting { color: var(--down); background: rgba(240,101,106,0.16); } .lr-badge.contested { color: #f0883e; background: rgba(240,136,62,0.16); }
.lr-gid { font-size: 0.68rem; color: var(--text-3); font-family: ui-monospace, monospace; }

.lr-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; margin-top: 0.9rem; }
.lr-stat { border: 1px solid var(--line); border-radius: 9px; padding: 0.45rem 0.6rem; background: var(--surface-2); } .lr-stat span { display: block; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); } .lr-stat strong { font-size: 0.98rem; font-variant-numeric: tabular-nums; } .lr-stat strong small { font-size: 0.66rem; color: var(--text-3); font-weight: 500; } .lr-stat strong.up { color: var(--up); text-transform: capitalize; } .lr-stat strong.down { color: var(--down); }
.lr-tenure { text-transform: capitalize; } .lr-tenure.sovereign { color: #58a6ff; } .lr-tenure.contested { color: var(--down); } .lr-tenure.commons { color: var(--up); } .lr-tenure.concession { color: var(--accent); }
.lr-d-note { margin: 0.9rem 0 0; font-size: 0.86rem; line-height: 1.6; color: var(--text-2); }

.lr-block { margin-top: 1rem; }
.lr-block-h { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); margin-bottom: 0.5rem; }
.lr-vc { display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem; }
.lr-vc-node { font-size: 0.78rem; border-radius: 7px; padding: 0.3rem 0.55rem; } .lr-vc-node.base { background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-soft); } .lr-vc-node.link { border: 1px solid var(--line-2); background: var(--surface-2); color: var(--text-2); cursor: pointer; } .lr-vc-node.link:hover { border-color: var(--accent); color: var(--accent); }
.lr-vc-arr { color: var(--text-3); } .lr-vc-pending { font-size: 0.76rem; color: var(--text-3); font-style: italic; }

.lr-links { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
.lr-link { display: inline-flex; align-items: center; gap: 0.4rem; border: 1px solid var(--line-2); background: var(--surface-2); color: var(--text); border-radius: 9px; padding: 0.4rem 0.75rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; } .lr-link:hover { border-color: var(--accent); }
.lr-link-ic { font-size: 0.9rem; } .lr-link.graph .lr-link-ic { color: #58a6ff; } .lr-link.map .lr-link-ic { color: var(--up); } .lr-link.twin .lr-link-ic { color: var(--accent); }

.lr-refs { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.4rem; margin-top: 1rem; padding-top: 0.9rem; border-top: 1px solid var(--line); }
.lr-ref-k { flex: 0 0 4.5rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }
.lr-chip { border: 1px solid var(--line-2); background: transparent; color: var(--text-2); border-radius: 6px; padding: 0.2rem 0.5rem; font-size: 0.74rem; cursor: pointer; } .lr-chip:hover { border-color: var(--accent); color: var(--accent); }
.lr-boundary { font-size: 0.72rem; color: var(--text-3); padding-top: 0.9rem; margin-top: 0.9rem; border-top: 1px solid var(--line); line-height: 1.5; }
</style>
