import type { FeedItem } from './types';

export type MemoryMeshPostureFixture = {
  memoryProfileRef: string;
  feedItemRef: string;
  topicScope: string;
  recallPolicy: {
    mode: 'displayOnly';
    sensitivePayloadStorage: 'disallowed';
    includeRawEvents: false;
  };
  writebackPolicy: {
    enabled: false;
    dryRunMode: 'no-writeback';
    allowedMemoryClasses: [];
  };
  redaction: {
    enabled: true;
    redactedFields: string[];
  };
  evidenceRefs: string[];
};

export type MemoryMeshReadOnlyResolverState = {
  enabled: boolean;
  item?: FeedItem;
};

export type MemoryMeshReadOnlyResolution =
  | {
      status: 'disabled' | 'unresolved';
      posture?: undefined;
      reason: string;
    }
  | {
      status: 'resolved';
      posture: MemoryMeshPostureFixture;
      reason: string;
    };

export const memoryMeshPostureFixtures: MemoryMeshPostureFixture[] = [
  {
    memoryProfileRef: 'memorymesh-feed-intelligence-profile',
    feedItemRef: 'item-001',
    topicScope: '/news/global',
    recallPolicy: {
      mode: 'displayOnly',
      sensitivePayloadStorage: 'disallowed',
      includeRawEvents: false,
    },
    writebackPolicy: {
      enabled: false,
      dryRunMode: 'no-writeback',
      allowedMemoryClasses: [],
    },
    redaction: {
      enabled: true,
      redactedFields: ['excerpt', 'annotationBody', 'browserProfileClass'],
    },
    evidenceRefs: ['eventlog://feed.subscribed/001', 'eventlog://item.normalized/001', 'eventlog://newhope.membrane/001'],
  },
  {
    memoryProfileRef: 'memorymesh-feed-intelligence-profile',
    feedItemRef: 'item-002',
    topicScope: '/law/regulatory-watch',
    recallPolicy: {
      mode: 'displayOnly',
      sensitivePayloadStorage: 'disallowed',
      includeRawEvents: false,
    },
    writebackPolicy: {
      enabled: false,
      dryRunMode: 'no-writeback',
      allowedMemoryClasses: [],
    },
    redaction: {
      enabled: true,
      redactedFields: ['excerpt', 'annotationBody', 'browserProfileClass'],
    },
    evidenceRefs: ['eventlog://item.normalized/002', 'eventlog://newhope.membrane/002'],
  },
  {
    memoryProfileRef: 'memorymesh-local-only-capture-profile',
    feedItemRef: 'item-003',
    topicScope: '/capture/browser',
    recallPolicy: {
      mode: 'displayOnly',
      sensitivePayloadStorage: 'disallowed',
      includeRawEvents: false,
    },
    writebackPolicy: {
      enabled: false,
      dryRunMode: 'no-writeback',
      allowedMemoryClasses: [],
    },
    redaction: {
      enabled: true,
      redactedFields: ['excerpt', 'annotationBody', 'browserProfileClass'],
    },
    evidenceRefs: ['browser.page.captured:fixture-001', 'browser.provenance.attached:fixture-001'],
  },
  {
    memoryProfileRef: 'memorymesh-local-only-capture-profile',
    feedItemRef: 'item-bearbrowser-handoff-fixture-001',
    topicScope: '/capture/browser',
    recallPolicy: {
      mode: 'displayOnly',
      sensitivePayloadStorage: 'disallowed',
      includeRawEvents: false,
    },
    writebackPolicy: {
      enabled: false,
      dryRunMode: 'no-writeback',
      allowedMemoryClasses: [],
    },
    redaction: {
      enabled: true,
      redactedFields: ['excerpt', 'annotationBody', 'browserProfileClass'],
    },
    evidenceRefs: ['browser.reader.handoff.requested:fixture-001'],
  },
];

export function resolveMemoryMeshPostureForItem(item: FeedItem): MemoryMeshPostureFixture | undefined {
  return memoryMeshPostureFixtures.find((posture) => posture.feedItemRef === item.id);
}

export function resolveMemoryMeshReadOnlyPosture(
  state: MemoryMeshReadOnlyResolverState,
): MemoryMeshReadOnlyResolution {
  if (!state.enabled) {
    return {
      status: 'disabled',
      reason: 'MemoryMesh read-only posture resolver is disabled.',
    };
  }

  if (!state.item) {
    return {
      status: 'unresolved',
      reason: 'No Feed Intelligence item was provided for read-only memory posture resolution.',
    };
  }

  const posture = resolveMemoryMeshPostureForItem(state.item);

  if (!posture) {
    return {
      status: 'unresolved',
      reason: 'No fixture MemoryMesh posture matched the selected item.',
    };
  }

  return {
    status: 'resolved',
    posture,
    reason: 'Fixture MemoryMesh posture resolved in read-only display mode.',
  };
}

export function memoryMeshPostureBoundaryNotice(): string {
  return 'MemoryMesh posture is read-only and display-only; no live recall, durable writeback, raw payload storage, or memory promotion is active.';
}
