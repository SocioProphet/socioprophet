<template>
  <section class="lm" aria-label="Labor market">
    <header class="lm-toolbar">
      <div class="lm-title">
        <div>
          <p class="lm-eyebrow">{{ scope?.domain ?? 'People & Society' }}</p>
          <h1>{{ scope && !scope.isPrimary ? scope.label : 'Labor Market' }}</h1>
        </div>
        <span class="lm-pill">fixture</span>
      </div>
      <div class="lm-agg">
        <span class="lm-agg-k">Requests</span><span class="lm-num">{{ requests.length }}</span>
        <span class="lm-agg-k">Open</span><span class="lm-num">{{ openCount }}</span>
      </div>
    </header>
    <p class="lm-note">Labor as <b>request + response + evidence + fulfillment + trust</b> — not identity, feed, or attention. The unit is a structured request; fit is scored <b>request ↔ response</b>. There is no global human-worth score.</p>

    <div class="lm-body">
      <!-- Request list -->
      <div ref="listEl" class="lm-list" aria-label="Requests" @keydown="arrowRove($event, listEl, '.lm-row')">
        <p class="lm-count">{{ requests.length }} requests</p>
        <button v-for="r in requests" :key="r.id" class="lm-row" :class="{ on: r.id === selectedId }" @click="selectedId = r.id">
          <div class="lm-row-top">
            <span class="lm-rt">{{ r.requestType }}</span>
            <span class="lm-status" :class="r.status">{{ r.status }}</span>
          </div>
          <div class="lm-row-name">{{ r.objective }}</div>
          <div class="lm-row-foot"><span class="lm-comp">{{ compLabel(r.compensation) }}</span><span class="lm-nresp">{{ r.responses.length }} responses</span></div>
        </button>
      </div>

      <!-- Request detail -->
      <article v-if="selected" class="lm-detail" aria-label="Request detail">
        <div class="lm-d-head">
          <div>
            <div class="lm-d-name"><span class="lm-rt">{{ selected.requestType }}</span> {{ selected.objective }}</div>
            <div class="lm-d-sub">requested by {{ selected.requester }} · due {{ selected.responseDeadline }}</div>
          </div>
          <span class="lm-status lg" :class="selected.status">{{ selected.status }}</span>
        </div>

        <p class="lm-outcome"><b>Outcome.</b> {{ selected.outcome }}</p>

        <!-- Compensation (transparency mandatory) + criteria -->
        <div class="lm-facts">
          <div class="lm-fact"><span>Compensation</span><strong :class="{ exempt: selected.compensation.transparency === 'exempt' }">{{ compLabel(selected.compensation) }}</strong></div>
          <div class="lm-fact"><span>Schedule</span><strong>{{ selected.schedule ?? '—' }}</strong></div>
          <div class="lm-fact wide"><span>Evaluation criteria</span><strong>{{ selected.evaluationCriteria.join(' · ') }}</strong></div>
        </div>

        <!-- Responses with per-response fit (NEVER a global score) -->
        <div class="lm-block">
          <div class="lm-block-h">Responses <span>fit is request↔response only</span></div>
          <p v-if="selected.responses.length === 0" class="lm-empty">No responses yet.</p>
          <div v-for="resp in selected.responses" :key="resp.id" class="lm-resp" :class="{ awarded: resp.status === 'awarded' }">
            <div class="lm-resp-head">
              <button class="lm-responder" @click="openResponder(resp)">{{ resp.responder }} ↗</button>
              <span class="lm-resp-status" :class="resp.status">{{ resp.status }}</span>
              <span v-if="resp.fit" class="lm-fit" :class="fitBand(resp.fit.fit)">{{ Math.round(resp.fit.fit * 100) }} fit</span>
            </div>
            <div class="lm-resp-approach">{{ resp.approach }}</div>
            <div class="lm-resp-meta">
              <span v-if="resp.pricing">${{ resp.pricing.toLocaleString() }}</span>
              <span v-if="resp.availability">{{ resp.availability }}</span>
              <span v-for="e in resp.evidence" :key="e" class="lm-ev">◆ {{ e }}</span>
            </div>
            <div v-if="resp.fit" class="lm-rubric">
              <div v-for="(v, k) in resp.fit.rubric" :key="k" class="lm-dim">
                <span class="lm-dim-n">{{ k }}</span>
                <div class="lm-dim-bar"><div class="lm-dim-fill" :style="{ width: v * 100 + '%' }" /></div>
              </div>
              <div v-if="resp.fit.missingEvidence?.length" class="lm-missing">needs: {{ resp.fit.missingEvidence.join(', ') }}</div>
            </div>
          </div>
        </div>

        <!-- Award + work ledger -->
        <div v-if="selected.award" class="lm-block">
          <div class="lm-block-h">Award · work ledger</div>
          <p class="lm-award-terms">{{ selected.award.terms }} <span class="lm-pay">{{ selected.award.paymentModel }}</span></p>
          <div class="lm-milestones">
            <div v-for="(m, i) in selected.award.milestones" :key="i" class="lm-ms" :class="m.status">
              <span class="lm-ms-dot" /><span class="lm-ms-t">{{ m.title }}</span><span class="lm-ms-s">{{ m.status }}</span>
            </div>
          </div>
        </div>

        <!-- Trust events (fulfillment history, not popularity) -->
        <div v-if="selected.trustEvents.length" class="lm-block">
          <div class="lm-block-h">Trust events <span>fulfillment history, not followers</span></div>
          <div v-for="(t, i) in selected.trustEvents" :key="i" class="lm-trust">
            <span class="lm-trust-k" :class="t.kind">{{ t.kind }}</span>
            <span>{{ t.subject }}</span>
            <span v-if="t.requestTied" class="lm-tied">· tied to this request</span>
            <span class="lm-trust-at">{{ t.at }}</span>
          </div>
        </div>
        <div class="lm-boundary">Shapes mirror the sourceos-spec LaborRequest / LaborResponse / FitScore / LaborAward / TrustEvent contract. Requesters/responders reference the human-spine networks + People.</div>
      </article>
      <div v-else class="lm-detail empty">Select a request</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { navScopeForPath } from '../config/cockpitNav';
