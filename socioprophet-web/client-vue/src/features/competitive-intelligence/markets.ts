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
    rivals: ['Chrome + Gemini', 'Edge + Copilot', 'Island', 'Prisma Access Browser', 'Brave', 'Opera / Neon', 'Comet (Perplexity)', 'Arc + Dia (Atlassian)', 'Kagi / Orion', 'Firefox / Gecko', 'Vivaldi', 'ChatGPT Atlas (dead)'],
    coverage: 'covered',
    specimens: 12,
    note: 'We OWN a browser — the surface Grammarly and Speechify must rent. Supersedes the earlier first-pass scan (#558), which reported "Arc is dead" from widespread press coverage: Arc is NOT abandoned — The Browser Company halted active FEATURE development in May 2025 and pivoted the team to Dia after Atlassian\'s ~$610M acquisition closed Oct 21 2025, but Arc remains in Chromium-patch maintenance mode with no sunset date, and $610M against a $550M mark 18 months earlier is a flat 1.11x, not an exit. Perplexity\'s Comet launched July 2025 Max-gated at $200/mo and went free March 18 2026, with Pro behind the $20/mo plan and a $5/mo Comet Plus publisher add-on. The real opening is narrower and sharper than "Arc quit": no browser — including Chrome, Edge, Brave, Comet or Dia — ships verifiable agent-action provenance, while Comet holds ~48% of measured agentic traffic and faces a live federal case (Amazon v. Perplexity) over whether delegated-agent authorization is lawful at all. See market 3 teardown.',
    route: '/professional-intelligence/competitive/browser',
  },
  {
    id: 'health-twin',
    name: 'Digital health twin',
    arena: 'Personal health modelling and longevity',
    ourSurfaces: ['prophet-health', 'Digital Health Twin'],
    rivals: ['Whoop', 'Oura', 'Function Health', 'Levels', 'InsideTracker', 'Apple Health'],
    coverage: 'in-progress',
    specimens: 4,
    note: 'First-pass scan — 4 of 6 named rivals actually priced, not a full teardown. Whoop\'s model is hardware-free-but-hostage: the band goes dead the moment the subscription lapses, at $199-$359/yr across three tiers that differ only in band quality, not in tracked metrics. Oura keeps a low $5.99/mo membership on top of ring hardware but locks detailed sleep/HR/temperature trends behind it. Levels and InsideTracker sit on the other side of the market — periodic blood/DNA biomarkers ($189-$589 InsideTracker panels) versus real-time CGM ($24-$167/mo Levels tiers) — and are frequently stacked together rather than substituted. None of the four we checked bundle continuous wear + lab panels + longitudinal twin in one product; that combination is the gap to test against our own surface. Function Health and Apple Health still unpriced.',
  },
  {
    id: 'sovereign-os',
    name: 'Sovereign OS & infrastructure',
    arena: 'Owned, governed compute from device to cluster',
    ourSurfaces: ['SourceOS', 'SociOS-Linux', 'Porter', 'sovereign registry'],
    rivals: ['ChromeOS', 'NixOS / Guix', 'Talos', 'Red Hat', 'Proxmox', 'Tailscale'],
    coverage: 'in-progress',
    specimens: 3,
    note: 'First-pass scan — 3 of 6 named rivals actually priced, not a full teardown. Sidero Labs (Talos/Omni) caps its management-plane licensing at $1K/node/yr and markets 75-90% savings over "popular alternatives," with a self-hosted Enterprise tier for regulatory/sovereignty requirements — the closest analog to what "sovereign-os" means here. Tailscale\'s mesh-VPN layer prices per-seat ($8-$18/user/mo, quote-only Enterprise) rather than per-node, a different unit-economics model worth comparing against our own registry. Proxmox VE is genuinely free/open-source (AGPLv3, no per-core fee) with paid support tiers from EUR120 to EUR1,100 per CPU-socket/yr — the closest free-core-plus-paid-support precedent for SourceOS. ChromeOS, NixOS/Guix and Red Hat still unassessed.',
  },
  {
    id: 'search',
    name: 'Search & answer engines',
    arena: 'Retrieval and synthesis over the open web',
    ourSurfaces: ['sherlock-search', 'SearXNG (sovereign search)'],
    rivals: ['Google', 'Perplexity', 'Kagi', 'Brave Search', 'Exa', 'You.com'],
    coverage: 'in-progress',
    specimens: 3,
    note: 'First-pass scan — 3 of 6 named rivals actually researched, not a full teardown. Kagi is the direct paid/ad-free precedent: $5-$25/mo tiers (Starter/Professional/Family/Ultimate), no ads, no tracking, positioned explicitly as the anti-Google. Exa prices as a pay-as-you-go API for agent consumption rather than a subscription — $7/1K basic searches up to $15/1K for deep-reasoning search, with page contents now bundled into the base rate since a March 2026 repricing — the closest model to a provenance/citation-first search product sold to agents rather than humans. Perplexity\'s own Pro tier ($20/mo) is the incumbent AI-answer-engine price anchor. Google, Brave Search and You.com still unassessed.',
  },
  {
    id: 'agentic-dev',
    name: 'Agentic development tooling',
    arena: 'AI that writes, reviews and ships software',
    ourSurfaces: ['agentplane', 'prophet-cli', 'sp-orchestrator', 'mellumwork'],
    rivals: ['Cursor', 'GitHub Copilot', 'Devin', 'Claude Code', 'Windsurf', 'Factory'],
    coverage: 'in-progress',
    specimens: 4,
    note: 'First-pass scan — 4 of 6 named rivals actually priced, not a full teardown. The market re-priced hard in mid-2026: GitHub Copilot moved every plan to usage-based credits, Cursor split seats into two separate usage pools, and Windsurf rebranded under Devin Desktop at $20/mo. Individual pricing now clusters at $10 (Copilot), $15 (Windsurf), $20 (Cursor Pro), with team tiers converging near $19-$40/seat/mo (Copilot Business $19, Cursor/Windsurf Teams $40). Devin is the outlier — priced as an autonomous-agent hub scaling from roughly $20/mo entry to ~$500/mo for heavy team usage, not a per-seat IDE plugin. Claude Code and Factory still unassessed against this grid.',
  },
  {
    id: 'platform-data',
    name: 'Platform & data infrastructure',
    arena: 'The governed build/deploy/data platform a product estate runs on',
    ourSurfaces: ['prophet-platform', 'git-ops-standards', 'ArgoCD/GKE estate', 'socbase'],
    rivals: ['Palantir Foundry', 'Databricks', 'Snowflake', 'Vercel', 'Supabase', 'Render'],
    coverage: 'in-progress',
    specimens: 4,
    note: 'First-pass scan — 4 of 6 named rivals actually priced, not a full teardown. Snowflake and Databricks both price on consumption (credits/DBUs plus separate cloud storage), and mid-size deployments land in the same reported band (~$28-36K/yr for a mid-size team), meaning the real differentiator is workload fit, not list price. Vercel and Supabase sit a tier down as PaaS/BaaS: Supabase\'s free tier pauses after a week of inactivity and its Pro/Team tiers ($25/$599/mo) are a fraction of the data-warehouse spend above. socbase\'s Firebase/Supabase-replacement thesis has to compete directly against Supabase\'s own pricing, not just against the warehouse tier. Palantir Foundry and Render still unassessed here (Foundry\'s ~$32K/seat figure already exists in the professional-intelligence teardown).',
  },
  {
    id: 'knowledge-graph',
    name: 'Knowledge graph & ontology',
    arena: 'Entity, relationship and provenance substrates',
    ourSurfaces: ['hellgraph', 'ontogenesis', 'memory-mesh', 'KBpedia/KKO'],
    rivals: ['Neo4j', 'Palantir', 'TigerGraph', 'Stardog', 'Databricks UC'],
    coverage: 'in-progress',
    specimens: 2,
    note: 'First-pass scan — 2 of 5 named rivals actually researched, not a full teardown. Neo4j AuraDB prices by GB/month ($65 Professional up to 128GB, $146 Business Critical up to 512GB with 99.95% SLA) and remains the default choice for developer-led knowledge-graph projects specifically — the segment we\'d be entering. TigerGraph positions itself one tier up, for production-scale real-time relationship analytics (fraud, AML, GraphRAG at billions of records) at list prices reported 10-20% above Neo4j for comparable core counts. Neither vendor\'s public pricing tells us where a provenance-first, estate-integrated graph would land competitively. Palantir, Stardog and Databricks Unity Catalog still unassessed.',
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
