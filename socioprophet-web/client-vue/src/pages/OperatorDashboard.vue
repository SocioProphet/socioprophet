<template>
  <section class="db" aria-label="User dashboard">
    <header class="db-head">
      <div>
        <p class="db-eyebrow">SocioProphet</p>
        <h1>User Dashboard</h1>
      </div>
      <span class="db-asof">as of {{ asOfLabel }}</span>
    </header>

    <!-- Universal bar: jump to any surface OR ask Noetica — anything in one action -->
    <div class="db-ask-wrap">
      <form class="db-ask" @submit.prevent="ask">
        <span class="db-ask-glyph">◇</span>
        <input v-model="prompt" type="text" placeholder="Ask Noetica or jump to any surface…  (type to search · ⏎ to ask)" spellcheck="false" aria-label="Ask Noetica or jump to any surface" @focus="askFocused = true" @blur="onAskBlur" />
        <button type="submit" class="db-ask-go" :disabled="!prompt.trim()">Ask</button>
      </form>
      <div v-if="askFocused && prompt.trim()" class="db-ask-menu">
        <button v-for="m in askMatches" :key="m.to" class="db-ask-item" @mousedown.prevent="jump(m.to)">
          <span class="db-ask-lbl">→ {{ m.label }}</span><span class="db-ask-grp">{{ m.group }}</span>
        </button>
        <button class="db-ask-item ask" @mousedown.prevent="ask"><span class="db-ask-lbl">◇ Ask Noetica: “{{ prompt.trim() }}”</span></button>
      </div>
    </div>

    <div class="db-grid">
      <!-- Markets -->
      <article v-if="db.visible('markets')" class="db-card">
        <button class="db-remove" title="Hide card" @click="db.hide('markets')">✕</button>
        <RouterLink class="db-card-head" to="/markets/indices-funds"><span>Markets</span><span class="db-open">open →</span></RouterLink>
        <button v-for="i in indices" :key="i.symbol" class="db-row" @click="go('/markets/indices-funds', { sym: i.symbol })">
          <span class="db-row-k">{{ i.symbol }}</span>
          <span class="db-row-sub">{{ i.name }}</span>
          <span class="db-num">{{ fmtPrice(i.price) }}</span>
          <span class="db-chg" :class="pctClass(i.changePct)">{{ fmtPct(i.changePct) }}</span>
        </button>
        <div v-for="s in lists.watchlist" :key="'w-' + s" class="db-row">
          <span class="db-row-k">{{ s }}</span>
          <span class="db-row-sub">watching</span>
          <button class="db-x" title="Remove" @click.stop="lists.removeSymbol(s)">✕</button>
        </div>
        <form class="db-add" @submit.prevent="addSym">
          <input v-model="newSym" placeholder="Add ticker to watchlist (e.g. AAPL)" aria-label="Add ticker" />
          <button type="submit" :disabled="!newSym.trim()">＋ Add</button>
        </form>
      </article>

      <!-- Companies & Valuations -->
      <article v-if="db.visible('companies')" class="db-card">
        <button class="db-remove" title="Hide card" @click="db.hide('companies')">✕</button>
        <RouterLink class="db-card-head" to="/economy/causal-valuation"><span>Companies &amp; Valuations</span><span class="db-open">open →</span></RouterLink>
        <button class="db-row" @click="go('/economy/causal-valuation', {})">
          <span class="db-row-k narrow">Guzman y Gomez</span>
          <span class="db-row-sub">ASX:GYG · causal valuation</span>
          <span class="db-num">A$2.14B</span>
          <span class="db-chg up">+2.7%</span>
        </button>
        <button class="db-row" @click="go('/economy/causal-valuation', {})">
          <span class="db-row-k narrow" style="color:var(--accent)">＋ New valuation</span>
          <span class="db-row-sub">any listed company or private (Value Driver Studio)</span>
        </button>
      </article>

      <!-- News -->
      <article v-if="db.visible('news')" class="db-card">
        <button class="db-remove" title="Hide card" @click="db.hide('news')">✕</button>
        <RouterLink class="db-card-head" to="/news"><span>News &amp; Events</span><span class="db-open">open →</span></RouterLink>
        <button v-for="n in newsItems" :key="n.id" class="db-row col" @click="go('/news', { item: n.id })">
          <span class="db-row-title">{{ n.title }}</span>
          <span class="db-row-meta"><span :class="['db-mem', n.membraneDecision]">{{ n.membraneDecision }}</span>{{ srcTitle.get(n.sourceId) }} · {{ rel(n.publishedAt) }}</span>
        </button>
      </article>

      <!-- Economy -->
      <article v-if="db.visible('economy')" class="db-card">
        <button class="db-remove" title="Hide card" @click="db.hide('economy')">✕</button>
        <RouterLink class="db-card-head" to="/economy/macro-economics"><span>Economy</span><span class="db-open">open →</span></RouterLink>
        <button v-for="k in indicators" :key="k.id" class="db-row" @click="go('/economy/macro-economics', { k: k.id, kind: 'indicator' })">
          <span class="db-row-sub wide">{{ k.name }}</span>
          <span class="db-num">{{ fmtVal(k.value, k.unit) }}</span>
          <span class="db-chg" :class="econClass(k.changeAbs, k.better)">{{ signed(k.changeAbs) }}{{ k.unit === '%' ? 'pp' : '' }}</span>
        </button>
      </article>

      <!-- People -->
      <article v-if="db.visible('people')" class="db-card">
        <button class="db-remove" title="Hide card" @click="db.hide('people')">✕</button>
        <RouterLink class="db-card-head" to="/people/search"><span>People</span><span class="db-open">open →</span></RouterLink>
        <button v-for="e in entities" :key="e.id" class="db-row" @click="go('/people/search', { id: e.id })">
          <span class="db-avatar">{{ initials(e.name) }}</span>
          <span class="db-row-k narrow">{{ e.name }}</span>
          <span class="db-row-sub">{{ e.role }}</span>
          <span class="db-num sm">{{ (e.confidence * 100).toFixed(0) }}%</span>
        </button>
      </article>

      <!-- Law -->
      <article v-if="db.visible('law')" class="db-card">
        <button class="db-remove" title="Hide card" @click="db.hide('law')">✕</button>
        <RouterLink class="db-card-head" to="/law/international-law"><span>Law &amp; Regulation</span><span class="db-open">open →</span></RouterLink>
        <button v-for="d in dockets" :key="d.id" class="db-row col" @click="go('/law/international-law', { d: d.id })">
          <span class="db-row-title">{{ d.title }}</span>
          <span class="db-row-meta"><span :class="['db-status', d.status]">{{ d.status }}</span>{{ d.cite }} · {{ d.jurisdiction }}</span>
        </button>
      </article>

      <!-- Weather -->
      <article v-if="db.visible('weather')" class="db-card">
        <button class="db-remove" title="Hide card" @click="db.hide('weather')">✕</button>
        <RouterLink class="db-card-head" to="/weather/forecast"><span>Weather</span><span class="db-open">open →</span></RouterLink>
        <button v-for="r in regions" :key="r.id" class="db-row" @click="go('/weather/forecast', { r: r.id })">
          <span class="db-row-k narrow">{{ r.name }}</span>
          <span class="db-row-sub">{{ r.cond }}</span>
          <span class="db-num">{{ r.tempF }}°</span>
          <span class="db-chg" :class="r.changeF >= 0 ? 'up' : 'down'">{{ signed(r.changeF) }}°</span>
        </button>
        <div v-for="c in lists.cities" :key="'c-' + c" class="db-row">
          <span class="db-row-k narrow">{{ c }}</span>
          <span class="db-row-sub">added</span>
          <button class="db-x" title="Remove" @click.stop="lists.removeCity(c)">✕</button>
        </div>
        <form class="db-add" @submit.prevent="addCity">
          <input v-model="newCity" placeholder="Add a city (e.g. Sydney)" aria-label="Add city" />
          <button type="submit" :disabled="!newCity.trim()">＋ Add</button>
        </form>
      </article>

      <!-- Social signals -->
      <article v-if="db.visible('social')" class="db-card">
        <button class="db-remove" title="Hide card" @click="db.hide('social')">✕</button>
        <RouterLink class="db-card-head" to="/people/social-networks"><span>Social Signals</span><span class="db-open">open →</span></RouterLink>
        <button v-for="t in trends" :key="t.topic" class="db-row" @click="go('/people/social-networks', {})">
          <span class="db-row-k wide">{{ t.topic }}</span>
          <span class="db-num sm">{{ fmtNum(t.volume) }}</span>
          <span class="db-chg" :class="t.changePct >= 0 ? 'up' : 'down'">{{ signed(t.changePct) }}%</span>
        </button>
      </article>

      <!-- Alerts (weather/resource) — the one board that surfaces things needing attention -->
      <article v-if="db.visible('alerts')" class="db-card">
        <button class="db-remove" title="Hide card" @click="db.hide('alerts')">✕</button>
        <RouterLink class="db-card-head" to="/weather/forecast"><span>Active Alerts</span><span class="db-open">open →</span></RouterLink>
        <button v-for="a in alerts" :key="a.id" class="db-row col" @click="go('/weather/forecast', { r: a.regionId })">
          <span class="db-row-title">{{ a.headline }}</span>
          <span class="db-row-meta"><span :class="['db-sev', a.severity]">{{ a.severity }}</span>{{ regionName.get(a.regionId) }}<span v-if="a.resource"> · {{ a.resource }}</span></span>
        </button>
        <p v-if="alerts.length === 0" class="db-empty">No active alerts.</p>
      </article>
    </div>

    <div v-if="db.hiddenCards().length" class="db-addbar">
      <span class="db-addbar-label">Add a card:</span>
      <button v-for="c in db.hiddenCards()" :key="c.id" class="db-addbar-chip" @click="db.show(c.id)">＋ {{ c.label }}</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, type LocationQueryRaw } from 'vue-router';
