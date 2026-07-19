<script setup lang="ts">
// The Governance cockpit — the Foundry-Workshop answer + the estate's crown jewels, operable in-product:
// the REAL Ontogenesis ontology (817 classes) you type against, the typed/SHACL-validated ONTOLOGY ACTIONS
// (Foundry's crown jewel, beaten), and the GAIA world-signals PROMOTION MEMBRANE where a promotion state IS an
// epistemic status — the same governed-evidence discipline across the knowledge, human, and Earth twins.
import { ref, onMounted, watch } from "vue";
import {
  loadOntology, loadOntologyClass, loadActions, invokeAction, loadWorldsignals, submitWorldsignal,
  promoteWorldsignal, loadGaiaOntology, loadHdt, loadHdtOntology, submitHdtObservation, promoteHdt, EPISTEMIC_COLORS,
  type OntologyView, type OntologyClassDetail, type ActionDef, type WorldSignal, type GaiaOntology,
  type HdtObservation, type HdtOntology,
} from "../../services/studioApi";

const props = defineProps<{ project: string }>();

const onto = ref<OntologyView | null>(null);
const actions = ref<ActionDef[]>([]);
const signals = ref<WorldSignal[]>([]);
const gaia = ref<GaiaOntology | null>(null);
const observations = ref<HdtObservation[]>([]);
const hdt = ref<HdtOntology | null>(null);
const loading = ref(true);
const err = ref("");
const token = ref("");
const flash = ref("");
function say(m: string) { flash.value = m; setTimeout(() => (flash.value = ""), 3000); }

async function load() {
  loading.value = true; err.value = "";
  try {
    const [o, a, s, g, ho, hon] = await Promise.all([loadOntology(""), loadActions(props.project), loadWorldsignals(props.project), loadGaiaOntology(), loadHdt(props.project), loadHdtOntology()]);
    onto.value = o; actions.value = a.actions; signals.value = s.world_signals; gaia.value = g;
    observations.value = ho.observations; hdt.value = hon;
  } catch (e) { err.value = e instanceof Error ? e.message : "failed to load governance"; }
  finally { loading.value = false; }
}
onMounted(load);
watch(() => props.project, load);

// ontology browse
const q = ref(""); const classDetail = ref<OntologyClassDetail | null>(null);
async function search() { try { onto.value = await loadOntology(q.value); } catch { /* */ } }
async function openClass(iri: string) { try { classDetail.value = await loadOntologyClass(iri); } catch { /* */ } }

// invoke action
const invAction = ref(""); const invTarget = ref(""); const invArgs = ref("{}");
async function doInvoke() {
  try {
    const args = JSON.parse(invArgs.value || "{}");
    const r = await invokeAction({ project: props.project, action: invAction.value, target: invTarget.value, args }, token.value);
    say(`Invoked ${invAction.value} → ${r.applied.join(", ")} · receipt ${r.receipt.correlation_id}`);
  } catch (e) { say(e instanceof Error ? e.message : "invoke failed"); }
}

// GAIA
const wsFeature = ref(""); const wsType = ref("feature_registry"); const wsActor = ref("human");
async function doSubmit() {
  try { const r = await submitWorldsignal({ project: props.project, feature_id: wsFeature.value, signal_type: wsType.value, actor_kind: wsActor.value }, token.value);
    say(`Signal ${r.signal_id.split(":").pop()} → ${r.promotion_state} (${r.epistemic_mode})`); wsFeature.value = ""; await load(); }
  catch (e) { say(e instanceof Error ? e.message : "submit failed"); }
}
async function doPromote(sig: WorldSignal, to_state: string, actor_kind: string) {
  try {
    const r = await promoteWorldsignal({ project: props.project, signal: sig.signal_id, to_state, actor_kind }, token.value);
    if ("blocked" in r) say(`🔒 ${r.message}`);
    else { say(`${sig.feature_id} → ${r.to_state} (${r.epistemic_mode})`); await load(); }
  } catch (e) { say(e instanceof Error ? e.message : "promote failed"); }
}

// HDT (the human twin)
const hdtSubject = ref(""); const hdtCode = ref(""); const hdtActor = ref("human");
async function doHdtSubmit() {
  try { const r = await submitHdtObservation({ project: props.project, subject: hdtSubject.value, code: hdtCode.value, actor_kind: hdtActor.value }, token.value);
    say(`Observation → ${r.omega_state} (${r.epistemic_mode})`); hdtCode.value = ""; await load(); }
  catch (e) { say(e instanceof Error ? e.message : "submit failed"); }
}
async function doHdtPromote(o: HdtObservation, to_state: string, actor_kind: string) {
  try {
    const r = await promoteHdt({ project: props.project, observation: o.observation_id, to_state, actor_kind }, token.value);
    if ("blocked" in r) say(`🔒 ${r.message}`);
    else { say(`${o.code} → ${r.to_state} (${r.epistemic_mode})`); await load(); }
  } catch (e) { say(e instanceof Error ? e.message : "promote failed"); }
}

