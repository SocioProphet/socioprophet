// Acquisition profile per catalogue source — the governed-plane companion to dataSources.ts.
// Each source declares HOW we acquire it (tier) and under what policy (robots/ToS/PII/legal basis),
// from which a compliance grade A–F is derived (features/acquisition/policy.ts). Our current 24 are
// almost all clean public/open feeds acquired at T0/T1 — the "no-key CORS" moat is also a clean
// right-to-acquire. The few licensed/restricted sources grade lower, honestly.
import { type AcquisitionProfile, type SourcePolicy, complianceGrade } from '../features/acquisition/policy';
import type { Grade } from './dataSources';

const PUBLIC: SourcePolicy = { robots: 'allowed', tos: 'public', pii: false, legalBasis: 'public-data' };

// Default: a public T1 fetch (grade A). Only sources that differ are listed explicitly.
const DEFAULT: AcquisitionProfile = { tier: 'T1', policy: PUBLIC, egressDefault: 'direct', freshness: 'varies' };

const PROFILES: Record<string, AcquisitionProfile> = {
  // Official APIs / open data — T0, direct, clean.
  acs: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'annual' },
  fips: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'static' },
  treasury: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'daily' },
  worldbank: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'annual' },
  fedreg: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'daily' },
  quakes: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'live' },
  'nws-alerts': { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'live' },
  weather: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'hourly' },
  aqi: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'hourly' },
  flood: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'quarterly' },
  markets: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'realtime' },
  gdelt: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'live' },
  'hn-news': { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'live' },
  bsky: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'live' },
  wikidata: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'live' },
  labor: { tier: 'T0', policy: PUBLIC, egressDefault: 'direct', freshness: 'daily' },
  // OSM family — T1 over Overpass/Nominatim, ODbL public.
  osm: { tier: 'T1', policy: PUBLIC, egressDefault: 'direct', freshness: 'live' },
  overpass: { tier: 'T1', policy: PUBLIC, egressDefault: 'direct', freshness: 'live' },
  streets: { tier: 'T1', policy: PUBLIC, egressDefault: 'direct', freshness: 'live' },
  geocode: { tier: 'T1', policy: PUBLIC, egressDefault: 'direct', freshness: 'live' },
  transit: { tier: 'T1', policy: PUBLIC, egressDefault: 'direct', freshness: 'live' },
  cowork: { tier: 'T1', policy: PUBLIC, egressDefault: 'direct', freshness: 'live' },
  // Municipal open feeds — public but uneven robots; still A/B.
  crime: { tier: 'T1', policy: { robots: 'allowed', tos: 'public', pii: false, legalBasis: 'public-data' }, egressDefault: 'direct', freshness: 'daily' },
  // Free-tier keyed — public data, needs a key (minted in CI).
  fred: { tier: 'T0', policy: { robots: 'allowed', tos: 'public', pii: false, legalBasis: 'public-data' }, egressDefault: 'direct', freshness: 'monthly' },
  // Legal: CourtListener is a public free-tier API (A); PACER (auth-gated) is out — we take CourtListener only.
  courts: { tier: 'T1', policy: { robots: 'allowed', tos: 'restricted', pii: false, legalBasis: 'public-data' }, egressDefault: 'direct', freshness: 'daily' },
  // Licensed commercial panels — restricted ToS, licensed basis (not scraped).
  mobility: { tier: 'T0', policy: { robots: 'allowed', tos: 'restricted', pii: true, legalBasis: 'licensed' }, egressDefault: 'direct', freshness: 'daily' },
  logistics: { tier: 'T0', policy: { robots: 'allowed', tos: 'restricted', pii: false, legalBasis: 'licensed' }, egressDefault: 'direct', freshness: 'live' },
  // Sovereign — our own governed substrate, direct.
  controlplane: { tier: 'T0', policy: { robots: 'allowed', tos: 'public', pii: false, legalBasis: 'sovereign' }, egressDefault: 'direct', freshness: 'live' },
  hellgraph: { tier: 'T0', policy: { robots: 'allowed', tos: 'public', pii: false, legalBasis: 'sovereign' }, egressDefault: 'direct', freshness: 'live' },
  holographme: { tier: 'T0', policy: { robots: 'allowed', tos: 'public', pii: true, legalBasis: 'consent' }, egressDefault: 'direct', freshness: 'live' },
};

export interface SourceAcquisition { profile: AcquisitionProfile; grade: Grade }

export function acquisitionFor(sourceId: string): SourceAcquisition {
  const profile = PROFILES[sourceId] ?? DEFAULT;
  return { profile, grade: complianceGrade(profile) };
}
