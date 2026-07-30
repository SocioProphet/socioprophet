<script setup lang="ts">
import { ref, computed } from "vue";
import { runQuery, EPISTEMIC_COLORS, type QueryLang, type QueryResult } from "../services/studioApi";

const props = defineProps<{ project: string }>();

const LANGS: QueryLang[] = ["sparql", "cypher", "gremlin"];
const SAMPLES: Record<QueryLang, string> = {
  sparql: "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 25",
  cypher: "MATCH (n)-[r]->(m) RETURN n, type(r), m LIMIT 25",
  gremlin: "g.V().limit(25)",
};

const lang = ref<QueryLang>("sparql");
const text = ref(SAMPLES.sparql);
const result = ref<QueryResult | null>(null);
const loading = ref(false);
const err = ref("");

function setLang(l: QueryLang) {
  lang.value = l;
  if (!text.value.trim() || Object.values(SAMPLES).includes(text.value)) text.value = SAMPLES[l];
}

async function run() {
  if (!text.value.trim()) return;
  loading.value = true; err.value = "";
  try { result.value = await runQuery(props.project, lang.value, text.value); }
  catch (e) { err.value = e instanceof Error ? e.message : "query failed"; result.value = null; }
  finally { loading.value = false; }
}

function epiOf(v: unknown): string | null { return result.value?.epistemic[String(v)] ?? null; }
function color(mode: string): string { return EPISTEMIC_COLORS[mode] || "var(--faint)"; }

// Copilot round-2: computing `JSON.stringify(r).slice(...)` in the template ran on
// every reactivity tick for every row (expensive on large result sets), and using
// the loop index in the key meant DOM was recreated on any row-order change. Move
// key derivation to a computed keyed off `result.value.rows` — recomputed only when
// the result set itself changes, not per render. Keys are content-derived (a cheap
// FNV-1a 32-bit rolling hash over the JSON serialisation, capped so a giant row
// doesn't dominate) and disambiguated only when the same content appears twice, so
// reordering the same rows preserves each row's DOM identity.
function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}
function rowSignature(r: Record<string, unknown>): string {
  // Bounded: an unbounded JSON.stringify would defeat the point of moving off the
  // template. 512 bytes of the canonical form is more than enough to distinguish
  // rows in practice, and duplicate content collapses onto the disambiguator below.
  const s = JSON.stringify(r);
  return fnv1a32(s.length > 512 ? s.slice(0, 512) : s).toString(36);
}
const rowKeys = computed<string[]>(() => {
  const rows = result.value?.rows ?? [];
  const seen = new Map<string, number>();
  return rows.map((r) => {
    const sig = rowSignature(r as Record<string, unknown>);
    const n = seen.get(sig) ?? 0;
    seen.set(sig, n + 1);
    // Same-content rows get a stable dup-index suffix so Vue doesn't collapse them,
    // but a reorder of distinct rows produces identical keys → DOM stays with the row.
    return n === 0 ? sig : `${sig}#${n}`;
  });
});
</script>

