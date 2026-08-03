<template>
  <section class="cw" aria-label="Cowork — collaboration">
    <SurfaceHeader :title="scope && !scope.isPrimary ? scope.label : 'Cowork'" :eyebrow="scope?.domain ?? 'Collaboration · Sovereign'">
      <template #badge><span class="cw-pill" :class="{ live: liveState === 'live' }">{{ liveState === 'live' ? `live · ${displayThreads.length} threads` : 'sovereign fixture' }}</span></template>
      <template #actions>
        <LiveToggle :state="liveState" label="Go live" live-text="Sovereign" title="Opt in to the live sovereign cowork endpoint (/api/cowork/threads). Fails closed to the fixture when no sovereign base is configured." @click="goLive" />
        <div class="cw-agg">
          <span class="cw-agg-k">Threads</span><span class="cw-num">{{ displayThreads.length }}</span>
          <span class="cw-agg-k">Decided</span><span class="cw-num">{{ decidedCount }}</span>
        </div>
      </template>
    </SurfaceHeader>
    <p class="cw-note">
      Cowork sits <b>on</b> the sovereign work graph, not beside it: every thread's subject is a real <b>WBS task or element</b>, participants resolve through HolographMe, and a recorded <b>decision</b> carries an execution receipt. Local-first, receipted — not a chat silo.
    </p>

    <SplitPane storage-key="cowork" label="threads" :initial="360">
      <template #list>
        <div class="cw-list" aria-label="Threads">
          <p class="cw-count">{{ displayThreads.length }} threads</p>
          <button v-for="th in displayThreads" :key="th.id" class="cw-row" :class="{ on: th.id === selectedId }" @click="selectedId = th.id">
            <div class="cw-row-top">
              <span class="cw-subj">{{ th.subjectRef }}</span>
              <span class="cw-status" :class="th.status">{{ th.status }}</span>
            </div>
            <div class="cw-row-name">{{ th.title }}</div>
            <div class="cw-row-foot"><span>{{ th.participantRefs.length }} participants</span><span>{{ th.messages.length }} messages</span></div>
          </button>
        </div>
      </template>

      <template #detail>
        <article v-if="selected" class="cw-detail" aria-label="Thread detail">
          <div class="cw-d-head">
            <div class="cw-d-name">{{ selected.title }}</div>
            <span class="cw-status lg" :class="selected.status">{{ selected.status }}</span>
          </div>
          <div class="cw-d-sub">
            on
            <button class="cw-subj-link" @click="openSubject(selected)">{{ selected.subjectKind }} <span class="cw-subj">{{ selected.subjectRef }}</span> ↗</button>
          </div>

          <div class="cw-parts">
            <span v-for="p in selected.participantRefs" :key="p" class="cw-part" :style="{ borderColor: tierColor(p) }">
              <button class="cw-part-b" @click="openContributor(p)">{{ reputationFor(p)?.displayName ?? p }}<span class="cw-part-tier" :style="{ color: tierColor(p) }"> · {{ reputationFor(p)?.tier ?? 'unrated' }}</span></button>
            </span>
          </div>

          <div class="cw-thread">
            <div v-for="m in selected.messages" :key="m.id" class="cw-msg" :class="m.kind">
              <div class="cw-msg-head">
                <button class="cw-msg-author" @click="openContributor(m.authorRef)">{{ reputationFor(m.authorRef)?.displayName ?? m.authorRef }}</button>
                <span class="cw-kind" :class="m.kind">{{ m.kind }}</span>
                <span class="cw-at">{{ shortDate(m.at) }}</span>
              </div>
              <div class="cw-msg-body">{{ m.body }}</div>
              <div v-if="m.evidenceRef" class="cw-ev" :title="'Execution receipt / source'">⛓ {{ m.evidenceRef }}</div>
            </div>
          </div>

          <div v-if="selected.decision" class="cw-decision">
            <span class="cw-decision-k">Decision</span>
            <span>{{ selected.decision }}</span>
          </div>

          <div class="cw-boundary">
            Sovereign collaboration bound to the WBS. Participants resolve through HolographMe <code>reputationFor()</code>; decisions carry executions-ledger receipts. <b>No external chat integration or writeback authority is active here</b>; the live pull fails closed.
          </div>
        </article>
        <div v-else class="cw-detail empty">Select a thread</div>
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
import { threads as fixtureThreads, type CoworkThread } from '../data/coworkFixture';
import { fetchCoworkThreadsLive } from '../data/adapters/coworkLive';
import { reputationFor, TIER_META } from '../features/reputation/reputation';

const router = useRouter();
const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

const liveState = ref<'idle' | 'loading' | 'live' | 'error'>('idle');
const liveThreads = ref<CoworkThread[]>([]);
const displayThreads = computed<CoworkThread[]>(() => (liveState.value === 'live' && liveThreads.value.length ? liveThreads.value : fixtureThreads));

const selectedId = ref<string>(fixtureThreads[0]!.id);
const selected = computed<CoworkThread | undefined>(() => displayThreads.value.find((t) => t.id === selectedId.value));
const decidedCount = computed(() => displayThreads.value.filter((t) => t.status === 'decided').length);

async function goLive() {
  if (liveState.value === 'loading') return;
  liveState.value = 'loading';
  const live = await fetchCoworkThreadsLive();
  if (!live || !live.length) { liveState.value = 'error'; return; }
  liveThreads.value = live;
  liveState.value = 'live';
  selectedId.value = live[0]!.id;
}

