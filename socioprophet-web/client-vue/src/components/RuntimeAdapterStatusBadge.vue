<template>
  <span
    class="runtime-adapter-status"
    :class="[`runtime-adapter-status--${feature.runtime_state}`]"
    :title="statusMessage(feature)"
  >
    <span class="runtime-adapter-status__state">{{ feature.runtime_state }}</span>
    <span class="runtime-adapter-status__level">{{ feature.evidence_level }}</span>
  </span>
</template>

<script setup lang="ts">
import type { RuntimeAdapterFeature } from '../runtime-adapters/types'
import { statusMessage } from '../runtime-adapters/baseAdapter'

defineProps<{
  feature: RuntimeAdapterFeature
}>()
</script>

<style scoped>
.runtime-adapter-status {
  align-items: center;
  border: 1px solid currentColor;
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.75rem;
  font-weight: 700;
  gap: 0.35rem;
  letter-spacing: 0.02em;
  line-height: 1;
  padding: 0.35rem 0.5rem;
  text-transform: uppercase;
}

.runtime-adapter-status__level {
  opacity: 0.72;
}

.runtime-adapter-status--mock,
.runtime-adapter-status--unavailable,
.runtime-adapter-status--retired {
  opacity: 0.7;
}

.runtime-adapter-status--fixture,
.runtime-adapter-status--degraded {
  opacity: 0.88;
}

.runtime-adapter-status--live {
  opacity: 1;
}
</style>
