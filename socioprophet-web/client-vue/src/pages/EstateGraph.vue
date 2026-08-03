<script setup lang="ts">
// Estate graph — three orgs, project streams, per-node AgentOps.
//
// Separation is structural: an org is a boundary, a stream is a funded lane
// inside it, a node is a repo carrying its own health. Rolling them together is
// what makes an estate dashboard useless, so nothing here averages across orgs
// except where it says so.
//
// Tufte: hairlines not boxes, small multiples (one row shape per node repeated
// under each org), direct labelling, and bars only where the bar is the datum.
import { computed, ref } from 'vue';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import Sparkline from '../components/Sparkline.vue';
import { estateGraph as g } from '../data/estateGraph';
import {
  nodeHealth, healthLabel, nodesByOrg, streamsByOrg, orgHealth, driftRatio,
  type EstateNode,
} from '../features/delivery/estate';

const isLive = computed(() => g.sourceMode === 'live');
const focus = ref<string>('all');
const orgs = computed(() => (focus.value === 'all' ? g.orgs : [focus.value]));

const sortNodes = (ns: EstateNode[]) =>
  [...ns].sort((a, b) => (b.costProxyUsd ?? 0) - (a.costProxyUsd ?? 0));

const maxCost = computed(() => Math.max(1, ...g.nodes.map((n) => n.costProxyUsd ?? 0)));
const maxMin = computed(() => Math.max(1, ...g.nodes.map((n) => n.buildMinutes)));

function orgAgentShare(org: string): number | null {
  const ns = nodesByOrg(g, org).filter((n) => n.collected);
  const a = ns.reduce((s, n) => s + n.agentAuthored, 0);
  const h = ns.reduce((s, n) => s + n.humanAuthored, 0);
  return a + h ? Math.round((a / (a + h)) * 100) : null;
}
function orgCost(org: string): number {
  return Math.round(nodesByOrg(g, org).reduce((s, n) => s + (n.costProxyUsd ?? 0), 0) * 100) / 100;
}
function orgMinutes(org: string): number {
  return nodesByOrg(g, org).reduce((s, n) => s + n.buildMinutes, 0);
}
</script>

