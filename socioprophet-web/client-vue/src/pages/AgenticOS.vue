<template>
  <section class="aos" aria-label="Agentic operating system">
    <header class="aos-toolbar">
      <div class="aos-title">
        <div>
          <p class="aos-eyebrow">{{ scope?.domain ?? 'Operations' }}</p>
          <h1>{{ scope?.label ?? 'Agentic Operating System' }}</h1>
        </div>
        <span class="aos-pill">fixture</span>
      </div>
      <div class="aos-agg">
        <span class="aos-agg-k">Objectives</span><span class="aos-num">{{ opportunities.length }}</span>
        <span class="aos-agg-k">Active</span><span class="aos-num">{{ activeCount }}</span>
        <span class="aos-agg-k">Avg readiness</span><span class="aos-num">{{ avgReadiness }}%</span>
      </div>
    </header>
    <p class="aos-note">Agent pods pursue objectives across the stack under a governed capture cadence, delta-control SLAs, shared libraries, and a readiness scorecard. Each object anchors to real repos in the estate.</p>

    <!-- Capture cadence strip -->
    <div class="aos-cadence" aria-label="Capture cadence">
      <div v-for="w in cadence" :key="w.week" class="aos-cad" :class="{ on: w.week === currentWeek, done: w.week < currentWeek }" :title="`${w.objective} · min readiness ${Math.round(w.minReadiness * 100)}%`">
        <span class="aos-cad-w">W{{ w.week }}</span>
        <span class="aos-cad-o">{{ w.objective }}</span>
      </div>
    </div>

    <div class="aos-body">
      <!-- Objective portfolio -->
      <div ref="listEl" class="aos-list" aria-label="Objectives" @keydown="arrowRove($event, listEl, '.aos-row')">
        <p class="aos-count">{{ opportunities.length }} objectives</p>
        <button v-for="o in opportunities" :key="o.id" class="aos-row" :class="{ on: o.id === selectedId }" @click="selectedId = o.id">
          <div class="aos-row-top">
            <span class="aos-cluster">{{ o.cluster }}</span>
            <span class="aos-status" :class="o.status.toLowerCase()">{{ o.status }}</span>
          </div>
          <div class="aos-row-name">{{ o.name }}</div>
          <div class="aos-row-foot">
            <span class="aos-rag" :class="rag(o).toLowerCase()">{{ rag(o) }}</span>
            <div class="aos-rbar"><div class="aos-rbar-fill" :class="rag(o).toLowerCase()" :style="{ width: pct(o) + '%' }" /></div>
            <span class="aos-rpct">{{ pct(o) }}%</span>
          </div>
        </button>
      </div>

      <!-- Objective detail -->
      <article v-if="selected" class="aos-detail" aria-label="Objective detail">
        <div class="aos-d-head">
          <div>
            <div class="aos-d-name">{{ selected.name }} <span class="aos-status" :class="selected.status.toLowerCase()">{{ selected.status }}</span></div>
            <div class="aos-d-sub">{{ selected.cluster }} · mission owner {{ selected.missionOwner }}</div>
          </div>
          <div class="aos-d-ready" :class="rag(selected).toLowerCase()">{{ pct(selected) }}%<small>readiness · {{ selected.readiness.nextGate }}</small></div>
        </div>

        <p class="aos-buying"><b>Buying problem.</b> {{ selected.buyingProblem }}</p>
        <p class="aos-win"><b>Win theme.</b> {{ selected.winTheme }}</p>
        <div class="aos-pattern">{{ selected.deliveryPattern }}</div>

        <!-- Readiness scorecard -->
        <div class="aos-block">
          <div class="aos-block-h">Readiness scorecard <span>{{ total(selected) }} / {{ maxScore }}</span></div>
          <div class="aos-score">
            <div v-for="d in dims" :key="d" class="aos-dim">
              <span class="aos-dim-n">{{ d }}</span>
              <span class="aos-dim-dots"><i v-for="i in 3" :key="i" :class="{ filled: selected.readiness.scores[d] >= i }" /></span>
            </div>
          </div>
        </div>

        <!-- Agent pod coverage -->
        <div class="aos-block">
          <div class="aos-block-h">Agent pods</div>
          <div class="aos-pods">
            <div v-for="p in emphasizedPods" :key="p.id" class="aos-pod">
              <div class="aos-pod-role">{{ p.role }}</div>
              <div class="aos-pod-mandate">{{ p.mandate }}</div>
              <div class="aos-pod-anchors"><button v-for="r in p.repoAnchors" :key="r" class="aos-repo" @click="openRepo(r)">{{ r }}</button></div>
            </div>
          </div>
        </div>

        <!-- Shared libraries + reuse repos -->
        <div class="aos-block">
          <div class="aos-block-h">Shared libraries</div>
          <div class="aos-libs"><span v-for="l in selectedLibs" :key="l.id" class="aos-lib" :title="l.standardizes">{{ l.name }}</span></div>
        </div>
        <div class="aos-block">
          <div class="aos-block-h">Reuse from the estate</div>
          <div class="aos-repos"><button v-for="r in selected.reuseRepos" :key="r" class="aos-repo" @click="openRepo(r)">{{ r }}</button></div>
        </div>

        <!-- Delta control -->
        <div v-if="selected.deltas.length" class="aos-block">
          <div class="aos-block-h">Delta control</div>
          <div class="aos-deltas">
            <div v-for="d in selected.deltas" :key="d.id" class="aos-delta">
              <span class="aos-delta-s" :class="d.status.toLowerCase()">{{ d.status }}</span>
              <span class="aos-delta-k">{{ d.kind }}</span>
              <span class="aos-delta-src">{{ d.monitorSource }} · {{ d.expected }}</span>
            </div>
          </div>
        </div>

        <div class="aos-partner"><b>Partner / OEM lane:</b> {{ selected.partnerLane }}</div>
        <div class="aos-boundary">Draft of the sourceos-spec agentic-OS contract (Opportunity / AgentPod / ReadinessScore / CaptureCadence / DeltaControl). A live registry adapter resolves the same objects.</div>
      </article>
      <div v-else class="aos-detail empty">Select an objective</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { navScopeForPath } from '../config/cockpitNav';
