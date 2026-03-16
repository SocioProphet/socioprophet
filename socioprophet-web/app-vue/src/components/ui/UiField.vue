<template>
  <label class="ui-field">
    <div v-if="label" class="ui-field__label">{{ label }}</div>
    <input class="ui-field__input" :placeholder="placeholder" :value="modelValue" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
    <div v-if="hint" class="ui-field__hint">{{ hint }}</div>
  </label>
</template>

<script setup lang="ts">
defineEmits<{ (e: 'update:modelValue', v: string): void }>()
withDefaults(defineProps<{
  label?: string
  hint?: string
  placeholder?: string
  modelValue?: string
}>(), { modelValue: '' })
</script>

<style scoped>
.ui-field{ display: grid; gap: 6px; }
.ui-field__label{
  font-size: 12px;
  font-weight: 700;
  opacity: 0.85;
}
.ui-field__input{
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(0,0,0,0.18);
  color: inherit;
  outline: none;
}
.ui-field__input:focus{
  border-color: color-mix(in srgb, var(--accent) 55%, rgba(255,255,255,0.14));
  box-shadow: 0 0 0 3px rgba(43,183,167,0.14);
}
.ui-field__hint{
  font-size: 12px;
  opacity: 0.70;
}
</style>