<template>
  <section class="eg" aria-labelledby="eg-title">
    <SurfaceHeader title="Estate Graph" eyebrow="Sociosphere · orgs · streams · nodes · agentops">
      <template #badge>
        <span class="eg-badge" :class="isLive ? 'is-live' : 'is-fixture'">{{ g.sourceMode }}</span>
        <span class="eg-badge">{{ g.nodesCollected }}/{{ g.nodes.length }} nodes</span>
      </template>
    </SurfaceHeader>

    <p id="eg-title" class="eg-lede">
      Three orgs, {{ g.streams.length }} funded streams, {{ g.nodes.length }} nodes over {{ g.windowDays }} days.
      Separation is <b>structural</b> — an org is a boundary, a stream is a lane inside it, a node carries its own
      health. Nothing is averaged across orgs unless it says so.
    </p>

    <BoundaryNotice
      :label="isLive ? 'live · measured per node' : 'fixture'"
      :tone="isLive ? 'muted' : 'warning'"
      :message="`${g.boundaryNotice} ${g.costNote}`"
      aria-label="Estate graph boundary"
    />

    <!-- estate totals: one line, direct-labelled -->
    <p class="eg-sentence">
      Across the estate: <b>{{ g.totals.buildMinutes.toLocaleString() }}</b> CI minutes
      (<b>~${{ g.totals.costProxyUsd }}</b> <span class="eg-basis">proxy · {{ g.costBasis }}</span>),
      <b>{{ g.totals.deployments }}</b> deployments, and
      <b>{{ g.totals.agentSharePct }}%</b> of merged work agent-authored
      ({{ g.totals.agentAuthored }} agent / {{ g.totals.humanAuthored }} human).
    </p>

    <!-- org focus -->
    <div class="eg-focus" role="group" aria-label="Focus org">
      <button type="button" :aria-pressed="focus === 'all'" @click="focus = 'all'">All three</button>
      <button v-for="o in g.orgs" :key="o" type="button" :aria-pressed="focus === o" @click="focus = o">{{ o }}</button>
    </div>

    <!-- ORG BOUNDARIES -->
    <section v-for="org in orgs" :key="org" class="eg-org" aria-label="Org">
      <div class="eg-org-h">
        <h2>{{ org }}</h2>
        <span class="eg-org-facts">
          <b>{{ g.orgTotals.find((t) => t.org === org)?.repos ?? '—' }}</b> active repos ·
          <b>{{ g.orgTotals.find((t) => t.org === org)?.merged ?? '—' }}</b> merged ·
          <b>{{ g.orgTotals.find((t) => t.org === org)?.openPrs ?? '—' }}</b> open ·
          CI <b>{{ orgHealth(g, org).rate ?? '—' }}<template v-if="orgHealth(g, org).rate !== null">%</template></b>
          <span class="eg-dim">({{ orgHealth(g, org).of }} reporting)</span> ·
          agent <b>{{ orgAgentShare(org) ?? '—' }}<template v-if="orgAgentShare(org) !== null">%</template></b> ·
          <b>{{ orgMinutes(org).toLocaleString() }}</b> min ~<b>${{ orgCost(org) }}</b>
        </span>
      </div>

      <!-- streams: the funded lanes inside this boundary -->
      <p class="eg-streams">
        <span class="eg-k">streams</span>
        <span v-for="s in streamsByOrg(g, org)" :key="s.name" class="eg-stream">{{ s.name }}</span>
        <span v-if="!streamsByOrg(g, org).length" class="eg-dim">none declared in board-spec</span>
      </p>

      <!-- nodes: small multiples, one row shape repeated -->
      <table class="eg-nodes">
        <thead>
          <tr>
            <th>Node</th><th>Health</th><th class="n">CI</th><th class="n">Merged</th>
            <th class="n">Agent</th><th>AgentOps</th><th class="n">Build min</th><th class="n">Deploys</th><th class="n">Cost ~</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in sortNodes(nodesByOrg(g, org))" :key="n.id" :class="`h-${nodeHealth(n)}`">
            <td class="eg-node">{{ n.name }}</td>
            <td><span class="eg-h" :class="`h-${nodeHealth(n)}`">{{ healthLabel[nodeHealth(n)] }}</span></td>
            <td class="n">
              <template v-if="n.ciSuccessRate !== null">{{ n.ciSuccessRate }}%<span class="u">{{ n.ciSuccess }}/{{ n.ciRuns }}</span></template>
              <span v-else class="eg-dim">—</span>
            </td>
            <td class="n">{{ n.merged }}</td>
            <td class="n">
              <template v-if="n.agentShare !== null">{{ n.agentShare }}%</template>
              <span v-else class="eg-dim">—</span>
            </td>
            <td class="eg-ops">
              <!-- the bar IS the datum: agent vs human split of merged work -->
              <span class="eg-split" :title="`${n.agentAuthored} agent / ${n.humanAuthored} human`">
                <span class="a" :style="{ width: `${n.merged ? (n.agentAuthored / n.merged) * 100 : 0}%` }" />
                <span class="hm" :style="{ width: `${n.merged ? (n.humanAuthored / n.merged) * 100 : 0}%` }" />
              </span>
            </td>
            <td class="n">
              {{ n.buildMinutes.toLocaleString() }}
              <span class="eg-micro"><span :style="{ width: `${(n.buildMinutes / maxMin) * 100}%` }" /></span>
            </td>
            <td class="n">{{ n.deployments }}</td>
            <td class="n">
              <template v-if="n.costProxyUsd !== null">${{ n.costProxyUsd }}</template>
              <span v-else class="eg-dim">—</span>
              <span class="eg-micro"><span class="cost" :style="{ width: `${((n.costProxyUsd ?? 0) / maxCost) * 100}%` }" /></span>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="nodesByOrg(g, org).some((n) => !n.collected)" class="eg-warn">
        {{ nodesByOrg(g, org).filter((n) => !n.collected).length }} node(s) in this org reported no metrics and are shown as
        <b>not collected</b> rather than zero — absence is not zero.
      </p>
    </section>

    <!-- ===================== DECLARED TOPOLOGY ===================== -->
    <section class="eg-topo" aria-label="Declared topology">
      <div class="eg-topo-h">
        <h2>Declared topology</h2>
        <span class="eg-k">sociosphere registries</span>
      </div>

      <!-- drift is the headline, not a footnote -->
      <p class="eg-drift" :class="{ 'is-bad': (driftRatio(g.edges) ?? 100) < 50 }">
        <b>{{ g.edges.real }}</b> of <b>{{ g.edges.declared }}</b> declared dependency edges have both endpoints
        in a real repo<template v-if="g.edges.driftRepos.length">, and
        <b>{{ g.edges.driftRepos.length }}</b> named repos do not exist in any of the three orgs</template>.
        <span class="eg-dim">
          dependency-graph.yaml is stale; it is reported rather than filtered until the picture looks connected.
        </span>
      </p>
      <p v-if="g.edges.driftRepos.length" class="eg-ghosts">
        <span class="eg-k">not found</span>
        <span v-for="r in g.edges.driftRepos.slice(0, 16)" :key="r" class="eg-ghost">{{ r }}</span>
        <span v-if="g.edges.driftRepos.length > 16" class="eg-dim">+{{ g.edges.driftRepos.length - 16 }} more</span>
      </p>

      <!-- the edges that ARE real, kept separate by kind -->
      <div class="eg-edges">
        <div>
          <span class="eg-k">control lanes <b>{{ g.edges.lanes.length }}</b></span>
          <ul class="eg-list">
            <li v-for="l in g.edges.lanes" :key="l.id">
              <span class="eg-mono">{{ l.owner }}</span>
              <span class="eg-arrow">governs</span>
              <span>{{ l.id }}</span>
            </li>
          </ul>
        </div>
        <div>
          <span class="eg-k">authority edges <b>{{ g.edges.authority.length }}</b></span>
          <ul class="eg-list">
            <li v-for="a in g.edges.authority" :key="a.id">
              <span class="eg-mono">{{ a.from }}</span>
              <span class="eg-arrow">→</span>
              <span class="eg-mono">{{ a.to }}</span>
              <span class="eg-dim">{{ a.fromKind }} → {{ a.toKind }} ({{ a.status }})</span>
            </li>
            <li v-if="!g.edges.authority.length" class="eg-dim">none declared</li>
          </ul>
        </div>
      </div>
      <p class="eg-note">
        Kinds are kept <b>separate on purpose</b>: a submodule pin is not an authority relationship, and merging
        them would draw a graph that looks connected and says nothing.
      </p>
    </section>

    <!-- legend, stated once, in words -->
    <p class="eg-note">
      <span class="eg-swatch a" aria-hidden="true" /> agent-authored ·
      <span class="eg-swatch hm" aria-hidden="true" /> human-authored.
      Health is <b>derived</b> from CI success rate (≥90% healthy, ≥70% degraded), never asserted.
      Cost is a proxy: minutes measured, rate declared.
    </p>
  </section>
