// Fixture for the Economy Sector Board (/economy/*). UI-only, deterministic series.
// A future macro-data adapter can populate the same Indicator / Sector shapes.
export interface Signal { label: string; tone: 'up' | 'down' | 'neutral' }

export type EcoGroup =
  | 'macro' | 'micro' | 'labor' | 'industry' | 'farming'
  | 'mining' | 'processing' | 'manufacturing' | 'technology' | 'logistics';

export interface Indicator {
  id: string;
  name: string;
  group: EcoGroup;
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

function ind(id: string, name: string, group: EcoGroup, value: number, unit: string, changeAbs: number, better: 'higher' | 'lower', vol: number, note: string): Indicator {
  return { id, name, group, value, unit, changeAbs, better, series: walk(id, value || 1, vol), note };
}

// Every sub-domain of Economy & Industry gets its own real KPI set (macro first,
// so the dashboard/palette defaults stay macro).
export const indicators: Indicator[] = [
  // Macro
  ind('gdp', 'Real GDP (QoQ, ann.)', 'macro', 2.4, '%', 0.3, 'higher', 0.02, 'Consumption resilient; investment steady.'),
  ind('cpi', 'CPI (YoY)', 'macro', 3.1, '%', -0.2, 'lower', 0.015, 'Disinflation continuing; services sticky.'),
  ind('corepce', 'Core PCE (YoY)', 'macro', 2.7, '%', -0.1, 'lower', 0.012, 'Trending toward target.'),
  ind('unemp', 'Unemployment', 'macro', 4.0, '%', 0.1, 'lower', 0.01, 'Labor market cooling gently.'),
  ind('funds', 'Fed Funds (upper)', 'macro', 5.25, '%', 0.0, 'lower', 0.004, 'On hold; cut path data-dependent.'),
  ind('sentiment', 'Consumer Sentiment', 'macro', 71.5, 'pts', 1.8, 'higher', 0.02, 'Improving on softer inflation.'),
  // Micro
  ind('margin', 'Corporate Profit Margin', 'micro', 11.8, '%', 0.2, 'higher', 0.01, 'Margins holding above trend.'),
  ind('markup', 'Avg Firm Markup', 'micro', 1.34, 'x', 0.01, 'lower', 0.008, 'Pricing power slightly elevated.'),
  ind('hhi', 'Market Concentration (HHI)', 'micro', 1820, 'pts', 35, 'lower', 0.01, 'Concentration creeping up in tech/retail.'),
  ind('entry', 'Firm Entry Rate', 'micro', 9.2, '%', 0.4, 'higher', 0.02, 'Business formation robust.'),
  ind('caputil', 'Capacity Utilization', 'micro', 78.3, '%', -0.3, 'higher', 0.008, 'Slack building modestly.'),
  // Labor
  ind('payrolls', 'Nonfarm Payrolls', 'labor', 206, 'k', -12, 'higher', 0.06, 'Hiring moderating but positive.'),
  ind('earnings', 'Avg Hourly Earnings (YoY)', 'labor', 3.9, '%', -0.1, 'lower', 0.01, 'Wage growth cooling toward 3.5%.'),
  ind('partic', 'Participation Rate', 'labor', 62.6, '%', 0.1, 'higher', 0.004, 'Prime-age participation firm.'),
  ind('jolts', 'Job Openings', 'labor', 8.1, 'M', -0.2, 'higher', 0.02, 'Openings normalizing from peak.'),
  ind('quits', 'Quits Rate', 'labor', 2.2, '%', -0.1, 'higher', 0.01, 'Confidence in switching easing.'),
  // Industry & commerce
  ind('indprod', 'Industrial Production (MoM)', 'industry', 0.4, '%', 0.3, 'higher', 0.02, 'Output rebounding.'),
  ind('retail', 'Retail Sales (MoM)', 'industry', 0.4, '%', 0.2, 'higher', 0.05, 'Consumer spending holding up.'),
  ind('wholesale', 'Wholesale Inventories', 'industry', 0.2, '%', -0.1, 'lower', 0.03, 'Destocking largely complete.'),
  ind('bizform', 'Business Formation', 'industry', 445, 'k', 8, 'higher', 0.02, 'New applications trending up.'),
  ind('trade', 'Trade Balance', 'industry', -68.9, '$B', -2.1, 'higher', 0.03, 'Deficit widening on imports.'),
  // Farming & agriculture
  ind('cropyield', 'Crop Yield Index', 'farming', 104.2, 'pts', 1.6, 'higher', 0.01, 'Favorable growing conditions.'),
  ind('agprices', 'Ag Commodity Prices (YoY)', 'farming', -3.4, '%', -1.2, 'lower', 0.02, 'Grain supply ample; prices soft.'),
  ind('farmincome', 'Net Farm Income', 'farming', 116, '$B', -4, 'higher', 0.03, 'Off cyclical highs.'),
  ind('acreage', 'Planted Acreage', 'farming', 318, 'M', 2, 'higher', 0.006, 'Corn/soy acreage up modestly.'),
  ind('livestock', 'Livestock Index', 'farming', 98.7, 'pts', -0.5, 'higher', 0.01, 'Herd rebuilding slow.'),
  // Mining & extraction
  ind('oreoutput', 'Ore Output Index', 'mining', 101.4, 'pts', 0.9, 'higher', 0.012, 'Copper/iron output steady.'),
  ind('rigcount', 'Active Rig Count', 'mining', 586, 'ct', -7, 'higher', 0.02, 'Discipline keeps rigs flat.'),
  ind('metalsprod', 'Metals Production', 'mining', 103.1, 'pts', 1.2, 'higher', 0.012, 'Electrification demand firm.'),
  ind('reservelife', 'Avg Reserve Life', 'mining', 14.2, 'yrs', -0.3, 'higher', 0.006, 'Depletion outpacing discovery.'),
  ind('extractcost', 'Unit Extraction Cost', 'mining', 1180, '$/t', 22, 'lower', 0.015, 'Cost inflation in labor/energy.'),
  // Processing & refinement
  ind('refutil', 'Refinery Utilization', 'processing', 91.4, '%', 0.8, 'higher', 0.008, 'Run rates seasonally high.'),
  ind('crackspread', 'Crack Spread', 'processing', 24.6, '$/bbl', 1.9, 'higher', 0.03, 'Margins healthy on demand.'),
  ind('smelter', 'Smelter Output', 'processing', 99.8, 'pts', -0.4, 'higher', 0.01, 'Power costs pressure output.'),
  ind('chemprices', 'Chemical Prices (YoY)', 'processing', 1.2, '%', 0.6, 'lower', 0.02, 'Feedstock costs firming.'),
  ind('throughput', 'Processing Throughput', 'processing', 102.6, 'pts', 1.1, 'higher', 0.01, 'Utilization near capacity.'),
  // Manufacturing & assembly
  ind('ism', 'ISM Manufacturing', 'manufacturing', 49.2, 'pts', 0.6, 'higher', 0.01, 'Near expansion threshold.'),
  ind('durables', 'Durable Goods Orders', 'manufacturing', 0.7, '%', 0.9, 'higher', 0.04, 'Ex-transport orders firm.'),
  ind('factcap', 'Factory Capacity Use', 'manufacturing', 77.1, '%', -0.2, 'higher', 0.008, 'Modest slack.'),
  ind('ulc', 'Unit Labor Cost (YoY)', 'manufacturing', 2.1, '%', -0.3, 'lower', 0.015, 'Productivity offsetting wages.'),
  ind('neworders', 'New Orders Index', 'manufacturing', 50.4, 'pts', 1.1, 'higher', 0.012, 'Back above 50.'),
  // Technology & information
  ind('semis', 'Semiconductor Billings', 'technology', 51.2, '$B', 3.4, 'higher', 0.02, 'AI demand driving record billings.'),
  ind('dccapex', 'Data-Center Capex (YoY)', 'technology', 34.0, '%', 6.0, 'higher', 0.03, 'Hyperscaler build-out accelerating.'),
  ind('swspend', 'Software Spend (YoY)', 'technology', 12.4, '%', 0.8, 'higher', 0.015, 'Enterprise IT resilient.'),
  ind('patents', 'Patent Filings', 'technology', 78.6, 'k', 1.9, 'higher', 0.012, 'AI/ML filings surging.'),
  ind('cloud', 'Cloud Revenue Growth', 'technology', 21.5, '%', 1.2, 'higher', 0.02, 'Reacceleration underway.'),
  // Logistics & transport
  ind('freight', 'Freight Rate Index', 'logistics', 112.4, 'pts', 3.1, 'lower', 0.02, 'Rates firming off the trough.'),
  ind('containers', 'Container Spot Rate', 'logistics', 4120, '$', 380, 'lower', 0.04, 'Red Sea reroutes lift rates.'),
  ind('tonnage', 'Truck Tonnage Index', 'logistics', 115.6, 'pts', 0.7, 'higher', 0.012, 'Freight recession easing.'),
  ind('rail', 'Rail Carloads', 'logistics', 231, 'k', -3, 'higher', 0.02, 'Intermodal soft, bulk firm.'),
  ind('ports', 'Port Throughput', 'logistics', 106.2, 'pts', 1.4, 'higher', 0.012, 'Import volumes recovering.'),
];

// path → economic activity group; missing/other paths default to macro.
export const SUBDOMAIN_GROUP: Record<string, EcoGroup> = {
  '/economy/macro-economics': 'macro',
  '/economy/micro-economics': 'micro',
  '/economy/labor-economics': 'labor',
  '/economy/industry-commerce': 'industry',
  '/economy/farming-agriculture': 'farming',
  '/economy/mining-extraction': 'mining',
  '/economy/processing-refinement': 'processing',
  '/economy/manufacturing-assembly': 'manufacturing',
  '/economy/technology-information': 'technology',
  '/economy/logistics-transport': 'logistics',
};

export function indicatorsForPath(path: string): Indicator[] {
  const group = SUBDOMAIN_GROUP[path] ?? 'macro';
  return indicators.filter((i) => i.group === group);
}

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
