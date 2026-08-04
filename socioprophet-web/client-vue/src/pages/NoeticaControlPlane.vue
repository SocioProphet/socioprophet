<template>
  <section class="cp" aria-label="Organization control plane">
    <SurfaceHeader title="Control Plane" eyebrow="Organization · Noetica governance">
      <template #badge><span class="cp-pill" :class="{ live: amLive }">{{ amLive ? 'live · agent-machine' : 'fixture · demo org' }}</span></template>
      <template #actions>
        <LiveToggle :state="amState" label="Connect Agent Machine" live-text="agent-machine :8080" title="Bind this console to the sovereign Noetica Agent Machine on :8080 — the enforced autonomy ladder, live capability membrane (containment purpose), kill-switch, and the real policy-admitted reasoning-run audit trail. Read-only; falls back to the demo org if the machine isn't running." @click="goLiveAM" />
        <div class="cp-kpis">
          <span v-if="amLive" class="cp-kpi ok"><b>{{ gov!.autonomy.session.authorizedLevel }}</b> {{ gov!.autonomy.session.role }}{{ gov!.autonomy.enforced ? ' · enforced' : '' }}</span>
          <span class="cp-kpi"><b>{{ seats.length }}</b> seats</span>
          <span class="cp-kpi"><b>{{ activeCount }}</b> active</span>
          <span class="cp-kpi warn" :class="{ hot: displayQueue.length }"><b>{{ displayQueue.length }}</b> in review</span>
          <span class="cp-kpi ok"><b>{{ amLive ? gov!.runs.length : admittedToday }}</b> {{ amLive ? 'runs' : 'admitted today' }}</span>
          <span v-if="alerts.length" class="cp-kpi risk"><b>{{ alerts.length }}</b> alerts</span>
        </div>
      </template>
    </SurfaceHeader>

    <p class="cp-lede">The management plane for fielding Noetica to your people: who has it and at what <b>autonomy level</b>, the <b>governance queue</b> of what it proposed pending admission, the <b>policy</b> that bounds it, and a persistent <b>audit</b> trail. Every item carries its governed status and ontogenesis Ω grade.</p>

    <!-- Alerts / anomaly inbox — the triage strip (Datadog/PagerDuty pattern) -->
    <section v-if="alerts.length" class="cp-alerts" aria-label="Governance alerts">
      <button v-for="a in alerts" :key="a.id" class="cp-alert" :class="a.severity" type="button" @click="focusAlert(a)">
        <span class="cp-alert-sev">{{ a.severity === 'critical' ? '⚠' : a.severity === 'warn' ? '▲' : 'ℹ' }}</span>
        <span class="cp-alert-body"><b>{{ a.title }}</b><span class="cp-alert-detail">{{ a.detail }}</span></span>
      </button>
    </section>

    <p v-if="amState === 'error'" class="cp-amerr">⚠ Agent Machine not reachable on :8080 — showing the demo org. Start the sovereign Noetica agent-machine (<code>VITE_AGENT_MACHINE</code>) and reconnect.</p>

    <!-- LIVE: the real sovereign Agent Machine governance state (not fixture) -->
    <section v-if="amLive" class="cp-card cp-am" aria-label="Agent Machine governance">
      <div class="cp-card-h">▲ Agent Machine <span class="cp-sub">sovereign · on-device :8080 · read-only</span>
        <span class="cp-am-kill" :class="gov!.containment.killed ? 'armed' : 'safe'">{{ gov!.containment.killed ? '⛔ kill-switch ARMED' : '● kill-switch clear' }}</span>
      </div>
      <div class="cp-am-grid">
        <div class="cp-am-block">
          <div class="cp-am-k">Capability membrane <span class="cp-sub">containment purpose · live write</span></div>
          <div class="cp-am-purpose">purpose: <b>{{ gov!.containment.purpose }}</b></div>
          <div class="cp-am-caps"><span v-for="c in gov!.containment.purpose_allows" :key="c" class="cp-mem-chip on">{{ c }}</span></div>
          <div class="cp-am-write">
            <span class="cp-am-wlabel">bind:</span>
            <button v-for="p in ['read-only','research','build','full']" :key="p" class="cp-am-wbtn" :class="{ on: gov!.containment.purpose === p }" :disabled="amBusy || gov!.containment.purpose === p" @click="containmentAction({ action: 'bind', purpose: p })">{{ p }}</button>
          </div>
          <div class="cp-am-write">
            <button v-if="!gov!.containment.killed" class="cp-am-wbtn danger" :disabled="amBusy" title="Arm the kill-switch — halts the agent" @click="containmentAction({ action: 'kill', reason: 'halted from control plane' })">⛔ Arm kill-switch</button>
            <button v-else class="cp-am-wbtn safe" :disabled="amBusy" @click="containmentAction({ action: 'disarm' })">● Disarm</button>
          </div>
        </div>
        <div class="cp-am-block">
          <div class="cp-am-k">Session authority <span class="cp-sub">{{ gov!.autonomy.enforced ? 'enforced · live write' : 'observed' }}</span></div>
          <div class="cp-am-purpose"><b>{{ gov!.autonomy.session.role }}</b> · authorized <b>{{ gov!.autonomy.session.authorizedLevel }}</b></div>
          <div v-for="e in gov!.autonomy.session.evidence" :key="e" class="cp-am-ev">◆ {{ e }}</div>
          <div class="cp-am-write">
            <span class="cp-am-wlabel">bind level:</span>
            <button v-for="l in gov!.autonomy.ladder" :key="l.level" class="cp-am-wbtn" :class="{ on: gov!.autonomy.session.authorizedLevel === l.level }" :disabled="amBusy || gov!.autonomy.session.authorizedLevel === l.level" :title="`${l.label.replace(/_/g,' ')} · gate: ${l.gate.replace(/_/g,' ')}`" @click="bindLevel(l.level)">{{ l.level }}</button>
          </div>
        </div>
        <div class="cp-am-block">
          <div class="cp-am-k">Authority hierarchy <span class="cp-sub">posture</span></div>
          <div v-for="a in gov!.posture.authorityHierarchy" :key="a.level" class="cp-am-auth" :class="{ active: a.active }">
            <span class="cp-am-adot" :class="{ on: a.active }" />{{ a.label }}<span class="cp-am-adesc">{{ a.active ? 'active' : 'inactive' }}</span>
          </div>
        </div>
      </div>
      <div class="cp-am-scoped">
        <div class="cp-am-k">Egress governance <span class="cp-sub">SCOPE-D policy · governs cloud egress</span></div>
        <div class="cp-am-scoped-row">
          <span class="cp-am-scoped-state" :class="gov!.posture.scopedConfigured ? 'ok' : 'warn'">{{ gov!.posture.scopedConfigured ? `● active · ${gov!.posture.policyName || gov!.posture.policyId}` : '▲ unconfigured — cloud egress ungoverned' }}</span>
          <button v-if="!gov!.posture.scopedConfigured" class="cp-am-wbtn" :disabled="amBusy" title="Bind a sovereign least-privilege policy: no cloud targets authorized (everything stays local), all escalation classes human-gated" @click="bindScopedPolicy">Bind least-privilege policy</button>
          <span v-if="scopedMsg" class="cp-am-scoped-msg">{{ scopedMsg }}</span>
        </div>
      </div>
      <div class="cp-am-ladder">
        <div class="cp-am-k">Enforced autonomy ladder <span class="cp-sub">gate + evidence required per rung</span></div>
        <div class="cp-am-lrow" v-for="l in gov!.autonomy.ladder" :key="l.level" :class="{ here: l.level === gov!.autonomy.session.authorizedLevel }">
          <span class="cp-am-llvl">{{ l.level }}</span>
          <span class="cp-am-llabel">{{ l.label.replace(/_/g, ' ') }}</span>
          <span class="cp-am-lgate">gate: {{ l.gate.replace(/_/g, ' ') }}</span>
          <span class="cp-am-levid">{{ l.evidenceRequired.replace(/_/g, ' ') }}</span>
        </div>
      </div>
    </section>

    <div class="cp-grid">
      <!-- Governance queue — the review inbox with bulk actions + SLA aging -->
      <section class="cp-card cp-queue">
        <div class="cp-card-h">◆ Governance queue <span class="cp-sub">what Noetica proposed · pending human admission</span></div>

        <div v-if="displayQueue.length" class="cp-q-bulk">
          <label class="cp-check"><input type="checkbox" :checked="allSelected" :indeterminate.prop="someSelected && !allSelected" @change="toggleAll" /> <span>{{ selected.size ? `${selected.size} selected` : 'Select all' }}</span></label>
          <div v-if="selected.size" class="cp-bulk-acts">
            <select v-model="bulkReason" class="cp-reason" aria-label="Bulk reason"><option value="">reason…</option><option v-for="r in reasons" :key="r" :value="r">{{ r }}</option></select>
            <button class="cp-act admit" type="button" @click="bulkDecide('admitted')">Admit {{ selected.size }}</button>
            <button class="cp-act reject" type="button" @click="bulkDecide('rejected')">Reject {{ selected.size }}</button>
          </div>
        </div>

        <EmptyState v-if="!displayQueue.length" title="Queue clear" :hint="amLive ? 'The agent-machine policy admitted every recent run — nothing held for human review.' : 'No claims or actions awaiting review. New proposals from fielded seats land here.'" icon="✓" />
        <ul v-else class="cp-q-list">
          <li v-for="q in displayQueue" :key="q.id" class="cp-q-item" :class="{ overdue: overdue(q), sel: selected.has(q.id) }">
            <div class="cp-q-top">
              <label class="cp-check tiny"><input type="checkbox" :checked="selected.has(q.id)" @change="toggle(q.id)" /></label>
              <span class="cp-q-kind" :class="q.kind">{{ q.kind.replace('-', ' ') }}</span>
              <span class="cp-q-policy" :class="q.policy">{{ q.policy }}</span>
              <span class="cp-q-omega" :title="`ontogenesis Ω · ${omegaNote(q.omega)}`">Ω {{ q.omega }}</span>
              <span class="cp-q-age" :class="{ over: overdue(q) }" :title="overdue(q) ? `past ${SLA}m review SLA` : 'within SLA'">{{ ageLabel(q) }}<span v-if="overdue(q)"> · overdue</span></span>
              <span class="cp-q-conf">{{ Math.round(q.confidence * 100) }}%</span>
            </div>
            <div class="cp-q-summary">{{ q.summary }}</div>
            <div class="cp-q-meta">{{ q.subject }} · {{ seatName(q.seatId) }} · {{ relTime(q.receivedAt) }}</div>
            <div class="cp-q-acts">
              <button class="cp-act admit" type="button" @click="decide(q, 'admitted')">Admit</button>
              <button class="cp-act hold" type="button" @click="decide(q, 'held-for-review', reasonFor[q.id])">Escalate</button>
              <button class="cp-act reject" type="button" @click="decide(q, 'rejected', reasonFor[q.id])">Reject</button>
              <select v-model="reasonFor[q.id]" class="cp-reason" aria-label="Decision reason"><option value="">reason…</option><option v-for="r in reasons" :key="r" :value="r">{{ r }}</option></select>
            </div>
          </li>
        </ul>
      </section>

      <!-- Fielded seats -->
      <section class="cp-card">
        <div class="cp-card-h">◉ Fielded seats <span class="cp-sub">{{ amLive ? 'org roster · demo (single-box machine has one session)' : 'autonomy is capped by role policy' }}</span></div>
        <div class="cp-seats">
          <div v-for="s in seats" :key="s.id" class="cp-seat" :class="{ risk: repRisk(s), focus: focusSeatId === s.id }" :ref="(el) => setSeatRef(s.id, el)">
            <button class="cp-seat-id" type="button" :title="`Open ${s.name}'s detail`" @click="openSeatId = s.id">
              <span class="cp-dot" :class="s.status" :title="s.status" />
              <div>
                <div class="cp-seat-name">{{ s.name }} <ReputationBadge :subject="s.name" /></div>
                <div class="cp-seat-role">{{ s.role }} · {{ s.dept }}<span v-if="repRisk(s)" class="cp-risk-flag" title="High autonomy on a low / unrated HolographMe reputation — review the grant">⚠ autonomy &gt; reputation</span><span v-if="unusedCount(s)" class="cp-unused-flag" :title="`${unusedCount(s)} granted capability surface(s) never used — prune candidate`">{{ unusedCount(s) }} unused grant{{ unusedCount(s) > 1 ? 's' : '' }}</span></div>
              </div>
            </button>
            <div class="cp-seat-auto">
              <button class="cp-step" type="button" :disabled="s.autonomy <= 0" aria-label="Lower autonomy" @click="setAutonomy(s, s.autonomy - 1)">▾</button>
              <span class="cp-auto-lvl" :title="autonomyBlurb(s.autonomy)">L{{ s.autonomy }} · {{ autonomyLabel(s.autonomy) }}</span>
              <button class="cp-step" type="button" :disabled="s.autonomy >= roleCap(s.role)" :title="`role cap L${roleCap(s.role)}`" aria-label="Raise autonomy" @click="setAutonomy(s, s.autonomy + 1)">▴</button>
            </div>
            <div class="cp-seat-stat">{{ s.claims30d.toLocaleString() }}/30d · {{ s.admitRate }}% admit</div>
          </div>
        </div>
      </section>

      <!-- Role policy: autonomy caps + capability membrane -->
      <section class="cp-card">
        <div class="cp-card-h">§ Policy <span class="cp-sub">autonomy caps + capability membrane per role</span></div>
        <div class="cp-pol">
          <div v-for="p in policy" :key="p.role" class="cp-pol-row">
            <span class="cp-pol-role">{{ p.role }}</span>
            <span class="cp-pol-cap">cap L{{ p.autonomyCap }}</span>
            <span class="cp-pol-mem"><span v-for="m in p.membrane" :key="m" class="cp-mem-chip" :class="{ unused: roleUnusedSurfaces(seats, p.role, p.membrane).includes(m) }" :title="roleUnusedSurfaces(seats, p.role, p.membrane).includes(m) ? 'Granted but unused by everyone in this role — candidate to prune' : ''">{{ m }}</span></span>
          </div>
        </div>
        <!-- Policy what-if simulator -->
        <div class="cp-sim">
          <div class="cp-sim-h">What-if <span class="cp-sub">preview the blast radius before applying</span></div>
          <div class="cp-sim-ctl">
            <span>Lower</span>
            <select v-model="simRole" class="cp-reason"><option v-for="p in policy" :key="p.role" :value="p.role">{{ p.role }}</option></select>
            <span>cap to</span>
            <select v-model.number="simCap" class="cp-reason"><option v-for="n in [0,1,2,3,4,5]" :key="n" :value="n">L{{ n }}</option></select>
            <button class="cp-act" type="button" :disabled="!simResult.affected.length" @click="applySim">Apply</button>
          </div>
          <p class="cp-sim-out" :class="{ hot: simResult.affected.length }">
            <template v-if="simResult.affected.length">⚠ {{ simResult.affected.length }} seat{{ simResult.affected.length > 1 ? 's' : '' }} throttled: <span v-for="a in simResult.affected" :key="a.id" class="cp-sim-seat">{{ a.name }} L{{ a.from }}→L{{ a.to }}</span></template>
            <template v-else>No seats affected — all {{ simRole }} seats already ≤ L{{ simCap }}.</template>
          </p>
        </div>
      </section>
    </div>

    <!-- Governed acquisition — web-data actions dispatched via /api/acquire, recorded + streamed here -->
    <section v-if="amLive" class="cp-card cp-acq-card" aria-label="Governed acquisition activity">
      <div class="cp-card-h">🕸 Governed Acquisition <span class="cp-sub">web-data actions · /api/acquire → sovereign worker · recorded + streamed</span>
        <RouterLink class="cp-acq-open" to="/data/acquisition">open console →</RouterLink>
      </div>
      <div class="cp-acq-kpis">
        <span class="cp-kpi"><b>{{ acqRuns.length }}</b> acquisitions</span>
        <span class="cp-kpi ok"><b>{{ acqAdmitted }}</b> admitted</span>
        <span class="cp-kpi ok"><b>{{ acqLanded }}</b> landed</span>
        <span v-if="acqFailed" class="cp-kpi risk"><b>{{ acqFailed }}</b> failed</span>
      </div>
      <div v-if="acqRuns.length" class="cp-acq-list">
        <div v-for="r in acqRuns.slice(0, 8)" :key="r.run_id" class="cp-acq-row">
          <span class="cp-acq-state" :class="r.policy_admitted ? (r.memory_written ? 'landed' : 'admitted') : 'held'">{{ r.policy_admitted ? (r.memory_written ? 'landed' : 'admitted') : 'held' }}</span>
          <span class="cp-acq-id">{{ r.run_id }}</span>
          <span class="cp-acq-meta">{{ r.tokens_egressed ?? 0 }} egressed · {{ r.latency_ms }}ms</span>
          <span v-if="r.error" class="cp-acq-err" :title="r.error">{{ r.error }}</span>
        </div>
      </div>
      <p v-else class="cp-acq-empty">No acquisitions yet — dispatch one via <code>POST /api/acquire</code> or the <RouterLink to="/data/acquisition">console</RouterLink>. Each lands here as a governed, audited action with its provenance.</p>
    </section>

    <!-- Audit trail — first-class, persistent, filterable, exportable (Okta system-log pattern) -->
    <section class="cp-card cp-audit-card">
      <div class="cp-card-h">▤ Audit <span class="cp-sub">{{ amLive ? (streamOn ? 'live · streaming · agent-machine runs + decisions' : 'live · polling 30s · agent-machine runs') : 'governed decisions · sealed receipts · persists across reloads' }}</span>
        <div class="cp-audit-tools">
          <input v-model="auditQuery" class="cp-audit-search" placeholder="Search subject / actor…" spellcheck="false" />
          <button v-for="f in auditFilters" :key="f" class="cp-af" :class="{ on: auditFilter === f }" type="button" @click="auditFilter = f">{{ f }}</button>
          <button class="cp-af" type="button" :disabled="!undoStack.length" title="Undo last decision" @click="undo">↶ Undo</button>
          <button class="cp-af" type="button" title="Export the audit log as JSONL" @click="exportAudit">⭳ Export</button>
        </div>
      </div>
      <div class="cp-audit-count">{{ filteredAudit.length }} of {{ baseAudit.length }} entries</div>
      <EmptyState v-if="!filteredAudit.length" title="No matching entries" hint="Clear the filter or search to see the full trail." icon="▤" />
      <ul v-else class="cp-audit">
        <li v-for="a in filteredAudit" :key="a.id" class="cp-audit-row">
          <span class="cp-audit-dec" :class="a.decision">{{ a.decision.replace(/-/g, ' ') }}</span>
          <span class="cp-audit-subj">{{ a.subject }}</span>
          <span v-if="a.reason" class="cp-audit-reason">{{ a.reason }}</span>
          <span class="cp-audit-meta">{{ a.actor }} · Ω {{ a.omega }} · <code>{{ a.receipt }}</code> · {{ relTime(a.at) }}</span>
        </li>
      </ul>
    </section>

    <!-- Seat detail drawer — identity, access advisor, activity, session, revoke -->
    <div v-if="openSeat" class="cp-drawer-scrim" @click.self="openSeatId = null">
      <aside class="cp-drawer" role="dialog" aria-label="Seat detail">
        <header class="cp-dr-head">
          <div>
            <div class="cp-dr-name"><span class="cp-dot" :class="openSeat.status" />{{ openSeat.name }} <ReputationBadge :subject="openSeat.name" /></div>
            <div class="cp-dr-sub">{{ openSeat.role }} · {{ openSeat.dept }} · {{ openSeat.status }}</div>
          </div>
          <button class="cp-dr-x" type="button" aria-label="Close" @click="openSeatId = null">✕</button>
        </header>

        <div class="cp-dr-facts">
          <div class="cp-dr-fact"><span>Autonomy</span><strong>L{{ openSeat.autonomy }} · {{ autonomyLabel(openSeat.autonomy) }} <em>(role cap L{{ roleCap(openSeat.role) }})</em></strong></div>
          <div class="cp-dr-fact"><span>Throughput</span><strong>{{ openSeat.claims30d.toLocaleString() }}/30d · {{ openSeat.admitRate }}% admit</strong></div>
          <div class="cp-dr-fact"><span>Session</span><strong>{{ openSeat.sessionId }} · {{ openSeat.device }}</strong></div>
          <div class="cp-dr-fact"><span>Last active</span><strong>{{ openSeat.lastActive }}</strong></div>
        </div>

        <!-- Access Advisor -->
        <div class="cp-dr-block" v-if="seatAdvice">
          <div class="cp-dr-bh">Access Advisor <span class="cp-sub">least-privilege · {{ seatAdvice.used.length }}/{{ seatAdvice.granted.length }} granted surfaces used</span></div>
          <div class="cp-dr-caps">
            <span v-for="g in seatAdvice.granted" :key="g" class="cp-mem-chip" :class="{ on: seatAdvice.used.includes(g), unused: seatAdvice.unused.includes(g) }">{{ g }}{{ seatAdvice.unused.includes(g) ? ' · unused' : '' }}</span>
          </div>
          <p v-if="seatAdvice.unused.length" class="cp-dr-hint">{{ seatAdvice.unused.length }} surface{{ seatAdvice.unused.length > 1 ? 's' : '' }} granted but never used — prune to least-privilege.</p>
          <p v-if="roleUnused.length" class="cp-dr-hint role">Role-wide: <b>{{ roleUnused.join(', ') }}</b> unused by all {{ openSeat.role }}s — candidate to drop from the role membrane.</p>
        </div>

        <!-- Activity history -->
        <div class="cp-dr-block">
          <div class="cp-dr-bh">Recent activity <span class="cp-sub">{{ seatActivity.length }} events</span></div>
          <ul class="cp-dr-act">
            <li v-for="(a, i) in seatActivity" :key="i" class="cp-dr-arow">
              <span class="cp-dr-adot" :class="{ bad: !a.ok }" />
              <span class="cp-dr-atext">{{ a.action }}</span>
              <span class="cp-dr-asurf">{{ a.surface }}</span>
              <span class="cp-dr-atime">{{ relTime(a.at) }}</span>
            </li>
            <li v-if="!seatActivity.length" class="cp-dr-arow empty">No recorded activity.</li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="cp-dr-acts">
          <button class="cp-act" type="button" :class="{ admit: impersonating === openSeat.id }" @click="impersonate(openSeat)">{{ impersonating === openSeat.id ? '● Viewing as this seat' : '👤 Impersonate (view-as)' }}</button>
          <button class="cp-act reject" type="button" :disabled="openSeat.status === 'suspended' && openSeat.autonomy === 0" @click="revokeSeat(openSeat)">⊘ Revoke access (suspend · L0)</button>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import EmptyState from '../components/EmptyState.vue';
