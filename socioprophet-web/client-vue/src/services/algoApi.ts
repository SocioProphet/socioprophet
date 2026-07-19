// Real Algorithmic Trading backend — algo-engine (prophet-platform/apps/algo-engine).
// Backtests run over real historical daily bars (Yahoo); paper execution is a real ledger
// marked to the latest close. Same-origin `/svc/algo` proxy → :8085 in dev.
const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_ALGO_BASE ?? '/svc/algo';

export interface StrategyDef { id: string; label: string; blurb: string; params: Record<string, any> }
export interface Metrics { total_return: number; cagr: number; sharpe: number; max_drawdown: number; win_rate: number; vol: number }
export interface Fill { symbol: string; side: 'BUY' | 'SELL'; weight_delta: number; price: number }
export interface Backtest {
  ok: boolean; error?: string; strategy: string; universe: string[]; as_of: string;
  metrics: Metrics; trades: number; gross_exposure: number;
  equity_curve: number[]; dates: string[]; fills: Fill[];
  provenance: { data_source: string; bars_per_name: number; not_investment_advice: boolean };
}
export interface NlSpec { strategy: string; universe: string[]; params: Record<string, any>; name: string; rationale: string }
export interface Position { symbol: string; qty: number; price: number; market_value: number }
export interface Order { symbol: string; side: string; qty: number; price: number; ts: string }
export interface PaperState { cash: number; positions: Position[]; market_value: number; equity: number; unrealized_pnl: number; orders: Order[] }

async function get<T>(p: string): Promise<T> {
  const r = await fetch(`${BASE}${p}`); if (!r.ok) throw new Error(`${p} ${r.status}`); return r.json();
}
async function post<T>(p: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${p}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${p} ${r.status}`); return r.json();
}

export const listStrategies = () => get<{ strategies: StrategyDef[] }>('/strategies');
export const runBacktest = (b: { strategy: string; universe: string[]; lookback_days?: number; params?: Record<string, any> }) => post<Backtest>('/backtest', b);
export const strategyFromNl = (text: string) => post<NlSpec>('/strategy/from-nl', { text });
export const paperState = () => get<PaperState>('/paper/state');
export const placeOrder = (o: { symbol: string; side: 'BUY' | 'SELL'; qty: number; price?: number }) => post<PaperState & { fill: Order }>('/paper/order', o);
export const resetPaper = () => post<PaperState>('/paper/reset', {});
