import { describe, expect, it } from 'vitest';
import { feedIntelligenceState } from '../features/feed-intelligence/state';
import { resolveSlashTopicScopeForSource } from '../features/feed-intelligence/slashTopicsScope';
import { resolveNewHopeMembraneForItem } from '../features/feed-intelligence/newHopeMembrane';
import { resolveMemoryMeshPostureForItem } from '../features/feed-intelligence/memoryMeshPosture';
import { resolveMeshRushGraphViewForItem } from '../features/feed-intelligence/meshRushGraphView';

describe('Feed Intelligence fixture chain', () => {
  it('resolves every source through SlashTopics fixture scopes', () => {
    for (const source of feedIntelligenceState.sources) {
      expect(resolveSlashTopicScopeForSource(source)?.topic).toBe(source.scope);
    }
  });

  it('resolves every item through membrane and memory posture fixtures', () => {
    for (const item of feedIntelligenceState.items) {
      const membrane = resolveNewHopeMembraneForItem(item);
      const memoryPosture = resolveMemoryMeshPostureForItem(item);

      expect(membrane?.feedItemRef).toBe(item.id);
      expect(membrane?.decision).toBe(item.membraneDecision);
      expect(memoryPosture?.feedItemRef).toBe(item.id);
      expect(memoryPosture?.writebackPolicy.enabled).toBe(false);
      expect(memoryPosture?.recallPolicy.mode).toBe('displayOnly');
    }
  });

  it('keeps graph views advisory when present', () => {
    for (const item of feedIntelligenceState.items) {
      const graphView = resolveMeshRushGraphViewForItem(item);

      if (!graphView) continue;

      expect(graphView.displayMode).toBe('advisoryOnly');
      expect(graphView.boundary.liveTraversalEnabled).toBe(false);
      expect(graphView.boundary.graphPersistenceEnabled).toBe(false);
      expect(graphView.boundary.publicationEnabled).toBe(false);
    }
  });

  it('keeps capture and handoff items quarantined across the fixture chain', () => {
    const captureItems = feedIntelligenceState.items.filter((item) => item.topicScope === '/capture/browser');

    expect(captureItems.length).toBeGreaterThan(0);

    for (const item of captureItems) {
      const membrane = resolveNewHopeMembraneForItem(item);
      const memoryPosture = resolveMemoryMeshPostureForItem(item);
      const graphView = resolveMeshRushGraphViewForItem(item);

      expect(item.storagePolicy).toBe('localOnly');
      expect(membrane?.decision).toBe('quarantine');
      expect(memoryPosture?.writebackPolicy.enabled).toBe(false);
      expect(graphView?.boundary.publicationEnabled).toBe(false);
    }
  });
});