</template>

<style scoped>
.eg {
  height: 100%; min-height: 0; overflow-y: auto;
  padding: 1rem 1.25rem 2.5rem; background: var(--bg); color: var(--text);
  display: flex; flex-direction: column; gap: 0.9rem;
}
.eg-badge {
  font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;
  color: var(--accent); background: var(--accent-soft); border-radius: 4px; padding: 0.05rem 0.32rem;
}
.eg-badge.is-live { color: var(--up); background: rgba(75,191,115,0.14); }
.eg-badge.is-fixture { color: var(--amber); background: var(--amber-soft); }

.eg-lede { margin: 0; max-width: 96ch; font-size: var(--fs-base); line-height: 1.55; color: var(--text-2); }
.eg-lede b, .eg-sentence b { color: var(--text); font-variant-numeric: tabular-nums; }
.eg-sentence { margin: 0; font-size: var(--fs-sm); color: var(--text-2); line-height: 1.7; }
.eg-basis { font-size: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--amber); font-weight: 700; }
.eg-dim { color: var(--text-3); }
.eg-warn { margin: 0.3rem 0 0; font-size: 0.6rem; color: var(--amber); }

.eg-focus { display: flex; flex-wrap: wrap; gap: 0.3rem; border-top: 1px solid var(--line); padding-top: 0.7rem; }
.eg-focus button {
  background: none; border: 0; border-bottom: 1px solid transparent; padding: 0.15rem 0.1rem;
  font-size: var(--fs-xs); color: var(--text-3); cursor: pointer; margin-right: 0.7rem;
}
.eg-focus button:hover { color: var(--text-2); }
.eg-focus button[aria-pressed='true'] { color: var(--accent); border-bottom-color: var(--accent); font-weight: 700; }

