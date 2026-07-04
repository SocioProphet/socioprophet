// The human spine — cross-cutting across EVERY economic layer. People and human
// networks (as capital, labor, or supply) attach to entities at any level: a
// resource endowment (L0), an extraction facility or route (L1), a market
// instrument or sector (L2), and — later — trade/policy (L3). Each network binds
// to the same identities the other layers use, and back to the People domain.
// UI-only fixture; a live workforce / cap-table / registry adapter swaps in.

export type NetworkRole = 'capital' | 'labor' | 'supply';
export type NetworkKind =
  | 'workforce' | 'union' | 'cooperative' | 'community' | 'guild'
  | 'firm' | 'investor-group' | 'sovereign-fund' | 'professional';

export interface HumanNetwork {
  id: string;
  name: string;
  role: NetworkRole; // capital · labor · supply
  kind: NetworkKind;
  headcount: number;
  skills: string[];
  wageIndex?: number; // relative wage level, 100 = local median
  organizedPct?: number; // unionized / organized share (labor)
  geo?: { place: string; country: string };
  attachesTo: string[]; // entity ids across ANY layer (endowment / sc-node / market symbol / sector)
  peopleRefs: string[]; // peopleFixture entity ids
  graphId: string; // HellGraph ref (hg:…)
  note: string;
}

export const networks: HumanNetwork[] = [
  // ── Labor ───────────────────────────────────────────────────────
  {
    id: 'copper-miners', name: 'Atacama Mining Workforce', role: 'labor', kind: 'workforce',
    headcount: 2600, skills: ['heavy equipment', 'blasting', 'ore processing'], wageIndex: 142, organizedPct: 78,
    geo: { place: 'Antofagasta', country: 'Chile' },
    attachesTo: ['escondida', 'escondida-orebody', 'chuqui-smelter'], peopleRefs: ['p-mercer'],
    graphId: 'hg:labor/copper-miners', note: 'Highly organized, high-wage workforce; strike risk is a first-order supply variable for copper.',
  },
  {
    id: 'fab-technicians', name: 'Fab Process Technicians', role: 'labor', kind: 'guild',
    headcount: 21000, skills: ['lithography', 'cleanroom', 'metrology', 'process control'], wageIndex: 168, organizedPct: 12,
    geo: { place: 'Hsinchu', country: 'Taiwan' },
    attachesTo: ['tsmc-fab', 'quartz-silica'], peopleRefs: [],
    graphId: 'hg:labor/fab-technicians', note: 'Scarce, high-skill talent; the true bottleneck in scaling leading-edge capacity.',
  },
  {
    id: 'port-longshore', name: 'Pacific Longshore Unions', role: 'labor', kind: 'union',
    headcount: 14500, skills: ['crane ops', 'lashing', 'logistics'], wageIndex: 155, organizedPct: 92,
    attachesTo: ['antofagasta-port', 'shanghai-port', 'kaohsiung-port', 'la-port', 'route-anf-sha', 'route-khh-lax'], peopleRefs: [],
    graphId: 'hg:labor/port-longshore', note: 'Port labor actions ripple straight into container rates and landed cost.',
  },
  {
    id: 'grain-coop', name: 'Grain-Belt Cooperatives', role: 'labor', kind: 'cooperative',
    headcount: 88000, skills: ['agronomy', 'machinery', 'grain handling'], wageIndex: 96, organizedPct: 34,
    geo: { place: 'Corn Belt', country: 'US' },
    attachesTo: ['us-grain-belt', 'ogallala-aquifer'], peopleRefs: [],
    graphId: 'hg:labor/grain-coop', note: 'Family-farm cooperatives; aging workforce and consolidation are structural pressures.',
  },
  {
    id: 'fishery-crews', name: 'Humboldt Fishing Communities', role: 'labor', kind: 'community',
    headcount: 42000, skills: ['seamanship', 'net handling'], wageIndex: 71, organizedPct: 20,
    geo: { place: 'Peru coast', country: 'Peru' },
    attachesTo: ['pacific-fishery'], peopleRefs: [],
    graphId: 'hg:labor/fishery-crews', note: 'Livelihoods swing with El Niño quotas; a social-stability variable, not just an economic one.',
  },

  // ── Capital ─────────────────────────────────────────────────────
  {
    id: 'mining-capital', name: 'Copper Capital Syndicate', role: 'capital', kind: 'investor-group',
    headcount: 40, skills: ['project finance', 'offtake', 'hedging'], wageIndex: 480,
    attachesTo: ['COPPER', 'escondida', 'materials'], peopleRefs: ['p-rao'],
    graphId: 'hg:capital/mining-syndicate', note: 'Financiers and offtake buyers; sets the hurdle rate that gates new mine supply.',
  },
  {
    id: 'semis-capital', name: 'Semiconductor Capital', role: 'capital', kind: 'firm',
    headcount: 120, skills: ['equity', 'capex allocation', 'M&A'], wageIndex: 520,
    attachesTo: ['NVDA', 'tsmc-fab', 'tech'], peopleRefs: ['p-rao'],
    graphId: 'hg:capital/semis-capital', note: 'Capex-allocation decisions here set fab build-out — the multi-year supply of compute.',
  },
  {
    id: 'sovereign-fund', name: 'Strategic Resource Fund', role: 'capital', kind: 'sovereign-fund',
    headcount: 60, skills: ['strategic reserves', 'stockpiling', 'policy'], wageIndex: 300,
    attachesTo: ['rare-earth-deposit', 'north-sea-wind', 'atacama-solar'], peopleRefs: ['p-lindqvist'],
    graphId: 'hg:capital/sovereign-fund', note: 'State capital treating critical resources as sovereign assets — the bridge to the mercantilist layer.',
  },

  // ── Supply (commercial human networks) ──────────────────────────
  {
    id: 'freight-operators', name: 'Trans-Pacific Freight Operators', role: 'supply', kind: 'firm',
    headcount: 5200, skills: ['vessel ops', 'scheduling', 'customs'], wageIndex: 118,
    attachesTo: ['route-anf-sha', 'route-khh-lax'], peopleRefs: ['p-mercer'],
    graphId: 'hg:supply/freight-operators', note: 'Carriers and forwarders; their capacity decisions set effective logistics throughput.',
  },
  {
    id: 'equipment-suppliers', name: 'Critical Equipment Suppliers', role: 'supply', kind: 'firm',
    headcount: 3400, skills: ['EUV service', 'haul-truck maintenance', 'spares'], wageIndex: 158,
    attachesTo: ['tsmc-fab', 'escondida'], peopleRefs: [],
    graphId: 'hg:supply/equipment-suppliers', note: 'A handful of suppliers (EUV, haul trucks) are single points of failure across chains.',
  },
  {
    id: 'water-utility', name: 'Industrial Water Operators', role: 'supply', kind: 'firm',
    headcount: 900, skills: ['desalination', 'treatment', 'distribution'], wageIndex: 112,
    attachesTo: ['atacama-water', 'hsinchu-water'], peopleRefs: [],
    graphId: 'hg:supply/water-utility', note: 'Water operators are the human network standing between a water endowment and the fab/mine.',
  },
];

export const asOf = '2026-07-03T14:00:00-04:00';

// ── Resolver — the cross-cutting join used by EVERY layer ──────────
export function networksForEntity(entityId: string): HumanNetwork[] {
  return networks.filter((n) => n.attachesTo.includes(entityId));
}
export function networkById(id: string): HumanNetwork | undefined { return networks.find((n) => n.id === id); }
