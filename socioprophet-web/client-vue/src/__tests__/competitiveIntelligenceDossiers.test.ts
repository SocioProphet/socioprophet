import { describe, expect, it } from 'vitest';
import { competitiveIntelligenceState } from '../features/competitive-intelligence/state';
import { dossiers, machineSteps, slugify } from '../features/competitive-intelligence/dossiers';

describe('competitive-intelligence dossiers', () => {
  it('has a dossier for every ranked app', () => {
    const missing = competitiveIntelligenceState.apps
      .filter((app) => !dossiers[slugify(app.name)])
      .map((app) => app.name);
    expect(missing).toEqual([]);
  });

  it('gives every dossier one score per machine step and at least one feature and attack vector', () => {
    for (const [slug, dossier] of Object.entries(dossiers)) {
      expect(dossier.machineScores, slug).toHaveLength(machineSteps.length);
      expect(dossier.features.length, slug).toBeGreaterThan(0);
      expect(dossier.beatThem.length, slug).toBeGreaterThan(0);
      for (const score of dossier.machineScores) {
        expect(score, slug).toBeGreaterThanOrEqual(0);
        expect(score, slug).toBeLessThanOrEqual(100);
      }
    }
  });

  it('produces unique slugs across the catalog', () => {
    const slugs = competitiveIntelligenceState.apps.map((app) => slugify(app.name));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
