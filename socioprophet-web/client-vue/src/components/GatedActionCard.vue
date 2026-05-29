<template>
  <article class="gated-action" aria-label="Gated action">
    <div>
      <ModeBadge :label="statusLabel" :tone="tone" />
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
    <button type="button" disabled :title="blockedReason">{{ actionLabel }}</button>
    <small>{{ blockedReason }}</small>
  </article>
</template>

<script setup lang="ts">
import ModeBadge from './ModeBadge.vue';

withDefaults(
  defineProps<{
    title: string;
    description: string;
    actionLabel: string;
    blockedReason: string;
    statusLabel?: string;
    tone?: 'default' | 'success' | 'warning' | 'danger' | 'muted';
  }>(),
  { statusLabel: 'gated', tone: 'warning' },
);
</script>

<style scoped>
.gated-action {
  display: grid;
  gap: 0.85rem;
  border: 1px solid rgba(241, 194, 27, 0.28);
  border-radius: 16px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.045);
}

.gated-action h3 {
  margin: 0.55rem 0 0.35rem;
  font-size: 1rem;
}

.gated-action p,
.gated-action small {
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.45;
}

.gated-action p {
  margin: 0;
}

.gated-action small {
  display: block;
}

.gated-action button {
  justify-self: start;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  padding: 0.65rem 0.85rem;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.62);
  cursor: not-allowed;
}
</style>
