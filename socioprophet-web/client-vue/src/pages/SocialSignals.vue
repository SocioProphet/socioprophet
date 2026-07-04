<template>
  <section class="ss" aria-label="Social signals">
    <header class="ss-toolbar">
      <div class="ss-title"><h1>Social Signals</h1><span class="ss-pill">fixture</span></div>
      <form class="term-cmd" @submit.prevent>
        <span class="term-cmd-prompt">›</span>
        <input v-model="query" spellcheck="false" placeholder="Filter by @handle, name or #topic" />
        <button type="button" class="term-cmd-go" @click="query = ''">CLR</button>
      </form>
      <div class="ss-asof">{{ asOfLabel }}</div>
    </header>

    <div class="ss-filters">
      <div class="ss-fgroup">
        <button v-for="p in platforms" :key="p" class="ss-fbtn" :class="{ on: platform === p }" @click="platform = p">{{ p === 'all' ? 'All' : plat(p as Platform).label }}</button>
      </div>
      <div class="ss-fgroup">
        <button v-for="s in sentiments" :key="s" class="ss-fbtn sent" :class="[s, { on: sentiment === s }]" @click="sentiment = s">{{ s }}</button>
      </div>
    </div>

    <div class="ss-body">
      <!-- Signal stream -->
      <div class="ss-stream" aria-label="Signal stream">
        <p v-if="filtered.length === 0" class="ss-empty">No signals match — clear the filters.</p>
        <article v-for="sig in filtered" :key="sig.id" class="ss-sig">
          <div class="ss-sig-head">
            <span class="ss-avatar" :style="{ background: kindColor(who(sig).kind) }">{{ initials(who(sig).name) }}</span>
            <span class="ss-name">{{ who(sig).name }}</span>
            <span class="ss-handle">{{ handleOf(sig) }}</span>
            <span class="ss-plat" :style="{ color: plat(sig.platform).color, borderColor: plat(sig.platform).color }">{{ plat(sig.platform).label }}</span>
            <span v-if="sig.kind === 'mention'" class="ss-mention">mention</span>
            <span class="ss-sent" :class="sig.sentiment" :title="sig.sentiment" />
            <span class="ss-time">{{ rel(sig.time) }}</span>
          </div>
          <p class="ss-text">{{ sig.text }}</p>
          <div class="ss-eng"><span>♥ {{ fmtNum(sig.likes) }}</span><span>⇄ {{ fmtNum(sig.reposts) }}</span></div>
        </article>
      </div>

      <!-- Trending -->
      <aside class="ss-trend" aria-label="Trending">
        <div class="ss-trend-h">Trending</div>
        <button v-for="t in trends" :key="t.topic" class="ss-trend-row" :class="{ on: query === t.topic }" @click="query = query === t.topic ? '' : t.topic">
          <span class="ss-trend-topic">{{ t.topic }}</span>
          <span class="ss-trend-vol">{{ fmtNum(t.volume) }}</span>
          <span class="ss-trend-chg" :class="t.changePct >= 0 ? 'up' : 'down'">{{ t.changePct >= 0 ? '+' : '' }}{{ t.changePct }}%</span>
        </button>
        <div class="ss-mood">
          <div class="ss-mood-h">Sentiment mix</div>
          <div class="ss-mood-bar">
            <span class="pos" :style="{ width: moodPct('pos') + '%' }" />
            <span class="neu" :style="{ width: moodPct('neu') + '%' }" />
            <span class="neg" :style="{ width: moodPct('neg') + '%' }" />
          </div>
          <div class="ss-mood-legend"><span class="pos">{{ moodPct('pos') }}% pos</span><span class="neu">{{ moodPct('neu') }}% neu</span><span class="neg">{{ moodPct('neg') }}% neg</span></div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { socialSignals, trends, asOf, type SocialSignal, type Sentiment } from '../data/socialFixture';
import { entities, type EntityKind, type Platform } from '../data/peopleFixture';

