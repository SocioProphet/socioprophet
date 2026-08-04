// Per-country data-quality grading — the honest half of the catalogue. For each of the world's
// countries we compute how much real, obtainable data our registered sources actually give us, and
// grade it A–F. This is graphical integrity as a feature (Tufte): the map is mostly NOT green, and
// that's the truth. The US grades A because most of our authoritative feeds are US federal; a
// low-income, lightly-mapped state grades D or F because the only data reaching it is a handful of
// global feeds that thin out there. We say so rather than painting the world uniformly "covered".
import { DATA_SOURCES, type DataSource, type Grade, type CoverageModel } from '../../data/dataSources';
import { COUNTRIES, REGIONS, type Country, type Income, type Region } from '../../data/countries';

// Base weight of a source, from its own honest quality grade.
const GRADE_WEIGHT: Record<Grade, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 };

// Fraction of a source's value that actually reaches a given country, by coverage model × income.
// Physical/geographic truth is near-uniform; media, markets and niche panels thin out in
// lower-income and less-covered countries — which is real, not pessimism.
const COVERAGE: Record<CoverageModel, { us: number; row: Record<Income, number> }> = {
  'us':            { us: 1, row: { H: 0, UM: 0, LM: 0, L: 0 } },
  'us-metros':     { us: 1, row: { H: 0, UM: 0, LM: 0, L: 0 } },
  // Physical/model feeds are genuinely uniform — a satellite sees Chad as well as Germany.
  'geo-global':    { us: 1, row: { H: 1, UM: 0.95, LM: 0.9, L: 0.85 } },
  // OSM completeness is a function of who shows up to map. Rich, urban countries are richly
  // mapped; poor, rural ones are sparse. This tier is where the honest gradient really lives.
  'mapped-global': { us: 1, row: { H: 1, UM: 0.6, LM: 0.35, L: 0.15 } },
  // National statistics track a state's statistical capacity — thin and lagged for low-income.
  'stats-global':  { us: 1, row: { H: 1, UM: 0.75, LM: 0.5, L: 0.3 } },
  'media-global':  { us: 1, row: { H: 1, UM: 0.7, LM: 0.4, L: 0.2 } },
  'markets-global':{ us: 1, row: { H: 1, UM: 0.6, LM: 0.3, L: 0.12 } },
  'sparse-global': { us: 1, row: { H: 0.5, UM: 0.3, LM: 0.15, L: 0.06 } },
  'sovereign':     { us: 0, row: { H: 0, UM: 0, LM: 0, L: 0 } },
};

// A source counts toward country coverage only if the data is actually obtainable for us:
// live (flowing) or fixture (real upstream, adapter pending). Planned sources don't exist for us
// yet; sovereign sources aren't country-indexed. Both are excluded from the country grade.
const gradedSources = DATA_SOURCES.filter((s) => s.status !== 'planned' && s.scope !== 'sovereign');

function fraction(source: DataSource, iso: string, income: Income): number {
  const cov = COVERAGE[source.scope];
  return iso === 'US' ? cov.us : cov.row[income];
}

export interface SourceHit { id: string; name: string; fraction: number; weight: number; grade: Grade; live: boolean }
export interface CountryCoverage {
  iso: string; name: string; region: Region; income: Income;
  grade: Grade; score: number; pct: number;      // pct is relative to the best-covered country
  liveCount: number; totalCount: number;         // sources contributing (live vs. live+fixture)
  hits: SourceHit[];                             // sources that actually reach this country, best first
}

function rawScore(iso: string, income: Income): { score: number; hits: SourceHit[]; liveCount: number } {
  const hits: SourceHit[] = [];
  let score = 0;
  let liveCount = 0;
  for (const s of gradedSources) {
    const f = fraction(s, iso, income);
    if (f <= 0) continue;
    const w = GRADE_WEIGHT[s.grade] * f;
    score += w;
    const live = s.status === 'live';
    if (live) liveCount += 1;
    hits.push({ id: s.id, name: s.name, fraction: f, weight: w, grade: s.grade, live });
  }
  hits.sort((a, b) => b.weight - a.weight);
  return { score, hits, liveCount };
}

// Grade thresholds are relative to the best-covered country (the US), so the scale is honest about
// the ceiling: nobody but the US gets an A, because nobody else has the US federal stack.
function gradeFromPct(pct: number): Grade {
  if (pct >= 0.8) return 'A';   // only the US — the full federal stack
  if (pct >= 0.48) return 'B';  // high-income, richly-mapped states
  if (pct >= 0.32) return 'C';  // upper-middle income
  if (pct >= 0.22) return 'D';  // lower-middle income
  return 'F';                   // low-income / lightly-mapped — the data really is sparse
}

let _cache: CountryCoverage[] | null = null;
export function allCoverage(): CountryCoverage[] {
  if (_cache) return _cache;
  const scored = COUNTRIES.map((c: Country) => ({ c, ...rawScore(c.iso, c.income) }));
  const max = Math.max(...scored.map((s) => s.score)) || 1;
  _cache = scored.map(({ c, score, hits, liveCount }) => {
    const pct = score / max;
    return {
      iso: c.iso, name: c.name, region: c.region, income: c.income,
      grade: gradeFromPct(pct), score: Math.round(score * 10) / 10, pct,
      liveCount, totalCount: hits.length, hits,
    };
  });
  return _cache;
}

export function coverageFor(iso: string): CountryCoverage | undefined {
  return allCoverage().find((c) => c.iso === iso);
}

export interface RegionSummary { region: Region; countries: number; dist: Record<Grade, number>; medianGrade: Grade }
export function regionSummaries(): RegionSummary[] {
  const all = allCoverage();
  return REGIONS.map((region) => {
    const inRegion = all.filter((c) => c.region === region);
    const dist: Record<Grade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const c of inRegion) dist[c.grade] += 1;
    // median grade by ordinal position
    const order: Grade[] = ['A', 'B', 'C', 'D', 'F'];
    const sorted = [...inRegion].sort((a, b) => order.indexOf(a.grade) - order.indexOf(b.grade));
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)].grade : 'F';
    return { region, countries: inRegion.length, dist, medianGrade: median };
  });
}

export interface GradeTally { grade: Grade; count: number }
export function worldGradeDistribution(): GradeTally[] {
  const all = allCoverage();
  const order: Grade[] = ['A', 'B', 'C', 'D', 'F'];
  return order.map((grade) => ({ grade, count: all.filter((c) => c.grade === grade).length }));
}

export const GRADE_LABEL: Record<Grade, string> = {
  A: 'Authoritative', B: 'Strong', C: 'Partial', D: 'Thin', F: 'Sparse',
};
