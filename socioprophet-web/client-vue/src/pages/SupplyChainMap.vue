<template>
  <section class="sc" aria-label="Supply chain">
    <header class="sc-toolbar">
      <div class="sc-title">
        <div>
          <p class="sc-eyebrow">{{ scope?.domain ?? 'Maps & Analytics' }}</p>
          <h1>{{ scope?.label ?? 'Supply Chain' }}</h1>
        </div>
        <span class="sc-pill">fixture</span>
      </div>
      <div class="sc-chaintabs">
        <button v-for="c in chains" :key="c.id" class="sc-chain" :class="{ on: c.id === chainId }" @click="setChain(c.id)">{{ c.name }}</button>
      </div>
    </header>

    <p class="sc-note">{{ chain?.note }}</p>

    <!-- Chain flow -->
    <div ref="flowEl" class="sc-flow" aria-label="Chain flow" @keydown="arrowRove($event, flowEl, '.sc-node', 'h')">
      <template v-for="(n, i) in flow" :key="n.id">
        <button class="sc-node" :class="[n.status, { on: n.id === selectedId }]" @click="selectedId = n.id">
          <span class="sc-node-ic" :class="n.type">{{ icon(n) }}</span>
          <span class="sc-node-b">
            <span class="sc-node-name">{{ n.name }}</span>
            <span class="sc-node-t">{{ n.facility ?? n.type }}</span>
          </span>
          <span v-if="n.status !== 'nominal'" class="sc-node-s" :class="n.status" />
        </button>
        <span v-if="i < flow.length - 1" class="sc-edge">{{ edgeKind(flow[i]!.id, flow[i + 1]!.id) }} →</span>
      </template>
    </div>

    <!-- Node detail -->
    <article v-if="selected" class="sc-detail" aria-label="Node detail">
      <div class="sc-d-head">
        <div>
          <div class="sc-d-name">{{ selected.name }} <span class="sc-badge" :class="selected.status">{{ selected.status }}</span></div>
          <div class="sc-d-sub">{{ selected.facility ?? selected.type }}<span v-if="selected.geo"> · {{ selected.geo.place }}, {{ selected.geo.country }}</span></div>
        </div>
        <code class="sc-gid">{{ selected.graphId }}</code>
      </div>
      <p class="sc-d-note">{{ selected.note }}</p>

      <!-- First-class model links -->
      <div class="sc-links">
        <button class="sc-link graph" @click="openGraph(selected)"><span class="sc-link-ic">◉</span> Open in Graph</button>
        <button v-if="selected.geo" class="sc-link map" @click="openMap(selected)"><span class="sc-link-ic">⌖</span> Show on Map</button>
        <button v-if="selected.twinRef" class="sc-link twin" @click="openTwin(selected)"><span class="sc-link-ic">◇</span> Digital Twin</button>
      </div>

      <!-- Cross-domain references -->
      <div class="sc-refs">
        <div v-if="relMarkets.length" class="sc-ref">
          <span class="sc-ref-k">Markets</span>
          <button v-for="m in relMarkets" :key="m.symbol" class="sc-chip" @click="openMarket(m.symbol)">{{ m.symbol }} · {{ m.name }}</button>
        </div>
        <div v-if="relEcon.length" class="sc-ref">
          <span class="sc-ref-k">Economy</span>
          <button v-for="e in relEcon" :key="e.id" class="sc-chip" @click="openEcon(e)">{{ e.name }}</button>
        </div>
        <div v-if="relNews.length" class="sc-ref">
          <span class="sc-ref-k">News</span>
          <button v-for="a in relNews" :key="a.id" class="sc-chip" @click="openNews(a.id)">{{ a.title }}</button>
        </div>
        <div v-if="relWeather.length" class="sc-ref">
          <span class="sc-ref-k">Weather</span>
          <button v-for="w in relWeather" :key="w.id" class="sc-chip" @click="openWeather(w.id)">{{ w.name }}</button>
        </div>
      </div>
      <div class="sc-boundary">Nodes carry a HellGraph ref + geo + twin handle — a live graph / GAIA / economic-prophet adapter resolves the same identities.</div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { navScopeForPath } from '../config/cockpitNav';
import { chains, nodesForChain, edgesForChain, nodeById, type SCNode, type Chain } from '../data/supplyChainFixture';
import { instruments } from '../data/marketsFixture';
import { sectors, indicators, SUBDOMAIN_GROUP, type EcoGroup } from '../data/economyFixture';
import { regions } from '../data/weatherFixture';
import { newsItems } from '../data/newsFeedFixture';
import { arrowRove } from '../utils/listKeys';

const router = useRouter();
const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

