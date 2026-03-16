<template>
  <div class="ui-card">
    <div v-if="title" class="ui-cardTitle">{{ title }}</div>
    <slot />
    <div v-if="$slots.footer" style="margin-top:12px;">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>()
</script>
