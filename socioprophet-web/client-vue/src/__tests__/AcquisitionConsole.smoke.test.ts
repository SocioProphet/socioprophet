/**
 * Smoke tests for the Governed Acquisition console (/data/acquisition) — makes the account-tiered
 * policy gate tangible: flipping the account class re-runs evaluateJob() per source and flips
 * verdicts. Verifies it mounts, renders verdicts, and that commercial (enforced) blocks strictly
 * more than sovereign (advisory).
 */
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AcquisitionConsole from '../pages/AcquisitionConsole.vue';

async function mountConsole() {
  const w = mount(AcquisitionConsole);
  await flushPromises();
  return w;
}

function blockedCount(text: string): number {
  return (text.match(/✕ block/g) || []).length;
}

describe('Governed Acquisition console', () => {
  it('mounts, defaults to advisory, and renders verdicts', async () => {
    const w = await mountConsole();
    const text = w.text();
    expect(text).toContain('Governed Acquisition');
    expect(text).toContain('advisory');
    // advisory allows everything except the-line auth-gated (none in our current catalogue)
    expect(w.findAll('.ac-verdict').length).toBeGreaterThan(0);
  });

  it('flipping to Commercial (enforced) blocks strictly more sources than Sovereign (advisory)', async () => {
    const w = await mountConsole();
    const advisoryBlocks = blockedCount(w.text());

    const buttons = w.findAll('.ac-seg button');
    const commercial = buttons.find((b) => b.text().includes('Commercial'))!;
    await commercial.trigger('click');
    await flushPromises();
    const enforcedBlocks = blockedCount(w.text());

    expect(w.text()).toContain('enforced');
    expect(enforcedBlocks).toBeGreaterThan(advisoryBlocks); // T2+/restricted sources now blocked
  });
});
