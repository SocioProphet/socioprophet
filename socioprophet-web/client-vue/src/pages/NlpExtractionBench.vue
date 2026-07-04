<template>
  <section class="ie" aria-label="Information extraction">
    <header class="ie-toolbar">
      <div class="ie-title">
        <div>
          <p v-if="scope && !scope.isPrimary" class="ie-eyebrow">{{ scope.domain }}</p>
          <h1>{{ scope && !scope.isPrimary ? scope.label : 'Extraction Bench' }}</h1>
        </div>
        <span class="ie-pill">fixture</span>
      </div>
      <div class="ie-docpick">
        <button v-for="d in docs" :key="d.id" class="ie-doc" :class="{ on: d.id === selectedId }" @click="selectedId = d.id">{{ d.source }}</button>
      </div>
    </header>

    <div class="ie-body" v-if="selected">
      <!-- Document with entity highlights -->
      <article class="ie-text" aria-label="Document">
        <div class="ie-doc-head">
          <h2>{{ selected.title }}</h2>
          <span class="ie-doc-meta">{{ selected.source }} · {{ dateLabel(selected.date) }}</span>
        </div>
        <p class="ie-passage">
          <template v-for="(s, i) in selected.segments" :key="i"><mark v-if="s.ent" class="ie-ent" :class="s.ent" :title="`${s.ent} · ${(s.conf ? s.conf * 100 : 0).toFixed(0)}%`">{{ s.t }}<sup class="ie-ent-t">{{ tag(s.ent) }}</sup></mark><template v-else>{{ s.t }}</template></template>
        </p>
        <div class="ie-legend">
          <span v-for="t in usedTypes" :key="t" class="ie-leg"><i class="ie-ent" :class="t" />{{ t }}</span>
        </div>
        <div class="ie-sent">
          <span class="ie-sent-k">Sentiment</span>
          <span class="ie-sent-pill" :class="selected.sentiment.label">{{ selected.sentiment.label }}</span>
          <span class="ie-sent-score">{{ selected.sentiment.score >= 0 ? '+' : '' }}{{ selected.sentiment.score.toFixed(2) }}</span>
        </div>
      </article>

      <!-- Extractions -->
      <div class="ie-out">
        <section class="ie-panel">
          <div class="ie-panel-h">Entities <span class="ie-c">{{ entities.length }}</span></div>
          <div v-for="(e, i) in entities" :key="i" class="ie-erow">
            <span class="ie-ent-badge" :class="e.ent">{{ tag(e.ent!) }}</span>
            <span class="ie-erow-t">{{ e.t }}</span>
            <span class="ie-conf">{{ ((e.conf ?? 0) * 100).toFixed(0) }}%</span>
          </div>
        </section>

        <section class="ie-panel">
          <div class="ie-panel-h">Relations <span class="ie-c">{{ selected.relations.length }}</span></div>
          <div v-for="(r, i) in selected.relations" :key="i" class="ie-triple">
            <span class="ie-node subj">{{ r.subj }}</span>
            <span class="ie-pred">{{ r.pred }} →</span>
            <span class="ie-node obj">{{ r.obj }}</span>
            <span class="ie-conf">{{ (r.conf * 100).toFixed(0) }}%</span>
          </div>
        </section>

        <section class="ie-panel">
          <div class="ie-panel-h">Claims <span class="ie-c">{{ selected.claims.length }}</span></div>
          <div v-for="(c, i) in selected.claims" :key="i" class="ie-claim">
            <span class="ie-claim-k" :class="c.kind">{{ c.kind }}</span>
            <span class="ie-claim-t">{{ c.text }}</span>
            <span class="ie-verif" :class="c.verifiable ? 'yes' : 'no'">{{ c.verifiable ? 'verifiable' : 'unverifiable' }}</span>
          </div>
        </section>

        <div class="ie-boundary">Read-only extraction · no PII writeback · no live model. A live extractor swaps in behind this shape.</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { docs, type Doc, type NerType } from '../data/nlpFixture';
import { navScopeForPath } from '../config/cockpitNav';

const route = useRoute();
const scope = computed(() => navScopeForPath(route.path));

const selectedId = ref<string>(docs[0]!.id);
const selected = computed<Doc | undefined>(() => docs.find((d) => d.id === selectedId.value));
const entities = computed(() => (selected.value?.segments ?? []).filter((s) => s.ent));
const usedTypes = computed<NerType[]>(() => Array.from(new Set(entities.value.map((e) => e.ent!))));

