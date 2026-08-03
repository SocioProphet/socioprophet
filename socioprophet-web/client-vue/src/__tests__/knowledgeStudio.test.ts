import { describe, expect, it } from 'vitest';
import {
  lifecycle, nav, documentSets, dictionaries, entityTypes, performance,
  perfGateThreshold, versions, annotationTasks,
} from '../features/knowledge-studio/fixture';
import { registryEntryForPath } from '../config/routeRegistry';

describe('Knowledge Studio', () => {
  it('covers the full Watson Knowledge Studio screen set', () => {
    const ids = nav.flatMap((g) => g.items.map((i) => i.id));
    for (const required of [
      'documents', 'entity-types', 'relation-types', 'dictionaries',
      'rules', 'rule-versions',
      'pre-annotation', 'annotation-tasks', 'performance', 'ml-versions',
      'settings', 'help',
    ]) {
      expect(ids, required).toContain(required);
    }
  });

  it('runs the full ingestion + model lifecycle with a retraining loop', () => {
    const stages = lifecycle.map((s) => s.id);
    expect(stages).toEqual([
      'ideation', 'ingest', 'discover', 'process', 'develop',
      'train', 'evaluate', 'deploy', 'catalog',
    ]);
  });

  it('quarantines any document set lacking a capture receipt', () => {
    for (const d of documentSets) {
      if (!d.captureReceipt.startsWith('sha256:')) {
        expect(d.status, d.name).toBe('quarantined');
      }
    }
  });

  it('never marks an unknown-licence dictionary as usable', () => {
    const unknown = dictionaries.filter((d) => d.licence.startsWith('UNKNOWN'));
    expect(unknown.length).toBeGreaterThan(0);
    for (const d of unknown) expect(d.licence, d.name).toContain('blocked');
  });

  it('fails the gate for every type under threshold — the gate refuses, not warns', () => {
    for (const p of performance) {
      expect(p.gate, p.type).toBe(p.f1 >= perfGateThreshold ? 'pass' : 'fail');
    }
    expect(performance.some((p) => p.gate === 'fail')).toBe(true);
  });

  it('blocks deploy while any type fails the gate', () => {
    const deploy = lifecycle.find((s) => s.id === 'deploy');
    expect(deploy?.state).toBe('blocked');
  });

  it('never claims a signed receipt for a blocked or draft version', () => {
    for (const v of versions) {
      if (v.status === 'blocked' || v.status === 'draft') {
        expect(v.receipt, v.version).toContain('unsigned');
      }
    }
  });

  it('marks derived entity types so they cannot pass as observed facts', () => {
    expect(entityTypes.some((e) => e.valueKind === 'derived')).toBe(true);
  });

  it('surfaces inter-annotator agreement on every adjudicated task', () => {
    for (const t of annotationTasks.filter((x) => x.status === 'adjudicated')) {
      expect(t.agreement, t.name).not.toBeNull();
    }
  });

  it('is registered as a governed route declaring its fixture boundary', () => {
    const entry = registryEntryForPath('/knowledge/studio');
    expect(entry?.stateMode).toBe('fixture');
    expect(entry?.boundary).toContain('no ingestion or promotion authority');
  });
});
