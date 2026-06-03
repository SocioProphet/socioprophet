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

export type BearBrowserLocalEventAdapterState = {
  enabled: boolean;
  payload?: unknown;
};

export type BearBrowserLocalEventResolution =
  | {
      status: 'disabled' | 'missing' | 'invalid';
      item?: undefined;
      reason: string;
    }
  | {
      status: 'accepted';
      item: FeedItem;
      reason: string;
    };

export type BearBrowserExplicitLocalEventAdapterState = BearBrowserLocalEventAdapterState & {
  existingItems: FeedItem[];
};

export type BearBrowserExplicitLocalEventAdapterResolution =
  | {
      status: 'disabled' | 'missing' | 'invalid';
      item?: undefined;
      items: FeedItem[];
      reason: string;
    }
  | {
      status: 'accepted';
      item: FeedItem;
      items: FeedItem[];
      reason: string;
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

export function resolveBearBrowserLocalEventHandoff(
  state: BearBrowserLocalEventAdapterState,
): BearBrowserLocalEventResolution {
  if (!state.enabled) {
    return {
      status: 'disabled',
      reason: 'BearBrowser local-event handoff adapter is disabled.',
    };
  }

  if (state.payload === undefined || state.payload === null) {
    return {
      status: 'missing',
      reason: 'No explicit local BearBrowser handoff payload was provided.',
    };
  }

  if (!isBearBrowserReaderHandoffFixture(state.payload)) {
    return {
      status: 'invalid',
      reason: 'Local BearBrowser handoff payload failed shape validation.',
    };
  }

  return {
    status: 'accepted',
    item: mapBearBrowserHandoffToFeedItem(state.payload),
    reason: 'Local BearBrowser handoff payload accepted as local-only reader item.',
  };
}

export function applyBearBrowserExplicitLocalEventHandoff(
  state: BearBrowserExplicitLocalEventAdapterState,
): BearBrowserExplicitLocalEventAdapterResolution {
  const resolution = resolveBearBrowserLocalEventHandoff({
    enabled: state.enabled,
    payload: state.payload,
  });

  if (resolution.status !== 'accepted') {
    return {
      status: resolution.status,
      items: [...state.existingItems],
      reason: resolution.reason,
    };
  }

  return {
    status: 'accepted',
    item: resolution.item,
    items: upsertFeedItem(state.existingItems, resolution.item),
    reason:
      'Explicit local BearBrowser handoff payload accepted and mapped in memory as a local-only quarantined reader item.',
  };
}

export function isBearBrowserReaderHandoffFixture(
  value: unknown,
): value is BearBrowserReaderHandoffFixture {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<BearBrowserReaderHandoffFixture>;

  return (
    typeof candidate.sourceUrl === 'string' &&
    typeof candidate.contentHash === 'string' &&
    typeof candidate.capturedAt === 'string' &&
    isBearBrowserProfileClass(candidate.browserProfileClass) &&
    candidate.storagePolicyRequest === 'localOnly' &&
    Array.isArray(candidate.evidenceRefs) &&
    candidate.evidenceRefs.every((ref) => typeof ref === 'string')
  );
}

function upsertFeedItem(items: FeedItem[], item: FeedItem): FeedItem[] {
  return [...items.filter((existingItem) => existingItem.id !== item.id), item];
}

function isBearBrowserProfileClass(value: unknown): value is BearBrowserProfileClass {
  return value === 'human' || value === 'agent' || value === 'terminal';
}

export function bearBrowserHandoffBoundaryNotice(): string {
  return 'BearBrowser handoff is explicit-local-event only; no native browser bridge, network fetch, publication, memory writeback, or graph traversal is active.';
}
