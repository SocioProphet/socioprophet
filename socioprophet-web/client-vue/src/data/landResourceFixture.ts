// Layer 0 — Land & Natural Resources. The base of the ground-up economic model:
// resource endowments (land, minerals, water, energy, forest, fishery, soil)
// with reserves, grade, renewability, and tenure/rights. Everything else —
// extraction (supply chain) → commodities (markets) → mercantilism — is built on
// top. Geo-anchored (GAIA), graph-linked (hg: seam), twin-ready (economic-
// prophet). UI-only fixture; a live land/resource-registry adapter swaps in.

export type ResourceKind = 'land' | 'mineral' | 'water' | 'energy' | 'forest' | 'fishery' | 'soil';
export type Tenure = 'sovereign' | 'private' | 'concession' | 'commons' | 'contested';
export type Renewability = 'renewable' | 'finite' | 'depleting';
export type ResourceStatus = 'nominal' | 'stressed' | 'depleting' | 'contested';

export interface Geo { lat: number; lon: number; place: string; country: string }

export interface Endowment {
  id: string;
  name: string;
  kind: ResourceKind;
  subtype: string; // e.g. "copper ore", "aquifer", "solar", "arable"
  geo: Geo;
  reserves: number; // stock
  reservesUnit: string; // "Mt", "km³", "GW", "kha", "Mbbl"
  flow?: number; // annual sustainable yield / extraction rate
  flowUnit?: string;
  grade?: string; // quality / concentration
  renewability: Renewability;
  depletionYears?: number; // horizon at current draw (finite/depleting)
  tenure: Tenure;
  status: ResourceStatus;
  graphId: string; // HellGraph ref (hg:…)
  twinRef?: string; // economic-prophet / world-model handle
  feedsNodes: string[]; // supply-chain node ids drawing on this endowment (up-link)
  commodity?: string; // commodity node id it ultimately prices into
  economyIndicators?: string[];
  note: string;
}

