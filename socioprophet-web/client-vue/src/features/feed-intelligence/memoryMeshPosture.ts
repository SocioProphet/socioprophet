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

export function memoryMeshPostureBoundaryNotice(): string {
  return 'MemoryMesh posture is fixture-only and display-only; no live recall, durable writeback, raw payload storage, or memory promotion is active.';
}
