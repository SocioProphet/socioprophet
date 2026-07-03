import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useResearch } from '../stores/research';

describe('research capture store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    try { localStorage.clear(); } catch { /* noop */ }
  });

  it('tracks visited routes as open tabs without duplicating a path', () => {
    const r = useResearch();
    r.trackVisit({ path: '/news', title: 'News & Events', domain: 'News & Events' });
    r.trackVisit({ path: '/map', title: 'Maps' });
    r.trackVisit({ path: '/news', title: 'News & Events (again)' });
    expect(r.openTabs.length).toBe(2);
    expect(r.openTabs.find((t) => t.path === '/news')?.title).toBe('News & Events (again)');
  });

  it('never tracks the login route', () => {
    const r = useResearch();
    r.trackVisit({ path: '/login', title: 'Login' });
    expect(r.openTabs.length).toBe(0);
  });

  it('captures a tab into the durable list BEFORE removing it on close (non-destructive)', () => {
    const r = useResearch();
    r.trackVisit({ path: '/map', title: 'Maps', domain: 'Maps & Analytics' });
    const id = r.openTabs[0].id;
    const captured = r.closeTab(id);
    expect(r.openTabs.length).toBe(0);            // tab is gone from the working set
    expect(r.researchList.length).toBe(1);         // but the research survives
    expect(captured?.path).toBe('/map');
    expect(r.researchList[0].source).toBe('tab-close');
  });

  it('snapshots all open tabs without closing them', () => {
    const r = useResearch();
    r.trackVisit({ path: '/news', title: 'News' });
    r.trackVisit({ path: '/map', title: 'Maps' });
    const n = r.snapshotOpen();
    expect(n).toBe(2);
    expect(r.openTabs.length).toBe(2);             // still open
    expect(r.researchList.length).toBe(2);
    expect(r.researchList.every((i) => i.source === 'snapshot')).toBe(true);
  });

  it('closeAll flushes the whole working set into the list', () => {
    const r = useResearch();
    r.trackVisit({ path: '/news', title: 'News' });
    r.trackVisit({ path: '/feed', title: 'Feed' });
    const n = r.closeAll();
    expect(n).toBe(2);
    expect(r.openTabs.length).toBe(0);
    expect(r.researchList.length).toBe(2);
  });

  it('persists the research list to localStorage across store instances', () => {
    const r1 = useResearch();
    r1.trackVisit({ path: '/map', title: 'Maps' });
    r1.closeTab(r1.openTabs[0].id);
    // New pinia + store instance re-hydrates from localStorage.
    setActivePinia(createPinia());
    const r2 = useResearch();
    expect(r2.researchList.length).toBe(1);
    expect(r2.researchList[0].path).toBe('/map');
  });
});
