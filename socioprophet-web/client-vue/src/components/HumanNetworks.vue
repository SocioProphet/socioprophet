<template>
  <div v-if="nets.length" class="hn">
    <div class="hn-h">Human · <span class="hn-roles"><span v-if="has('capital')" class="hn-role capital">capital</span><span v-if="has('labor')" class="hn-role labor">labor</span><span v-if="has('supply')" class="hn-role supply">supply</span></span></div>
    <div class="hn-list">
      <button v-for="n in nets" :key="n.id" class="hn-net" @click="open(n)">
        <span class="hn-badge" :class="n.role">{{ n.role }}</span>
        <span class="hn-net-b">
          <span class="hn-net-name">{{ n.name }}</span>
          <span class="hn-net-sub">{{ n.kind }} · {{ fmt(n.headcount) }} people<span v-if="n.organizedPct !== undefined"> · {{ n.organizedPct }}% organized</span></span>
        </span>
        <span v-if="n.peopleRefs.length" class="hn-open">◉ People →</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { networksForEntity, type HumanNetwork, type NetworkRole } from '../data/laborFixture';

// The human spine attaches to an entity at ANY layer (endowment / supply-chain
// node / market symbol / sector). Renders nothing when nothing attaches, so it
// can be dropped into every layer's detail safely.
const props = defineProps<{ entityId: string }>();
const router = useRouter();

const nets = computed<HumanNetwork[]>(() => networksForEntity(props.entityId));
function has(role: NetworkRole): boolean { return nets.value.some((n) => n.role === role); }
function fmt(n: number): string { return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n); }
function open(n: HumanNetwork) {
  if (n.peopleRefs[0]) router.push({ path: '/people/search', query: { id: n.peopleRefs[0] } });
  else router.push({ path: '/people/social-networks' });
}
</script>

<style scoped>
.hn { margin-top: 1rem; padding-top: 0.9rem; border-top: 1px solid var(--line); }
.hn-h { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem; }
.hn-roles { display: inline-flex; gap: 0.25rem; }
.hn-role { font-size: 0.52rem; font-weight: 800; border-radius: 3px; padding: 0.03rem 0.28rem; }
.hn-role.capital, .hn-badge.capital { color: #58a6ff; background: rgba(88, 166, 255, 0.16); }
.hn-role.labor, .hn-badge.labor { color: var(--up); background: rgba(75, 191, 115, 0.16); }
.hn-role.supply, .hn-badge.supply { color: var(--accent); background: rgba(216, 162, 80, 0.16); }
.hn-list { display: flex; flex-direction: column; gap: 0.4rem; }
.hn-net { display: flex; align-items: center; gap: 0.55rem; width: 100%; border: 1px solid var(--line-2); background: var(--surface-2); color: inherit; border-radius: 8px; padding: 0.45rem 0.6rem; cursor: pointer; text-align: left; } .hn-net:hover { border-color: var(--accent); }
.hn-badge { flex: 0 0 auto; font-size: 0.54rem; font-weight: 800; text-transform: uppercase; border-radius: 3px; padding: 0.05rem 0.35rem; }
.hn-net-b { flex: 1; min-width: 0; display: grid; } .hn-net-name { font-size: 0.82rem; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .hn-net-sub { font-size: 0.68rem; color: var(--text-3); text-transform: capitalize; }
.hn-open { flex: 0 0 auto; font-size: 0.66rem; color: var(--text-3); } .hn-net:hover .hn-open { color: var(--accent); }
</style>
