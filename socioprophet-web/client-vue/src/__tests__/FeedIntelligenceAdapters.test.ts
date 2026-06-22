import { describe, expect, it } from 'vitest';
import {
  adapterBoundarySummary,
  allFeedIntelligenceAdaptersDisabled,
  feedIntelligenceAdapters,
} from '../features/feed-intelligence/adapters';

describe('Feed Intelligence disabled adapter seams', () => {
  it('keeps every live adapter disabled by default', () => {
    expect(feedIntelligenceAdapters).toHaveLength(5);
    expect(allFeedIntelligenceAdaptersDisabled()).toBe(true);

    for (const adapter of feedIntelligenceAdapters) {
      expect(adapter.status).toBe('disabled');
      expect(adapter.owningArtifact).toContain(':');
      expect(adapter.disabledReason).toContain('No live');
    }
  });

  it('declares prohibited side effects before any live adapter can be enabled', () => {
    const sideEffects = new Set(feedIntelligenceAdapters.flatMap((adapter) => adapter.forbiddenSideEffects));

    expect(sideEffects).toContain('publication');
    expect(sideEffects).toContain('memory writeback');
    expect(sideEffects).toContain('graph traversal');
    expect(sideEffects).toContain('browser capture');
  });

  it('reports fixture-backed reader posture explicitly', () => {
    expect(adapterBoundarySummary()).toBe(
      'All Feed Intelligence live adapters are disabled; the reader remains fixture-backed.',
    );
  });
});
