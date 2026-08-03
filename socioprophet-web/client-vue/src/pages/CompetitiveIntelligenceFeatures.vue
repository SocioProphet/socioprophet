<script setup lang="ts">
// Feature Library — the galaxy of every feature across all 29 specimens, normalized
// into canonical feature-types and aligned to real tritfabric modules + foundation
// models. Six typed lenses project the same rows different ways.
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import {
  featureLibrary,
  lenses,
  clusterLabel,
  readinessLabel,
  stanceLabel,
  opportunityScore,
  type FeatureType,
  type LensId,
  type Readiness,
} from '../features/competitive-intelligence/featureLibrary';

const activeLens = ref<LensId>('demand');
const lens = computed(() => lenses.find((l) => l.id === activeLens.value)!);

type Group = { key: string; label: string; note?: string; rows: FeatureType[] };

const byDemand = (a: FeatureType, b: FeatureType) => b.demand - a.demand;

/** Rows arranged per the active lens. */
const groups = computed<Group[]>(() => {
  const all = [...featureLibrary];

  switch (activeLens.value) {
    case 'demand':
      return [{ key: 'all', label: 'Every feature by demand', note: 'Evidence-backed demand is marked; the rest is our hypothesis.', rows: all.sort(byDemand) }];

    case 'opportunity': {
      const rows = all
        .filter((f) => f.readiness !== 'gap')
        .sort((a, b) => opportunityScore(b) - opportunityScore(a));
      return [{ key: 'opp', label: 'Where we win fastest', note: 'Demand weighted by whether we can actually build it today. Gaps excluded.', rows }];
    }

    case 'threat': {
      const moats = all.filter((f) => f.stance === 'moat').sort(byDemand);
      const cannot = all.filter((f) => f.stance !== 'moat' && f.readiness === 'gap').sort(byDemand);
      return [
        { key: 'moat', label: 'Their moats', note: 'High-demand features defended by capability we do not have.', rows: moats },
        { key: 'cannot', label: 'Wanted, but we cannot field it', note: 'Not a moat — just missing capability on our side.', rows: cannot },
      ].filter((g) => g.rows.length);
    }

    case 'capability': {
      const map = new Map<string, FeatureType[]>();
      for (const f of all) {
        for (const o of f.owners) {
          const key = `${o.kind}:${o.name}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(f);
        }
      }
      return [...map.entries()]
        .map(([key, rows]) => {
          const [kind, name] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
          const path = rows[0]?.owners.find((o) => o.name === name)?.path;
          return { key, label: name, note: kind === 'none' ? 'UNOWNED — no capability in the estate' : path, rows: rows.sort(byDemand) };
        })
        .sort((a, b) => b.rows.length - a.rows.length);
    }

    case 'readiness': {
      const order: Readiness[] = ['gap', 'partial', 'have'];
      const note: Record<Readiness, string> = {
        gap: 'No capability owner in the estate. Build, acquire, or decline.',
        partial: 'Half the pipeline exists — the fastest wins usually live here.',
        have: 'We can field this today.',
      };
      return order
        .map((r) => ({ key: r, label: readinessLabel[r], note: note[r], rows: all.filter((f) => f.readiness === r).sort(byDemand) }))
        .filter((g) => g.rows.length);
    }

    case 'cluster':
    default: {
      const keys = Object.keys(clusterLabel) as (keyof typeof clusterLabel)[];
      return keys
        .map((c) => ({ key: c, label: clusterLabel[c], rows: all.filter((f) => f.cluster === c).sort(byDemand) }))
        .filter((g) => g.rows.length);
    }
  }
});

const totals = computed(() => ({
  features: featureLibrary.length,
  have: featureLibrary.filter((f) => f.readiness === 'have').length,
  partial: featureLibrary.filter((f) => f.readiness === 'partial').length,
  gap: featureLibrary.filter((f) => f.readiness === 'gap').length,
  evidence: featureLibrary.filter((f) => f.demandBasis === 'evidence').length,
}));

function demandTone(v: number): string {
  if (v >= 82) return 'is-high';
  if (v >= 68) return 'is-mid';
  return 'is-low';
}
</script>

<template>
  <section class="fx" aria-labelledby="fx-title">
    <RouterLink class="fx-back" to="/professional-intelligence/competitive">← Competitive Intelligence</RouterLink>

    <SurfaceHeader title="Feature Library" eyebrow="Competitive Intelligence · the galaxy">
      <template #badge>
        <span class="fx-badge">{{ totals.features }} feature-types</span>
        <span class="fx-badge fx-badge--fixture">fixture</span>
      </template>
    </SurfaceHeader>

    <p id="fx-title" class="fx-lede">
      Every feature observed across the 29 specimens, normalized into canonical feature-types and aligned to
      <b>real</b> capability owners — tritfabric modules and foundation models actually present in the estate.
      Six typed lenses project the same rows.
    </p>

    <BoundaryNotice
      label="fixture · alignment digest"
      tone="muted"
      message="Capability owners are grounded in an evidence scan of the estate (paths cited per row): tritfabric atlas/* + slate/*, tritrpc v1, and the noetica-impair / model-carry model registries. Demand is labelled evidence or hypothesis per row. Readiness is our assessment, not live telemetry."
      aria-label="Feature library boundary"
    />

    <!-- headline alignment read -->
    <div class="fx-headline">
      <div class="fx-hl-k">The alignment read</div>
      <p>
        We are strong where the estate is real — <b>text, NLP, OCR, provenance, governance, routing, on-device</b> —
        and we have <b>no image, TTS/ASR, or video generative model</b> in the roster. So the text-and-trust specimens
        (Grammarly, Perplexity, Photomath, Blinkist) are genuinely beatable now; the media specimens
        (PhotoRoom, Remini, CapCut, Lensa) are not, on their core trick, without new model capability.
      </p>
      <div class="fx-hl-stats">
        <span class="fx-pill is-have">{{ totals.have }} have</span>
        <span class="fx-pill is-partial">{{ totals.partial }} partial</span>
        <span class="fx-pill is-gap">{{ totals.gap }} gap</span>
        <span class="fx-pill is-ev">{{ totals.evidence }}/{{ totals.features }} demand evidence-backed</span>
      </div>
    </div>

    <!-- lens switcher -->
    <div class="fx-lenses" role="group" aria-label="Lens">
      <button
        v-for="l in lenses"
        :key="l.id"
        type="button"
        class="fx-lens"
        :aria-pressed="activeLens === l.id"
        @click="activeLens = l.id"
      >{{ l.label }}</button>
    </div>
    <p class="fx-lensnote"><b>{{ lens.question }}</b> {{ lens.pivot }}</p>

    <!-- groups -->
    <section v-for="group in groups" :key="group.key" class="fx-group" :aria-label="group.label">
      <div class="fx-grouph">
        <h2>{{ group.label }}</h2>
        <span class="fx-groupn">{{ group.rows.length }}</span>
        <span v-if="group.note" class="fx-groupnote">{{ group.note }}</span>
      </div>

      <div class="fx-tablewrap">
        <table class="fx-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th class="fx-num">Demand</th>
              <th v-if="activeLens === 'opportunity'" class="fx-num">Opp.</th>
              <th>Shipped by</th>
              <th>Capability owner</th>
              <th>Readiness</th>
              <th>Our angle</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in group.rows" :key="`${group.key}-${f.id}`">
              <td class="fx-fname">
                <b>{{ f.name }}</b>
                <span class="fx-what">{{ f.whatItIs }}</span>
                <span class="fx-tags">
                  <span class="fx-tag" :class="`st-${f.stance}`">{{ stanceLabel[f.stance] }}</span>
                  <span class="fx-tag fx-tag--mod">{{ f.modality }}</span>
                </span>
              </td>
              <td class="fx-num fx-demand">
                <b>{{ f.demand }}</b>
                <span class="fx-bar" aria-hidden="true"><span :class="demandTone(f.demand)" :style="{ width: `${f.demand}%` }" /></span>
                <span class="fx-basis" :class="f.demandBasis === 'evidence' ? 'is-ev' : 'is-hyp'">{{ f.demandBasis }}</span>
              </td>
              <td v-if="activeLens === 'opportunity'" class="fx-num fx-opp">{{ opportunityScore(f) }}</td>
              <td class="fx-ships">
                <span v-if="!f.shippedBy.length" class="fx-nobody">nobody ships it</span>
                <span v-for="app in f.shippedBy" :key="app" class="fx-ship">{{ app }}</span>
              </td>
              <td class="fx-owners">
                <span v-for="o in f.owners" :key="o.name" class="fx-owner" :class="`ok-${o.kind}`">
                  {{ o.name }}
                </span>
              </td>
              <td>
                <span class="fx-ready" :class="`rd-${f.readiness}`">{{ readinessLabel[f.readiness] }}</span>
                <span class="fx-gapnote">{{ f.gapNote }}</span>
              </td>
              <td class="fx-angle">{{ f.ourAngle }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<style scoped>
.fx {
  height: 100%; min-height: 0; overflow-y: auto;
  padding: 1rem 1.25rem 2.5rem;
  background: var(--bg); color: var(--text);
  display: flex; flex-direction: column; gap: 1rem;
}

.fx-back {
  align-self: flex-start; font-size: var(--fs-xs); color: var(--text-3);
  text-decoration: none; border: 1px solid var(--line); border-radius: 999px; padding: 0.2rem 0.6rem;
}
.fx-back:hover { color: var(--text); border-color: var(--accent); }

.fx-badge {
  font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;
  color: var(--accent); background: var(--accent-soft); border-radius: 4px; padding: 0.05rem 0.32rem;
}
.fx-badge--fixture { color: var(--amber); background: var(--amber-soft); }

.fx-lede { margin: 0; max-width: 96ch; font-size: var(--fs-base); line-height: 1.55; color: var(--text-2); }
.fx-lede b { color: var(--text); }

.fx-headline {
  border: 1px solid var(--accent-soft); border-left: 2px solid var(--accent);
  border-radius: var(--radius-sm); background: var(--accent-soft);
  padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.55rem;
}
.fx-hl-k { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.09em; font-weight: 700; color: var(--accent); }
.fx-headline p { margin: 0; font-size: var(--fs-sm); line-height: 1.55; color: var(--text); max-width: 96ch; }
.fx-headline b { color: var(--text); font-weight: 700; }
.fx-hl-stats { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.fx-pill {
  font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;
  border-radius: 999px; padding: 0.12rem 0.5rem; font-variant-numeric: tabular-nums;
}
.fx-pill.is-have { color: var(--up); background: rgba(75,191,115,0.14); }
.fx-pill.is-partial { color: var(--amber); background: var(--amber-soft); }
.fx-pill.is-gap { color: var(--down); background: rgba(240,101,106,0.14); }
.fx-pill.is-ev { color: var(--info); background: var(--info-soft); }

.fx-lenses { display: flex; flex-wrap: wrap; gap: 0.4rem; border-top: 1px solid var(--line); padding-top: 0.9rem; }
.fx-lens {
  border: 1px solid var(--line-2); background: transparent; color: var(--text-2);
  border-radius: 999px; padding: 0.3rem 0.8rem; font-size: var(--fs-xs); font-weight: 600; cursor: pointer;
  transition: border-color .14s, background .14s, color .14s;
}
.fx-lens:hover { border-color: var(--accent); color: var(--text); }
.fx-lens:focus-visible { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.fx-lens[aria-pressed='true'] { background: var(--accent); border-color: var(--accent); color: #17130a; }
.fx-lensnote { margin: 0; font-size: var(--fs-sm); color: var(--text-3); }
.fx-lensnote b { color: var(--text); }

.fx-group { display: flex; flex-direction: column; gap: 0.55rem; }
.fx-grouph { display: flex; align-items: baseline; gap: 0.6rem; flex-wrap: wrap; border-top: 1px solid var(--line); padding-top: 0.8rem; }
.fx-grouph h2 { margin: 0; font-size: var(--fs-md); font-weight: 640; }
.fx-groupn {
  font-size: 0.56rem; font-weight: 700; color: var(--accent); background: var(--accent-soft);
  border-radius: 999px; padding: 0.08rem 0.42rem; font-variant-numeric: tabular-nums;
}
.fx-groupnote { font-size: var(--fs-xs); color: var(--text-3); }

.fx-tablewrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); }
.fx-table { width: 100%; border-collapse: collapse; min-width: 1040px; font-size: var(--fs-xs); }
.fx-table th, .fx-table td { padding: 0.55rem 0.65rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
.fx-table tbody tr:last-child td { border-bottom: none; }
.fx-table tbody tr:hover td { background: var(--surface-2); }
.fx-table th {
  font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700;
  color: var(--text-3); background: var(--surface-2); position: sticky; top: 0;
}
.fx-num { text-align: right; font-variant-numeric: tabular-nums; }

.fx-fname { min-width: 230px; }
.fx-fname b { display: block; font-size: var(--fs-sm); color: var(--text); }
.fx-what { display: block; margin-top: 0.2rem; color: var(--text-3); line-height: 1.4; }
.fx-tags { display: flex; gap: 0.3rem; margin-top: 0.35rem; flex-wrap: wrap; }
.fx-tag {
  font-size: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700;
  border-radius: 3px; padding: 0.04rem 0.3rem;
}
.st-opening { color: var(--up); background: rgba(75,191,115,0.14); }
.st-copyable { color: var(--accent); background: var(--accent-soft); }
.st-moat { color: var(--down); background: rgba(240,101,106,0.14); }
.st-commodity { color: var(--neutral); background: rgba(139,148,158,0.14); }
.fx-tag--mod { color: var(--text-3); background: rgba(255,255,255,0.05); }

.fx-demand { min-width: 88px; }
.fx-demand b { font-size: var(--fs-sm); }
.fx-bar { display: block; height: 0.25rem; margin: 0.25rem 0; border-radius: 999px; background: var(--line-2); overflow: hidden; }
.fx-bar span { display: block; height: 100%; border-radius: inherit; }
.fx-bar .is-high { background: var(--up); }
.fx-bar .is-mid { background: var(--amber); }
.fx-bar .is-low { background: var(--neutral); }
.fx-basis { font-size: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
.fx-basis.is-ev { color: var(--info); }
.fx-basis.is-hyp { color: var(--text-3); }
.fx-opp { font-weight: 700; color: var(--accent); }

.fx-ships { min-width: 150px; }
.fx-ship { display: inline-block; margin: 0 0.25rem 0.2rem 0; padding: 0.04rem 0.32rem; border-radius: 3px; background: rgba(255,255,255,0.05); color: var(--text-2); font-size: 0.58rem; }
.fx-nobody { color: var(--up); font-weight: 700; font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.04em; }

.fx-owners { min-width: 175px; }
.fx-owner { display: block; margin-bottom: 0.2rem; font-size: 0.6rem; font-family: var(--mono, ui-monospace), monospace; }
.ok-tritfabric { color: var(--teal); }
.ok-tritrpc { color: var(--cyan); }
.ok-model { color: var(--info); }
.ok-estate { color: var(--text-2); }
.ok-none { color: var(--down); font-weight: 700; }

.fx-ready {
  display: inline-block; font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.05em;
  font-weight: 700; border-radius: 3px; padding: 0.05rem 0.34rem; margin-bottom: 0.25rem;
}
.rd-have { color: var(--up); background: rgba(75,191,115,0.14); }
.rd-partial { color: var(--amber); background: var(--amber-soft); }
.rd-gap { color: var(--down); background: rgba(240,101,106,0.14); }
.fx-gapnote { display: block; color: var(--text-3); line-height: 1.4; }

.fx-angle { min-width: 250px; color: var(--text-2); line-height: 1.45; }

@media (max-width: 720px) { .fx { padding: 0.85rem 0.9rem 2rem; } }
</style>