import {
  opportunities, cadence, currentWeek, READINESS_DIMS, libById,
  readinessTotal, readinessPct, readinessRag, type Opportunity,
} from '../data/agenticOsFixture';
import { pods as allPods } from '../data/agenticOsFixture';
import { arrowRove } from '../utils/listKeys';

const router = useRouter();
const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

const dims = READINESS_DIMS;
const maxScore = READINESS_DIMS.length * 3;
const selectedId = ref<string>(opportunities[0]!.id);
const selected = computed<Opportunity | undefined>(() => opportunities.find((o) => o.id === selectedId.value));
const listEl = ref<HTMLElement | null>(null);

const activeCount = opportunities.filter((o) => o.status === 'Active').length;
const avgReadiness = Math.round(opportunities.reduce((a, o) => a + readinessPct(o.readiness), 0) / opportunities.length);

function total(o: Opportunity): number { return readinessTotal(o.readiness); }
function pct(o: Opportunity): number { return readinessPct(o.readiness); }
function rag(o: Opportunity): string { return readinessRag(o.readiness); }

const emphasizedPods = computed(() => (selected.value?.podEmphasis ?? []).map((id) => allPods.find((p) => p.id === id)).filter((x): x is NonNullable<typeof x> => !!x));
const selectedLibs = computed(() => (selected.value?.sharedLibs ?? []).map((id) => libById(id)).filter((x): x is NonNullable<typeof x> => !!x));

