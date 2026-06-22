import { describe, expect, it } from 'vitest';
import { feedIntelligenceState } from '../features/feed-intelligence/state';
import {
  newHopeMembraneBoundaryNotice,
  resolveNewHopeMembraneForItem,
  resolveNewHopeReadOnlyMembrane,
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

  it('keeps the read-only membrane resolver disabled by default', () => {
    const resolution = resolveNewHopeReadOnlyMembrane({ enabled: false });

    expect(resolution.status).toBe('disabled');
    expect(resolution.membrane).toBeUndefined();
    expect(resolution.reason).toContain('disabled');
  });

  it('handles missing item as unresolved without mutating policy state', () => {
    const resolution = resolveNewHopeReadOnlyMembrane({ enabled: true });

    expect(resolution.status).toBe('unresolved');
    expect(resolution.membrane).toBeUndefined();
    expect(resolution.reason).toContain('No Feed Intelligence item');
  });

  it('handles unknown item as unresolved', () => {
    const resolution = resolveNewHopeReadOnlyMembrane({
      enabled: true,
      item: {
        ...feedIntelligenceState.items[0],
        id: 'item-unknown',
      },
    });

    expect(resolution.status).toBe('unresolved');
    expect(resolution.membrane).toBeUndefined();
  });

  it('resolves known item membrane in read-only mode', () => {
    const resolution = resolveNewHopeReadOnlyMembrane({
      enabled: true,
      item: feedIntelligenceState.items[0],
    });

    expect(resolution.status).toBe('resolved');
    expect(resolution.membrane?.eventId).toBe('newhope-feed-intelligence-001');
    expect(resolution.reason).toContain('read-only');
  });

  it('does not promote guarded or blocked capture states', () => {
    const captureItems = feedIntelligenceState.items.filter((item) => item.topicScope === '/capture/browser');

    for (const item of captureItems) {
      const resolution = resolveNewHopeReadOnlyMembrane({ enabled: true, item });
      expect(resolution.status).toBe('resolved');
      expect(resolution.membrane?.decision).toBe('quarantine');
      expect(resolution.membrane?.downstreamEligibility.memoryWriteback).toBe('blocked');
      expect(resolution.membrane?.downstreamEligibility.graphView).toBe('blocked');
      expect(resolution.membrane?.downstreamEligibility.derivedPublication).toBe('blocked');
    }
  });

  it('states disabled live side effects explicitly', () => {
    expect(newHopeMembraneBoundaryNotice()).toContain('read-only');
    expect(newHopeMembraneBoundaryNotice()).toContain('no live policy mutation');
    expect(newHopeMembraneBoundaryNotice()).toContain('publication');
    expect(newHopeMembraneBoundaryNotice()).toContain('memory writeback');
    expect(newHopeMembraneBoundaryNotice()).toContain('graph traversal');
  });
});