export const endowments: Endowment[] = [
  // ── Base of the Copper chain ────────────────────────────────────
  {
    id: 'escondida-orebody', name: 'Escondida Orebody', kind: 'mineral', subtype: 'copper ore',
    geo: { lat: -24.27, lon: -69.07, place: 'Atacama', country: 'Chile' },
    reserves: 32.0, reservesUnit: 'Mt Cu', flow: 1.1, flowUnit: 'Mt/yr', grade: '0.9% Cu',
    renewability: 'finite', depletionYears: 29, tenure: 'concession', status: 'nominal',
    graphId: 'hg:resource/escondida-orebody', twinRef: 'econ-prophet:resource/copper-ore',
    feedsNodes: ['escondida'], commodity: 'copper', economyIndicators: ['oreoutput', 'reservelife'],
    note: "Porphyry copper deposit; grade decline is the long-run constraint on the world's largest mine.",
  },
  {
    id: 'atacama-water', name: 'Atacama Water Rights', kind: 'water', subtype: 'desalination + brackish',
    geo: { lat: -23.5, lon: -70.3, place: 'Antofagasta', country: 'Chile' },
    reserves: 0.6, reservesUnit: 'km³/yr', flow: 0.55, flowUnit: 'km³/yr',
    renewability: 'depleting', depletionYears: 15, tenure: 'contested', status: 'stressed',
    graphId: 'hg:resource/atacama-water', twinRef: 'econ-prophet:resource/water-chile',
    feedsNodes: ['escondida', 'chuqui-smelter'], economyIndicators: ['extractcost'],
    note: 'Water is THE binding constraint on Chilean copper — driving costly desalination and community disputes.',
  },
  {
    id: 'atacama-solar', name: 'Atacama Solar Belt', kind: 'energy', subtype: 'solar (PV)',
    geo: { lat: -23.0, lon: -69.5, place: 'Atacama', country: 'Chile' },
    reserves: 12.0, reservesUnit: 'GW potential', flow: 3.2, flowUnit: 'GW installed',
    renewability: 'renewable', tenure: 'sovereign', status: 'nominal',
    graphId: 'hg:resource/atacama-solar', twinRef: 'econ-prophet:resource/solar-chile',
    feedsNodes: ['chuqui-smelter'], note: 'Highest solar irradiance on Earth; powers smelting and desalination decarbonization.',
  },

  // ── Base of the Semiconductor chain ─────────────────────────────
  {
    id: 'quartz-silica', name: 'High-Purity Quartz', kind: 'mineral', subtype: 'silica (SiO₂)',
    geo: { lat: 35.9, lon: -82.1, place: 'Spruce Pine, NC', country: 'US' },
    reserves: 8.0, reservesUnit: 'Mt', flow: 0.3, flowUnit: 'Mt/yr', grade: '99.99% SiO₂',
    renewability: 'finite', depletionYears: 26, tenure: 'private', status: 'nominal',
    graphId: 'hg:resource/quartz-silica', feedsNodes: ['silicon'], commodity: 'silicon',
    note: 'Near-monopoly source of ultra-high-purity quartz for semiconductor-grade polysilicon crucibles.',
  },
  {
    id: 'hsinchu-water', name: 'Hsinchu Reservoir System', kind: 'water', subtype: 'reservoir',
    geo: { lat: 24.7, lon: 121.1, place: 'Hsinchu', country: 'Taiwan' },
    reserves: 0.4, reservesUnit: 'km³', flow: 0.35, flowUnit: 'km³/yr',
    renewability: 'renewable', tenure: 'sovereign', status: 'stressed',
    graphId: 'hg:resource/hsinchu-water', feedsNodes: ['tsmc-fab'], economyIndicators: ['semis'],
    note: 'Fabs are water-intensive; Taiwan droughts force trucked-water contingencies for TSMC.',
  },
  {
    id: 'taiwan-energy', name: 'Taiwan Grid (imported LNG)', kind: 'energy', subtype: 'LNG + grid',
    geo: { lat: 24.8, lon: 120.97, place: 'Hsinchu', country: 'Taiwan' },
    reserves: 0.0, reservesUnit: 'domestic', flow: 55.0, flowUnit: 'GW peak',
    renewability: 'finite', depletionYears: 0, tenure: 'sovereign', status: 'stressed',
    graphId: 'hg:resource/taiwan-energy', feedsNodes: ['tsmc-fab'], economyIndicators: ['dccapex'],
    note: 'Almost fully imported energy — a strategic vulnerability under the leading-edge fab.',
  },

  // ── Foundational land / commons (bases for future chains) ───────
  {
    id: 'us-grain-belt', name: 'US Grain Belt', kind: 'soil', subtype: 'arable cropland',
    geo: { lat: 41.5, lon: -93.6, place: 'Corn Belt, Iowa', country: 'US' },
    reserves: 92000, reservesUnit: 'kha', flow: 380, flowUnit: 'Mt grain/yr', grade: 'Mollisol, high SOM',
    renewability: 'renewable', tenure: 'private', status: 'stressed',
    graphId: 'hg:resource/us-grain-belt', twinRef: 'econ-prophet:resource/cropland-us',
    feedsNodes: [], economyIndicators: ['cropyield', 'acreage', 'farmincome'],
    note: 'Prime arable land; topsoil loss and aquifer draw are the sustainability constraints.',
  },
  {
    id: 'ogallala-aquifer', name: 'Ogallala Aquifer', kind: 'water', subtype: 'fossil aquifer',
    geo: { lat: 37.7, lon: -100.9, place: 'High Plains', country: 'US' },
    reserves: 3600, reservesUnit: 'km³', flow: -12, flowUnit: 'km³/yr (net draw)',
    renewability: 'depleting', depletionYears: 45, tenure: 'commons', status: 'depleting',
    graphId: 'hg:resource/ogallala', feedsNodes: [], economyIndicators: ['cropyield'],
    note: 'Fossil groundwater under the grain belt; irrigation draw vastly exceeds recharge.',
  },
  {
    id: 'boreal-forest', name: 'Canadian Boreal', kind: 'forest', subtype: 'timber + carbon sink',
    geo: { lat: 54.0, lon: -105.0, place: 'Saskatchewan', country: 'Canada' },
    reserves: 270000, reservesUnit: 'kha', flow: 155, flowUnit: 'Mm³/yr', grade: 'softwood',
    renewability: 'renewable', tenure: 'sovereign', status: 'nominal',
    graphId: 'hg:resource/boreal-forest', feedsNodes: [], note: 'Timber supply and a major carbon reservoir; harvest vs. sink is the policy tension.',
  },
  {
    id: 'north-sea-wind', name: 'North Sea Wind', kind: 'energy', subtype: 'offshore wind',
    geo: { lat: 56.0, lon: 3.0, place: 'North Sea', country: 'EU/UK' },
    reserves: 380, reservesUnit: 'GW potential', flow: 32, flowUnit: 'GW installed',
    renewability: 'renewable', tenure: 'sovereign', status: 'nominal',
    graphId: 'hg:resource/north-sea-wind', feedsNodes: [], economyIndicators: ['dccapex'],
    note: 'Anchor of European energy sovereignty; grid-interconnect timeline is the bottleneck.',
  },
  {
    id: 'rare-earth-deposit', name: 'Rare-Earth Deposit', kind: 'mineral', subtype: 'REE (Nd, Dy)',
    geo: { lat: 41.2, lon: 109.98, place: 'Bayan Obo', country: 'China' },
    reserves: 44.0, reservesUnit: 'Mt REO', flow: 0.21, flowUnit: 'Mt/yr', grade: '6% REO',
    renewability: 'finite', depletionYears: 60, tenure: 'sovereign', status: 'contested',
    graphId: 'hg:resource/rare-earth', twinRef: 'econ-prophet:resource/ree',
    feedsNodes: ['tsmc-fab'], economyIndicators: ['metalsprod'],
    note: 'Concentrated processing gives one nation strategic leverage over tech supply chains.',
  },
  {
    id: 'pacific-fishery', name: 'Humboldt Fishery', kind: 'fishery', subtype: 'pelagic (anchoveta)',
    geo: { lat: -12.0, lon: -77.6, place: 'Humboldt Current', country: 'Peru' },
    reserves: 10.0, reservesUnit: 'Mt biomass', flow: 5.0, flowUnit: 'Mt/yr quota',
    renewability: 'renewable', tenure: 'commons', status: 'stressed',
    graphId: 'hg:resource/humboldt-fishery', feedsNodes: [],
    note: 'World-largest single-species fishery; El Niño swings biomass and the global fishmeal price.',
  },
];

export const asOf = '2026-07-03T14:00:00-04:00';

// ── Resolvers (the Layer-0 spine) ──────────────────────────────────
export function endowmentsByKind(kind: ResourceKind): Endowment[] { return endowments.filter((e) => e.kind === kind); }
export function endowmentById(id: string): Endowment | undefined { return endowments.find((e) => e.id === id); }
// Endowments feeding a given supply-chain node (the resource base under a facility).
export function endowmentsForNode(nodeId: string): Endowment[] { return endowments.filter((e) => e.feedsNodes.includes(nodeId)); }
export const kinds: ResourceKind[] = ['land', 'soil', 'mineral', 'water', 'energy', 'forest', 'fishery'];
