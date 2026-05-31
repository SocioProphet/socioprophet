import { describe, expect, it } from 'vitest';
import {
  bearBrowserHandoffBoundaryNotice,
  bearBrowserReaderHandoffFixture,
  mapBearBrowserHandoffToFeedItem,
} from '../features/feed-intelligence/bearbrowserHandoff';

describe('BearBrowser handoff fixture mapping', () => {
  it('maps a local handoff fixture into a quarantined local-only FeedItem', () => {
    const item = mapBearBrowserHandoffToFeedItem(bearBrowserReaderHandoffFixture);

    expect(item.sourceId).toBe('source-bearbrowser-capture');
    expect(item.topicScope).toBe('/capture/browser');
    expect(item.membraneDecision).toBe('quarantine');
    expect(item.storagePolicy).toBe('localOnly');
    expect(item.provenanceHash).toBe(bearBrowserReaderHandoffFixture.contentHash);
    expect(item.eventRefs).toEqual(bearBrowserReaderHandoffFixture.evidenceRefs);
  });

  it('preserves capture is not publication claim boundaries', () => {
    const item = mapBearBrowserHandoffToFeedItem(bearBrowserReaderHandoffFixture);

    expect(item.claims).toContain('browser-handoff-is-local-fixture');
    expect(item.claims).toContain('capture-is-not-publication');
    expect(item.summary).toContain('does not activate browser capture');
  });

  it('states disabled live side effects explicitly', () => {
    expect(bearBrowserHandoffBoundaryNotice()).toContain('fixture-only');
    expect(bearBrowserHandoffBoundaryNotice()).toContain('no native browser bridge');
    expect(bearBrowserHandoffBoundaryNotice()).toContain('memory writeback');
    expect(bearBrowserHandoffBoundaryNotice()).toContain('graph traversal');
  });
});