function epi(mode?: string | null): string { return EPISTEMIC_COLORS[mode || "observed"] || "var(--faint)"; }
</script>

<template>
  <div class="gov">
    <div class="gbar">
      <span class="cnt">Governance · real ontology · typed actions · the GAIA promotion membrane</span>
      <div class="spacer" />
      <input v-model="token" type="password" class="tok" placeholder="write token" />
      <button class="ghost" @click="load" :disabled="loading" title="reload" aria-label="Reload governance">↻</button>
    </div>
    <p v-if="flash" class="flash">{{ flash }}</p>
    <p v-if="err" class="msg err">{{ err }}</p>
    <p v-else-if="loading" class="msg">Loading governance…</p>

    <div v-else class="grid">
      <!-- Ontogenesis ontology browser -->
      <section class="card">
        <header class="ch"><span class="ci">⬡</span> Ontology<span class="score" v-if="onto">{{ onto.counts.classes }} classes · real</span></header>
        <div class="orow">
          <input v-model="q" class="j" placeholder="search Ontogenesis classes…" @keyup.enter="search" />
          <button class="mini" @click="search">Search</button>
        </div>
        <ul class="clist">
          <li v-for="c in onto?.classes.slice(0, 8)" :key="c.iri" @click="openClass(c.iri)" :class="{ sel: classDetail?.class.iri === c.iri }">
            <code class="mono">{{ c.iri }}</code><span class="pc">{{ c.property_count }} props</span>
          </li>
        </ul>
        <div v-if="classDetail" class="cdetail">
          <div class="cd-h"><b>{{ classDetail.class.iri }}</b><span v-if="classDetail.class.subClassOf.length" class="sub">⊑ {{ classDetail.class.subClassOf.join(", ") }}</span></div>
          <div class="props">
            <span v-for="p in classDetail.class.inherited_properties.slice(0, 12)" :key="p.iri" class="prop" :class="p.kind">{{ p.iri }}<i v-if="p.range">→{{ p.range }}</i></span>
          </div>
        </div>
        <p class="sub">The real Ontogenesis OWL corpus — actions are <b>typed</b> against these classes and their declared properties.</p>
      </section>

      <!-- Ontology actions (Foundry Workshop, beaten) -->
      <section class="card">
        <header class="ch"><span class="ci">◑</span> Actions<span class="tagline">typed · SHACL-validated · reversible</span></header>
        <div v-for="a in actions" :key="a.action_id" class="action">
          <div class="arow"><b>{{ a.name }}</b><code class="mono tt">{{ a.target_type }}</code></div>
          <div class="eff"><span v-for="(e, i) in a.effects" :key="i" class="e">{{ e.op }} {{ e.property || e.label }}</span></div>
        </div>
        <div class="invoke">
          <div class="irow">
            <input v-model="invAction" class="j" placeholder="action name" />
            <input v-model="invTarget" class="j" placeholder="target node id" />
          </div>
          <input v-model="invArgs" class="j mono" placeholder='args {"newname":"width"}' />
          <button class="primary" @click="doInvoke">Invoke</button>
        </div>
        <p class="sub">Foundry's crown jewel — but every invocation is proof-carrying, <b>SHACL-validated against the ontology</b>, receipted, and reversible.</p>
      </section>

      <!-- GAIA promotion membrane -->
      <section class="card wide" v-if="gaia">
        <header class="ch"><span class="ci">◍</span> GAIA world-signals — the promotion membrane<span class="tagline">Earth twin</span></header>
        <div class="membrane">
          <div v-for="(m, i) in gaia.promotion_epistemic_membrane" :key="m.state" class="mstate" :class="{ canon: m.canonical }">
            <span class="ms-n">{{ m.state }}</span>
            <span class="ms-epi" :style="{ color: epi(m.epistemic_human) }">{{ m.epistemic_human }}</span>
            <span v-if="i < gaia.promotion_epistemic_membrane.length - 1" class="ms-arrow">→</span>
          </div>
        </div>
        <p class="invariant">⚖ {{ gaia.invariant }}</p>

        <div class="submit">
          <input v-model="wsFeature" class="j" placeholder="feature_id" />
          <select v-model="wsType" class="j"><option>feature_registry</option><option>weather</option><option>foot_traffic</option></select>
          <select v-model="wsActor" class="j"><option value="human">human</option><option value="model">model</option></select>
          <button class="primary" @click="doSubmit">Submit signal</button>
        </div>

        <table class="wgrid">
          <thead><tr><th>Feature</th><th>State</th><th>Epistemic</th><th>Evidence</th><th>Promote</th></tr></thead>
          <tbody>
            <tr v-for="s in signals" :key="s.signal_id">
              <td class="nm">{{ s.feature_id }}</td>
              <td><span class="state" :class="{ canon: s.canonical }">{{ s.promotion_state }}</span></td>
              <td><span class="epi" :style="{ borderColor: epi(s.epistemic_mode), color: epi(s.epistemic_mode) }">{{ s.epistemic_mode }}</span></td>
              <td class="ev">{{ s.evidence_count }}</td>
              <td class="promote">
                <button class="mini" @click="doPromote(s, 'ReviewRequired', 'human')" v-if="!s.canonical">→ review</button>
                <button class="mini go" @click="doPromote(s, 'Promoted', 'human')" v-if="!s.canonical">→ promote</button>
                <button class="mini danger" @click="doPromote(s, 'Promoted', 'model')" v-if="!s.canonical" title="demonstrates the invariant">→ promote as model</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="sub">The promotion state <b>is</b> the epistemic status. Try “promote as model” — GAIA invariant #2 blocks a model from canonizing. One discipline across knowledge, human &amp; Earth twins.</p>
      </section>

      <!-- HDT — the human twin (closes the triangle) -->
      <section class="card wide" v-if="hdt">
        <header class="ch"><span class="ci">◐</span> HDT observations — the OmegaState lattice<span class="tagline">human twin · closes the triangle</span></header>
        <div class="membrane">
          <div v-for="(m, i) in hdt.omega_epistemic_lattice" :key="m.state" class="mstate" :class="{ canon: m.canonical }">
            <span class="ms-n">{{ m.state }}</span>
            <span class="ms-epi" :style="{ color: epi(m.epistemic_human) }">{{ m.epistemic_human }}</span>
            <span v-if="i < hdt.omega_epistemic_lattice.length - 1" class="ms-arrow">→</span>
          </div>
        </div>
        <p class="invariant">⚖ {{ hdt.invariant }}</p>
        <div class="submit">
          <input v-model="hdtSubject" class="j" placeholder="subject (person id)" />
          <input v-model="hdtCode" class="j" placeholder="observation code (e.g. LOINC 8867-4)" />
          <select v-model="hdtActor" class="j"><option value="human">human</option><option value="clinician">clinician</option><option value="model">model</option></select>
          <button class="primary" @click="doHdtSubmit">Record observation</button>
        </div>
        <table class="wgrid">
          <thead><tr><th>Code</th><th>Subject</th><th>OmegaState</th><th>Epistemic</th><th>Advance</th></tr></thead>
          <tbody>
            <tr v-for="o in observations" :key="o.observation_id">
              <td class="nm">{{ o.code }}</td>
              <td class="mono">{{ o.subject }}</td>
              <td><span class="state" :class="{ canon: o.canonical }">{{ o.omega_state }}</span></td>
              <td><span class="epi" :style="{ borderColor: epi(o.epistemic_mode), color: epi(o.epistemic_mode) }">{{ o.epistemic_mode }}</span></td>
              <td class="promote">
                <button class="mini" @click="doHdtPromote(o, 'TRUSTED', 'clinician')" v-if="!o.canonical">→ trusted</button>
                <button class="mini go" @click="doHdtPromote(o, 'DELIVERED', 'clinician')" v-if="!o.canonical">→ deliver</button>
                <button class="mini danger" @click="doHdtPromote(o, 'DELIVERED', 'model')" v-if="!o.canonical" title="demonstrates the invariant">→ deliver as model</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="sub">The <b>third twin</b>. OmegaState = epistemic status, exactly as knowledge &amp; Earth. Only a human/clinician DELIVERS to canonical — “deliver as model” is blocked. <b>All three twins, one discipline.</b></p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.gov { font: 14px/1.5 var(--ui); color: var(--ink); }