import ReputationBadge from '../components/ReputationBadge.vue';
import { reputationFor } from '../features/reputation/reputation';
import { SEATS, QUEUE, ROLE_POLICY, AUDIT, AUTONOMY_LEVELS, DECISION_REASONS, SEAT_ACTIVITY, type Seat, type QueueItem, type AuditDecision, type AutonomyLevel } from '../data/controlPlaneFixture';
import { notationOf, type OmegaState } from '../ontology/ontogenesis';
import { computeAlerts, isOverdue, ageMinutes, REVIEW_SLA_MIN, buildAuditEntry, loadAudit, saveAudit, auditToJsonl, simulateCap, leastPrivilege, roleUnusedSurfaces, type Alert } from '../features/controlPlane/governance';
import LiveToggle from '../components/LiveToggle.vue';
import { fetchLiveGovernance, buildLeastPrivilegePolicy, runsToAudit, runsToQueue, decisionsToAudit, type LiveGovernance } from '../data/adapters/controlPlaneLive';
import { postContainment, bindAutonomy, postGovernanceDecision, postGovernancePolicy, AM_BASE, type GovDecision, type GovRun, type GovDecisionRecord } from '../services/agentMachineApi';
import { useCockpit } from '../stores/cockpit';

const seats = ref<Seat[]>(SEATS.map((s) => ({ ...s })));
const queue = ref<QueueItem[]>(QUEUE.map((q) => ({ ...q })));
const audit = ref(loadAudit(AUDIT.map((a) => ({ ...a }))));
const admittedToday = ref(3);
const SLA = REVIEW_SLA_MIN;
const reasons = DECISION_REASONS;

