<template>
  <span class="ui-badge" :class="`ui-badge--${tone}`"><slot /></span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'muted' | 'accent' | 'warn' }>(), { tone: 'muted' })
</script>

<style scoped>
.ui-badge{
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.05);
}
.ui-badge--accent{
  border-color: color-mix(in srgb, var(--accent) 40%, rgba(255,255,255,0.14));
  background: color-mix(in srgb, var(--accent) 18%, rgba(255,255,255,0.05));
}
.ui-badge--warn{
  border-color: rgba(255, 200, 90, 0.35);
  background: rgba(255, 200, 90, 0.12);
}
</style>
