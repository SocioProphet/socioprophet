import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

// Composable dashboard: which cards the user shows. Order is the declared default for now;
// hidden cards drop out and can be re-added. Persisted per browser.
export interface DashCard { id: string; label: string }
export const DASH_CARDS: DashCard[] = [
  { id: 'markets', label: 'Markets' },
  { id: 'companies', label: 'Companies & Valuations' },
  { id: 'news', label: 'News & Events' },
  { id: 'economy', label: 'Economy' },
  { id: 'people', label: 'People' },
  { id: 'law', label: 'Law & Regulation' },
  { id: 'weather', label: 'Weather' },
  { id: 'social', label: 'Social Signals' },
  { id: 'alerts', label: 'Active Alerts' },
];

const LS_KEY = 'sp.dashboard.v1';

export const useDashboard = defineStore('dashboard', () => {
  const hidden = ref<string[]>((() => {
    try { const r = localStorage.getItem(LS_KEY); if (r) { const p = JSON.parse(r); return Array.isArray(p.hidden) ? p.hidden : []; } } catch { /* ignore */ }
    return [];
  })());

  watch(hidden, () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ hidden: hidden.value })); } catch { /* ignore */ }
  }, { deep: true });

  const visible = (id: string) => !hidden.value.includes(id);
  const hide = (id: string) => { if (!hidden.value.includes(id)) hidden.value = [...hidden.value, id]; };
  const show = (id: string) => { hidden.value = hidden.value.filter((x) => x !== id); };
  const hiddenCards = () => DASH_CARDS.filter((c) => hidden.value.includes(c.id));

  return { hidden, visible, hide, show, hiddenCards, DASH_CARDS };
});
