import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

// Capture-on-close research store.
//
// North star: tabs are disposable, the research is not. The operator opens and
// closes a lot of working tabs; closing one must NEVER destroy the knowledge it
// held. Every close (and every explicit snapshot) captures the tab into a
// durable research list first. Non-destructive by default — same "never
// silently drop" posture as INV-26 (Holographic Completeness).

export interface OpenTab {
  id: string;
  path: string;
  title: string;
  domain?: string;
  openedAt: number;
  lastSeenAt: number;
}

export type CaptureSource = 'tab-close' | 'snapshot' | 'manual';

export interface ResearchCaptureItem {
  id: string;
  title: string;
  path: string;
  domain?: string;
  source: CaptureSource;
  openedAt?: number;
  capturedAt: number;
  // Inferred/ML enrichments (design principle #3 — non-authored, marked
  // pending until the enrichment adapters are wired).
  entities?: string[];
}

const STORAGE_KEY = 'sp.research.list.v1';

function loadPersisted(): ResearchCaptureItem[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? (JSON.parse(raw) as ResearchCaptureItem[]) : [];
  } catch {
    return [];
  }
}

function persist(items: ResearchCaptureItem[]): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable (private mode / test) — capture stays in-memory */
  }
}

let seq = 0;
const uid = (prefix: string): string => `${prefix}_${Date.now().toString(36)}_${(seq++).toString(36)}`;

export const useResearch = defineStore('research', () => {
  const openTabs = ref<OpenTab[]>([]);
  const researchList = ref<ResearchCaptureItem[]>(loadPersisted());

  // Durable list survives reloads immediately (localStorage); a real backend
  // (clip-inbox / capture spine) can replace this without touching callers.
  // flush: 'sync' so a captured item is persisted before anything can read it
  // back — capture must never lag behind a close.
  watch(researchList, (items) => persist(items), { deep: true, flush: 'sync' });

  // Register/refresh an open working tab as the operator navigates.
  function trackVisit(t: { path: string; title: string; domain?: string }): void {
    if (!t.path || t.path === '/login') return;
    const existing = openTabs.value.find((o) => o.path === t.path);
    const now = Date.now();
    if (existing) {
      existing.lastSeenAt = now;
      existing.title = t.title;
      existing.domain = t.domain;
      return;
    }
    openTabs.value.push({ id: uid('tab'), path: t.path, title: t.title, domain: t.domain, openedAt: now, lastSeenAt: now });
  }

  // Non-destructive capture into the durable list.
  function capture(tab: Pick<OpenTab, 'path' | 'title' | 'domain' | 'openedAt'>, source: CaptureSource): ResearchCaptureItem {
    const item: ResearchCaptureItem = {
      id: uid('cap'),
      title: tab.title,
      path: tab.path,
      domain: tab.domain,
      source,
      openedAt: tab.openedAt,
      capturedAt: Date.now(),
    };
    researchList.value.push(item);
    return item;
  }

  // Close a tab: capture it FIRST (never lose), then drop from the open set.
  function closeTab(id: string): ResearchCaptureItem | undefined {
    const tab = openTabs.value.find((o) => o.id === id);
    if (!tab) return undefined;
    const item = capture(tab, 'tab-close');
    openTabs.value = openTabs.value.filter((o) => o.id !== id);
    return item;
  }

  // Snapshot: capture every open tab WITHOUT closing anything.
  function snapshotOpen(): number {
    const before = researchList.value.length;
    for (const tab of openTabs.value) capture(tab, 'snapshot');
    return researchList.value.length - before;
  }

  // Flush the whole working set into the list, then clear the open set.
  function closeAll(): number {
    const tabs = [...openTabs.value];
    for (const tab of tabs) capture(tab, 'tab-close');
    openTabs.value = [];
    return tabs.length;
  }

  function removeCaptured(id: string): void {
    researchList.value = researchList.value.filter((i) => i.id !== id);
  }

  function exportList(): string {
    return JSON.stringify(researchList.value, null, 2);
  }

  return { openTabs, researchList, trackVisit, capture, closeTab, snapshotOpen, closeAll, removeCaptured, exportList };
});
