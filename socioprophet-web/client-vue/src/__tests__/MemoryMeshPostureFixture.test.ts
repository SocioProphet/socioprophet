import { describe, expect, it } from 'vitest';
import { feedIntelligenceState } from '../features/feed-intelligence/state';
import {
  memoryMeshPostureBoundaryNotice,
  resolveMemoryMeshPostureForItem,
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

  it('states disabled live side effects explicitly', () => {
    expect(memoryMeshPostureBoundaryNotice()).toContain('fixture-only');
    expect(memoryMeshPostureBoundaryNotice()).toContain('display-only');
    expect(memoryMeshPostureBoundaryNotice()).toContain('no live recall');
    expect(memoryMeshPostureBoundaryNotice()).toContain('durable writeback');
    expect(memoryMeshPostureBoundaryNotice()).toContain('raw payload storage');
    expect(memoryMeshPostureBoundaryNotice()).toContain('memory promotion');
  });
});
