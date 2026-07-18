<script setup lang="ts">
import { computed } from "vue";

// Inline provenance as a real node-link strip — not a space-joined string.
// Accepts an array of stages; any element that itself encodes a pipeline
// ("ingest→dbt→catalog", "a -> b", "x · y") is split into its stages.
const props = defineProps<{ steps: (string | { label: string; hash?: string })[]; title?: string }>();

const stages = computed(() => {
  const out: { label: string; hash?: string }[] = [];
  for (const s of props.steps ?? []) {
    if (typeof s === "object") { out.push({ label: s.label, hash: s.hash }); continue; }
    for (const part of String(s).split(/\s*(?:→|->|·|→)\s*/).filter(Boolean)) {
      out.push({ label: part.trim() });
    }
  }
  return out;
});
</script>

<template>
  <div class="lineage-strip" v-if="stages.length" :aria-label="title || 'lineage'">
    <template v-for="(st, i) in stages" :key="i">
      <span class="node" :class="{ last: i === stages.length - 1 }" :title="st.hash ? st.label + ' · ' + st.hash : st.label">{{ st.label }}</span>
      <span v-if="i < stages.length - 1" class="arrow" aria-hidden="true">▸</span>
    </template>
  </div>
</template>

<style scoped>
.lineage-strip { display: flex; align-items: center; gap: 5px; overflow-x: auto; padding: 2px 0;
  font: 500 11px/1.3 var(--ui, sans-serif); scrollbar-width: thin; }
.lineage-strip::-webkit-scrollbar { height: 4px; }
.node { flex: 0 0 auto; white-space: nowrap; padding: 2px 8px; border: 1px solid var(--hairline);
  border-radius: var(--r-1, 3px); background: var(--surface); color: var(--ink-2, var(--ink)); }
.node.last { border-color: color-mix(in srgb, var(--epi-attested) 55%, var(--hairline));
  color: var(--epi-attested); background: var(--epi-attested-wash, transparent); font-weight: 600; }
.arrow { flex: 0 0 auto; color: var(--faint, var(--muted)); font-size: 10px; }
</style>
