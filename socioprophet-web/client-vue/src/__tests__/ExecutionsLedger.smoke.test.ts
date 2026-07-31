/**
 * Smoke test for the Executions Ledger surface.
 * Mounts, renders one row per fixture execution, filters via the DSL, and reveals
 * the warrant (capabilities + decision) on row click.
 */
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHashHistory } from 'vue-router';
import ExecutionsLedger from '../pages/ExecutionsLedger.vue';
import { demoLedger } from '../features/executions-ledger/types';

const stub = { template: '<div />' };
const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: stub }] });
const mountOpts = { global: { plugins: [router] } };

describe('ExecutionsLedger', () => {
  it('renders one row per fixture execution', () => {
    const w = mount(ExecutionsLedger, mountOpts);
    expect(w.findAll('.exec-row').length).toBe(demoLedger.length);
  });

  it('filters via the DSL', async () => {
    const w = mount(ExecutionsLedger, mountOpts);
    await w.find('input.q').setValue('status:verified');
    const expected = demoLedger.filter((r) => r.verdict === 'verified').length;
    expect(w.findAll('.exec-row').length).toBe(expected);
  });

  it('reveals the warrant (capabilities + decision) on row click', async () => {
    const w = mount(ExecutionsLedger, mountOpts);
    const firstWarrant = () => w.findAll('.warrant-row')[0].element as HTMLElement;
    expect(firstWarrant().style.display).toBe('none'); // hidden pre-click (v-show)
    await w.find('.exec-row').trigger('click');
    expect(firstWarrant().style.display).not.toBe('none');
    expect(w.find('.warrant .caps').exists()).toBe(true);
    expect(w.find('.warrant .decision').exists()).toBe(true);
  });

  it('is keyboard-operable: Enter toggles the row', async () => {
    const w = mount(ExecutionsLedger, mountOpts);
    const row = w.find('.exec-row');
    expect(row.attributes('tabindex')).toBe('0');
    const firstWarrant = () => w.findAll('.warrant-row')[0].element as HTMLElement;
    expect(firstWarrant().style.display).toBe('none');
    await row.trigger('keydown.enter');
    expect(firstWarrant().style.display).not.toBe('none');
  });
});
