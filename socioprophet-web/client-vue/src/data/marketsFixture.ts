// Fixture for the Market Monitor (/markets/*). UI-only, deterministic series so
// sparklines are stable across renders. No live quote adapter; a future markets
// feed can populate the same Instrument shape. Instruments span every asset
// class so each /markets/<sub-domain> renders a real slice, not a shared board.
export type AssetClass =
  | 'index' | 'equity' | 'preferred' | 'bond' | 'rate'
  | 'option' | 'fx' | 'crypto' | 'commodity' | 'real-asset' | 'alt';

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

// Master list — every instrument, tagged by asset class.
export const instruments: Instrument[] = [
  // Indices & funds
  make('SPX', 'S&P 500', 'index', 5460, 0.006, 'pts', [{ label: 'Above 50-DMA', tone: 'up' }, { label: 'Breadth firm', tone: 'up' }]),
  make('IXIC', 'Nasdaq Composite', 'index', 17840, 0.008, 'pts', [{ label: 'Leadership: semis', tone: 'up' }]),
  make('DJI', 'Dow Jones', 'index', 39320, 0.005, 'pts', [{ label: 'Rotational', tone: 'neutral' }]),
  make('RUT', 'Russell 2000', 'index', 2030, 0.009, 'pts', [{ label: 'Small-cap lagging', tone: 'down' }]),
  make('VIX', 'Volatility', 'index', 13.2, 0.02, 'pts', [{ label: 'Complacent', tone: 'down' }]),
  make('SPY', 'SPDR S&P 500 ETF', 'index', 545.2, 0.006, '$', [{ label: 'Tracks SPX', tone: 'neutral' }]),
  make('QQQ', 'Invesco QQQ (Nasdaq-100)', 'index', 478.4, 0.008, '$', [{ label: 'Mega-cap heavy', tone: 'up' }]),
  make('VTI', 'Vanguard Total Market', 'index', 268.1, 0.006, '$', [{ label: 'Broad beta', tone: 'up' }]),

  // Equities
  make('AAPL', 'Apple Inc.', 'equity', 214.3, 0.009, '$', [{ label: 'Above 50-DMA', tone: 'up' }, { label: 'RSI 61', tone: 'neutral' }]),
  make('MSFT', 'Microsoft', 'equity', 449.8, 0.008, '$', [{ label: 'New base', tone: 'up' }]),
  make('NVDA', 'NVIDIA', 'equity', 126.4, 0.02, '$', [{ label: 'High beta', tone: 'up' }, { label: 'Extended', tone: 'down' }]),
  make('GOOGL', 'Alphabet', 'equity', 183.6, 0.01, '$', [{ label: 'Coiling', tone: 'neutral' }]),
  make('AMZN', 'Amazon', 'equity', 197.2, 0.011, '$', [{ label: 'Above 50-DMA', tone: 'up' }]),
  make('META', 'Meta Platforms', 'equity', 502.3, 0.013, '$', [{ label: 'Breakout', tone: 'up' }]),
  make('TSLA', 'Tesla', 'equity', 246.1, 0.024, '$', [{ label: 'Volatile', tone: 'down' }]),
  make('JPM', 'JPMorgan', 'equity', 202.5, 0.008, '$', [{ label: 'Financials firm', tone: 'up' }]),
  make('XOM', 'Exxon Mobil', 'equity', 112.7, 0.009, '$', [{ label: 'Energy leadership', tone: 'up' }]),

  // Preferreds
  make('BAC.PL', 'Bank of America Pfd L', 'preferred', 1204, 0.003, '$', [{ label: '7.25% coupon', tone: 'up' }]),
  make('JPM.PC', 'JPMorgan Pfd C', 'preferred', 25.4, 0.002, '$', [{ label: 'Near par', tone: 'neutral' }]),
  make('WFC.PL', 'Wells Fargo Pfd L', 'preferred', 1288, 0.003, '$', [{ label: 'Rate-sensitive', tone: 'down' }]),
  make('C.PN', 'Citigroup Pfd N', 'preferred', 24.9, 0.002, '$', [{ label: 'Callable 2026', tone: 'neutral' }]),

  // Debt & fixed income (rates + bond funds)
  make('US2Y', 'US 2Y Yield', 'rate', 4.71, 0.008, '%', [{ label: 'Policy-anchored', tone: 'neutral' }]),
  make('US10Y', 'US 10Y Yield', 'rate', 4.28, 0.01, '%', [{ label: 'Range-bound', tone: 'neutral' }]),
  make('US30Y', 'US 30Y Yield', 'rate', 4.44, 0.011, '%', [{ label: 'Curve steepening', tone: 'up' }]),
  make('TLT', 'iShares 20+Y Treasury', 'bond', 94.2, 0.007, '$', [{ label: 'Duration long', tone: 'down' }]),
  make('AGG', 'US Aggregate Bond', 'bond', 98.6, 0.003, '$', [{ label: 'Core ballast', tone: 'neutral' }]),
  make('LQD', 'Investment-Grade Corp', 'bond', 108.9, 0.004, '$', [{ label: 'Spreads tight', tone: 'up' }]),
  make('HYG', 'High-Yield Corp', 'bond', 79.3, 0.006, '$', [{ label: 'Risk-on credit', tone: 'up' }]),

  // Options & derivatives (futures + notable option lines)
  make('ES', 'E-mini S&P Future', 'option', 5461, 0.006, 'pts', [{ label: 'Front month', tone: 'up' }]),
  make('NQ', 'E-mini Nasdaq Future', 'option', 19420, 0.009, 'pts', [{ label: 'Tech beta', tone: 'up' }]),
  make('VX', 'VIX Future (front)', 'option', 14.6, 0.02, 'pts', [{ label: 'Contango', tone: 'down' }]),
  make('CL', 'Crude Future (WTI)', 'option', 81.4, 0.012, '$', [{ label: 'Backwardation', tone: 'up' }]),
  make('SPX-5500C', 'SPX 5500 Call (30d)', 'option', 62.4, 0.05, '$', [{ label: 'Delta 0.42', tone: 'neutral' }]),
  make('SPX-5300P', 'SPX 5300 Put (30d)', 'option', 38.1, 0.06, '$', [{ label: 'Hedge bid', tone: 'down' }]),

  // Currency / FX
  make('EURUSD', 'EUR / USD', 'fx', 1.083, 0.004, '', [{ label: 'Range-bound', tone: 'neutral' }]),
  make('USDJPY', 'USD / JPY', 'fx', 161.2, 0.005, '', [{ label: 'Intervention watch', tone: 'down' }]),
  make('GBPUSD', 'GBP / USD', 'fx', 1.268, 0.004, '', [{ label: 'Firm', tone: 'up' }]),
  make('USDCHF', 'USD / CHF', 'fx', 0.897, 0.003, '', [{ label: 'Haven bid fading', tone: 'neutral' }]),
  make('AUDUSD', 'AUD / USD', 'fx', 0.667, 0.005, '', [{ label: 'Commodity-linked', tone: 'up' }]),
  make('USDCAD', 'USD / CAD', 'fx', 1.366, 0.004, '', [{ label: 'Oil-sensitive', tone: 'neutral' }]),

  // Crypto / digital
  make('BTCUSD', 'Bitcoin', 'crypto', 61200, 0.02, '$', [{ label: 'Above prior range', tone: 'up' }]),
  make('ETHUSD', 'Ethereum', 'crypto', 3380, 0.022, '$', [{ label: 'Lagging BTC', tone: 'down' }]),
  make('SOLUSD', 'Solana', 'crypto', 148.7, 0.03, '$', [{ label: 'High beta', tone: 'up' }]),
  make('XRPUSD', 'XRP', 'crypto', 0.482, 0.028, '$', [{ label: 'Range-bound', tone: 'neutral' }]),
  make('AVAXUSD', 'Avalanche', 'crypto', 27.9, 0.032, '$', [{ label: 'Thin liquidity', tone: 'down' }]),
  make('DOGEUSD', 'Dogecoin', 'crypto', 0.123, 0.035, '$', [{ label: 'Sentiment-driven', tone: 'neutral' }]),

  // Real assets (commodities + real-asset funds)
  make('GOLD', 'Gold', 'commodity', 2338, 0.006, '$', [{ label: 'Restocking bid', tone: 'up' }]),
  make('SILVER', 'Silver', 'commodity', 29.4, 0.012, '$', [{ label: 'Industrial demand', tone: 'up' }]),
  make('WTI', 'Crude Oil (WTI)', 'commodity', 81.4, 0.012, '$', [{ label: 'Supply tightening', tone: 'up' }]),
  make('NATGAS', 'Natural Gas', 'commodity', 2.64, 0.03, '$', [{ label: 'Storage heavy', tone: 'down' }]),
  make('COPPER', 'Copper', 'commodity', 4.52, 0.011, '$', [{ label: 'Electrification bid', tone: 'up' }]),
  make('VNQ', 'US REIT Index', 'real-asset', 88.7, 0.008, '$', [{ label: 'Rate-sensitive', tone: 'down' }]),
  make('DBA', 'Agriculture Basket', 'real-asset', 25.1, 0.009, '$', [{ label: 'Weather premium', tone: 'up' }]),
  make('WOOD', 'Timber & Forestry', 'real-asset', 78.4, 0.007, '$', [{ label: 'Housing-linked', tone: 'neutral' }]),

  // Alternative investments
  make('HFRX', 'HFRX Global Hedge Index', 'alt', 1462, 0.003, 'pts', [{ label: 'Low beta', tone: 'neutral' }]),
  make('PRIVCR', 'Private Credit Index', 'alt', 1189, 0.002, 'pts', [{ label: 'Yield premium', tone: 'up' }]),
  make('MFUT', 'Managed Futures', 'alt', 312, 0.008, 'pts', [{ label: 'Trend-following', tone: 'up' }]),
  make('INFRA', 'Listed Infrastructure', 'alt', 254, 0.006, 'pts', [{ label: 'Inflation hedge', tone: 'up' }]),
  make('VCIDX', 'Venture Capital Index', 'alt', 986, 0.014, 'pts', [{ label: 'Marks lagging', tone: 'down' }]),
];

// Which asset classes each /markets/<sub-domain> surfaces.
export const SUBDOMAIN_CLASSES: Record<string, AssetClass[]> = {
  '/markets/indices-funds': ['index'],
  '/markets/equities-preferreds': ['equity', 'preferred'],
  '/markets/debt-fixed-income': ['bond', 'rate'],
  '/markets/options-derivatives': ['option'],
  '/markets/currency-fx': ['fx'],
  '/markets/crypto-digital': ['crypto'],
  '/markets/real-assets': ['commodity', 'real-asset'],
  '/markets/alternative-investments': ['alt'],
};

export function instrumentsForPath(path: string): Instrument[] {
  const classes = SUBDOMAIN_CLASSES[path];
  return classes ? instruments.filter((i) => classes.includes(i.klass)) : instruments;
}

// Broad-market tape / default landing indicators.
export const indices: Instrument[] = instruments.filter((i) => i.klass === 'index');
// Everything else — kept for the ticker tape + command palette symbol search.
export const watchlist: Instrument[] = instruments.filter((i) => i.klass !== 'index');

export const asOf = '2026-07-03T14:00:00-04:00';
