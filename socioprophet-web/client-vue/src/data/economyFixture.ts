// Fixture for the Economy Sector Board (/economy/*). UI-only, deterministic series.
// A future macro-data adapter can populate the same Indicator / Sector shapes.
export interface Signal { label: string; tone: 'up' | 'down' | 'neutral' }

export interface Indicator {
  id: string;
  name: string;
  value: number;
  unit: string;            // '%', 'pts', 'k', ''
  changeAbs: number;       // period-over-period change in the unit
  better: 'higher' | 'lower';
  series: number[];
  note: string;
}

export interface Sector {
  id: string;
  name: string;
  breadth: number;         // 0..100 — share of constituents in uptrend
  changePct: number;       // period change
  series: number[];
  signals: Signal[];
}

function hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0; }
function rng(seed: number): () => number { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function walk(seed: string, base: number, vol: number, n = 28): number[] {
  const r = rng(hash(seed));
  const out: number[] = [];
  let p = base;
  let drift = (r() - 0.45) * vol * 0.5;
  for (let i = 0; i < n; i += 1) { p = p * (1 + drift + (r() - 0.5) * vol); if (i % 7 === 0) drift = (r() - 0.45) * vol * 0.5; out.push(+p.toFixed(3)); }
  return out;
}

function ind(id: string, name: string, value: number, unit: string, changeAbs: number, better: 'higher' | 'lower', vol: number, note: string): Indicator {
  return { id, name, value, unit, changeAbs, better, series: walk(id, value || 1, vol), note };
}

export const indicators: Indicator[] = [
  ind('gdp', 'Real GDP (QoQ, ann.)', 2.4, '%', 0.3, 'higher', 0.02, 'Consumption resilient; investment steady.'),
  ind('cpi', 'CPI (YoY)', 3.1, '%', -0.2, 'lower', 0.015, 'Disinflation continuing; services sticky.'),
  ind('corepce', 'Core PCE (YoY)', 2.7, '%', -0.1, 'lower', 0.012, 'Trending toward target.'),
  ind('unemp', 'Unemployment', 4.0, '%', 0.1, 'lower', 0.01, 'Labor market cooling gently.'),
  ind('funds', 'Fed Funds (upper)', 5.25, '%', 0.0, 'lower', 0.004, 'On hold; cut path data-dependent.'),
  ind('pmi', 'ISM Manufacturing', 49.2, 'pts', 0.6, 'higher', 0.01, 'Near expansion threshold.'),
  ind('retail', 'Retail Sales (MoM)', 0.4, '%', 0.2, 'higher', 0.05, 'Consumer spending holding up.'),
  ind('sentiment', 'Consumer Sentiment', 71.5, 'pts', 1.8, 'higher', 0.02, 'Improving on softer inflation.'),
];

export const sectors: Sector[] = [
  { id: 'tech', name: 'Technology', breadth: 74, changePct: 1.2, series: walk('tech', 100, 0.01), signals: [{ label: 'Semis leadership', tone: 'up' }, { label: 'Extended', tone: 'down' }] },
  { id: 'fin', name: 'Financials', breadth: 61, changePct: 0.6, series: walk('fin', 100, 0.008), signals: [{ label: 'Curve steepening', tone: 'up' }] },
  { id: 'energy', name: 'Energy', breadth: 68, changePct: 1.0, series: walk('energy', 100, 0.012), signals: [{ label: 'Supply tightening', tone: 'up' }] },
  { id: 'health', name: 'Health Care', breadth: 52, changePct: -0.2, series: walk('health', 100, 0.007), signals: [{ label: 'Defensive bid', tone: 'neutral' }] },
  { id: 'indu', name: 'Industrials', breadth: 58, changePct: 0.3, series: walk('indu', 100, 0.008), signals: [{ label: 'PMI near 50', tone: 'neutral' }] },
  { id: 'discr', name: 'Consumer Disc.', breadth: 47, changePct: -0.5, series: walk('discr', 100, 0.011), signals: [{ label: 'Rate-sensitive', tone: 'down' }] },
  { id: 'staples', name: 'Consumer Staples', breadth: 44, changePct: -0.3, series: walk('staples', 100, 0.006), signals: [{ label: 'Lagging', tone: 'down' }] },
  { id: 'materials', name: 'Materials', breadth: 55, changePct: 0.4, series: walk('materials', 100, 0.01), signals: [{ label: 'Metals restocking', tone: 'up' }] },
  { id: 'utils', name: 'Utilities', breadth: 39, changePct: -0.6, series: walk('utils', 100, 0.006), signals: [{ label: 'Yield competition', tone: 'down' }] },
  { id: 'reit', name: 'Real Estate', breadth: 41, changePct: -0.4, series: walk('reit', 100, 0.009), signals: [{ label: 'Rate-sensitive', tone: 'down' }] },
  { id: 'comm', name: 'Communication', breadth: 63, changePct: 0.7, series: walk('comm', 100, 0.009), signals: [{ label: 'Ad recovery', tone: 'up' }] },
];

export const asOf = '2026-07-03T14:00:00-04:00';
