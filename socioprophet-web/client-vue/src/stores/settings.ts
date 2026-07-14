import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

// User settings store: the two preferences the shell reacts to today —
//   operatorMode  reveals the SourceOS / operator surfaces (off by default, so a
//                 normal user sees a clean product and never meets SourceOS).
//   theme         'dark' | 'light' — applied as data-theme on <html>.
// Both persist to localStorage so a reload keeps the user's choice.

type Theme = 'dark' | 'light';
const LS_KEY = 'sp.settings.v1';

function load(): { operatorMode: boolean; theme: Theme } {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    if (raw) {
      const p = JSON.parse(raw);
      return { operatorMode: !!p.operatorMode, theme: p.theme === 'light' ? 'light' : 'dark' };
    }
  } catch { /* ignore */ }
  return { operatorMode: false, theme: 'dark' };
}

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', theme);
}

export const useSettings = defineStore('settings', () => {
  const initial = load();
  const operatorMode = ref<boolean>(initial.operatorMode);
  const theme = ref<Theme>(initial.theme);

  applyTheme(theme.value);

  watch([operatorMode, theme], () => {
    applyTheme(theme.value);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ operatorMode: operatorMode.value, theme: theme.value }));
    } catch { /* ignore */ }
  });

  const toggleOperatorMode = () => { operatorMode.value = !operatorMode.value; };
  const setTheme = (t: Theme) => { theme.value = t; };
  const toggleTheme = () => { theme.value = theme.value === 'dark' ? 'light' : 'dark'; };

  return { operatorMode, theme, toggleOperatorMode, setTheme, toggleTheme };
});
