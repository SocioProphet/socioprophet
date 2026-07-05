// Fixture for the Weather & Natural Resources monitor (/weather/forecast).
// UI-only, deterministic. A future weather/hazard data adapter can populate the
// same Region / DayForecast / Alert shapes. Timelines are the focus (per template).
export type Condition = 'sun' | 'cloud' | 'rain' | 'storm' | 'snow' | 'heat';
export interface DayForecast { day: string; hi: number; lo: number; precip: number; cond: Condition }
export interface Region {
  id: string;
  name: string;
  country: string;
  tempF: number;
  cond: Condition;
  changeF: number;      // vs yesterday
  windMph: number;
  humidity: number;
  series: number[];     // recent temp trend (hourly)
  forecast: DayForecast[];
}
export type Severity = 'advisory' | 'watch' | 'warning';
export interface Alert { id: string; regionId: string; type: string; severity: Severity; headline: string; until: string; resource?: string }

function hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0; }
function rng(seed: number): () => number { let x = seed >>> 0 || 1; return () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296; }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function build(id: string, name: string, country: string, base: number, cond: Condition, windMph: number, humidity: number, conds: Condition[]): Region {
  const r = rng(hash(id));
  const series: number[] = [];
  let t = base;
  for (let i = 0; i < 24; i += 1) { t += (r() - 0.5) * 3; series.push(Math.round(t)); }
  const forecast: DayForecast[] = DAYS.map((day, i) => {
    const hi = Math.round(base + (r() - 0.4) * 8);
    const lo = Math.round(hi - 8 - r() * 6);
    return { day, hi, lo, precip: Math.round(r() * 100), cond: conds[i % conds.length]! };
  });
  return { id, name, country, tempF: Math.round(series[series.length - 1]!), cond, changeF: Math.round((r() - 0.5) * 8), windMph, humidity, series, forecast };
}

export const regions: Region[] = [
  build('dc', 'Washington', 'US', 91, 'heat', 6, 58, ['heat', 'sun', 'storm', 'sun', 'cloud', 'sun', 'heat']),
  build('nyc', 'New York', 'US', 84, 'storm', 14, 71, ['storm', 'rain', 'cloud', 'sun', 'sun', 'cloud', 'rain']),
  build('bru', 'Brussels', 'BE', 66, 'rain', 11, 78, ['rain', 'cloud', 'rain', 'sun', 'cloud', 'rain', 'cloud']),
  build('sto', 'Stockholm', 'SE', 61, 'cloud', 22, 64, ['cloud', 'sun', 'cloud', 'rain', 'sun', 'sun', 'cloud']),
  build('amm', 'Amman', 'JO', 97, 'sun', 9, 22, ['sun', 'heat', 'sun', 'sun', 'heat', 'sun', 'sun']),
  build('sin', 'Singapore', 'SG', 88, 'storm', 8, 84, ['storm', 'rain', 'storm', 'rain', 'cloud', 'storm', 'rain']),
  // Supply-chain-relevant hubs (mines, fabs, ports) so weather ties to the chains.
  build('anf', 'Antofagasta', 'CL', 63, 'sun', 14, 42, ['sun', 'cloud', 'sun', 'sun', 'cloud', 'sun', 'sun']),
  build('tpe', 'Hsinchu / Taipei', 'TW', 84, 'storm', 12, 82, ['storm', 'rain', 'cloud', 'sun', 'storm', 'rain', 'cloud']),
  build('sha', 'Shanghai', 'CN', 86, 'cloud', 10, 76, ['cloud', 'storm', 'rain', 'sun', 'cloud', 'sun', 'rain']),
];

export const alerts: Alert[] = [
  { id: 'a1', regionId: 'dc', type: 'Heat Advisory', severity: 'advisory', headline: 'Heat index up to 104°F this afternoon; limit outdoor exposure.', until: 'until 8 PM' },
  { id: 'a2', regionId: 'nyc', type: 'Coastal Flood Watch', severity: 'watch', headline: 'Minor tidal flooding possible around evening high tide.', until: 'until 11 PM' },
  { id: 'a3', regionId: 'sto', type: 'Wind Warning', severity: 'warning', headline: 'Gusts to 55 mph; secure loose objects, expect transit delays.', until: 'until 6 AM' },
  { id: 'a4', regionId: 'amm', type: 'Drought — Water Stress', severity: 'warning', headline: 'Reservoir levels 22% below seasonal norm; conservation in effect.', until: 'ongoing', resource: 'Water' },
  { id: 'a5', regionId: 'sin', type: 'Thunderstorm', severity: 'advisory', headline: 'Frequent lightning and heavy downpours through the afternoon.', until: 'until 5 PM' },
  { id: 'a6', regionId: 'dc', type: 'Grid Load — Peak Demand', severity: 'watch', headline: 'Peak electricity demand expected 4–7 PM amid the heat.', until: 'until 7 PM', resource: 'Energy' },
];

export const asOf = '2026-07-04T00:40:00-04:00';
