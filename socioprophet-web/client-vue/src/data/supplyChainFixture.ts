// Supply-chain spine — the cross-domain entity graph that links Markets, Economy,
// Weather, and News to the knowledge graph, the map, and the digital-twin models.
// The supply chain is its OWN model: nodes carry a `graphId` (HellGraph node ref)
// and `geo` (for the GAIA map) and tags into the other domains, so a live
// HellGraph + economic-prophet + GAIA can resolve against the same identities.
// UI-only fixture; nothing here fetches — a live graph/geo adapter swaps in behind
// the same shape.

export type NodeType = 'commodity' | 'company' | 'facility' | 'port' | 'route' | 'sector';
export type FacilityKind = 'mine' | 'smelter' | 'refinery' | 'fab' | 'assembly' | 'warehouse';
export type EdgeKind = 'mines' | 'refines' | 'ships' | 'produces' | 'supplies' | 'priced-as' | 'assembles';

export interface Geo { lat: number; lon: number; place: string; country: string }

export interface SCNode {
  id: string;
  name: string;
  type: NodeType;
  facility?: FacilityKind;
  chain: string; // chain id this node belongs to
  graphId: string; // HellGraph node reference (hg:...)
  geo?: Geo;
  // Cross-domain links — the same identities other domains key on.
  marketSymbols?: string[]; // marketsFixture Instrument.symbol
  economySectors?: string[]; // economyFixture Sector.id
  economyIndicators?: string[]; // economyFixture Indicator.id
  weatherRegions?: string[]; // weatherFixture Region.id (exposure)
  newsKeywords?: string[]; // matched against news item entities/title
  twinRef?: string; // digital-twin model handle (economic-prophet / world-model)
  status: 'nominal' | 'watch' | 'disrupted';
  note: string;
}

export interface SCEdge { from: string; to: string; kind: EdgeKind }

export interface Chain {
  id: string;
  name: string;
  commodityNode: string; // node id of the priced commodity
  marketSymbol: string; // headline instrument
  note: string;
}

export const chains: Chain[] = [
  { id: 'copper', name: 'Copper', commodityNode: 'copper', marketSymbol: 'COPPER', note: 'Mine → smelter → port → ocean route → refined-metal buyers. Electrification demand; Chile concentration is the key risk.' },
  { id: 'semis', name: 'Semiconductors', commodityNode: 'silicon', marketSymbol: 'NVDA', note: 'Silicon → fab → assembly → port → OEM. Taiwan fab concentration and shipping lanes are the choke points.' },
];

export const nodes: SCNode[] = [
  // ── Copper chain ────────────────────────────────────────────────
  {
    id: 'copper', name: 'Copper (LME)', type: 'commodity', chain: 'copper', graphId: 'hg:commodity/copper',
    marketSymbols: ['COPPER'], economySectors: ['materials'], economyIndicators: ['metalsprod'], twinRef: 'econ-prophet:commodity/copper',
    status: 'watch', note: 'Priced instrument at the head of the chain; electrification bid vs supply concentration.',
  },
  {
    id: 'escondida', name: 'Escondida Mine', type: 'facility', facility: 'mine', chain: 'copper', graphId: 'hg:facility/escondida',
    geo: { lat: -24.27, lon: -69.07, place: 'Antofagasta Region', country: 'Chile' },
    economyIndicators: ['oreoutput', 'extractcost'], weatherRegions: ['anf'], newsKeywords: ['copper', 'mining'],
    status: 'nominal', note: "World's largest copper mine (~5% of global supply). Water/energy costs are the swing factor.",
  },
  {
    id: 'chuqui-smelter', name: 'Chuquicamata Smelter', type: 'facility', facility: 'smelter', chain: 'copper', graphId: 'hg:facility/chuqui-smelter',
    geo: { lat: -22.32, lon: -68.9, place: 'Calama', country: 'Chile' },
    economyIndicators: ['smelter', 'refutil'], weatherRegions: ['anf'], status: 'nominal', note: 'Refines concentrate to cathode; power costs pressure output.',
  },
  {
    id: 'antofagasta-port', name: 'Port of Antofagasta', type: 'port', chain: 'copper', graphId: 'hg:port/antofagasta',
    geo: { lat: -23.65, lon: -70.4, place: 'Antofagasta', country: 'Chile' },
    economyIndicators: ['ports'], weatherRegions: ['anf'], status: 'nominal', note: 'Primary copper-cathode export gateway for northern Chile.',
  },
  {
    id: 'route-anf-sha', name: 'Antofagasta → Shanghai', type: 'route', chain: 'copper', graphId: 'hg:route/anf-sha',
    economyIndicators: ['freight', 'containers'], weatherRegions: ['sin'], newsKeywords: ['shipping', 'logistics', 'freight'],
    status: 'watch', note: 'Trans-Pacific bulk route; container-rate spikes lift landed cost.',
  },
  {
    id: 'shanghai-port', name: 'Port of Shanghai', type: 'port', chain: 'copper', graphId: 'hg:port/shanghai',
    geo: { lat: 31.23, lon: 121.47, place: 'Shanghai', country: 'China' },
    economyIndicators: ['ports', 'tonnage'], weatherRegions: ['sha'], status: 'nominal', note: 'Largest container port; entry to Chinese refined-metal demand.',
  },

  // ── Semiconductor chain ─────────────────────────────────────────
  {
    id: 'silicon', name: 'Polysilicon', type: 'commodity', chain: 'semis', graphId: 'hg:commodity/polysilicon',
    economyIndicators: ['chemprices'], twinRef: 'econ-prophet:commodity/polysilicon',
    status: 'nominal', note: 'Feedstock for wafers; concentrated production, energy-intensive.',
  },
  {
    id: 'tsmc-fab', name: 'TSMC Fab 18 (Hsinchu)', type: 'facility', facility: 'fab', chain: 'semis', graphId: 'hg:facility/tsmc-fab18',
    geo: { lat: 24.81, lon: 120.97, place: 'Hsinchu', country: 'Taiwan' },
    marketSymbols: ['NVDA'], economySectors: ['tech'], economyIndicators: ['semis', 'dccapex'], weatherRegions: ['tpe'], newsKeywords: ['semiconductors', 'nvidia', 'on-device ai'],
    status: 'watch', note: 'Leading-edge fab; single-point Taiwan concentration is the chain risk.',
  },
  {
    id: 'kaohsiung-port', name: 'Port of Kaohsiung', type: 'port', chain: 'semis', graphId: 'hg:port/kaohsiung',
    geo: { lat: 22.6, lon: 120.3, place: 'Kaohsiung', country: 'Taiwan' },
    economyIndicators: ['ports'], weatherRegions: ['tpe'], status: 'nominal', note: 'Primary export port for finished wafers/chips.',
  },
  {
    id: 'route-khh-lax', name: 'Kaohsiung → Los Angeles', type: 'route', chain: 'semis', graphId: 'hg:route/khh-lax',
    economyIndicators: ['freight', 'containers'], weatherRegions: ['sin'], newsKeywords: ['shipping', 'logistics'],
    status: 'watch', note: 'Trans-Pacific chip lane; air-freight fallback for high-value parts.',
  },
  {
    id: 'la-port', name: 'Port of Los Angeles', type: 'port', chain: 'semis', graphId: 'hg:port/los-angeles',
    geo: { lat: 33.74, lon: -118.26, place: 'Los Angeles', country: 'US' },
    economyIndicators: ['ports', 'tonnage'], status: 'nominal', note: 'US entry point; congestion feeds through to lead times.',
  },
  {
    id: 'nvda-oem', name: 'NVIDIA (fabless OEM)', type: 'company', chain: 'semis', graphId: 'hg:company/nvidia',
    marketSymbols: ['NVDA'], economySectors: ['tech'], economyIndicators: ['dccapex', 'cloud'], newsKeywords: ['nvidia', 'semiconductors'],
    twinRef: 'econ-prophet:firm/nvda', status: 'nominal', note: 'Designs chips fabbed at TSMC; demand set by data-center capex.',
  },
];