<template>
  <div class="qide">
    <div class="qbar">
      <div class="seg">
        <button v-for="l in LANGS" :key="l" :class="{ on: lang === l }" @click="setLang(l)">{{ l }}</button>
      </div>
      <div class="spacer" />
      <button class="run" :disabled="loading" @click="run">{{ loading ? "Running…" : "▷ Run" }}</button>
    </div>

    <textarea v-model="text" class="qed mono" spellcheck="false" rows="5"
      @keydown.ctrl.enter="run" @keydown.meta.enter="run"
      :placeholder="`Write ${lang}…  (⌘/Ctrl+Enter to run)`"></textarea>

    <p v-if="err" class="qerr">{{ err }}</p>

    <div v-else-if="result" class="qres">
      <!-- THE BEAT: every result is replayable + proof-carrying -->
      <div class="qproof">
        <span class="pf" :class="{ ok: result.proof.replayable }" title="replayable, proof-carrying result">
          {{ result.proof.replayable ? "◆ replayable" : "◇ not replayable" }}
        </span>
        <span v-if="result.proof.query_hash" class="pfh mono" title="query hash — this exact result can be replayed">{{ result.proof.query_hash }}</span>
        <span v-if="result.proof.evaluated_at_seq != null" class="pfs">@ seq {{ result.proof.evaluated_at_seq }}</span>
        <span class="spacer" />
        <span class="rc">{{ result.row_count }} rows</span>
      </div>

      <div v-if="result.columns.length" class="qscroll">
        <table class="qgrid">
          <thead><tr><th v-for="(c, colIdx) in result.columns" :key="`${c}:${colIdx}`">{{ c }}</th></tr></thead>
          <tbody>
            <tr v-for="(r, i) in result.rows" :key="rowKeys[i]">
              <td v-for="(c, colIdx) in result.columns" :key="`${c}:${colIdx}`">
                <span class="val">{{ r[c] }}</span>
                <span v-if="epiOf(r[c])" class="epi" :style="{ background: color(epiOf(r[c])!) }" :title="`epistemic: ${epiOf(r[c])}`" />
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!result.rows.length" class="qempty">No rows.</p>
      </div>
      <pre v-else class="qraw mono">{{ JSON.stringify(result.raw, null, 2) }}</pre>

      <p class="qnote">Rows you can <b>replay and prove</b>, and whose facts carry their <b>epistemic status</b> (the coloured dots) — what Stardog / Neo4j Bloom return can't.</p>
    </div>

    <p v-else class="qhint">Run a query against the live kernel. Results are <b>replayable</b> (proof-carrying) and <b>epistemically enriched</b> — the beat over Stardog / Bloom.</p>
  </div>
</template>

<style scoped>
.qide { font: 14px/1.5 var(--ui); color: var(--ink); }
.qide :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: var(--r-1); }
.qbar { display: flex; align-items: center; gap: var(--sp-2); margin-bottom: 8px; }
.qbar .spacer { flex: 1; }
.seg { display: inline-flex; border: 1px solid var(--hairline-strong); border-radius: var(--r-2); overflow: hidden; }
.seg button { border: 0; background: var(--surface); padding: 6px 12px; font-size: 12px; text-transform: capitalize; cursor: pointer; color: var(--muted); }
.seg button.on { background: var(--accent); color: #fff; }
.run { border: 1px solid var(--accent); background: var(--accent); color: #fff; border-radius: var(--r-2); padding: 6px 16px; font-size: 13px; cursor: pointer; }
.run:disabled { opacity: .6; cursor: default; }
.qed { width: 100%; resize: vertical; border: 1px solid var(--hairline-strong); border-radius: var(--r-3); padding: 12px; font-size: 13px; background: var(--surface-2); color: var(--ink); box-sizing: border-box; }
.mono { font-family: var(--mono); }
.qerr { color: var(--fail); font-size: 13px; margin: 10px 0 0; }
.qres { margin-top: 12px; }
.qproof { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: var(--ok-wash); border: 1px solid color-mix(in srgb, var(--ok) 30%, transparent); border-radius: var(--r-3); font-size: 12px; }
.qproof .spacer { flex: 1; }
.pf { font-weight: 700; color: var(--muted); } .pf.ok { color: var(--ok); }
.pfh { color: var(--ok); } .pfs { color: var(--muted); } .rc { color: var(--muted); font-variant-numeric: tabular-nums; }
.qscroll { overflow-x: auto; margin-top: 10px; border: 1px solid var(--hairline); border-radius: var(--r-3); }
.qgrid { border-collapse: collapse; width: 100%; font-size: 13px; }
.qgrid th { text-align: left; padding: 8px 12px; background: var(--sunken); border-bottom: 1px solid var(--hairline); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.qgrid td { padding: 8px 12px; border-bottom: 1px solid var(--sunken); white-space: nowrap; }
.qgrid tr:last-child td { border-bottom: 0; }
.qgrid td .epi { display: inline-block; width: 8px; height: 8px; border-radius: var(--pill); margin-left: 6px; vertical-align: middle; }
.qraw { margin-top: 10px; background: var(--sunken); color: var(--ink-2); padding: 12px; border-radius: var(--r-3); overflow-x: auto; font-size: 12px; max-height: 320px; }
.qempty, .qhint, .qnote { color: var(--muted); font-size: 12.5px; }
.qnote { margin-top: 8px; } .qnote b { color: var(--ink); } .qhint b { color: var(--ink); }
.qhint { margin-top: 12px; }
</style>
