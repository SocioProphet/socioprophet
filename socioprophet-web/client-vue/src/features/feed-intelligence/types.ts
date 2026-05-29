export type FeedFormat = 'rss' | 'atom' | 'jsonFeed' | 'htmlFallback';

export type StoragePolicy = 'localOnly' | 'localFirstSync' | 'hostedPrivate' | 'hostedPublic' | 'externalAdapter';

export type MembraneDecision = 'admit' | 'hold' | 'quarantine' | 'reject';

export type FeedSource = {
  id: string;
  title: string;
  url: string;
  format: FeedFormat;
  scope: string;
  storagePolicy: StoragePolicy;
  status: 'active' | 'watching' | 'review';
  lastSeen: string;
};

export type FeedItem = {
  id: string;
  sourceId: string;
  title: string;
  summary: string;
  canonicalUrl: string;
  publishedAt: string;
  normalizedAt: string;
  topicScope: string;
  membraneDecision: MembraneDecision;
  storagePolicy: StoragePolicy;
  provenanceHash: string;
  eventRefs: string[];
  entities: string[];
  claims: string[];
};

export type PipelineEvent = {
  id: string;
  type: 'FeedDiscovered' | 'FeedSubscribed' | 'ItemFetched' | 'ItemNormalized' | 'MembraneEvaluated' | 'MemoryProfileResolved' | 'GraphViewPrepared' | 'ViewPublished';
  label: string;
  status: 'complete' | 'active' | 'blocked';
  evidenceRef: string;
};

export type IntegrationSurface = {
  name: string;
  role: string;
  status: 'wired' | 'specified' | 'pending';
  contract: string;
};

export type FeedIntelligenceState = {
  sourceMode: 'fixture';
  generatedAt: string;
  boundaryNotice: string;
  sources: FeedSource[];
  items: FeedItem[];
  events: PipelineEvent[];
  integrations: IntegrationSurface[];
};
