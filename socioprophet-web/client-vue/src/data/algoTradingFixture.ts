// Deterministic, fixture-backed algorithmic-trading strategies for the
// /capability/algorithmic-trading surface. No live broker, quote feed, or order
// routing — every number is a replayable fixture so a live strategy/backtest
// adapter can swap in behind the same shape later.

export interface Signal { label: string; tone: 'up' | 'down' | 'neutral' }
export type StrategyClass = 'momentum' | 'mean-reversion' | 'trend' | 'market-neutral' | 'stat-arb';
export type StrategyStatus = 'live' | 'paper' | 'backtest' | 'halted';

export interface Fill {
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  pnlPct: number; // realized/mark P&L on the position, %
  time: string; // ISO
}

export interface Strategy {
  id: string;
  name: string;
  klass: StrategyClass;
  status: StrategyStatus;
  universe: string;
  returnPct: number; // annualized, %
  sharpe: number;
  maxDrawdownPct: number; // negative
  winRatePct: number;
  trades: number; // count over the window
  exposurePct: number; // gross exposure of NAV
  equity: number[]; // equity curve (base 100), oldest → newest
  signals: Signal[];
  fills: Fill[];
  note: string;
}

// Deterministic equity curve: base 100, drifts by `drift` with `vol` noise
// seeded off the strategy index so renders are stable.
function curve(seed: number, drift: number, vol: number, n = 40): number[] {
  const out: number[] = [];
  let v = 100;
  let x = seed * 1000 + 7;
  for (let i = 0; i < n; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    const r = (x / 0x7fffffff) * 2 - 1; // -1..1
    v = v * (1 + drift + r * vol);
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}

export const strategies: Strategy[] = [
  {
    id: 'mom-semis',
    name: 'Semis Momentum',
    klass: 'momentum',
    status: 'live',
    universe: 'US semiconductors',
    returnPct: 28.4,
    sharpe: 1.92,
    maxDrawdownPct: -8.1,
    winRatePct: 61,
    trades: 214,
    exposurePct: 96,
    equity: curve(1, 0.006, 0.012),
    signals: [{ label: 'Leadership: semis', tone: 'up' }, { label: 'Breadth firm', tone: 'up' }],
    fills: [
      { symbol: 'NVDA', side: 'buy', qty: 120, price: 1184.2, pnlPct: 3.4, time: '2026-07-03T18:12:00Z' },
      { symbol: 'AMD', side: 'buy', qty: 300, price: 168.9, pnlPct: 1.1, time: '2026-07-03T17:40:00Z' },
      { symbol: 'AVGO', side: 'sell', qty: 40, price: 1662.0, pnlPct: -0.7, time: '2026-07-03T15:05:00Z' },
    ],
    note: 'Cross-sectional momentum over a 20/60-day lookback; rebalances daily, caps single-name at 12%.',
  },
  {
    id: 'mr-rates',
    name: 'Rates Mean-Reversion',
    klass: 'mean-reversion',
    status: 'live',
    universe: 'UST futures 2s/10s',
    returnPct: 11.2,
    sharpe: 1.34,
    maxDrawdownPct: -4.6,
    winRatePct: 68,
    trades: 512,
    exposurePct: 140,
    equity: curve(2, 0.0028, 0.006),
    signals: [{ label: 'Curve range-bound', tone: 'neutral' }, { label: 'Carry positive', tone: 'up' }],
    fills: [
      { symbol: 'ZN', side: 'buy', qty: 25, price: 110.9, pnlPct: 0.4, time: '2026-07-03T19:01:00Z' },
      { symbol: 'ZT', side: 'sell', qty: 60, price: 103.2, pnlPct: 0.2, time: '2026-07-03T18:22:00Z' },
    ],
    note: 'Fades 2s/10s deviations from a Kalman-filtered fair value; hard stop at 2.5σ.',
  },
  {
    id: 'tr-macro',
    name: 'Cross-Asset Trend',
    klass: 'trend',
    status: 'paper',
    universe: 'Global futures (28 mkts)',
    returnPct: 9.8,
    sharpe: 0.88,
    maxDrawdownPct: -14.3,
    winRatePct: 44,
    trades: 96,
    exposurePct: 220,
    equity: curve(3, 0.0022, 0.017),
    signals: [{ label: 'Equity trend up', tone: 'up' }, { label: 'FX chop', tone: 'down' }],
    fills: [
      { symbol: 'ES', side: 'buy', qty: 10, price: 5461.0, pnlPct: 2.0, time: '2026-07-03T16:30:00Z' },
      { symbol: 'CL', side: 'sell', qty: 15, price: 81.4, pnlPct: -1.3, time: '2026-07-03T14:10:00Z' },
    ],
    note: 'Classic time-series momentum (1/3/12-month), vol-targeted to 12% annualized. Paper until live-risk sign-off.',
  },
  {
    id: 'mn-pairs',
    name: 'Equity Market-Neutral',
    klass: 'market-neutral',
    status: 'live',
    universe: 'S&P 500 pairs',
    returnPct: 7.1,
    sharpe: 1.56,
    maxDrawdownPct: -3.2,
    winRatePct: 57,
    trades: 1840,
    exposurePct: 180,
    equity: curve(4, 0.0018, 0.004),
    signals: [{ label: 'Dispersion elevated', tone: 'up' }, { label: 'Beta ~0.0', tone: 'neutral' }],
    fills: [
      { symbol: 'KO/PEP', side: 'buy', qty: 500, price: 0.98, pnlPct: 0.3, time: '2026-07-03T19:20:00Z' },
      { symbol: 'V/MA', side: 'sell', qty: 220, price: 1.42, pnlPct: -0.1, time: '2026-07-03T18:55:00Z' },
    ],
    note: 'Cointegration pairs, dollar- and beta-neutral; z-score entry ±2, exit 0.',
  },
  {
    id: 'sa-etf',
    name: 'ETF Stat-Arb',
    klass: 'stat-arb',
    status: 'halted',
    universe: 'Sector ETF baskets',
    returnPct: -2.4,
    sharpe: -0.31,
    maxDrawdownPct: -11.9,
    winRatePct: 49,
    trades: 3120,
    exposurePct: 0,
    equity: curve(5, -0.0009, 0.008),
    signals: [{ label: 'Regime break', tone: 'down' }, { label: 'Halted by risk gate', tone: 'down' }],
    fills: [
      { symbol: 'XLK/QQQ', side: 'sell', qty: 0, price: 1.01, pnlPct: 0, time: '2026-07-02T13:00:00Z' },
    ],
    note: 'Basket-vs-ETF arbitrage; auto-halted after breaching the drawdown gate. Awaiting model review.',
  },
];

export const asOf = '2026-07-03T14:00:00-04:00';
