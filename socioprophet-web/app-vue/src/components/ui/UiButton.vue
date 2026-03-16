<template>
  <button
    class="ui-btn"
    :class="[`ui-btn--${variant}`, `ui-btn--${size}`]"
    :type="type"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
}>(), {
  variant: 'ghost',
  size: 'md',
  type: 'button',
})
</script>

<style scoped>
.ui-btn{
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.16);
  cursor: pointer;
  color: inherit;
  background: rgba(255,255,255,0.06);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
  transition: transform 80ms ease, background 120ms ease, border-color 120ms ease;
  font-weight: 600;
}
.ui-btn:hover{
  background: rgba(255,255,255,0.09);
  border-color: rgba(255,255,255,0.22);
}
.ui-btn:active{ transform: translateY(1px); }

.ui-btn--primary{
  background: color-mix(in srgb, var(--accent) 24%, rgba(255,255,255,0.06));
  border-color: color-mix(in srgb, var(--accent) 38%, rgba(255,255,255,0.16));
}
.ui-btn--primary:hover{
  background: color-mix(in srgb, var(--accent) 30%, rgba(255,255,255,0.08));
  border-color: color-mix(in srgb, var(--accent) 48%, rgba(255,255,255,0.18));
}

.ui-btn--danger{
  background: rgba(255, 80, 80, 0.14);
  border-color: rgba(255, 80, 80, 0.30);
}
.ui-btn--danger:hover{
  background: rgba(255, 80, 80, 0.18);
  border-color: rgba(255, 80, 80, 0.38);
}

.ui-btn--sm{ padding: 7px 10px; font-size: 12px; }
.ui-btn--md{ padding: 9px 12px; font-size: 13px; }
.ui-btn--lg{ padding: 11px 14px; font-size: 14px; }
</style>
