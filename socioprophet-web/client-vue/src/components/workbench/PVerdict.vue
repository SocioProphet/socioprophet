<!-- P-VERDICT — Mellumwork ternary verdict block. Native port of SP.verdict.
     Verdict-class logic is byte-faithful to the render-harness `vc` function. -->
<template>
  <div class="pverdict">
    <div class="vh">{{ title }}</div>
    <div v-for="([k, v]) in items" :key="k" class="vr">
      <span class="k">{{ k }}</span>
      <span class="v" :class="verdictClass(v)">{{ v }}</span>
    </div>
    <div v-if="note" class="note">⊘ {{ note }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; items: [string, string][]; note?: string }>();

// Faithful to sp-primitives-carbon.js SP.verdict `vc`.
function verdictClass(v: string): 'v-pos' | 'v-neg' | 'v-zero' {
  if (['POS', 'admissible', 'PASS'].includes(v)) return 'v-pos';
  if (['NEG', 'blocked', 'FAIL'].some((x) => String(v).includes(x))) return 'v-neg';
  return 'v-zero';
}
</script>
