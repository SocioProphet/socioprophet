import { describe, expect, it } from 'vitest';
import { feedIntelligenceState } from '../features/feed-intelligence/state';
import {
  memoryMeshPostureBoundaryNotice,
  resolveMemoryMeshPostureForItem,
  resolveMemoryMeshReadOnlyPosture,
} from '../features/feed-intelligence/memoryMeshPosture';

describe('MemoryMesh posture fixture resolver', () => {
  it('resolves every reader item to a fixture memory posture', () => {
    for (const item of feedIntelligenceState.items) {
      const posture = resolveMemoryMeshPostureForItem(item);
      expect(posture).toBeDefined();
      expect(posture?.feedItemRef).toBe(item.id);
      expect(posture?.topicScope).toBe(item.topicScope);
    }
  });

  it('keeps recall display-only with raw payload storage disallowed', () => {
    for (const item of feedIntelligenceState.items) {
      const posture = resolveMemoryMeshPostureForItem(item);
      expect(posture?.recallPolicy.mode).toBe('displayOnly');
      expect(posture?.recallPolicy.sensitivePayloadStorage).toBe('disallowed');
      expect(posture?.recallPolicy.includeRawEvents).toBe(false);
    }
  });

  it('keeps durable writeback disabled for every item', () => {
    for (const item of feedIntelligenceState.items) {
      const posture = resolveMemoryMeshPostureForItem(item);
      expect(posture?.writebackPolicy.enabled).toBe(false);
      expect(posture?.writebackPolicy.dryRunMode).toBe('no-writeback');
      expect(posture?.writebackPolicy.allowedMemoryClasses).toEqual([]);
    }
  });

  it('keeps the read-only posture resolver disabled by default', () => {
    const resolution = resolveMemoryMeshReadOnlyPosture({ enabled: false });

    expect(resolution.status).toBe('disabled');
    expect(resolution.posture).toBeUndefined();
    expect(resolution.reason).toContain('disabled');
  });

  it('handles missing item as unresolved without enabling memory behavior', () => {
    const resolution = resolveMemoryMeshReadOnlyPosture({ enabled: true });

    expect(resolution.status).toBe('unresolved');
    expect(resolution.posture).toBeUndefined();
    expect(resolution.reason).toContain('No Feed Intelligence item');
  });

  it('handles unknown item as unresolved', () => {
    const resolution = resolveMemoryMeshReadOnlyPosture({
      enabled: true,
      item: {
        ...feedIntelligenceState.items[0],
        id: 'item-unknown',
      },
    });

    expect(resolution.status).toBe('unresolved');
    expect(resolution.posture).toBeUndefined();
  });

  it('resolves known item posture in read-only display mode', () => {
    const resolution = resolveMemoryMeshReadOnlyPosture({
      enabled: true,
      item: feedIntelligenceState.items[0],
    });

    expect(resolution.status).toBe('resolved');
    expect(resolution.posture?.memoryProfileRef).toBe('memorymesh-feed-intelligence-profile');
    expect(resolution.reason).toContain('read-only display mode');
  });

  it('keeps read-only resolved posture writeback disabled', () => {
    for (const item of feedIntelligenceState.items) {
      const resolution = resolveMemoryMeshReadOnlyPosture({ enabled: true, item });
      expect(resolution.status).toBe('resolved');
      expect(resolution.posture?.writebackPolicy.enabled).toBe(false);
      expect(resolution.posture?.writebackPolicy.dryRunMode).toBe('no-writeback');
      expect(resolution.posture?.recallPolicy.sensitivePayloadStorage).toBe('disallowed');
    }
  });

  it('states disabled live side effects explicitly', () => {
    expect(memoryMeshPostureBoundaryNotice()).toContain('read-only');
    expect(memoryMeshPostureBoundaryNotice()).toContain('display-only');
    expect(memoryMeshPostureBoundaryNotice()).toContain('no live recall');
    expect(memoryMeshPostureBoundaryNotice()).toContain('durable writeback');
    expect(memoryMeshPostureBoundaryNotice()).toContain('raw payload storage');
    expect(memoryMeshPostureBoundaryNotice()).toContain('memory promotion');
  });
});
