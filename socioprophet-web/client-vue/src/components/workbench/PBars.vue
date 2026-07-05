<!-- P-BARS — horizontal bar list. Native port of SP.bars. -->
<template>
  <div class="pbars">
    <div v-for="row in rows" :key="row.label" class="brow">
      <span class="bn">{{ row.label }}</span>
      <div class="track">
        <i :style="{ width: `${(row.value / maxValue) * 100}%`, background: row.color || 'var(--device)' }" />
      </div>
      <span class="bv">{{ row.value.toLocaleString() }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface BarRow {
  label: string;
  value: number;
  color?: string;
}

const props = defineProps<{ rows: BarRow[]; max?: number }>();

const maxValue = computed(() => props.max || Math.max(...props.rows.map((r) => r.value)));
</script>
