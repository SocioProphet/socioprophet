import type { FeedItem, StoragePolicy } from './types';

export type BearBrowserProfileClass = 'human' | 'agent' | 'terminal';

export type BearBrowserReaderHandoffFixture = {
  sourceUrl: string;
  canonicalUrl?: string;
  title?: string;
  excerpt?: string;
  contentHash: string;
  capturedAt: string;
  browserProfileClass: BearBrowserProfileClass;
  storagePolicyRequest: StoragePolicy;
  evidenceRefs: string[];
};

export const bearBrowserReaderHandoffFixture: BearBrowserReaderHandoffFixture = {
  sourceUrl: 'https://example.local/sourceos/bearbrowser-capture-demo',
  canonicalUrl: 'local://bearbrowser/captures/feed-intelligence-demo-001',
  title: 'BearBrowser local handoff fixture',
  excerpt:
    'Local-only BearBrowser handoff fixture for the Feed Intelligence reader. This fixture proves mapping shape only and does not activate browser capture, feed fetching, publication, memory writeback, or graph traversal.',
  contentHash: 'sha256:bearbrowser-feed-intelligence-demo-placeholder',
  capturedAt: '2026-05-31T13:42:00Z',
  browserProfileClass: 'human',
  storagePolicyRequest: 'localOnly',
  evidenceRefs: [
    'browser.page.captured:fixture-001',
    'browser.provenance.attached:fixture-001',
    'browser.reader.handoff.requested:fixture-001',
  ],
};

export function mapBearBrowserHandoffToFeedItem(
  handoff: BearBrowserReaderHandoffFixture,
): FeedItem {
  return {
    id: 'item-bearbrowser-handoff-fixture-001',
    sourceId: 'source-bearbrowser-capture',
    title: handoff.title ?? 'Untitled BearBrowser handoff',
    summary: handoff.excerpt ?? 'BearBrowser local handoff fixture with no live adapter behavior.',
    canonicalUrl: handoff.canonicalUrl ?? handoff.sourceUrl,
    publishedAt: handoff.capturedAt,
    normalizedAt: handoff.capturedAt,
    topicScope: '/capture/browser',
    membraneDecision: 'quarantine',
    storagePolicy: handoff.storagePolicyRequest,
    provenanceHash: handoff.contentHash,
    eventRefs: handoff.evidenceRefs,
    entities: ['BearBrowser', 'SourceOS', 'Feed Intelligence'],
    claims: ['browser-handoff-is-local-fixture', 'capture-is-not-publication'],
  };
}

export function bearBrowserHandoffBoundaryNotice(): string {
  return 'BearBrowser handoff is fixture-only; no native browser bridge, network fetch, publication, memory writeback, or graph traversal is active.';
}
