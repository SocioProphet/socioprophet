<template>
  <section class="dc" aria-label="Data catalogue">
    <header class="dc-head">
      <div>
        <p class="dc-eyebrow">SocioProphet · Data Catalogue</p>
        <h1>Every source, graded honestly</h1>
        <p class="dc-lede">
          The whole registry the cockpit reads from — {{ sources.length }} sources, {{ liveCount }} live, feeding
          {{ countries.length }} countries. We grade our own data A–F and say plainly where it's thin. The world
          is mostly <em>not</em> an A — that's the truth, not a gap we hide.
        </p>
      </div>
      <span class="dc-asof">{{ asOf }}</span>
    </header>

    <!-- honest world distribution: one glance says "coverage is uneven" -->
    <div class="dc-dist" role="img" :aria-label="`World coverage: ${dist.map(d => d.count + ' ' + d.grade).join(', ')}`">
      <span class="dc-dist-label">World coverage grade</span>
      <div class="dc-dist-bar">
        <span v-for="d in dist" :key="d.grade" class="dc-dist-seg" :class="'g-' + d.grade"
              :style="{ flexGrow: d.count || 0.001 }" :title="`${d.count} countries graded ${d.grade} — ${gradeLabel[d.grade]}`">
          <span v-if="d.count" class="dc-dist-seg-lbl">{{ d.grade }} · {{ d.count }}</span>
        </span>
      </div>
    </div>

    <nav class="dc-tabs">
      <button :class="{ on: tab === 'sources' }" @click="tab = 'sources'">Sources <span class="dc-tab-n">{{ sources.length }}</span></button>
      <button :class="{ on: tab === 'world' }" @click="tab = 'world'">World coverage <span class="dc-tab-n">{{ countries.length }}</span></button>
    </nav>

    <!-- ── SOURCES ─────────────────────────────────────────────────────── -->
    <div v-if="tab === 'sources'" class="dc-panel">
      <div class="dc-filters">
        <input v-model="q" class="dc-search" type="search" placeholder="Search sources, upstreams, surfaces…" aria-label="Search sources" spellcheck="false" />
        <select v-model="fDomain" aria-label="Filter by domain"><option value="">All domains</option><option v-for="d in domains" :key="d" :value="d">{{ d }}</option></select>
        <select v-model="fStatus" aria-label="Filter by status"><option value="">All status</option><option value="live">Live</option><option value="fixture">Fixture</option><option value="planned">Planned</option></select>
        <select v-model="fGrade" aria-label="Filter by grade"><option value="">All grades</option><option v-for="g in gradeOrder" :key="g" :value="g">Grade {{ g }}</option></select>
        <span class="dc-count">{{ filteredSources.length }} / {{ sources.length }}</span>
      </div>
      <div class="dc-table-wrap">
        <table class="dc-table">
          <thead>
            <tr><th>Source</th><th>Domain</th><th>Real upstream</th><th>Status</th><th title="Data-quality grade">Quality</th><th title="How we acquire it (T0 API … T4 unblocker)">Tier</th><th title="Right-to-acquire / compliance grade">Compliance</th><th>Scope</th><th>Key</th></tr>
          </thead>
          <tbody>
            <tr v-for="s in filteredSources" :key="s.id">
              <td class="dc-td-name">
                <span class="dc-name">{{ s.name }}</span>
                <a v-if="s.endpoint" class="dc-ep" :href="s.endpoint" target="_blank" rel="noopener">{{ epHost(s.endpoint) }} ↗</a>
                <span v-else class="dc-ep muted">{{ s.adapter || '—' }}</span>
              </td>
              <td><span class="dc-dom">{{ s.domain }}</span></td>
              <td class="dc-td-up">{{ s.upstream }}<span class="dc-feeds">{{ s.feeds.join(' · ') }}</span></td>
              <td><span class="dc-status" :class="s.status">{{ s.status }}</span></td>
              <td><span class="dc-grade" :class="'g-' + s.grade" :title="s.gradeNote">{{ s.grade }}</span></td>
              <td><span class="dc-tier" :class="'t-' + acq(s.id).profile.tier" :title="tierLabel[acq(s.id).profile.tier]">{{ acq(s.id).profile.tier }}</span></td>
              <td><span class="dc-grade" :class="'g-' + acq(s.id).grade" :title="complianceNote(s.id)">{{ acq(s.id).grade }}</span></td>
              <td class="dc-td-scope">{{ scopeLabel[s.scope] }}</td>
              <td><span class="dc-key" :class="s.keyReq">{{ keyLabel[s.keyReq] }}</span></td>
            </tr>
            <tr v-if="!filteredSources.length"><td colspan="9" class="dc-empty">No sources match those filters.</td></tr>
          </tbody>
        </table>
      </div>
      <p class="dc-note">
        Grades are honest and specific — hover a grade for the caveat. “No-key” sources are free open feeds we call
        straight from the browser; that’s the moat. Fixtures name the real upstream they stand in for.
      </p>
    </div>

    <!-- ── WORLD COVERAGE ──────────────────────────────────────────────── -->
    <div v-else class="dc-panel">
      <div class="dc-regions">
        <button v-for="r in regionRollup" :key="r.region" class="dc-region" :class="{ on: fRegion === r.region }"
                @click="fRegion = fRegion === r.region ? '' : r.region">
          <span class="dc-region-name">{{ r.region }}</span>
          <span class="dc-region-median">median <span class="dc-grade sm" :class="'g-' + r.medianGrade">{{ r.medianGrade }}</span></span>
          <span class="dc-region-mini">
            <span v-for="g in gradeOrder" :key="g" v-show="r.dist[g]" class="dc-mini-seg" :class="'g-' + g" :style="{ flexGrow: r.dist[g] }" :title="`${r.dist[g]} ${g}`"></span>
          </span>
        </button>
      </div>
      <div class="dc-filters">
        <input v-model="cq" class="dc-search" type="search" placeholder="Search a country…" aria-label="Search countries" spellcheck="false" />
        <select v-model="fCGrade" aria-label="Filter countries by grade"><option value="">All grades</option><option v-for="g in gradeOrder" :key="g" :value="g">Grade {{ g }} — {{ gradeLabel[g] }}</option></select>
        <span class="dc-count">{{ filteredCountries.length }} / {{ countries.length }}</span>
      </div>
      <div class="dc-countries">
        <button v-for="c in filteredCountries" :key="c.iso" class="dc-country" :class="{ open: openIso === c.iso }" @click="openIso = openIso === c.iso ? '' : c.iso">
          <span class="dc-grade" :class="'g-' + c.grade">{{ c.grade }}</span>
          <span class="dc-country-name">{{ c.name }}</span>
          <span class="dc-country-meta">{{ c.liveCount }} live · {{ c.totalCount }} sources</span>
        </button>
      </div>
      <div v-if="openCountry" class="dc-detail">
        <div class="dc-detail-head">
          <span class="dc-grade lg" :class="'g-' + openCountry.grade">{{ openCountry.grade }}</span>
          <div>
            <strong>{{ openCountry.name }}</strong>
            <span class="dc-detail-sub">{{ openCountry.region }} · {{ incomeLabel[openCountry.income] }} · {{ gradeLabel[openCountry.grade] }} coverage · {{ (openCountry.pct * 100).toFixed(0) }}% of the US ceiling</span>
          </div>
        </div>
        <div class="dc-hits">
          <div v-for="h in openCountry.hits" :key="h.id" class="dc-hit">
            <span class="dc-grade sm" :class="'g-' + h.grade">{{ h.grade }}</span>
            <span class="dc-hit-name">{{ h.name }}</span>
            <span v-if="h.live" class="dc-live">live</span>
            <span class="dc-hit-frac" :title="'coverage weight in this country'">{{ (h.fraction * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
      <p class="dc-note">
        Country grades are <em>modeled</em>: each source’s real geographic scope × the country’s World-Bank income tier
        (a proxy for open-data availability and OSM mapping density), normalised to the best-covered country (the US).
        Only the US earns an A — it holds the US federal stack nobody else does. Low-income and conflict-affected states
        grade D/F because the honest answer is the data there is sparse.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { DATA_SOURCES, GRADE_ORDER, type Grade, type CoverageModel, type KeyReq, type SourceDomain } from '../data/dataSources';
import type { Income } from '../data/countries';
import { allCoverage, regionSummaries, worldGradeDistribution, GRADE_LABEL } from '../features/catalogue/coverage';
import { acquisitionFor } from '../data/acquisitionProfiles';
import type { AcquisitionTier } from '../features/acquisition/policy';

const tab = ref<'sources' | 'world'>('sources');
const sources = DATA_SOURCES;
const countries = allCoverage();
const dist = worldGradeDistribution();
const regionRollup = regionSummaries();
const gradeOrder = GRADE_ORDER;
const gradeLabel = GRADE_LABEL;
const liveCount = sources.filter((s) => s.status === 'live').length;
const domains = computed(() => [...new Set(sources.map((s) => s.domain))].sort() as SourceDomain[]);

// Sources filters
const q = ref('');
const fDomain = ref('');
const fStatus = ref('');
const fGrade = ref('');
const filteredSources = computed(() => {
  const needle = q.value.trim().toLowerCase();
  return sources.filter((s) => {
    if (fDomain.value && s.domain !== fDomain.value) return false;
    if (fStatus.value && s.status !== fStatus.value) return false;
    if (fGrade.value && s.grade !== fGrade.value) return false;
    if (!needle) return true;
    return (s.name + ' ' + s.upstream + ' ' + s.domain + ' ' + s.feeds.join(' ') + ' ' + (s.endpoint || '')).toLowerCase().includes(needle);
  });
});

// Country filters
const cq = ref('');
const fRegion = ref('');
const fCGrade = ref('');
const openIso = ref('');
const filteredCountries = computed(() => {
  const needle = cq.value.trim().toLowerCase();
  return countries.filter((c) => {
    if (fRegion.value && c.region !== fRegion.value) return false;
    if (fCGrade.value && c.grade !== fCGrade.value) return false;
    if (!needle) return true;
    return (c.name + ' ' + c.iso).toLowerCase().includes(needle);
  });
});
const openCountry = computed(() => countries.find((c) => c.iso === openIso.value));

const scopeLabel: Record<CoverageModel, string> = {
  'us': 'US only', 'us-metros': 'US metros', 'geo-global': 'Global (physical)', 'mapped-global': 'Global (OSM)',
  'stats-global': 'Global (stats)', 'media-global': 'Global (media)', 'markets-global': 'Global (markets)',
  'sparse-global': 'Global (sparse)', 'sovereign': 'Sovereign',
};
const keyLabel: Record<KeyReq, string> = { 'none': 'no-key', 'free-tier': 'free key', 'commercial': 'paid', 'sovereign': 'sovereign' };
const incomeLabel: Record<Income, string> = { H: 'high income', UM: 'upper-middle income', LM: 'lower-middle income', L: 'low income' };
function epHost(url: string): string { try { return new URL(url).host; } catch { return url; } }
const acq = (id: string) => acquisitionFor(id);
const tierLabel: Record<AcquisitionTier, string> = {
  T0: 'T0 — official API / open dump', T1: 'T1 — polite static HTTP', T2: 'T2 — rotating egress / proxy',
  T3: 'T3 — headless browser', T4: 'T4 — managed unblocker (anti-bot wall)',
};
function complianceNote(id: string): string {
  const { profile: p, grade } = acquisitionFor(id);
  const bits = [`right-to-acquire ${grade}`, `robots ${p.policy.robots}`, `ToS ${p.policy.tos}`, p.policy.pii ? 'PII' : 'no PII', p.policy.legalBasis];
  return bits.join(' · ');
}
const asOf = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
</script>

<style scoped>
.dc { height: 100%; min-height: 0; overflow-y: auto; padding: 1rem 1.2rem 2rem; background: var(--bg); color: var(--text); }
.dc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.dc-eyebrow { margin: 0 0 0.15rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-3); }
.dc-head h1 { margin: 0 0 0.35rem; font-size: 1.5rem; letter-spacing: -0.02em; font-weight: 660; }
.dc-lede { margin: 0; max-width: 74ch; font-size: 0.86rem; line-height: 1.6; color: var(--text-2); }
.dc-lede em { color: var(--text); font-style: normal; font-weight: 600; }
.dc-asof { flex: 0 0 auto; font-size: 0.72rem; color: var(--text-3); font-family: ui-monospace, monospace; }

.dc-dist { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1.1rem; padding: 0.7rem 0.9rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
.dc-dist-label { flex: 0 0 auto; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); }
.dc-dist-bar { flex: 1; display: flex; height: 22px; border-radius: 6px; overflow: hidden; gap: 2px; }
.dc-dist-seg { display: grid; place-items: center; min-width: 2px; transition: flex-grow 0.3s; }
.dc-dist-seg-lbl { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.02em; color: #0c0f14; white-space: nowrap; padding: 0 0.2rem; }

.dc-tabs { display: flex; gap: 0.4rem; margin-bottom: 1rem; border-bottom: 1px solid var(--line); }
.dc-tabs button { border: none; background: transparent; color: var(--text-3); padding: 0.5rem 0.2rem; margin-right: 0.8rem; font: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.dc-tabs button.on { color: var(--text); border-bottom-color: var(--accent); }
.dc-tab-n { font-size: 0.68rem; color: var(--text-3); font-variant-numeric: tabular-nums; margin-left: 0.2rem; }

.dc-filters { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.8rem; }
.dc-search { flex: 1; min-width: 200px; background: var(--surface); border: 1px solid var(--line-2); border-radius: 8px; color: var(--text); padding: 0.45rem 0.7rem; font: inherit; font-size: 0.84rem; }
.dc-search::placeholder { color: var(--text-3); }
.dc-filters select { background: var(--surface); border: 1px solid var(--line-2); border-radius: 8px; color: var(--text-2); padding: 0.45rem 0.55rem; font: inherit; font-size: 0.8rem; cursor: pointer; }
.dc-count { font-size: 0.72rem; color: var(--text-3); font-variant-numeric: tabular-nums; white-space: nowrap; }

.dc-table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius); }
.dc-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
.dc-table th { text-align: left; padding: 0.55rem 0.7rem; font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); border-bottom: 1px solid var(--line-2); background: var(--surface-2); position: sticky; top: 0; z-index: 1; white-space: nowrap; }
.dc-table td { padding: 0.5rem 0.7rem; border-bottom: 1px solid var(--line); color: var(--text-2); vertical-align: top; }
.dc-table tr:last-child td { border-bottom: none; }
.dc-table tbody tr:hover { background: var(--surface); }
.dc-td-name { min-width: 12rem; }
.dc-name { display: block; color: var(--text); font-weight: 620; }
.dc-ep { font-size: 0.68rem; color: var(--accent); text-decoration: none; font-family: ui-monospace, monospace; }
.dc-ep.muted { color: var(--text-3); } .dc-ep:hover:not(.muted) { text-decoration: underline; }
.dc-dom { font-size: 0.68rem; color: var(--text-2); white-space: nowrap; }
.dc-td-up { max-width: 24rem; }
.dc-feeds { display: block; margin-top: 0.15rem; font-size: 0.68rem; color: var(--text-3); }
.dc-td-scope, .dc-td-lic { font-size: 0.72rem; white-space: nowrap; color: var(--text-3); }
.dc-status { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; }
.dc-status.live { color: #7ee2a8; background: rgba(75, 191, 115, 0.15); } .dc-status.fixture { color: #f0c987; background: rgba(227, 179, 65, 0.15); } .dc-status.planned { color: #93b4ff; background: rgba(120, 160, 255, 0.15); }
.dc-key { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.03em; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; white-space: nowrap; }
.dc-key.none { color: #7ee2a8; background: rgba(75, 191, 115, 0.12); } .dc-key.free-tier { color: #93b4ff; background: rgba(120, 160, 255, 0.12); } .dc-key.commercial { color: #f0883e; background: rgba(240, 136, 62, 0.14); } .dc-key.sovereign { color: var(--accent); background: var(--accent-soft); }
.dc-tier { display: inline-grid; place-items: center; min-width: 1.7rem; height: 1.25rem; border-radius: 4px; font-size: 0.62rem; font-weight: 800; font-variant-numeric: tabular-nums; color: #0c0f14; }
.dc-tier.t-T0 { background: #4bbf73; } .dc-tier.t-T1 { background: #7fca8f; } .dc-tier.t-T2 { background: #6ea8fe; } .dc-tier.t-T3 { background: #d8a250; } .dc-tier.t-T4 { background: #e5646a; }

/* Grade chips — the single visual grammar shared by sources + countries */
.dc-grade { display: inline-grid; place-items: center; min-width: 1.35rem; height: 1.35rem; border-radius: 5px; font-size: 0.74rem; font-weight: 800; color: #0c0f14; }
.dc-grade.sm { min-width: 1.1rem; height: 1.1rem; font-size: 0.64rem; border-radius: 4px; }
.dc-grade.lg { min-width: 2.4rem; height: 2.4rem; font-size: 1.2rem; border-radius: 8px; }
.g-A { background: #4bbf73; } .g-B { background: #6ea8fe; } .g-C { background: #d8a250; } .g-D { background: #f0883e; } .g-F { background: #e5646a; }
.dc-dist-seg.g-A { background: #4bbf73; } .dc-dist-seg.g-B { background: #6ea8fe; } .dc-dist-seg.g-C { background: #d8a250; } .dc-dist-seg.g-D { background: #f0883e; } .dc-dist-seg.g-F { background: #e5646a; }
.dc-mini-seg.g-A { background: #4bbf73; } .dc-mini-seg.g-B { background: #6ea8fe; } .dc-mini-seg.g-C { background: #d8a250; } .dc-mini-seg.g-D { background: #f0883e; } .dc-mini-seg.g-F { background: #e5646a; }

.dc-note { margin: 0.8rem 0 0; font-size: 0.74rem; line-height: 1.55; color: var(--text-3); max-width: 82ch; }
.dc-note em { color: var(--text-2); font-style: normal; }
.dc-empty { padding: 1.4rem; text-align: center; color: var(--text-3); }

/* World coverage */
.dc-regions { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.55rem; margin-bottom: 1rem; }
.dc-region { text-align: left; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); padding: 0.6rem 0.7rem; cursor: pointer; display: flex; flex-direction: column; gap: 0.4rem; }
.dc-region.on { border-color: var(--accent); background: var(--surface-2); }
.dc-region-name { font-size: 0.78rem; font-weight: 640; color: var(--text); }
.dc-region-median { font-size: 0.64rem; color: var(--text-3); display: flex; align-items: center; gap: 0.3rem; }
.dc-region-mini { display: flex; height: 5px; border-radius: 3px; overflow: hidden; gap: 1px; }
.dc-mini-seg { min-width: 1px; }
.dc-countries { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 0.4rem; }
.dc-country { display: flex; align-items: center; gap: 0.5rem; text-align: left; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); padding: 0.4rem 0.5rem; cursor: pointer; }
.dc-country:hover { background: var(--surface-2); }
.dc-country.open { border-color: var(--accent); }
.dc-country-name { font-size: 0.8rem; color: var(--text); font-weight: 560; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dc-country-meta { margin-left: auto; font-size: 0.62rem; color: var(--text-3); white-space: nowrap; font-variant-numeric: tabular-nums; }
.dc-detail { margin-top: 0.9rem; border: 1px solid var(--line-2); border-radius: var(--radius); background: var(--surface); padding: 0.9rem 1rem; }
.dc-detail-head { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 0.8rem; }
.dc-detail-head strong { display: block; font-size: 1rem; color: var(--text); }
.dc-detail-sub { font-size: 0.72rem; color: var(--text-3); }
.dc-hits { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 0.4rem; }
.dc-hit { display: flex; align-items: center; gap: 0.45rem; padding: 0.35rem 0.5rem; border: 1px solid var(--line); border-radius: 7px; background: var(--bg); }
.dc-hit-name { font-size: 0.76rem; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dc-live { font-size: 0.52rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; color: #7ee2a8; background: rgba(75, 191, 115, 0.15); border-radius: 3px; padding: 0.02rem 0.25rem; }
.dc-hit-frac { margin-left: auto; font-size: 0.68rem; color: var(--text-3); font-variant-numeric: tabular-nums; }
</style>
