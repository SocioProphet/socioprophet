<script setup lang="ts">
// Market portfolio — every market the estate competes in, and how much competitive
// intelligence coverage each actually has. Built to make the gaps visible.
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import { markets, coverageLabel, coverageTotals } from '../features/competitive-intelligence/markets';

const totals = computed(() => coverageTotals());
const ordered = computed(() => {
  const rank = { covered: 0, 'in-progress': 1, none: 2 } as const;
  return [...markets].sort((a, b) => rank[a.coverage] - rank[b.coverage]);
});
const pct = computed(() => Math.round((totals.value.covered / totals.value.total) * 100));
</script>

<template>
  <section class="mk" aria-labelledby="mk-title">
    <RouterLink class="mk-back" to="/professional-intelligence/competitive">← Competitive Intelligence</RouterLink>

    <SurfaceHeader title="Market Portfolio" eyebrow="Competitive Intelligence · coverage">
      <template #badge>
        <span class="mk-badge">{{ totals.covered }}/{{ totals.total }} covered</span>
        <span class="mk-badge mk-badge--fixture">fixture</span>
      </template>
    </SurfaceHeader>

    <p id="mk-title" class="mk-lede">
      Every market the estate competes in, and how much competitive intelligence each one actually has.
      This page exists to answer one question honestly — <b>do we have this for every market?</b>
      Today: <b>no</b>. {{ totals.covered }} of {{ totals.total }} covered, {{ totals.none }} with nothing at all.
    </p>

    <BoundaryNotice
      label="fixture · coverage register"
      tone="warning"
      message="Coverage status is a declared register, not a measurement. An 'in progress' or 'no coverage' market means exactly that — no teardown data exists behind it yet, and nothing on this page should be read as an assessment of those markets."
      aria-label="Market coverage boundary"
    />

    <div class="mk-meter">
      <div class="mk-meter-h">
        <span class="mk-meter-k">Portfolio coverage</span>
        <b class="mk-meter-v">{{ pct }}%</b>
      </div>
      <div class="mk-meter-bar" aria-hidden="true">
        <span class="is-covered" :style="{ width: `${(totals.covered / totals.total) * 100}%` }" />
        <span class="is-progress" :style="{ width: `${(totals.inProgress / totals.total) * 100}%` }" />
      </div>
      <div class="mk-meter-legend">
        <span class="mk-pill is-covered">{{ totals.covered }} covered</span>
        <span class="mk-pill is-progress">{{ totals.inProgress }} in progress</span>
        <span class="mk-pill is-none">{{ totals.none }} no coverage</span>
        <span class="mk-pill is-spec">{{ totals.specimens }} specimens torn down</span>
      </div>
    </div>

    <div class="mk-grid">
      <article
        v-for="m in ordered"
        :key="m.id"
        class="mk-card"
        :class="`cv-${m.coverage}`"
      >
        <div class="mk-top">
          <h2>{{ m.name }}</h2>
          <span class="mk-cov" :class="`cv-${m.coverage}`">{{ coverageLabel[m.coverage] }}</span>
        </div>
        <p class="mk-arena">{{ m.arena }}</p>

        <dl class="mk-dl">
          <dt>Our surfaces</dt>
          <dd>
            <span v-for="s in m.ourSurfaces" :key="s" class="mk-chip mk-chip--ours">{{ s }}</span>
          </dd>
          <dt>Rivals</dt>
          <dd>
            <span v-for="r in m.rivals" :key="r" class="mk-chip">{{ r }}</span>
          </dd>
        </dl>

        <p class="mk-note">{{ m.note }}</p>

        <div v-if="m.machine" class="mk-machine">
          <span class="mk-machine-k">This market's machine</span>
          <ol>
            <li v-for="(step, i) in m.machine" :key="step.name">
              <span class="mk-step-n">{{ String(i + 1).padStart(2, '0') }}</span>
              <b>{{ step.name }}</b> — {{ step.detail }}
            </li>
          </ol>
        </div>

        <RouterLink v-if="m.route" class="mk-open" :to="m.route">
          Open coverage — {{ m.specimens }} specimens →
        </RouterLink>
        <span v-else class="mk-empty">
          {{ m.coverage === 'in-progress' ? 'Research underway — no data behind this yet.' : 'No teardown data. This market is unassessed.' }}
        </span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.mk {
  height: 100%; min-height: 0; overflow-y: auto;
  padding: 1rem 1.25rem 2.5rem;
  background: var(--bg); color: var(--text);
  display: flex; flex-direction: column; gap: 1rem;
}
.mk-back {
  align-self: flex-start; font-size: var(--fs-xs); color: var(--text-3);
  text-decoration: none; border: 1px solid var(--line); border-radius: 999px; padding: 0.2rem 0.6rem;
}
.mk-back:hover { color: var(--text); border-color: var(--accent); }

