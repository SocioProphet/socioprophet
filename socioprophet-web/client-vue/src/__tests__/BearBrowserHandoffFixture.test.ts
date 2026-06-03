import { describe, expect, it } from 'vitest';
import {
  applyBearBrowserExplicitLocalEventHandoff,
  bearBrowserHandoffBoundaryNotice,
  bearBrowserReaderHandoffFixture,
  isBearBrowserReaderHandoffFixture,
  mapBearBrowserHandoffToFeedItem,
  resolveBearBrowserLocalEventHandoff,
} from '../features/feed-intelligence/bearbrowserHandoff';
import { feedIntelligenceState } from '../features/feed-intelligence/state';

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

  it('keeps explicit local-event adapter disabled without mutating item state', () => {
    const resolution = applyBearBrowserExplicitLocalEventHandoff({
      enabled: false,
      existingItems: feedIntelligenceState.items,
      payload: bearBrowserReaderHandoffFixture,
    });

    expect(resolution.status).toBe('disabled');
    expect(resolution.item).toBeUndefined();
    expect(resolution.items).toEqual(feedIntelligenceState.items);
  });

  it('keeps missing explicit local payload failure-safe', () => {
    const resolution = applyBearBrowserExplicitLocalEventHandoff({
      enabled: true,
      existingItems: feedIntelligenceState.items,
    });

    expect(resolution.status).toBe('missing');
    expect(resolution.item).toBeUndefined();
    expect(resolution.items).toEqual(feedIntelligenceState.items);
  });

  it('keeps invalid explicit local payload failure-safe', () => {
    const resolution = applyBearBrowserExplicitLocalEventHandoff({
      enabled: true,
      existingItems: feedIntelligenceState.items,
      payload: { sourceUrl: 'local://bad', storagePolicyRequest: 'hostedPublic' },
    });

    expect(resolution.status).toBe('invalid');
    expect(resolution.item).toBeUndefined();
    expect(resolution.items).toEqual(feedIntelligenceState.items);
  });

  it('maps an accepted explicit local payload as a local-only quarantined reader item', () => {
    const existingItems = feedIntelligenceState.items.filter((item) => item.id !== 'item-bearbrowser-handoff-fixture-001');

    const resolution = applyBearBrowserExplicitLocalEventHandoff({
      enabled: true,
      existingItems,
      payload: bearBrowserReaderHandoffFixture,
    });

    expect(resolution.status).toBe('accepted');
    expect(resolution.item.storagePolicy).toBe('localOnly');
    expect(resolution.item.membraneDecision).toBe('quarantine');
    expect(resolution.item.claims).toContain('capture-is-not-publication');
    expect(resolution.items).toContainEqual(resolution.item);
  });

  it('upserts accepted explicit local payloads without duplicating reader items', () => {
    const resolution = applyBearBrowserExplicitLocalEventHandoff({
      enabled: true,
      existingItems: feedIntelligenceState.items,
      payload: bearBrowserReaderHandoffFixture,
    });

    const handoffItems = resolution.items.filter((item) => item.id === 'item-bearbrowser-handoff-fixture-001');

    expect(resolution.status).toBe('accepted');
    expect(handoffItems).toHaveLength(1);
  });

  it('states disabled live side effects explicitly', () => {
    expect(bearBrowserHandoffBoundaryNotice()).toContain('explicit-local-event only');
    expect(bearBrowserHandoffBoundaryNotice()).toContain('no native browser bridge');
    expect(bearBrowserHandoffBoundaryNotice()).toContain('memory writeback');
    expect(bearBrowserHandoffBoundaryNotice()).toContain('graph traversal');
  });
});
