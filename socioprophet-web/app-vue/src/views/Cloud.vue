<script setup lang="ts">
import { ref, computed } from "vue";
import { KINDS, VENDORS, compareServices, selectVendor, type Residency, type Vendor, type ServiceKind } from "../services/cloudBroker";

const residency = ref<Residency | "">("");
const excluded = ref<Vendor[]>([]);
function toggle(v: Vendor) { excluded.value = excluded.value.includes(v) ? excluded.value.filter((x) => x !== v) : [...excluded.value, v]; }

const rows = computed(() =>
  KINDS.map((kind: ServiceKind) => {
    const pick = selectVendor({ kind, residency: residency.value || undefined, exclude: excluded.value });
    return { kind, offerings: compareServices(kind), pick };
  }),
);
const fmt = (n: number) => (n === 0 ? "free" : `$${n}`);
</script>

<template>
  <div class="cloud">
    <header>
      <h1>☁ Cloud <span class="tag">cross-vendor broker</span></h1>
      <p class="lede">Cloud services are a commodity. We're the broker — pick the cheapest compliant vendor per service, on any cloud. No lock-in.</p>
      <div class="controls">
        <label>Data residency:
          <select v-model="residency">
            <option value="">any</option>
            <option v-for="r in ['EU','US','AU','UK','CA']" :key="r" :value="r">{{ r }}</option>
          </select>
        </label>
        <span class="excl">Exclude:
          <button v-for="v in VENDORS" :key="v" class="vbtn" :class="{ off: excluded.includes(v) }" @click="toggle(v)">{{ v }}</button>
        </span>
      </div>
    </header>

    <table class="grid">
      <thead><tr><th>Service</th><th v-for="v in VENDORS" :key="v">{{ v }}</th><th>Broker pick</th></tr></thead>
      <tbody>
        <tr v-for="row in rows" :key="row.kind">
          <td class="kind">{{ row.kind }}</td>
          <td v-for="v in VENDORS" :key="v" :class="{ best: row.pick && row.pick.provider === v }">
            <template v-if="row.offerings.find(o => o.provider === v)">
              <div class="prim">{{ row.offerings.find(o => o.provider === v)!.primitive }}</div>
              <div class="price">{{ fmt(row.offerings.find(o => o.provider === v)!.unitPriceUsd) }}</div>
            </template>
            <span v-else class="na">—</span>
          </td>
          <td class="pick">
            <template v-if="row.pick"><strong>{{ row.pick.provider }}</strong> · {{ row.pick.primitive }} · {{ fmt(row.pick.unitPriceUsd) }}</template>
            <span v-else class="na">no compliant vendor</span>
          </td>
        </tr>
      </tbody>
    </table>
    <p class="foot">Compute & GPU are brokered the same way (noetica <code>cloud-broker.ts</code> → cheapest satisfying SKU across GCP/AWS/Azure/IBM + the sovereign local mesh).</p>
  </div>
</template>

<style scoped>
.cloud { padding: 24px 32px; font: 14px/1.5 var(--ui); color: var(--ink); overflow: auto; height: 100%; }
h1 { font-size: 26px; margin: 0 0 4px; } .tag { font-size: 12px; background: var(--accent-wash); color: var(--accent); padding: 2px 8px; border-radius: 10px; vertical-align: middle; }
.lede { color: var(--muted); margin: 0 0 14px; max-width: 720px; }
.controls { display: flex; gap: 24px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
.controls select { padding: 4px 8px; border: 1px solid var(--hairline-strong); border-radius: 6px; }
.vbtn { border: 1px solid var(--hairline-strong); background: #fff; border-radius: 14px; padding: 2px 10px; margin: 0 3px; cursor: pointer; font-size: 12px; }
.vbtn.off { background: var(--fail-wash); color: var(--fail); text-decoration: line-through; }
.grid { width: 100%; border-collapse: collapse; }
.grid th, .grid td { border: 1px solid var(--hairline); padding: 8px 10px; text-align: left; vertical-align: top; }
.grid th { background: var(--sunken); font-weight: 500; text-transform: capitalize; }
.kind { font-weight: 600; text-transform: capitalize; }
.prim { font-size: 13px; } .price { font-size: 12px; color: var(--muted); }
.best { background: var(--ok-wash); outline: 2px solid var(--ok); }
.pick strong { color: var(--ok); text-transform: uppercase; }
.na { color: #bdc1c6; } .foot { color: var(--muted); margin-top: 16px; font-size: 13px; }
</style>
