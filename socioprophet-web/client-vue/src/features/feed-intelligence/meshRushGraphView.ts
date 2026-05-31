import type { FeedItem } from './types';

export type MeshRushGraphViewFixture = {
  graphViewId: string;
  feedItemRef: string;
  entryNodeRefs: string[];
  traversedNodeRefs: string[];
  traversedEdgeRefs: string[];
  displayMode: 'advisoryOnly';
  stopCondition: {
    reason: string;
    satisfied: true;
  };
  boundary: {
    liveTraversalEnabled: false;
    graphPersistenceEnabled: false;
    publicationEnabled: false;
  };
};

export const meshRushGraphViewFixtures: MeshRushGraphViewFixture[] = [
  {
    graphViewId: 'graph-view-feed-intelligence-reader-0001',
    feedItemRef: 'item-001',
    entryNodeRefs: ['feed-item:item-001'],
    traversedNodeRefs: ['feed-source:source-global-news', 'feed-item:item-001', 'slash-topic:/news/global', 'newhope-membrane:new-hope-feed-item-membrane', 'memory-profile:memorymesh-feed-intelligence-profile'],
    traversedEdgeRefs: ['edge:feed-source-to-feed-item', 'edge:feed-item-to-slash-topic-scope', 'edge:slash-topic-to-newhope-membrane', 'edge:newhope-membrane-to-memory-profile'],
    displayMode: 'advisoryOnly',
    stopCondition: {
      reason: 'derived-publication-boundary-reached',
      satisfied: true,
    },
    boundary: {
      liveTraversalEnabled: false,
      graphPersistenceEnabled: false,
      publicationEnabled: false,
    },
  },
  {
    graphViewId: 'graph-view-feed-intelligence-browser-capture-0001',
    feedItemRef: 'item-003',
    entryNodeRefs: ['feed-item:item-003'],
    traversedNodeRefs: ['feed-source:source-bearbrowser-capture', 'feed-item:item-003', 'slash-topic:/capture/browser', 'newhope-membrane:new-hope-feed-item-membrane', 'memory-profile:memorymesh-local-only-capture-profile'],
    traversedEdgeRefs: ['edge:feed-source-to-feed-item', 'edge:feed-item-to-slash-topic-scope', 'edge:slash-topic-to-newhope-membrane', 'edge:newhope-membrane-to-memory-profile'],
    displayMode: 'advisoryOnly',
    stopCondition: {
      reason: 'local-capture-boundary-reached',
      satisfied: true,
    },
    boundary: {
      liveTraversalEnabled: false,
      graphPersistenceEnabled: false,
      publicationEnabled: false,
    },
  },
  {
    graphViewId: 'graph-view-feed-intelligence-browser-handoff-0001',
    feedItemRef: 'item-bearbrowser-handoff-fixture-001',
    entryNodeRefs: ['feed-item:item-bearbrowser-handoff-fixture-001'],
    traversedNodeRefs: ['feed-source:source-bearbrowser-capture', 'feed-item:item-bearbrowser-handoff-fixture-001', 'slash-topic:/capture/browser', 'newhope-membrane:new-hope-feed-item-membrane', 'memory-profile:memorymesh-local-only-capture-profile'],
    traversedEdgeRefs: ['edge:feed-source-to-feed-item', 'edge:feed-item-to-slash-topic-scope', 'edge:slash-topic-to-newhope-membrane', 'edge:newhope-membrane-to-memory-profile'],
    displayMode: 'advisoryOnly',
    stopCondition: {
      reason: 'local-handoff-boundary-reached',
      satisfied: true,
    },
    boundary: {
      liveTraversalEnabled: false,
      graphPersistenceEnabled: false,
      publicationEnabled: false,
    },
  },
];

export function resolveMeshRushGraphViewForItem(item: FeedItem): MeshRushGraphViewFixture | undefined {
  return meshRushGraphViewFixtures.find((view) => view.feedItemRef === item.id);
}

export function meshRushGraphViewBoundaryNotice(): string {
  return 'MeshRush graph view is fixture-only and advisory-only; no live traversal, graph persistence, publication, memory writeback, or runtime execution is active.';
}