// Reuse repos deep-link into whichever cockpit surface represents that repo, else
// the knowledge graph rooted on the repo (the estate spine).
const REPO_ROUTE: Record<string, string> = {
  'sourceos-spec': '/knowledge/graph', 'agentplane': '/knowledge/graph', 'prophet-platform': '/knowledge/graph',
};
function openRepo(repo: string) { router.push({ path: REPO_ROUTE[repo] ?? '/knowledge/graph', query: { root: `hg:repo/${repo}` } }); }
</script>

<style scoped>
.aos { height: 100%; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 0.6rem; padding: 0.85rem 1rem 1.5rem; background: var(--bg); color: var(--text); }
.aos-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.aos-title { display: flex; align-items: baseline; gap: 0.6rem; } .aos-title h1 { margin: 0; font-size: 1.3rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.aos-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.aos-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); background: var(--accent-soft); border-radius: 5px; padding: 0.1rem 0.4rem; }
.aos-agg { display: flex; align-items: center; gap: 0.5rem; font-size: 0.72rem; color: var(--text-3); } .aos-agg-k { text-transform: uppercase; letter-spacing: 0.05em; } .aos-agg .aos-num { color: var(--text); font-variant-numeric: tabular-nums; margin-right: 0.4rem; }
.aos-note { margin: 0; font-size: 0.8rem; color: var(--text-3); max-width: 92ch; }

.aos-cadence { display: flex; gap: 0.25rem; overflow-x: auto; padding-bottom: 0.2rem; }
.aos-cad { flex: 1 0 auto; min-width: 6.5rem; border: 1px solid var(--line); border-radius: 8px; padding: 0.35rem 0.5rem; background: var(--surface); } .aos-cad.done { opacity: 0.55; } .aos-cad.on { border-color: var(--accent); background: var(--accent-soft); }
.aos-cad-w { display: block; font-size: 0.62rem; font-weight: 700; color: var(--text-3); } .aos-cad.on .aos-cad-w { color: var(--accent); } .aos-cad-o { display: block; font-size: 0.7rem; color: var(--text-2); line-height: 1.2; }

.aos-body { min-height: 0; flex: 1; display: grid; grid-template-columns: minmax(280px, 0.85fr) minmax(420px, 1.5fr); gap: 0.75rem; }
@media (max-width: 1080px) { .aos-body { grid-template-columns: 1fr; } .aos-detail { display: none; } }

.aos-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; align-self: start; max-height: 100%; }
.aos-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); border-bottom: 1px solid var(--line); }
.aos-row { width: 100%; display: grid; gap: 0.3rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.6rem 0.85rem; cursor: pointer; text-align: left; } .aos-row:hover { background: var(--surface-2); } .aos-row.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.aos-row-top { display: flex; align-items: center; gap: 0.4rem; }
.aos-cluster { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-3); }
.aos-status { margin-left: auto; font-size: 0.56rem; text-transform: uppercase; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.3rem; } .aos-status.active { color: var(--up); background: rgba(75,191,115,0.16); } .aos-status.watch { color: var(--accent); background: rgba(216,162,80,0.16); } .aos-status.paused { color: #8b949e; background: rgba(139,148,158,0.16); }
.aos-row-name { font-size: 0.88rem; font-weight: 600; line-height: 1.25; }
.aos-row-foot { display: flex; align-items: center; gap: 0.5rem; }
.aos-rag { font-size: 0.56rem; text-transform: uppercase; font-weight: 800; } .aos-rag.green { color: var(--up); } .aos-rag.amber { color: var(--accent); } .aos-rag.red { color: var(--down); }
.aos-rbar { flex: 1; height: 5px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden; } .aos-rbar-fill { height: 100%; } .aos-rbar-fill.green { background: var(--up); } .aos-rbar-fill.amber { background: var(--accent); } .aos-rbar-fill.red { background: var(--down); }
.aos-rpct { font-size: 0.72rem; font-variant-numeric: tabular-nums; color: var(--text-2); }

.aos-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem 1.1rem; }
.aos-detail.empty { display: grid; place-items: center; color: var(--text-3); font-size: 0.85rem; }
.aos-d-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.aos-d-name { font-size: 1.2rem; font-weight: 640; display: flex; align-items: center; gap: 0.5rem; } .aos-d-sub { font-size: 0.76rem; color: var(--text-3); margin-top: 0.15rem; }
.aos-d-ready { font-size: 1.6rem; font-weight: 720; font-variant-numeric: tabular-nums; text-align: right; } .aos-d-ready small { display: block; font-size: 0.58rem; font-weight: 600; color: var(--text-3); } .aos-d-ready.green { color: var(--up); } .aos-d-ready.amber { color: var(--accent); } .aos-d-ready.red { color: var(--down); }
.aos-buying, .aos-win { margin: 0.9rem 0 0; font-size: 0.86rem; line-height: 1.55; color: var(--text-2); } .aos-buying b, .aos-win b { color: var(--text); }
.aos-pattern { margin-top: 0.7rem; font-size: 0.78rem; color: var(--text-3); border-left: 2px solid var(--accent-soft); padding-left: 0.6rem; }

