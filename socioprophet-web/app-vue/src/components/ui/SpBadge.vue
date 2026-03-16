<template>
  <span class="ui-badge" :class="tone">
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'ok'|'warn'|'bad'|'' }>(), { tone: '' })
</script>
