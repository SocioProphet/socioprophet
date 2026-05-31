import { describe, expect, it } from 'vitest';
import { feedIntelligenceState } from '../features/feed-intelligence/state';
import {
  meshRushGraphViewBoundaryNotice,
  resolveMeshRushGraphViewForItem,
} from '../features/feed-intelligence/meshRushGraphView';

describe('MeshRush graph-view fixture resolver', () => {
  it('resolves graph views for graph-eligible and capture fixture items', () => {
    const expectedGraphItems = feedIntelligenceState.items.filter((item) =>
      ['item-001', 'item-003', 'item-bearbrowser-handoff-fixture-001'].includes(item.id),
    );

    for (const item of expectedGraphItems) {
      const graphView = resolveMeshRushGraphViewForItem(item);
      expect(graphView).toBeDefined();
      expect(graphView?.feedItemRef).toBe(item.id);
      expect(graphView?.displayMode).toBe('advisoryOnly');
    }
  });

  it('keeps graph effects disabled for every fixture graph view', () => {
    const graphViews = feedIntelligenceState.items
      .map((item) => resolveMeshRushGraphViewForItem(item))
      .filter(Boolean);

    expect(graphViews.length).toBeGreaterThan(0);

    for (const graphView of graphViews) {
      expect(graphView?.boundary.liveTraversalEnabled).toBe(false);
      expect(graphView?.boundary.graphPersistenceEnabled).toBe(false);
      expect(graphView?.boundary.publicationEnabled).toBe(false);
      expect(graphView?.stopCondition.satisfied).toBe(true);
    }
  });

  it('states disabled live side effects explicitly', () => {
    expect(meshRushGraphViewBoundaryNotice()).toContain('fixture-only');
    expect(meshRushGraphViewBoundaryNotice()).toContain('advisory-only');
    expect(meshRushGraphViewBoundaryNotice()).toContain('no live traversal');
    expect(meshRushGraphViewBoundaryNotice()).toContain('graph persistence');
    expect(meshRushGraphViewBoundaryNotice()).toContain('publication');
    expect(meshRushGraphViewBoundaryNotice()).toContain('runtime execution');
  });
});
