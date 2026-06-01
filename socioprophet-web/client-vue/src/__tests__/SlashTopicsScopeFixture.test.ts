import { describe, expect, it } from 'vitest';
import { feedIntelligenceState } from '../features/feed-intelligence/state';
import {
  resolveSlashTopicScopeForSource,
  resolveSlashTopicsReadOnlyScope,
  slashTopicScopeBoundaryNotice,
  slashTopicScopeFixtures,
} from '../features/feed-intelligence/slashTopicsScope';

describe('SlashTopics scope fixture resolver', () => {
  it('resolves every reader source to a fixture slash-topic scope', () => {
    for (const source of feedIntelligenceState.sources) {
      const scope = resolveSlashTopicScopeForSource(source);
      expect(scope).toBeDefined();
      expect(scope?.topic).toBe(source.scope);
      expect(scope?.publicSurfaceRef).toBe('socioprophet-feed-intelligence-reader');
    }
  });

  it('keeps browser capture scoped local-only by default', () => {
    const browserScope = slashTopicScopeFixtures.find((scope) => scope.topic === '/capture/browser');

    expect(browserScope?.kind).toBe('browser-capture-source');
    expect(browserScope?.privacyPosture).toBe('local-only-by-default');
    expect(browserScope?.receiptRefs).toContain('browser.page.captured');
  });

  it('keeps the read-only resolver disabled by default', () => {
    const resolution = resolveSlashTopicsReadOnlyScope({ enabled: false });

    expect(resolution.status).toBe('disabled');
    expect(resolution.scope).toBeUndefined();
    expect(resolution.reason).toContain('disabled');
  });

  it('handles missing source as unresolved without mutating scope state', () => {
    const resolution = resolveSlashTopicsReadOnlyScope({ enabled: true });

    expect(resolution.status).toBe('unresolved');
    expect(resolution.scope).toBeUndefined();
    expect(resolution.reason).toContain('No Feed Intelligence source');
  });

  it('handles unknown source scope as unresolved', () => {
    const resolution = resolveSlashTopicsReadOnlyScope({
      enabled: true,
      source: {
        ...feedIntelligenceState.sources[0],
        id: 'source-unknown',
        scope: '/unknown/scope',
      },
    });

    expect(resolution.status).toBe('unresolved');
    expect(resolution.scope).toBeUndefined();
  });

  it('resolves known source scope in read-only mode', () => {
    const resolution = resolveSlashTopicsReadOnlyScope({
      enabled: true,
      source: feedIntelligenceState.sources[0],
    });

    expect(resolution.status).toBe('resolved');
    expect(resolution.scope?.scopeId).toBe('feed-global-news');
    expect(resolution.reason).toContain('read-only');
  });

  it('states disabled live side effects explicitly', () => {
    expect(slashTopicScopeBoundaryNotice()).toContain('read-only');
    expect(slashTopicScopeBoundaryNotice()).toContain('no feed fetch');
    expect(slashTopicScopeBoundaryNotice()).toContain('scope mutation');
    expect(slashTopicScopeBoundaryNotice()).toContain('memory writeback');
    expect(slashTopicScopeBoundaryNotice()).toContain('graph traversal');
  });
});
