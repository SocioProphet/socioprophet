<script setup lang="ts">
import { ref } from "vue";
import { APPS } from "../config/apps";
const open = ref(false);
</script>

<template>
  <div class="launcher">
    <button class="waffle" aria-label="Workspace apps" @click="open = !open"><i class="ti ti-grid-dots"></i></button>
    <div v-if="open" class="backdrop" @click="open = false"></div>
    <div v-if="open" class="grid" role="menu">
      <router-link v-for="a in APPS" :key="a.id" :to="a.route" class="tile" :title="a.backend" @click="open = false">
        <i class="ti" :class="'ti-' + a.icon" :style="{ color: a.color }"></i>
        <span>{{ a.name }}</span>
        <em v-if="a.status !== 'live'" class="st">{{ a.status }}</em>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.launcher { position: relative; display: inline-flex; }
.waffle { background: none; border: 0; cursor: pointer; color: #1a73e8; font-size: 21px; line-height: 1; padding: 4px; }
.backdrop { position: fixed; inset: 0; z-index: 40; }
.grid { position: absolute; top: 36px; right: 0; z-index: 50; width: 312px; background: #fff; border: 0.5px solid #e0e0e0;
  border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.18); padding: 14px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.tile { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 12px 4px; border-radius: 8px;
  text-decoration: none; color: #3c4043; font-size: 12px; position: relative; }
.tile:hover { background: #f5f5f5; }
.tile .ti { font-size: 26px; }
.st { position: absolute; top: 4px; right: 6px; font-size: 9px; color: #b0b0b0; font-style: normal; }
</style>
