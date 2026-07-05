<!-- P-CANVAS — asset/relationship graph: a central hub node + satellite nodes,
     linked by typed SVG edges in a percent (0–100) coordinate space. Native port
     of the render-harness `domainCanvas()` pattern (SP.edge + SP.node + SP.toolbar).
     preserveAspectRatio="none" so edge endpoints track node % positions on resize. -->
<template>
  <div class="canvas" :style="{ height: `${height}px` }">
    <div class="hint">{{ hint }}</div>
    <svg class="edges" viewBox="0 0 100 100" preserveAspectRatio="none" style="overflow: visible">
      <template v-for="(s, i) in satellites" :key="`e${i}`">
        <path :d="edgePath(s)" fill="none" :stroke="edgeColor(s)" stroke-width="1.2" />
        <text
          v-if="s.verb"
          :x="(cx + (s.x ?? cx)) / 2"
          :y="(cy + (s.y ?? cy)) / 2 - 4"
          text-anchor="middle"
          class="elabel"
        >{{ s.verb }}</text>
      </template>
    </svg>

    <PNode :spec="{ ...hub, x: cx, y: cy }" />
    <PNode v-for="(s, i) in satellites" :key="`n${i}`" :spec="s" />

    <!-- P-TOOLBAR — floating graph controls (pan / layout / fit / zoom) -->
    <div class="gtoolbar">
      <button type="button" aria-label="Pan">✥</button>
      <button type="button" aria-label="Layout">❋</button>
      <button type="button" aria-label="Fit">⊡</button>
      <button type="button" aria-label="Zoom in">＋</button>
      <button type="button" aria-label="Zoom out">－</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import PNode, { type NodeSpec } from './PNode.vue';

export interface EdgeNodeSpec extends NodeSpec {
  verb?: string;
  kind?: 'infra' | 'signal' | 'flow';
  curve?: boolean;
}

const props = withDefaults(
  defineProps<{
    hub: NodeSpec;
    satellites: EdgeNodeSpec[];
    height?: number;
    hint?: string;
    cx?: number;
    cy?: number;
  }>(),
  { height: 520, hint: '', cx: 42, cy: 48 },
);

// Faithful to SP.edge: curved bezier through the horizontal midpoint; color by kind.
function edgePath(s: EdgeNodeSpec): string {
  const x1 = props.cx;
  const y1 = props.cy;
  const x2 = s.x ?? props.cx;
  const y2 = s.y ?? props.cy;
  const mx = (x1 + x2) / 2;
  return s.curve
    ? `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`
    : `M${x1},${y1} L${x2},${y2}`;
}

function edgeColor(s: EdgeNodeSpec): string {
  if (s.kind === 'signal') return 'var(--sp-red)';
  if (s.kind === 'flow') return 'var(--sp-green)';
  return '#a8a8a8';
}
</script>
