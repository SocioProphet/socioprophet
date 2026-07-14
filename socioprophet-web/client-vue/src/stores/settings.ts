import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

// User settings + nav personalization, all persisted to localStorage:
//   operatorMode  when on, the operator/SourceOS drawer sections default to expanded
//                 + pinnable. It NO LONGER gates presence — every surface stays reachable.
//   theme         'dark' | 'light' — applied as data-theme on <html>.
//   pinned        surface routes the user pinned to the top of the drawer.
//   openSections  per-section accordion open/closed state (id -> bool).

type Theme = 'dark' | 'light';
const LS_KEY = 'sp.settings.v1';

interface Persisted {
  operatorMode: boolean;
  theme: Theme;
  pinned: string[];
  openSections: Record<string, boolean>;
  meshChat: boolean;
}

function load(): Persisted {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    if (raw) {
      const p = JSON.parse(raw);
      return {
        operatorMode: !!p.operatorMode,
        theme: p.theme === 'light' ? 'light' : 'dark',
        pinned: Array.isArray(p.pinned) ? p.pinned : [],
        openSections: p.openSections && typeof p.openSections === 'object' ? p.openSections : {},
        meshChat: !!p.meshChat,
      };
    }
  } catch { /* ignore */ }
  return { operatorMode: false, theme: 'dark', pinned: [], openSections: {}, meshChat: false };
}

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', theme);
}

export const useSettings = defineStore('settings', () => {
  const initial = load();
  const operatorMode = ref<boolean>(initial.operatorMode);
  const theme = ref<Theme>(initial.theme);
  const pinned = ref<string[]>(initial.pinned);
  const openSections = ref<Record<string, boolean>>(initial.openSections);
  const meshChat = ref<boolean>(initial.meshChat);

  applyTheme(theme.value);

  watch([operatorMode, theme, pinned, openSections, meshChat], () => {
    applyTheme(theme.value);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        operatorMode: operatorMode.value, theme: theme.value,
        pinned: pinned.value, openSections: openSections.value, meshChat: meshChat.value,
      }));
    } catch { /* ignore */ }
  }, { deep: true });

  const toggleMeshChat = () => { meshChat.value = !meshChat.value; };

  const toggleOperatorMode = () => { operatorMode.value = !operatorMode.value; };
  const setTheme = (t: Theme) => { theme.value = t; };
  const toggleTheme = () => { theme.value = theme.value === 'dark' ? 'light' : 'dark'; };

  const isPinned = (to: string) => pinned.value.includes(to);
  const togglePin = (to: string) => {
    pinned.value = isPinned(to) ? pinned.value.filter((p) => p !== to) : [...pinned.value, to];
  };

  // Accordion state: explicit user choice wins; otherwise operator sections follow
  // Operator mode and everyday sections follow their defaultOpen.
  const isSectionOpen = (id: string, defaultOpen: boolean, operator = false) => {
    if (id in openSections.value) return openSections.value[id];
    return operator ? operatorMode.value : defaultOpen;
  };
  const toggleSection = (id: string, current: boolean) => {
    openSections.value = { ...openSections.value, [id]: !current };
  };

  return {
    operatorMode, theme, pinned, openSections, meshChat,
    toggleOperatorMode, setTheme, toggleTheme, toggleMeshChat,
    isPinned, togglePin, isSectionOpen, toggleSection,
  };
});