// A live clock so SLA aging + relative labels tick without a reload.
const nowMs = ref(Date.now());
let clock: ReturnType<typeof setInterval> | undefined;

const activeCount = computed(() => seats.value.filter((s) => s.status === 'active').length);
function repRisk(s: Seat): boolean {
  const r = reputationFor(s.name);
  return s.autonomy >= 4 && (!r || r.tier === 'emerging' || r.tier === 'unrated');
}
const fixtureAlerts = computed<Alert[]>(() => computeAlerts(seats.value, queue.value, nowMs.value, (name) => reputationFor(name)?.tier));

// ── Live wire to the sovereign Agent Machine (Noetica :8080) ─────────────────────
const amState = ref<'idle' | 'loading' | 'live' | 'error'>('idle');
const gov = ref<LiveGovernance | null>(null);
const amLive = computed(() => amState.value === 'live' && !!gov.value);

// Governed acquisition activity — the agent-machine records web-acquisition dispatched via
// POST /api/acquire as governance runs (task/provider 'acquire', model 'acquire-worker'), so they
// stream into gov.runs and become first-class, audited Control-Plane actions.
const acqRuns = computed(() => (amLive.value && gov.value
  ? gov.value.runs.filter((r) => r.provider === 'acquire' || r.task === 'acquire' || r.model_routed === 'acquire-worker')
  : []));
