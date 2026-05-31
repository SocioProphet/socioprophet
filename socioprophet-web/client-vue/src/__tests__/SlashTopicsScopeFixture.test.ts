import { describe, expect, it } from 'vitest';
import { feedIntelligenceState } from '../features/feed-intelligence/state';
import {
  resolveSlashTopicScopeForSource,
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

  it('states disabled live side effects explicitly', () => {
    expect(slashTopicScopeBoundaryNotice()).toContain('fixture-only');
    expect(slashTopicScopeBoundaryNotice()).toContain('no feed fetch');
    expect(slashTopicScopeBoundaryNotice()).toContain('scope mutation');
    expect(slashTopicScopeBoundaryNotice()).toContain('memory writeback');
    expect(slashTopicScopeBoundaryNotice()).toContain('graph traversal');
  });
});
