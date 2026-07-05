<!-- P-TAG / P-TIER — Carbon tag (angular, flat). Native port of SP.tag / SP.tier. -->
<template>
  <span class="tag" :class="`tag-${kind}`"><slot>{{ text }}</slot></span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ text?: string; kind?: 'grey' | 'green' | 'blue' | 'red' | 'amber' | 'purple' }>(),
  { text: '', kind: 'grey' },
);
</script>
