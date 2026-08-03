// Market portfolio — every market the estate competes in, and how much competitive
// intelligence coverage each one actually has.
//
// This exists to answer one question honestly: "do we have this for every market
// we compete in?" The answer today is NO, and this registry makes the gap visible
// rather than implied. Coverage is declared per market; an uncovered market shows
// as uncovered instead of quietly not existing.

export type Coverage = 'covered' | 'in-progress' | 'none';

export type MarketMachineStep = {
  name: string;
  detail: string;
};

export type Market = {
  id: string;
  name: string;
  /** The market as a buyer would name it. */
  arena: string;
  /** Which estate surfaces compete here. */
  ourSurfaces: string[];
  /** Named competitors — indicative, not exhaustive. */
  rivals: string[];
  coverage: Coverage;
  /** Specimens torn down so far. */
  specimens: number;
  /** Route to the coverage, when there is any. */
  route?: string;
  /**
   * The commercial loop THIS market runs. Consumer apps and enterprise
   * intelligence do not share a machine — naming each market's own loop is the
   * point of keeping them separate.
   */
  machine?: MarketMachineStep[];
  note: string;
};

export const coverageLabel: Record<Coverage, string> = {
  covered: 'covered',
  'in-progress': 'in progress',
  none: 'no coverage',
};

