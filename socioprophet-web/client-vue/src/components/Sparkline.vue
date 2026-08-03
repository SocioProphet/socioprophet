<script setup lang="ts">
// Tufte sparkline — a "dataword": word-sized, high data-ink, no chartjunk.
//
// Deliberately absent: axes, gridlines, tick labels, legend, background fill,
// border, title. Tufte's rule is erase non-data-ink, then erase redundant
// data-ink. What survives is the line, the extrema, the endpoint, and a band
// showing the normal range — every mark carries data.
//
// Direct labelling only: the min, max and last values sit next to their own
// marks, so there is nothing to look up.
const props = withDefaults(defineProps<{
  values: number[];
  /** Word-size by default — a sparkline belongs in a line of text. */
  width?: number;
  height?: number;
  /** Shade the interquartile range, so a point reads as normal or not. */
  band?: boolean;
  /** Show min/max/last figures beside the line. */
  labels?: boolean;
  color?: string;
}>(), { width: 180, height: 28, band: true, labels: true, color: 'var(--text-2)' });

const pad = 3;

function scaleX(i: number, n: number): number {
  if (n <= 1) return pad;
  return pad + (i / (n - 1)) * (props.width - pad * 2);
}
function scaleY(v: number, lo: number, hi: number): number {
  if (hi === lo) return props.height / 2;
  return props.height - pad - ((v - lo) / (hi - lo)) * (props.height - pad * 2);
}

const stats = () => {
  const v = props.values.filter((n) => Number.isFinite(n));
  if (!v.length) return null;
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const sorted = [...v].sort((a, b) => a - b);
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  return {
    v, lo, hi, q1: q(0.25), q3: q(0.75),
    iMin: v.indexOf(lo), iMax: v.indexOf(hi), last: v[v.length - 1],
  };
};

const s = stats();
const path = s
  ? s.v.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i, s.v.length).toFixed(1)},${scaleY(v, s.lo, s.hi).toFixed(1)}`).join(' ')
  : '';
</script>

<template>
  <span v-if="s" class="spark">
    <svg
      :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="`sparkline: ${s.v.length} points, low ${s.lo}, high ${s.hi}, latest ${s.last}`"
      preserveAspectRatio="none"
    >
      <!-- interquartile band: the only fill, and it carries data -->
      <rect
        v-if="band"
        x="0" :y="scaleY(s.q3, s.lo, s.hi)"
        :width="width"
        :height="Math.max(1, scaleY(s.q1, s.lo, s.hi) - scaleY(s.q3, s.lo, s.hi))"
        class="spark-band"
      />
      <path :d="path" class="spark-line" :style="{ stroke: color }" />
      <!-- extrema and endpoint, marked not labelled-with-a-legend -->
      <circle :cx="scaleX(s.iMax, s.v.length)" :cy="scaleY(s.hi, s.lo, s.hi)" r="1.6" class="spark-max" />
      <circle :cx="scaleX(s.iMin, s.v.length)" :cy="scaleY(s.lo, s.lo, s.hi)" r="1.6" class="spark-min" />
      <circle :cx="scaleX(s.v.length - 1, s.v.length)" :cy="scaleY(s.last, s.lo, s.hi)" r="2" class="spark-last" />
    </svg>
    <span v-if="labels" class="spark-nums">
      <span class="n-min">{{ s.lo }}</span><span class="sep">–</span><span class="n-max">{{ s.hi }}</span>
      <b class="n-last">{{ s.last }}</b>
    </span>
  </span>
  <span v-else class="spark-empty">no data</span>
</template>

<style scoped>
.spark { display: inline-flex; align-items: center; gap: 0.4rem; }
.spark svg { display: block; overflow: visible; }
.spark-band { fill: currentColor; opacity: 0.07; }
.spark-line { fill: none; stroke-width: 1; vector-effect: non-scaling-stroke; }
.spark-max { fill: var(--up); }
.spark-min { fill: var(--down); }
.spark-last { fill: var(--accent); }
.spark-nums {
  font-family: var(--mono, ui-monospace), monospace;
  font-size: 0.56rem; font-variant-numeric: tabular-nums; color: var(--text-3);
  display: inline-flex; align-items: baseline; gap: 0.12rem;
}
.n-min { color: var(--down); }
.n-max { color: var(--up); }
.sep { opacity: 0.5; }
.n-last { color: var(--accent); margin-left: 0.3rem; }
.spark-empty { font-size: 0.56rem; color: var(--text-3); }
</style>
