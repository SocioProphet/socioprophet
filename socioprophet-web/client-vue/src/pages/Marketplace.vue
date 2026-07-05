<template>
  <section class="mp" aria-label="Governed triparty marketplace">
    <header class="mp-toolbar">
      <div class="mp-title">
        <div>
          <p class="mp-eyebrow">{{ scope?.domain ?? 'Operations' }}</p>
          <h1>{{ scope?.label ?? 'Marketplace' }}</h1>
        </div>
        <span class="mp-pill">fixture</span>
      </div>
      <div class="mp-agg">
        <span class="mp-agg-k">Cells</span><span class="mp-num">{{ cells.length }}</span>
        <span class="mp-agg-k">Cleared</span><span class="mp-num">{{ fmtAsset(clearedValue) }}</span>
      </div>
    </header>
    <p class="mp-note">Governed triparty netting cells — the smallest local clearing object coupling value + proof + authority + disclosure. Release/refund/export is disposed by policy, not confidence; export is stricter than local validity. Cells can clear supply-chain trades.</p>

    <div class="mp-body">
      <!-- Cell list -->
      <div ref="listEl" class="mp-list" aria-label="Netting cells" @keydown="arrowRove($event, listEl, '.mp-row')">
        <p class="mp-count">{{ cells.length }} netting cells</p>
        <button v-for="c in cells" :key="c.id" class="mp-row" :class="{ on: c.id === selectedId }" @click="selectedId = c.id">
          <div class="mp-row-top">
            <span class="mp-stage" :class="c.stage.toLowerCase()">{{ c.stage }}</span>
            <span class="mp-truth" :class="c.truthClass.toLowerCase()">{{ c.truthClass }}</span>
          </div>
          <div class="mp-row-name">{{ c.name }}</div>
          <div class="mp-row-foot"><span class="mp-admit" :class="c.admissibility">{{ c.admissibility }}</span><span class="mp-amt">{{ fmtAsset(c.netAmount) }}</span></div>
        </button>
      </div>

      <!-- Cell detail -->
      <article v-if="selected" class="mp-detail" aria-label="Netting cell detail">
        <div class="mp-d-head">
          <div>
            <div class="mp-d-name">{{ selected.name }}</div>
            <div class="mp-d-sub">net {{ fmtAsset(selected.netAmount) }} · truth class <b :class="selected.truthClass.toLowerCase()">{{ selected.truthClass }}</b></div>
          </div>
          <span class="mp-stage lg" :class="selected.stage.toLowerCase()">{{ selected.stage }}</span>
        </div>

        <!-- Triparty legs: value / authority / proof kept distinct -->
        <div class="mp-block">
          <div class="mp-block-h">Triparty legs <span>value · authority · proof are distinct</span></div>
          <div class="mp-legs">
            <div v-for="l in selected.legs" :key="l.role" class="mp-leg" :class="'role-' + l.role">
              <div class="mp-leg-h"><span class="mp-leg-role">{{ l.role }}</span>{{ l.party }}</div>
              <div v-if="l.value" class="mp-leg-kv"><span>value</span>{{ l.value }}</div>
              <div v-if="l.capability" class="mp-leg-kv"><span>authority</span>{{ l.capability }}</div>
              <div v-if="l.proof" class="mp-leg-kv"><span>proof</span>{{ l.proof }}</div>
            </div>
          </div>
        </div>

        <!-- Lifecycle -->
        <div class="mp-block">
          <div class="mp-block-h">Lifecycle</div>
          <div class="mp-life">
            <div v-for="(s, i) in STAGES" :key="s" class="mp-life-s" :class="{ done: i < curStage, on: i === curStage }">
              <span class="mp-life-dot" /><span class="mp-life-n">{{ s }}</span>
            </div>
          </div>
        </div>

        <!-- Admissibility lattice -->
        <div class="mp-block">
          <div class="mp-block-h">Admissibility <span>evidence ⊇ admit ⊇ release ⊇ export</span></div>
          <div class="mp-admit-row">
            <span v-for="a in ADMIT_LATTICE" :key="a" class="mp-admit-lvl" :class="{ on: a === selected.admissibility, reached: admitIndex(a) <= admitIndex(selected.admissibility) }">{{ a }}</span>
          </div>
        </div>

        <!-- Typed bundles -->
        <div class="mp-block">
          <div class="mp-block-h">Proof-carrying bundles</div>
          <div class="mp-bundles">
            <div v-for="b in selected.bundles" :key="b.id" class="mp-bundle">
              <span class="mp-bk">{{ b.kind }}</span>
              <span class="mp-bsum">{{ b.summary }}</span>
              <span class="mp-btruth" :class="b.truthClass.toLowerCase()">{{ b.truthClass }}</span>
              <span v-if="b.attested" class="mp-battest" title="carries a Truth Record (witness/attestation)">◆ attested</span>
            </div>
          </div>
        </div>

        <p class="mp-cell-note">{{ selected.note }}</p>
        <div v-if="selected.supplyChainNode" class="mp-sc">
          <button class="mp-sc-link" @click="openChain(selected.supplyChainNode!)">⛓ Clears supply-chain node · {{ selected.supplyChainNode }} →</button>
        </div>
        <div class="mp-boundary">Shapes mirror the sourceos-spec NettingCell / TripartyBundle contract; a live NettingCell/PolicyKernel/ReserveManager runtime settles the same objects.</div>
      </article>
      <div v-else class="mp-detail empty">Select a netting cell</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { navScopeForPath } from '../config/cockpitNav';
