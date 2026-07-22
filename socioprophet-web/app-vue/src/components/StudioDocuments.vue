<script setup lang="ts">
// The DOCUMENT view of the project graph (BFF /api/studio/documents): what a Noetica user
// published — or the pipeline ingested — and how much linked knowledge each document yielded.
// Documents, not a node soup; every row traces to its doc_sha and extractor. Hand-authored
// facts are counted separately (undocumented_nodes) — still real, just not doc-scoped.
import { ref, onMounted, watch } from "vue";
import { loadDocuments, type DocumentsView } from "../services/studioApi";

const props = defineProps<{ project: string }>();
const view = ref<DocumentsView | null>(null);
const loading = ref(true);
const err = ref("");

async function load() {
  loading.value = true; err.value = "";
  try { view.value = await loadDocuments(props.project); }
  catch (e) { err.value = e instanceof Error ? e.message : "failed to load documents"; }
  finally { loading.value = false; }
}
onMounted(load);
watch(() => props.project, load);

const short = (sha: string) => sha.slice(0, 12);
</script>

<template>
  <div class="docs">
    <div class="dbar">
      <span class="cnt" v-if="view">{{ view.count }} document{{ view.count === 1 ? "" : "s" }}
        · {{ view.undocumented_nodes }} hand-authored fact{{ view.undocumented_nodes === 1 ? "" : "s" }} outside any document</span>
      <div class="spacer" />
      <span v-if="view?.stub" class="stub">stub — set VITE_STUDIO_API</span>
      <button class="ghost" @click="load" :disabled="loading" title="reload" aria-label="Reload documents">↻</button>
    </div>

    <div v-if="err" class="err">{{ err }}</div>
    <div v-else-if="loading" class="muted">Loading…</div>
    <div v-else-if="view && view.documents.length === 0" class="muted">
      No documents yet — drop one through the ingestion pipeline (or a federated Noetica user's
      knowledge will appear here once their machine is admitted).
    </div>

    <table v-else-if="view" class="dtable">
      <thead>
        <tr><th>Document</th><th class="num">Entities</th><th class="num">Edges</th><th>Sample</th><th>Extractor</th></tr>
      </thead>
      <tbody>
        <tr v-for="d in view.documents" :key="d.doc_sha">
          <td>
            <div class="fname">{{ d.filename || "(unnamed)" }}</div>
            <code class="sha" :title="d.doc_sha">{{ short(d.doc_sha) }}</code>
          </td>
          <td class="num">{{ d.entities }}</td>
          <td class="num">{{ d.edges }}</td>
          <td><span class="chip" v-for="s in d.sample.slice(0, 4)" :key="s">{{ s }}</span></td>
          <td class="muted small">{{ d.extractor || "—" }}</td>
        </tr>
      </tbody>
    </table>

    <p class="foot" v-if="view && view.documents.length">
      Every fact from these documents carries its doc_sha in provenance — the graph explorer's
      provenance panel traces any node back to the exact document that produced it.
    </p>
  </div>
</template>

<style scoped>
.docs { display: flex; flex-direction: column; gap: 12px; }
.dbar { display: flex; align-items: center; gap: 10px; }
.cnt { font-size: 12px; color: var(--text-2, #6a6f73); }
.spacer { flex: 1; }
.stub { font-size: 11px; color: var(--text-3, #8d9196); }
.ghost { background: none; border: 1px solid var(--border-1, #e0e0e0); border-radius: 6px; padding: 2px 8px; cursor: pointer; color: var(--text-2, #6a6f73); }
.err { color: #b3261e; font-size: 12px; }
.muted { color: var(--text-3, #8d9196); font-size: 12px; }
.small { font-size: 11px; }
.dtable { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.dtable th { text-align: left; font-weight: 600; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-3, #8d9196); padding: 6px 10px; border-bottom: 1px solid var(--border-1, #e0e0e0); }
.dtable td { padding: 8px 10px; border-bottom: 1px solid var(--border-2, #f0f0f0); vertical-align: top; }
.dtable .num { text-align: right; font-variant-numeric: tabular-nums; }
.fname { font-weight: 600; color: var(--text-1, #21272a); }
.sha { font-size: 10.5px; color: var(--text-3, #8d9196); }
.chip { display: inline-block; margin: 0 4px 4px 0; padding: 1px 7px; border: 1px solid var(--border-1, #e0e0e0); border-radius: 999px; font-size: 11px; color: var(--text-2, #6a6f73); }
.foot { font-size: 11.5px; color: var(--text-3, #8d9196); max-width: 62ch; }
</style>
