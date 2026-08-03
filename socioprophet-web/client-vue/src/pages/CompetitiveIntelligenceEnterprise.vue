<script setup lang="ts">
// Market 2 — Professional & market intelligence. Deliberately its own machine.
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import {
  professionalIntelligenceMarket as m,
  moatArchetypeLabel,
} from '../features/competitive-intelligence/marketProfessionalIntelligence';

const byDurability = computed(() => [...m.specimens].sort((a, b) => b.durability - a.durability));

function durTone(v: number): string {
  if (v >= 80) return 'is-high';
  if (v >= 60) return 'is-mid';
  return 'is-low';
}
</script>

<template>
  <section class="ep" aria-labelledby="ep-title">
    <RouterLink class="ep-back" to="/professional-intelligence/competitive/markets">← Market Portfolio</RouterLink>

    <SurfaceHeader title="Professional & Market Intelligence" eyebrow="Competitive Intelligence · market 2">
      <template #badge>
        <span class="ep-badge">{{ m.specimens.length }} specimens</span>
        <span class="ep-badge ep-badge--fixture">fixture</span>
      </template>
    </SurfaceHeader>

    <p id="ep-title" class="ep-lede">{{ m.lede }}</p>

    <BoundaryNotice
      label="fixture · research digest"
      tone="muted"
      :message="m.sourcing"
      aria-label="Enterprise market boundary"
    />

    <p class="ep-thesis"><span class="ep-thesis-k">Thesis</span>{{ m.thesis }}</p>

    <!-- OUR READ -->
    <section class="ep-read" aria-label="Our read">
      <div class="ep-read-h">
        <h2>Our read</h2>
        <span class="ep-read-tag">where we can actually win</span>
      </div>
      <p>{{ m.ourRead }}</p>
    </section>

    <!-- THE MACHINE -->
    <section class="ep-block" aria-label="This market's machine">
      <div class="ep-h">
        <h2>This market's machine — seven steps</h2>
        <p>Not the consumer loop. No virality, no watermark, no streak. Trust, substrate and deployability.</p>
      </div>
      <div class="ep-steps">
        <article v-for="step in m.machine" :key="step.index" class="ep-step">
          <span class="ep-step-n">{{ String(step.index).padStart(2, '0') }}</span>
          <div>
            <h3>{{ step.name }}</h3>
            <p>{{ step.detail }}</p>
            <p class="ep-seen"><span>seen in</span> {{ step.exemplars }}</p>
          </div>
        </article>
      </div>
    </section>

    <!-- SPECIMENS -->
    <section class="ep-block" aria-label="Specimens">
      <div class="ep-h">
        <h2>Specimens by moat durability</h2>
        <p>Ranked by how defensible the moat actually is — not by revenue. Bloomberg tops it on a 40-year-uncracked transaction network; Meltwater sits last because its operative moat became an auto-renewal clause.</p>
      </div>
      <div class="ep-tablewrap">
        <table class="ep-table">
          <thead>
            <tr>
              <th class="ep-num">Dur.</th>
              <th>Platform</th>
              <th>Moat</th>
              <th>Pricing</th>
              <th>Weakness</th>
              <th>Lesson</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sp in byDurability" :key="sp.name">
              <td class="ep-num ep-dur">
                <b>{{ sp.durability }}</b>
                <span class="ep-bar" aria-hidden="true"><span :class="durTone(sp.durability)" :style="{ width: `${sp.durability}%` }" /></span>
              </td>
              <td class="ep-name">
                <b>{{ sp.name }}</b>
                <span class="ep-job">{{ sp.job }}</span>
                <span class="ep-verdict">{{ sp.verdict }}</span>
              </td>
              <td class="ep-moat">
                <span class="ep-arch">{{ moatArchetypeLabel[sp.moatArchetype] }}</span>
                {{ sp.moat }}
              </td>
              <td class="ep-pricing">
                <span class="ep-conf" :class="`cf-${sp.pricingConfidence}`">{{ sp.pricingConfidence }}</span>
                {{ sp.pricing }}
                <span class="ep-scale">{{ sp.scale }}</span>
              </td>
              <td class="ep-weak">{{ sp.weakness }}</td>
              <td class="ep-lesson">{{ sp.lesson }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- UNSERVED -->
    <section class="ep-block" aria-label="Unserved gaps">
      <div class="ep-h">
        <h2>Where the market is unserved</h2>
        <p>And whether our estate can honestly serve it. Two of these are flat "no" — recorded as such.</p>
      </div>
      <div class="ep-gaps">
        <article v-for="g in m.unserved" :key="g.gap" class="ep-gap" :class="`sv-${g.weCanServe}`">
          <div class="ep-gap-top">
            <h3>{{ g.gap }}</h3>
            <span class="ep-serve" :class="`sv-${g.weCanServe}`">
              {{ g.weCanServe === 'yes' ? 'we can serve' : g.weCanServe === 'partly' ? 'partly' : 'we cannot' }}
            </span>
          </div>
          <p class="ep-gap-ev"><span>Evidence</span>{{ g.evidence }}</p>
          <p class="ep-gap-us"><span>Our position</span>{{ g.ourPosition }}</p>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.ep {
  height: 100%; min-height: 0; overflow-y: auto;
  padding: 1rem 1.25rem 2.5rem; background: var(--bg); color: var(--text);
  display: flex; flex-direction: column; gap: 1rem;
}
.ep-back {
  align-self: flex-start; font-size: var(--fs-xs); color: var(--text-3);
  text-decoration: none; border: 1px solid var(--line); border-radius: 999px; padding: 0.2rem 0.6rem;
}
.ep-back:hover { color: var(--text); border-color: var(--accent); }

.ep-badge {
  font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;
  color: var(--accent); background: var(--accent-soft); border-radius: 4px; padding: 0.05rem 0.32rem;
}
.ep-badge--fixture { color: var(--amber); background: var(--amber-soft); }

.ep-lede { margin: 0; max-width: 96ch; font-size: var(--fs-base); line-height: 1.55; color: var(--text-2); }

.ep-thesis {
  margin: 0; max-width: 96ch; font-size: var(--fs-sm); line-height: 1.6; color: var(--text);
  border-left: 2px solid var(--accent); padding-left: 0.9rem;
}
.ep-thesis-k {
  display: block; font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.1em;
  font-weight: 700; color: var(--accent); margin-bottom: 0.25rem;
}

.ep-read {
  border: 1px solid var(--accent-soft); border-left: 2px solid var(--teal);
  border-radius: var(--radius-sm); background: rgba(45,212,191,0.07); padding: 0.95rem 1.05rem;
  display: flex; flex-direction: column; gap: 0.45rem;
}
.ep-read-h { display: flex; align-items: baseline; gap: 0.6rem; }
.ep-read-h h2 { margin: 0; font-size: var(--fs-md); font-weight: 640; }
.ep-read-tag { font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; color: var(--teal); }
.ep-read p { margin: 0; font-size: var(--fs-sm); line-height: 1.6; color: var(--text); max-width: 96ch; }

h2 { margin: 0; font-size: var(--fs-lg); font-weight: 640; letter-spacing: -0.01em; }
h3 { margin: 0; font-size: var(--fs-base); font-weight: 640; }

.ep-block { display: flex; flex-direction: column; gap: 0.8rem; }
.ep-h { display: flex; flex-direction: column; gap: 0.2rem; border-top: 1px solid var(--line); padding-top: 0.9rem; }
.ep-h p { margin: 0; font-size: var(--fs-sm); color: var(--text-3); max-width: 96ch; line-height: 1.5; }

.ep-steps {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1px;
  background: var(--line); border: 1px solid var(--line); border-radius: var(--radius-sm); overflow: hidden;
}
.ep-step { display: flex; gap: 0.65rem; padding: 0.8rem 0.9rem; background: var(--surface); }
.ep-step-n { font-family: var(--mono, ui-monospace), monospace; font-size: 0.7rem; font-weight: 700; color: var(--accent); padding-top: 0.15rem; }
.ep-step p { margin: 0.3rem 0 0; font-size: var(--fs-sm); color: var(--text-3); line-height: 1.45; }
.ep-seen { font-size: var(--fs-xs); }
.ep-seen span {
  text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.56rem; font-weight: 700;
  color: var(--text-3); margin-right: 0.35rem;
}

.ep-tablewrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); }
.ep-table { width: 100%; border-collapse: collapse; min-width: 1140px; font-size: var(--fs-xs); }
.ep-table th, .ep-table td { padding: 0.55rem 0.65rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
.ep-table tbody tr:last-child td { border-bottom: none; }
.ep-table tbody tr:hover td { background: var(--surface-2); }
.ep-table th {
  font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700;
  color: var(--text-3); background: var(--surface-2); position: sticky; top: 0;
}
.ep-num { text-align: right; font-variant-numeric: tabular-nums; }
.ep-dur { width: 74px; }
.ep-dur b { font-size: var(--fs-sm); }
.ep-bar { display: block; height: 0.25rem; margin-top: 0.25rem; border-radius: 999px; background: var(--line-2); overflow: hidden; }
.ep-bar span { display: block; height: 100%; border-radius: inherit; }
.ep-bar .is-high { background: var(--up); }
.ep-bar .is-mid { background: var(--amber); }
.ep-bar .is-low { background: var(--down); }

.ep-name { min-width: 190px; }
.ep-name b { display: block; font-size: var(--fs-sm); color: var(--text); }
.ep-job { display: block; margin-top: 0.2rem; color: var(--text-3); line-height: 1.4; }
.ep-verdict { display: block; margin-top: 0.3rem; color: var(--accent); line-height: 1.4; font-size: 0.62rem; }

.ep-moat { min-width: 230px; color: var(--text-2); line-height: 1.45; }
.ep-arch {
  display: inline-block; margin-bottom: 0.25rem; font-size: 0.5rem; text-transform: uppercase;
  letter-spacing: 0.05em; font-weight: 700; border-radius: 3px; padding: 0.04rem 0.3rem;
  color: var(--teal); background: rgba(45,212,191,0.13);
}
.ep-pricing { min-width: 210px; color: var(--text-2); line-height: 1.45; }
.ep-conf {
  display: inline-block; margin-bottom: 0.25rem; font-size: 0.5rem; text-transform: uppercase;
  letter-spacing: 0.05em; font-weight: 700; border-radius: 3px; padding: 0.04rem 0.3rem;
}
.cf-confirmed { color: var(--up); background: rgba(75,191,115,0.14); }
.cf-estimate { color: var(--amber); background: var(--amber-soft); }
.cf-none { color: var(--neutral); background: rgba(139,148,158,0.14); }
.ep-scale { display: block; margin-top: 0.3rem; color: var(--text-3); font-size: 0.62rem; line-height: 1.4; }

.ep-weak { min-width: 220px; color: var(--text-3); line-height: 1.45; }
.ep-lesson { min-width: 220px; color: var(--text); line-height: 1.45; }

.ep-gaps { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 0.8rem; }
.ep-gap {
  border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface);
  padding: 0.85rem 0.95rem; display: flex; flex-direction: column; gap: 0.5rem;
}
.ep-gap.sv-yes { border-left: 2px solid var(--up); }
.ep-gap.sv-partly { border-left: 2px solid var(--amber); }
.ep-gap.sv-no { border-left: 2px solid var(--down); }
.ep-gap-top { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
.ep-serve {
  font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;
  border-radius: 3px; padding: 0.05rem 0.34rem; white-space: nowrap;
}
.ep-serve.sv-yes { color: var(--up); background: rgba(75,191,115,0.14); }
.ep-serve.sv-partly { color: var(--amber); background: var(--amber-soft); }
.ep-serve.sv-no { color: var(--down); background: rgba(240,101,106,0.14); }
.ep-gap p { margin: 0; font-size: var(--fs-xs); line-height: 1.5; color: var(--text-2); }
.ep-gap p span {
  display: block; font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.07em;
  font-weight: 700; color: var(--text-3); margin-bottom: 0.15rem;
}
.ep-gap-us span { color: var(--teal) !important; }

@media (max-width: 720px) { .ep { padding: 0.85rem 0.9rem 2rem; } }
</style>
