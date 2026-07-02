export type FeedIntelligenceAdapterId = 'bearbrowser' | 'slashTopics' | 'newHope' | 'memoryMesh' | 'meshRush';

export type FeedIntelligenceAdapterStatus = 'disabled';

export type FeedIntelligenceAdapterBoundary = {
  id: FeedIntelligenceAdapterId;
  name: string;
  status: FeedIntelligenceAdapterStatus;
  owningArtifact: string;
  disabledReason: string;
  forbiddenSideEffects: string[];
};

export const feedIntelligenceAdapters: FeedIntelligenceAdapterBoundary[] = [
  {
    id: 'bearbrowser',
    name: 'BearBrowser reader bridge',
    status: 'disabled',
    owningArtifact: 'SourceOS-Linux/BearBrowser:docs/reader-bridge.md',
    disabledReason: 'No live native browser bridge adapter is wired in client-vue.',
    forbiddenSideEffects: ['browser capture', 'feed subscription', 'publication'],
  },
  {
    id: 'slashTopics',
    name: 'SlashTopics scope resolver',
    status: 'disabled',
    owningArtifact: 'SocioProphet/slash-topics:examples/feed-intelligence/scope.example.md',
    disabledReason: 'No live scope resolver is wired in client-vue.',
    forbiddenSideEffects: ['feed fetch', 'scope mutation', 'publication'],
  },
  {
    id: 'newHope',
    name: 'New Hope membrane adapter',
    status: 'disabled',
    owningArtifact: 'SocioProphet/new-hope:examples/feed-intelligence/membrane-event.example.md',
    disabledReason: 'No live membrane runtime is wired in client-vue.',
    forbiddenSideEffects: ['policy decision mutation', 'publication', 'memory writeback'],
  },
  {
    id: 'memoryMesh',
    name: 'MemoryMesh posture adapter',
    status: 'disabled',
    owningArtifact: 'SocioProphet/memory-mesh:examples/feed-intelligence/memory-profile.example.md',
    disabledReason: 'No live recall or writeback adapter is wired in client-vue.',
    forbiddenSideEffects: ['memory recall', 'memory writeback', 'raw payload storage'],
  },
  {
    id: 'meshRush',
    name: 'MeshRush graph-view adapter',
    status: 'disabled',
    owningArtifact: 'SocioProphet/meshrush:fixtures/graph-views/feed-intelligence-reader-graph-view.sample.v1.json',
    disabledReason: 'No live graph traversal adapter is wired in client-vue.',
    forbiddenSideEffects: ['graph traversal', 'graph persistence', 'publication'],
  },
];

export function allFeedIntelligenceAdaptersDisabled(): boolean {
  return feedIntelligenceAdapters.every((adapter) => adapter.status === 'disabled');
}

export function adapterBoundarySummary(): string {
  return 'All Feed Intelligence live adapters are disabled; the reader remains fixture-backed.';
}
