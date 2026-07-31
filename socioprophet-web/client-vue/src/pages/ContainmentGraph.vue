<!-- Containment / Blast-Radius (GBRG) — pick a foothold, see its reachable set,
     choose a sever scope, and read the residual + contained delta. The residual is
     computed by the same semantics as gbrg-core::containment::sever_residual.
     Fixture-first (demoTopology) until a live /svc/containment endpoint is wired. -->
<template>
  <section class="containment-surface">
    <header class="ch">
      <div>
        <div class="eyebrow">SocioProphet Cockpit · Governed Estate</div>
        <h1>Containment · Blast-Radius</h1>
        <p class="sub">Endpoint <span class="mono">{{ source }}</span> · isolation severs edges; the residual is what stays reachable (verify the block, not the command).</p>
      </div>
    </header>

    <div class="grid">
      <div class="graph-wrap">
        <PGraphCanvas :hub="hub" :satellites="satellites" :height="380"
          hint="hub = compromised foothold · red = contained by sever · green = residual (allowed)" />
        <div class="legend">
          <span><i class="sw sig"></i> contained (severed)</span>
          <span><i class="sw flow"></i> residual / allowed</span>
          <span><i class="sw hv"></i> high-value ⚑</span>
        </div>
      </div>

      <aside class="controls">
        <div class="ctl">
          <div class="eyebrow">Sever scope — which edges to cut</div>
          <div class="seg">
            <button type="button" class="scope-btn" :class="{ on: scope === 'full' }" @click="scope = 'full'">
              Full<small>cut all but EDR/EPP</small>
            </button>
            <button type="button" class="scope-btn" :class="{ on: scope === 'selective' }" @click="scope = 'selective'">
              Selective<small>keep {{ keepLabels.join('/') }}</small>
            </button>
          </div>
        </div>

        <div class="readout">
          <div class="ro cut"><span class="n">{{ reading.contained.length }}</span><span class="k">contained</span></div>
          <div class="ro res"><span class="n">{{ reading.residual.length }}</span><span class="k">residual reachable</span></div>
        </div>

        <div class="toggle-row">
          <span>Require approval before sever</span>
          <button type="button" class="switch" role="switch" aria-label="Require approval before sever"
            :aria-checked="requireApproval" @click="requireApproval = !requireApproval"
            :class="{ on: requireApproval }"></button>
        </div>
        <div class="approve-note" v-if="requireApproval">Signed, time-boxed, revocable · link via
          <span class="via">Slack</span><span class="via">Teams</span><span class="via">SMS</span><span class="via">Email</span>
        </div>

        <button type="button" class="sever-btn">Sever network — {{ scope === 'full' ? 'Full' : 'Selective' }} isolation</button>

        <div class="verify" v-if="reading.contained.length > 0">
          <b>Effect verified — traffic blocked</b>
          <span class="mono">probe, not exit-code · re-checks at endpoint check-in</span>
        </div>
        <div class="verify noop" v-else>
          <b>⊘ Sever contained nothing</b>
          <span class="mono">not a clean containment — check scope (epistemicLevel=speculative)</span>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import PGraphCanvas, { type EdgeNodeSpec } from '../components/workbench/PGraphCanvas.vue';
import type { NodeSpec } from '../components/workbench/PNode.vue';
import {
  demoTopology, severResidual, DEMO_SOURCE, DEMO_ALLOW, SELECTIVE_KEEP, type SeverScope, type NetNode,
} from '../features/containment/types';

const route = useRoute();
// Reactive to ?node= so navigating to the same route with a different node updates the surface.
const source = computed<string>(() => normalizeSource((route.query.node as string) || DEMO_SOURCE));
const scope = ref<SeverScope>('full');
const requireApproval = ref(true);
const keepLabels = SELECTIVE_KEEP;

