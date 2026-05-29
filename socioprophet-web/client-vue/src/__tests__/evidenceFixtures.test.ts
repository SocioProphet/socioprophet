import { describe, expect, it } from 'vitest';
import { nlbootEvidenceState } from '../features/nlboot-evidence/state';
import { sourceOSLifecycleState } from '../features/sourceos-lifecycle/state';

describe('sourceOSLifecycleState', () => {
  it('keeps lifecycle fixture evidence-only and explicit about blocked mutation', () => {
    expect(sourceOSLifecycleState.sourceMode).toBe('fixture');
    expect(sourceOSLifecycleState.boundaryNotice).toContain('does not issue enrollment tokens');
    expect(sourceOSLifecycleState.blocked).toContain('Real Apple Silicon boot-entry changes.');
    expect(sourceOSLifecycleState.lifecycle.some((state) => state.status === 'blocked')).toBe(true);
  });

  it('has matching ReleaseSet and BootReleaseSet evidence rows', () => {
    expect(sourceOSLifecycleState.releaseSetRows.some((row) => row.field === 'releaseSetId')).toBe(true);
    expect(sourceOSLifecycleState.bootReleaseSetRows.some((row) => row.field === 'bootReleaseSetId')).toBe(true);
    expect(sourceOSLifecycleState.evidenceGates.length).toBeGreaterThan(4);
  });
});

describe('nlbootEvidenceState', () => {
  it('keeps boot evidence fixture-only and explicit about no host actions', () => {
    expect(nlbootEvidenceState.sourceMode).toBe('fixture');
    expect(nlbootEvidenceState.boundaryNotice).toContain('does not issue boot commands');
    expect(nlbootEvidenceState.planRecord.some((row) => row.field === 'plan_id')).toBe(true);
    expect(nlbootEvidenceState.bootEntry.some((row) => row.field === 'entry_id')).toBe(true);
  });

  it('records artifact and pre-exec proof posture', () => {
    expect(nlbootEvidenceState.artifactCache.some((artifact) => artifact.status === 'miss')).toBe(true);
    expect(nlbootEvidenceState.preExecProof.some((proof) => proof.result === 'warn')).toBe(true);
    expect(nlbootEvidenceState.recordTypeCount).toBe(6);
  });
});