const chainId = ref<string>('copper');
const chain = computed<Chain | undefined>(() => chains.find((c) => c.id === chainId.value));
const flowEl = ref<HTMLElement | null>(null);

// Linear flow order: start at the node with no incoming edge, follow edges.
const flow = computed<SCNode[]>(() => {
  const ns = nodesForChain(chainId.value);
  const es = edgesForChain(chainId.value);
  const incoming = new Map(ns.map((n) => [n.id, 0]));
  es.forEach((e) => incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1));
  const order: SCNode[] = [];
  const seen = new Set<string>();
  let cur: SCNode | undefined = ns.find((n) => incoming.get(n.id) === 0) ?? ns[0];
  while (cur && !seen.has(cur.id)) { order.push(cur); seen.add(cur.id); const e = es.find((x) => x.from === cur!.id); cur = e ? nodeById(e.to) : undefined; }
  ns.forEach((n) => { if (!seen.has(n.id)) order.push(n); });
  return order;
});
function edgeKind(from: string, to: string): string { return edgesForChain(chainId.value).find((e) => e.from === from && e.to === to)?.kind ?? ''; }

const selectedId = ref<string>(flow.value[0]?.id ?? '');
const selected = computed<SCNode | undefined>(() => nodeById(selectedId.value));
watch(chainId, () => { selectedId.value = flow.value[0]?.id ?? ''; });
function setChain(id: string) { chainId.value = id; }
onMounted(() => {
  const c = typeof route.query.chain === 'string' ? route.query.chain : '';
  if (c && chains.some((x) => x.id === c)) chainId.value = c;
  const node = typeof route.query.node === 'string' ? route.query.node : '';
  if (node && nodeById(node)) { chainId.value = nodeById(node)!.chain; selectedId.value = node; }
});

// Cross-domain resolution for the selected node.
const relMarkets = computed(() => (selected.value?.marketSymbols ?? []).map((s) => instruments.find((i) => i.symbol === s)).filter((x): x is NonNullable<typeof x> => !!x));
const relEcon = computed(() => {
  const s = selected.value; if (!s) return [] as Array<{ id: string; name: string; kind: 'sector' | 'indicator'; group?: EcoGroup }>;
  const secs = (s.economySectors ?? []).map((id) => sectors.find((x) => x.id === id)).filter(Boolean).map((x) => ({ id: x!.id, name: x!.name, kind: 'sector' as const }));
  const inds = (s.economyIndicators ?? []).map((id) => indicators.find((x) => x.id === id)).filter(Boolean).map((x) => ({ id: x!.id, name: x!.name, kind: 'indicator' as const, group: x!.group }));
  return [...secs, ...inds];
});
const relWeather = computed(() => (selected.value?.weatherRegions ?? []).map((id) => regions.find((r) => r.id === id)).filter((x): x is NonNullable<typeof x> => !!x));
const relNews = computed(() => {
  const kws = selected.value?.newsKeywords ?? []; if (!kws.length) return [];
  return newsItems.filter((n) => kws.some((k) => n.title.toLowerCase().includes(k) || n.entities.some((e) => e.toLowerCase().includes(k)))).slice(0, 4);
});

// Reverse economy group → sub-domain path.
const GROUP_PATH = Object.fromEntries(Object.entries(SUBDOMAIN_GROUP).map(([p, g]) => [g, p])) as Record<EcoGroup, string>;

function icon(n: SCNode): string {
  if (n.type === 'commodity') return '◆';
  if (n.type === 'company') return '▤';
  if (n.type === 'port') return '⚓';
  if (n.type === 'route') return '➔';
  if (n.facility === 'mine') return '⛏';
  if (n.facility === 'fab') return '▩';
  return '⚙';
}
function openGraph(n: SCNode) { router.push({ path: '/knowledge/graph', query: { root: n.graphId } }); }
function openMap(n: SCNode) { if (n.geo) router.push({ path: '/map', query: { focus: `${n.geo.lat},${n.geo.lon}` } }); }
function openTwin(n: SCNode) { router.push({ path: '/capability/economic-prophet', query: { twin: n.twinRef ?? '' } }); }
function openMarket(sym: string) { router.push({ path: '/markets/indices-funds', query: { sym } }); }
function openEcon(e: { id: string; kind: 'sector' | 'indicator'; group?: EcoGroup }) {
  const path = e.kind === 'indicator' && e.group ? (GROUP_PATH[e.group] ?? '/economy/macro-economics') : '/economy/macro-economics';
  router.push({ path, query: { k: e.id, kind: e.kind } });
}
function openNews(id: string) { router.push({ path: '/news', query: { item: id } }); }
function openWeather(id: string) { router.push({ path: '/weather/forecast', query: { r: id } }); }
</script>