.aos-block { margin-top: 1.1rem; }
.aos-block-h { display: flex; align-items: baseline; justify-content: space-between; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); margin-bottom: 0.6rem; } .aos-block-h span { color: var(--text-2); font-variant-numeric: tabular-nums; }
.aos-score { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.35rem 0.9rem; }
.aos-dim { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: 0.76rem; } .aos-dim-n { color: var(--text-2); }
.aos-dim-dots { display: inline-flex; gap: 0.2rem; } .aos-dim-dots i { width: 8px; height: 8px; border-radius: 2px; background: rgba(255,255,255,0.08); } .aos-dim-dots i.filled { background: var(--accent); }

.aos-pods { display: grid; gap: 0.5rem; }
.aos-pod { border: 1px solid var(--line); border-radius: 9px; padding: 0.5rem 0.7rem; background: var(--surface-2); }
.aos-pod-role { font-size: 0.82rem; font-weight: 600; } .aos-pod-mandate { font-size: 0.72rem; color: var(--text-3); margin: 0.15rem 0 0.35rem; }
.aos-pod-anchors, .aos-repos { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.aos-repo { border: 1px solid var(--line-2); background: transparent; color: var(--text-2); border-radius: 5px; padding: 0.1rem 0.4rem; font-size: 0.7rem; font-family: ui-monospace, monospace; cursor: pointer; } .aos-repo:hover { border-color: var(--accent); color: var(--accent); }
.aos-libs { display: flex; flex-wrap: wrap; gap: 0.35rem; } .aos-lib { font-size: 0.74rem; border: 1px solid var(--accent-soft); background: rgba(216,162,80,0.08); color: var(--accent); border-radius: 6px; padding: 0.15rem 0.5rem; }
.aos-deltas { display: grid; gap: 0.35rem; }
.aos-delta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; }
.aos-delta-s { font-size: 0.54rem; text-transform: uppercase; font-weight: 700; border-radius: 3px; padding: 0.05rem 0.3rem; } .aos-delta-s.watching { color: var(--accent); background: rgba(216,162,80,0.16); } .aos-delta-s.open { color: #8b949e; background: rgba(139,148,158,0.16); } .aos-delta-s.ingested { color: var(--up); background: rgba(75,191,115,0.16); }
.aos-delta-k { color: var(--text-2); } .aos-delta-src { color: var(--text-3); font-size: 0.72rem; }
.aos-partner { margin-top: 1rem; font-size: 0.8rem; color: var(--text-2); } .aos-partner b { color: var(--text-3); font-weight: 600; }
.aos-boundary { font-size: 0.72rem; color: var(--text-3); padding-top: 0.9rem; margin-top: 0.9rem; border-top: 1px solid var(--line); line-height: 1.5; }
</style>
