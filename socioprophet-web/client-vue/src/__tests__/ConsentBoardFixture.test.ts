import { describe, expect, it } from 'vitest';
import { demoConsentSnapshot } from '../services/consentApi';

// The consent fixture must be honest: self-sovereign, and everything OFF by default.
describe('demoConsentSnapshot', () => {
  const snap = demoConsentSnapshot();

  it('is self-sovereign (subject == collector)', () => {
    expect(snap.collectorPrincipal).toBe(snap.subjectPrincipal);
  });

  it('has every telemetry surface off (denied) by default', () => {
    for (const s of snap.surfaces) {
      expect(s.consent.state).toBe('denied');
      expect(s.effectiveMode).toBe('off');
    }
  });

  it('has every capability off and disabled by default', () => {
    for (const c of snap.capabilities) {
      expect(c.consent?.state).toBe('denied');
      expect(c.defaultState).toBe('disabled');
    }
  });

  it('marks per-use capabilities one-shot (non-persistable)', () => {
    for (const c of snap.capabilities) {
      if (c.defaultStandard === 'per-use') expect(c.oneShot).toBe(true);
    }
  });

  it('gives every surface and capability a non-trivial explanation', () => {
    for (const s of snap.surfaces) expect(s.explanation.length).toBeGreaterThan(11);
    for (const c of snap.capabilities) expect(c.explanation.length).toBeGreaterThan(11);
  });
});