const acqAdmitted = computed(() => acqRuns.value.filter((r) => r.policy_admitted).length);
const acqLanded = computed(() => acqRuns.value.filter((r) => r.memory_written).length);
const acqFailed = computed(() => acqRuns.value.filter((r) => !!r.error).length);
async function goLiveAM() {
  if (amState.value === 'loading') return;
  amState.value = 'loading';
  const g = await fetchLiveGovernance();
  if (!g) { amState.value = 'error'; return; }
  gov.value = g; amState.value = 'live';
  openGovStream();
}

// Live SSE feed of governance events — updates the audit/queue the instant the machine emits
// a run or decision, instead of waiting for the 30s poll. Falls back silently to the poll if
// the stream endpoint is absent (older machine) or errors. EventSource honours the machine's
// CORS header. streamOn reflects whether we're actually tailing (for the badge).
let govStream: EventSource | null = null;
const streamOn = ref(false);
function onGovRun(run: GovRun) {
  if (!gov.value || !run?.run_id) return;
  gov.value = { ...gov.value, runs: [run, ...gov.value.runs].slice(0, 100), audit: [...runsToAudit([run]), ...gov.value.audit], queue: [...runsToQueue([run]), ...gov.value.queue] };
}
function onGovDecision(rec: GovDecisionRecord) {
  if (!gov.value || !rec?.run_id) return;
  liveDismissed.value = new Set(liveDismissed.value).add(rec.run_id); // the decided run leaves the queue
  gov.value = { ...gov.value, audit: [...decisionsToAudit([rec]), ...gov.value.audit] };
}
function openGovStream() {
  closeGovStream();
  if (typeof EventSource === 'undefined') return;
  try {
    govStream = new EventSource(`${AM_BASE}/api/governance/stream`);
    govStream.addEventListener('ready', () => { streamOn.value = true; });
    govStream.addEventListener('run', (e) => { try { onGovRun(JSON.parse((e as MessageEvent).data)); } catch { /* skip bad frame */ } });
    govStream.addEventListener('decision', (e) => { try { onGovDecision(JSON.parse((e as MessageEvent).data)); } catch { /* skip bad frame */ } });
    govStream.onerror = () => { streamOn.value = false; }; // poll remains the fallback
  } catch { govStream = null; }
}
function closeGovStream() { if (govStream) { govStream.close(); govStream = null; } streamOn.value = false; }
// When connected, real machine alerts lead; the org-roster demo alerts follow.
const alerts = computed<Alert[]>(() => amLive.value ? [...gov.value!.alerts, ...fixtureAlerts.value] : fixtureAlerts.value);

const seatName = (id: string) => seats.value.find((s) => s.id === id)?.name ?? 'seat';
const autonomyLabel = (l: AutonomyLevel) => AUTONOMY_LEVELS[l]?.label ?? '';
const autonomyBlurb = (l: AutonomyLevel) => AUTONOMY_LEVELS[l]?.blurb ?? '';
const roleCap = (role: string) => ROLE_POLICY.find((p) => p.role === role)?.autonomyCap ?? 5;
const omegaNote = (o: OmegaState) => `rung ${notationOf(o)}/6 on the path to truth`;
const policy = ROLE_POLICY;

// SLA aging helpers.
const overdue = (q: QueueItem) => isOverdue(q, nowMs.value, SLA);
const ageLabel = (q: QueueItem) => `${ageMinutes(q.receivedAt, nowMs.value)}m`;
function relTime(iso: string): string {
  const m = Math.max(0, Math.round((nowMs.value - Date.parse(iso)) / 60000));
  return Number.isNaN(Date.parse(iso)) ? iso : m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
}

