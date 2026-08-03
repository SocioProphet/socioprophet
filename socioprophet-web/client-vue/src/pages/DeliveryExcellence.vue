<template>
  <section class="dx" aria-label="Delivery Excellence — WBS">
    <SurfaceHeader :title="scope && !scope.isPrimary ? scope.label : 'Delivery Excellence'" :eyebrow="scope?.domain ?? 'WBS · Sovereign'">
      <template #badge><span class="dx-pill" :class="{ live: liveState === 'live' }">{{ liveState === 'live' ? `live · ${liveTasks.length} sovereign tasks` : 'sovereign fixture' }}</span></template>
      <template #actions>
        <LiveToggle :state="liveState" label="Go live" live-text="Sovereign" title="Opt in to the live sovereign delivery endpoint (/api/delivery/tasks). Fails closed to the fixture when no sovereign base is configured — nothing egresses off-device." @click="goLive" />
        <div class="dx-agg">
          <span class="dx-agg-k">Elements</span><span class="dx-num">{{ project.elements.length }}</span>
          <span class="dx-agg-k">Tasks</span><span class="dx-num">{{ tasks.length }}</span>
          <span class="dx-agg-k">Done</span><span class="dx-num">{{ doneCount }}</span>
        </div>
      </template>
    </SurfaceHeader>
    <p class="dx-note">
      The Work Breakdown Structure is <b>sovereign-canonical</b>: projects → WBS elements → deliverables → tasks live in the estate's own store, receipted. <b>GitHub issues, Taskwarrior, and cowork are removable sync mirrors</b> — GitHub is transitional (cutover to the sovereign stack). Contributor leads bind to HolographMe; each task maps to an execution receipt.
    </p>

    <SplitPane storage-key="delivery-wbs" label="WBS" :initial="380">
      <template #list>
        <div class="dx-list" aria-label="WBS elements">
          <p class="dx-count">{{ project.name }} · {{ project.elements.length }} service areas</p>
          <button v-for="el in project.elements" :key="el.id" class="dx-row" :class="{ on: el.id === selectedId }" @click="selectedId = el.id">
            <div class="dx-row-top">
              <span class="dx-code">{{ el.code }}</span>
              <span v-if="reputationFor(el.leadRef ?? '')" class="dx-tier" :style="{ color: tierColor(el.leadRef) }">● {{ reputationFor(el.leadRef ?? '')?.displayName }}</span>
            </div>
            <div class="dx-row-name">{{ el.name }}</div>
            <div class="dx-row-foot"><span>{{ el.deliverables.length }} deliverables</span><span class="dx-fte">{{ el.fte?.toFixed(1) }} FTE</span></div>
          </button>
        </div>
      </template>

      <template #detail>
        <article v-if="selected" class="dx-detail" aria-label="Element detail">
          <div class="dx-d-head">
            <div>
              <div class="dx-d-name"><span class="dx-code">{{ selected.code }}</span> {{ selected.name }}</div>
              <div class="dx-d-sub">
                lead
                <button v-if="reputationFor(selected.leadRef ?? '')" class="dx-lead" @click="openContributor(selected.leadRef)">
                  {{ reputationFor(selected.leadRef ?? '')?.displayName }}
                  <span class="dx-tier-tag" :style="{ color: tierColor(selected.leadRef) }">{{ reputationFor(selected.leadRef ?? '')?.tier }}</span> ↗
                </button>
                <span v-else>—</span>
                · {{ selected.fte?.toFixed(2) }} FTE
              </div>
            </div>
          </div>

          <div v-for="d in selected.deliverables" :key="d.id" class="dx-deliv">
            <div class="dx-deliv-h">
              <span class="dx-deliv-id">{{ d.id }}</span>
              <span class="dx-deliv-t">{{ d.title }}</span>
              <span class="dx-gate" :class="d.gate">{{ d.gate.replace('_', ' ') }}</span>
            </div>
            <div v-for="task in d.tasks" :key="task.id" class="dx-task" :class="task.status">
              <div class="dx-task-top">
                <span class="dx-status" :class="task.status">{{ task.status.replace('_', ' ') }}</span>
                <span class="dx-task-title">{{ task.title }}</span>
                <span v-if="task.estimateFte" class="dx-task-fte">{{ task.estimateFte }} FTE</span>
              </div>
              <div class="dx-task-meta">
                <button v-if="reputationFor(task.assigneeRef ?? '')" class="dx-assignee" @click="openContributor(task.assigneeRef)">
                  ◆ {{ reputationFor(task.assigneeRef ?? '')?.displayName }}
                  <span class="dx-tier-tag" :style="{ color: tierColor(task.assigneeRef) }">{{ reputationFor(task.assigneeRef ?? '')?.tier }}</span>
                </button>
                <span v-if="task.dependsOn?.length" class="dx-dep">depends: {{ task.dependsOn.join(', ') }}</span>
                <span v-if="task.executionReceiptId" class="dx-receipt" :title="'Execution receipt (executions-ledger)'">⛓ {{ task.executionReceiptId }}</span>
              </div>
              <div v-if="task.mirrors?.length" class="dx-mirrors">
                <span class="dx-mirrors-k">mirrors</span>
                <span v-for="(m, i) in task.mirrors" :key="i" class="dx-mirror" :class="[m.target, m.state]" :title="`${m.target} mirror (${m.state}) — removable; sovereign task is canonical`">
                  {{ m.target }}<span v-if="m.state === 'drifted'" class="dx-drift"> ⚠ drifted</span><span v-else-if="m.state === 'sovereign_only'" class="dx-sov"> · sovereign-only</span>
                </span>
              </div>
            </div>
          </div>

          <div class="dx-boundary">
            Sovereign-canonical WBS anchored to the XSEDE 2.0 program (NSF #1548562). GitHub/Taskwarrior/cowork are <b>removable</b> sync mirrors; <b>no writeback, issue-creation, or execution authority is active here</b>. Tasks map to executions-ledger receipts; leads/assignees resolve through HolographMe <code>reputationFor()</code>.
          </div>
        </article>
        <div v-else class="dx-detail empty">Select a WBS element</div>
      </template>
    </SplitPane>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import SplitPane from '../components/SplitPane.vue';
import LiveToggle from '../components/LiveToggle.vue';
import { navScopeForPath } from '../config/cockpitNav';
import { XSEDE, allTasks, type WbsElement, type WbsTask } from '../data/wbsFixture';
import { fetchDeliveryTasksLive } from '../data/adapters/deliveryExcellenceLive';
import { reputationFor, TIER_META } from '../features/reputation/reputation';

const router = useRouter();
const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

const project = XSEDE;
const tasks = computed(() => allTasks(project));
const doneCount = computed(() => tasks.value.filter((t) => t.status === 'done').length);

const selectedId = ref<string>(project.elements[0]!.id);
const selected = computed<WbsElement | undefined>(() => project.elements.find((e) => e.id === selectedId.value));

// Noetica opt-in: pull live sovereign tasks; fail-closed to the fixture.
const liveState = ref<'idle' | 'loading' | 'live' | 'error'>('idle');
const liveTasks = ref<WbsTask[]>([]);
async function goLive() {
  if (liveState.value === 'loading') return;
  liveState.value = 'loading';
  const live = await fetchDeliveryTasksLive();
  if (!live || !live.length) { liveState.value = 'error'; return; }
  liveTasks.value = live;
  liveState.value = 'live';
}

function tierColor(ref?: string): string {
  const r = reputationFor(ref ?? '');
  return r ? TIER_META[r.tier].color : '#8b949e';
}
function openContributor(ref?: string) {
  const r = reputationFor(ref ?? '');
  if (r) router.push({ path: '/operator/holograph-me', query: { id: r.id } });
}
</script>

<style scoped>
.dx { height: 100%; min-height: 0; display: grid; grid-template-rows: auto auto 1fr; gap: 0.6rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: var(--text); }
.dx-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); background: var(--accent-soft); border-radius: 5px; padding: 0.1rem 0.4rem; }
.dx-pill.live { color: var(--up); background: rgba(63, 185, 80, 0.14); }
.dx-agg { display: flex; align-items: center; gap: 0.5rem; font-size: 0.72rem; color: var(--text-3); }
.dx-agg-k { text-transform: uppercase; letter-spacing: 0.05em; } .dx-agg .dx-num { color: var(--text); font-variant-numeric: tabular-nums; margin-right: 0.4rem; }
.dx-note { margin: 0; font-size: 0.8rem; color: var(--text-3); max-width: 100ch; line-height: 1.5; } .dx-note b { color: var(--text-2); }

