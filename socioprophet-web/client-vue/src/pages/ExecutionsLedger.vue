<!-- Executions Ledger — the governed agent-execution surface.
     Every row shows its warrant: a verdict (not a boolean), the receipt hash, the
     blast link, and (on expand) the capabilities held vs used + the ExecutionDecision.
     Fixture-first (demoLedger) until a live /svc/executions endpoint is wired. -->
<template>
  <section class="ledger-surface">
    <header class="lh">
      <div>
        <div class="eyebrow">SocioProphet Cockpit · Governed Estate</div>
        <h1>Executions Ledger</h1>
        <p class="sub">Hash-sealed, replayable agent executions. Status is a verdict backed by a proof artifact — never a bare “Successful”.</p>
      </div>
      <div class="kpis">
        <div class="kpi"><span class="n">{{ rows.length }}</span><span class="k">executions</span></div>
        <div class="kpi"><span class="n v-pos">{{ verifiedCount }}</span><span class="k">verified</span></div>
        <div class="kpi"><span class="n" style="color:var(--sp-amber-70)">{{ heldCount }}</span><span class="k">held / denied</span></div>
      </div>
    </header>

    <div class="filterbar">
      <input
        class="q"
        type="text"
        aria-label="Filter executions"
        placeholder="status:verified  input:external_alert|event  receipt:present  level:bounded"
        v-model="query"
      />
      <span class="count">{{ filtered.length }} / {{ rows.length }}</span>
    </div>

    <div class="tbl-scroll">
      <table class="ledger">
        <thead>
          <tr>
            <th>Executed At (UTC)</th><th>Agent</th><th>Input</th><th>Verdict</th><th>Blast</th><th>Warrant</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in filtered" :key="row.executionReceiptId">
            <tr class="exec-row" tabindex="0" role="button"
              :aria-expanded="open.has(row.executionReceiptId)"
              @click="toggle(row.executionReceiptId)"
              @keydown.enter="toggle(row.executionReceiptId)"
              @keydown.space.prevent="toggle(row.executionReceiptId)">
              <td class="mono when">{{ fmt(row.executedAt) }}</td>
              <td><div class="agent"><span class="an">{{ row.agent.name }}</span><span class="av mono">{{ row.agent.version }}</span></div></td>
              <td><span class="in-tag mono">{{ inputLabel(row.input.type) }}</span></td>
              <td>
                <span class="chip" :class="verdictClass(row.verdict)">{{ row.verdict }}</span>
                <span v-if="row.epistemicLevel" class="lvl mono">{{ row.epistemicLevel }}</span>
              </td>
              <td>
                <span v-if="row.blast" class="mono blast">{{ row.blast.hops }} hop{{ row.blast.hops === 1 ? '' : 's' }} · {{ row.blast.reachableCount }}</span>
                <span v-else class="mono muted">—</span>
              </td>
              <td><span class="mono receipt"><span class="seal">✦</span>{{ shortHash(row.receiptHash) }}</span></td>
            </tr>
            <tr v-show="open.has(row.executionReceiptId)" class="warrant-row">
              <td colspan="6">
                <div class="warrant">
                  <div class="wsec">
                    <div class="eyebrow">ExecutionDecision</div>
                    <div class="decision" :class="{ pend: row.decision.verdict === 'require_approval', deny: row.decision.verdict === 'block' }">
                      <b>{{ decisionLabel(row.decision.verdict) }}</b>
                      <span class="mono">authority: {{ row.decision.authorityBand }}<template v-if="row.decision.latencyMs != null"> · {{ row.decision.latencyMs }}ms</template></span>
                    </div>
                  </div>
                  <div class="wsec">
                    <div class="eyebrow">Capabilities held → used</div>
                    <div class="caps">
                      <span v-for="c in row.capabilitiesHeld" :key="c" class="cap mono" :class="{ used: row.capabilitiesUsed.includes(c) }">
                        <span v-if="row.capabilitiesUsed.includes(c)" class="dot">✓</span>{{ c }}
                      </span>
                    </div>
                  </div>
                  <div class="wsec">
                    <div class="eyebrow">ProofArtifact</div>
                    <div class="proof mono">
                      {{ row.receiptHash }}<br />
                      replayable={{ row.proofReplayable }} · epistemicLevel={{ row.epistemicLevel ?? 'n/a' }}
                      <span v-if="row.verdict === 'verified' && !row.proofReplayable" class="warn">⊘ verified verdict requires a replayable artifact</span>
                    </div>
                  </div>
                  <div v-if="row.blast" class="wsec">
                    <div class="eyebrow">Blast (GBRG)</div>
                    <div class="mono">
                      <RouterLink class="blink" :to="`/control-plane/containment?node=${encodeURIComponent(row.blast.targetNode)}`">{{ row.blast.targetNode }}</RouterLink>
                      — {{ row.blast.reachableCount }} reachable · {{ row.blast.hops }} hops
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
          <tr v-if="filtered.length === 0"><td colspan="6" class="empty">No executions match the filter.</td></tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { applyFilter, demoLedger, type ExecutionRow, type InputType, type VerdictState, type DecisionVerdict } from '../features/executions-ledger/types';

