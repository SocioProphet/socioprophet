<template>
  <section class="boundary-notice" :aria-label="ariaLabel">
    <ModeBadge :label="label" :tone="tone" />
    <p>{{ message }}</p>
  </section>
</template>

<script setup lang="ts">
import ModeBadge from './ModeBadge.vue';

withDefaults(
  defineProps<{
    label: string;
    message: string;
    tone?: 'default' | 'success' | 'warning' | 'danger' | 'muted';
    ariaLabel?: string;
  }>(),
  { tone: 'warning', ariaLabel: 'Boundary notice' },
);
</script>

<style scoped>
.boundary-notice {
  display: grid;
  gap: 0.65rem;
  border: 1px solid rgba(241, 194, 27, 0.45);
  border-radius: 18px;
  padding: 1rem;
  background: rgba(241, 194, 27, 0.08);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.14);
}

.boundary-notice p {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.55;
}
</style>
