<template>
  <section class="pd" aria-label="People directory">
    <header class="pd-toolbar">
      <div class="pd-title"><h1>Directory</h1><span class="pd-pill">fixture</span></div>
      <form class="pd-search" @submit.prevent="jump">
        <span class="pd-search-ic">⌕</span>
        <input v-model="query" type="text" placeholder="Search or type a name + ⏎ to open…" spellcheck="false" />
      </form>
      <div class="pd-kinds">
        <button v-for="k in kinds" :key="k" class="pd-kbtn" :class="{ on: kind === k }" @click="setKind(k)">{{ k }}</button>
      </div>
    </header>

    <div class="pd-body">
      <!-- Directory list -->
      <div ref="listEl" class="pd-list" aria-label="Results">
        <p class="pd-count">{{ results.length }} result{{ results.length === 1 ? '' : 's' }}</p>
        <button
          v-for="e in results"
          :key="e.id"
          class="pd-row"
          :class="{ on: e.id === selectedId }"
          @click="selectedId = e.id"
        >
          <span class="pd-avatar" :style="{ background: kindColor(e.kind) }">{{ initials(e.name) }}</span>
          <div class="pd-row-main">
            <div class="pd-row-name">{{ e.name }} <span class="pd-kind" :style="{ color: kindColor(e.kind) }">{{ e.kind }}</span></div>
            <div class="pd-row-sub">{{ e.role }} · {{ e.affiliation }}</div>
            <div class="pd-row-loc">{{ e.location }}</div>
          </div>
          <span class="pd-conf" :title="`resolution confidence ${(e.confidence * 100).toFixed(0)}%`">{{ (e.confidence * 100).toFixed(0) }}%</span>
        </button>
        <p v-if="results.length === 0" class="pd-empty">No matches. Clear the search or pick a different type.</p>
      </div>

      <!-- Profile -->
      <article v-if="selected" class="pd-profile" aria-label="Profile">
        <div class="pd-p-head">
          <span class="pd-avatar lg" :style="{ background: kindColor(selected.kind) }">{{ initials(selected.name) }}</span>
          <div>
            <div class="pd-p-name">{{ selected.name }}</div>
            <div class="pd-p-role">{{ selected.role }} · {{ selected.affiliation }}</div>
            <div class="pd-p-loc">{{ selected.location }}</div>
          </div>
        </div>

        <p class="pd-p-summary">{{ selected.summary }}</p>
        <div class="pd-tags"><span v-for="t in selected.tags" :key="t" class="pd-tag">{{ t }}</span></div>

        <!-- Career (Bloomberg BIO) -->
        <div v-if="career.length" class="pd-block">
          <div class="pd-block-h">Career</div>
          <div class="pd-career">
            <div v-for="(c, i) in career" :key="i" class="pd-stint" :class="{ current: i === 0 }">
              <span class="pd-stint-dot" />
              <div class="pd-stint-b">
                <div class="pd-stint-title">{{ c.title }}</div>
                <div class="pd-stint-org">{{ c.org }}</div>
              </div>
              <span class="pd-stint-period">{{ c.period }}</span>
            </div>
          </div>
        </div>

        <div v-if="edu.length" class="pd-block">
          <div class="pd-block-h">Education</div>
          <div class="pd-edu">
            <div v-for="(e, i) in edu" :key="i" class="pd-edu-row"><b>{{ e.school }}</b><span>{{ e.detail }}</span></div>
          </div>
        </div>

        <!-- Ego graph -->
        <div class="pd-block">
          <div class="pd-block-h">Relationships</div>
          <svg class="pd-ego" viewBox="0 0 300 210" role="img" aria-label="relationship graph">
            <line v-for="(n, i) in egoNodes" :key="'e' + i" x1="150" y1="105" :x2="n.x" :y2="n.y" class="pd-edge" />
            <g v-for="(n, i) in egoNodes" :key="'n' + i" :transform="`translate(${n.x},${n.y})`" :class="{ link: n.exists }" @click="n.exists && (selectedId = n.id)">
              <circle r="15" :fill="kindColor(n.kind)" />
              <text class="pd-ego-init" y="4" text-anchor="middle">{{ initials(n.name) }}</text>
              <text class="pd-ego-lbl" y="30" text-anchor="middle">{{ n.short }}</text>
              <text class="pd-ego-rel" y="-20" text-anchor="middle">{{ n.label }}</text>
            </g>
            <g transform="translate(150,105)">
              <circle r="22" :fill="kindColor(selected.kind)" stroke="var(--bg)" stroke-width="2" />
              <text class="pd-ego-init self" y="5" text-anchor="middle">{{ initials(selected.name) }}</text>
            </g>
          </svg>
        </div>

        <!-- OSINT: social accounts -->
        <div class="pd-block">
          <div class="pd-block-h">Social accounts <span class="pd-scope">open sources · scope-governed</span></div>
          <div class="pd-accounts">
            <a v-for="(a, i) in selected.accounts" :key="i" class="pd-acct" :href="a.url" target="_blank" rel="noreferrer">
              <span class="pd-plat" :style="{ color: platform(a.platform).color, borderColor: platform(a.platform).color }">{{ platform(a.platform).label }}</span>
              <span class="pd-handle">{{ a.handle }}<span v-if="a.verified" class="pd-verified" title="verified">✓</span></span>
              <span v-if="a.followers" class="pd-followers">{{ fmtNum(a.followers) }}</span>
              <span v-if="a.lastActive" class="pd-active">· {{ a.lastActive }}</span>
              <span class="pd-open">↗</span>
            </a>
          </div>
        </div>

        <!-- OSINT: selectors (pivots) -->
        <div class="pd-block">
          <div class="pd-block-h">Selectors <span class="pd-scope">pivots · masked withheld</span></div>
          <div class="pd-selectors">
            <template v-for="(s, i) in selected.selectors" :key="i">
              <button v-if="!s.masked" class="pd-sel pivot" :title="`Pivot — find entities sharing ${s.value}`" @click="pivot(s.value)">
                <span class="pd-sel-k">{{ s.kind }}</span>{{ s.value }}<span class="pd-sel-pivot">⤳</span>
              </button>
              <span v-else class="pd-sel masked"><span class="pd-sel-k">{{ s.kind }}</span>{{ s.value }}<span class="pd-sel-tag">scope</span></span>
            </template>
          </div>
        </div>

        <!-- OSINT: corroborating sources -->
        <div class="pd-block">
          <div class="pd-block-h">Sources</div>
          <div class="pd-osint">
            <div v-for="(o, i) in selected.osint" :key="i" class="pd-src">
              <span class="pd-src-kind" :class="o.kind">{{ o.kind }}</span>
              <span class="pd-src-name">{{ o.name }}</span>
              <span class="pd-src-conf">{{ (o.confidence * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <!-- Coverage (cross-link into the news feed) -->
        <div v-if="relatedNews.length" class="pd-block">
          <div class="pd-block-h">In the news</div>
          <div class="pd-news">
            <button v-for="n in relatedNews" :key="n.id" class="pd-news-row" @click="router.push('/news')">
              <span class="pd-news-src">{{ newsSrcTitle.get(n.sourceId) }}</span>
              <span class="pd-news-title">{{ n.title }}</span>
              <span class="pd-news-time">{{ newsRel(n.publishedAt) }}</span>
            </button>
          </div>
        </div>

        <!-- Resolution -->
        <div class="pd-block">
          <div class="pd-block-h">Identity resolution</div>
          <div class="pd-res">
            <div class="pd-res-bar"><div class="pd-res-fill" :style="{ width: (selected.confidence * 100) + '%', background: confColor(selected.confidence) }" /></div>
            <span class="pd-res-cap">{{ (selected.confidence * 100).toFixed(0) }}% confidence · {{ selected.sources }} corroborating sources</span>
          </div>
        </div>

        <div class="pd-block">
          <div class="pd-block-h">Provenance</div>
          <div class="pd-kv"><span>Source</span><code>fixture · entity-resolution stub</code></div>
          <div class="pd-kv"><span>As of</span><code>{{ asOfLabel }}</code></div>
        </div>
      </article>
      <div v-else class="pd-profile empty">Select an entity</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { entities, asOf, careers, education as eduMap, newsRefs, type Entity, type EntityKind, type Platform } from '../data/peopleFixture';
import { newsItems, newsSources } from '../data/newsFeedFixture';

const router = useRouter();
const newsSrcTitle = new Map(newsSources.map((s) => [s.id, s.title]));
const NEWS_NOW = new Date('2026-07-03T14:00:00-04:00').getTime();
function newsRel(iso: string): string { const m = Math.max(0, Math.round((NEWS_NOW - new Date(iso).getTime()) / 60000)); return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`; }

const PLATFORM: Record<Platform, { label: string; color: string }> = {
  x: { label: 'X', color: '#e7e9ea' },
  linkedin: { label: 'in', color: '#4aa3ff' },
  github: { label: 'GH', color: '#f0f6fc' },
  mastodon: { label: 'M', color: '#8b8cff' },
  telegram: { label: 'TG', color: '#3aa0e0' },
  web: { label: '@', color: '#8b949e' },
};
const platform = (p: Platform) => PLATFORM[p];
function fmtNum(n: number): string { return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n); }

const kinds = ['All', 'person', 'org', 'gov'] as const;
const kind = ref<(typeof kinds)[number]>('All');
const query = ref('');
const selectedId = ref<string>(entities[0]!.id);
const listEl = ref<HTMLElement | null>(null);

const byId = new Map(entities.map((e) => [e.id, e]));
const results = computed<Entity[]>(() => {
  const q = query.value.trim().toLowerCase();
  return entities.filter((e) => {
    if (kind.value !== 'All' && e.kind !== kind.value) return false;
    if (!q) return true;
    return [e.name, e.role, e.affiliation, e.location, ...e.tags, ...e.selectors.map((s) => s.value), ...e.accounts.map((a) => a.handle)]
      .some((f) => f.toLowerCase().includes(q));
  });
});
// Command-line jump: ⏎ opens the top match's dossier.
function jump() { if (results.value[0]) selectedId.value = results.value[0].id; }
// OSINT pivot: re-query the directory on a selector (finds entities sharing it).
function pivot(value: string) { kind.value = 'All'; query.value = value; }
const selected = computed<Entity | undefined>(() => byId.get(selectedId.value));
const career = computed(() => careers[selectedId.value] ?? []);
const edu = computed(() => eduMap[selectedId.value] ?? []);
const relatedNews = computed(() => (newsRefs[selectedId.value] ?? []).map((id) => newsItems.find((n) => n.id === id)).filter((x): x is NonNullable<typeof x> => !!x));
function setKind(k: (typeof kinds)[number]) { kind.value = k; if (!results.value.some((r) => r.id === selectedId.value) && results.value[0]) selectedId.value = results.value[0].id; }
watch(query, () => { if (!results.value.some((r) => r.id === selectedId.value) && results.value[0]) selectedId.value = results.value[0].id; });

const KIND_COLORS: Record<EntityKind, string> = { person: '#58a6ff', org: '#c58af9', gov: '#e3b341', place: 'var(--up)' };
const kindColor = (k: EntityKind) => KIND_COLORS[k];
const confColor = (c: number) => (c >= 0.9 ? 'var(--up)' : c >= 0.8 ? '#e3b341' : 'var(--down)');
function initials(name: string): string { return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join(''); }

// Ego graph: relations of the selected entity placed on a ring around it.
const egoNodes = computed(() => {
  const rels = selected.value?.relations ?? [];
  const cx = 150, cy = 105, r = 78;
  return rels.map((rel, i) => {
    const ang = (i / Math.max(1, rels.length)) * Math.PI * 2 - Math.PI / 2;
    const target = byId.get(rel.to);
    const name = target?.name ?? rel.to;
    return {
      id: rel.to,
      exists: !!target,
      kind: (target?.kind ?? 'org') as EntityKind,
      name,
      short: name.length > 14 ? name.slice(0, 13) + '…' : name,
      label: rel.label,
      x: cx + Math.cos(ang) * r,
      y: cy + Math.sin(ang) * r * 0.86,
    };
  });
});

const asOfLabel = new Date(asOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
</script>

<style scoped>
.pd { height: 100%; min-height: 0; display: grid; grid-template-rows: auto 1fr; gap: 0.75rem; padding: 0.85rem 1rem 1rem; background: var(--bg); color: rgba(255, 255, 255, 0.9); }
.pd-toolbar { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.pd-title { display: flex; align-items: baseline; gap: 0.6rem; } .pd-title h1 { margin: 0; font-size: 1.2rem; letter-spacing: -0.01em; color: var(--text); font-weight: 640; }
.pd-pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: #e3b341; background: rgba(227, 179, 65, 0.14); border-radius: 5px; padding: 0.1rem 0.35rem; }
.pd-search { flex: 1 1 260px; display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--line-2); border-radius: 10px; background: var(--surface); padding: 0.4rem 0.7rem; } .pd-search:focus-within { border-color: var(--accent); } .pd-search-ic { color: rgba(255, 255, 255, 0.4); }
.pd-search input { flex: 1; min-width: 0; background: transparent; border: none; outline: none; color: #fff; font-size: 0.9rem; }
.pd-kinds { display: flex; gap: 0.25rem; }
.pd-kbtn { border: 1px solid var(--line-2); background: transparent; color: rgba(255, 255, 255, 0.6); border-radius: 8px; padding: 0.3rem 0.6rem; font-size: 0.75rem; text-transform: capitalize; cursor: pointer; } .pd-kbtn.on { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

.pd-body { min-height: 0; display: grid; grid-template-columns: minmax(360px, 1.1fr) minmax(340px, 1fr); gap: 0.75rem; }
@media (max-width: 1080px) { .pd-body { grid-template-columns: 1fr; } .pd-profile { display: none; } }

.pd-list { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; }
.pd-count { margin: 0; padding: 0.5rem 0.85rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255, 255, 255, 0.4); border-bottom: 1px solid var(--line); }
.pd-row { width: 100%; display: flex; align-items: center; gap: 0.7rem; border: none; border-bottom: 1px solid var(--line); background: transparent; color: inherit; padding: 0.6rem 0.85rem; cursor: pointer; text-align: left; } .pd-row:hover { background: rgba(255, 255, 255, 0.03); } .pd-row.on { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
.pd-avatar { flex: 0 0 auto; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-size: 0.72rem; font-weight: 800; color: #04121f; } .pd-avatar.lg { width: 52px; height: 52px; font-size: 1rem; }
.pd-row-main { min-width: 0; flex: 1; }
.pd-row-name { font-size: 0.86rem; font-weight: 600; } .pd-kind { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; margin-left: 0.35rem; }
.pd-row-sub { font-size: 0.74rem; color: rgba(255, 255, 255, 0.6); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .pd-row-loc { font-size: 0.68rem; color: rgba(255, 255, 255, 0.4); }
.pd-conf { font-size: 0.72rem; font-variant-numeric: tabular-nums; color: rgba(255, 255, 255, 0.5); }
.pd-empty { padding: 1.5rem; color: rgba(255, 255, 255, 0.45); font-size: 0.85rem; }

.pd-profile { min-height: 0; overflow-y: auto; border: 1px solid var(--line-2); border-radius: 12px; padding: 1.1rem 1.2rem; }
.pd-profile.empty { display: grid; place-items: center; color: rgba(255, 255, 255, 0.35); font-size: 0.85rem; }
.pd-p-head { display: flex; align-items: center; gap: 0.9rem; }
.pd-p-name { font-size: 1.25rem; font-weight: 700; } .pd-p-role { font-size: 0.85rem; color: rgba(255, 255, 255, 0.65); margin-top: 0.15rem; } .pd-p-loc { font-size: 0.75rem; color: rgba(255, 255, 255, 0.45); }
.pd-p-summary { margin: 0.9rem 0 0.6rem; font-size: 0.9rem; line-height: 1.6; color: rgba(255, 255, 255, 0.82); }
.pd-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.pd-tag { font-size: 0.72rem; color: rgba(255, 255, 255, 0.75); background: rgba(255, 255, 255, 0.06); border: 1px solid var(--line-2); border-radius: 6px; padding: 0.12rem 0.45rem; }
.pd-block { margin-top: 0.9rem; border-top: 1px solid var(--line-2); padding-top: 0.8rem; }
.pd-block-h { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.4); margin-bottom: 0.5rem; }
.pd-ego { width: 100%; height: 210px; }
.pd-edge { stroke: rgba(255, 255, 255, 0.14); stroke-width: 1; }
.pd-ego .link { cursor: pointer; } .pd-ego .link:hover circle { stroke: #fff; stroke-width: 2; }
.pd-ego circle { stroke: var(--bg); stroke-width: 1.5; }
.pd-ego-init { fill: #04121f; font-size: 9px; font-weight: 800; } .pd-ego-init.self { fill: #04121f; font-size: 11px; }
.pd-ego-lbl { fill: rgba(255, 255, 255, 0.7); font-size: 8px; } .pd-ego-rel { fill: rgba(255, 255, 255, 0.4); font-size: 7px; text-transform: uppercase; letter-spacing: 0.04em; }
.pd-res { display: grid; gap: 0.4rem; } .pd-res-bar { height: 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.08); overflow: hidden; } .pd-res-fill { height: 100%; border-radius: 4px; } .pd-res-cap { font-size: 0.74rem; color: rgba(255, 255, 255, 0.55); }

/* Career / education (Bloomberg BIO) */
.pd-career { display: grid; gap: 0; }
.pd-stint { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.35rem 0; position: relative; }
.pd-stint-dot { flex: 0 0 auto; width: 8px; height: 8px; border-radius: 50%; margin-top: 0.35rem; background: rgba(255, 255, 255, 0.3); box-shadow: 0 12px 0 -3.5px rgba(255, 255, 255, 0.12); } .pd-stint:last-child .pd-stint-dot { box-shadow: none; } .pd-stint.current .pd-stint-dot { background: var(--accent); }
.pd-stint-b { flex: 1; min-width: 0; } .pd-stint-title { font-size: 0.82rem; font-weight: 600; } .pd-stint-org { font-size: 0.74rem; color: rgba(255, 255, 255, 0.55); }
.pd-stint-period { font-size: 0.68rem; color: rgba(255, 255, 255, 0.4); font-variant-numeric: tabular-nums; white-space: nowrap; }
.pd-edu { display: grid; gap: 0.25rem; }
.pd-edu-row { display: flex; justify-content: space-between; gap: 0.75rem; font-size: 0.78rem; } .pd-edu-row b { font-weight: 600; } .pd-edu-row span { color: rgba(255, 255, 255, 0.55); text-align: right; }
/* In the news (cross-link) */
.pd-news { display: grid; gap: 0.15rem; }
.pd-news-row { display: flex; align-items: baseline; gap: 0.55rem; border: none; background: transparent; color: inherit; padding: 0.3rem 0.4rem; border-radius: 6px; cursor: pointer; text-align: left; } .pd-news-row:hover { background: rgba(255, 255, 255, 0.04); }
.pd-news-src { flex: 0 0 auto; font-size: 0.64rem; color: #4aa3ff; font-weight: 600; width: 5.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pd-news-title { flex: 1; font-size: 0.76rem; color: rgba(255, 255, 255, 0.8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .pd-news-time { font-size: 0.66rem; color: rgba(255, 255, 255, 0.35); }

/* OSINT */
.pd-scope { text-transform: none; letter-spacing: 0; font-size: 0.58rem; color: rgba(255, 160, 40, 0.7); margin-left: 0.5rem; }
.pd-accounts { display: grid; gap: 0.3rem; }
.pd-acct { display: flex; align-items: center; gap: 0.55rem; padding: 0.35rem 0.5rem; border: 1px solid var(--line-2); border-radius: 8px; text-decoration: none; color: inherit; } .pd-acct:hover { border-color: rgba(255, 255, 255, 0.25); background: rgba(255, 255, 255, 0.03); }
.pd-plat { flex: 0 0 auto; width: 1.8rem; text-align: center; font-size: 0.6rem; font-weight: 800; border: 1px solid; border-radius: 5px; padding: 0.1rem 0; font-family: 'Roboto Mono', ui-monospace, monospace; }
.pd-handle { flex: 1; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .pd-verified { color: #4aa3ff; margin-left: 0.25rem; font-size: 0.72rem; }
.pd-followers { font-size: 0.7rem; color: rgba(255, 255, 255, 0.6); font-variant-numeric: tabular-nums; } .pd-active { font-size: 0.66rem; color: rgba(255, 255, 255, 0.35); } .pd-open { color: rgba(255, 255, 255, 0.35); font-size: 0.72rem; }
.pd-selectors { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.pd-sel { font-family: 'Roboto Mono', ui-monospace, monospace; font-size: 0.72rem; color: rgba(255, 255, 255, 0.82); background: rgba(255, 255, 255, 0.05); border: 1px solid var(--line-2); border-radius: 6px; padding: 0.12rem 0.45rem; display: inline-flex; align-items: center; gap: 0.4rem; } .pd-sel.masked { color: rgba(255, 255, 255, 0.4); border-style: dashed; }
.pd-sel-k { font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.04em; color: rgba(255, 160, 40, 0.85); }
.pd-sel.pivot { cursor: pointer; } .pd-sel.pivot:hover { border-color: var(--accent); color: #fff; } .pd-sel-pivot { color: rgba(255, 160, 40, 0.7); font-size: 0.7rem; }
.pd-sel-tag { font-size: 0.52rem; text-transform: uppercase; color: rgba(255, 255, 255, 0.4); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 3px; padding: 0 0.2rem; }
.pd-osint { display: grid; gap: 0.28rem; }
.pd-src { display: flex; align-items: center; gap: 0.5rem; font-size: 0.76rem; }
.pd-src-kind { flex: 0 0 auto; width: 4.4rem; font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; border-radius: 4px; padding: 0.06rem 0.3rem; text-align: center; }
.pd-src-kind.news { color: #4aa3ff; background: rgba(74, 163, 255, 0.14); } .pd-src-kind.registry { color: var(--up); background: rgba(63, 185, 80, 0.14); } .pd-src-kind.social { color: #c58af9; background: rgba(197, 138, 249, 0.14); } .pd-src-kind.leak { color: var(--down); background: rgba(248, 81, 73, 0.14); } .pd-src-kind.domain { color: #e3b341; background: rgba(227, 179, 65, 0.14); } .pd-src-kind.filing { color: #8b949e; background: rgba(139, 148, 158, 0.16); }
.pd-src-name { flex: 1; color: rgba(255, 255, 255, 0.75); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .pd-src-conf { font-size: 0.7rem; color: rgba(255, 255, 255, 0.45); font-variant-numeric: tabular-nums; }
.pd-kv { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; font-size: 0.8rem; padding: 0.2rem 0; } .pd-kv span { color: rgba(255, 255, 255, 0.45); } .pd-kv code { color: rgba(255, 255, 255, 0.7); font-family: ui-monospace, monospace; font-size: 0.72rem; }
</style>
