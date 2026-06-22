/**
 * Fixture-backed feed data for the /feed workbench slice.
 *
 * No direct Firestore or production-write path exists here. All data is
 * deterministic and offline-safe. Governance references point to the canonical
 * query-surface topology:
 *  - Slash Topics  → slash-topic-query  (public query / governance adapter)
 *  - New Hope      → newhope-membrane-query  (runtime membrane adapter)
 *  - Memory Mesh   → slash-topic-scoped memory posture for query routing
 */

export type FeedItemGovernance = {
  /** Slash Topics public query surface reference. */
  slashTopicRef: string;
  /** New Hope membrane/runtime state or placeholder. */
  newHopeMembrane: string;
  /** Memory Mesh profile/event reference or placeholder. */
  memoryMeshRef: string;
  /** Evidence / provenance placeholder. */
  evidenceRef: string;
};

export type FeedItem = {
  id: string;
  title: string;
  /** Source hostname or label shown in the card. */
  sourceLabel: string;
  /** Content type classification. */
  contentType: 'article' | 'paper' | 'thread' | 'dataset' | 'report' | 'video';
  /** Slash-topic tag slugs. */
  slashTopics: string[];
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** Fixture-backed upvote count. Upvote is the only vote action; no downvote. */
  upvotes: number;
  governance: FeedItemGovernance;
};

export const FEED_FIXTURES: FeedItem[] = [
  {
    id: 'feed-001',
    title: 'Open-source intelligence tooling for public policy analysis',
    sourceLabel: 'github.com',
    contentType: 'article',
    slashTopics: ['/policy', '/osint', '/governance'],
    createdAt: '2025-04-28T14:22:00Z',
    upvotes: 42,
    governance: {
      slashTopicRef: 'slash-topics#20 · /policy',
      newHopeMembrane: 'newhope-membrane-query · pending',
      memoryMeshRef: 'memory-mesh#15 · /policy posture',
      evidenceRef: 'provenance:feed-001:sha256:fixture',
    },
  },
  {
    id: 'feed-002',
    title: 'Lattice query-surface topology: Slash Topics as governed API surface',
    sourceLabel: 'sociosphere.dev',
    contentType: 'report',
    slashTopics: ['/governance', '/architecture', '/lattice'],
    createdAt: '2025-04-26T09:15:00Z',
    upvotes: 87,
    governance: {
      slashTopicRef: 'slash-topics#20 · /governance',
      newHopeMembrane: 'newhope-membrane-query · active',
      memoryMeshRef: 'memory-mesh#15 · /governance posture',
      evidenceRef: 'provenance:feed-002:sha256:fixture',
    },
  },
  {
    id: 'feed-003',
    title: 'Memory Mesh: slash-topic-scoped posture for query routing',
    sourceLabel: 'memory-mesh.io',
    contentType: 'paper',
    slashTopics: ['/architecture', '/memory', '/lattice'],
    createdAt: '2025-04-25T18:40:00Z',
    upvotes: 31,
    governance: {
      slashTopicRef: 'slash-topics#20 · /architecture',
      newHopeMembrane: 'newhope-membrane-query · active',
      memoryMeshRef: 'memory-mesh#15 · /architecture posture',
      evidenceRef: 'provenance:feed-003:sha256:fixture',
    },
  },
  {
    id: 'feed-004',
    title: 'New Hope membrane adapter: runtime substrate specification',
    sourceLabel: 'new-hope.dev',
    contentType: 'report',
    slashTopics: ['/runtime', '/membrane', '/governance'],
    createdAt: '2025-04-23T11:05:00Z',
    upvotes: 56,
    governance: {
      slashTopicRef: 'slash-topics#20 · /runtime',
      newHopeMembrane: 'newhope-membrane-query · active',
      memoryMeshRef: 'memory-mesh#15 · /runtime posture',
      evidenceRef: 'provenance:feed-004:sha256:fixture',
    },
  },
  {
    id: 'feed-005',
    title: 'Verified crowd-sourced datasets for public-interest journalism',
    sourceLabel: 'datasource.org',
    contentType: 'dataset',
    slashTopics: ['/journalism', '/osint', '/data'],
    createdAt: '2025-04-20T07:30:00Z',
    upvotes: 19,
    governance: {
      slashTopicRef: 'slash-topics#20 · /journalism',
      newHopeMembrane: 'newhope-membrane-query · pending',
      memoryMeshRef: 'memory-mesh#15 · /journalism posture',
      evidenceRef: 'provenance:feed-005:sha256:fixture',
    },
  },
  {
    id: 'feed-006',
    title: 'SocioProphet content aggregation: anti-fake-news provenance model',
    sourceLabel: 'socioprophet.io',
    contentType: 'article',
    slashTopics: ['/policy', '/governance', '/data'],
    createdAt: '2025-04-18T16:00:00Z',
    upvotes: 73,
    governance: {
      slashTopicRef: 'slash-topics#20 · /policy',
      newHopeMembrane: 'newhope-membrane-query · active',
      memoryMeshRef: 'memory-mesh#15 · /policy posture',
      evidenceRef: 'provenance:feed-006:sha256:fixture',
    },
  },
  {
    id: 'feed-007',
    title: 'Video: Governing LLM query surfaces with topic-scoped membranes',
    sourceLabel: 'youtube.com',
    contentType: 'video',
    slashTopics: ['/llm', '/governance', '/lattice'],
    createdAt: '2025-04-15T20:10:00Z',
    upvotes: 28,
    governance: {
      slashTopicRef: 'slash-topics#20 · /llm',
      newHopeMembrane: 'newhope-membrane-query · pending',
      memoryMeshRef: 'memory-mesh#15 · /llm posture',
      evidenceRef: 'provenance:feed-007:sha256:fixture',
    },
  },
  {
    id: 'feed-008',
    title: 'Discussion thread: OSINT tooling + public-interest verification',
    sourceLabel: 'news.ycombinator.com',
    contentType: 'thread',
    slashTopics: ['/osint', '/journalism', '/policy'],
    createdAt: '2025-04-12T13:45:00Z',
    upvotes: 61,
    governance: {
      slashTopicRef: 'slash-topics#20 · /osint',
      newHopeMembrane: 'newhope-membrane-query · pending',
      memoryMeshRef: 'memory-mesh#15 · /osint posture',
      evidenceRef: 'provenance:feed-008:sha256:fixture',
    },
  },
];

/** All distinct slash-topic slugs present in the fixture set. */
export const ALL_SLASH_TOPICS: string[] = Array.from(
  new Set(FEED_FIXTURES.flatMap((item) => item.slashTopics)),
).sort();
