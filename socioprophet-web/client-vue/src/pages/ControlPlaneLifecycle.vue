<template>
  <section class="evidence-page" aria-labelledby="sourceos-title">
    <header class="evidence-hero">
      <div>
        <p class="evidence-kicker">SourceOS Control Plane · Lifecycle evidence · {{ state.sourceMode }}</p>
        <h1 id="sourceos-title">{{ state.title }}</h1>
        <p class="evidence-lede">{{ state.lede }}</p>
      </div>
      <div class="evidence-scorecard" aria-label="Control plane demo readiness">
        <span class="evidence-score">{{ state.readiness }}%</span>
        <span class="evidence-score-label">demo readiness</span>
      </div>
    </header>

    <BoundaryNotice :label="state.boundaryLabel" :message="state.boundaryNotice" />

    <RouteStatePanel
      state="mock"
      title="Fixture lifecycle state"
      :message="`${state.lifecycle.length} lifecycle states, ${state.evidenceGates.length} evidence gates, and ${state.blocked.length} blocked actions are loaded from fixture state. No enrollment, assignment, disk write, reboot, or host mutation authority is active.`"
    />

    <section class="evidence-grid evidence-grid--metrics" aria-label="Lifecycle lane completion">
      <article v-for="metric in state.metrics" :key="metric.name" class="evidence-card evidence-metric">
        <div class="evidence-row">
          <span>{{ metric.name }}</span>
          <strong>{{ metric.value }}%</strong>
        </div>
        <div class="evidence-bar" aria-hidden="true"><span :style="{ width: `${metric.value}%` }" /></div>
        <p>{{ metric.note }}</p>
      </article>
    </section>

    <section class="evidence-grid evidence-grid--two">
      <article class="evidence-card">
        <div class="evidence-section-head">
          <div>
            <h2>Selected profile</h2>
            <p>Control-plane input bundle for a recovery proof target.</p>
          </div>
          <ModeBadge label="fixture" />
        </div>
        <dl class="evidence-kv">
          <div v-for="item in state.selectedProfile" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>
      </article>

      <article class="evidence-card">
        <div class="evidence-section-head">
          <div>
            <h2>Assignment posture</h2>
            <p>Device and token bindings required before a boot plan may be issued.</p>
          </div>
          <ModeBadge label="gated" tone="warning" />
        </div>
        <ul class="evidence-list evidence-check-list">
          <li v-for="check in state.assignmentChecks" :key="check.name" :class="`evidence-check evidence-check--${check.status}`">
            <span class="evidence-dot" aria-hidden="true" />
            <div>
              <strong>{{ check.name }}</strong>
              <p>{{ check.detail }}</p>
            </div>
          </li>
        </ul>
      </article>
    </section>

    <section class="evidence-card">
      <div class="evidence-section-head">
        <div>
          <h2>Lifecycle state machine</h2>
          <p>Each transition should emit a lifecycle state record or refusal record.</p>
        </div>
        <ModeBadge :label="`${state.lifecycle.length} states`" />
      </div>
      <ol class="evidence-timeline">
        <li v-for="item in state.lifecycle" :key="item.name" class="evidence-state">
          <div class="evidence-state-index">{{ item.index }}</div>
          <div class="evidence-state-body">
            <div class="evidence-row">
              <strong>{{ item.name }}</strong>
              <ModeBadge :label="item.status" :tone="toneForStatus(item.status)" />
            </div>
            <p>{{ item.detail }}</p>
            <code>{{ item.evidence }}</code>
          </div>
        </li>
      </ol>
    </section>

    <section class="evidence-grid evidence-grid--two">
      <article class="evidence-card">
        <h2>ReleaseSet</h2>
        <p class="evidence-desc">
          Signed lifecycle release binding system target, user-space closure, agent-space closure,
          policy, BOM, rollback, and evidence requirements.
        </p>
        <table class="evidence-table"><tbody><tr v-for="row in state.releaseSetRows" :key="row.field"><th>{{ row.field }}</th><td>{{ row.value }}</td></tr></tbody></table>
      </article>

      <article class="evidence-card">
        <h2>BootReleaseSet</h2>
        <p class="evidence-desc">
          Bootable recovery object binding ReleaseSet to signed manifest, artifacts,
          platform adapters, authorization, offline fallback, signing, and proof requirements.
        </p>
        <table class="evidence-table"><tbody><tr v-for="row in state.bootReleaseSetRows" :key="row.field"><th>{{ row.field }}</th><td>{{ row.value }}</td></tr></tbody></table>
      </article>
    </section>

    <section class="evidence-card">
      <div class="evidence-section-head">
        <div>
          <h2>Evidence gates</h2>
          <p>Control-plane acceptance requires every proof lane to be present or refused.</p>
        </div>
        <ModeBadge label="evidence-forward" tone="success" />
      </div>
      <table class="evidence-table evidence-table--wide">
        <thead><tr><th>Gate</th><th>Required evidence</th><th>State</th><th>Owner</th></tr></thead>
        <tbody>
          <tr v-for="gate in state.evidenceGates" :key="gate.gate">
            <td>{{ gate.gate }}</td>
            <td>{{ gate.evidence }}</td>
            <td><ModeBadge :label="gate.status" :tone="toneForStatus(gate.status)" /></td>
            <td>{{ gate.owner }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="evidence-grid evidence-grid--two">
      <article class="evidence-card">
        <h2>Blocked until reviewed implementation</h2>
        <ul class="evidence-list"><li v-for="item in state.blocked" :key="item">{{ item }}</li></ul>
      </article>
      <article class="evidence-card">
        <h2>Next implementation moves</h2>
        <ul class="evidence-list"><li v-for="item in state.nextMoves" :key="item">{{ item }}</li></ul>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import BoundaryNotice from '../components/BoundaryNotice.vue';
import ModeBadge from '../components/ModeBadge.vue';
import RouteStatePanel from '../components/RouteStatePanel.vue';
import { sourceOSLifecycleState as state, type LifecycleStatus } from '../features/sourceos-lifecycle/state';

function toneForStatus(status: LifecycleStatus): 'success' | 'warning' | 'danger' | 'muted' {
  if (status === 'complete') return 'success';
  if (status === 'active') return 'warning';
  if (status === 'blocked') return 'danger';
  return 'muted';
}
</script>

<style scoped>
.evidence-page { display: flex; flex-direction: column; gap: 1rem; color: var(--text, #f4f4f4); }
.evidence-hero, .evidence-card { border: 1px solid rgba(255,255,255,.14); border-radius: 18px; background: rgba(20,24,31,.82); box-shadow: 0 18px 48px rgba(0,0,0,.22); }
.evidence-hero { display: flex; justify-content: space-between; gap: 2rem; padding: 1.5rem; }
.evidence-kicker { margin: 0 0 .4rem; color: var(--accent, #78a9ff); font-size: .78rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
h1, h2, p { margin-top: 0; }
h1 { margin-bottom: .7rem; font-size: clamp(2rem, 4vw, 3.4rem); line-height: 1; }
h2 { margin-bottom: .65rem; font-size: 1.15rem; }
.evidence-lede, .evidence-desc, .evidence-card p, .evidence-check p, .evidence-state p { color: rgba(255,255,255,.70); line-height: 1.55; }
.evidence-lede { max-width: 780px; margin-bottom: 0; }
.evidence-scorecard { min-width: 180px; align-self: stretch; display: grid; place-content: center; border-radius: 16px; background: linear-gradient(145deg, rgba(120,169,255,.22), rgba(36,161,72,.18)); text-align: center; }
.evidence-score { display: block; font-size: 3.2rem; font-weight: 800; }
.evidence-score-label { color: rgba(255,255,255,.72); font-size: .82rem; text-transform: uppercase; letter-spacing: .08em; }
.evidence-grid { display: grid; gap: 1rem; }
.evidence-grid--metrics { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.evidence-grid--two { grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); }
.evidence-card { padding: 1rem; }
.evidence-row, .evidence-section-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.evidence-metric strong { font-size: 1.35rem; }
.evidence-bar { height: .55rem; margin: .75rem 0; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.12); }
.evidence-bar span { display: block; height: 100%; border-radius: inherit; background: var(--accent, #78a9ff); }
.evidence-kv { display: grid; gap: .65rem; margin: 0; }
.evidence-kv div { display: grid; gap: .2rem; padding-bottom: .55rem; border-bottom: 1px solid rgba(255,255,255,.09); }
.evidence-kv dt { color: rgba(255,255,255,.58); font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
.evidence-kv dd { margin: 0; font-weight: 650; }
.evidence-list { padding-left: 0; list-style: none; }
.evidence-list li { margin-bottom: .55rem; color: rgba(255,255,255,.72); }
.evidence-check { display: flex; gap: .75rem; margin-bottom: .8rem; }
.evidence-dot { flex: 0 0 .75rem; width: .75rem; height: .75rem; margin-top: .35rem; border-radius: 50%; background: rgba(255,255,255,.4); }
.evidence-check--complete .evidence-dot { background: #42be65; }
.evidence-check--active .evidence-dot { background: #f1c21b; }
.evidence-check--blocked .evidence-dot { background: #fa4d56; }
.evidence-timeline { display: grid; gap: .75rem; padding-left: 0; list-style: none; }
.evidence-state { display: grid; grid-template-columns: 3.2rem 1fr; gap: .8rem; }
.evidence-state-index { display: grid; place-content: center; width: 2.5rem; height: 2.5rem; border-radius: 50%; border: 1px solid rgba(255,255,255,.18); color: rgba(255,255,255,.74); font-weight: 800; }
.evidence-state-body { padding: .85rem; border: 1px solid rgba(255,255,255,.1); border-radius: 14px; background: rgba(255,255,255,.04); }
.evidence-state code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .78rem; color: rgba(255,255,255,.72); }
.evidence-table { width: 100%; border-collapse: collapse; }
.evidence-table th, .evidence-table td { padding: .65rem .5rem; border-bottom: 1px solid rgba(255,255,255,.1); text-align: left; vertical-align: top; }
.evidence-table th { color: rgba(255,255,255,.6); font-size: .76rem; text-transform: uppercase; letter-spacing: .05em; }
@media (max-width: 760px) { .evidence-hero { flex-direction: column; } .evidence-scorecard { min-height: 140px; } .evidence-state { grid-template-columns: 1fr; } }
</style>