const platforms = ['all', 'x', 'linkedin', 'mastodon', 'telegram'] as const;
const sentiments = ['all', 'pos', 'neu', 'neg'] as const;
const platform = ref<(typeof platforms)[number]>('all');
const sentiment = ref<(typeof sentiments)[number]>('all');
const query = ref('');

const byId = new Map(entities.map((e) => [e.id, e]));
const who = (sig: SocialSignal) => byId.get(sig.entityId) ?? { name: sig.entityId, kind: 'org' as EntityKind, accounts: [] as { platform: Platform; handle: string }[] };
const handleOf = (sig: SocialSignal) => who(sig).accounts.find((a) => a.platform === sig.platform)?.handle ?? '';

const filtered = computed<SocialSignal[]>(() => {
  const q = query.value.trim().toLowerCase();
  return socialSignals.filter((s) => {
    if (platform.value !== 'all' && s.platform !== platform.value) return false;
    if (sentiment.value !== 'all' && s.sentiment !== sentiment.value) return false;
    if (!q) return true;
    return [who(s).name, handleOf(s), s.text].some((f) => f.toLowerCase().includes(q));
  });
});

function moodPct(kind: Sentiment): number {
  const list = filtered.value.length ? filtered.value : socialSignals;
  return Math.round((list.filter((s) => s.sentiment === kind).length / list.length) * 100);
}

