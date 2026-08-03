<!-- BOARD TABLE — one category comparison board.
     Rows = litmus features (definition on hover + expand), columns = named competitors.
     RELATIVE-ONLY: each cell is the estate's own claim about its standing against THAT
     competitor on THAT feature (BEAT/MEET/PARTIAL/GAP) — there is no separate "estate
     column", so every cell carries an evidence link, a maturity badge (live/spec) and
     an assessment-basis badge (self/certified), not just a subset of them.
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
        <caption class="sr-only">{{ board.name }}: litmus features (rows) vs competitors (columns), each cell the estate's own verdict against that competitor</caption>
        <thead>
          <tr>
            <th scope="col" class="bt-featcol">Litmus feature</th>
            <th
              v-for="comp in board.competitors"
              :key="comp.id"
              scope="col"
              class="bt-colhead"
            >
              <span class="bt-colname">{{ comp.name }}</span>
              <span v-if="comp.note" class="bt-colnote">{{ comp.note }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.feat.id">
            <th scope="row" class="bt-featcell">
              <button
                type="button"
                class="bt-feat-toggle"
                :aria-expanded="expanded.has(row.feat.id)"
                :title="row.feat.definition"
                @click="toggle(row.feat.id)"
              >
                <span class="bt-feat-name">{{ row.feat.name }}</span>
                <span class="bt-feat-i" aria-hidden="true">{{ expanded.has(row.feat.id) ? '−' : 'i' }}</span>
              </button>
              <p v-if="expanded.has(row.feat.id)" class="bt-feat-def">{{ row.feat.definition }}</p>
            </th>
            <td
              v-for="rc in row.cells"
              :key="rc.competitor.id"
              class="bt-cell"
            >
              <template v-if="rc.cell">
                <span
                  class="rank-chip"
                  :class="`rank-${rc.cell.rank.toLowerCase()}`"
                  :aria-label="`${row.feat.name} vs ${rc.competitor.name}: ${rc.cell.rank}`"
                >
                  <span class="rank-glyph" aria-hidden="true">{{ glyph(rc.cell.rank) }}</span>
                  {{ rc.cell.rank }}
                </span>
                <span class="bt-badges">
                  <span
                    v-if="rc.cell.maturity"
                    class="bt-badge"
                    :class="`bt-badge--${rc.cell.maturity}`"
                    :title="rc.cell.maturity === 'live' ? 'Live — shipped capability' : 'Spec — declared / planned'"
                  >{{ rc.cell.maturity }}</span>
                  <span
                    v-if="rc.cell.basis"
                    class="bt-badge bt-badge--basis"
                    :title="rc.cell.basis === 'externally-certified' ? 'Rank verified by an external party' : 'Rank asserted by the estate'"
                  >{{ rc.cell.basis === 'externally-certified' ? 'certified' : 'self' }}</span>
                </span>
                <a
                  v-if="rc.cell.evidence && isSafeHttp(rc.cell.evidence.href)"
                  class="bt-evidence"
                  :href="rc.cell.evidence.href"
                  target="_blank"
                  rel="noopener noreferrer"
                >{{ rc.cell.evidence.label }} ↗</a>
                <span
                  v-else-if="rc.cell.evidence"
                  class="bt-evidence bt-evidence--unsafe"
                >{{ rc.cell.evidence.label }}</span>
                <span
                  v-if="rc.cell.note && expanded.has(row.feat.id)"
                  class="bt-cellnote"
                >{{ rc.cell.note }}</span>
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
import type { BoardCell, BoardCompetitor, BoardRank, CategoryBoard, LitmusFeature } from '../../../api/competitiveBoardsApi';
import { RANK_ORDER, cellFor, tallyBoard } from './tally';
import { isSafeHttp } from '../../../utils/urlSafe';

const props = defineProps<{ board: CategoryBoard }>();

const tally = computed(() => tallyBoard(props.board));

const expanded = ref<Set<string>>(new Set());
function toggle(id: string) {
  const next = new Set(expanded.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expanded.value = next;
}

interface ResolvedCell {
  competitor: BoardCompetitor;
  cell: BoardCell | undefined;
}
interface FeatureRow {
  feat: LitmusFeature;
  cells: ResolvedCell[];
}

// Resolve every (feature × competitor) cell once per render instead of re-scanning
// board.cells for the same lookup at every template usage site.
const rows = computed<FeatureRow[]>(() =>
  props.board.features.map((feat) => ({
    feat,
    cells: props.board.competitors.map((competitor) => ({
      competitor,
      cell: cellFor(props.board, feat.id, competitor.id),
    })),
  })),
);

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
.bt-colname { display: block; font-weight: 700; color: var(--text); }
.bt-colnote { display: block; margin-top: 0.15rem; font-size: var(--fs-xs); color: var(--text-3); }

.bt-featcell { width: 15rem; }
.bt-feat-toggle { display: inline-flex; align-items: center; gap: 0.4rem; background: none; border: none; padding: 0; cursor: pointer; color: var(--text); text-align: left; }
.bt-feat-name { font-weight: 600; }
.bt-feat-i { display: inline-grid; place-items: center; width: 1.05rem; height: 1.05rem; border: 1px solid var(--line-2); border-radius: 999px; font-size: 0.62rem; font-style: italic; color: var(--text-2); }
.bt-feat-def { margin: 0.35rem 0 0; font-size: var(--fs-xs); color: var(--text-2); line-height: 1.5; font-style: normal; }

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
.bt-evidence--unsafe { color: var(--text-3); cursor: default; }
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