import { ALL_SURFACES } from '../config/cockpitNav';
import { useDashboard } from '../stores/dashboard';
import { indices } from '../data/marketsFixture';
import { indicators } from '../data/economyFixture';
import { regions, alerts } from '../data/weatherFixture';
import { dockets } from '../data/lawFixture';
import { trends } from '../data/socialFixture';
import { entities } from '../data/peopleFixture';
import { newsItems, newsSources } from '../data/newsFeedFixture';
import { useNoeticaChat } from '../composables/useNoeticaChat';
import { useUserLists } from '../stores/userLists';

const router = useRouter();
const chat = useNoeticaChat();
const prompt = ref('');
const lists = useUserLists();
const db = useDashboard();
const newSym = ref('');
const newCity = ref('');
function addSym() { lists.addSymbol(newSym.value); newSym.value = ''; }
function addCity() { lists.addCity(newCity.value); newCity.value = ''; }

// Universal Ask bar: type to jump to any surface, or ask Noetica.
const askFocused = ref(false);
const askMatches = computed(() => {
  const q = prompt.value.trim().toLowerCase();
  if (!q) return [] as { label: string; to: string; group: string }[];
  return ALL_SURFACES.filter((s) => s.label.toLowerCase().includes(q) || s.group.toLowerCase().includes(q)).slice(0, 6);
});
function jump(to: string) { prompt.value = ''; askFocused.value = false; router.push(to); }
function onAskBlur() { setTimeout(() => { askFocused.value = false; }, 120); }

