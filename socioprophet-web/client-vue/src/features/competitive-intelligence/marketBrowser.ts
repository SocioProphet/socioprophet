// Market 3 — Browser & agentic web surface. The market BearBrowser competes in.
// Compiled from a dedicated research pass (3 Aug 2026); every figure below is sourced
// and confidence-labelled the way market 2 (marketProfessionalIntelligence.ts) is.
//
// Evidence note: StatCounter/vendor MAU figures for AI-native browsers are structurally
// unreliable — Atlas/Comet/Dia are all Chromium and send a Chrome user-agent, so their
// share is invisible to conventional panels and folded into Chrome's number. Where a
// figure is a third-party estimate rather than a vendor disclosure, pricingConfidence
// or the prose says so explicitly rather than presenting it as measured.

import type { MarketTeardownData } from './marketTeardown';

export type BrowserMoatArchetype =
  | 'default-placement-rent'
  | 'enterprise-policy-lockin'
  | 'engine-control'
  | 'containment-architecture'
  | 'distribution-rent'
  | 'subscription-relationship'
  | 'ideological-niche'
  | 'none';

export const browserMoatArchetypeLabel: Record<BrowserMoatArchetype, string> = {
  'default-placement-rent': 'default-placement rent',
  'enterprise-policy-lockin': 'enterprise policy lock-in',
  'engine-control': 'engine control',
  'containment-architecture': 'containment architecture',
  'distribution-rent': 'distribution rent',
  'subscription-relationship': 'subscription relationship',
  'ideological-niche': 'ideological niche',
  none: 'none',
};