import { requests, requestById, type LaborRequest, type Compensation, type Response } from '../data/laborMarketFixture';
import { arrowRove } from '../utils/listKeys';

const router = useRouter();
const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

const selectedId = ref<string>(requests[0]!.id);
const selected = computed<LaborRequest | undefined>(() => requestById(selectedId.value));
const listEl = ref<HTMLElement | null>(null);
const openCount = requests.filter((r) => r.status === 'open' || r.status === 'shortlisting').length;

function compLabel(c: Compensation): string {
  if (c.transparency === 'exempt') return `exempt · ${c.exemptReason}`;
  const rng = c.min !== undefined ? (c.max !== undefined && c.max !== c.min ? `${c.min.toLocaleString()}–${c.max.toLocaleString()}` : c.min.toLocaleString()) : '';
  return `${c.currency ?? ''} ${rng}${c.model ? ` · ${c.model}` : ''}`.trim();
}
function fitBand(f: number): string { return f >= 0.85 ? 'high' : f >= 0.6 ? 'mid' : 'low'; }
// Responders reference the human spine (a person → People directory).
function openResponder(resp: Response) {
  if (resp.responderRef?.startsWith('p-')) router.push({ path: '/people/search', query: { id: resp.responderRef } });
  else router.push({ path: '/people/social-networks' });
}
</script>

<style scoped>
.lm { height: 100%; min-height: 0; display: grid; grid-template-rows: auto auto 1fr; gap: 0.6rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: var(--text); }
.lm-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.lm-title { display: flex; align-items: baseline; gap: 0.6rem; } .lm-title h1 { margin: 0; font-size: 1.3rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.lm-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.lm-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); background: var(--accent-soft); border-radius: 5px; padding: 0.1rem 0.4rem; }
.lm-agg { display: flex; align-items: center; gap: 0.5rem; font-size: 0.72rem; color: var(--text-3); } .lm-agg-k { text-transform: uppercase; letter-spacing: 0.05em; } .lm-agg .lm-num { color: var(--text); font-variant-numeric: tabular-nums; margin-right: 0.4rem; }
.lm-note { margin: 0; font-size: 0.8rem; color: var(--text-3); max-width: 96ch; } .lm-note b { color: var(--text-2); }

.lm-body { min-height: 0; display: grid; grid-template-columns: minmax(280px, 0.85fr) minmax(420px, 1.5fr); gap: 0.75rem; }
@media (max-width: 1080px) { .lm-body { grid-template-columns: 1fr; } .lm-detail { display: none; } }