const rows = ref<ExecutionRow[]>(demoLedger);
const query = ref('');
const open = reactive(new Set<string>());

const filtered = computed(() => applyFilter(rows.value, query.value));
const verifiedCount = computed(() => rows.value.filter((r) => r.verdict === 'verified').length);
const heldCount = computed(() => rows.value.filter((r) => r.verdict !== 'verified').length);

function toggle(id: string) {
  if (open.has(id)) open.delete(id);
  else open.add(id);
}
function verdictClass(v: VerdictState) {
  return v === 'verified' ? 'v-pos' : v === 'denied' ? 'v-neg' : 'tag-amber';
}
function shortHash(h: string) {
  const hex = h.replace(/^sha256:/, '');
  return `${hex.slice(0, 4)}…${hex.slice(-4)}`;
}
function fmt(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}
const INPUT_LABELS: Record<InputType, string> = {
  external_alert: 'alert', reported_phish: 'reported phish', customization: 'customization', detection: 'detection', event: 'event',
};
function inputLabel(t: InputType) { return INPUT_LABELS[t]; }
const DECISION_LABELS: Record<DecisionVerdict, string> = {
  allow: 'ALLOW', block: 'DENY', require_approval: 'APPROVAL REQUIRED', degrade: 'DEGRADE', transform: 'TRANSFORM',
};
function decisionLabel(v: DecisionVerdict) { return DECISION_LABELS[v]; }
</script>