function setAutonomy(s: Seat, level: number) {
  const cap = roleCap(s.role);
  s.autonomy = Math.max(0, Math.min(cap, level)) as AutonomyLevel;
}
const membraneOf = (role: string) => ROLE_POLICY.find((p) => p.role === role)?.membrane ?? [];

// ── Policy what-if simulator ─────────────────────────────────────────────────────
const simRole = ref<string>(ROLE_POLICY[0]?.role ?? '');
const simCap = ref<number>(2);
const simResult = computed(() => simulateCap(seats.value, simRole.value, simCap.value));
function applySim() {
  for (const a of simResult.value.affected) { const s = seats.value.find((x) => x.id === a.id); if (s) s.autonomy = a.to as AutonomyLevel; }
  // also lower the role cap so the throttle sticks
  const p = ROLE_POLICY.find((x) => x.role === simRole.value); if (p) p.autonomyCap = simCap.value as AutonomyLevel;
}

// ── Access Advisor / least-privilege ─────────────────────────────────────────────
const adviceFor = (s: Seat) => leastPrivilege(membraneOf(s.role), s.usedSurfaces);
const unusedCount = (s: Seat) => adviceFor(s).unused.length;

// ── Seat detail drawer ────────────────────────────────────────────────────────────
const openSeatId = ref<string | null>(null);
const openSeat = computed<Seat | undefined>(() => seats.value.find((s) => s.id === openSeatId.value));
const seatAdvice = computed(() => openSeat.value ? adviceFor(openSeat.value) : null);
const seatActivity = computed(() => openSeat.value ? (SEAT_ACTIVITY[openSeat.value.id] ?? []) : []);
const roleUnused = computed(() => openSeat.value ? roleUnusedSurfaces(seats.value, openSeat.value.role, membraneOf(openSeat.value.role)) : []);
function revokeSeat(s: Seat) { s.status = 'suspended'; s.autonomy = 0 as AutonomyLevel; }
const impersonating = ref<string | null>(null);
function impersonate(s: Seat) {
  impersonating.value = impersonating.value === s.id ? null : s.id;
  useCockpit().setContext({ surface: 'Control Plane', entityLabel: impersonating.value ? `Viewing as ${s.name} (${s.role})` : 'Organization · Noetica governance', detail: impersonating.value ? `impersonation · membrane ${membraneOf(s.role).join(', ')}` : `${queue.value.length} in review`, route: '/control-plane/org' });
}

// ── Real containment write (kill-switch / purpose bind) — only when connected ───────
const amBusy = ref(false);
async function containmentAction(body: Parameters<typeof postContainment>[0]) {
  if (!amLive.value || amBusy.value) return;
  amBusy.value = true;
  try {
    const next = await postContainment(body);
    if (gov.value && next) gov.value = { ...gov.value, containment: next };
    const g = await fetchLiveGovernance(); if (g) gov.value = g; // refresh posture/alerts too
  } catch { /* endpoint refused — leave state unchanged */ } finally { amBusy.value = false; }
}
// Real autonomy grant writeback — binds this session's authorized level on the live machine.
async function bindLevel(level: string) {
  if (!amLive.value || amBusy.value || !gov.value) return;
  amBusy.value = true;
  try {
    await bindAutonomy(gov.value.autonomy.session.role, level, [`bound from control plane ${new Date().toISOString().slice(0, 16)}`]);
    const g = await fetchLiveGovernance(); if (g) gov.value = g;
  } catch { /* endpoint refused — leave state unchanged */ } finally { amBusy.value = false; }
}
// Real scoped-egress governance — bind a sovereign least-privilege EngagementPolicy so cloud
// egress is no longer ungoverned. Fails honestly when the machine lacks SCOPED_ENGAGEMENT_POLICY.
const scopedMsg = ref('');
async function bindScopedPolicy() {
  if (!amLive.value || amBusy.value) return;
  amBusy.value = true; scopedMsg.value = '';
  try {
    const r = await postGovernancePolicy(buildLeastPrivilegePolicy());
    scopedMsg.value = `✓ bound · ${r.policyId}`;
    const g = await fetchLiveGovernance(); if (g) gov.value = g;
  } catch { scopedMsg.value = 'Set SCOPED_ENGAGEMENT_POLICY to a writable path on the machine, then retry.'; } finally { amBusy.value = false; }
}

// ── Queue selection + decisions ──────────────────────────────────────────────
// When connected, the review queue is the machine's HELD runs (policy didn't auto-admit);
// otherwise the fixture demo queue. liveDismissed hides items already decided this session.
const liveDismissed = ref<Set<string>>(new Set());
const displayQueue = computed<QueueItem[]>(() => amLive.value ? gov.value!.queue.filter((q) => !liveDismissed.value.has(q.id)) : queue.value);

const selected = ref<Set<string>>(new Set());
const reasonFor = reactive<Record<string, string>>({});
const bulkReason = ref('');
const allSelected = computed(() => displayQueue.value.length > 0 && selected.value.size === displayQueue.value.length);
const someSelected = computed(() => selected.value.size > 0);
function toggle(id: string) { const n = new Set(selected.value); n.has(id) ? n.delete(id) : n.add(id); selected.value = n; }
function toggleAll() { selected.value = allSelected.value ? new Set() : new Set(displayQueue.value.map((q) => q.id)); }

// Undo support — fixture decisions only (live decisions are server-durable; undo can't
// rescind a recorded machine decision, so we don't pretend to).
const undoStack = ref<Array<{ entryId: string; item: QueueItem; bumped: boolean }>>([]);

async function decide(q: QueueItem, decision: AuditDecision, reason?: string) {
  const live = amLive.value;
  const entry = buildAuditEntry(q, decision, live ? 'operator' : 'you', new Date(nowMs.value).toISOString(), reason || undefined);
  audit.value = [entry, ...audit.value];
  saveAudit(audit.value);
  if (selected.value.has(q.id)) { const n = new Set(selected.value); n.delete(q.id); selected.value = n; }
  const bumped = decision === 'admitted' || decision === 'executed';
  if (live) {
    liveDismissed.value = new Set(liveDismissed.value).add(q.id);
    try {
      await postGovernanceDecision(q.id, (decision === 'executed' ? 'admitted' : decision) as GovDecision, reason || undefined);
      // Recorded server-side — drop our local echo (avoids a duplicate) and refetch so the
      // machine's receipt-bearing entry shows.
      audit.value = audit.value.filter((a) => a.id !== entry.id);
      saveAudit(audit.value);
      const g = await fetchLiveGovernance(); if (g && amState.value === 'live') gov.value = g;
    } catch {
      // Older machine without the endpoint: keep the local 'operator' entry as the ONLY record
      // (baseAudit surfaces operator entries), so the decision is never silently lost.
    }
  } else {
    if (bumped) admittedToday.value += 1;
    queue.value = queue.value.filter((x) => x.id !== q.id);
    undoStack.value.push({ entryId: entry.id, item: q, bumped });
  }
}
async function bulkDecide(decision: AuditDecision) {
  const ids = new Set(selected.value);
  for (const q of displayQueue.value.filter((x) => ids.has(x.id))) await decide(q, decision, bulkReason.value || undefined);
  bulkReason.value = '';
}
function undo() {
  const last = undoStack.value.pop();
  if (!last) return;
  audit.value = audit.value.filter((a) => a.id !== last.entryId);
  saveAudit(audit.value);
  queue.value = [last.item, ...queue.value].sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt));
  if (last.bumped) admittedToday.value = Math.max(0, admittedToday.value - 1);
}

