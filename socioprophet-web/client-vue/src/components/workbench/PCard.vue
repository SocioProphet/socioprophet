<!-- P-CARD — flat Carbon card container. Native port of SP.card.
     `right` slot = header-right adornment; default slot = card body. -->
<template>
  <div class="carbon-card">
    <div class="ch">
      <h3>{{ title }}</h3>
      <slot name="right" />
    </div>
    <div class="cb"><slot /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>
