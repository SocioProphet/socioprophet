<script setup lang="ts">
// Structured reasoning trace — the moat made legible. Renders the agent's plan as a
// checklist, its retrieval provenance, grounding, and value-judgment verdict, falling
// back to text chips for the remaining trace kinds.
import type { ChatTurn } from '../composables/useNoeticaChat';

defineProps<{ turn: ChatTurn }>();

const STEP_GLYPH: Record<string, string> = {
  done: '✓', complete: '✓', completed: '✓', success: '✓',
  running: '◔', active: '◔', in_progress: '◔',
  failed: '✕', error: '✕', blocked: '✕', pending: '○', queued: '○',
};
const VERDICT_COLOR: Record<string, string> = {
  grounded: '#22c55e', speculative: '#d9a63a', contradiction: '#ef4444',
};
function pct(n?: number): string { return n == null ? '' : `${Math.round(n * 100)}%`; }
</script>

<template>
  <div class="tv">
    <div v-if="turn.intentName" class="tv-line"><span class="tv-k">intent</span><b>{{ turn.intentName }}</b></div>

    <!-- plan checklist -->
    <div v-if="turn.plan?.steps?.length" class="tv-sec">
      <div class="tv-k">plan<span v-if="turn.plan.capability"> · {{ turn.plan.capability }}</span></div>
      <ol class="tv-plan">
        <li v-for="s in turn.plan.steps" :key="s.id" :class="s.status">
          <span class="tv-glyph">{{ STEP_GLYPH[s.status] ?? '○' }}</span>
          <span class="tv-step-label">{{ s.label }}</span>
          <span v-if="s.detail" class="tv-step-detail">{{ s.detail }}</span>
        </li>
      </ol>
    </div>

    <!-- retrieval provenance -->
    <div v-if="turn.retrieval" class="tv-sec">
      <div class="tv-k">retrieval
        <span class="tv-dim">
          {{ (turn.retrieval.sources?.length ?? 0) + (turn.retrieval.document_sources?.length ?? 0) }} sources
          <template v-if="turn.retrieval.beliefs_injected"> · {{ turn.retrieval.beliefs_injected }} beliefs</template>
          <template v-if="turn.retrieval.token_estimate"> · ~{{ turn.retrieval.token_estimate }} tok</template>
        </span>
      </div>
      <div class="tv-chips">
        <span v-for="src in (turn.retrieval.document_sources ?? turn.retrieval.sources ?? []).slice(0, 6)" :key="src.id" class="tv-chip"
          :title="'score ' + src.score.toFixed(2)">{{ src.label }}</span>
      </div>
    </div>

    <!-- grounding -->
    <div v-if="turn.grounding && (turn.grounding.terms?.length || turn.grounding.domain)" class="tv-sec">
      <div class="tv-k">grounding<span v-if="turn.grounding.domain" class="tv-dim"> · {{ turn.grounding.domain }}</span></div>
      <div class="tv-chips">
        <span v-for="t in (turn.grounding.terms ?? []).slice(0, 10)" :key="t" class="tv-chip">{{ t }}</span>
      </div>
    </div>

    <!-- value judgment -->
    <div v-if="turn.judgment?.verdict" class="tv-sec">
      <div class="tv-k">judgment</div>
      <div class="tv-verdict">
        <span class="tv-badge" :style="{ color: VERDICT_COLOR[turn.judgment.verdict] }">● {{ turn.judgment.verdict }}</span>
        <span v-if="turn.judgment.worth != null" class="tv-dim">worth {{ pct(turn.judgment.worth) }}</span>
        <span v-if="turn.judgment.grounding != null" class="tv-dim">grounding {{ pct(turn.judgment.grounding) }}</span>
      </div>
      <div v-for="(c, i) in (turn.judgment.contradictions ?? [])" :key="i" class="tv-contra">⚠ {{ c.statement }}</div>
    </div>

    <!-- remaining trace kinds as text chips -->
    <div v-if="turn.trace?.length" class="tv-chips tv-rest">
      <span v-for="(tr, i) in turn.trace" :key="i" class="tv-chip tv-kindchip">
        <span class="tv-kindname">{{ tr.kind }}</span>{{ tr.text }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.tv { display: flex; flex-direction: column; gap: 8px; font-size: 11.5px; }
.tv-line { display: flex; align-items: center; gap: 6px; }
.tv-line b { color: var(--ntext); font-weight: 600; }
.tv-k { font-size: 9.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--ntext3); margin-bottom: 3px; }
.tv-dim { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--ntext3); }
.tv-plan { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }
.tv-plan li { display: flex; align-items: baseline; gap: 7px; color: var(--ntext); }
.tv-plan li.done, .tv-plan li.complete, .tv-plan li.completed, .tv-plan li.success { color: var(--ntext3); }
.tv-glyph { color: var(--nblue); width: 12px; flex: 0 0 auto; }
.tv-plan li.done .tv-glyph, .tv-plan li.complete .tv-glyph { color: #22c55e; }
.tv-plan li.failed .tv-glyph, .tv-plan li.error .tv-glyph { color: #ef4444; }
.tv-step-detail { color: var(--ntext3); font-size: 10.5px; }
.tv-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.tv-chip { background: var(--nline-weak); color: var(--ntext); border-radius: 5px; padding: 1px 7px; font-size: 10.5px; }
.tv-verdict { display: flex; align-items: center; gap: 10px; }
.tv-badge { font-weight: 700; }
.tv-contra { color: #f59e0b; margin-top: 3px; }
.tv-rest { margin-top: 2px; }
.tv-kindchip { display: inline-flex; align-items: center; gap: 5px; }
.tv-kindname { font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: var(--nblue); }
</style>