export const browserIntelligenceMarket: MarketTeardownData = {
  generatedAt: '2026-08-03T00:00:00-04:00',
  headline: 'Browser & Agentic Web Surface',
  marketLabel: 'market 3',
  machineTitle: 'Three loops, not one — confusing them is the most common error in this market',
  machineNote:
    'LOOP 1 (incumbent, consumer): pay for default placement -> become the default -> capture query volume -> sell search ads -> pay for default placement. Still fully intact — the DOJ remedy banned exclusivity, not the payments (~$20B/yr Google->Apple survives). LOOP 2 (enterprise): compliance requirement -> browser-level policy control -> per-seat contract -> audit evidence -> the next compliance requirement -> more seats. The only loop a startup can actually enter, because the buyer is not the user, so the novelty tax that killed Arc does not apply. LOOP 3 (agentic): agent acts on the user\'s behalf -> visits sites -> sites lose ad revenue/control -> sites block or sue the agent -> agent evades or degrades -> sites harden further. Currently has NO monetization step, which is why it eats capital. Whoever inserts a working payment or authorization step into loop 3 defines the next decade.',
  lede:
    'No AI-native browser appears as a line item in StatCounter — they sit below the measurement floor because Atlas/Comet/Dia all send a Chrome user-agent, so their traffic is attributed to Chrome. The metric that resolves them inverts the picture: HUMAN Security\'s measured agentic-traffic share puts Comet at ~48% and browser-based agents at ~71% of all observed agentic activity, while Cloudflare Radar shows bots passed humans on 3 June 2026 — 18 months ahead of its own forecast. Read it plainly: Comet is <1% of browsing and ~48% of agentic traffic. The AI browsers lost the browser war and are winning a different one.',
  thesis:
    'The unserved center of this market is not capability — it is proof. No browser ships verifiable, tamper-evident, exportable receipts of what an agent did on a user\'s behalf. Prompt injection is unsolved and every major vendor (OpenAI, Perplexity, Brave, UK NCSC) has said so in public; the research consensus on a real fix (CaMeL — a privileged/quarantined LLM split with capability-based information-flow control) exists, is published, and nobody has shipped it because it costs ~7 points of task completion. Meanwhile the legal question — is a user\'s authorization transferable to their agent — is undecided in Amazon v. Perplexity and could retroactively make Comet\'s core behavior a federal offense. Whoever ships purpose-bound, revocable agent delegation with cryptographic receipts owns the layer everyone else is about to need.',

  machine: [
    {
      index: 1,
      name: 'Buy the default',
      detail: 'Pay the platform owner for default-search placement. Regulated but not broken: the 2 Sept 2025 DOJ remedies ruling banned exclusivity and left the payments untouched.',
      exemplars: 'Google -> Apple ~$20B/yr; Google -> Mozilla $585M = 86% of Mozilla\'s 2024 revenue',
    },
    {
      index: 2,
      name: 'Ship the agent as a point release, not a new product',
      detail: 'Add agentic browsing to an already-installed base rather than asking users to switch. This single move is what killed ChatGPT Atlas — Google shipped equivalent capability to ~3B installed users with zero migration required.',
      exemplars: 'Chrome auto-browse (28 Jan 2026, Gemini 3-powered) · Edge Copilot Mode folded into the core UI (May 2026)',
    },
    {
      index: 3,
      name: 'Sell the policy endpoint, not the browser',
      detail: 'In enterprise the buyer is not the user, so the novelty tax that killed Arc does not apply. Land on an existing compliance/procurement contract instead of asking anyone to prefer your product.',
      exemplars: 'Island ($4.8B valuation, 450 customers, no product love required) · Prisma Access Browser given away free to protect a $1.5B SASE ARR line',
    },
    {
      index: 4,
      name: 'Contain, don\'t detect',
      detail: 'Prompt injection is publicly conceded as unsolved by every major vendor. The vendors that ship real defenses isolate the agent (no ambient authority to credentials/cookies/logged-in state) rather than try to classify attacks after the fact. Three independent vendors converged on this.',
      exemplars: 'Brave Leo (isolated profile, alignment-checker model that never sees raw page content) · Dia (no irreversible actions, never follows LLM-generated URLs) · Vivaldi (AI sandboxed in a separate panel with no ambient authority)',
    },
    {
      index: 5,
      name: 'Monetize the agent\'s reads, not just the human\'s clicks',
      detail: 'The one attempt to close loop 3 (see machineNote): pay publishers per agent action, not just per human visit.',
      exemplars: 'Perplexity Comet Plus — $5/mo, 80% to publishers, seeded by a $42.5M pool, payouts computed on human visits, search citations AND agent actions',
    },
    {
      index: 6,
      name: 'Escalate to litigation when the agent ignores a block',
      detail: 'When a site blocks agent access and the agent evades it, the dispute becomes a lawsuit about whether user authorization is transferable to a delegated agent at all — a live, unresolved federal question.',
      exemplars: 'Amazon v. Perplexity (N.D. Cal.): preliminary injunction granted 10 Mar 2026 under CFAA + Cal. Penal Code §502, stayed by the Ninth Circuit ~17 Mar 2026, argued 11 Jun 2026, still pending',
    },
  ] as import('./marketTeardown').TeardownMachineStep[],

  specimens: [
    {
      rank: 1,
      name: 'Chrome + Gemini (Google)',
      job: 'Be already installed. Then add the agent for free as a point release to an installed base of ~3 billion.',
      pricing: 'Chrome Enterprise Core free; Chrome Enterprise Premium $6/user/month (DLP, malware deep-scan, URL filtering, context-aware access).',
      pricingConfidence: 'confirmed',
      scale: '68.22% worldwide / 70.58% desktop share (StatCounter, Jul 2026). ~3B users (estimate). "Chrome auto browse" (Gemini 3, autonomous scroll/click/type/navigate, daily action cap) shipped to AI Pro/Ultra subscribers 28 Jan 2026; Android rollout Jun 2026.',
      surfaces: 'Persistent Gemini side panel; Chrome auto-browse for shopping, research, booking, form-filling.',
      moat: 'Fourfold and the deepest in tech: default-search payments (~$20B/yr to Apple alone, upheld by the DOJ remedy), OEM/Android distribution, engine control (funds Chromium, dictates Manifest V3), and the search index.',
      moatArchetype: 'engine-control',
      weakness: 'Manifest V3 killed uBlock Origin, handing Brave and Firefox their clearest differentiator. Agentic features are paywalled and rate-limited, capping the very behavior Google needs to normalize. No published efficacy numbers for its own prompt-injection defenses.',
      lesson: 'You do not need to win the AI browser war; you need to make switching pointless. Shipping agentic browsing as a feature update to 3 billion people is what killed Atlas — Google only had to ship an update; OpenAI had to win a browser-switching battle.',
      durability: 97,
      verdict: 'Unassailable. The antitrust remedy banned exclusivity and explicitly left the $20B/yr payment stream untouched.',
    },
    {
      rank: 2,
      name: 'Edge + Copilot Mode (Microsoft)',
      job: 'Be the browser Windows already opened, plus the browser IT already governs.',
      pricing: 'Copilot Mode free with limits; Copilot Pro $20/mo.',
      pricingConfidence: 'confirmed',
      scale: '5.37% worldwide / 11.15% desktop share. Folded into the core interface May 2026.',
      surfaces: 'Unified chat+search+navigation input box, multi-tab context awareness, Journeys (history reorganized into topic threads), Actions (multi-step workflows: booking, errands).',
      moat: 'Windows default placement, plus the one genuinely differentiated asset: Microsoft Purview/Entra/Intune. Lands inside an existing enterprise compliance estate at zero incremental procurement.',
      moatArchetype: 'enterprise-policy-lockin',
      weakness: 'UW security research rated it "more limited" — the safety comes from doing less, not from a stronger design. Copilot Actions/Journeys are still US-only previews a year after announcement. Share is stagnant despite maximal distribution advantage.',
      lesson: 'In enterprise, the browser is a policy endpoint, not a product. Microsoft\'s win condition is not delight; it\'s being the object Purview already manages.',
      durability: 80,
      verdict: 'Durable by attachment. Nobody chooses Edge; Purview and Windows choose it for them.',
    },
    {
      rank: 3,
      name: 'Island',
      job: 'Replace VDI — enforce last-mile IT controls (copy/paste, screenshot, print, watermark, session capture) inside the render surface itself.',
      pricing: 'No public rate card; enterprise contract, "ARR has more than doubled every year since launch" (company-stated, no absolute figure disclosed).',
      pricingConfidence: 'none',
      scale: 'Series E Mar 2025: $250M at $4.8B valuation, led by Coatue. ~$730M raised total. 450+ enterprise customers.',
      surfaces: 'Granular last-mile DLP, conditional access by device posture, session recording, watermarking, browser-level audit logs. 17 Mar 2026: Enterprise AI — on-demand agents with defined permissions and audit trails, plus an Island Extension to apply controls inside any browser.',
      moat: 'Enterprise policy plus switching cost — the only moat in the category not rented from Google. Once IT ships to 40,000 endpoints and writes policy against it, replacement is a multi-year project.',
      moatArchetype: 'enterprise-policy-lockin',
      weakness: '$4.8B priced against a category Gartner sizes at only 10% enterprise adoption today (25% by 2028). The extension-pivot is a tacit admission that getting users to switch browsers is hard even with an IT mandate.',
      lesson: 'The only durable browser business model is the one where the buyer isn\'t the user. Island monetizes ~450 customers at a valuation Comet cannot approach monetizing 100M+ users.',
      durability: 78,
      verdict: 'The strongest independent business in the category — priced ahead of a market that has not fully arrived, but the model is right.',
    },
    {
      rank: 4,
      name: 'Prisma Access Browser (Palo Alto Networks, ex-Talon)',
      job: 'Make the browser a SASE enforcement point, sold as an attach to an existing platform contract.',
      pricing: 'Offered free to qualified SASE customers — the clearest statement any vendor has made that an enterprise browser is a feature, not a standalone product.',
      pricingConfidence: 'confirmed',
      scale: 'Acquired (as Talon) for $625M, announced 6 Nov 2023. PANW SASE ARR grew 40% YoY, crossed $1.5B in Q2 FY2026.',
      surfaces: 'Cloud-container isolation of page execution, full SASE policy inheritance. 23 Mar 2026 relaunch: Agentic Workspace (any LLM), AI Interaction Security (content-aware boundaries), Agent Hijacking Prevention, and real-time human-vs-agent action attribution.',
      moat: 'The existing platform contract, not the browser itself.',
      moatArchetype: 'enterprise-policy-lockin',
      weakness: 'Bundling means the browser is never separately valued or separately loved. Product velocity is platform-paced. All agent-governance claims are vendor-stated with no independent verification of efficacy.',
      lesson: 'Human-vs-agent attribution is the feature the enterprise will actually pay for, and Palo Alto named it first. Everything else in agent governance right now is undifferentiated.',
      durability: 75,
      verdict: 'Durable but never separately valued — given away free to protect a $1.5B ARR line, and the first to name the winning enterprise feature.',
    },
    {
      rank: 5,
      name: 'Brave',
      job: 'Block ads and trackers by default, and be the only vendor whose business model does not require watching you.',
      pricing: 'Free; premium subs (VPN, Leo, Search) on top.',
      pricingConfidence: 'confirmed',
      scale: '109M MAU (Feb 2026), ~42M DAU. Brave Search 1.6B+ queries/month on an independent index. $100M+ annualized revenue as of Q1 2025, reportedly profitable.',
      surfaces: 'Shields (ad/tracker/fingerprint blocking), Brave Search, Leo AI sidebar, Rewards/BAT, VPN.',
      moat: 'The only Western consumer browser with an independent search index (not a Google-index reseller), a business model that survives losing a default-search deal, and reputational capital as the industry\'s security auditor.',
      moatArchetype: 'containment-architecture',
      weakness: 'BAT/crypto baggage. Leo is behind on raw capability. Brave\'s own March 2026 SPILLAGE study found agents overshare sensitive data behaviorally even when told to be private.',
      lesson: 'Containment beats detection. Leo agentic browsing ships off-by-default behind a flag, runs only in an isolated profile with no cookies/logged-in-state crossover, cannot reach internals/non-HTTPS/extension stores, and uses an alignment-checker model that never receives raw page content. This is the only agentic architecture in the market that follows from its own published threat model rather than from a demo.',
      durability: 88,
      verdict: 'Profitable, 109M MAU, own index, own ad network — the most durable independent, and the best-shipped security architecture in the category, full stop.',
    },
    {
      rank: 6,
      name: 'Opera / Opera Neon',
      job: 'Monetize the long tail — and, with Neon, be the first to charge real subscription money for a browser agent.',
      pricing: 'Opera Neon $19.90/month, public after a two-month Founders phase.',
      pricingConfidence: 'confirmed',
      scale: 'Opera Ltd (NASDAQ: OPRA) Q1 2026: revenue $176M (+23% YoY), adjusted EBITDA $42M at 24% margin, FY2026 guidance $727-740M, 20th consecutive quarter as a Rule-of-40 company.',
      surfaces: 'Opera One with Aria AI; Neon\'s four agents (Do, Make, ODRA deep research, Chat); unified access to GPT-5.1/Gemini 3 Pro/Veo 3.1.',
      moat: 'Emerging-markets distribution, gaming (GX), telco/OEM deals — not technology.',
      moatArchetype: 'distribution-rent',
      weakness: '1.88% share, no engine, no independent index. Brave disclosed a prompt-injection vulnerability in Neon (Oct 2025). No Neon subscriber figures published nine months in — the absence is itself informative.',
      lesson: 'A browser business can be profitable at ~2% share, because browser economics are distribution rents, not product economics. Opera is the existence proof that you don\'t need to win to make money.',
      durability: 60,
      verdict: 'Boring and solvent: ~$730M revenue on 1.88% share. Neon is a real pricing experiment nobody else is running, with no disclosed traction yet.',
    },
    {
      rank: 7,
      name: 'Comet (Perplexity)',
      job: 'Turn the browser into an execution surface — reason across open tabs, then book, buy, email, schedule. The most aggressively agentic shipped product, and the only one that shipped autonomous purchasing.',
      pricing: 'Comet Plus $5/mo (80% to publishers, seeded by a $42.5M pool). Perplexity Pro/Max tiers unlock more agent capability.',
      pricingConfidence: 'confirmed',
      scale: 'Perplexity valuation $20B (Sept 2025). ~48% of all measured agentic browsing traffic (HUMAN Security, Jun 2026) — dominant, unmonetized, legally contested. Comet-specific MAU never published (~18M estimated).',
      surfaces: 'Comet Assistant sidecar, Spaces, Background Assistants (async multi-task), Email Assistant, "Buy with Pro" in-answer checkout, PayPal agentic-commerce across 5,000+ merchants at zero commission.',
      moat: 'No engine, default-search structurally blocked. The real asset is rented distribution (Motorola/Lenovo preload, Bharti Airtel 360M-subscriber giveaway, PayPal/Venmo, Samsung TV) plus first-mover position in publisher revenue-share economics.',
      moatArchetype: 'distribution-rent',
      weakness: 'Broken publicly by five independent security teams (CometJacking, Scamlexity, unseeable screenshot injection, PerplexedBrowser zero-click, Agentic Blabbering) — two teams documented Perplexity shipping incomplete fixes or initially dismissing valid reports. Amazon v. Perplexity preliminary injunction (10 Mar 2026) found likely CFAA/Penal-Code violations for disguising Comet as a human user; currently stayed pending Ninth Circuit appeal.',
      lesson: 'Ship the agent before the permission model and you convert every product win into a liability. Comet won the agentic-traffic war and simultaneously became the industry\'s canonical vulnerability demo and the defendant in the case that may decide whether delegated agents are legal at all.',
      durability: 45,
      verdict: 'Highest variance in the market — ~48% of agentic traffic and a live federal case that could make its core behavior illegal, while Perplexity has already moved its strategic center to a broader product ("Computer").',
    },
    {
      rank: 8,
      name: 'Arc + Dia (The Browser Company -> Atlassian)',
      job: 'Arc: organize a heavy multi-tab workload. Dia: make your own open tabs the context window for an assistant.',
      pricing: 'Dia Pro $20/mo. Revenue, MAU and Pro-subscriber counts never disclosed, including in Atlassian\'s own quarterly results.',
      pricingConfidence: 'none',
      scale: 'Total funding $128M. Acquired by Atlassian for ~$610M all-cash (announced 4 Sept 2025) — a flat 1.11x multiple on a $550M mark set 18 months earlier, after Arc had already been publicly discontinued. Arc is in Chromium-patch maintenance mode, not shut down.',
      surfaces: 'Arc: sidebar-as-tab-strip, Spaces, Boosts, Command Bar, built-in ad blocking. Dia: chat sidebar with @-mention of other tabs as context, Skills, 7-day Memory, Confluence/Slack/Notion/Gmail integrations.',
      moat: 'No engine (Chromium). Post-acquisition the real moat is Atlassian\'s Teamwork Graph (150B+ connections) crossed with personal browsing context — neither Chrome nor Comet has an enterprise work graph, neither Jira nor Confluence has browser-side context.',
      moatArchetype: 'enterprise-policy-lockin',
      weakness: 'Founder Josh Miller published Arc\'s own DAU feature-adoption numbers as a public autopsy: multiple Spaces 5.52%, Calendar Preview on Hover 0.4%, versus Dia\'s chat-with-tabs at 40%. Dia remains macOS-Apple-Silicon-only 14+ months after an acquisition promise of "every platform faster than we could have imagined."',
      lesson: 'Power-user browser features do not generalize, and the founder published the proof. 5.52% adoption of your signature feature means you built a professional tool and priced it as a consumer platform.',
      durability: 55,
      verdict: 'Survives because Atlassian\'s balance sheet says so. Dia has the best shipped consent design in the category (no irreversible actions, never follows LLM-generated URLs) and, as far as public research shows, nobody has publicly broken it.',
    },
    {
      rank: 9,
      name: 'Orion (Kagi)',
      job: 'A WebKit browser with native Chrome/Firefox extension support and zero telemetry, for people who already pay for search.',
      pricing: 'Free with 200 Kagi searches; Orion+ from $5/mo.',
      pricingConfidence: 'confirmed',
      scale: 'Orion 1.0 shipped 25 Nov 2025 after six years in development. Kagi itself: 73,705 members, 962,500 queries/day as of 3 Aug 2026 — implying roughly $9M ARR (estimate).',
      surfaces: 'Full Chrome/Firefox extension compatibility on a WebKit engine — genuinely hard to build and genuinely differentiated.',
      moat: 'The subscription relationship itself: Kagi is the cleanest working proof that users will pay for search rather than be sold to.',
      moatArchetype: 'subscription-relationship',
      weakness: '73,705 subscribers after years of operation is the ceiling evidence: the pay-for-search market is five figures, not seven.',
      lesson: 'Subscription browsing works and does not scale. It produces a real, defensible, small business — not an escape from ad economics at any meaningful size.',
      durability: 62,
      verdict: 'Genuinely durable, permanently small.',
    },
    {
      rank: 10,
      name: 'Firefox / Gecko (Mozilla)',
      job: 'The last non-Chromium, non-WebKit browser with meaningful share — kept alive by the monopolist it exists to counterbalance.',
      pricing: 'Free.',
      pricingConfidence: 'confirmed',
      scale: '3.34% share. Mozilla takes ~86% of its revenue from Google — $585M of $680M in 2024. A US court has now effectively blessed that dependency by preserving the underlying payment.',
      surfaces: 'New CEO (Dec 2025) committed to making Firefox "an AI browser" within three years, entirely opt-in with a system-wide AI kill switch — met with heavy community backlash.',
      moat: 'Engine independence as a public-interest asset, not a commercial one.',
      moatArchetype: 'none',
      weakness: 'Revenue-dependent on the company its engine independence is supposed to check. Community actively hostile to the AI pivot its own leadership has committed to.',
      lesson: 'The last independent engine is kept alive by the monopolist it exists to counterbalance — and a federal court just ruled that arrangement should continue.',
      durability: 40,
      verdict: 'Alive on a competitor\'s check, pivoting to AI against its own users\' wishes.',
    },
    {
      rank: 11,
      name: 'Vivaldi',
      job: 'Maximum user control for power users the mainstream abandoned — and, since 2024, the explicit AI refusenik.',
      pricing: 'Free.',
      pricingConfidence: 'confirmed',
      scale: 'Employee/foundation-owned (Iceland). User numbers and revenue not credibly published — evidence here is thin by design (the company does not chase growth metrics).',
      surfaces: 'Tab stacking/tiling, panels, notes, built-in mail/calendar/feed reader, deep theming. April 2026 position: AI tools isolated in web panels — a "separate room" with no access to credentials, cookies, or the ability to drive the browser — citing indirect prompt injection and EchoLeak by name.',
      moat: 'Ideological credibility with a small, loyal base — a niche, not a moat.',
      moatArchetype: 'ideological-niche',
      weakness: 'Sub-0.1% share. Abstention has no revenue model. If the agentic thesis proves out, Vivaldi has no product path into it.',
      lesson: '"No" is a positioning, not a business — but Vivaldi\'s architectural answer (agent sandboxed in a panel with no ambient authority) is the same conclusion Brave reached from the opposite direction. Two independent vendors converging on isolation is signal, not coincidence.',
      durability: 35,
      verdict: 'Ideologically coherent, commercially static. Its sandbox-the-agent architecture will likely be vindicated even if the company never grows.',
    },
    {
      rank: 12,
      name: 'ChatGPT Atlas (OpenAI) — dead',
      job: '(As designed) collapse search, reading and doing into one surface — "a once-a-decade opportunity to rethink what a browser could be."',
      pricing: 'Free tier + agent mode paid. Discontinued: announced 9 Jul 2026, stopped working 9 Aug 2026.',
      pricingConfidence: 'confirmed',
      scale: 'Launched 21 Oct 2025, macOS-only for its entire life — Windows/iOS/Android never shipped. OpenAI never published a single download, DAU or MAU figure. Agentic-traffic share fell from 20.3% (May) to 16.5% (Jun 2026) against Comet\'s ~48%.',
      surfaces: 'ChatGPT sidebar, natural-language omnibox, browser memories, paid agent mode, split view. Its 2026 roadmap shipped vertical tabs and tab groups — 2019-era Chrome parity — and a search "Auto" mode that silently fell back to Google.',
      moat: 'None. The presumed moat (ChatGPT\'s 800M+ weekly users) failed to convert into browser switches.',
      moatArchetype: 'none',
      weakness: 'LayerX benchmarked 103 in-the-wild phishing attacks: Atlas stopped 5.8% (a 94.2% failure rate) versus Chrome\'s 47% and Edge\'s 53%. A CSRF exploit ("Tainted Memories") injected instructions into persistent cross-device account memory. The Verge measured 10 minutes to add three items to an Amazon cart. Never left macOS.',
      lesson: 'Distribution in one product does not transfer to another that requires switching. 800 million weekly ChatGPT users would not move their browser, and Google did not have to ask its 3 billion Chrome users to do anything at all.',
      durability: 5,
      verdict: 'Dead in six days (from compile date). Killed internally by the same "eliminate side quests" directive that killed Sora; the safety record and the platform gap never closed.',
    },
  ] as import('./marketTeardown').TeardownSpecimen[],

  unserved: [
    {
      gap: 'Agent-action provenance — nobody ships it',
      evidence: 'No browser — Chrome, Edge, Safari, Firefox, Brave, Comet, Dia — ships verifiable, tamper-evident, exportable receipts of what an agent did. The closest shipping things are Comet Enterprise Max (logs the answer/models/sources, but it is a log, not a signed receipt), Island (permissions and audit trails), and Prisma (real-time human-vs-agent attribution — the single best-named feature in the market). Everything else is drafts and startups: signed-receipt IETF drafts, W3C Verifiable Credentials proposals, PROV-AGENT. Auditors are now asking for Intent Observability (why the agent acted), not just Execution Observability (what it did) — and most enterprise programs deliver only the latter.',
      ourPosition: 'This is exactly the shape of our own receipt/proof-artifact discipline elsewhere in the estate (hash-chained InferenceReceipts, RecipeProof, sealed CountertestRun passports) — the same pattern applied to browser-agent actions instead of model-eval actions. Directly serviceable if we build the browser-side capture, which we have not yet.',
      weCanServe: 'partly',
    },
    {
      gap: 'Permission granularity between "on" and "off"',
      evidence: 'Shipped consent models are binary or coarse: Brave gates the whole mode, Anthropic gates the site, Atlas gated categories of site, Dia gates irreversibility. Nobody offers purpose-bound, scope-limited, time-limited, revocable delegation ("read my inbox for this one flight confirmation, for 10 minutes, and nothing else"). Google\'s AP2 solved exactly this shape for payments (signed Intent/Cart/Payment Mandates) and nobody has generalized it to non-payment actions.',
      ourPosition: 'Purpose-bound tool consent is an existing estate concept (capability membrane, purpose-bound consent membrane referenced elsewhere in this file\'s sibling markets). Generalizing AP2\'s mandate shape to arbitrary browser-agent actions is a real, scoped engineering project, not vaporware — but it is unbuilt for the browser surface specifically.',
      weCanServe: 'partly',
    },
    {
      gap: 'Liability allocation is legally unassigned and commercially unassignable',
      evidence: 'A federal court is actively deciding whether a delegated agent is even authorized to act (Amazon v. Perplexity). Vendor contracts push all risk to the customer via "as is" terms and caps at subscription-fee levels while real exposure is regulatory fines and business disruption. Clifford Chance\'s Feb 2026 analysis found contracts lack any provision letting a customer "access logs or decision traces" — accountability without control.',
      ourPosition: 'We cannot resolve the legal question, but "prove who authorized what, on whose behalf, and export the evidence chain on exit" is a product position we can build toward with the same provenance discipline used elsewhere in the estate. Honest status: unbuilt for this surface.',
      weCanServe: 'partly',
    },
    {
      gap: 'A regression nobody is pricing: the AI browser is currently a worse privacy surface than the browser it replaces',
      evidence: 'Arc shipped uBlock-Origin-based ad blocking by default. Neither Dia nor Comet has a confirmed built-in blocker, and Perplexity has publicly floated hyper-personalized ad tracking as an ambition. After a decade of privacy progress, the AI-native browsers are quietly regressing it.',
      ourPosition: 'A real, cheap, immediate differentiator: ship default ad/tracker blocking and say so, the way Arc and Brave both do. This costs us nothing architecturally and directly contradicts the category\'s current drift.',
      weCanServe: 'yes',
    },
    {
      gap: 'Containment-by-design agentic architecture is rare, not solved, and we have not shipped ours yet',
      evidence: 'Only Brave (isolated profile, alignment-checker model with no raw page access) and Dia (no irreversible actions, no LLM-generated URL following) have a shipped, coherent containment architecture that follows from a stated threat model. The published academically-correct answer (CaMeL: privileged/quarantined LLM split with capability-based information-flow control) exists and nobody has shipped it because it costs ~7 points of task completion.',
      ourPosition: 'This is squarely inside our own governance-first design instincts (fail-closed gates, SILENT firewall doctrine elsewhere in the estate) applied to a browser-agent runtime — genuinely serviceable in principle, but BearBrowser has not built and published an equivalent containment architecture yet. Honest status: aligned philosophy, unproven implementation for this specific surface.',
      weCanServe: 'partly',
    },
    {
      gap: 'A live permissions graph across enterprise SaaS (Glean-style ACL mirroring)',
      evidence: 'Glean\'s multi-year per-connector ACL mirroring with real-time delta-sync is the hardest thing to copy in the professional-intelligence market (market 2) and the same gap applies here for any browser wanting enterprise-wide deployability.',
      ourPosition: 'We do not have this, and it is expensive to build. Same honest "no" as market 2 gives for the identical gap.',
      weCanServe: 'no',
    },
  ] as import('./marketTeardown').TeardownGap[],

  ourRead:
    'The browser war and the agentic-traffic war are different wars, and BearBrowser is not going to out-distribute Chrome\'s 3 billion installed users or out-spend Island\'s enterprise policy contracts. The opening is the same one market 2 identified from a different angle: the unserved center of this market is proof, not capability. No browser — including the category leaders — ships a verifiable record of what its agent was authorized to do, what it actually did, and on whose authority, at the moment regulators (EU AI Act, Singapore\'s agentic-AI framework, California\'s "the AI decided" defense removal) start requiring exactly that. Two structural facts support entering here rather than fighting on distribution: first, containment beats detection and only two vendors (Brave, Dia) have actually shipped it, which is a low bar to clear with real engineering rather than marketing; second, the legal ground under the market\'s most aggressive player (Comet) is genuinely unstable, which makes "we do not disguise the agent as a human, we prove what it was authorized to do" a credible, differentiated position rather than a cautious one. The honest gap: we have not yet built or published a containment architecture, a permission-delegation model, or an action-receipt system for BearBrowser specifically — this market entry starts from philosophy-alignment, not from a shipped comparable.',
  sourcing:
    'StatCounter share figures are confirmed public panel data but structurally undercount AI-native browsers (Chrome user-agent spoofing). HUMAN Security agentic-traffic-share figures are vendor telemetry, reported not confirmed. Financial figures for Opera and Island/Palo Alto are company-disclosed and confirmed; MAU figures for Comet, Atlas and Dia have never been officially published by their vendors and are third-party estimates, flagged as such throughout. Security-vulnerability findings (LayerX, Brave, Guardio, NeuralTrust, Zenity) are vendor-run research, methodologically stated but commercially interested — Brave and LayerX both sell competing products. A "Reyes v. Perplexity" precedent circulating on commerce-SEO sites does not exist in any docket; do not cite it. The real, live case is Amazon v. Perplexity, N.D. Cal., argued 11 Jun 2026 and still pending as of compile date.',
};