import { cells, cellById, stageIndex, STAGES, ADMIT_LATTICE, type Cell, type Admissibility } from '../data/marketplaceFixture';
import { arrowRove } from '../utils/listKeys';

const router = useRouter();
const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

const selectedId = ref<string>(cells[0]!.id);
const selected = computed<Cell | undefined>(() => cellById(selectedId.value));
const listEl = ref<HTMLElement | null>(null);
const clearedValue = cells.filter((c) => c.stage === 'Released' || c.stage === 'Exported').reduce((a, c) => a + c.netAmount, 0);

const curStage = computed(() => stageIndex(selected.value?.stage ?? 'Observed'));
function admitIndex(a: Admissibility): number { return ADMIT_LATTICE.indexOf(a); }
function fmtAsset(n: number): string { return n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n); }
function openChain(node: string) { router.push({ path: '/analytics/supply-chain', query: { node } }); }
</script>

<style scoped>
.mp { height: 100%; min-height: 0; display: grid; grid-template-rows: auto auto 1fr; gap: 0.6rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: var(--text); }
.mp-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.mp-title { display: flex; align-items: baseline; gap: 0.6rem; } .mp-title h1 { margin: 0; font-size: 1.3rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.mp-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.mp-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); background: var(--accent-soft); border-radius: 5px; padding: 0.1rem 0.4rem; }
.mp-agg { display: flex; align-items: center; gap: 0.5rem; font-size: 0.72rem; color: var(--text-3); } .mp-agg-k { text-transform: uppercase; letter-spacing: 0.05em; } .mp-agg .mp-num { color: var(--text); font-variant-numeric: tabular-nums; margin-right: 0.4rem; }
.mp-note { margin: 0; font-size: 0.8rem; color: var(--text-3); max-width: 96ch; }

.mp-body { min-height: 0; display: grid; grid-template-columns: minmax(280px, 0.85fr) minmax(420px, 1.5fr); gap: 0.75rem; }
@media (max-width: 1080px) { .mp-body { grid-template-columns: 1fr; } .mp-detail { display: none; } }

.mp-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; }
.mp-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); border-bottom: 1px solid var(--line); }
.mp-row { width: 100%; display: grid; gap: 0.3rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.6rem 0.85rem; cursor: pointer; text-align: left; } .mp-row:hover { background: var(--surface-2); } .mp-row.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.mp-row-top { display: flex; align-items: center; gap: 0.4rem; }
.mp-row-name { font-size: 0.86rem; font-weight: 600; line-height: 1.25; }
.mp-row-foot { display: flex; align-items: center; justify-content: space-between; }
.mp-amt { font-size: 0.78rem; font-variant-numeric: tabular-nums; color: var(--text-2); }

