import { describe, expect, it } from 'vitest';
import { demoTopology, reachableSet, severResidual, DEMO_SOURCE, DEMO_ALLOW, SELECTIVE_KEEP } from '../features/containment/types';

// The client-side mirror of gbrg-core::containment. Same teeth as the Rust tests:
// a real sever shrinks reachability (Full ⊇ Selective), and a no-op sever contains nothing.
describe('containment sever (client mirror of gbrg-core)', () => {
  it('baseline reaches the whole blast radius', () => {
    expect(reachableSet(demoTopology, DEMO_SOURCE).sort()).toEqual(
      ['dc-01', 'edr-epp', 'file-srv', 'wks-0d06', 'wks-2970'],
    );
  });

  it('full isolation leaves only the allow-listed EDR channel', () => {
    const r = severResidual(demoTopology, DEMO_SOURCE, [DEMO_SOURCE], 'full', SELECTIVE_KEEP, DEMO_ALLOW);
    expect(r.residual).toEqual(['edr-epp']);
    expect(r.contained.sort()).toEqual(['dc-01', 'file-srv', 'wks-0d06', 'wks-2970']);
  });

  it('selective keeps RDP reachable and cuts the SMB chain', () => {
    const r = severResidual(demoTopology, DEMO_SOURCE, [DEMO_SOURCE], 'selective', SELECTIVE_KEEP, DEMO_ALLOW);
    expect(r.residual.sort()).toEqual(['edr-epp', 'wks-0d06']);
    expect(r.contained.sort()).toEqual(['dc-01', 'file-srv', 'wks-2970']);
  });

  it('Full contains strictly more than Selective (teeth)', () => {
    const full = severResidual(demoTopology, DEMO_SOURCE, [DEMO_SOURCE], 'full', SELECTIVE_KEEP, DEMO_ALLOW);
    const sel = severResidual(demoTopology, DEMO_SOURCE, [DEMO_SOURCE], 'selective', SELECTIVE_KEEP, DEMO_ALLOW);
    expect(full.contained.length).toBeGreaterThan(sel.contained.length);
  });

  it('a no-op sever contains nothing (reverse teeth)', () => {
    const r = severResidual(demoTopology, DEMO_SOURCE, [], 'full', SELECTIVE_KEEP, DEMO_ALLOW);
    expect(r.residual).toEqual(r.baseline);
    expect(r.contained).toEqual([]);
  });
});
