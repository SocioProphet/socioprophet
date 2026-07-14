import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

// User-added personal lists (watchlist tickers, weather cities), persisted to localStorage.
// A live build would sync these to the account/portfolio service; today they're local so the
// "add to your portfolio / cities" gesture works end-to-end on the fixture surfaces.
const LS_KEY = 'sp.userlists.v1';

function load(): { watchlist: string[]; cities: string[] } {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    if (raw) {
      const p = JSON.parse(raw);
      return { watchlist: Array.isArray(p.watchlist) ? p.watchlist : [], cities: Array.isArray(p.cities) ? p.cities : [] };
    }
  } catch { /* ignore */ }
  return { watchlist: [], cities: [] };
}

export const useUserLists = defineStore('userLists', () => {
  const init = load();
  const watchlist = ref<string[]>(init.watchlist);
  const cities = ref<string[]>(init.cities);

  watch([watchlist, cities], () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ watchlist: watchlist.value, cities: cities.value })); } catch { /* ignore */ }
  }, { deep: true });

  const addSymbol = (s: string) => { const v = s.trim().toUpperCase(); if (v && !watchlist.value.includes(v)) watchlist.value = [...watchlist.value, v]; };
  const removeSymbol = (s: string) => { watchlist.value = watchlist.value.filter((x) => x !== s); };
  const addCity = (c: string) => { const v = c.trim(); if (v && !cities.value.some((x) => x.toLowerCase() === v.toLowerCase())) cities.value = [...cities.value, v]; };
  const removeCity = (c: string) => { cities.value = cities.value.filter((x) => x !== c); };

  return { watchlist, cities, addSymbol, removeSymbol, addCity, removeCity };
});
