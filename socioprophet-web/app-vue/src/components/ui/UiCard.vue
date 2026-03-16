<template>
  <section class="ui-card" :class="{ 'ui-card--flush': flush }">
    <header v-if="title || $slots.header" class="ui-card__header">
      <div v-if="title" class="ui-card__title">{{ title }}</div>
      <slot name="header" />
    </header>

    <div class="ui-card__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="ui-card__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  flush?: boolean
}>()
</script>

<style scoped>
.ui-card{
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.04);
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 18px 50px rgba(0,0,0,0.25),
    inset 0 1px 0 rgba(255,255,255,0.05);
}
.ui-card__header{
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  gap: 10px;
}
.ui-card__title{
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.1px;
}
.ui-card__body{ padding: 14px; }
.ui-card__footer{
  padding: 12px 14px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.ui-card--flush .ui-card__body{ padding: 0; }
</style>