function tierColor(ref?: string): string {
  const r = reputationFor(ref ?? '');
  return r ? TIER_META[r.tier].color : '#8b949e';
}
function openContributor(ref?: string) {
  const r = reputationFor(ref ?? '');
  if (r) router.push({ path: '/operator/holograph-me', query: { id: r.id } });
}
// Cowork threads cross-link back to the sovereign WBS subject.
function openSubject(th: CoworkThread) {
  router.push({ path: '/delivery/wbs', query: { subject: th.subjectRef } });
}
function shortDate(iso: string): string {
  return iso.slice(0, 10);
}
</script>

<style scoped>
.cw { height: 100%; min-height: 0; display: grid; grid-template-rows: auto auto 1fr; gap: 0.6rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: var(--text); }
.cw-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); background: var(--accent-soft); border-radius: 5px; padding: 0.1rem 0.4rem; }
.cw-pill.live { color: var(--up); background: rgba(63, 185, 80, 0.14); }
.cw-agg { display: flex; align-items: center; gap: 0.5rem; font-size: 0.72rem; color: var(--text-3); }
.cw-agg-k { text-transform: uppercase; letter-spacing: 0.05em; } .cw-agg .cw-num { color: var(--text); font-variant-numeric: tabular-nums; margin-right: 0.4rem; }
.cw-note { margin: 0; font-size: 0.8rem; color: var(--text-3); max-width: 100ch; line-height: 1.5; } .cw-note b { color: var(--text-2); }

.cw-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; }
.cw-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); border-bottom: 1px solid var(--line); }
.cw-row { width: 100%; display: grid; gap: 0.3rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.6rem 0.85rem; cursor: pointer; text-align: left; }
.cw-row:hover { background: var(--surface-2); } .cw-row.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.cw-row-top { display: flex; align-items: center; gap: 0.4rem; }
.cw-row-name { font-size: 0.84rem; font-weight: 600; line-height: 1.3; }
.cw-row-foot { display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; color: var(--text-3); }
.cw-subj { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.03em; font-weight: 800; color: #93c5fd; background: rgba(88,166,255,0.14); border-radius: 4px; padding: 0.05rem 0.35rem; }
.cw-status { margin-left: auto; font-size: 0.56rem; text-transform: uppercase; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; } .cw-status.lg { font-size: 0.66rem; padding: 0.15rem 0.5rem; margin-left: 0; }
.cw-status.open { color: #58a6ff; background: rgba(88,166,255,0.14); } .cw-status.proposed { color: var(--accent); background: rgba(216,162,80,0.16); } .cw-status.decided { color: var(--up); background: rgba(75,191,115,0.16); } .cw-status.blocked { color: var(--down); background: rgba(240,101,106,0.16); }

.cw-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem 1.1rem; }
.cw-detail.empty { display: grid; place-items: center; color: var(--text-3); font-size: 0.85rem; }
.cw-d-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.cw-d-name { font-size: 1.1rem; font-weight: 620; line-height: 1.35; }
.cw-d-sub { font-size: 0.76rem; color: var(--text-3); margin-top: 0.25rem; }
.cw-subj-link { border: none; background: transparent; color: var(--text-2); cursor: pointer; font: inherit; padding: 0; } .cw-subj-link:hover { color: var(--accent); }
.cw-parts { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.8rem 0 0.2rem; }
.cw-part { border: 1px solid var(--line-2); border-left-width: 3px; border-radius: 6px; }
.cw-part-b { border: none; background: transparent; color: var(--text-2); cursor: pointer; font-size: 0.72rem; padding: 0.15rem 0.4rem; } .cw-part-b:hover { color: var(--accent); }
.cw-part-tier { text-transform: uppercase; font-size: 0.9em; }

.cw-thread { margin-top: 0.9rem; display: grid; gap: 0.5rem; }
.cw-msg { border: 1px solid var(--line); border-radius: 10px; padding: 0.5rem 0.7rem; background: var(--surface-2); border-left: 2px solid var(--line-2); }
.cw-msg.proposal { border-left-color: var(--accent); } .cw-msg.decision { border-left-color: var(--up); } .cw-msg.evidence { border-left-color: #93c5fd; }
.cw-msg-head { display: flex; align-items: center; gap: 0.5rem; }
.cw-msg-author { border: none; background: transparent; color: var(--text); font-size: 0.8rem; font-weight: 600; cursor: pointer; padding: 0; } .cw-msg-author:hover { color: var(--accent); }
.cw-kind { font-size: 0.54rem; text-transform: uppercase; font-weight: 700; border-radius: 3px; padding: 0.05rem 0.3rem; color: var(--text-3); background: rgba(139,148,158,0.16); }
.cw-kind.proposal { color: var(--accent); background: rgba(216,162,80,0.16); } .cw-kind.decision { color: var(--up); background: rgba(75,191,115,0.16); } .cw-kind.evidence { color: #93c5fd; background: rgba(88,166,255,0.14); }
.cw-at { margin-left: auto; font-size: 0.68rem; color: var(--text-3); font-variant-numeric: tabular-nums; }
.cw-msg-body { font-size: 0.82rem; color: var(--text-2); line-height: 1.5; margin-top: 0.3rem; }
.cw-ev { font-size: 0.68rem; color: var(--up); margin-top: 0.3rem; font-variant-numeric: tabular-nums; }
.cw-decision { margin-top: 0.9rem; border: 1px solid rgba(75,191,115,0.4); background: rgba(75,191,115,0.08); border-radius: 10px; padding: 0.6rem 0.75rem; display: grid; gap: 0.2rem; }
.cw-decision-k { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: var(--up); }
.cw-boundary { font-size: 0.72rem; color: var(--text-3); padding-top: 0.9rem; margin-top: 1rem; border-top: 1px solid var(--line); line-height: 1.55; } .cw-boundary b { color: var(--text-2); } .cw-boundary code { font-family: ui-monospace, monospace; }
</style>