const TAG: Record<NerType, string> = { person: 'PER', org: 'ORG', place: 'LOC', date: 'DATE', money: 'MONEY', topic: 'TOPIC' };
function tag(t: NerType): string { return TAG[t]; }
function dateLabel(iso: string): string { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
</script>

<style scoped>
.ie { height: 100%; min-height: 0; display: grid; grid-template-rows: auto 1fr; gap: 0.75rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: var(--text); }
.ie-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.ie-title { display: flex; align-items: baseline; gap: 0.6rem; } .ie-title h1 { margin: 0; font-size: 1.2rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.ie-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.ie-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); background: var(--accent-soft); border-radius: 5px; padding: 0.1rem 0.35rem; }
.ie-docpick { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.ie-doc { border: 1px solid var(--line-2); background: transparent; color: var(--text-2); border-radius: 8px; padding: 0.3rem 0.6rem; font-size: 0.74rem; cursor: pointer; } .ie-doc.on { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

.ie-body { min-height: 0; display: grid; grid-template-columns: minmax(360px, 1.1fr) minmax(340px, 1fr); gap: 0.75rem; }
@media (max-width: 1080px) { .ie-body { grid-template-columns: 1fr; } }

.ie-text { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1rem 1.1rem; }
.ie-doc-head h2 { margin: 0; font-size: 1.15rem; line-height: 1.3; } .ie-doc-meta { font-size: 0.72rem; color: var(--text-3); }
.ie-passage { margin: 1rem 0; font-size: 1rem; line-height: 2.1; color: var(--text); }
.ie-ent { border-radius: 4px; padding: 0.05rem 0.15rem; color: inherit; }
mark.ie-ent { background: rgba(255,255,255,0.06); box-shadow: inset 0 -2px 0 var(--et, #8b949e); color: var(--text); }
.ie-ent.person { --et: #58a6ff; } .ie-ent.org { --et: #c58af9; } .ie-ent.place { --et: var(--up); } .ie-ent.date { --et: var(--accent); } .ie-ent.money { --et: #4bbf73; } .ie-ent.topic { --et: #f0883e; }
i.ie-ent { display: inline-block; width: 10px; height: 10px; border-radius: 3px; box-shadow: none; background: var(--et); margin-right: 0.3rem; }
.ie-ent-t { font-size: 0.5rem; font-weight: 800; letter-spacing: 0.03em; color: var(--et); vertical-align: super; margin-left: 0.1rem; }
.ie-legend { display: flex; flex-wrap: wrap; gap: 0.6rem; padding-top: 0.6rem; border-top: 1px solid var(--line); font-size: 0.7rem; color: var(--text-3); text-transform: capitalize; } .ie-leg { display: flex; align-items: center; }
.ie-sent { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.8rem; font-size: 0.78rem; } .ie-sent-k { color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.64rem; }
.ie-sent-pill { font-size: 0.62rem; text-transform: uppercase; font-weight: 700; border-radius: 4px; padding: 0.05rem 0.4rem; } .ie-sent-pill.positive { color: var(--up); background: rgba(75,191,115,0.16); } .ie-sent-pill.neutral { color: #8b949e; background: rgba(139,148,158,0.16); } .ie-sent-pill.negative { color: var(--down); background: rgba(240,101,106,0.16); }
.ie-sent-score { font-variant-numeric: tabular-nums; color: var(--text-2); }

.ie-out { min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; }
.ie-panel { border: 1px solid var(--line-2); border-radius: 12px; overflow: hidden; }
.ie-panel-h { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.85rem; border-bottom: 1px solid var(--line); font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); } .ie-c { color: var(--text-2); }
.ie-erow { display: flex; align-items: center; gap: 0.55rem; padding: 0.4rem 0.85rem; border-bottom: 1px solid var(--line); font-size: 0.84rem; } .ie-erow:last-child { border-bottom: none; }
.ie-ent-badge { font-size: 0.52rem; font-weight: 800; letter-spacing: 0.03em; border-radius: 3px; padding: 0.05rem 0.3rem; color: #04121f; background: var(--et, #8b949e); } .ie-ent-badge.person { --et: #58a6ff; } .ie-ent-badge.org { --et: #c58af9; } .ie-ent-badge.place { --et: var(--up); } .ie-ent-badge.date { --et: var(--accent); } .ie-ent-badge.money { --et: #4bbf73; } .ie-ent-badge.topic { --et: #f0883e; }
.ie-erow-t { flex: 1; } .ie-conf { font-size: 0.72rem; color: var(--text-3); font-variant-numeric: tabular-nums; }
.ie-triple { display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem; padding: 0.45rem 0.85rem; border-bottom: 1px solid var(--line); font-size: 0.8rem; } .ie-triple:last-child { border-bottom: none; }
.ie-node { border-radius: 5px; padding: 0.1rem 0.4rem; background: var(--surface-2); } .ie-node.subj { color: #93c5fd; } .ie-node.obj { color: #e3b341; }
.ie-pred { color: var(--text-3); font-family: ui-monospace, monospace; font-size: 0.72rem; } .ie-triple .ie-conf { margin-left: auto; }
.ie-claim { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.5rem 0.85rem; border-bottom: 1px solid var(--line); font-size: 0.82rem; } .ie-claim:last-child { border-bottom: none; }
.ie-claim-k { flex: 0 0 auto; font-size: 0.54rem; font-weight: 800; text-transform: uppercase; border-radius: 3px; padding: 0.1rem 0.3rem; margin-top: 0.1rem; } .ie-claim-k.assert { color: var(--up); background: rgba(75,191,115,0.15); } .ie-claim-k.hedge { color: var(--accent); background: rgba(216,162,80,0.16); } .ie-claim-k.deny { color: var(--down); background: rgba(240,101,106,0.16); }
.ie-claim-t { flex: 1; line-height: 1.45; } .ie-verif { flex: 0 0 auto; font-size: 0.62rem; color: var(--text-3); } .ie-verif.yes { color: var(--up); } .ie-verif.no { color: var(--text-3); }
.ie-boundary { font-size: 0.72rem; color: var(--text-3); padding: 0.6rem 0.2rem; line-height: 1.5; }
</style>
