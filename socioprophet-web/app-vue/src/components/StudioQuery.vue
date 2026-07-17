<script setup lang="ts">
import { ref } from "vue";
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
function color(mode: string): string { return EPISTEMIC_COLORS[mode] || "#c0c4c9"; }
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
          <thead><tr><th v-for="c in result.columns" :key="c">{{ c }}</th></tr></thead>
          <tbody>
            <tr v-for="(r, i) in result.rows" :key="i">
              <td v-for="c in result.columns" :key="c">
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
.qide { font: 14px/1.5 system-ui, sans-serif; color: #202124; }
.qbar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.qbar .spacer { flex: 1; }
.seg { display: inline-flex; border: 1px solid #dadce0; border-radius: 8px; overflow: hidden; }
.seg button { border: 0; background: #fff; padding: 6px 12px; font-size: 12px; text-transform: capitalize; cursor: pointer; color: #5f6368; }
.seg button.on { background: #1a73e8; color: #fff; }
.run { border: 1px solid #1a73e8; background: #1a73e8; color: #fff; border-radius: 8px; padding: 6px 16px; font-size: 13px; cursor: pointer; }
.run:disabled { opacity: .6; cursor: default; }
.qed { width: 100%; resize: vertical; border: 1px solid #dadce0; border-radius: 10px; padding: 12px; font-size: 13px; background: #fbfcfe; box-sizing: border-box; }
.mono { font-family: "SF Mono", ui-monospace, Menlo, monospace; }
.qerr { color: #c5221f; font-size: 13px; margin: 10px 0 0; }
.qres { margin-top: 12px; }
.qproof { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #f1f6ee; border: 1px solid #d7e8cf; border-radius: 9px; font-size: 12px; }
.qproof .spacer { flex: 1; }
.pf { font-weight: 700; color: #5f6368; } .pf.ok { color: #137333; }
.pfh { color: #137333; } .pfs { color: #5f6368; } .rc { color: #5f6368; }
.qscroll { overflow-x: auto; margin-top: 10px; border: 1px solid #e8eaed; border-radius: 10px; }
.qgrid { border-collapse: collapse; width: 100%; font-size: 13px; }
.qgrid th { text-align: left; padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #e8eaed; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #5f6368; }
.qgrid td { padding: 8px 12px; border-bottom: 1px solid #f1f3f4; white-space: nowrap; }
.qgrid tr:last-child td { border-bottom: 0; }
.qgrid td .epi { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-left: 6px; vertical-align: middle; }
.qraw { margin-top: 10px; background: #0e1116; color: #d7e0ea; padding: 12px; border-radius: 10px; overflow-x: auto; font-size: 12px; max-height: 320px; }
.qempty, .qhint, .qnote { color: #5f6368; font-size: 12.5px; }
.qnote { margin-top: 8px; } .qnote b { color: #202124; } .qhint b { color: #202124; }
.qhint { margin-top: 12px; }
</style>
