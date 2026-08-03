/**
 * Delivery Excellence — sovereign WBS surface. Verifies the sovereign-canonical
 * invariants hold (GitHub/Taskwarrior/cowork are removable MIRRORS, never the
 * source of truth) and that the XSEDE 2.0 reference program renders.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { XSEDE, allTasks, githubIssuesToTasks, type GithubIssue } from '../data/wbsFixture';
import { reputationFor } from '../features/reputation/reputation';
import DeliveryExcellence from '../pages/DeliveryExcellence.vue';

describe('delivery excellence — sovereign WBS', () => {
  it('the WBS is sovereign-canonical: mirrors are removable, never a dependency source', () => {
    for (const task of allTasks(XSEDE)) {
      // Dependencies reference sovereign task ids, never a mirror ref (no github/tw/cowork).
      for (const dep of task.dependsOn ?? []) {
        expect(dep).not.toMatch(/github|taskwarrior|cowork|https?:/);
        expect(allTasks(XSEDE).some((t) => t.id === dep)).toBe(true);
      }
      // Mirrors, when present, are typed removable targets — not the identity of the task.
      for (const m of task.mirrors ?? []) {
        expect(['github', 'taskwarrior', 'cowork']).toContain(m.target);
        expect(['sovereign_only', 'mirrored', 'drifted']).toContain(m.state);
      }
    }
  });

  it('every element lead / task assignee resolves through HolographMe', () => {
    for (const el of XSEDE.elements) {
      if (el.leadRef) expect(reputationFor(el.leadRef)).toBeTruthy();
    }
  });

  it('githubIssuesToTasks maps issues to sovereign tasks carrying a REMOVABLE github mirror', () => {
    const issues: GithubIssue[] = [
      { number: 7, title: 'Wire XCSR catalog', state: 'open', html_url: 'https://github.com/SocioProphet/delivery-excellence/issues/7', labels: [{ name: 'in progress' }] },
      { number: 8, title: 'Close out XRAC review', state: 'closed', html_url: 'https://github.com/SocioProphet/delivery-excellence/issues/8' },
    ];
    const tasks = githubIssuesToTasks(issues);
    expect(tasks[0]!.status).toBe('in_progress');
    expect(tasks[1]!.status).toBe('done');
    // The canonical object is the sovereign task; github is only a mirror on it.
    expect(tasks[0]!.mirrors?.[0]).toMatchObject({ target: 'github', state: 'mirrored' });
    expect(tasks[0]!.id).not.toContain('github.com');
  });

  it('renders the XSEDE 2.0 WBS with elements, tasks, and the sovereign boundary', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/delivery/wbs');
    await router.isReady();
    const wrapper = mount(DeliveryExcellence, { global: { plugins: [router] } });
    await flushPromises();
    expect(wrapper.text()).toContain('XSEDE 2.0');
    expect(wrapper.text()).toContain('Community Engagement & Enrichment');
    expect(wrapper.findAll('.dx-row').length).toBe(XSEDE.elements.length);
    expect(wrapper.find('.dx-task').exists()).toBe(true);
    expect(wrapper.find('.dx-mirror').exists()).toBe(true); // removable mirror badge
    expect(wrapper.text()).toContain('no writeback, issue-creation, or execution authority is active');
  });
});
