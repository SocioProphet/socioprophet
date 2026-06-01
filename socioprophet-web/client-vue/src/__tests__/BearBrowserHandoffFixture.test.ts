import { describe, expect, it } from 'vitest';
import {
  bearBrowserHandoffBoundaryNotice,
  bearBrowserReaderHandoffFixture,
  isBearBrowserReaderHandoffFixture,
  mapBearBrowserHandoffToFeedItem,
  resolveBearBrowserLocalEventHandoff,
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

  it('keeps the local-event handoff adapter disabled by default', () => {
    const resolution = resolveBearBrowserLocalEventHandoff({ enabled: false });

    expect(resolution.status).toBe('disabled');
    expect(resolution.item).toBeUndefined();
    expect(resolution.reason).toContain('disabled');
  });

  it('requires an explicit local payload when enabled', () => {
    const resolution = resolveBearBrowserLocalEventHandoff({ enabled: true });

    expect(resolution.status).toBe('missing');
    expect(resolution.item).toBeUndefined();
  });

  it('rejects invalid local payloads without mapping an item', () => {
    const resolution = resolveBearBrowserLocalEventHandoff({
      enabled: true,
      payload: { sourceUrl: 'local://bad', storagePolicyRequest: 'hostedPublic' },
    });

    expect(resolution.status).toBe('invalid');
    expect(resolution.item).toBeUndefined();
  });

  it('accepts only local-only BearBrowser handoff payloads', () => {
    expect(isBearBrowserReaderHandoffFixture(bearBrowserReaderHandoffFixture)).toBe(true);

    const resolution = resolveBearBrowserLocalEventHandoff({
      enabled: true,
      payload: bearBrowserReaderHandoffFixture,
    });

    expect(resolution.status).toBe('accepted');
    expect(resolution.item?.storagePolicy).toBe('localOnly');
    expect(resolution.item?.membraneDecision).toBe('quarantine');
    expect(resolution.item?.claims).toContain('capture-is-not-publication');
  });

  it('states disabled live side effects explicitly', () => {
    expect(bearBrowserHandoffBoundaryNotice()).toContain('local-event only');
    expect(bearBrowserHandoffBoundaryNotice()).toContain('no native browser bridge');
    expect(bearBrowserHandoffBoundaryNotice()).toContain('memory writeback');
    expect(bearBrowserHandoffBoundaryNotice()).toContain('graph traversal');
  });
});
