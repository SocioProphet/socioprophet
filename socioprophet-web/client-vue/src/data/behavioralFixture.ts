// Fixture-backed behavioral-analytics cohorts for the
// /capability/behavioral-analytics surface — funnels, retention, engagement,
// and top events per segment. Deterministic; a live product-analytics adapter
// swaps in behind the same shape. Aggregate-only, no per-user PII.

export interface FunnelStep { step: string; count: number }
export interface EventStat { name: string; count: number; changePct: number }
export interface Signal { label: string; tone: 'up' | 'down' | 'neutral' }

export interface Cohort {
  id: string;
  name: string;
  size: number;
  retentionD7: number; // %
  engagement: number; // 0..100 composite
  avgSessionMin: number;
  funnel: FunnelStep[];
  events: EventStat[];
  trend: number[]; // weekly active trend
  signals: Signal[];
  note: string;
}

export const cohorts: Cohort[] = [
  {
    id: 'operators',
    name: 'Operators (pro tier)',
    size: 1240,
    retentionD7: 71,
    engagement: 84,
    avgSessionMin: 22.4,
    funnel: [
      { step: 'Signed in', count: 1240 },
      { step: 'Opened a domain', count: 1180 },
      { step: 'Ran a query / board', count: 902 },
      { step: 'Saved to research', count: 611 },
      { step: 'Returned (D7)', count: 880 },
    ],
    events: [
      { name: 'palette.open', count: 8421, changePct: 12.4 },
      { name: 'markets.view', count: 5210, changePct: 3.1 },
      { name: 'noetica.ask', count: 3902, changePct: 28.7 },
      { name: 'research.capture', count: 1744, changePct: 9.0 },
    ],
    trend: [640, 690, 710, 705, 760, 812, 880],
    signals: [{ label: 'Command-palette adoption rising', tone: 'up' }, { label: 'Noetica asks accelerating', tone: 'up' }],
    note: 'Power cohort. High funnel completion and D7 return; keyboard-first surfaces drive the engagement lift.',
  },
  {
    id: 'analysts',
    name: 'Analysts (free tier)',
    size: 5380,
    retentionD7: 38,
    engagement: 52,
    avgSessionMin: 9.1,
    funnel: [
      { step: 'Signed in', count: 5380 },
      { step: 'Opened a domain', count: 4100 },
      { step: 'Ran a query / board', count: 2210 },
      { step: 'Saved to research', count: 640 },
      { step: 'Returned (D7)', count: 2044 },
    ],
    events: [
      { name: 'news.read', count: 14200, changePct: 6.2 },
      { name: 'markets.view', count: 9800, changePct: 1.0 },
      { name: 'people.search', count: 3120, changePct: -2.4 },
      { name: 'research.capture', count: 640, changePct: 4.5 },
    ],
    trend: [1800, 1920, 1880, 1950, 2010, 1990, 2044],
    signals: [{ label: 'Drop-off at query step', tone: 'down' }, { label: 'News is the entry surface', tone: 'neutral' }],
    note: 'Largest cohort, shallow sessions. Biggest leak is signed-in → ran-a-query; news is the top of funnel.',
  },
  {
    id: 'agents',
    name: 'Agent sessions (automated)',
    size: 860,
    retentionD7: 92,
    engagement: 96,
    avgSessionMin: 41.8,
    funnel: [
      { step: 'Authenticated', count: 860 },
      { step: 'Opened a surface', count: 858 },
      { step: 'Emitted evidence', count: 841 },
      { step: 'Passed autonomy gate', count: 790 },
      { step: 'Returned (D7)', count: 792 },
    ],
    events: [
      { name: 'run.recorder.emit', count: 41200, changePct: 18.0 },
      { name: 'autonomy.gate.eval', count: 12040, changePct: 15.5 },
      { name: 'receipt.sealed', count: 11880, changePct: 16.1 },
    ],
    trend: [700, 720, 740, 760, 775, 786, 792],
    signals: [{ label: 'Evidence emission steady', tone: 'up' }, { label: 'Gate pass-rate ~92%', tone: 'up' }],
    note: 'Governed agent traffic. Near-total retention; the funnel is dominated by evidence emission and the autonomy gate.',
  },
  {
    id: 'trial',
    name: 'New trials (< 7 days)',
    size: 2110,
    retentionD7: 24,
    engagement: 33,
    avgSessionMin: 5.3,
    funnel: [
      { step: 'Signed up', count: 2110 },
      { step: 'Opened a domain', count: 1490 },
      { step: 'Ran a query / board', count: 720 },
      { step: 'Saved to research', count: 188 },
      { step: 'Returned (D7)', count: 506 },
    ],
    events: [
      { name: 'onboarding.view', count: 2110, changePct: 0 },
      { name: 'news.read', count: 3400, changePct: 22.0 },
      { name: 'palette.open', count: 410, changePct: 40.0 },
    ],
    trend: [0, 210, 340, 420, 470, 495, 506],
    signals: [{ label: 'Low activation', tone: 'down' }, { label: 'Palette discovery weak', tone: 'down' }],
    note: 'Activation cohort. Only 24% return by D7; discovery of the command palette and boards is the conversion lever.',
  },
];

export const asOf = '2026-07-03T14:00:00-04:00';
