// Shared shape for a market teardown, so each new market is DATA, not a new page.
// Market 2 (professional intelligence) was the first; markets 3-8 conform to this.

export type Confidence = 'confirmed' | 'estimate' | 'none';
export type ServeVerdict = 'yes' | 'partly' | 'no';

export type TeardownSpecimen = {
  rank: number;
  name: string;
  job: string;
  pricing: string;
  pricingConfidence: Confidence;
  scale: string;
  surfaces: string;
  moat: string;
  /** Free-text archetype label — each market names its own moat kinds. */
  moatArchetype: string;
  weakness: string;
  lesson: string;
  /** 0-100 durability of the moat. */
  durability: number;
  verdict: string;
};

export type TeardownMachineStep = {
  index: number;
  name: string;
  detail: string;
  exemplars: string;
};

export type TeardownGap = {
  gap: string;
  evidence: string;
  ourPosition: string;
  weCanServe: ServeVerdict;
};

export type MarketTeardownData = {
  generatedAt: string;
  headline: string;
  /** Short eyebrow, e.g. "market 3". */
  marketLabel: string;
  lede: string;
  thesis: string;
  machineTitle: string;
  machineNote: string;
  machine: TeardownMachineStep[];
  specimens: TeardownSpecimen[];
  unserved: TeardownGap[];
  ourRead: string;
  sourcing: string;
  /** Route back to the market portfolio. */
  backTo?: string;
};

export const serveLabel: Record<ServeVerdict, string> = {
  yes: 'we can serve',
  partly: 'partly',
  no: 'we cannot',
};
