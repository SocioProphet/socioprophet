import type { FeedSource } from './types';

export type SlashTopicScopeFixture = {
  scopeId: string;
  topic: string;
  kind: 'feed-intelligence-source' | 'browser-capture-source';
  sourceClass: 'rss' | 'atom' | 'jsonFeed' | 'htmlFallback' | 'bearbrowser-capture';
  publicSurfaceRef: string;
  downstreamMembraneRef: string;
  memoryProfileRef: string;
  graphViewRef: string;
  privacyPosture: string;
  receiptRefs: string[];
};

export type SlashTopicsReadOnlyResolverState = {
  enabled: boolean;
  source?: FeedSource;
};

export type SlashTopicsReadOnlyResolution =
  | {
      status: 'disabled' | 'unresolved';
      scope?: undefined;
      reason: string;
    }
  | {
      status: 'resolved';
      scope: SlashTopicScopeFixture;
      reason: string;
    };

export const slashTopicScopeFixtures: SlashTopicScopeFixture[] = [
  {
    scopeId: 'feed-global-news',
    topic: '/news/global',
    kind: 'feed-intelligence-source',
    sourceClass: 'rss',
    publicSurfaceRef: 'socioprophet-feed-intelligence-reader',
    downstreamMembraneRef: 'new-hope-feed-item-membrane',
    memoryProfileRef: 'memorymesh-feed-intelligence-profile',
    graphViewRef: 'meshrush-feed-item-graph-view',
    privacyPosture: 'public-source-private-annotation',
    receiptRefs: ['feed.subscribed', 'item.fetched', 'item.normalized', 'membrane.evaluated'],
  },
  {
    scopeId: 'feed-regulatory-watch',
    topic: '/law/regulatory-watch',
    kind: 'feed-intelligence-source',
    sourceClass: 'atom',
    publicSurfaceRef: 'socioprophet-feed-intelligence-reader',
    downstreamMembraneRef: 'new-hope-feed-item-membrane',
    memoryProfileRef: 'memorymesh-feed-intelligence-profile',
    graphViewRef: 'meshrush-feed-item-graph-view',
    privacyPosture: 'private-review-before-publication',
    receiptRefs: ['item.fetched', 'item.normalized', 'membrane.evaluated'],
  },
  {
    scopeId: 'feed-browser-capture',
    topic: '/capture/browser',
    kind: 'browser-capture-source',
    sourceClass: 'bearbrowser-capture',
    publicSurfaceRef: 'socioprophet-feed-intelligence-reader',
    downstreamMembraneRef: 'new-hope-feed-item-membrane',
    memoryProfileRef: 'memorymesh-local-only-capture-profile',
    graphViewRef: 'meshrush-feed-item-graph-view',
    privacyPosture: 'local-only-by-default',
    receiptRefs: ['browser.page.captured', 'browser.provenance.attached', 'item.normalized', 'membrane.evaluated'],
  },
];

export function resolveSlashTopicScopeForSource(source: FeedSource): SlashTopicScopeFixture | undefined {
  return slashTopicScopeFixtures.find((scope) => scope.topic === source.scope);
}

export function resolveSlashTopicsReadOnlyScope(
  state: SlashTopicsReadOnlyResolverState,
): SlashTopicsReadOnlyResolution {
  if (!state.enabled) {
    return {
      status: 'disabled',
      reason: 'SlashTopics read-only resolver is disabled.',
    };
  }

  if (!state.source) {
    return {
      status: 'unresolved',
      reason: 'No Feed Intelligence source was provided for read-only scope resolution.',
    };
  }

  const scope = resolveSlashTopicScopeForSource(state.source);

  if (!scope) {
    return {
      status: 'unresolved',
      reason: 'No fixture slash-topic scope matched the source scope.',
    };
  }

  return {
    status: 'resolved',
    scope,
    reason: 'Fixture slash-topic scope resolved in read-only mode.',
  };
}

export function slashTopicScopeBoundaryNotice(): string {
  return 'SlashTopics scope resolution is read-only; no feed fetch, scope mutation, publication, memory writeback, or graph traversal is active.';
}