.dx-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; }
.dx-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); border-bottom: 1px solid var(--line); }
.dx-row { width: 100%; display: grid; gap: 0.3rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.6rem 0.85rem; cursor: pointer; text-align: left; }
.dx-row:hover { background: var(--surface-2); } .dx-row.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.dx-row-top { display: flex; align-items: center; gap: 0.4rem; }
.dx-row-name { font-size: 0.84rem; font-weight: 600; line-height: 1.3; }
.dx-row-foot { display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; color: var(--text-3); } .dx-fte { font-variant-numeric: tabular-nums; }
.dx-code { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 800; color: #93c5fd; background: rgba(88,166,255,0.14); border-radius: 4px; padding: 0.05rem 0.35rem; }
.dx-tier { margin-left: auto; font-size: 0.62rem; }

.dx-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem 1.1rem; }
.dx-detail.empty { display: grid; place-items: center; color: var(--text-3); font-size: 0.85rem; }
.dx-d-name { font-size: 1.1rem; font-weight: 620; line-height: 1.35; display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
.dx-d-sub { font-size: 0.76rem; color: var(--text-3); margin-top: 0.25rem; }
.dx-lead, .dx-assignee { border: none; background: transparent; color: var(--text-2); cursor: pointer; padding: 0; font: inherit; } .dx-lead:hover, .dx-assignee:hover { color: var(--accent); }
.dx-tier-tag { text-transform: uppercase; font-size: 0.9em; font-weight: 700; }

.dx-deliv { margin-top: 1rem; border: 1px solid var(--line); border-radius: 10px; padding: 0.6rem 0.75rem; background: var(--surface-2); }
.dx-deliv-h { display: flex; align-items: baseline; gap: 0.5rem; }
.dx-deliv-id { font-size: 0.6rem; font-weight: 800; color: var(--text-3); font-variant-numeric: tabular-nums; }
.dx-deliv-t { font-size: 0.84rem; font-weight: 600; flex: 1; }
.dx-gate { font-size: 0.54rem; text-transform: uppercase; font-weight: 700; border-radius: 3px; padding: 0.05rem 0.35rem; }
.dx-gate.accepted { color: var(--up); background: rgba(75,191,115,0.16); } .dx-gate.in_review { color: var(--accent); background: rgba(216,162,80,0.16); } .dx-gate.draft { color: #8b949e; background: rgba(139,148,158,0.16); } .dx-gate.at_risk { color: var(--down); background: rgba(240,101,106,0.16); }

.dx-task { margin-top: 0.5rem; padding: 0.4rem 0.5rem; border-left: 2px solid var(--line-2); border-radius: 0 6px 6px 0; }
.dx-task.done { border-left-color: var(--up); } .dx-task.in_progress { border-left-color: var(--accent); } .dx-task.blocked { border-left-color: var(--down); } .dx-task.review { border-left-color: #93c5fd; }
.dx-task-top { display: flex; align-items: center; gap: 0.5rem; }
.dx-status { font-size: 0.54rem; text-transform: uppercase; font-weight: 700; border-radius: 3px; padding: 0.05rem 0.3rem; }
.dx-status.done { color: var(--up); background: rgba(75,191,115,0.16); } .dx-status.in_progress { color: var(--accent); background: rgba(216,162,80,0.16); } .dx-status.blocked { color: var(--down); background: rgba(240,101,106,0.16); } .dx-status.review { color: #93c5fd; background: rgba(88,166,255,0.14); } .dx-status.todo { color: #8b949e; background: rgba(139,148,158,0.16); }
.dx-task-title { font-size: 0.82rem; flex: 1; } .dx-task-fte { font-size: 0.66rem; color: var(--text-3); font-variant-numeric: tabular-nums; }
.dx-task-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; font-size: 0.7rem; color: var(--text-3); margin-top: 0.25rem; align-items: center; }
.dx-dep { color: var(--text-3); } .dx-receipt { color: var(--up); font-variant-numeric: tabular-nums; }
.dx-mirrors { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; margin-top: 0.3rem; }
.dx-mirrors-k { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }
.dx-mirror { font-size: 0.6rem; border: 1px solid var(--line-2); border-radius: 4px; padding: 0.05rem 0.35rem; color: var(--text-3); }
.dx-mirror.github { border-color: rgba(139,148,158,0.4); } .dx-mirror.taskwarrior { border-color: rgba(88,166,255,0.4); color: #93c5fd; } .dx-mirror.cowork { border-color: rgba(216,162,80,0.4); color: var(--accent); }
.dx-drift { color: var(--down); } .dx-sov { color: var(--up); }
.dx-boundary { font-size: 0.72rem; color: var(--text-3); padding-top: 0.9rem; margin-top: 1rem; border-top: 1px solid var(--line); line-height: 1.55; } .dx-boundary b { color: var(--text-2); } .dx-boundary code { font-family: ui-monospace, monospace; }
</style>
