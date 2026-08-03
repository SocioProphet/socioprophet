<!-- BOARD TABLE — one category comparison board.
     Rows = litmus features (definition on hover + expand), columns = estate + each
     competitor, cells = BEAT/MEET/PARTIAL/GAP rank. Estate cells carry an evidence
     link, a maturity badge (live/spec) and an assessment-basis badge (self/certified).
     Ranks are text-labelled + glyph-prefixed so they are never color-only (a11y). -->
<template>
  <PCard :title="board.name">
    <template #right>
      <span class="bt-tally" :aria-label="`Category tally: ${tally.BEAT} beat, ${tally.MEET} meet, ${tally.PARTIAL} partial, ${tally.GAP} gap`">
        <span v-for="r in RANK_ORDER" :key="r" class="bt-tally-item" :class="`rank-${r.toLowerCase()}`">
          <b>{{ tally[r] }}</b> {{ r }}
        </span>
      </span>
    </template>

    <p class="bt-desc">{{ board.description }}</p>

    <div class="bt-scroll" role="region" :aria-label="`${board.name} comparison board`" tabindex="0">
      <table class="bt-table">
        <caption class="sr-only">{{ board.name }}: litmus features (rows) by estate and competitors (columns)</caption>
        <thead>
          <tr>
            <th scope="col" class="bt-featcol">Litmus feature</th>
            <th
              v-for="col in board.columns"
              :key="col.id"
              scope="col"
              class="bt-colhead"
              :class="{ 'bt-colhead--estate': col.is_estate }"
            >
              <span class="bt-colname">{{ col.name }}</span>
              <span v-if="col.is_estate" class="bt-estate-flag">estate</span>
              <span v-if="col.note" class="bt-colnote">{{ col.note }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="feat in board.features" :key="feat.id">
            <th scope="row" class="bt-featcell">
              <button
                type="button"
                class="bt-feat-toggle"
                :aria-expanded="expanded.has(feat.id)"
                :title="feat.definition"
                @click="toggle(feat.id)"
              >
                <span class="bt-feat-name">{{ feat.name }}</span>
                <span class="bt-feat-i" aria-hidden="true">{{ expanded.has(feat.id) ? '−' : 'i' }}</span>
              </button>
              <p v-if="expanded.has(feat.id)" class="bt-feat-def">{{ feat.definition }}</p>
            </th>
            <td
              v-for="col in board.columns"
              :key="col.id"
              class="bt-cell"
              :class="{ 'bt-cell--estate': col.is_estate }"
            >
              <template v-if="cell(feat.id, col.id)">
                <span
                  class="rank-chip"
                  :class="`rank-${cell(feat.id, col.id)!.rank.toLowerCase()}`"
                  :aria-label="`${feat.name} · ${col.name}: ${cell(feat.id, col.id)!.rank}`"
                >
                  <span class="rank-glyph" aria-hidden="true">{{ glyph(cell(feat.id, col.id)!.rank) }}</span>
                  {{ cell(feat.id, col.id)!.rank }}
                </span>
                <template v-if="col.is_estate">
                  <span class="bt-badges">
                    <span
                      v-if="cell(feat.id, col.id)!.maturity"
                      class="bt-badge"
                      :class="`bt-badge--${cell(feat.id, col.id)!.maturity}`"
                      :title="cell(feat.id, col.id)!.maturity === 'live' ? 'Live — shipped capability' : 'Spec — declared / planned'"
                    >{{ cell(feat.id, col.id)!.maturity }}</span>
                    <span
                      v-if="cell(feat.id, col.id)!.basis"
                      class="bt-badge bt-badge--basis"
                      :title="cell(feat.id, col.id)!.basis === 'externally-certified' ? 'Rank verified by an external party' : 'Rank asserted by the estate'"
                    >{{ cell(feat.id, col.id)!.basis === 'externally-certified' ? 'certified' : 'self' }}</span>
                  </span>
                  <a
                    v-if="cell(feat.id, col.id)!.evidence"
                    class="bt-evidence"
                    :href="cell(feat.id, col.id)!.evidence!.href"
                    target="_blank"
                    rel="noopener noreferrer"
                  >{{ cell(feat.id, col.id)!.evidence!.label }} ↗</a>
                </template>
                <span
                  v-if="cell(feat.id, col.id)!.note && expanded.has(feat.id)"
                  class="bt-cellnote"
                >{{ cell(feat.id, col.id)!.note }}</span>
              </template>
              <span v-else class="bt-cell-empty" aria-label="no data">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <details class="bt-defs">
      <summary>Litmus definitions ({{ board.features.length }})</summary>
      <dl>
        <template v-for="feat in board.features" :key="`def-${feat.id}`">
          <dt>{{ feat.name }}</dt>
          <dd>{{ feat.definition }}</dd>
        </template>
      </dl>
    </details>
  </PCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import PCard from '../../../components/workbench/PCard.vue';
import type { BoardRank, CategoryBoard } from '../../../api/competitiveBoardsApi';
import { RANK_ORDER, cellFor, tallyBoard } from './tally';

const props = defineProps<{ board: CategoryBoard }>();

const tally = computed(() => tallyBoard(props.board));

const expanded = ref<Set<string>>(new Set());
function toggle(id: string) {
  const next = new Set(expanded.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expanded.value = next;
}

function cell(featureId: string, columnId: string) {
  return cellFor(props.board, featureId, columnId);
}

function glyph(rank: BoardRank): string {
  return { BEAT: '▲', MEET: '●', PARTIAL: '◐', GAP: '▽' }[rank];
}
</script>

<style scoped>
.bt-desc { margin: 0 0 0.75rem; color: var(--text-2); font-size: var(--fs-sm); }
.bt-tally { display: inline-flex; gap: 0.5rem; flex-wrap: wrap; font-size: var(--fs-xs); }
.bt-tally-item { display: inline-flex; gap: 0.25rem; align-items: baseline; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-3); }
.bt-tally-item b { font-family: var(--mono, 'Roboto Mono', monospace); }

.bt-scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius-sm); }
.bt-table { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); }
.bt-table th, .bt-table td { border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; padding: 0.5rem 0.6rem; }
.bt-table tbody tr:last-child th, .bt-table tbody tr:last-child td { border-bottom: none; }

