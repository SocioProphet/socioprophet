/**
 * Cowork — sovereign collaboration over the WBS. Verifies threads bind to a real
 * WBS subject, participants resolve through HolographMe, and the surface renders
 * with its receipted decision.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { threads, liveToThreads, type LiveThread } from '../data/coworkFixture';
import { allTasks, XSEDE } from '../data/wbsFixture';
import { reputationFor } from '../features/reputation/reputation';
import Cowork from '../pages/Cowork.vue';

describe('cowork — sovereign collaboration over the WBS', () => {
  it('every thread subject is a real WBS task or element (cross-link holds)', () => {
    const taskIds = new Set(allTasks(XSEDE).map((t) => t.id));
    const elementIds = new Set(XSEDE.elements.map((e) => e.id));
    for (const th of threads) {
      const ok = th.subjectKind === 'task' ? taskIds.has(th.subjectRef) : elementIds.has(th.subjectRef);
      expect(ok).toBe(true);
    }
  });

  it('every participant + message author resolves through HolographMe', () => {
    for (const th of threads) {
      for (const p of th.participantRefs) expect(reputationFor(p)).toBeTruthy();
      for (const m of th.messages) expect(reputationFor(m.authorRef)).toBeTruthy();
    }
  });

  it('a decided thread records a decision', () => {
    for (const th of threads) {
      if (th.status === 'decided') expect(th.decision).toBeTruthy();
    }
  });

  it('liveToThreads maps a sovereign room to a thread', () => {
    const rooms: LiveThread[] = [
      { id: 'x1', title: 'T', subject_ref: 't-cee-spoc', messages: [{ id: 'a', author: 'ada.newhope.social', at: '2026-08-01', body: 'hi' }] },
    ];
    const [th] = liveToThreads(rooms);
    expect(th!.subjectRef).toBe('t-cee-spoc');
    expect(th!.messages[0]!.kind).toBe('message');
  });

  it('renders threads with subject, participants, and a receipted decision', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/delivery/cowork');
    await router.isReady();
    const wrapper = mount(Cowork, { global: { plugins: [router] } });
    await flushPromises();
    expect(wrapper.findAll('.cw-row').length).toBe(threads.length);
    expect(wrapper.find('.cw-msg').exists()).toBe(true);
    expect(wrapper.find('.cw-decision').exists()).toBe(true);
    expect(wrapper.text()).toContain('No external chat integration or writeback authority is active');
  });
});
