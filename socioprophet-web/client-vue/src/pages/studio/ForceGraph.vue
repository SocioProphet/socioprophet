<script setup lang="ts">
/** Dependency-free force-directed graph on <canvas> — Fruchterman-Reingold-ish, with drag + click-to-select. */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps<{ nodes: { id: string; label?: string; group?: string }[]; edges: { source: string; target: string }[] }>()
const emit = defineEmits<{ (e: 'select', id: string): void }>()

const canvas = ref<HTMLCanvasElement | null>(null)
let raf = 0
type P = { id: string; label: string; group?: string; x: number; y: number; vx: number; vy: number }
let pts: P[] = []
let idx = new Map<string, P>()
let links: { a: P; b: P }[] = []
let dragging: P | null = null
let hover: P | null = null
const PALETTE = ['#4f8cff', '#6ad2b0', '#f0b849', '#c98bff', '#ff8fa3', '#66d9e8', '#9ae66e']
const groupColor = new Map<string, string>()
function colorFor(g?: string): string {
  const key = g ?? '·'
  if (!groupColor.has(key)) groupColor.set(key, PALETTE[groupColor.size % PALETTE.length])
  return groupColor.get(key)!
}

function build() {
  const c = canvas.value!; const w = c.width, h = c.height
  pts = props.nodes.slice(0, 600).map((n, i) => ({
    id: n.id, label: n.label ?? n.id.split(/[:/#]/).pop() ?? n.id, group: n.group,
    x: w / 2 + Math.cos(i) * (80 + i % 120), y: h / 2 + Math.sin(i) * (80 + i % 120), vx: 0, vy: 0,
  }))
  idx = new Map(pts.map((p) => [p.id, p]))
  links = props.edges.map((e) => ({ a: idx.get(e.source)!, b: idx.get(e.target)! })).filter((l) => l.a && l.b)
}

function step() {
  const c = canvas.value; if (!c) return
  const w = c.width, h = c.height, ctx = c.getContext('2d')!
  const k = 42 // ideal edge length scale
  // repulsion
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const a = pts[i], b = pts[j]; let dx = a.x - b.x, dy = a.y - b.y; let d2 = dx * dx + dy * dy || 0.01
    const f = (k * k) / d2; const d = Math.sqrt(d2)
    const fx = (dx / d) * f, fy = (dy / d) * f
    a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy
  }
  // attraction along edges
  for (const l of links) {
    let dx = l.a.x - l.b.x, dy = l.a.y - l.b.y; const d = Math.sqrt(dx * dx + dy * dy) || 0.01
    const f = (d * d) / k / 8; const fx = (dx / d) * f, fy = (dy / d) * f
    l.a.vx -= fx; l.a.vy -= fy; l.b.vx += fx; l.b.vy += fy
  }
  // integrate + gravity to center + damping
  for (const p of pts) {
    if (p === dragging) { p.vx = p.vy = 0; continue }
    p.vx += (w / 2 - p.x) * 0.002; p.vy += (h / 2 - p.y) * 0.002
    p.vx *= 0.86; p.vy *= 0.86
    p.x += Math.max(-8, Math.min(8, p.vx)); p.y += Math.max(-8, Math.min(8, p.vy))
    p.x = Math.max(14, Math.min(w - 14, p.x)); p.y = Math.max(14, Math.min(h - 14, p.y))
  }
  // draw
  ctx.clearRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(120,140,170,0.22)'; ctx.lineWidth = 1
  for (const l of links) { ctx.beginPath(); ctx.moveTo(l.a.x, l.a.y); ctx.lineTo(l.b.x, l.b.y); ctx.stroke() }
  for (const p of pts) {
    const r = p === hover ? 7 : 5
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fillStyle = colorFor(p.group); ctx.fill()
    if (p === hover || pts.length < 60) {
      ctx.fillStyle = '#c7d2e0'; ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(p.label.slice(0, 22), p.x + 8, p.y + 3)
    }
  }
  raf = requestAnimationFrame(step)
}

function at(ev: MouseEvent): P | null {
  const c = canvas.value!; const rect = c.getBoundingClientRect()
  const x = (ev.clientX - rect.left) * (c.width / rect.width), y = (ev.clientY - rect.top) * (c.height / rect.height)
  let best: P | null = null, bd = 144
  for (const p of pts) { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = p } }
  return best
}
function down(e: MouseEvent) { dragging = at(e); if (dragging) emit('select', dragging.id) }
function move(e: MouseEvent) {
  hover = at(e)
  if (dragging) { const c = canvas.value!, rect = c.getBoundingClientRect()
    dragging.x = (e.clientX - rect.left) * (c.width / rect.width); dragging.y = (e.clientY - rect.top) * (c.height / rect.height) }
}
function up() { dragging = null }

function resize() { const c = canvas.value; if (!c) return; const r = c.parentElement!.getBoundingClientRect(); c.width = r.width; c.height = r.height }
onMounted(() => { resize(); build(); step(); window.addEventListener('resize', resize) })
onBeforeUnmount(() => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) })
watch(() => [props.nodes, props.edges], () => { resize(); build() }, { deep: true })
</script>

<template>
  <div style="position:relative; width:100%; height:100%; min-height:420px;">
    <canvas ref="canvas" style="width:100%; height:100%; display:block; cursor:grab;"
      @mousedown="down" @mousemove="move" @mouseup="up" @mouseleave="up" />
  </div>
</template>
