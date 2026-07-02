<!-- P-STEPS — investigation / axiom-chain step stack. Native port of SP.steps. -->
<template>
  <div class="psteps">
    <template v-for="(s, i) in list" :key="i">
      <div v-if="s.start" class="step start">
        <div class="op"><b>⑂ {{ s.op }}</b></div>
      </div>
      <div v-else class="step" :class="{ active: s.active }">
        <div class="op">
          <b>{{ s.op }}</b>
          <span v-if="s.count != null" class="c">{{ s.count }}</span>
        </div>
        <div v-if="s.desc" class="d">{{ s.desc }}</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
export interface Step {
  op: string;
  count?: string | number;
  desc?: string;
  active?: boolean;
  start?: boolean;
}

defineProps<{ list: Step[] }>();
</script>