// ── Audit filter / search / export ────────────────────────────────────────────
const auditFilters = ['all', 'admitted', 'rejected', 'held-for-review', 'executed'] as const;
const auditFilter = ref<(typeof auditFilters)[number]>('all');
const auditQuery = ref('');
// When live, the audit trail IS the machine's real policy-admitted reasoning runs, with
// any in-session human decisions ('you') kept on top; otherwise the fixture/human trail.
const baseAudit = computed(() => amLive.value ? [...audit.value.filter((a) => a.actor === 'you' || a.actor === 'operator'), ...gov.value!.audit] : audit.value);
const filteredAudit = computed(() => {
  const q = auditQuery.value.trim().toLowerCase();
  return baseAudit.value.filter((a) => {
    if (auditFilter.value !== 'all' && a.decision !== auditFilter.value) return false;
    if (!q) return true;
    return [a.subject, a.actor, a.decision, a.reason ?? ''].some((f) => f.toLowerCase().includes(q));
  });
});
function exportAudit() {
  const blob = new Blob([auditToJsonl(baseAudit.value)], { type: 'application/x-ndjson' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `noetica-audit-${new Date().toISOString().slice(0, 10)}.jsonl`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Alert → seat focus ────────────────────────────────────────────────────────
const focusSeatId = ref<string | null>(null);
const seatEls = new Map<string, HTMLElement>();
function setSeatRef(id: string, el: Element | ComponentPublicInstance | null) { if (el instanceof HTMLElement) seatEls.set(id, el); }
function focusAlert(a: Alert) {
  if (!a.ref?.seatId) return;
  focusSeatId.value = a.ref.seatId;
  seatEls.get(a.ref.seatId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { if (focusSeatId.value === a.ref?.seatId) focusSeatId.value = null; }, 2200);
}

onMounted(() => {
  // Tick the clock (SLA aging) and, when connected, auto-refresh live governance — the
  // audit/queue update without a reload (there is no governance SSE, so this polls).
  clock = setInterval(async () => {
    nowMs.value = Date.now();
    // Skip the reconcile poll while a write is in flight — otherwise a poll that started before
    // the write can resolve after it and clobber gov.value with pre-write state.
    if (amLive.value && !amBusy.value) { const g = await fetchLiveGovernance(); if (g && amState.value === 'live') gov.value = g; }
  }, 30000);
  useCockpit().setContext({ surface: 'Control Plane', entityLabel: 'Organization · Noetica governance', detail: `${queue.value.length} in review · ${alerts.value.length} alerts`, route: '/control-plane/org' });
});
onUnmounted(() => { if (clock) clearInterval(clock); closeGovStream(); });
</script>

<style scoped>
.cp { height: 100%; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 0.9rem; padding: 1rem 1.25rem 1.5rem; background: var(--bg); color: var(--text); }
.cp-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--amber); background: var(--amber-soft); border-radius: 5px; padding: 0.1rem 0.35rem; white-space: nowrap; }
.cp-pill.live { color: var(--live); background: var(--live-soft); }

/* Live Agent Machine card */
.cp-amerr { margin: 0; font-size: 0.76rem; color: var(--amber); background: var(--amber-soft); border: 1px solid rgba(227,179,65,0.35); border-radius: 8px; padding: 0.5rem 0.7rem; } .cp-amerr code { font-size: 0.7rem; }
.cp-am { border-color: rgba(63,185,80,0.35); }
.cp-am-kill { margin-left: auto; font-family: var(--mono, ui-monospace); font-size: 0.6rem; padding: 0.1rem 0.4rem; border-radius: 5px; } .cp-am-kill.safe { color: var(--live); background: var(--live-soft); } .cp-am-kill.armed { color: var(--down); background: rgba(240,101,106,0.15); }
.cp-am-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.9rem; } @media (max-width: 820px) { .cp-am-grid { grid-template-columns: 1fr; } }
.cp-am-block { display: flex; flex-direction: column; gap: 0.3rem; }
.cp-am-k { font-size: 0.72rem; font-weight: 620; display: flex; align-items: baseline; gap: 0.4rem; }
.cp-am-purpose { font-size: 0.78rem; color: var(--text-2); } .cp-am-purpose b { color: var(--text); }
.cp-am-caps { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.1rem; }
.cp-mem-chip.on { color: var(--live); border-color: rgba(63,185,80,0.4); }
.cp-am-ev { font-size: 0.64rem; color: var(--text-3); }
.cp-am-auth { display: flex; align-items: center; gap: 0.4rem; font-size: 0.72rem; color: var(--text-3); } .cp-am-auth.active { color: var(--text-2); }
.cp-am-adot { width: 7px; height: 7px; border-radius: 50%; background: var(--line-2); } .cp-am-adot.on { background: var(--live); }
.cp-am-adesc { margin-left: auto; font-size: 0.58rem; color: var(--text-3); }
.cp-am-scoped { margin-top: 0.9rem; border-top: 1px solid var(--line); padding-top: 0.7rem; }
.cp-am-scoped-row { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-top: 0.35rem; }
.cp-am-scoped-state { font-size: 0.72rem; } .cp-am-scoped-state.ok { color: var(--live); } .cp-am-scoped-state.warn { color: var(--amber); }
.cp-am-scoped-msg { font-size: 0.66rem; color: var(--text-3); }
.cp-am-ladder { margin-top: 0.9rem; border-top: 1px solid var(--line); padding-top: 0.7rem; }
.cp-am-lrow { display: grid; grid-template-columns: 2.2rem 1fr 1.4fr 1.4fr; gap: 0.5rem; align-items: baseline; font-size: 0.7rem; padding: 0.22rem 0.35rem; border-radius: 6px; }
.cp-am-lrow.here { background: var(--live-soft); }
.cp-am-llvl { font-family: var(--mono, ui-monospace); color: var(--accent); font-weight: 700; } .cp-am-llabel { color: var(--text); text-transform: capitalize; } .cp-am-lgate { color: var(--text-3); } .cp-am-levid { color: var(--text-3); font-style: italic; }
.cp-kpis { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.cp-kpi { font-size: 0.72rem; color: var(--text-3); border: 1px solid var(--line-2); border-radius: 999px; padding: 0.15rem 0.55rem; }
.cp-kpi b { color: var(--text); font-variant-numeric: tabular-nums; }
.cp-kpi.ok b { color: var(--live); } .cp-kpi.warn.hot b { color: var(--amber); }
.cp-kpi.risk { border-color: rgba(240,101,106,0.5); } .cp-kpi.risk b { color: var(--down); }
.cp-lede { margin: 0; max-width: 80ch; font-size: 0.9rem; color: var(--text-2); } .cp-lede b { color: var(--text); font-weight: 600; }

/* Alerts strip */
.cp-alerts { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.cp-alert { display: flex; align-items: flex-start; gap: 0.5rem; text-align: left; border: 1px solid var(--line-2); border-radius: 10px; padding: 0.45rem 0.65rem; background: var(--surface); cursor: pointer; max-width: 30rem; color: var(--text-2); }
.cp-alert:hover { border-color: var(--text-3); }
.cp-alert.critical { border-color: rgba(240,101,106,0.5); background: rgba(240,101,106,0.06); } .cp-alert.warn { border-color: rgba(227,179,65,0.4); background: rgba(227,179,65,0.05); }
.cp-alert-sev { font-size: 0.85rem; line-height: 1.2; } .cp-alert.critical .cp-alert-sev { color: var(--down); } .cp-alert.warn .cp-alert-sev { color: var(--amber); } .cp-alert.info .cp-alert-sev { color: var(--info); }
.cp-alert-body { display: flex; flex-direction: column; gap: 0.1rem; } .cp-alert-body b { font-size: 0.76rem; color: var(--text); } .cp-alert-detail { font-size: 0.66rem; color: var(--text-3); line-height: 1.4; }

.cp-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 0.9rem; }
@media (max-width: 900px) { .cp-grid { grid-template-columns: 1fr; } }
.cp-queue { grid-row: span 2; }
.cp-card { border: 1px solid var(--line); border-radius: 12px; background: var(--surface); padding: 0.9rem 1rem; }
.cp-card-h { font-size: 0.82rem; font-weight: 650; display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.7rem; }
.cp-sub { font-family: var(--mono, ui-monospace); font-size: 0.58rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-3); font-weight: 400; }