.gov :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: var(--r-1); }
.gbar { display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-3); }
.gbar .cnt { color: var(--muted); font-size: 12px; } .gbar .spacer { flex: 1; }
.gbar .tok { border: 1px solid var(--hairline-strong); border-radius: var(--r-2); padding: 6px 8px; font-size: 13px; width: 120px; background: var(--surface); color: var(--ink); }
.ghost { border: 1px solid var(--hairline-strong); background: var(--surface); color: var(--ink-2); border-radius: var(--r-2); width: 30px; height: 30px; cursor: pointer; }
.flash { background: var(--ok-wash); color: var(--ok); border-radius: var(--r-2); padding: 7px 12px; font-size: 12.5px; margin: 0 0 12px; }
.msg { color: var(--muted); } .msg.err { color: var(--fail); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: var(--sp-3); }
.card { border: 1px solid var(--hairline); border-radius: var(--r-3); padding: var(--sp-3) var(--sp-4); background: var(--surface); } .card.wide { grid-column: 1 / -1; }
.ch { display: flex; align-items: center; gap: var(--sp-2); font-weight: 600; font-size: 14px; margin-bottom: 10px; }
.ch .ci { color: var(--accent); } .ch .tagline { margin-left: auto; font-size: 10.5px; color: var(--accent); background: var(--accent-wash); border-radius: var(--pill); padding: 2px 9px; font-weight: 500; }
.score { margin-left: auto; font-size: 11px; color: var(--ok); background: var(--ok-wash); border-radius: var(--pill); padding: 2px 9px; font-variant-numeric: tabular-nums; }
.mono { font-family: var(--mono); font-size: 12px; }
.sub { color: var(--muted); font-size: 12px; margin: 10px 0 0; } .sub b { color: var(--ink); }
.j { border: 1px solid var(--hairline-strong); border-radius: var(--r-2); padding: 6px 8px; font-size: 13px; background: var(--surface); color: var(--ink); }
.primary { border: 1px solid var(--accent); background: var(--accent); color: #fff; border-radius: var(--r-2); padding: 6px 14px; font-size: 13px; cursor: pointer; }
.mini { border: 1px solid var(--hairline-strong); background: var(--surface); color: var(--ink-2); border-radius: var(--r-2); padding: 3px 9px; font-size: 11.5px; cursor: pointer; }
.mini.go { border-color: var(--accent); color: var(--accent); } .mini.danger { border-color: var(--warn); color: var(--warn); }

.orow { display: flex; gap: 6px; margin-bottom: 8px; } .orow .j { flex: 1; }
.clist { list-style: none; margin: 0 0 8px; padding: 0; }
.clist li { display: flex; align-items: center; gap: var(--sp-2); padding: 3px 6px; border-radius: var(--r-2); cursor: pointer; }
.clist li:hover, .clist li.sel { background: var(--accent-wash); } .clist .pc { margin-left: auto; font-size: 11px; color: var(--faint); }
.cdetail { border-top: 1px solid var(--sunken); padding-top: 8px; margin-top: 6px; }
.cd-h { display: flex; gap: 8px; align-items: baseline; } .cd-h .sub { font-size: 11px; color: var(--muted); }
.props { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
.prop { font-size: 10.5px; background: var(--sunken); border-radius: var(--r-2); padding: 1px 6px; font-family: var(--mono); }
.prop.object { background: var(--accent-wash); color: var(--accent); } .prop i { font-style: normal; opacity: .6; }

.action { border: 1px solid var(--hairline); border-radius: var(--r-2); padding: 6px 8px; margin-bottom: 6px; }
.arow { display: flex; align-items: center; gap: var(--sp-2); } .arow .tt { margin-left: auto; background: var(--sunken); border-radius: var(--r-2); padding: 1px 6px; }
.eff { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 4px; } .eff .e { font-size: 10.5px; color: var(--muted); background: var(--sunken); border-radius: var(--r-2); padding: 1px 6px; }
.invoke { border-top: 1px solid var(--sunken); padding-top: 8px; margin-top: 6px; display: flex; flex-direction: column; gap: 6px; }
.irow { display: flex; gap: 6px; } .irow .j { flex: 1; } .invoke .j { width: 100%; }

.membrane { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-bottom: 8px; }
.mstate { display: flex; align-items: center; gap: 6px; border: 1px solid var(--hairline); border-radius: var(--r-2); padding: 5px 9px; }
.mstate.canon { border-color: color-mix(in srgb, var(--ok) 40%, transparent); background: var(--ok-wash); }
.ms-n { font-weight: 600; font-size: 12px; } .ms-epi { font-size: 10.5px; } .ms-arrow { color: var(--faint); margin: 0 2px; }
.invariant { background: var(--warn-wash); color: var(--warn); border-radius: var(--r-2); padding: 6px 10px; font-size: 12px; margin: 0 0 10px; }
.submit { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.wgrid { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.wgrid th { text-align: left; padding: 6px 8px; background: var(--sunken); border-bottom: 1px solid var(--hairline); font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.wgrid td { padding: 6px 8px; border-bottom: 1px solid var(--sunken); } .wgrid .nm { font-weight: 600; }
.state { font-size: 10.5px; border-radius: var(--pill); padding: 1px 8px; background: var(--sunken); color: var(--muted); } .state.canon { background: var(--ok-wash); color: var(--ok); }
.epi { font-size: 10px; border: 1px solid; border-radius: var(--r-1); padding: 1px 7px; } .ev { text-align: center; font-variant-numeric: tabular-nums; }
.promote { display: flex; gap: 4px; flex-wrap: wrap; }
</style>