<style scoped>
.ledger-surface { padding: clamp(14px, 2vw, 26px); max-width: 1200px; margin: 0 auto; }
.eyebrow { font-family: var(--font-mono, monospace); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--cds-text-secondary, #6f6f6f); }
.lh { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; }
.lh h1 { font-size: 20px; margin: 3px 0; }
.lh .sub { font-size: 12.5px; color: var(--cds-text-secondary, #6f6f6f); max-width: 60ch; margin: 0; }
.kpis { display: flex; gap: 20px; }
.kpi { display: flex; flex-direction: column; }
.kpi .n { font-family: var(--font-mono, monospace); font-size: 22px; font-weight: 600; font-variant-numeric: tabular-nums; }
.kpi .k { font-size: 10.5px; text-transform: uppercase; letter-spacing: .05em; color: var(--cds-text-secondary, #6f6f6f); }
.filterbar { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.q { flex: 1; font-family: var(--font-mono, monospace); font-size: 12.5px; padding: 9px 12px; border: 1px solid var(--cds-border-strong, #8d8d8d); border-radius: 2px; background: var(--cds-field, #f4f4f4); color: inherit; }
.count { font-family: var(--font-mono, monospace); font-size: 11.5px; color: var(--cds-text-secondary, #6f6f6f); white-space: nowrap; }
.tbl-scroll { overflow-x: auto; }
table.ledger { width: 100%; border-collapse: collapse; font-size: 12.5px; min-width: 760px; }
.ledger thead th { text-align: left; font-family: var(--font-mono, monospace); font-weight: 500; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--cds-text-secondary, #6f6f6f); padding: 9px 12px; border-bottom: 1px solid var(--cds-border-strong, #8d8d8d); white-space: nowrap; }
.exec-row { cursor: pointer; border-bottom: 1px solid var(--cds-border-subtle, #e0e0e0); }
.exec-row:hover { background: var(--cds-layer-hover, #e8e8e8); }
.exec-row td { padding: 10px 12px; vertical-align: middle; }
.mono { font-family: var(--font-mono, monospace); }
.when { color: var(--cds-text-secondary, #6f6f6f); font-variant-numeric: tabular-nums; white-space: nowrap; }
.agent { display: flex; flex-direction: column; gap: 1px; }
.agent .an { font-weight: 550; }
.agent .av { font-size: 10.5px; color: var(--cds-text-secondary, #6f6f6f); }
.in-tag { font-size: 10.5px; border: 1px solid var(--cds-border-subtle, #e0e0e0); border-radius: 3px; padding: 2px 6px; color: var(--cds-text-secondary, #6f6f6f); }
.chip { font-family: var(--font-mono, monospace); font-size: 11px; padding: 2px 8px; border-radius: 3px; border: 1px solid currentColor; }
.chip.v-pos { background: var(--sp-green-10); } .chip.v-neg { background: var(--sp-red-10); }
.chip.tag-amber { border-color: var(--sp-amber); color: var(--sp-amber-70); background: var(--sp-amber-10); }
.lvl { font-size: 9.5px; color: var(--cds-text-secondary, #6f6f6f); margin-left: 6px; }
.blast { color: var(--cds-text-secondary, #4f4f4f); font-variant-numeric: tabular-nums; }
.muted { color: var(--cds-text-placeholder, #a8a8a8); }
.receipt { font-size: 11px; color: var(--cds-text-secondary, #4f4f4f); }
.receipt .seal { color: var(--sp-amber-70, #b28600); margin-right: 4px; }
.warrant-row td { padding: 0 12px 14px; background: var(--cds-layer-01, #f4f4f4); }
.warrant { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; padding: 12px 2px; }
.wsec { display: flex; flex-direction: column; gap: 6px; }
.decision { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; border-radius: 3px; background: var(--sp-green-10); border: 1px solid var(--sp-green); }
.decision.pend { background: var(--sp-amber-10); border-color: var(--sp-amber); }
.decision.deny { background: var(--sp-red-10); border-color: var(--sp-red); }
.decision b { font-size: 12px; } .decision span { font-size: 10.5px; color: var(--cds-text-secondary, #6f6f6f); }
.caps { display: flex; flex-wrap: wrap; gap: 5px; }
.cap { font-size: 10px; padding: 2px 6px; border-radius: 3px; border: 1px solid var(--cds-border-subtle, #e0e0e0); color: var(--cds-text-secondary, #6f6f6f); }
.cap.used { color: inherit; border-color: var(--cds-border-strong, #8d8d8d); }
.cap .dot { color: var(--sp-green-70); margin-right: 3px; }
.proof { font-size: 10.5px; color: var(--cds-text-secondary, #6f6f6f); word-break: break-all; padding: 8px 10px; border: 1px dashed var(--cds-border-subtle, #e0e0e0); border-radius: 3px; }
.proof .warn { display: block; margin-top: 4px; color: var(--sp-red-70); }
.blink { color: var(--cds-link-primary, #0f62fe); }
.empty { padding: 20px; text-align: center; color: var(--cds-text-secondary, #6f6f6f); }
</style>
