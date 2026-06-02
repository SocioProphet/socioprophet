import { describe, expect, it } from 'vitest';
import { feedIntelligenceState } from '../features/feed-intelligence/state';
import {
  meshRushGraphViewBoundaryNotice,
  resolveMeshRushGraphViewForItem,
  resolveMeshRushReadOnlyGraphView,
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

  it('keeps the read-only graph-view resolver disabled by default', () => {
    const resolution = resolveMeshRushReadOnlyGraphView({ enabled: false });

    expect(resolution.status).toBe('disabled');
    expect(resolution.graphView).toBeUndefined();
    expect(resolution.reason).toContain('disabled');
  });

  it('handles missing item as unresolved without enabling graph behavior', () => {
    const resolution = resolveMeshRushReadOnlyGraphView({ enabled: true });

    expect(resolution.status).toBe('unresolved');
    expect(resolution.graphView).toBeUndefined();
    expect(resolution.reason).toContain('No Feed Intelligence item');
  });

  it('handles unknown item as unresolved', () => {
    const resolution = resolveMeshRushReadOnlyGraphView({
      enabled: true,
      item: {
        ...feedIntelligenceState.items[0],
        id: 'item-unknown',
      },
    });

    expect(resolution.status).toBe('unresolved');
    expect(resolution.graphView).toBeUndefined();
  });

  it('resolves known graph view in read-only display mode', () => {
    const resolution = resolveMeshRushReadOnlyGraphView({
      enabled: true,
      item: feedIntelligenceState.items[0],
    });

    expect(resolution.status).toBe('resolved');
    expect(resolution.graphView?.graphViewId).toBe('graph-view-feed-intelligence-reader-0001');
    expect(resolution.reason).toContain('read-only display mode');
  });

  it('keeps read-only resolved graph effects disabled', () => {
    const graphItems = feedIntelligenceState.items.filter((item) => resolveMeshRushGraphViewForItem(item));

    for (const item of graphItems) {
      const resolution = resolveMeshRushReadOnlyGraphView({ enabled: true, item });
      expect(resolution.status).toBe('resolved');
      expect(resolution.graphView?.displayMode).toBe('advisoryOnly');
      expect(resolution.graphView?.boundary.liveTraversalEnabled).toBe(false);
      expect(resolution.graphView?.boundary.graphPersistenceEnabled).toBe(false);
      expect(resolution.graphView?.boundary.publicationEnabled).toBe(false);
      expect(resolution.graphView?.stopCondition.satisfied).toBe(true);
    }
  });

  it('states disabled live side effects explicitly', () => {
    expect(meshRushGraphViewBoundaryNotice()).toContain('read-only');
    expect(meshRushGraphViewBoundaryNotice()).toContain('advisory-only');
    expect(meshRushGraphViewBoundaryNotice()).toContain('no live traversal');
    expect(meshRushGraphViewBoundaryNotice()).toContain('graph persistence');
    expect(meshRushGraphViewBoundaryNotice()).toContain('publication');
    expect(meshRushGraphViewBoundaryNotice()).toContain('runtime execution');
  });
});