const srcTitle = new Map(newsSources.map((s) => [s.id, s.title]));
const regionName = new Map(regions.map((r) => [r.id, r.name]));

function go(path: string, query: LocationQueryRaw) { router.push({ path, query }); }
async function ask() {
  const text = prompt.value.trim();
  if (!text) return;
  prompt.value = '';
  await router.push('/noetica');
  chat.send(text);
}

const NOW = new Date('2026-07-04T00:40:00-04:00').getTime();
function rel(iso: string): string {
  const m = Math.max(0, Math.round((NOW - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
}
function initials(name: string): string { return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join(''); }
function fmtPrice(n: number): string { return n >= 1000 ? n.toLocaleString('en-US') : n.toFixed(2); }
function fmtVal(n: number, unit: string): string { return `${n.toLocaleString('en-US')}${unit && unit !== '%' ? '' : unit}`; }
function fmtPct(p: number): string { return `${p >= 0 ? '+' : ''}${(p * 100).toFixed(2)}%`; }
function signed(n: number): string { return `${n >= 0 ? '+' : ''}${n}`; }
function fmtNum(n: number): string { return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n); }
function pctClass(p: number): string { return p > 0 ? 'up' : p < 0 ? 'down' : 'flat'; }
function econClass(chg: number, better: 'higher' | 'lower'): string {
  if (chg === 0) return 'flat';
  const good = chg > 0 === (better === 'higher');
  return good ? 'up' : 'down';
}
const asOfLabel = new Date(NOW).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
</script>

<style scoped>
.db { height: 100%; min-height: 0; overflow-y: auto; padding: 1rem 1.1rem 1.5rem; background: var(--bg); color: var(--text); }
.db-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 0.9rem; }
.db-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-3); }
.db-head h1 { margin: 0; font-size: 1.5rem; letter-spacing: -0.02em; color: var(--text); font-weight: 660; }
.db-asof { font-size: 0.72rem; color: var(--text-3); font-family: ui-monospace, monospace; }