.lm-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; }
.lm-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); border-bottom: 1px solid var(--line); }
.lm-row { width: 100%; display: grid; gap: 0.3rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.6rem 0.85rem; cursor: pointer; text-align: left; } .lm-row:hover { background: var(--surface-2); } .lm-row.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.lm-row-top { display: flex; align-items: center; gap: 0.4rem; }
.lm-row-name { font-size: 0.84rem; font-weight: 600; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.lm-row-foot { display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; color: var(--text-3); }
.lm-comp { color: var(--up); font-variant-numeric: tabular-nums; }

.lm-rt { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 800; color: #93c5fd; background: rgba(88,166,255,0.14); border-radius: 4px; padding: 0.05rem 0.35rem; }
.lm-status { margin-left: auto; font-size: 0.56rem; text-transform: uppercase; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.35rem; } .lm-status.lg { font-size: 0.66rem; padding: 0.15rem 0.5rem; margin-left: 0; }
.lm-status.open { color: #58a6ff; background: rgba(88,166,255,0.14); } .lm-status.shortlisting { color: var(--accent); background: rgba(216,162,80,0.16); } .lm-status.awarded { color: var(--up); background: rgba(75,191,115,0.16); } .lm-status.closed { color: #8b949e; background: rgba(139,148,158,0.16); }

.lm-detail { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem 1.1rem; }
.lm-detail.empty { display: grid; place-items: center; color: var(--text-3); font-size: 0.85rem; }
.lm-d-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.lm-d-name { font-size: 1.1rem; font-weight: 620; line-height: 1.35; display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; } .lm-d-sub { font-size: 0.76rem; color: var(--text-3); margin-top: 0.2rem; }
.lm-outcome { margin: 0.9rem 0 0; font-size: 0.86rem; line-height: 1.55; color: var(--text-2); } .lm-outcome b { color: var(--text); }
.lm-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem; margin-top: 0.9rem; }
.lm-fact { border: 1px solid var(--line); border-radius: 9px; padding: 0.45rem 0.6rem; background: var(--surface-2); } .lm-fact.wide { grid-column: 1 / -1; } .lm-fact span { display: block; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); } .lm-fact strong { font-size: 0.86rem; } .lm-fact strong.exempt { color: var(--accent); }

.lm-block { margin-top: 1.1rem; }
.lm-block-h { display: flex; align-items: baseline; justify-content: space-between; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); margin-bottom: 0.6rem; } .lm-block-h span { text-transform: none; letter-spacing: 0; font-size: 0.66rem; }
.lm-resp { border: 1px solid var(--line); border-radius: 10px; padding: 0.6rem 0.75rem; margin-bottom: 0.5rem; background: var(--surface-2); } .lm-resp.awarded { border-color: rgba(75,191,115,0.4); }
.lm-resp-head { display: flex; align-items: center; gap: 0.5rem; }
.lm-responder { border: none; background: transparent; color: var(--text); font-size: 0.86rem; font-weight: 600; cursor: pointer; padding: 0; } .lm-responder:hover { color: var(--accent); }
.lm-resp-status { font-size: 0.54rem; text-transform: uppercase; font-weight: 700; border-radius: 3px; padding: 0.05rem 0.3rem; } .lm-resp-status.awarded { color: var(--up); background: rgba(75,191,115,0.16); } .lm-resp-status.shortlisted { color: var(--accent); background: rgba(216,162,80,0.16); } .lm-resp-status.declined { color: #8b949e; background: rgba(139,148,158,0.16); } .lm-resp-status.submitted { color: #58a6ff; background: rgba(88,166,255,0.14); }
.lm-fit { margin-left: auto; font-size: 0.62rem; font-weight: 800; border-radius: 3px; padding: 0.05rem 0.35rem; } .lm-fit.high { color: var(--up); background: rgba(75,191,115,0.16); } .lm-fit.mid { color: var(--accent); background: rgba(216,162,80,0.16); } .lm-fit.low { color: #8b949e; background: rgba(139,148,158,0.16); }
.lm-resp-approach { font-size: 0.8rem; color: var(--text-2); margin: 0.3rem 0; }
.lm-resp-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; font-size: 0.72rem; color: var(--text-3); } .lm-ev { color: var(--text-2); }
.lm-rubric { margin-top: 0.5rem; display: grid; gap: 0.25rem; }
.lm-dim { display: flex; align-items: center; gap: 0.5rem; font-size: 0.72rem; } .lm-dim-n { flex: 0 0 9rem; color: var(--text-3); } .lm-dim-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; } .lm-dim-fill { height: 100%; background: var(--accent); }
.lm-missing { font-size: 0.68rem; color: var(--down); margin-top: 0.2rem; }

.lm-award-terms { font-size: 0.84rem; color: var(--text-2); margin: 0 0 0.5rem; } .lm-pay { font-size: 0.6rem; text-transform: uppercase; color: var(--accent); border: 1px solid var(--accent-soft); border-radius: 4px; padding: 0.05rem 0.3rem; }
.lm-milestones { display: grid; gap: 0.3rem; }
.lm-ms { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; } .lm-ms-dot { width: 8px; height: 8px; border-radius: 50%; background: #8b949e; } .lm-ms.delivered .lm-ms-dot, .lm-ms.approved .lm-ms-dot { background: var(--up); } .lm-ms.in_progress .lm-ms-dot { background: var(--accent); } .lm-ms.disputed .lm-ms-dot { background: var(--down); }
.lm-ms-t { flex: 1; } .lm-ms-s { font-size: 0.62rem; color: var(--text-3); text-transform: uppercase; }
.lm-trust { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; padding: 0.25rem 0; } .lm-trust-k { font-size: 0.56rem; text-transform: uppercase; font-weight: 700; border-radius: 3px; padding: 0.05rem 0.3rem; color: var(--up); background: rgba(75,191,115,0.15); } .lm-trust-k.dispute { color: var(--down); background: rgba(240,101,106,0.16); } .lm-tied { color: var(--text-3); font-size: 0.7rem; } .lm-trust-at { margin-left: auto; font-size: 0.7rem; color: var(--text-3); }
.lm-empty { font-size: 0.8rem; color: var(--text-3); }
.lm-boundary { font-size: 0.72rem; color: var(--text-3); padding-top: 0.9rem; margin-top: 0.9rem; border-top: 1px solid var(--line); line-height: 1.5; }
</style>