.mk-badge {
  font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;
  color: var(--accent); background: var(--accent-soft); border-radius: 4px; padding: 0.05rem 0.32rem;
  font-variant-numeric: tabular-nums;
}
.mk-badge--fixture { color: var(--amber); background: var(--amber-soft); }

.mk-lede { margin: 0; max-width: 92ch; font-size: var(--fs-base); line-height: 1.55; color: var(--text-2); }
.mk-lede b { color: var(--text); }

.mk-meter {
  border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface);
  padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 0.5rem;
}
.mk-meter-h { display: flex; align-items: baseline; justify-content: space-between; }
.mk-meter-k { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.09em; font-weight: 700; color: var(--text-3); }
.mk-meter-v { font-size: var(--fs-lg); font-variant-numeric: tabular-nums; color: var(--accent); }
.mk-meter-bar { display: flex; height: 0.4rem; border-radius: 999px; background: var(--line-2); overflow: hidden; }
.mk-meter-bar span { display: block; height: 100%; }
.mk-meter-bar .is-covered { background: var(--up); }
.mk-meter-bar .is-progress { background: var(--amber); }
.mk-meter-legend { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.mk-pill {
  font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;
  border-radius: 999px; padding: 0.12rem 0.5rem; font-variant-numeric: tabular-nums;
}
.mk-pill.is-covered { color: var(--up); background: rgba(75,191,115,0.14); }
.mk-pill.is-progress { color: var(--amber); background: var(--amber-soft); }
.mk-pill.is-none { color: var(--down); background: rgba(240,101,106,0.14); }
.mk-pill.is-spec { color: var(--info); background: var(--info-soft); }

.mk-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 0.9rem; }

.mk-card {
  border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface);
  padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.6rem;
}
.mk-card.cv-covered { border-left: 2px solid var(--up); }
.mk-card.cv-in-progress { border-left: 2px solid var(--amber); }
.mk-card.cv-none { border-left: 2px solid var(--down); opacity: 0.92; }

.mk-top { display: flex; align-items: baseline; justify-content: space-between; gap: 0.6rem; }
.mk-top h2 { margin: 0; font-size: var(--fs-md); font-weight: 640; }
.mk-cov {
  font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;
  border-radius: 3px; padding: 0.05rem 0.34rem; white-space: nowrap;
}
.mk-cov.cv-covered { color: var(--up); background: rgba(75,191,115,0.14); }
.mk-cov.cv-in-progress { color: var(--amber); background: var(--amber-soft); }
.mk-cov.cv-none { color: var(--down); background: rgba(240,101,106,0.14); }

.mk-arena { margin: 0; font-size: var(--fs-sm); color: var(--text-2); line-height: 1.45; }

.mk-dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 0.35rem 0.7rem; font-size: var(--fs-xs); }
.mk-dl dt {
  font-size: 0.54rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--text-3); padding-top: 0.15rem; white-space: nowrap;
}
.mk-dl dd { margin: 0; display: flex; flex-wrap: wrap; gap: 0.25rem; }
.mk-chip {
  font-size: 0.58rem; border-radius: 3px; padding: 0.04rem 0.34rem;
  background: rgba(255,255,255,0.05); color: var(--text-3);
}
.mk-chip--ours { color: var(--teal); background: rgba(45,212,191,0.12); }

.mk-note { margin: 0; font-size: var(--fs-xs); color: var(--text-2); line-height: 1.5; }

.mk-machine { border-top: 1px solid var(--line); padding-top: 0.6rem; }
.mk-machine-k { font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; color: var(--accent); }
.mk-machine ol { margin: 0.4rem 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.3rem; }
.mk-machine li { font-size: 0.68rem; color: var(--text-3); line-height: 1.4; }
.mk-machine li b { color: var(--text-2); }
.mk-step-n { font-family: var(--mono, ui-monospace), monospace; color: var(--accent); margin-right: 0.35rem; font-size: 0.6rem; }

.mk-open {
  margin-top: auto; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.06em;
  font-weight: 700; color: var(--accent); text-decoration: none;
}
.mk-open:hover { color: var(--accent-2); }
.mk-empty { margin-top: auto; font-size: 0.62rem; color: var(--text-3); font-style: italic; }

@media (max-width: 720px) { .mk { padding: 0.85rem 0.9rem 2rem; } }
</style>
