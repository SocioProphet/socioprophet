<script setup lang="ts">
// The proof-carrying knowledge COMMONS panel (WS#36–39): surfaces preservation/versioning, FAIR+ metadata,
// scholarly + agent ecosystem hooks, commons-at-scale stats, and epistemic-weighted community curation —
// the repository fundamentals (Zenodo/OSF/Wikidata) MET, then BEATEN with our epistemic + provenance layer.
import { ref, onMounted, watch } from "vue";
import {
  loadCommons, loadFair, loadEcosystem, loadVersions, loadCuration, endorse, EPISTEMIC_COLORS,
  type Commons, type Fair, type Ecosystem, type Versions, type Curation,
} from "../../services/studioApi";

const props = defineProps<{ project: string }>();

const commons = ref<Commons | null>(null);
const fair = ref<Fair | null>(null);
const eco = ref<Ecosystem | null>(null);
const versions = ref<Versions | null>(null);
const curation = ref<Curation | null>(null);
const loading = ref(true);
const err = ref("");

async function load() {
  loading.value = true; err.value = "";
  try {
    [commons.value, fair.value, eco.value, versions.value, curation.value] = await Promise.all([
      loadCommons(props.project), loadFair(props.project), loadEcosystem(props.project),
      loadVersions(props.project), loadCuration(props.project),
    ]);
  } catch (e) { err.value = e instanceof Error ? e.message : "failed to load commons"; }
  finally { loading.value = false; }
}
onMounted(load);
watch(() => props.project, load);

// endorse form
const showEndorse = ref(false);
const eTarget = ref("");
const eEndorser = ref("");
const eNote = ref("");
const eToken = ref("");
const posting = ref(false);
const eMsg = ref(""); const eErr = ref("");
async function submitEndorse() {
  posting.value = true; eMsg.value = ""; eErr.value = "";
  try {
    if (!eTarget.value.trim() || !eEndorser.value.trim()) throw new Error("target and endorser required");
    const r = await endorse({ project: props.project, target: eTarget.value.trim(), endorser: eEndorser.value.trim(), note: eNote.value.trim() || undefined }, eToken.value);
    eMsg.value = `Endorsed ${r.target}`; eTarget.value = ""; eNote.value = "";
    await load();
  } catch (e) { eErr.value = e instanceof Error ? e.message : "endorse failed"; }
  finally { posting.value = false; }
}

function color(mode?: string): string { return EPISTEMIC_COLORS[mode || "observed"] || "var(--faint)"; }
function fairFlag(v: boolean): string { return v ? "✓" : "—"; }
</script>

