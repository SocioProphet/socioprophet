/**
 * Verifies the Markets domain renders a REAL per-sub-domain slice, not one
 * shared board: each /markets/<sub-domain> maps to its asset class(es), and the
 * Market Monitor filters its list accordingly.
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';
import { instrumentsForPath, instruments, SUBDOMAIN_CLASSES } from '../data/marketsFixture';
import MarketMonitor from '../pages/MarketMonitor.vue';

describe('markets per-sub-domain slicing', () => {
  it('slices instruments by the sub-domain asset class', () => {
    const crypto = instrumentsForPath('/markets/crypto-digital');
    expect(crypto.length).toBeGreaterThan(0);
    expect(crypto.every((i) => i.klass === 'crypto')).toBe(true);
    expect(crypto.map((i) => i.symbol)).toContain('BTCUSD');

    const eq = instrumentsForPath('/markets/equities-preferreds');
    expect(eq.every((i) => i.klass === 'equity' || i.klass === 'preferred')).toBe(true);
    expect(eq.map((i) => i.symbol)).toContain('AAPL');
    expect(eq.map((i) => i.symbol)).not.toContain('BTCUSD');

    const idx = instrumentsForPath('/markets/indices-funds');
    expect(idx.every((i) => i.klass === 'index')).toBe(true);
  });

  it('covers every markets sub-domain with a non-empty slice', () => {
    for (const path of Object.keys(SUBDOMAIN_CLASSES)) {
      expect(instrumentsForPath(path).length, path).toBeGreaterThan(0);
    }
  });

  it('falls back to the full universe for a non-markets path', () => {
    expect(instrumentsForPath('/capability/portfolios')).toEqual(instruments);
  });

  it('renders the crypto slice (not equities) at the crypto sub-domain', async () => {
    const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }] });
    router.push('/markets/crypto-digital');
    await router.isReady();
    const wrapper = mount(MarketMonitor, { global: { plugins: [router] } });
    await flushPromises();
    const rows = wrapper.findAll('.mk-row').map((r) => r.text());
    expect(rows.join(' ')).toContain('BTCUSD');
    expect(rows.join(' ')).not.toContain('AAPL');
  });
});