.bt-featcol { width: 15rem; font-size: var(--fs-eyebrow); text-transform: uppercase; letter-spacing: var(--ls-eyebrow); color: var(--text-3); font-weight: 600; }
.bt-colhead { min-width: 8rem; }
.bt-colhead--estate { background: var(--accent-soft); }
.bt-colname { display: block; font-weight: 700; color: var(--text); }
.bt-estate-flag { display: inline-block; margin-top: 0.15rem; font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); font-weight: 800; }
.bt-colnote { display: block; margin-top: 0.15rem; font-size: var(--fs-xs); color: var(--text-3); }

.bt-featcell { width: 15rem; }
.bt-feat-toggle { display: inline-flex; align-items: center; gap: 0.4rem; background: none; border: none; padding: 0; cursor: pointer; color: var(--text); text-align: left; }
.bt-feat-name { font-weight: 600; }
.bt-feat-i { display: inline-grid; place-items: center; width: 1.05rem; height: 1.05rem; border: 1px solid var(--line-2); border-radius: 999px; font-size: 0.62rem; font-style: italic; color: var(--text-2); }
.bt-feat-def { margin: 0.35rem 0 0; font-size: var(--fs-xs); color: var(--text-2); line-height: 1.5; font-style: normal; }

.bt-cell--estate { background: color-mix(in srgb, var(--accent-soft) 60%, transparent); }
.bt-cell-empty { color: var(--text-3); }

.rank-chip { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.14rem 0.45rem; border-radius: 6px; font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.05em; border: 1px solid transparent; }
.rank-glyph { font-size: 0.72em; }
/* Rank colors — carry a text label + glyph so they never rely on color alone. */
.rank-beat { background: rgba(75, 191, 115, 0.18); color: #6ee7a0; border-color: rgba(75, 191, 115, 0.4); }
.rank-meet { background: rgba(88, 166, 255, 0.16); color: #8cc0ff; border-color: rgba(88, 166, 255, 0.38); }
.rank-partial { background: rgba(227, 179, 65, 0.16); color: #f0cf6e; border-color: rgba(227, 179, 65, 0.4); }
.rank-gap { background: rgba(240, 101, 106, 0.16); color: #ff9ba0; border-color: rgba(240, 101, 106, 0.42); }

.bt-badges { display: flex; gap: 0.3rem; margin-top: 0.3rem; flex-wrap: wrap; }
.bt-badge { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; padding: 0.08rem 0.32rem; border-radius: 4px; border: 1px solid var(--line-2); color: var(--text-2); }
.bt-badge--live { color: var(--live); border-color: rgba(75, 191, 115, 0.4); }
.bt-badge--spec { color: var(--amber); border-color: rgba(227, 179, 65, 0.4); }
.bt-badge--basis { color: var(--teal); border-color: rgba(45, 212, 191, 0.4); }
.bt-evidence { display: inline-block; margin-top: 0.3rem; font-size: var(--fs-xs); color: var(--info); text-decoration: none; }
.bt-evidence:hover { text-decoration: underline; }
.bt-cellnote { display: block; margin-top: 0.3rem; font-size: var(--fs-xs); color: var(--text-3); line-height: 1.45; }

.bt-defs { margin-top: 0.75rem; font-size: var(--fs-sm); }
.bt-defs summary { cursor: pointer; color: var(--text-2); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.06em; }
.bt-defs dl { margin: 0.5rem 0 0; display: grid; grid-template-columns: minmax(10rem, 16rem) 1fr; gap: 0.3rem 1rem; }
.bt-defs dt { font-weight: 600; color: var(--text); }
.bt-defs dd { margin: 0; color: var(--text-2); }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

/* If the surface is ever rendered on a light background, keep rank contrast. */
@media (prefers-color-scheme: light) {
  .rank-beat { color: #1a7f43; }
  .rank-meet { color: #1a5fb4; }
  .rank-partial { color: #9a6b00; }
  .rank-gap { color: #b3261e; }
}
</style>
