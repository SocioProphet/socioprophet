<script setup lang="ts">
// Market 2 — professional & market intelligence. Data lives in the feature module;
// the surface is the shared MarketTeardown component.
import MarketTeardown from '../components/MarketTeardown.vue';
import { professionalIntelligenceMarket } from '../features/competitive-intelligence/marketProfessionalIntelligence';
</script>

<template>
  <MarketTeardown :data="professionalIntelligenceMarket" />
</template>