.db-ask { display: flex; align-items: center; gap: 0.6rem; border: 1px solid var(--line-2); border-radius: 12px; background: var(--surface); padding: 0.55rem 0.9rem; margin-bottom: 1.1rem; }
.db-ask-glyph { color: var(--accent); font-size: 1.1rem; }
.db-ask input { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font: inherit; font-size: 0.95rem; }
.db-ask input::placeholder { color: var(--text-3); }
.db-ask-go { border: none; background: var(--accent); color: #17130a; border-radius: 8px; padding: 0.4rem 0.95rem; font-size: 0.82rem; font-weight: 700; cursor: pointer; } .db-ask-go:disabled { opacity: 0.5; cursor: default; }
.db-ask-wrap { position: relative; margin-bottom: 1.1rem; }
.db-ask-wrap .db-ask { margin-bottom: 0; }
.db-ask-menu { position: absolute; z-index: 20; left: 0; right: 0; top: calc(100% + 6px); background: var(--surface); border: 1px solid var(--line-2); border-radius: 10px; box-shadow: 0 12px 32px rgba(0,0,0,0.4); overflow: hidden; }
.db-ask-item { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; width: 100%; border: none; background: transparent; color: var(--text); padding: 0.55rem 0.9rem; cursor: pointer; text-align: left; font: inherit; font-size: 0.86rem; }
.db-ask-item:hover { background: var(--surface-2); }
.db-ask-item.ask { border-top: 1px solid var(--line); color: var(--accent); }
.db-ask-grp { font-size: 0.72rem; color: var(--text-3); white-space: nowrap; }
.db-card { position: relative; }
.db-remove { position: absolute; top: 0.5rem; right: 0.55rem; z-index: 2; border: none; background: transparent; color: var(--text-3); cursor: pointer; font-size: 0.72rem; opacity: 0; transition: opacity 0.12s; }
.db-card:hover .db-remove { opacity: 1; }
.db-remove:hover { color: var(--down); }
.db-addbar { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; padding-top: 0.85rem; border-top: 1px solid var(--line); }
.db-addbar-label { font-size: 0.78rem; color: var(--text-3); }
.db-addbar-chip { border: 1px solid var(--line-2); background: var(--surface); color: var(--text-2); border-radius: 999px; padding: 0.25rem 0.7rem; font-size: 0.78rem; cursor: pointer; }
.db-addbar-chip:hover { color: var(--accent); border-color: var(--accent); }

.db-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 0.85rem; }
.db-card { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); display: flex; flex-direction: column; max-height: 340px; overflow-y: auto; }
.db-card-head { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.85rem; border-bottom: 1px solid var(--line); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-2); text-decoration: none; font-weight: 700; background: var(--surface); }
.db-card-head:hover { color: var(--accent); background: var(--surface-2); }
.db-open { font-size: 0.64rem; color: var(--text-3); font-weight: 600; letter-spacing: 0; text-transform: none; }
.db-card-head:hover .db-open { color: var(--accent); }