const KIND_COLORS: Record<EntityKind, string> = { person: '#58a6ff', org: '#c58af9', gov: '#e3b341', place: '#3fb950' };
const kindColor = (k: EntityKind) => KIND_COLORS[k];
const PLATFORM: Record<Platform, { label: string; color: string }> = {
  x: { label: 'X', color: '#e7e9ea' }, linkedin: { label: 'in', color: '#4aa3ff' }, github: { label: 'GH', color: '#f0f6fc' },
  mastodon: { label: 'M', color: '#8b8cff' }, telegram: { label: 'TG', color: '#3aa0e0' }, web: { label: '@', color: '#8b949e' },
};
const plat = (p: Platform) => PLATFORM[p];
function initials(name: string): string { return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join(''); }
function fmtNum(n: number): string { return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n); }
const NOW = new Date(asOf).getTime();
function rel(iso: string): string { const m = Math.max(0, Math.round((NOW - new Date(iso).getTime()) / 60000)); return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`; }
const asOfLabel = new Date(asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
</script>

<style scoped>
.ss { height: 100%; min-height: 0; display: grid; grid-template-rows: auto auto 1fr; gap: 0.6rem; padding: 0.85rem 1rem 1rem; background: #05070a; color: rgba(255, 255, 255, 0.9); }
.ss-toolbar { display: flex; align-items: center; gap: 1rem; }
.ss-title { display: flex; align-items: baseline; gap: 0.5rem; } .ss-title h1 { margin: 0; font-size: 1rem; letter-spacing: 0.06em; color: #ffa028; font-weight: 700; font-family: 'Roboto Mono', ui-monospace, monospace; text-transform: uppercase; }
.ss-pill { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.08em; color: #e3b341; background: rgba(227, 179, 65, 0.14); border-radius: 4px; padding: 0.08rem 0.3rem; }
.ss-asof { margin-left: auto; font-size: 0.72rem; color: rgba(255, 255, 255, 0.4); }
.ss-filters { display: flex; gap: 1rem; }
.ss-fgroup { display: flex; gap: 0.25rem; }
.ss-fbtn { border: 1px solid #21262d; background: transparent; color: rgba(255, 255, 255, 0.6); border-radius: 7px; padding: 0.25rem 0.6rem; font-size: 0.72rem; cursor: pointer; text-transform: capitalize; } .ss-fbtn.on { border-color: #ffa028; color: #ffa028; background: rgba(255, 160, 40, 0.12); }
.ss-fbtn.sent.pos.on { border-color: #3fb950; color: #3fb950; background: rgba(63, 185, 80, 0.12); } .ss-fbtn.sent.neg.on { border-color: #f85149; color: #f85149; background: rgba(248, 81, 73, 0.12); }

.ss-body { min-height: 0; display: grid; grid-template-columns: minmax(420px, 1.6fr) minmax(260px, 1fr); gap: 0.75rem; }
@media (max-width: 1080px) { .ss-body { grid-template-columns: 1fr; } .ss-trend { display: none; } }

.ss-stream { min-height: 0; overflow-y: auto; border: 1px solid #21262d; border-radius: 12px; }
.ss-empty { padding: 1.5rem; color: rgba(255, 255, 255, 0.45); font-size: 0.85rem; }
.ss-sig { padding: 0.7rem 0.9rem; border-bottom: 1px solid #161b22; }
.ss-sig-head { display: flex; align-items: center; gap: 0.5rem; }
.ss-avatar { flex: 0 0 auto; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 0.6rem; font-weight: 800; color: #04121f; }
.ss-name { font-size: 0.82rem; font-weight: 600; } .ss-handle { font-size: 0.72rem; color: rgba(255, 255, 255, 0.45); }
.ss-plat { font-size: 0.56rem; font-weight: 800; border: 1px solid; border-radius: 4px; padding: 0.05rem 0.28rem; font-family: 'Roboto Mono', ui-monospace, monospace; }
.ss-mention { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.04em; color: rgba(255, 255, 255, 0.5); border: 1px solid #21262d; border-radius: 4px; padding: 0.03rem 0.28rem; }
.ss-sent { width: 8px; height: 8px; border-radius: 50%; } .ss-sent.pos { background: #3fb950; } .ss-sent.neg { background: #f85149; } .ss-sent.neu { background: #8b949e; }
.ss-time { margin-left: auto; font-size: 0.68rem; color: rgba(255, 255, 255, 0.4); }
.ss-text { margin: 0.4rem 0 0.45rem; font-size: 0.86rem; line-height: 1.5; color: rgba(255, 255, 255, 0.85); }
.ss-eng { display: flex; gap: 1rem; font-size: 0.72rem; color: rgba(255, 255, 255, 0.5); font-variant-numeric: tabular-nums; }

.ss-trend { min-height: 0; overflow-y: auto; border: 1px solid #21262d; border-radius: 12px; padding: 0.5rem; }
.ss-trend-h { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.45); padding: 0.35rem 0.5rem; }
.ss-trend-row { width: 100%; display: flex; align-items: baseline; gap: 0.6rem; border: none; background: transparent; color: inherit; padding: 0.4rem 0.5rem; border-radius: 8px; cursor: pointer; text-align: left; } .ss-trend-row:hover { background: rgba(255, 255, 255, 0.04); } .ss-trend-row.on { background: rgba(255, 160, 40, 0.12); }
.ss-trend-topic { flex: 1; font-size: 0.8rem; color: #ffd9a8; } .ss-trend-vol { font-size: 0.68rem; color: rgba(255, 255, 255, 0.4); font-variant-numeric: tabular-nums; }
.ss-trend-chg { font-size: 0.72rem; font-variant-numeric: tabular-nums; width: 3.4rem; text-align: right; } .ss-trend-chg.up { color: #3fb950; } .ss-trend-chg.down { color: #f85149; }
.ss-mood { margin-top: 0.75rem; border-top: 1px solid #21262d; padding: 0.7rem 0.5rem 0.3rem; }
.ss-mood-h { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.45); margin-bottom: 0.45rem; }
.ss-mood-bar { display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: rgba(255, 255, 255, 0.06); } .ss-mood-bar .pos { background: #3fb950; } .ss-mood-bar .neu { background: #8b949e; } .ss-mood-bar .neg { background: #f85149; }
.ss-mood-legend { display: flex; justify-content: space-between; margin-top: 0.4rem; font-size: 0.66rem; } .ss-mood-legend .pos { color: #3fb950; } .ss-mood-legend .neu { color: #8b949e; } .ss-mood-legend .neg { color: #f85149; }
</style>
