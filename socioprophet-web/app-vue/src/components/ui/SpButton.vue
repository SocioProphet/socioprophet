<template>
  <button
    class="ui-btn"
    :class="[variant, size]"
    :disabled="disabled"
    :type="type"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()

withDefaults(defineProps<{
  variant?: 'primary' | 'ghost' | 'danger' | ''
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), {
  variant: '',
  size: 'md',
  disabled: false,
  type: 'button',
})
</script>
