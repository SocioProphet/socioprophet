// Fixture for the Market Monitor (/markets/*). UI-only, deterministic series so
// sparklines are stable across renders. No live quote adapter; a future markets
// feed can populate the same Instrument shape.
export type AssetClass = 'index' | 'equity' | 'rate' | 'fx' | 'crypto' | 'commodity';

export interface Signal { label: string; tone: 'up' | 'down' | 'neutral' }

export interface Instrument {
  symbol: string;
  name: string;
  klass: AssetClass;
  unit: string;            // '', '$', '%', 'pts'
  price: number;
  changePct: number;
  open: number;
  prevClose: number;
  dayLow: number;
  dayHigh: number;
  series: number[];        // ~32 points, oldest → newest
  signals: Signal[];
}

// Deterministic pseudo-random walk seeded by the symbol, so the fixture is stable.
function hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0; }
function rng(seed: number): () => number { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

function make(symbol: string, name: string, klass: AssetClass, base: number, vol: number, unit: string, signals: Signal[]): Instrument {
  const r = rng(hash(symbol));
  const n = 32;
  const series: number[] = [];
  let p = base;
  let drift = (r() - 0.45) * vol * 0.4; // small persistent drift per symbol
  for (let i = 0; i < n; i += 1) {
    p = p * (1 + drift + (r() - 0.5) * vol);
    if (i % 8 === 0) drift = (r() - 0.45) * vol * 0.4;
    series.push(+p.toFixed(p < 10 ? 4 : 2));
  }
  const price = series[n - 1]!;
  const prevClose = series[n - 9] ?? series[0]!;
  const recent = series.slice(-9);
  const round = (x: number) => +x.toFixed(price < 10 ? 4 : 2);
  return {
    symbol, name, klass, unit,
    price: round(price),
    changePct: +(((price - prevClose) / prevClose) * 100).toFixed(2),
    open: round(series[n - 8] ?? prevClose),
    prevClose: round(prevClose),
    dayLow: round(Math.min(...recent)),
    dayHigh: round(Math.max(...recent)),
    series,
    signals,
  };
}

export const indices: Instrument[] = [
  make('SPX', 'S&P 500', 'index', 5460, 0.006, 'pts', [{ label: 'Above 50-DMA', tone: 'up' }, { label: 'Breadth firm', tone: 'up' }]),
  make('IXIC', 'Nasdaq Composite', 'index', 17840, 0.008, 'pts', [{ label: 'Leadership: semis', tone: 'up' }]),
  make('DJI', 'Dow Jones', 'index', 39320, 0.005, 'pts', [{ label: 'Rotational', tone: 'neutral' }]),
  make('VIX', 'Volatility', 'index', 13.2, 0.02, 'pts', [{ label: 'Complacent', tone: 'down' }]),
  make('US10Y', 'US 10Y Yield', 'rate', 4.28, 0.01, '%', [{ label: 'Range-bound', tone: 'neutral' }]),
  make('GOLD', 'Gold', 'commodity', 2338, 0.006, '$', [{ label: 'Restocking bid', tone: 'up' }]),
  make('BTCUSD', 'Bitcoin', 'crypto', 61200, 0.02, '$', [{ label: 'Above prior range', tone: 'up' }]),
];

export const watchlist: Instrument[] = [
  make('AAPL', 'Apple Inc.', 'equity', 214.3, 0.009, '$', [{ label: 'Above 50-DMA', tone: 'up' }, { label: 'RSI 61', tone: 'neutral' }]),
  make('MSFT', 'Microsoft', 'equity', 449.8, 0.008, '$', [{ label: 'New base', tone: 'up' }]),
  make('NVDA', 'NVIDIA', 'equity', 126.4, 0.02, '$', [{ label: 'High beta', tone: 'up' }, { label: 'Extended', tone: 'down' }]),
  make('GOOGL', 'Alphabet', 'equity', 183.6, 0.01, '$', [{ label: 'Coiling', tone: 'neutral' }]),
  make('AMZN', 'Amazon', 'equity', 197.2, 0.011, '$', [{ label: 'Above 50-DMA', tone: 'up' }]),
  make('TSLA', 'Tesla', 'equity', 246.1, 0.024, '$', [{ label: 'Volatile', tone: 'down' }]),
  make('JPM', 'JPMorgan', 'equity', 202.5, 0.008, '$', [{ label: 'Financials firm', tone: 'up' }]),
  make('XOM', 'Exxon Mobil', 'equity', 112.7, 0.009, '$', [{ label: 'Energy leadership', tone: 'up' }]),
  make('EURUSD', 'EUR / USD', 'fx', 1.083, 0.004, '', [{ label: 'Range-bound', tone: 'neutral' }]),
  make('WTI', 'Crude Oil (WTI)', 'commodity', 81.4, 0.012, '$', [{ label: 'Supply tightening', tone: 'up' }]),
  make('ETHUSD', 'Ethereum', 'crypto', 3380, 0.022, '$', [{ label: 'Lagging BTC', tone: 'down' }]),
];

export const asOf = '2026-07-03T14:00:00-04:00';