/* Bulk bar + checkboxes */
.cp-q-bulk { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; margin-bottom: 0.55rem; flex-wrap: wrap; }
.cp-check { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.68rem; color: var(--text-3); cursor: pointer; } .cp-check.tiny { gap: 0; }
.cp-check input { accent-color: var(--accent); cursor: pointer; }
.cp-bulk-acts { display: flex; align-items: center; gap: 0.4rem; }

.cp-q-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.55rem; }
.cp-q-item { border: 1px solid var(--line); border-radius: 10px; padding: 0.6rem 0.7rem; background: var(--surface-2, #1b1e25); }
.cp-q-item.sel { border-color: var(--accent); background: var(--accent-soft); }
.cp-q-item.overdue { border-left: 3px solid var(--down); }
.cp-q-top { display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap; font-size: 0.6rem; }
.cp-q-kind { font-family: var(--mono, ui-monospace); text-transform: uppercase; letter-spacing: 0.06em; color: var(--info); border: 1px solid rgba(88,166,255,0.4); border-radius: 4px; padding: 0.05rem 0.35rem; }
.cp-q-policy { font-family: var(--mono, ui-monospace); text-transform: uppercase; letter-spacing: 0.06em; padding: 0.05rem 0.35rem; border-radius: 4px; }
.cp-q-policy.review { color: var(--amber); background: var(--amber-soft); } .cp-q-policy.provisional { color: var(--info); background: var(--info-soft); } .cp-q-policy.proposed { color: var(--text-3); border: 1px solid var(--line-2); }
.cp-q-omega { font-family: var(--mono, ui-monospace); color: var(--text-2); }
.cp-q-age { font-family: var(--mono, ui-monospace); color: var(--text-3); } .cp-q-age.over { color: var(--down); }
.cp-q-conf { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--text-3); }
.cp-q-summary { font-size: 0.86rem; margin: 0.3rem 0 0.15rem; }
.cp-q-meta { font-size: 0.66rem; color: var(--text-3); }
.cp-q-acts { display: flex; gap: 0.4rem; margin-top: 0.5rem; align-items: center; flex-wrap: wrap; }
.cp-act { font-size: 0.72rem; border-radius: 7px; padding: 0.25rem 0.6rem; cursor: pointer; border: 1px solid var(--line-2); background: transparent; color: var(--text-2); }
.cp-act.admit { border-color: var(--live); color: var(--live); } .cp-act.admit:hover { background: var(--live-soft); }
.cp-act.reject { border-color: rgba(240,101,106,0.5); color: var(--down); } .cp-act.reject:hover { background: rgba(240,101,106,0.1); } .cp-act.hold:hover { color: var(--text); }
.cp-reason { font-size: 0.66rem; background: var(--surface); color: var(--text-2); border: 1px solid var(--line-2); border-radius: 6px; padding: 0.2rem 0.3rem; cursor: pointer; }

.cp-seats, .cp-pol { display: grid; gap: 0.4rem; }
.cp-seat { display: grid; grid-template-columns: 1.4fr auto auto; gap: 0.6rem; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 0.4rem; border-radius: 8px; transition: background 0.3s; }
.cp-seat:last-child { border-bottom: 0; }
.cp-seat.risk { background: rgba(240,101,106,0.05); }
.cp-seat.focus { background: var(--accent-soft); outline: 1px solid var(--accent); }
.cp-risk-flag { margin-left: 0.5rem; font-family: var(--mono, ui-monospace); font-size: 0.56rem; color: var(--down); border: 1px solid rgba(240,101,106,0.4); border-radius: 4px; padding: 0.02rem 0.3rem; }
.cp-seat-id { display: flex; align-items: center; gap: 0.5rem; }
.cp-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; } .cp-dot.active { background: var(--live); } .cp-dot.idle { background: var(--amber); } .cp-dot.suspended { background: var(--down); }
.cp-seat-name { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; font-size: 0.82rem; font-weight: 600; } .cp-seat-role { font-size: 0.66rem; color: var(--text-3); }
.cp-seat-auto { display: flex; align-items: center; gap: 0.35rem; }
.cp-auto-lvl { font-size: 0.66rem; color: var(--text-2); white-space: nowrap; font-variant-numeric: tabular-nums; }
.cp-step { border: 1px solid var(--line-2); background: transparent; color: var(--text-2); border-radius: 6px; width: 1.3rem; height: 1.3rem; cursor: pointer; line-height: 1; } .cp-step:disabled { opacity: 0.35; cursor: default; } .cp-step:hover:not(:disabled) { color: var(--accent); border-color: var(--accent); }
.cp-seat-stat { font-size: 0.64rem; color: var(--text-3); white-space: nowrap; font-variant-numeric: tabular-nums; }
.cp-pol-row { display: grid; grid-template-columns: 1fr auto; gap: 0.4rem 0.6rem; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 0.4rem; }
.cp-pol-row:last-child { border-bottom: 0; }
.cp-pol-role { font-size: 0.8rem; font-weight: 600; } .cp-pol-cap { font-family: var(--mono, ui-monospace); font-size: 0.62rem; color: var(--accent); }
.cp-pol-mem { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 0.25rem; }
.cp-mem-chip { font-size: 0.58rem; color: var(--text-3); border: 1px solid var(--line-2); border-radius: 999px; padding: 0.05rem 0.4rem; }
.cp-mem-chip.unused { color: var(--amber); border-color: rgba(227,179,65,0.4); border-style: dashed; }

/* Seat clickable + flags */
.cp-seat-id { display: flex; align-items: center; gap: 0.5rem; background: transparent; border: 0; padding: 0.1rem 0.2rem 0.1rem 0; margin: -0.1rem; border-radius: 8px; cursor: pointer; text-align: left; color: inherit; } .cp-seat-id:hover { background: rgba(255,255,255,0.03); }
.cp-unused-flag { margin-left: 0.5rem; font-size: 0.56rem; color: var(--amber); border: 1px dashed rgba(227,179,65,0.4); border-radius: 4px; padding: 0.02rem 0.3rem; }

