import type { FeedItem, MembraneDecision } from './types';

export type NewHopeMembraneFixture = {
  eventId: string;
  feedItemRef: string;
  slashTopicRef: string;
  decision: MembraneDecision;
  reason: string;
  evidenceRefs: string[];
  downstreamEligibility: {
    memoryRecall: 'eligible' | 'blocked';
    memoryWriteback: 'reviewOnly' | 'blocked';
    graphView: 'eligible' | 'blocked';
    derivedPublication: 'policyRequired' | 'blocked';
  };
};

export type NewHopeReadOnlyResolverState = {
  enabled: boolean;
  item?: FeedItem;
};

export type NewHopeReadOnlyResolution =
  | {
      status: 'disabled' | 'unresolved';
      membrane?: undefined;
      reason: string;
    }
  | {
      status: 'resolved';
      membrane: NewHopeMembraneFixture;
      reason: string;
    };

export const newHopeMembraneFixtures: NewHopeMembraneFixture[] = [
  {
    eventId: 'newhope-feed-intelligence-001',
    feedItemRef: 'item-001',
    slashTopicRef: '/news/global',
    decision: 'admit',
    reason: 'source-normalized-and-scope-resolved',
    evidenceRefs: ['eventlog://feed.subscribed/001', 'eventlog://item.fetched/001', 'eventlog://item.normalized/001'],
    downstreamEligibility: {
      memoryRecall: 'eligible',
      memoryWriteback: 'reviewOnly',
      graphView: 'eligible',
      derivedPublication: 'policyRequired',
    },
  },
  {
    eventId: 'newhope-feed-intelligence-002',
    feedItemRef: 'item-002',
    slashTopicRef: '/law/regulatory-watch',
    decision: 'hold',
    reason: 'timestamp-and-transform-evidence-incomplete',
    evidenceRefs: ['eventlog://item.fetched/002', 'eventlog://item.normalized/002'],
    downstreamEligibility: {
      memoryRecall: 'blocked',
      memoryWriteback: 'blocked',
      graphView: 'blocked',
      derivedPublication: 'blocked',
    },
  },
  {
    eventId: 'newhope-feed-intelligence-003',
    feedItemRef: 'item-003',
    slashTopicRef: '/capture/browser',
    decision: 'quarantine',
    reason: 'browser-capture-local-review-required',
    evidenceRefs: ['browser.page.captured:fixture-001', 'browser.provenance.attached:fixture-001'],
    downstreamEligibility: {
      memoryRecall: 'blocked',
      memoryWriteback: 'blocked',
      graphView: 'blocked',
      derivedPublication: 'blocked',
    },
  },
  {
    eventId: 'newhope-feed-intelligence-004',
    feedItemRef: 'item-bearbrowser-handoff-fixture-001',
    slashTopicRef: '/capture/browser',
    decision: 'quarantine',
    reason: 'bearbrowser-handoff-fixture-local-only',
    evidenceRefs: ['browser.reader.handoff.requested:fixture-001'],
    downstreamEligibility: {
      memoryRecall: 'blocked',
      memoryWriteback: 'blocked',
      graphView: 'blocked',
      derivedPublication: 'blocked',
    },
  },
];

export function resolveNewHopeMembraneForItem(item: FeedItem): NewHopeMembraneFixture | undefined {
  return newHopeMembraneFixtures.find((event) => event.feedItemRef === item.id);
}

export function resolveNewHopeReadOnlyMembrane(
  state: NewHopeReadOnlyResolverState,
): NewHopeReadOnlyResolution {
  if (!state.enabled) {
    return {
      status: 'disabled',
      reason: 'New Hope read-only membrane resolver is disabled.',
    };
  }

  if (!state.item) {
    return {
      status: 'unresolved',
      reason: 'No Feed Intelligence item was provided for read-only membrane resolution.',
    };
  }

  const membrane = resolveNewHopeMembraneForItem(state.item);

  if (!membrane) {
    return {
      status: 'unresolved',
      reason: 'No fixture New Hope membrane event matched the selected item.',
    };
  }

  return {
    status: 'resolved',
    membrane,
    reason: 'Fixture New Hope membrane resolved in read-only mode.',
  };
}

export function newHopeMembraneBoundaryNotice(): string {
  return 'New Hope membrane resolution is read-only; no live policy mutation, publication, memory writeback, or graph traversal is active.';
}