// A deep-linked node that isn't in the fixture falls back to the demo foothold.
function normalizeSource(raw: string): string {
  const id = raw.replace(/^endpoint:\/\//, '');
  return demoTopology.nodes.some((n) => n.id === id) ? id : DEMO_SOURCE;
}

const reading = computed(() =>
  severResidual(demoTopology, source.value, [source.value], scope.value, keepLabels, DEMO_ALLOW),
);

const ICON: Record<NetNode['kind'], string> = {
  foothold: '☣', workstation: '▦', server: '▤', 'domain-controller': '⚿', control: '🛡',
};
const TYPE: Record<NetNode['kind'], string> = {
  foothold: 'vuln', workstation: 'device', server: 'net', 'domain-controller': 'facility', control: 'green',
};
const POS: Record<string, { x: number; y: number }> = {
  'wks-2970': { x: 16, y: 18 }, 'dc-01': { x: 72, y: 14 }, 'file-srv': { x: 90, y: 46 },
  'wks-0d06': { x: 18, y: 82 }, 'edr-epp': { x: 50, y: 90 },
};

const hub = computed<NodeSpec>(() => {
  const n = demoTopology.nodes.find((x) => x.id === source.value)!;
  return { label: n.label, icon: ICON[n.kind], type: TYPE[n.kind], size: 30 };
});

const satellites = computed<EdgeNodeSpec[]>(() =>
  demoTopology.nodes
    .filter((n) => n.id !== source.value)
    .map((n) => {
      const contained = reading.value.contained.includes(n.id);
      const residual = reading.value.residual.includes(n.id);
      const pos = POS[n.id] ?? { x: 50, y: 50 };
      return {
        label: n.label + (n.highValue ? ' ⚑' : ''),
        icon: ICON[n.kind],
        type: TYPE[n.kind],
        size: n.highValue ? 24 : 18,
        x: pos.x,
        y: pos.y,
        kind: contained ? 'signal' : residual ? 'flow' : 'infra',
        verb: contained ? 'severed' : residual ? 'allowed' : '',
      } as EdgeNodeSpec;
    }),
);
</script>

<style scoped>
.containment-surface { padding: clamp(14px, 2vw, 26px); max-width: 1200px; margin: 0 auto; }
.eyebrow { font-family: var(--font-mono, monospace); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--cds-text-secondary, #6f6f6f); }
.ch h1 { font-size: 20px; margin: 3px 0; }
.ch .sub { font-size: 12.5px; color: var(--cds-text-secondary, #6f6f6f); margin: 0; }
.mono { font-family: var(--font-mono, monospace); }
.grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 18px; margin-top: 16px; align-items: start; }
.graph-wrap { border: 1px solid var(--cds-border-subtle, #e0e0e0); border-radius: 3px; padding: 6px; position: relative; }
.legend { display: flex; gap: 16px; flex-wrap: wrap; padding: 8px 10px; font-family: var(--font-mono, monospace); font-size: 10.5px; color: var(--cds-text-secondary, #6f6f6f); }
.legend .sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; vertical-align: middle; }
.legend .sig { background: var(--sp-red); } .legend .flow { background: var(--sp-green); } .legend .hv { background: var(--facility, #8a3ffc); }
.controls { display: flex; flex-direction: column; gap: 15px; }
.seg { display: inline-flex; border: 1px solid var(--cds-border-strong, #8d8d8d); border-radius: 3px; overflow: hidden; margin-top: 6px; }
.scope-btn { flex: 1; display: flex; flex-direction: column; gap: 1px; align-items: flex-start; background: var(--cds-field, #f4f4f4); border: none; border-right: 1px solid var(--cds-border-subtle, #e0e0e0); padding: 8px 12px; cursor: pointer; font-size: 12.5px; color: inherit; }
.scope-btn:last-child { border-right: none; }
.scope-btn small { font-family: var(--font-mono, monospace); font-size: 9.5px; color: var(--cds-text-secondary, #6f6f6f); }
.scope-btn.on { background: var(--cds-layer-selected, #e0e0e0); box-shadow: inset 3px 0 0 var(--cds-link-primary, #0f62fe); }
.readout { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.ro { border: 1px solid var(--cds-border-subtle, #e0e0e0); border-radius: 3px; padding: 10px 12px; display: flex; flex-direction: column; }
.ro .n { font-family: var(--font-mono, monospace); font-size: 22px; font-weight: 600; font-variant-numeric: tabular-nums; }
.ro.cut .n { color: var(--sp-red-70); } .ro.res .n { color: var(--sp-green-70); }
.ro .k { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: var(--cds-text-secondary, #6f6f6f); }
.toggle-row { display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; }
.switch { width: 40px; height: 22px; border-radius: 999px; border: none; background: var(--cds-toggle-off, #8d8d8d); position: relative; cursor: pointer; }
.switch.on { background: var(--sp-amber, #f1c21b); }
.switch::after { content: ''; position: absolute; width: 17px; height: 17px; border-radius: 50%; background: #fff; top: 2.5px; left: 3px; transition: left .12s; }
.switch.on::after { left: 20px; }
.approve-note { font-size: 11px; color: var(--cds-text-secondary, #6f6f6f); display: flex; gap: 5px; flex-wrap: wrap; align-items: center; }
.approve-note .via { font-family: var(--font-mono, monospace); border: 1px solid var(--cds-border-subtle, #e0e0e0); border-radius: 3px; padding: 1px 5px; }
.sever-btn { background: var(--sp-red, #da1e28); color: #fff; border: none; border-radius: 3px; padding: 11px; font-size: 13px; font-weight: 600; cursor: pointer; }
.sever-btn:hover { filter: brightness(1.06); }
.verify { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: 3px; background: var(--sp-green-10); border: 1px solid var(--sp-green); }
.verify b { font-size: 12.5px; color: var(--sp-green-70); } .verify span { font-size: 10.5px; color: var(--cds-text-secondary, #6f6f6f); }
.verify.noop { background: var(--sp-amber-10); border-color: var(--sp-amber); }
.verify.noop b { color: var(--sp-amber-70); }
@media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
</style>
