<template>
  <section class="mb" aria-label="Model board">
    <h3 class="mb-title">Model Board <span class="mb-pill" :class="{ live }">{{ live ? 'live · lattice' : 'fixture' }}</span></h3>
    <p class="mb-note">One sovereignty-ranked board across foundation <b>and</b> business models — cloud ∩ local, on the shared InferenceGateway catalog. Sovereign-local leads; vendor-cloud is ranked, not preferred. {{ board.note }}</p>
    <div class="mb-mix">
      <span v-for="(n, k) in board.sovereigntyMix" :key="k" class="mb-chip">{{ k }} · {{ n }}</span>
    </div>
    <table class="mb-lb">
      <thead><tr><th>#</th><th>Model</th><th>Provider</th><th>Sovereignty</th><th>Score</th></tr></thead>
      <tbody>
        <tr v-for="row in board.leaderboard" :key="row.model_id" :class="{ vendor: row.privacy_profile === 'vendor-cloud' }">
          <td>{{ row.rank }}</td>
          <td class="mb-model">{{ row.model_id }}</td>
          <td>{{ row.provider_id }}</td>
          <td><span class="mb-sov" :class="row.privacy_profile">{{ row.privacy_profile }}</span></td>
          <td class="mb-score">{{ row.score.toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchModelBoard, type ModelBoard } from '../api/modelBoardApi';

const board = ref<ModelBoard>({ kind: 'ModelBoardNotebook', entryCount: 0, sovereigntyMix: {}, leaderboard: [], note: '' });
const live = ref(false);

onMounted(async () => {
  const r = await fetchModelBoard();
  board.value = r.board;
  live.value = r.live;
});
</script>

<style scoped>
.mb { padding: 16px; color: var(--text, #e8edf7); }
.mb-title { color: var(--accent, #4fd0e0); display: flex; align-items: center; gap: 10px; }
.mb-pill { font-size: 11px; padding: 2px 8px; border-radius: 10px; border: 1px solid var(--border, #2c3854); color: var(--muted, #8b96b0); }
.mb-pill.live { color: #43c68a; border-color: #43c68a; }
.mb-note { color: var(--muted, #8b96b0); font-size: 13px; max-width: 74ch; }
.mb-mix { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
.mb-chip { font-size: 11px; padding: 3px 9px; border-radius: 12px; border: 1px solid var(--border, #2c3854); color: var(--muted, #8b96b0); }
.mb-lb { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
.mb-lb th, .mb-lb td { text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--border, #2c3854); }
.mb-lb th { color: var(--muted, #8b96b0); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; }
.mb-model { font-weight: 600; }
.mb-score { font-variant-numeric: tabular-nums; }
.mb-lb tr.vendor td { opacity: .68; }
.mb-sov.sovereign-local { color: #43c68a; }
.mb-sov.sovereign-both { color: #7aa2ff; }
.mb-sov.vendor-cloud { color: #e0a83a; }
</style>