/* Policy what-if simulator */
.cp-sim { margin-top: 0.7rem; border-top: 1px solid var(--line); padding-top: 0.6rem; }
.cp-sim-h { font-size: 0.72rem; font-weight: 620; display: flex; align-items: baseline; gap: 0.4rem; margin-bottom: 0.4rem; }
.cp-sim-ctl { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; font-size: 0.72rem; color: var(--text-2); }
.cp-sim-out { margin: 0.45rem 0 0; font-size: 0.72rem; color: var(--text-3); } .cp-sim-out.hot { color: var(--amber); }
.cp-sim-seat { display: inline-block; margin-left: 0.35rem; font-family: var(--mono, ui-monospace); font-size: 0.66rem; color: var(--text-2); }

/* Containment write buttons */
.cp-am-write { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; margin-top: 0.35rem; }
.cp-am-wlabel { font-size: 0.62rem; color: var(--text-3); }
.cp-am-wbtn { font-size: 0.62rem; text-transform: capitalize; color: var(--text-2); border: 1px solid var(--line-2); background: transparent; border-radius: 6px; padding: 0.15rem 0.45rem; cursor: pointer; } .cp-am-wbtn.on { color: var(--live); border-color: var(--live); background: var(--live-soft); } .cp-am-wbtn:disabled { opacity: 0.5; cursor: default; }
.cp-am-wbtn.danger { color: var(--down); border-color: rgba(240,101,106,0.5); } .cp-am-wbtn.danger:hover:not(:disabled) { background: rgba(240,101,106,0.1); }
.cp-am-wbtn.safe { color: var(--live); border-color: var(--live); }

/* Seat detail drawer */
.cp-drawer-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; justify-content: flex-end; z-index: 40; }
.cp-drawer { width: min(440px, 92vw); height: 100%; background: var(--surface); border-left: 1px solid var(--line); padding: 1rem 1.1rem 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.85rem; }
.cp-dr-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
.cp-dr-name { display: flex; align-items: center; gap: 0.4rem; font-size: 1rem; font-weight: 640; } .cp-dr-sub { font-size: 0.7rem; color: var(--text-3); margin-top: 0.15rem; text-transform: capitalize; }
.cp-dr-x { border: 1px solid var(--line-2); background: transparent; color: var(--text-2); border-radius: 6px; width: 1.6rem; height: 1.6rem; cursor: pointer; }
.cp-dr-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem 0.7rem; }
.cp-dr-fact { display: flex; flex-direction: column; gap: 0.1rem; } .cp-dr-fact span { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); } .cp-dr-fact strong { font-size: 0.74rem; font-weight: 560; } .cp-dr-fact em { color: var(--text-3); font-style: normal; }
.cp-dr-block { border-top: 1px solid var(--line); padding-top: 0.6rem; }
.cp-dr-bh { font-size: 0.74rem; font-weight: 620; display: flex; align-items: baseline; gap: 0.4rem; margin-bottom: 0.4rem; }
.cp-dr-caps { display: flex; flex-wrap: wrap; gap: 0.25rem; } .cp-dr-caps .cp-mem-chip.on { color: var(--live); border-color: rgba(63,185,80,0.4); }
.cp-dr-hint { margin: 0.4rem 0 0; font-size: 0.68rem; color: var(--amber); } .cp-dr-hint.role { color: var(--text-3); } .cp-dr-hint.role b { color: var(--amber); }
.cp-dr-act { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.35rem; }
.cp-dr-arow { display: flex; align-items: baseline; gap: 0.5rem; font-size: 0.72rem; } .cp-dr-arow.empty { color: var(--text-3); }
.cp-dr-adot { width: 6px; height: 6px; border-radius: 50%; background: var(--live); flex-shrink: 0; align-self: center; } .cp-dr-adot.bad { background: var(--amber); }
.cp-dr-atext { flex: 1; color: var(--text); } .cp-dr-asurf { font-size: 0.58rem; color: var(--text-3); border: 1px solid var(--line-2); border-radius: 4px; padding: 0.02rem 0.3rem; } .cp-dr-atime { font-size: 0.64rem; color: var(--text-3); white-space: nowrap; }
.cp-dr-acts { margin-top: auto; display: flex; flex-direction: column; gap: 0.4rem; padding-top: 0.6rem; border-top: 1px solid var(--line); } .cp-dr-acts .cp-act { width: 100%; }

/* Audit card */
.cp-audit-card { }
.cp-audit-tools { margin-left: auto; display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; }
.cp-audit-search { font-size: 0.68rem; background: var(--surface-2, #1b1e25); color: var(--text); border: 1px solid var(--line-2); border-radius: 6px; padding: 0.22rem 0.5rem; width: 12rem; }
.cp-af { font-size: 0.62rem; text-transform: capitalize; color: var(--text-3); border: 1px solid var(--line-2); background: transparent; border-radius: 6px; padding: 0.18rem 0.45rem; cursor: pointer; } .cp-af.on { color: var(--accent); border-color: var(--accent); background: var(--accent-soft); } .cp-af:disabled { opacity: 0.4; cursor: default; }
.cp-audit-count { font-size: 0.62rem; color: var(--text-3); margin-bottom: 0.4rem; font-variant-numeric: tabular-nums; }
.cp-audit { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.4rem; }
.cp-audit-row { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; font-size: 0.72rem; }
.cp-audit-dec { font-family: var(--mono, ui-monospace); font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.05rem 0.35rem; border-radius: 4px; white-space: nowrap; color: var(--amber); background: var(--amber-soft); }
.cp-audit-dec.admitted, .cp-audit-dec.executed { color: var(--live); background: var(--live-soft); } .cp-audit-dec.rejected { color: var(--down); background: rgba(240,101,106,0.13); }
.cp-audit-subj { color: var(--text); } .cp-audit-reason { font-size: 0.58rem; color: var(--text-3); border: 1px solid var(--line-2); border-radius: 4px; padding: 0.02rem 0.3rem; } .cp-audit-meta { color: var(--text-3); } .cp-audit-meta code { font-size: 0.62rem; }

/* Governed acquisition activity card */
.cp-acq-open { margin-left: auto; font-size: 0.68rem; color: var(--accent); text-decoration: none; }
.cp-acq-open:hover { text-decoration: underline; }
.cp-acq-kpis { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.7rem 0.9rem 0; }
.cp-acq-list { display: flex; flex-direction: column; padding: 0.5rem 0.9rem 0.8rem; }
.cp-acq-row { display: flex; align-items: center; gap: 0.6rem; padding: 0.35rem 0; border-bottom: 1px solid var(--line); font-size: 0.74rem; }
.cp-acq-row:last-child { border-bottom: none; }
.cp-acq-state { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.4rem; white-space: nowrap; }
.cp-acq-state.landed { color: var(--live); background: var(--live-soft); } .cp-acq-state.admitted { color: #93b4ff; background: rgba(120,160,255,0.14); } .cp-acq-state.held { color: var(--accent); background: var(--accent-soft); }
.cp-acq-id { font-family: ui-monospace, monospace; color: var(--text-2); }
.cp-acq-meta { color: var(--text-3); font-variant-numeric: tabular-nums; margin-left: auto; white-space: nowrap; }
.cp-acq-err { color: var(--down); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 14rem; }
.cp-acq-empty { padding: 0.8rem 0.9rem 1rem; margin: 0; font-size: 0.78rem; color: var(--text-3); line-height: 1.5; }
.cp-acq-empty code { font-size: 0.72rem; } .cp-acq-empty a { color: var(--accent); }
</style>