/* org = a boundary, drawn with a rule not a box */
.eg-org { border-top: 1px solid var(--line-2); padding-top: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem; }
.eg-org-h { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.eg-org-h h2 { margin: 0; font-size: var(--fs-md); font-weight: 640; letter-spacing: -0.01em; }
.eg-org-facts { font-size: var(--fs-xs); color: var(--text-3); }

.eg-streams { margin: 0; display: flex; flex-wrap: wrap; gap: 0.3rem; align-items: baseline; }
.eg-k { font-size: 0.5rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; color: var(--text-3); margin-right: 0.2rem; }
.eg-stream { font-size: 0.58rem; color: var(--teal); background: rgba(45,212,191,0.1); border-radius: 3px; padding: 0.04rem 0.34rem; }

.eg-nodes { width: 100%; border-collapse: collapse; font-size: var(--fs-xs); }
.eg-nodes th, .eg-nodes td { padding: 0.3rem 0.5rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
.eg-nodes tbody tr:last-child td { border-bottom: 0; }
.eg-nodes th {
  font-size: 0.5rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700;
  color: var(--text-3); border-bottom-color: var(--line-2);
}
.eg-nodes th.n, .eg-nodes td.n { text-align: right; font-variant-numeric: tabular-nums; }
.eg-nodes tbody tr:hover td { background: var(--surface-2); }
.eg-node { font-weight: 640; color: var(--text); white-space: nowrap; }
.eg-nodes .u { display: block; font-size: 0.46rem; color: var(--text-3); }

.eg-h { font-size: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
.eg-h.h-healthy { color: var(--up); }
.eg-h.h-degraded { color: var(--amber); }
.eg-h.h-failing { color: var(--down); }
.eg-h.h-unknown { color: var(--neutral); }
tr.h-unknown td { opacity: 0.55; }

/* the bar IS the datum */
.eg-split { display: flex; width: 74px; height: 3px; background: var(--line); }
.eg-split .a { background: var(--info); }
.eg-split .hm { background: var(--teal); }
.eg-micro { display: block; height: 2px; margin-top: 2px; background: var(--line); }
.eg-micro span { display: block; height: 100%; background: var(--accent); }
.eg-micro span.cost { background: var(--amber); }

.eg-topo { border-top: 1px solid var(--line-2); padding-top: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem; }
.eg-topo-h { display: flex; align-items: baseline; gap: 0.6rem; }
.eg-topo-h h2 { margin: 0; font-size: var(--fs-md); font-weight: 640; }
.eg-drift { margin: 0; font-size: var(--fs-sm); color: var(--text-2); line-height: 1.6; }
.eg-drift b { color: var(--text); font-variant-numeric: tabular-nums; }
.eg-drift.is-bad b { color: var(--down); }
.eg-ghosts { margin: 0; display: flex; flex-wrap: wrap; gap: 0.25rem; align-items: baseline; }
.eg-ghost { font-size: 0.55rem; color: var(--down); background: rgba(240,101,106,0.1); border-radius: 3px; padding: 0.02rem 0.3rem; text-decoration: line-through; }
.eg-edges { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.9rem; }
.eg-list { list-style: none; margin: 0.25rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.6rem; color: var(--text-2); }
.eg-list li { display: flex; gap: 0.35rem; align-items: baseline; flex-wrap: wrap; }
.eg-mono { font-family: var(--mono, ui-monospace), monospace; color: var(--text); }
.eg-arrow { color: var(--accent); }
.eg-note { margin: 0; font-size: 0.6rem; color: var(--text-3); line-height: 1.6; border-top: 1px solid var(--line); padding-top: 0.6rem; }
.eg-note b { color: var(--text-2); }
.eg-swatch { display: inline-block; width: 0.5rem; height: 0.5rem; vertical-align: middle; margin-right: 0.15rem; }
.eg-swatch.a { background: var(--info); }
.eg-swatch.hm { background: var(--teal); }

@media (max-width: 720px) { .eg { padding: 0.85rem 0.9rem 2rem; } }
</style>