export const markets: Market[] = [
  {
    id: 'consumer-one-trick',
    name: 'Consumer single-feature apps',
    arena: 'One-trick consumer apps that monetize hard (the One-Trick Playbook)',
    ourSurfaces: ['SocioProphet news/feeds', 'Digital Health Twin', 'BearBrowser'],
    rivals: ['Speechify', 'Remini', 'PhotoRoom', 'Cal AI', 'Grammarly', 'Duolingo', '+23 more'],
    coverage: 'covered',
    specimens: 29,
    route: '/professional-intelligence/competitive',
    machine: [
      { name: 'Value in 60 seconds', detail: 'One real result before any ask, ideally before an account.' },
      { name: 'Paywall at peak motivation', detail: 'The wall lands at export, or at the end of a personalization quiz.' },
      { name: 'Colonize an OS surface', detail: 'Share sheet, keyboard, widget, camera — own the muscle memory.' },
      { name: 'Forgiving retention hooks', detail: 'Streaks with freezes, accumulating state, a daily reason to return.' },
      { name: 'A share loop that IS the ad', detail: 'A removable watermark does virality and paywalling at once.' },
      { name: 'An organic floor', detail: 'ASO + programmatic SEO under everything.' },
    ],
    note: '29 specimens torn down, 34 canonical feature-types, aligned to capability owners. The reference implementation for every other market here.',
  },
  {
    id: 'professional-intelligence',
    name: 'Professional & market intelligence',
    arena: 'Analyst-grade research and decision platforms sold by seat or contract',
    ourSurfaces: ['SocioProphet cockpit', 'sherlock-search', 'prophet-truth', 'economic-prophet'],
    rivals: ['Bloomberg Terminal', 'AlphaSense', 'Hebbia', 'Palantir Foundry', 'Glean', 'Perplexity Enterprise'],
    coverage: 'covered',
    specimens: 23,
    route: '/professional-intelligence/competitive/enterprise',
    machine: [
      { name: 'Land via a modelling engagement', detail: 'Give away implementation to encode their business logic in your model before price is agreed.' },
      { name: 'Own an un-re-derivable substrate', detail: 'An ontology, an ACL graph, a licensed firehose, or an accreditation.' },
      { name: 'Enforce permissions in the architecture', detail: 'ACLs checked outside the model at retrieval time, never in the prompt.' },
      { name: 'Ship the artifact they already produce', detail: 'Chat is a demo; the analyst deliverable is the product.' },
      { name: 'Make deployability the architecture', detail: 'Air-gapped/DDIL/edge designed in — cloud-native rivals cannot retrofit it.' },
      { name: 'Monetize governance separately', detail: 'Audit logs, SCIM and retention are what the CISO actually buys.' },
      { name: 'Draw the retrieved / generated boundary', detail: 'Never let the model produce a number it could have looked up.' },
    ],
    note: 'THE market our flagship competes in. 23 specimens from Bloomberg (~$32K/seat) to Feedly (~$19K whole-team). Verdict: our defensible axis is Palantir/Primer (sovereign, governed, provenance-first), NOT Glean/Perplexity horizontal retrieval.',
  },
  {
    id: 'browser',
    name: 'Browser & agentic web surface',
    arena: 'The browser as an AI surface',
    ourSurfaces: ['BearBrowser'],
    rivals: ['Arc / Dia (The Browser Company)', 'Comet (Perplexity)', 'Brave', 'Chrome', 'Edge Copilot'],
    coverage: 'none',
    specimens: 0,
    note: 'We OWN a browser — the surface Grammarly and Speechify must rent. Arc\'s abandonment left this square open. Highest-asymmetry uncovered market.',
  },
  {
    id: 'health-twin',
    name: 'Digital health twin',
    arena: 'Personal health modelling and longevity',
    ourSurfaces: ['prophet-health', 'Digital Health Twin'],
    rivals: ['Whoop', 'Oura', 'Function Health', 'Levels', 'InsideTracker', 'Apple Health'],
    coverage: 'none',
    specimens: 0,
    note: 'Real repo and real surface, zero competitive coverage. Accumulating state is a structural retention advantage the consumer study already proved out.',
  },
  {
    id: 'sovereign-os',
    name: 'Sovereign OS & infrastructure',
    arena: 'Owned, governed compute from device to cluster',
    ourSurfaces: ['SourceOS', 'SociOS-Linux', 'Porter', 'sovereign registry'],
    rivals: ['ChromeOS', 'NixOS / Guix', 'Talos', 'Red Hat', 'Proxmox', 'Tailscale'],
    coverage: 'none',
    specimens: 0,
    note: 'Large investment, no competitive read. Sovereignty/on-prem is exactly the axis enterprise buyers are reportedly unserved on.',
  },
  {
    id: 'search',
    name: 'Search & answer engines',
    arena: 'Retrieval and synthesis over the open web',
    ourSurfaces: ['sherlock-search', 'SearXNG (sovereign search)'],
    rivals: ['Google', 'Perplexity', 'Kagi', 'Brave Search', 'Exa', 'You.com'],
    coverage: 'none',
    specimens: 0,
    note: 'Perplexity is torn down in the consumer study, but the search market itself is uncovered. Our citation/provenance depth is the differentiator to test.',
  },
  {
    id: 'agentic-dev',
    name: 'Agentic development tooling',
    arena: 'AI that writes, reviews and ships software',
    ourSurfaces: ['agentplane', 'prophet-cli', 'sp-orchestrator', 'mellumwork'],
    rivals: ['Cursor', 'GitHub Copilot', 'Devin', 'Claude Code', 'Windsurf', 'Factory'],
    coverage: 'none',
    specimens: 0,
    note: 'Fast-moving, well-funded market we build in daily but have never assessed.',
  },
  {
    id: 'platform-data',
    name: 'Platform & data infrastructure',
    arena: 'The governed build/deploy/data platform a product estate runs on',
    ourSurfaces: ['prophet-platform', 'git-ops-standards', 'ArgoCD/GKE estate', 'socbase'],
    rivals: ['Palantir Foundry', 'Databricks', 'Snowflake', 'Vercel', 'Supabase', 'Render'],
    coverage: 'none',
    specimens: 0,
    note: 'The platform our whole estate runs on, and it had no market entry at all until now — the most-used thing we own was the least assessed. socbase sits here as the sovereign Firebase/Supabase replacement.',
  },
  {
    id: 'knowledge-graph',
    name: 'Knowledge graph & ontology',
    arena: 'Entity, relationship and provenance substrates',
    ourSurfaces: ['hellgraph', 'ontogenesis', 'memory-mesh', 'KBpedia/KKO'],
    rivals: ['Neo4j', 'Palantir', 'TigerGraph', 'Stardog', 'Databricks UC'],
    coverage: 'none',
    specimens: 0,
    note: 'Deep estate capability, no market read. Provenance is our strongest axis across every study so far.',
  },
];

export function coverageTotals() {
  return {
    total: markets.length,
    covered: markets.filter((m) => m.coverage === 'covered').length,
    inProgress: markets.filter((m) => m.coverage === 'in-progress').length,
    none: markets.filter((m) => m.coverage === 'none').length,
    specimens: markets.reduce((sum, m) => sum + m.specimens, 0),
  };
}
