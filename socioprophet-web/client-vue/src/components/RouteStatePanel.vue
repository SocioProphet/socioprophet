<template>
  <section :class="['route-state-panel', `route-state-panel--${state}`]" :aria-label="ariaLabel">
    <ModeBadge :label="state" :tone="tone" />
    <div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ModeBadge from './ModeBadge.vue';

const props = withDefaults(
  defineProps<{
    state: 'idle' | 'loading' | 'empty' | 'error' | 'mock' | 'ready';
    title: string;
    message: string;
    ariaLabel?: string;
  }>(),
  { ariaLabel: 'Route state' },
);

const tone = computed(() => {
  if (props.state === 'error') return 'danger';
  if (props.state === 'loading' || props.state === 'idle' || props.state === 'mock') return 'warning';
  if (props.state === 'ready') return 'success';
  return 'muted';
});
</script>

<style scoped>
.route-state-panel {
  display: grid;
  gap: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  padding: 1rem;
  background: rgba(20, 24, 31, 0.82);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
}

.route-state-panel h3,
.route-state-panel p {
  margin: 0;
}

.route-state-panel h3 {
  font-size: 1rem;
}

.route-state-panel p {
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.45;
}

.route-state-panel--error {
  border-color: rgba(250, 77, 86, 0.38);
}

.route-state-panel--empty,
.route-state-panel--idle,
.route-state-panel--loading,
.route-state-panel--mock {
  border-color: rgba(241, 194, 27, 0.32);
}

.route-state-panel--ready {
  border-color: rgba(36, 161, 72, 0.34);
}
</style>
