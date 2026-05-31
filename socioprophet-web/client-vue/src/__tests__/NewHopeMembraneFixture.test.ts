import { describe, expect, it } from 'vitest';
import { feedIntelligenceState } from '../features/feed-intelligence/state';
import {
  newHopeMembraneBoundaryNotice,
  resolveNewHopeMembraneForItem,
} from '../features/feed-intelligence/newHopeMembrane';

describe('New Hope membrane fixture resolver', () => {
  it('resolves every reader item to a fixture membrane decision', () => {
    for (const item of feedIntelligenceState.items) {
      const membrane = resolveNewHopeMembraneForItem(item);
      expect(membrane).toBeDefined();
      expect(membrane?.decision).toBe(item.membraneDecision);
      expect(membrane?.slashTopicRef).toBe(item.topicScope);
    }
  });

  it('keeps browser capture and handoff items quarantined and blocked downstream', () => {
    const captureItems = feedIntelligenceState.items.filter((item) => item.topicScope === '/capture/browser');

    expect(captureItems.length).toBeGreaterThan(0);

    for (const item of captureItems) {
      const membrane = resolveNewHopeMembraneForItem(item);
      expect(membrane?.decision).toBe('quarantine');
      expect(membrane?.downstreamEligibility.memoryWriteback).toBe('blocked');
      expect(membrane?.downstreamEligibility.graphView).toBe('blocked');
      expect(membrane?.downstreamEligibility.derivedPublication).toBe('blocked');
    }
  });

  it('states disabled live side effects explicitly', () => {
    expect(newHopeMembraneBoundaryNotice()).toContain('fixture-only');
    expect(newHopeMembraneBoundaryNotice()).toContain('no live policy mutation');
    expect(newHopeMembraneBoundaryNotice()).toContain('publication');
    expect(newHopeMembraneBoundaryNotice()).toContain('memory writeback');
    expect(newHopeMembraneBoundaryNotice()).toContain('graph traversal');
  });
});
