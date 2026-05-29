<template>
  <span :class="['mode-badge', `mode-badge--${tone}`]">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    tone?: 'default' | 'success' | 'warning' | 'danger' | 'muted';
  }>(),
  { tone: 'default' },
);
</script>

<style scoped>
.mode-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 999px;
  padding: 0.18rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: rgba(120, 169, 255, 0.15);
  color: var(--accent, #78a9ff);
}

.mode-badge--success {
  background: rgba(36, 161, 72, 0.18);
  color: #42be65;
}

.mode-badge--warning {
  background: rgba(241, 194, 27, 0.18);
  color: #f1c21b;
}

.mode-badge--danger {
  background: rgba(250, 77, 86, 0.18);
  color: #fa4d56;
}

.mode-badge--muted {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.72);
}
</style>