export const edges: SCEdge[] = [
  // Copper
  { from: 'escondida', to: 'chuqui-smelter', kind: 'mines' },
  { from: 'chuqui-smelter', to: 'antofagasta-port', kind: 'refines' },
  { from: 'antofagasta-port', to: 'route-anf-sha', kind: 'ships' },
  { from: 'route-anf-sha', to: 'shanghai-port', kind: 'ships' },
  { from: 'shanghai-port', to: 'copper', kind: 'priced-as' },
  // Semis
  { from: 'silicon', to: 'tsmc-fab', kind: 'supplies' },
  { from: 'tsmc-fab', to: 'kaohsiung-port', kind: 'produces' },
  { from: 'kaohsiung-port', to: 'route-khh-lax', kind: 'ships' },
  { from: 'route-khh-lax', to: 'la-port', kind: 'ships' },
  { from: 'la-port', to: 'nvda-oem', kind: 'assembles' },
];

export const asOf = '2026-07-03T14:00:00-04:00';

// ── Resolvers (the cross-domain spine) ──────────────────────────────
export function nodesForChain(chainId: string): SCNode[] { return nodes.filter((n) => n.chain === chainId); }
export function edgesForChain(chainId: string): SCEdge[] {
  const ids = new Set(nodesForChain(chainId).map((n) => n.id));
  return edges.filter((e) => ids.has(e.from) && ids.has(e.to));
}
export function nodeById(id: string): SCNode | undefined { return nodes.find((n) => n.id === id); }
// Supply-chain nodes that reference a given market symbol / economy sector — used
// by the Market Monitor / Economy board to surface "what's upstream/downstream".
export function nodesForMarketSymbol(sym: string): SCNode[] { return nodes.filter((n) => n.marketSymbols?.includes(sym)); }
export function nodesForSector(sectorId: string): SCNode[] { return nodes.filter((n) => n.economySectors?.includes(sectorId)); }
export function nodesForIndicator(indicatorId: string): SCNode[] { return nodes.filter((n) => n.economyIndicators?.includes(indicatorId)); }
export function nodesForWeatherRegion(regionId: string): SCNode[] { return nodes.filter((n) => n.weatherRegions?.includes(regionId)); }
// Supply-chain nodes an article touches — matched on the node's newsKeywords
// against the article's title/entities (the same loose join the surface uses).
export function nodesForNews(title: string, entities: string[]): SCNode[] {
  const hay = [title, ...entities].join(' ').toLowerCase();
  return nodes.filter((n) => n.newsKeywords?.some((k) => hay.includes(k)));
}
export function chainForNode(id: string): Chain | undefined { const n = nodeById(id); return n ? chains.find((c) => c.id === n.chain) : undefined; }