<style scoped>
.sc { height: 100%; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 0.7rem; padding: 0.85rem 1rem 1.5rem; background: var(--bg); color: var(--text); }
.sc-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.sc-title { display: flex; align-items: baseline; gap: 0.6rem; } .sc-title h1 { margin: 0; font-size: 1.3rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.sc-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.sc-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); background: var(--accent-soft); border-radius: 5px; padding: 0.1rem 0.35rem; }
.sc-chaintabs { display: flex; gap: 0.3rem; }
.sc-chain { border: 1px solid var(--line-2); background: transparent; color: var(--text-2); border-radius: 8px; padding: 0.3rem 0.7rem; font-size: 0.78rem; cursor: pointer; } .sc-chain.on { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
.sc-note { margin: 0; font-size: 0.82rem; color: var(--text-3); max-width: 70ch; }

.sc-flow { display: flex; align-items: center; gap: 0.5rem; overflow-x: auto; padding: 0.6rem 0.1rem; }
.sc-node { flex: 0 0 auto; display: flex; align-items: center; gap: 0.55rem; border: 1px solid var(--line-2); border-radius: 12px; background: var(--surface); color: inherit; padding: 0.55rem 0.7rem; cursor: pointer; text-align: left; min-width: 12rem; position: relative; }
.sc-node:hover { border-color: var(--line-2); background: var(--surface-2); } .sc-node.on { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.sc-node.watch { border-left: 3px solid var(--accent); } .sc-node.disrupted { border-left: 3px solid var(--down); }
.sc-node-ic { flex: 0 0 auto; width: 1.9rem; height: 1.9rem; display: grid; place-items: center; border-radius: 8px; background: rgba(255,255,255,0.05); font-size: 0.95rem; color: var(--text-2); }
.sc-node-ic.commodity { color: var(--accent); } .sc-node-ic.company { color: #58a6ff; } .sc-node-ic.port { color: #4aa3ff; } .sc-node-ic.route { color: var(--text-3); }
.sc-node-b { display: grid; min-width: 0; } .sc-node-name { font-size: 0.84rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .sc-node-t { font-size: 0.66rem; color: var(--text-3); text-transform: capitalize; }
.sc-node-s { position: absolute; top: 0.5rem; right: 0.5rem; width: 7px; height: 7px; border-radius: 50%; } .sc-node-s.watch { background: var(--accent); } .sc-node-s.disrupted { background: var(--down); }
.sc-edge { flex: 0 0 auto; font-size: 0.64rem; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }

.sc-detail { border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem 1.1rem; background: var(--surface); }
.sc-d-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.sc-d-name { font-size: 1.15rem; font-weight: 640; display: flex; align-items: center; gap: 0.5rem; } .sc-d-sub { font-size: 0.78rem; color: var(--text-3); margin-top: 0.15rem; text-transform: capitalize; }
.sc-badge { font-size: 0.56rem; text-transform: uppercase; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; } .sc-badge.nominal { color: var(--up); background: rgba(75,191,115,0.15); } .sc-badge.watch { color: var(--accent); background: rgba(216,162,80,0.16); } .sc-badge.disrupted { color: var(--down); background: rgba(240,101,106,0.16); }
.sc-gid { font-size: 0.68rem; color: var(--text-3); font-family: ui-monospace, monospace; }
.sc-d-note { margin: 0.7rem 0 0; font-size: 0.86rem; line-height: 1.6; color: var(--text-2); }

.sc-links { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.9rem; }
.sc-link { display: inline-flex; align-items: center; gap: 0.4rem; border: 1px solid var(--line-2); background: var(--surface-2); color: var(--text); border-radius: 9px; padding: 0.4rem 0.75rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; } .sc-link:hover { border-color: var(--accent); }
.sc-link-ic { font-size: 0.9rem; } .sc-link.graph .sc-link-ic { color: #58a6ff; } .sc-link.map .sc-link-ic { color: var(--up); } .sc-link.twin .sc-link-ic { color: var(--accent); }

.sc-refs { display: grid; gap: 0.5rem; margin-top: 1rem; padding-top: 0.9rem; border-top: 1px solid var(--line); }
.sc-ref { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.4rem; }
.sc-ref-k { flex: 0 0 4.5rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }
.sc-chip { border: 1px solid var(--line-2); background: transparent; color: var(--text-2); border-radius: 6px; padding: 0.2rem 0.5rem; font-size: 0.74rem; cursor: pointer; max-width: 34ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .sc-chip:hover { border-color: var(--accent); color: var(--accent); }
.sc-boundary { font-size: 0.72rem; color: var(--text-3); padding-top: 0.9rem; margin-top: 0.9rem; border-top: 1px solid var(--line); line-height: 1.5; }
</style>