.db-row { display: flex; align-items: center; gap: 0.55rem; width: 100%; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.5rem 0.85rem; cursor: pointer; text-align: left; font: inherit; }
.db-row:last-child { border-bottom: none; }
.db-row:hover { background: var(--surface-2); }
.db-row.col { flex-direction: column; align-items: stretch; gap: 0.2rem; }
.db-row-k { font-size: 0.82rem; font-weight: 650; color: var(--text); font-family: ui-monospace, monospace; }
.db-row-k.narrow { font-family: inherit; font-weight: 600; white-space: nowrap; }
.db-row-k.wide { flex: 1; font-family: inherit; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.db-row-sub { flex: 1; min-width: 0; font-size: 0.76rem; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.db-row-sub.wide { flex: 1; }
.db-row-title { font-size: 0.84rem; font-weight: 550; color: var(--text); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.db-row-meta { display: flex; align-items: center; gap: 0.4rem; font-size: 0.68rem; color: var(--text-3); }
.db-num { font-size: 0.82rem; font-variant-numeric: tabular-nums; color: var(--text); text-align: right; } .db-num.sm { font-size: 0.74rem; color: var(--text-2); }
.db-chg { font-size: 0.74rem; font-variant-numeric: tabular-nums; font-weight: 600; text-align: right; min-width: 3.5rem; }
.db-chg.up { color: var(--up); } .db-chg.down { color: var(--down); } .db-chg.flat { color: #8b949e; }
.db-avatar { flex: 0 0 auto; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: 0.58rem; font-weight: 800; color: #04121f; background: #58a6ff; }

.db-mem, .db-status, .db-sev { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.03em; font-weight: 700; border-radius: 4px; padding: 0.03rem 0.3rem; }
.db-mem.admit { color: var(--up); background: rgba(75, 191, 115, 0.15); } .db-mem.hold { color: var(--accent); background: rgba(216, 162, 80, 0.16); } .db-mem.quarantine, .db-mem.reject { color: var(--down); background: rgba(240, 101, 106, 0.16); }
.db-status.comment { color: #58a6ff; background: rgba(88, 166, 255, 0.14); } .db-status.pending { color: var(--accent); background: rgba(216, 162, 80, 0.16); } .db-status.enacted { color: var(--up); background: rgba(75, 191, 115, 0.16); } .db-status.open { color: #8b949e; background: rgba(139, 148, 158, 0.16); }
.db-sev.advisory { color: #4aa3ff; background: rgba(74, 163, 255, 0.16); } .db-sev.watch { color: #f0883e; background: rgba(240, 136, 62, 0.16); } .db-sev.warning { color: var(--down); background: rgba(240, 101, 106, 0.18); }
.db-empty { padding: 1rem 0.85rem; color: var(--text-3); font-size: 0.8rem; }
.db-x { margin-left: auto; border: none; background: transparent; color: var(--text-3); cursor: pointer; font-size: 0.72rem; padding: 0 0.2rem; }
.db-x:hover { color: var(--down); }
.db-add { display: flex; gap: 0.4rem; padding: 0.45rem 0.85rem; border-top: 1px solid var(--line); position: sticky; bottom: 0; background: var(--surface); }
.db-add input { flex: 1; min-width: 0; background: var(--bg); border: 1px solid var(--line-2); border-radius: 6px; color: var(--text); padding: 0.3rem 0.5rem; font: inherit; font-size: 0.78rem; }
.db-add button { border: none; background: var(--surface-2); color: var(--text-2); border-radius: 6px; padding: 0.3rem 0.6rem; font-size: 0.74rem; cursor: pointer; white-space: nowrap; }
.db-add button:hover:not(:disabled) { color: var(--accent); }
.db-add button:disabled { opacity: 0.5; cursor: default; }
</style>