<template>
  <div class="cm">
    <div class="cbar">
      <span class="cnt" v-if="commons">{{ commons.scale.facts }} facts · {{ commons.scale.preserved_versions }} versions · {{ commons.scale.endorsements }} endorsements</span>
      <div class="spacer" />
      <button class="run" @click="showEndorse = !showEndorse">＋ Endorse a fact</button>
      <button class="ghost" @click="load" :disabled="loading" title="reload" aria-label="Reload commons">↻</button>
    </div>

    <div v-if="showEndorse" class="logbox">
      <div class="lrow">
        <input v-model="eTarget" class="j mono" placeholder="target node id (e.g. proj-x:ent:hellgraph)" />
        <input v-model="eEndorser" class="j" placeholder="endorser (ORCID / sovereign id)" />
        <input v-model="eNote" class="j" placeholder="note (optional)" />
        <input v-model="eToken" type="password" class="tok" placeholder="write token" />
        <button class="primary" @click="submitEndorse" :disabled="posting">{{ posting ? "…" : "Endorse" }}</button>
      </div>
      <p v-if="eErr" class="lfeedback err">{{ eErr }}</p>
      <p v-else-if="eMsg" class="lfeedback ok">✓ {{ eMsg }} — a governed, revocable, proof-carrying endorsement</p>
    </div>

    <p v-if="err" class="msg err">{{ err }}</p>
    <p v-else-if="loading" class="msg">Loading the commons…</p>

    <div v-else class="grid">
      <!-- FAIR+ scorecard -->
      <section class="card" v-if="fair">
        <header class="ch"><span class="ci">◈</span> FAIR<span class="plus">+</span> metadata<span class="score" :class="{ hi: fair.fair.score >= 0.75 }">{{ Math.round(fair.fair.score * 100) }}%</span></header>
        <div class="fair">
          <span class="fq" :class="{ on: fair.fair.findable }">{{ fairFlag(fair.fair.findable) }} Findable</span>
          <span class="fq" :class="{ on: fair.fair.accessible }">{{ fairFlag(fair.fair.accessible) }} Accessible</span>
          <span class="fq" :class="{ on: fair.fair.interoperable }">{{ fairFlag(fair.fair.interoperable) }} Interoperable</span>
          <span class="fq" :class="{ on: fair.fair.reusable }">{{ fairFlag(fair.fair.reusable) }} Reusable</span>
        </div>
        <div class="plusrow">
          <span class="ptag" v-if="fair.fair_plus.epistemic">epistemic status</span>
          <span class="ptag" v-if="fair.fair_plus.provenance_chain">provenance chain</span>
          <span class="ptag" v-if="fair.fair_plus.hash_sealed">hash-sealed</span>
        </div>
        <p v-if="fair.hint" class="hint">→ {{ fair.hint }}</p>
        <div class="ids" v-if="fair.doi || fair.pid">
          <code v-if="fair.doi" class="mono" :title="'DataCite DOI'">DOI {{ fair.doi }}</code>
          <code v-if="fair.pid" class="mono" :title="'sovereign persistent id'">{{ fair.pid }}</code>
        </div>
        <p class="sub">schema.org/Dataset · DataCite · PROV-O Turtle — beats a bare metadata record: the record carries epistemic status + a verifiable provenance chain.</p>
      </section>

      <!-- commons at scale + epistemic quality -->
      <section class="card" v-if="commons">
        <header class="ch"><span class="ci">◎</span> Commons at scale<span v-if="commons.epistemic_quality_index != null" class="score hi" :title="'epistemic quality index (0–1)'">Q {{ commons.epistemic_quality_index }}</span></header>
        <div class="scale">
          <div class="st"><b>{{ commons.scale.facts }}</b><span>facts</span></div>
          <div class="st"><b>{{ commons.scale.citations }}</b><span>citations</span></div>
          <div class="st"><b>{{ commons.scale.preserved_versions }}</b><span>versions</span></div>
          <div class="st"><b>{{ commons.scale.endorsements }}</b><span>endorsements</span></div>
          <div class="st"><b>{{ commons.scale.contributors }}</b><span>contributors</span></div>
        </div>
        <span class="mb-bar" v-if="commons.scale.facts" title="epistemic distribution of the commons">
          <i v-for="(n, mode) in commons.epistemic_distribution" :key="mode"
             :style="{ width: (n / commons.scale.facts * 100) + '%', background: color(mode) }" :title="mode + ': ' + n" />
        </span>
        <p class="sub">The <b>quality index</b> weights facts by epistemic status — a signal a volume-only repository can't show.</p>
      </section>

      <!-- preservation chain -->
      <section class="card" v-if="versions">
        <header class="ch"><span class="ci">⛭</span> Preservation<span class="score">{{ versions.count }} sealed</span></header>
        <ul class="vlist" v-if="versions.versions.length">
          <li v-for="v in versions.versions" :key="v.snapshot_id">
            <span class="vv">v{{ v.version }}</span>
            <code class="mono hash" :title="'content hash — re-hash to verify'">{{ (v.content_hash || '').slice(0, 12) }}</code>
            <span class="when">{{ v.sealed_at }}</span>
            <span v-if="v.note" class="vnote">{{ v.note }}</span>
          </li>
        </ul>
        <p v-else class="msg">No snapshots yet — Preserve seals a tamper-evident, versioned copy.</p>
        <p class="sub">Content-addressed &amp; chained (each links its predecessor). An archived fact stays proof-carrying.</p>
      </section>

      <!-- scholarly + agent ecosystem -->
      <section class="card" v-if="eco">
        <header class="ch"><span class="ci">⌘</span> Ecosystem hooks</header>
        <div class="row2">
          <a v-if="eco.scholarly.doi_url" class="link mono" :href="eco.scholarly.doi_url" target="_blank" rel="noopener">DOI ↗</a>
          <span v-if="eco.scholarly.openaire.harvestable" class="ptag">OpenAIRE-harvestable</span>
        </div>
        <div class="orcids" v-if="eco.scholarly.orcid_contributors.length">
          <a v-for="c in eco.scholarly.orcid_contributors" :key="c.orcid" class="orcid" :href="c.orcid_url" target="_blank" rel="noopener" :title="c.orcid">
            <span class="oic">iD</span> {{ c.name }}
          </a>
        </div>
        <div class="manifest">
          <span class="mtitle">agent manifest <span v-if="eco.agent_manifest.proof_carrying" class="ptag sm">proof-carrying</span></span>
          <div class="verbs">
            <span v-for="vb in eco.agent_manifest.access" :key="vb.name" class="verb" :class="{ off: !vb.endpoint }" :title="vb.endpoint || 'not available'">
              {{ vb.name }}<i v-if="vb.verifiable && vb.endpoint" class="vok">✓</i>
            </span>
          </div>
        </div>
        <p class="sub">Discovery repos expose to <i>humans</i>, we also expose to <i>agents</i>: a machine-readable card of verifiable access verbs.</p>
      </section>

      <!-- community curation -->
      <section class="card wide" v-if="curation">
        <header class="ch"><span class="ci">✶</span> Community curation<span class="score" :title="'epistemic-weighted curation score'">score {{ curation.curation_score }}</span></header>
        <div v-if="curation.endorsements.length" class="cscroll">
          <table class="cgrid">
            <thead><tr><th>Endorsed fact</th><th>Endorser</th><th>Note</th><th>When</th></tr></thead>
            <tbody>
              <tr v-for="(e, i) in curation.endorsements" :key="i">
                <td class="mono">{{ e.target }}</td>
                <td class="mono nm">{{ e.endorser }}</td>
                <td>{{ e.note || "—" }}</td>
                <td class="when">{{ e.at }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="msg">No endorsements yet — endorse a fact above; it lands as a governed, revocable graph fact.</p>
        <p class="sub">The score is <b>epistemic-weighted</b>: endorsing an <i>attested</i> fact counts more than a <i>hypothesis</i> — curation follows grounding, not popularity. Revoked endorsements never count.</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.cm { font: 14px/1.5 var(--ui); color: var(--ink); }
.cm :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: var(--r-1); }
.cbar { display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-3); }
.cbar .cnt { color: var(--muted); font-size: 12px; } .cbar .spacer { flex: 1; }
.run { border: 1px solid var(--accent); background: var(--accent); color: #fff; border-radius: var(--r-2); padding: 6px 14px; font-size: 13px; cursor: pointer; }
.ghost { border: 1px solid var(--hairline-strong); background: var(--surface); color: var(--ink-2); border-radius: var(--r-2); width: 30px; height: 30px; cursor: pointer; }
.logbox { border: 1px solid var(--hairline-strong); border-radius: var(--r-3); background: var(--sunken); padding: 10px 12px; margin-bottom: 14px; }
.lrow { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.lrow input { border: 1px solid var(--hairline-strong); border-radius: var(--r-2); padding: 6px 8px; font-size: 13px; background: var(--surface); color: var(--ink); }
.lrow input.j { flex: 1; min-width: 150px; } .lrow input.tok { width: 120px; }
.lrow button.primary { border: 1px solid var(--accent); background: var(--accent); color: #fff; border-radius: var(--r-2); padding: 6px 14px; font-size: 13px; cursor: pointer; }
.lrow button.primary:disabled { opacity: .6; cursor: default; }
.lfeedback { margin: 8px 0 0; font-size: 12.5px; } .lfeedback.ok { color: var(--ok); } .lfeedback.err { color: var(--fail); }
.msg { color: var(--muted); } .msg.err { color: var(--fail); }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--sp-3); }
.card { border: 1px solid var(--hairline); border-radius: var(--r-3); padding: var(--sp-3) var(--sp-4); background: var(--surface); }
.card.wide { grid-column: 1 / -1; }
.ch { display: flex; align-items: center; gap: var(--sp-2); font-weight: 600; font-size: 14px; margin-bottom: 10px; }
.ch .ci { color: var(--accent); } .ch .plus { color: var(--accent); font-weight: 700; }
.score { margin-left: auto; font-size: 11px; color: var(--muted); background: var(--sunken); border-radius: var(--pill); padding: 2px 9px; font-variant-numeric: tabular-nums; }
.score.hi { color: var(--ok); background: var(--ok-wash); }
.mono { font-family: var(--mono); font-size: 12px; }
.sub { color: var(--muted); font-size: 12px; margin: 10px 0 0; } .sub b { color: var(--ink); }

.fair { display: flex; flex-wrap: wrap; gap: 6px; }
.fq { font-size: 12px; border: 1px solid var(--hairline); color: var(--faint); border-radius: var(--r-2); padding: 3px 9px; }
.fq.on { color: var(--ok); border-color: color-mix(in srgb, var(--ok) 40%, transparent); background: var(--ok-wash); }
.plusrow { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.ptag { font-size: 10.5px; color: var(--accent); background: var(--accent-wash); border-radius: var(--r-2); padding: 2px 8px; }
.ptag.sm { font-size: 9.5px; padding: 1px 6px; }
.hint { color: var(--warn); font-size: 12px; margin: 8px 0 0; }
.ids { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.ids code { background: var(--sunken); border: 1px solid var(--hairline); border-radius: var(--r-2); padding: 2px 7px; }

.scale { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 10px; }
.st { display: flex; flex-direction: column; } .st b { font-size: 20px; font-variant-numeric: tabular-nums; } .st span { font-size: 11px; color: var(--muted); }
.mb-bar { display: flex; height: 8px; border-radius: var(--r-1); overflow: hidden; background: var(--sunken); } .mb-bar i { display: block; height: 100%; }

.vlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.vlist li { display: flex; align-items: center; gap: var(--sp-2); font-size: 12.5px; }
.vv { font-weight: 700; color: var(--accent); font-variant-numeric: tabular-nums; } .hash { background: var(--sunken); border-radius: var(--r-1); padding: 1px 6px; }
.when { color: var(--muted); font-size: 11px; } .vnote { color: var(--muted); font-style: italic; }

.row2 { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px; }
.link { color: var(--accent); text-decoration: none; } .link:hover { text-decoration: underline; }
.orcids { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.orcid { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ink); text-decoration: none; border: 1px solid var(--hairline); border-radius: var(--r-2); padding: 2px 8px; }
.orcid .oic { background: #a6ce39; color: #fff; font-size: 9px; font-weight: 700; border-radius: var(--r-1); padding: 1px 3px; }
.manifest { border-top: 1px solid var(--sunken); padding-top: 8px; }
.mtitle { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); display: flex; align-items: center; gap: 6px; }
.verbs { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
.verb { font-size: 11.5px; background: var(--sunken); border-radius: var(--r-2); padding: 2px 8px; color: var(--ink); } .verb.off { color: var(--faint); }
.verb .vok { color: var(--ok); font-style: normal; margin-left: 3px; }

.cscroll { overflow-x: auto; border: 1px solid var(--hairline); border-radius: var(--r-3); }
.cgrid { border-collapse: collapse; width: 100%; font-size: 12.5px; }
.cgrid th { text-align: left; padding: 7px 12px; background: var(--sunken); border-bottom: 1px solid var(--hairline); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.cgrid td { padding: 7px 12px; border-bottom: 1px solid var(--sunken); white-space: nowrap; } .cgrid tr:last-child td { border-bottom: 0; }
.cgrid .nm { font-weight: 600; }
</style>
