<script setup lang="ts">
// Market 3 — browser & agentic web surface. Data lives in the feature module;
// the surface is the shared MarketTeardown component (same as market 2).
import MarketTeardown from '../components/MarketTeardown.vue';
import { browserIntelligenceMarket } from '../features/competitive-intelligence/marketBrowser';
</script>

<template>
  <MarketTeardown :data="browserIntelligenceMarket" />
</template>
