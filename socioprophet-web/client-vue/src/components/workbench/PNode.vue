<!-- P-NODE — the canonical Axonius node (soft-fill circle + centered glyph +
     dark shoulder count-chip + label; radius scales √-count). Native port of
     SP.node; palette / fmt / rOf are byte-faithful to sp-primitives-carbon.js. -->
<template>
  <div class="pnode" :class="{ 'is-static': spec.x == null }" :style="posStyle">
    <div class="bub" :style="bubStyle">
      <span :style="glyphStyle">{{ spec.icon || '▦' }}</span>
      <span v-if="spec.count != null" class="cnt">{{ fmtCount(spec.count) }}</span>
    </div>
    <div class="lbl">{{ spec.label }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface NodeSpec {
  label: string;
  icon?: string;
  count?: string | number | null;
  type?: string;
  size?: number;
  tier?: 't1' | 't2' | 'inferred';
  x?: number;
  y?: number;
}

const props = defineProps<{ spec: NodeSpec }>();

// [fg, bg] token pairs — faithful to PAL in sp-primitives-carbon.js.
const PAL: Record<string, [string, string]> = {
  device: ['var(--device)', 'var(--device-bg)'],
  user: ['var(--user)', 'var(--user-bg)'],
  vuln: ['var(--vuln)', 'var(--vuln-bg)'],
  software: ['var(--software)', 'var(--software-bg)'],
  facility: ['var(--facility)', 'var(--facility-bg)'],
  net: ['var(--net)', 'var(--net-bg)'],
  group: ['var(--group)', 'var(--group-bg)'],
  blue: ['var(--user)', 'var(--user-bg)'],
  green: ['var(--sp-green)', 'var(--sp-green-10)'],
};

function fmtCount(n: string | number): string {
  if (n == null) return '';
  const str = `${n}`;
  if (str.includes('K')) return str;
  const v = parseInt(str.replace(/,/g, ''), 10);
  return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K` : `${v}`;
}

function rOf(c: string | number | null | undefined): number {
  const v = typeof c === 'string' ? (c.includes('K') ? parseFloat(c) * 1000 : parseInt(c, 10)) : c || 0;
  return Math.max(18, Math.min(52, 16 + Math.sqrt(v || 1)));
}

const pal = computed(() => PAL[props.spec.type || 'device'] || PAL.device);
const r = computed(() => props.spec.size || rOf(props.spec.count));
const posStyle = computed(() =>
  props.spec.x != null ? { left: `${props.spec.x}%`, top: `${props.spec.y}%` } : {},
);
const bubStyle = computed(() => ({
  width: `${r.value * 2}px`,
  height: `${r.value * 2}px`,
  background: pal.value[1],
  border: `${props.spec.tier === 'inferred' ? 3 : 2.5}px solid ${pal.value[0]}`,
}));
const glyphStyle = computed(() => ({
  fontSize: `${r.value * 0.72}px`,
  color: pal.value[0],
  fontWeight: 700,
}));
</script>
