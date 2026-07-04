<template>
  <section class="term-page" aria-label="Workstation Terminal">
    <header class="tp-head">
      <div>
        <h1>Terminal</h1>
        <p>Allow-listed operator CLIs (prophet · sourceosctl) on-device — injection-safe, no shell. Also available shell-wide as a drop-down (Ctrl+`).</p>
      </div>
    </header>
    <div class="tp-frame">
      <QuakeTerminal variant="docked" />
    </div>
  </section>
</template>

<script setup lang="ts">
import QuakeTerminal from '../components/QuakeTerminal.vue';
</script>

<style scoped>
.term-page { display: grid; grid-template-rows: auto 1fr; gap: 1rem; height: 100%; min-height: 0; padding: 1.25rem 1.5rem; }
.tp-head h1 { margin: 0; font-size: 1.25rem; color: var(--sp-canvas-text, #161616); }
.tp-head p { margin: 0.25rem 0 0; color: #525252; font-size: 0.85rem; max-width: 60ch; }
.tp-frame { min-height: 0; border-radius: 12px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25); overflow: hidden; }
</style>
