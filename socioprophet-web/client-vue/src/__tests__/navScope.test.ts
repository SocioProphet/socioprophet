import { describe, expect, it } from 'vitest';
import { navScopeForPath } from '../config/cockpitNav';

describe('navScopeForPath', () => {
  it('resolves a DOMAIN sub-domain leaf, flagging the domain landing as primary', () => {
    const federal = navScopeForPath('/law/federal-law');
    expect(federal).toMatchObject({ domain: 'Law & Regulation', label: 'Federal Law', isPrimary: false });

    // The domain's landing leaf (same path as the group) is primary.
    const landing = navScopeForPath('/law/international-law');
    expect(landing?.isPrimary).toBe(true);
  });

  it('resolves a CAPABILITY rail cell as a non-primary lens', () => {
    // Economic Prophet stays rail-only, so it resolves via the CAPABILITY axis.
    // (Portfolios & Algo Trading were intentionally promoted into the Capital & Markets menu.)
    const cap = navScopeForPath('/capability/economic-prophet');
    expect(cap).toMatchObject({ domain: 'Capabilities', label: 'Economic Prophet', isPrimary: false });

    const entity = navScopeForPath('/capability/entity-analytics');
    expect(entity?.label).toBe('Entity Analytics');
  });

  it('returns undefined for a path outside both axes', () => {
    expect(navScopeForPath('/workbench')).toBeUndefined();
    expect(navScopeForPath('/nope')).toBeUndefined();
  });
});
