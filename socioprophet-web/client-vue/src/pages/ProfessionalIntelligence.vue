<template>
  <section class="pi-page" aria-labelledby="pi-title">
    <header class="pi-hero">
      <div>
        <p class="pi-kicker">Professional Intelligence OS · {{ state.sourceMode }}</p>
        <h1 id="pi-title">{{ state.headline }}</h1>
        <p class="pi-lede">{{ state.lede }}</p>
        <p class="pi-generated">Control state generated: {{ state.generatedAt }}</p>
      </div>
      <div class="pi-scorecard" aria-label="Overall completion">
        <span class="pi-score">{{ state.overallAlignment }}%</span>
        <span class="pi-score-label">overall alignment</span>
      </div>
    </header>

    <BoundaryNotice :label="state.boundaryLabel" :message="state.boundaryNotice" />

    <RouteStatePanel
      state="mock"
      title="Fixture control state"
      :message="`${state.metrics.length} metrics, ${state.gates.length} gates, and ${state.gatedActions.length} disabled gated actions are loaded from fixture state. No live telemetry, writeback, or execution authority is active.`"
    />

    <section class="pi-grid pi-grid--metrics" aria-label="Workstream completion">
      <article v-for="metric in state.metrics" :key="metric.name" class="pi-card pi-metric">
        <div class="pi-metric-head">
          <span>{{ metric.name }}</span>
          <strong>{{ metric.value }}%</strong>
        </div>
        <div class="pi-bar" aria-hidden="true">
          <span :style="{ width: `${metric.value}%` }" />
        </div>
        <p>{{ metric.note }}</p>
      </article>
    </section>

    <section class="pi-grid pi-grid--two">
      <article class="pi-card">
        <h2>Gate status</h2>
        <ol class="pi-gates">
          <li v-for="gate in state.gates" :key="gate.name" :class="`pi-gate pi-gate--${gate.status}`">
            <ModeBadge :label="gate.status" :tone="gate.status === 'complete' ? 'success' : gate.status === 'active' ? 'warning' : 'muted'" />
            <div>
              <strong>{{ gate.name }}</strong>
              <p>{{ gate.summary }}</p>
            </div>
          </li>
        </ol>
      </article>

      <article class="pi-card">
        <h2>Cybernetic controls</h2>
        <div class="pi-control-list">
          <div v-for="control in state.controls" :key="control.name" class="pi-control">
            <strong>{{ control.name }}</strong>
            <p><b>Sense:</b> {{ control.signal }}</p>
            <p><b>Act:</b> {{ control.action }}</p>
          </div>
        </div>
      </article>
    </section>

    <section class="pi-card">
      <div class="pi-section-head">
        <div>
          <h2>Gated actions</h2>
          <p>Operator affordances remain disabled until authority, contracts, and write paths are real.</p>
        </div>
        <ModeBadge label="disabled" tone="warning" />
      </div>
      <div class="pi-grid pi-grid--actions">
        <GatedActionCard
          v-for="action in state.gatedActions"
          :key="action.title"
          :title="action.title"
          :description="action.description"
          :action-label="action.actionLabel"
          :blocked-reason="action.blockedReason"
          :status-label="action.statusLabel"
          :tone="action.statusLabel === 'blocked' ? 'danger' : 'warning'"
        />
      </div>
    </section>

    <section class="pi-card">
      <div class="pi-section-head">
        <div>
          <h2>Active PR wave</h2>
          <p>Fixture-backed work records anchoring the replayed alignment wave.</p>
        </div>
        <ModeBadge :label="`${state.prs.length} tracked PRs`" />
      </div>
      <div class="pi-table-wrap">
        <table class="pi-table">
          <thead>
            <tr>
              <th>Repo</th>
              <th>PR</th>
              <th>Capability</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in state.prs" :key="`${item.repo}-${item.pr}`">
              <td>{{ item.repo }}</td>
              <td>{{ item.pr }}</td>
              <td>{{ item.capability }}</td>
              <td><ModeBadge :label="item.status" :tone="item.status === 'merged' ? 'success' : 'warning'" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="pi-grid pi-grid--two">
      <article class="pi-card">
        <h2>Completed controls</h2>
        <ul class="pi-list">
          <li v-for="item in state.completed" :key="item">{{ item }}</li>
        </ul>
      </article>
      <article class="pi-card">
        <h2>Next control moves</h2>
        <ul class="pi-list">
          <li v-for="item in state.nextMoves" :key="item">{{ item }}</li>
        </ul>
      </article>
    </section>

    <section class="pi-grid pi-grid--two">
      <article class="pi-card pi-callout">
        <h2>Integration rule</h2>
        <p>{{ state.integrationRule }}</p>
      </article>
      <article class="pi-card">
        <h2>Source refs</h2>
        <ul class="pi-list pi-source-list">
          <li v-for="ref in state.sourceRefs" :key="ref">{{ ref }}</li>
        </ul>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import BoundaryNotice from '../components/BoundaryNotice.vue';
import GatedActionCard from '../components/GatedActionCard.vue';
import ModeBadge from '../components/ModeBadge.vue';
import RouteStatePanel from '../components/RouteStatePanel.vue';
import { professionalIntelligenceControlState as state } from '../features/professional-intelligence/state';
</script>

<style scoped>
.pi-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--text, #f4f4f4);
}

.pi-hero,
.pi-card {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  background: rgba(20, 24, 31, 0.82);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
}

.pi-hero {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.5rem;
}

.pi-kicker {
  margin: 0 0 0.4rem;
  color: var(--accent, #78a9ff);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0.7rem;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1;
}

h2 {
  margin-bottom: 0.85rem;
  font-size: 1.15rem;
}

.pi-lede,
.pi-generated {
  max-width: 760px;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.55;
}

.pi-generated {
  margin: 0.7rem 0 0;
  font-size: 0.82rem;
}

.pi-scorecard {
  min-width: 180px;
  align-self: stretch;
  display: grid;
  place-content: center;
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(120, 169, 255, 0.22), rgba(36, 161, 72, 0.18));
  text-align: center;
}

.pi-score {
  display: block;
  font-size: 3.2rem;
  font-weight: 800;
}

.pi-score-label {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.pi-grid {
  display: grid;
  gap: 1rem;
}

.pi-grid--metrics {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.pi-grid--two,
.pi-grid--actions {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.pi-card {
  padding: 1rem;
}

.pi-metric-head,
.pi-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.pi-metric strong {
  font-size: 1.35rem;
}

.pi-metric p,
.pi-control p,
.pi-section-head p,
.pi-callout p,
.pi-gate p,
.pi-source-list {
  color: rgba(255, 255, 255, 0.68);
}

.pi-bar {
  height: 0.55rem;
  margin: 0.75rem 0;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.pi-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent, #78a9ff);
}

.pi-gates,
.pi-list {
  padding-left: 1.2rem;
}

.pi-gate {
  margin-bottom: 0.9rem;
}

.pi-control {
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.pi-control:last-child {
  border-bottom: 0;
}

.pi-table-wrap {
  overflow-x: auto;
}

.pi-table {
  width: 100%;
  border-collapse: collapse;
}

.pi-table th,
.pi-table td {
  padding: 0.7rem 0.55rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
}

.pi-table th {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pi-source-list {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  .pi-hero {
    flex-direction: column;
  }

  .pi-scorecard {
    min-height: 150px;
  }
}
</style>