.mp-stage { font-size: 0.56rem; text-transform: uppercase; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; } .mp-stage.lg { font-size: 0.66rem; padding: 0.15rem 0.5rem; }
.mp-stage.observed, .mp-stage.proposed { color: #8b949e; background: rgba(139,148,158,0.16); } .mp-stage.ready, .mp-stage.escrowed { color: #58a6ff; background: rgba(88,166,255,0.14); } .mp-stage.filled { color: var(--accent); background: rgba(216,162,80,0.16); } .mp-stage.verified { color: #93c5fd; background: rgba(88,166,255,0.16); } .mp-stage.released, .mp-stage.exported { color: var(--up); background: rgba(75,191,115,0.16); } .mp-stage.refunded, .mp-stage.reversed { color: var(--down); background: rgba(240,101,106,0.16); }
.mp-truth, .mp-btruth { font-size: 0.54rem; text-transform: uppercase; font-weight: 700; border-radius: 3px; padding: 0.05rem 0.3rem; margin-left: auto; }
.mp-truth.proven, .mp-btruth.proven, b.proven { color: var(--up); background: rgba(75,191,115,0.15); } .mp-truth.attested, .mp-btruth.attested, b.attested { color: #93c5fd; background: rgba(88,166,255,0.14); } .mp-truth.inferred, .mp-btruth.inferred, b.inferred { color: var(--accent); background: rgba(216,162,80,0.14); } .mp-truth.reputed, .mp-btruth.reputed, b.reputed { color: #8b949e; background: rgba(139,148,158,0.16); }
.mp-admit { font-size: 0.56rem; text-transform: uppercase; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; } .mp-admit.evidence { color: #8b949e; background: rgba(139,148,158,0.16); } .mp-admit.admit { color: #58a6ff; background: rgba(88,166,255,0.14); } .mp-admit.release { color: var(--accent); background: rgba(216,162,80,0.16); } .mp-admit.export { color: var(--up); background: rgba(75,191,115,0.16); }

.mp-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem 1.1rem; }
.mp-detail.empty { display: grid; place-items: center; color: var(--text-3); font-size: 0.85rem; }
.mp-d-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.mp-d-name { font-size: 1.15rem; font-weight: 640; } .mp-d-sub { font-size: 0.78rem; color: var(--text-3); margin-top: 0.15rem; } .mp-d-sub b { font-size: 0.6rem; border-radius: 3px; padding: 0.05rem 0.3rem; }

.mp-block { margin-top: 1.1rem; }
.mp-block-h { display: flex; align-items: baseline; justify-content: space-between; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); margin-bottom: 0.6rem; } .mp-block-h span { text-transform: none; letter-spacing: 0; font-size: 0.66rem; color: var(--text-3); }
.mp-legs { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem; }
.mp-leg { border: 1px solid var(--line); border-radius: 9px; padding: 0.5rem 0.6rem; background: var(--surface-2); }
.mp-leg.role-C { border-color: var(--accent-soft); }
.mp-leg-h { font-size: 0.82rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.3rem; }
.mp-leg-role { font-size: 0.6rem; font-weight: 800; width: 1.1rem; height: 1.1rem; display: grid; place-items: center; border-radius: 4px; background: rgba(255,255,255,0.08); color: var(--text-2); } .mp-leg.role-C .mp-leg-role { color: var(--accent); }
.mp-leg-kv { display: flex; gap: 0.4rem; font-size: 0.72rem; color: var(--text-2); } .mp-leg-kv span { color: var(--text-3); min-width: 3.8rem; text-transform: uppercase; font-size: 0.6rem; }

.mp-life { display: flex; flex-wrap: wrap; gap: 0.15rem; }
.mp-life-s { display: flex; align-items: center; gap: 0.3rem; opacity: 0.45; } .mp-life-s.done { opacity: 0.8; } .mp-life-s.on { opacity: 1; }
.mp-life-dot { width: 8px; height: 8px; border-radius: 50%; background: #8b949e; } .mp-life-s.done .mp-life-dot { background: var(--up); } .mp-life-s.on .mp-life-dot { background: var(--accent); box-shadow: 0 0 0 3px rgba(216,162,80,0.2); }
.mp-life-n { font-size: 0.68rem; color: var(--text-2); } .mp-life-s:not(:last-child)::after { content: '→'; color: var(--text-3); margin: 0 0.15rem; }

.mp-admit-row { display: flex; gap: 0.3rem; }
.mp-admit-lvl { font-size: 0.7rem; border: 1px solid var(--line); border-radius: 6px; padding: 0.2rem 0.55rem; color: var(--text-3); } .mp-admit-lvl.reached { color: var(--text-2); border-color: var(--line-2); } .mp-admit-lvl.on { color: var(--accent); border-color: var(--accent); background: var(--accent-soft); font-weight: 600; }

.mp-bundles { display: grid; gap: 0.35rem; }
.mp-bundle { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; padding: 0.35rem 0; border-bottom: 1px solid var(--line); } .mp-bundle:last-child { border-bottom: none; }
.mp-bk { flex: 0 0 5rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; color: var(--text-2); }
.mp-bsum { flex: 1; color: var(--text-3); } .mp-battest { font-size: 0.62rem; color: var(--up); }
.mp-cell-note { margin: 1rem 0 0; font-size: 0.84rem; line-height: 1.55; color: var(--text-2); }
.mp-sc { margin-top: 0.7rem; } .mp-sc-link { text-align: left; border: 1px solid var(--line-2); background: var(--surface-2); color: var(--text-2); border-radius: 8px; padding: 0.4rem 0.6rem; font-size: 0.78rem; cursor: pointer; } .mp-sc-link:hover { border-color: var(--accent); color: var(--accent); }
.mp-boundary { font-size: 0.72rem; color: var(--text-3); padding-top: 0.9rem; margin-top: 0.9rem; border-top: 1px solid var(--line); line-height: 1.5; }
</style>
