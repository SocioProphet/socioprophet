// Market 2 — Professional & market intelligence platforms.
// THE market our flagship competes in. Deliberately NOT forced into the consumer
// one-trick machine: this market runs a different loop, named below.
//
// Evidence note: Palantir's numbers are unusually hard because the UK G-Cloud 14
// price sheet is public. Most others publish no rate card, so seat prices are
// third-party estimates and are flagged per row.

export type Confidence = 'confirmed' | 'estimate' | 'none';

export type MoatArchetype = 'semantic-lock-in' | 'permissions-graph' | 'licensed-data' | 'deployability' | 'workflow-shape';

export type EnterpriseSpecimen = {
  rank: number;
  name: string;
  job: string;
  /** Headline pricing, with confidence. */
  pricing: string;
  pricingConfidence: Confidence;
  scale: string;
  surfaces: string;
  moat: string;
  moatArchetype: MoatArchetype;
  weakness: string;
  lesson: string;
  /** 0-100 durability of the moat. */
  durability: number;
  verdict: string;
};

export type EnterpriseMachineStep = {
  index: number;
  name: string;
  detail: string;
  exemplars: string;
};

export type UnservedGap = {
  gap: string;
  evidence: string;
  ourPosition: string;
  /** Can we actually serve it today? */
  weCanServe: 'yes' | 'partly' | 'no';
};

export const moatArchetypeLabel: Record<MoatArchetype, string> = {
  'semantic-lock-in': 'semantic lock-in',
  'permissions-graph': 'permissions graph',
  'licensed-data': 'licensed data',
  deployability: 'deployability',
  'workflow-shape': 'workflow shape',
};

export const professionalIntelligenceMarket = {
  generatedAt: '2026-08-03T00:00:00-04:00',
  headline: 'Professional & market intelligence',
  lede:
    'The market our flagship actually competes in. Eighteen platforms torn down, from Bloomberg at ~$32K/seat to Feedly at ~$19K for a whole team. This market does NOT run the consumer machine — there is no viral loop, no watermark, no streak. It runs on substrate ownership, governed deployability, and who is trusted to act unattended.',
  thesis:
    'The moat was never the data — it was being the number people CITE. PitchBook\'s valuation, Similarweb\'s traffic estimate, Bloomberg\'s price. Citational authority survives worse data, higher prices and hostile renewals for a remarkably long time — and it is exactly what an LLM strips away, because when an agent answers the question the user never sees whose number it was. Every incumbent here is racing into MCP integrations that dissolve the only moat they had. The defensible counter-move is the opposite of what they are all doing: make provenance the product — signed, timestamped, per-claim lineage an agent must attribute in order to use. Be the source the model is REQUIRED to cite, not the source it silently absorbs.',

  machine: [
    {
      index: 1,
      name: 'Land via a modelling engagement',
      detail: 'Give away implementation to get the customer\'s business logic encoded in your model before price is negotiated. After that the schema, not the contract, is the lock-in.',
      exemplars: 'Palantir AIP Bootcamp — "0 to use case in 5 days", ~75% attendee→contract conversion (est.)',
    },
    {
      index: 2,
      name: 'Own an un-re-derivable substrate',
      detail: 'An ontology, a permissions graph, a licensed firehose, or an accreditation — the one asset a competitor cannot clone in a quarter.',
      exemplars: 'Palantir Ontology · Glean ACL graph · Quid 2PB licensed feeds',
    },
    {
      index: 3,
      name: 'Enforce permissions in the architecture',
      detail: 'ACLs ingested with content and checked OUTSIDE the model at retrieval time — never in the prompt. This is what makes an answer engine deployable company-wide.',
      exemplars: 'Glean — per-document/field/sentence enforcement, real-time ACL delta-sync',
    },
    {
      index: 4,
      name: 'Ship in the artifact shape they already produce',
      detail: 'Chat is a demo; the analyst\'s existing deliverable is the product. Auditable, diffable, pasteable into the deal file.',
      exemplars: 'Hebbia Matrix — documents × questions grid with cited cells',
    },
    {
      index: 5,
      name: 'Make deployability the architecture',
      detail: 'Air-gapped, DDIL and edge operation designed in from the first commit — the one capability cloud-native competitors structurally cannot retrofit.',
      exemplars: 'Palantir Apollo (FedRAMP High, IL5/IL6) · Primer (air-gapped, DDIL, tactical edge)',
    },
    {
      index: 6,
      name: 'Monetize governance separately',
      detail: 'Price the answer at scale to get into every department; sell SCIM, audit logs and retention controls to the CISO at a step change.',
      exemplars: 'Perplexity — $400/seat/yr Pro vs $3,250 Max, where audit logs + SCIM live',
    },
    {
      index: 7,
      name: 'Draw the retrieved / generated boundary',
      detail: 'Make an explicit, product-visible line between facts that are RETRIEVED and language that is GENERATED. Never let the model produce a number it could have looked up. Four vendors converged on this independently — it is the architectural answer to hallucination in regulated buying.',
      exemplars: 'Kensho "deterministic vs adaptive retrieval" · Rogo computes multiples from real data pulls, never model arithmetic · Brightwave sentence-level attribution · AlphaSense source-linked auditability',
    },
  ] as EnterpriseMachineStep[],

  specimens: [
    {
      rank: 1,
      name: 'Palantir (Foundry + AIP)',
      job: 'Operational decision system, not a search box. Ingest everything, model it as an Ontology of objects/links/actions, then drive analyst workflows and write-back actions in one loop.',
      pricing: 'UK G-Cloud list (public): PT-ORG single-org licence £3,000,000/yr; PF-CORE £66,000 per server core/yr; FDE services £150,000 per person per quarter; pilots £50K–£500K. Typical first commercial contract $500K–$2M/yr.',
      pricingConfidence: 'confirmed',
      scale: 'FY2025 revenue $4.48B; Q1 2026 +85% YoY ($1.63B), US commercial +133%; 1,007 TTM customers.',
      surfaces: 'Web workspace (Contour, Quiver, Workshop, Code Workbook), Ontology SDK, REST/ODBC, AIP Assist sidebar in every app, Apollo deploy to cloud/on-prem/air-gapped/edge.',
      moat: 'The Ontology IS the lock-in — business logic, permissions and actions encoded in their object model. Plus FedRAMP High + DoD IL5/IL6, and FedStart which lets other vendors ride that accreditation.',
      moatArchetype: 'semantic-lock-in',
      weakness: 'Reviewers cite heavy effort to get value, fiddly UI, performance at volume, and opaque pricing with 2–3× variance between comparable deals. Reputational risk (ICE contracts, internal revolt) is now a procurement risk.',
      lesson: 'Sell the modelling engagement, not the software. Whoever owns the semantic model owns the account.',
      durability: 95,
      verdict: 'The most defensible platform in the set — ontology lock-in plus an accreditation moat that compounds via FedStart.',
    },
    {
      rank: 2,
      name: 'Glean',
      job: 'Enterprise-wide Work AI: find anything across every SaaS app the employee is permitted to see, then act on it via assistants and agents.',
      pricing: 'No public rate card. ~$50/user/mo base + ~$15 AI add-on + consumption credits (est.); ~100-seat minimum ≈ $60K/yr ACV floor. Initial contracts $100K–$500K/yr; F500 >$5M.',
      pricingConfidence: 'estimate',
      scale: 'ARR $300M (May 2026), 3× in 15 months. ~$768M raised, $7.2B valuation. 85%+ of customers use it across 5+ departments.',
      surfaces: 'Broadest in the set — web, Mac/Windows desktop, iOS/Android, browser extension (all four browsers), Slack, Teams, Jira, Glean Apps + APIs, with context carrying across surfaces.',
      moat: 'The permissions graph, not the LLM. Per-app ACL mirroring across Confluence, Slack, Salesforce, GitHub — multi-year work competitors skip. Content stays in source; only vectors + metadata cached.',
      moatArchetype: 'permissions-graph',
      weakness: 'Inconsistent relevance (users still verify in the source app), limited ranking tuning, hallucination, unintuitive UI, hard setup at scale. Real threat: Microsoft Copilot bundling.',
      lesson: 'Enforce permissions in the retrieval architecture, never in the prompt — ingest each document\'s ACL with its content and check it outside the model.',
      durability: 82,
      verdict: 'Strongest growth in the set; the ACL graph is a genuine multi-year moat, but Copilot bundling is an existential overhang.',
    },
    {
      rank: 3,
      name: 'Perplexity (Enterprise / Finance)',
      job: 'Cited answers over the live web plus internal files; Finance narrows to equity research — quotes, filings, transcripts, live earnings calls.',
      pricing: 'Most transparent here: Enterprise Pro $40/seat/mo ($400/yr); Enterprise Max $325/seat/mo ($3,250/yr); US federal $0.25 per agency for 15 months under GSA OneGov. Sonar API metered.',
      pricingConfidence: 'confirmed',
      scale: 'ARR $450M (Mar 2026) from $100M a year earlier; ~$22.6B valuation; 100M+ MAU. Revenue jumped ~50% in one month after killing advertising entirely.',
      surfaces: 'Web, mobile, Comet AI browser (free worldwide Oct 2025), Finance dashboard, Earnings Hub with live in-call transcription, Portfolio (Plaid), Spaces, Sonar API.',
      moat: 'Licensed real-time data, not model quality — SEC/EDGAR, FactSet, S&P Global, Morningstar, LSEG, Quartr, Fiscal.ai. Plus a consumer funnel feeding enterprise at 1/10th Hebbia\'s seat price.',
      moatArchetype: 'licensed-data',
      weakness: 'Litigation is the headline risk — Dow Jones/News Corp, Britannica/Merriam-Webster (incl. trademark claims over hallucinated attribution), NYT and BBC C&Ds. No permissions graph, no accreditation, thin switching cost at $40/seat. Governance paywalled at an 8× step.',
      lesson: 'Price the answer at consumer scale and monetize governance separately — but secure content licences before the lawsuits price them for you.',
      durability: 68,
      verdict: 'Fastest commercial motion, weakest structural moat — no ACL graph, no accreditation, and an unresolved copyright overhang.',
    },
    {
      rank: 4,
      name: 'Primer.ai',
      job: 'Turn overwhelming multilingual, multimodal information into structured, traceable, mission-ready intelligence for defense and intelligence analysts.',
      pricing: 'No public pricing; government-contract and prime-mediated licensing.',
      pricingConfidence: 'none',
      scale: '~$14.5M revenue (est.) on $237M raised, ~124 staff — capital efficiency looks poor.',
      surfaces: 'Web analyst workspace, Primer Command (entities, narratives, events, maps, timelines in one UI), Primer API, direct C2 integration, tactical edge clients.',
      moat: 'Deployability as a stated design principle — customer-hosted, air-gapped, DDIL, tactical edge. Channel moat via Amentum, GDIT and Palantir as partners.',
      moatArchetype: 'deployability',
      weakness: 'Squeezed from both sides: Palantir above (full mission platform, and simultaneously a listed partner), frontier labs below (CDAO now buys OpenAI/Anthropic/Google/xAI directly at $200M each). Almost no public user reviews; repeated repositioning suggests PMF search.',
      lesson: 'Make deployability the architecture, not a config flag — it is what keeps you in the room when the frontier labs arrive with better models.',
      durability: 55,
      verdict: 'Right moat, wrong position — deployability is genuinely defensible but Primer is a capability inside someone else\'s program.',
    },
    {
      rank: 5,
      name: 'Hebbia',
      job: 'The AI analyst for high-stakes document work — answer hundreds of questions across thousands of documents, every cell traceable to a source line.',
      pricing: 'No public card. ~$10,000/seat/yr Professional, ~$3,000–3,500 Lite (est.), benchmarked deliberately against a Bloomberg Terminal seat. No free trial.',
      pricingConfidence: 'estimate',
      scale: '$13M ARR (Jun 2024, stale — no 2026 figure disclosed); $161M raised at $700M. Claims $30T AUM of client firms, 1.5B pages processed.',
      surfaces: 'Matrix — a spreadsheet grid where documents are rows, questions are columns, agent outputs are cited cells. Plus Matrix API + MCP, SharePoint/Excel/FactSet connectors.',
      moat: 'Workflow shape + citation discipline. Encode the firm\'s process once and it runs continuously. ISO/IEC 42001 AI-management certification is a rare, real differentiator.',
      moatArchetype: 'workflow-shape',
      weakness: 'The most copyable moat in the set — commoditization risk as context windows expand. No chat history, limited customization, and cannot export to Word or PDF, which is severe for a product whose output is a deliverable.',
      lesson: 'Ship the answer in the shape of the artifact the professional already produces. Chat is a demo; the grid is a deliverable.',
      durability: 52,
      verdict: 'Best single UI idea in the market attached to the weakest moat; ARR an order of magnitude below Glean at comparable vintage.',
    },
    {
      rank: 6,
      name: 'Quid (NetBase Quid)',
      job: 'Consumer and market intelligence — what people are saying, why, and what is next, across social, news, broadcast, reviews, forums and patents.',
      pricing: 'Entry ~$4,995/quarter (~$20K/yr, est.); no public tier structure.',
      pricingConfidence: 'estimate',
      scale: '~$64.5M revenue (est.); >$100M raised historically; formed by the 2020 NetBase + Quid merger.',
      surfaces: 'Quid Terminal, Discover, Monitor, plus the Feb 2026 Q Platform / Q Agents launch. Web dashboards, API, real-time alerts.',
      moat: 'The data moat is the whole business — >2PB ingested: 200M+ social posts/day, 1M+ articles/day, 1M+ broadcast transcripts/day, 90K+ patents weekly, all under direct licensed partnerships with platforms that keep closing their APIs.',
      moatArchetype: 'licensed-data',
      weakness: 'Steep learning curve cited repeatedly, high cost, questioned sentiment accuracy, outdated UI. Strategically a legacy analytics vendor bolting agents onto a 20-year NLP stack; the analysis layer is now LLM-commoditizable.',
      lesson: 'Own licensed access to data that is getting harder to get — the analysis layer can be rebuilt any time, the pipes cannot.',
      durability: 58,
      verdict: 'Durable pipes, commoditizing product. The Q Platform launch reads as a defensive re-platform.',
    },
  {
      rank: 7,
      name: 'Bloomberg Terminal',
      job: 'The trading floor\'s nervous system — real-time pricing, news, analytics, execution AND counterparty communication in one pane.',
      pricing: '~$31,980/seat/yr single terminal, ~$28,320 multi-terminal (est. — Bloomberg publishes nothing). ~6.5% renewal uplift in 2025. Flat all-in bundle, deliberately un-unbundleable.',
      pricingConfidence: 'estimate',
      scale: '~325,000 subscribers (2022, carried forward); Terminal is >85% of Bloomberg LP revenue (~$12.5B est.).',
      surfaces: 'Native terminal + dedicated keyboard, Bloomberg Anywhere + B-Unit biometric fob, mobile, Excel add-in (BDP/BDH/BDS), Instant Bloomberg chat, Vision Pro app.',
      moat: 'THE MOAT IS THE CONVERSATION, NOT THE DATA. Counterparties negotiate and execute inside IB chat; a quote becomes a binding order that routes to settlement. Leaving IB drops you out of the liquidity pool — and IB is an archived, surveillable channel compliance already accepts.',
      moatArchetype: 'semantic-lock-in',
      weakness: '1980s orange-on-black UI, near-zero mouse affordance, months to proficiency, weak mobile, slow AI integration. Price raised ~60% over 16 years while growing the base — inelastic demand enforced by lock-in, not re-won each year.',
      lesson: 'Own the transactional communication channel BETWEEN two customers, not the content one customer reads. That is the only moat nobody has cracked in 40 years.',
      durability: 97,
      verdict: 'The most durable moat in any market we have studied — a two-sided transaction network disguised as a data terminal.',
    },
    {
      rank: 8,
      name: 'AlphaSense',
      job: 'AI search and agentic research across a curated corpus of filings, transcripts, broker research and expert calls — plus the customer\'s own internal documents.',
      pricing: '~$10,000–20,000/seat/yr enterprise; $40,000+/seat with expert-call transcripts (est.). Median observed contract ~$18,375/yr; ARR per customer grew $28K → $66K in under 3 years.',
      pricingConfidence: 'estimate',
      scale: 'ARR $600M+ (Q1 2026), $350M raised at $7.5B valuation (Jun 2026). 7,000+ enterprises; ~90% of S&P 100. Acquired Tegus for $930M.',
      surfaces: 'Web workspace, browser extension/web clipper, TWO Excel add-ins, Microsoft AppSource listing, mobile, alerts and scheduled digests, public developer API, Slack/Salesforce integrations.',
      moat: 'Exclusive content bought not built — 500M+ premium documents, 200,000+ expert transcripts, 4,500 Canalyst models. Plus Enterprise Intelligence: once a firm indexes its OWN research into AlphaSense, switching means re-indexing institutional memory.',
      moatArchetype: 'licensed-data',
      weakness: 'Price opacity is the #1 complaint; "noisy search results" is the top functional gripe; a Gartner review flagged financials as "frequently incomplete, stale, or has errors". Structurally SUPPLEMENTARY to Bloomberg/FactSet — which makes it a budget-cut candidate in a downturn while the Terminal is not.',
      lesson: 'Buy the corpus, then get the customer\'s own documents into your index. The second is free and stickier than the $930M one.',
      durability: 84,
      verdict: 'Best-funded content roll-up in the category; the leased half of the moat is the risk.',
    },
    {
      rank: 9,
      name: 'Recorded Future (Mastercard)',
      job: 'One queryable index of everything known about an indicator, actor, vulnerability or company — so CTI triage stops being manual OSINT.',
      pricing: 'Median observed contract $70,287/yr across 46 purchases, range $27K–$173K (vendor guides claim $100–500K — the transaction data says otherwise). US Cyber Command awarded $50M.',
      pricingConfidence: 'estimate',
      scale: 'Acquired by Mastercard for $2.65B (closed Dec 2024), from Insight Partners at $780M in 2019. 1,900+ clients, governments of 45 countries, >50% of the Fortune 100.',
      surfaces: 'Intelligence Cloud web workspace, FREE browser extension (Express), API-first with 100+ integrations, free Collective Insights ingestion API, Slack/Teams, Recorded Future University (certification), The Record (owned publication).',
      moat: 'The graph, not the feed — 1M+ sources dynamically linked. Post-acquisition it gained Mastercard payments-network telemetry: a collection source structurally unbuyable by any CTI competitor.',
      moatArchetype: 'licensed-data',
      weakness: 'Cost is complaint #1. "Overwhelming data volume, requires tuning to reduce noise" — alert fatigue pushed onto the customer. Critically: OPAQUE SCORING — reviewers cannot audit why an entity scored what it scored. Provenance-of-source is not provenance-of-judgment.',
      lesson: 'Give away the surface in the analyst\'s click-path (free extension) and the ingestion pipe (free API); charge for the graph. Lock-in built from the customer\'s OWN telemetry, not contract terms.',
      durability: 88,
      verdict: 'Bought a moat nobody can rent. But its scoring opacity is precisely the gap a provenance-first challenger attacks.',
    },
    {
      rank: 10,
      name: 'Dataminr',
      job: 'Be FIRST to tell you something is happening — physical event, breaking news, cyber incident — minutes before wire services. The job is latency, not depth.',
      pricing: 'AWS Marketplace public list: $65,000/yr per Pulse module (Corp Risk, Brand Risk, Cyber Risk) — modules stack, they do not bundle. Median observed contract $22,000/yr, range $15K–$62.5K.',
      pricingConfidence: 'confirmed',
      scale: '$475M raised at $4.1B (2021); ~$200M ARR (est.). But secondary-market valuation reportedly near $1.0B — a ~75% markdown — plus 20% layoffs (2023) and two consecutive convertible/debt rounds in 2025.',
      surfaces: 'Web app, iPhone/iPad/Android (a genuine differentiator — physical-security users are not at a desk), Slack, Teams, Pulse Cyber API into SOAR/SIEM, developer portal.',
      moat: 'RENTED. Privileged unfiltered access to the full X/Twitter firehose while competitors get pre-filtered subsets. Everything since (100K→1M sources, ReGenAI, Intel Agents) is expensive relocation of the moat from access to inference.',
      moatArchetype: 'licensed-data',
      weakness: 'Noise scales with event density — the product degrades exactly when you need it most. False-positive control is outsourced to human account managers, a services answer to a product problem. Serious surveillance-ethics exposure (BLM protest monitoring, against X\'s own terms).',
      lesson: 'A moat you rent is a moat someone else can drain. If your differentiation is a licence, you are one renegotiation from commodity.',
      durability: 45,
      verdict: 'The clearest cautionary tale in the study — a $4.1B valuation built on someone else\'s contract, now marked down ~75%.',
    },
    {
      rank: 11,
      name: 'Feedly (Threat Intelligence)',
      job: 'Kill the analyst\'s manual collection loop — stop reading 200 sources to find the 5 that matter, and get a draft report with citations out the other end.',
      pricing: '~$19,200/yr Standard, ~$38,400 Advanced (est.). Critically: WHOLE-TEAM ACCESS, no per-seat charge. Meters on AI Feeds (50/100) and Agents instead.',
      pricingConfidence: 'estimate',
      scale: '400+ security teams. Remarkably, ~$1.5M ever raised and ~66 employees — competing against a Mastercard subsidiary.',
      surfaces: 'Web workspace, AI Feeds, Ask AI + Report Builder, Slack/Teams, STIX 2.1 API, OpenCTI/XSOAR/MISP/Sentinel integrations, and an early first-class Threat Graph MCP server.',
      moat: 'No proprietary collection at all — it reads the same 10,000+ open sources anyone can. The moat is the EXTRACTION layer: 1,000+ AI models building a Threat Graph (800+ actors, 300K+ CVEs, 500K+ IoCs). Plus a price-point moat at ~1/12th of Intel 471.',
      moatArchetype: 'workflow-shape',
      weakness: 'Coverage ceiling — open-source-first, no HUMINT, no closed-forum access. A complement to Intel 471/Flashpoint, not a substitute. No published precision benchmark for models whose whole value proposition is filtering.',
      lesson: 'WHEN YOU CANNOT OWN THE DATA, OWN THE TRACEABILITY. Feedly spends nothing on collection and is praised for transparent citation, while a $2.65B incumbent is criticized for opaque scoring. And: meter on feeds/agents, not seats — per-seat pricing taxes the exact behaviour an intelligence product needs.',
      durability: 62,
      verdict: 'The most important specimen for us — proves verifiability beats exclusivity, on almost no capital.',
    },
    {
      rank: 12,
      name: 'Intel 471',
      job: 'Adversary intelligence at the ACTOR level — who they are, what they are building, what they will hit next. For CTI teams that have outgrown feeds and want attribution.',
      pricing: 'Median observed contract $240,000/yr, range $160K–$249K — the most expensive in the study, ~3.4x Recorded Future\'s median. Thoma Bravo completed a strategic investment.',
      pricingConfidence: 'estimate',
      scale: '$55.7M raised. Acquired Cyborg Security (2024), which grew the threat-hunting customer base 65% in year one.',
      surfaces: 'TITAN platform, RESTful API, alerting/keyword watchers, CU-GIR-mapped structured intelligence, HUNTER threat-hunting content packs.',
      moat: 'HUMINT — human sources inside closed criminal communities, structured against a formal intelligence-requirements framework (CU-GIR). The framework is the quiet moat: it turns artisanal human output into a subscribable, auditable product.',
      moatArchetype: 'deployability',
      weakness: 'Price. Deep-but-narrow by construction — HUMINT does not scale linearly. Commonly run ALONGSIDE Recorded Future rather than instead of it.',
      lesson: 'Depth commands a premium breadth cannot. If you cannot win on coverage, win on something structurally unscrapable — and let the incumbent be your distribution partner rather than your competitor.',
      durability: 80,
      verdict: 'Charges 3.4x the market leader while being its complement — the clearest proof that judgment outprices volume.',
    },
    {
      rank: 13,
      name: 'Rogo',
      job: 'Do the associate\'s work — comps, precedent transactions, CIM generation, data-room diligence, model audits — and emit the actual deliverable (.xlsx, .pptx, .docx).',
      pricing: '~$3,300/seat/yr (est., and inconsistent with other disclosures — treat as soft). Multi-year contracts, single-tenant deployment, compliance certs bundled.',
      pricingConfidence: 'estimate',
      scale: 'Revenue $2M (2024) → $15M+ (2025). Series D $160M led by Kleiner Perkins; >$300M total; $750M post at Series C. 35,000+ professionals at 250+ institutions. Rothschild, Jefferies, Lazard, Moelis, Nomura.',
      surfaces: 'Chat, AI table interface, Excel/PowerPoint/Word integrations, workflow templates, Felix (agentic deal execution), firm data-warehouse connectivity.',
      moat: 'Office-artifact lock-in plus a compliance wall — SOC 2, ISO/IEC 27001, ISO/IEC 42001 (AI management), GDPR, EU AI Act, single-tenant, no training on customer data. ISO 42001 is a procurement gate most startups cannot clear.',
      moatArchetype: 'workflow-shape',
      weakness: 'Model dependency on OpenAI/Google. Incumbent retaliation risk — S&P/FactSet/Bloomberg can bundle at marginal cost, and Rogo pays those same vendors for data. Practitioner skepticism of AI copilots in deal work is high.',
      lesson: 'Never let the model do arithmetic it could do with a data pull. And ship the DELIVERABLE format — banking runs on .xlsx and .pptx; a chat response gets copy-pasted out of and forgotten.',
      durability: 72,
      verdict: 'Converts regulation into a barrier to entry — the most replicable moat archetype, executed best.',
    },
    {
      rank: 14,
      name: 'Kensho (S&P Global)',
      job: 'Not an end-user product — the AI/ML infrastructure layer that makes S&P\'s proprietary data machine-consumable and LLM-addressable.',
      pricing: 'No published rate card; usage- and scope-based. Acquired by S&P Global for ~$550M (2018). Value capture is internal — it defends the core data subscription franchise.',
      pricingConfidence: 'none',
      scale: 'S&P Global Market Intelligence reorganized in Jul 2026 into two verticals, one of them "Kensho Data & Platforms" — Kensho moved to the front of the business.',
      surfaces: 'APIs first — LLM-ready API with REST, a Python client that generates editable code, and an MCP server. Embedded in Capital IQ Pro as ChatIQ and Document Intelligence. S&P Global Marketplace.',
      moat: 'ENTITY RESOLUTION AS CHOKEPOINT. NERD and Link resolve messy third-party data to S&P company IDs — the output is only useful inside S&P\'s identifier space. Joins are forever; that is a data-gravity engine.',
      moatArchetype: 'semantic-lock-in',
      weakness: 'Value-capture ambiguity — acquired for $550M in 2018 and only now reorganized into the client-facing layer, arguably admitting the standalone-AI-product thesis did not monetize directly. TAM capped to S&P customers by construction.',
      lesson: 'Split retrieval into DETERMINISTIC and ADAPTIVE, and expose that boundary to the customer as a product surface, not an implementation detail. Structured facts return as JSON from a governed dataset; the model only does language.',
      durability: 85,
      verdict: 'The cleanest architectural idea in the whole study — and the one most directly applicable to our provenance stack.',
    },
    {
      rank: 15,
      name: 'PitchBook (Morningstar)',
      job: 'Private capital markets system-of-record — deal sourcing, comps, fund benchmarking, LP/GP research, diligence.',
      pricing: 'Per-licensed-user seats, quote-gated. Median observed contract $31,875/yr, range $20K–$122K. FY2025 segment revenue $671.8M, +8.6%.',
      pricingConfidence: 'confirmed',
      scale: '~10,200 client accounts, 113,451 licensed users. 1,800+ researchers; ~6M companies covered.',
      surfaces: 'Web platform, Chrome extension, Excel plugin, PowerPoint plug-in, Salesforce CRM plugin, mobile, Direct Data APIs, MCP connector into ChatGPT, integrations with Hebbia and Rogo.',
      moat: 'Citational authority — PitchBook numbers are the ones quoted in press and IC memos. Plus workflow lock-in: models and CRM records are built on PitchBook IDs, so ripping it out breaks live spreadsheets.',
      moatArchetype: 'licensed-data',
      weakness: 'THE DAMNING NUMBER: renewal rate fell 108% → 103% while licensed users stayed flat and revenue grew 8.6% — growth is price escalation on a static base. Corporate segment explicitly churning. Complaints cluster on stale data and cancellation friction.',
      lesson: 'Seat pricing on a flat user base turns renewal into an extortion negotiation. When your usage metric stops growing, price rises stop reading as value and start reading as a tax.',
      durability: 76,
      verdict: 'Citational authority is a real moat — but it is being monetized in a way that is visibly eroding retention.',
    },
    {
      rank: 16,
      name: 'Similarweb',
      job: 'Digital traffic intelligence — competitive benchmarking, market sizing, SEO/PPC and audience analysis, plus alt-data for investors.',
      pricing: 'Quote-only since 2026 (a transparency regression). Median observed contract $37,800/yr, range $14K–$96K. FY2025 revenue $282.6M, +13%.',
      pricingConfidence: 'confirmed',
      scale: '6,128 customers; 454 at ≥$100K ARR (63% of ARR). Market cap ~$640M, down ~57% YoY.',
      surfaces: 'Modular web platform, Chrome extension (dual-purpose: funnel AND panel data source), API/data feeds, MCP server, AI agents (Prospecting, Outreach, Amazon Keyword).',
      moat: 'Contributory panel + multi-source fusion — first-party analytics, a contributors network across millions of devices, public extraction, and ISP partnerships. Modeling is the moat, not collection: anyone can scrape, almost nobody can calibrate a panel into comparable metrics across 100M sites.',
      moatArchetype: 'licensed-data',
      weakness: 'THE NUMBER THAT MATTERS: net retention fell 101% → 98%, and the $100K+ cohort fell 112% → 103%. Expansion has stopped even at the top. Multi-year contracts rose 49% → 60% — buying retention with term length rather than earning it. Accuracy is a permanent structural complaint (estimates, not server logs).',
      lesson: 'Sell the ruler for the new world before your old ruler stops being read — Similarweb\'s Gen-AI Brand Visibility measures the very shift from clicks to LLM answers that erodes its core asset.',
      durability: 64,
      verdict: 'Instrumenting its own disruption is the right move; the 98% NRR says it may be too late.',
    },
    {
      rank: 17,
      name: 'Crunchbase',
      job: 'Company/funding discovery at the self-serve long tail — startup lookup, list building, light prospecting. Repositioned in 2025 as a predictions engine.',
      pricing: 'The only genuine PLG player here — Starter ~$29/user/mo, Pro $49–99, Business ~$199/mo, Enterprise $50K+. Median contract $20,000/yr with the highest negotiated discount (21.4%) of its peer set — i.e. the weakest pricing power.',
      pricingConfidence: 'estimate',
      scale: '4.3M+ organizations, 80M active users (company-reported). $107M raised; last round 2022.',
      surfaces: 'Web app, Chrome extension, API (free tier eliminated 2025), CRM integrations, Crunchbase News, and the public company profile pages themselves as an enormous organic-search footprint.',
      moat: 'SEO + entity-namespace ubiquity — "crunchbase.com/organization/x" is the default public URL for a startup, making it a de facto canonical company ID. Plus usage signals from 80M users: who is LOOKING at a company is a leading indicator rivals with 113K users cannot replicate.',
      moatArchetype: 'licensed-data',
      weakness: 'Outdated/incorrect data is the #1 recurring complaint — fatal for the prospecting use case it sells into. Killing the free API burned developer goodwill and spawned a whole genre of "Crunchbase alternatives" content.',
      lesson: 'Do not sell prophecy on top of a dataset people already think is stale. Credibility is sequential — you must be trusted on the observable before anyone buys your forecast.',
      durability: 58,
      verdict: 'Strong namespace, weak trust. The predictive pivot bets on the future while the base complaint is about the past.',
    },
    {
      rank: 18,
      name: 'Meltwater / Cision',
      job: 'Media monitoring, social listening, PR measurement, journalist database, press-release distribution. Same ingest→filter→alert→report machine, aimed at Comms.',
      pricing: 'Meltwater median $25,800/yr, range $5.4K–$57K. Hidden costs: onboarding $2K–$10K, overage charges, 3–7% annual renewal increases.',
      pricingConfidence: 'estimate',
      scale: 'Meltwater taken private ~$550M on ~$462M revenue — ~1.2x revenue, the market\'s verdict on commodity monitoring. Cision acquired for $2.74B, now ~$2.5B leveraged and downgraded to Caa1.',
      surfaces: 'Web dashboards, email digests, mobile, Slack/Teams alerting, API, Chrome extensions, Boolean query builders, PR Newswire distribution.',
      moat: 'Weak and eroding — licensed content, historical archives, saved Boolean searches, the journalist contact database. In practice the operative moat became CONTRACTUAL: 60-day auto-renewal clauses that "rarely appear on the contract you sign but live in the referenced terms of service".',
      moatArchetype: 'licensed-data',
      weakness: 'The most damning complaint set in the study — and it is about the CONTRACT, not the product. Auto-renewal traps, cancellation obstruction, aggressive sales. 4.1/5 across ~2,900 reviews: the product is fine, the company is the complaint.',
      lesson: 'When the product moat dies, companies reach for the contract moat — and it destroys the brand faster than competition would have. This is the terminal state of an alerting business that never converted monitoring into judgment.',
      durability: 30,
      verdict: 'The end state to avoid. Every one of those reviews is a permanent, indexed liability.',
    },
  ] as EnterpriseSpecimen[],

  /** Where the market is unserved — and whether our estate can actually serve it. */
  unserved: [
    {
      gap: 'Provenance as a first-class, verifiable artifact',
      evidence: 'Citations are marketed everywhere but only Hebbia treats them as the product primitive; nobody ships a cryptographically verifiable warrant. Perplexity is being sued partly over FALSE attribution of hallucinations.',
      ourPosition: 'Our deepest capability — atlas/semantics (JSON-LD/RDF/SHACL), tritrpc proof_envelope + attestation_verifier, prophet-truth, model-governance-ledger. We can render source + reasoning trace + policy verdict + attestation, not a footnote link.',
      weCanServe: 'yes',
    },
    {
      gap: 'Sovereign / air-gapped governed AI at non-Palantir prices',
      evidence: 'Only Palantir (£3M/yr org licence) and Primer confirm air-gapped/DDIL operation. Everyone else is cloud-hosted. That leaves an enormous price-to-capability gap under Palantir.',
      ourPosition: 'SourceOS, SociOS-Linux, sovereign registry, Porter, on-device llama3.2 carry profiles, tritrpc AEAD sealed transport. Deployability is designed in, not retrofitted.',
      weCanServe: 'yes',
    },
    {
      gap: 'Governance NOT paywalled behind an 8× price step',
      evidence: 'Perplexity gates SCIM, audit logs and retention to the $3,250 tier vs $400 — buyers wanting basic governance face a cliff. Palantir bundles governance but at £3M.',
      ourPosition: 'Governance is our default posture, not an upsell — policy-fabric, autonomy_gate, promotion_controller, Lawful Learning invariants. We can ship audited-by-default at the entry tier.',
      weCanServe: 'yes',
    },
    {
      gap: 'A live permissions graph across enterprise SaaS',
      evidence: 'Glean\'s multi-year ACL mirroring is the hardest thing to copy in the market and is why it is deployable company-wide.',
      ourPosition: 'We do NOT have this. No per-connector ACL ingestion, no real-time ACL delta-sync. This is a genuine, expensive gap.',
      weCanServe: 'no',
    },
    {
      gap: 'Licensed real-time data firehose',
      evidence: 'Quid (2PB, direct platform partnerships) and Perplexity Finance (FactSet, S&P, LSEG, Morningstar) both rest on licensing we would have to buy.',
      ourPosition: 'We have no comparable licensed feeds. Buy, partner, or compete on a different axis entirely.',
      weCanServe: 'no',
    },
    {
      gap: 'Export in the shape of the professional deliverable',
      evidence: 'Hebbia — a ~$10K/seat product — reportedly cannot export to Word or PDF. Users protest this directly.',
      ourPosition: 'Trivially serviceable and it is a live, cited complaint against the market leader in its niche.',
      weCanServe: 'partly',
    },
  {
      gap: 'Provenance of JUDGMENT, not just provenance of source',
      evidence: 'Recorded Future — a $2.65B-acquired leader — is criticized because reviewers "cannot learn the behind-the-scenes reasons for how they evaluate risk". Every vendor cites sources; NONE publishes per-claim lineage, entity-resolution methodology, or why a score is what it is.',
      ourPosition: 'This is precisely our spine: atlas/semantics (SHACL-validated), tritrpc proof_envelope + attestation_verifier, prophet-truth (Truth = Law × Evidence), model-governance-ledger. We can ship a warrant, not a footnote.',
      weCanServe: 'yes',
    },
    {
      gap: 'A deterministic / generated boundary exposed as a product surface',
      evidence: 'Four vendors converged on this independently (Kensho, Rogo, Brightwave, AlphaSense) but only Kensho names it. Nobody sells the boundary itself as an auditable contract.',
      ourPosition: 'Our trit/provenance spine and policy plane are built to express exactly this: retrieved-and-attested vs generated-and-marked. Making it a visible product boundary is a small step from where we are.',
      weCanServe: 'yes',
    },
    {
      gap: 'Precision — nobody has solved noise, they have only distributed its cost',
      evidence: 'Recorded Future pushes tuning onto the customer; Dataminr onto human account managers; ZeroFox onto its own 31% gross margin; Intel 471 onto humans priced at $240K/yr. Dataminr\'s noise gets WORSE in high-event-density regions — it degrades exactly when needed most.',
      ourPosition: 'A genuine opening, but not a free one — it needs measured precision we do not yet publish. Honest status: unproven.',
      weCanServe: 'partly',
    },
    {
      gap: 'Metering that does not tax distribution',
      evidence: 'Feedly sells WHOLE-TEAM access and meters on feeds/agents; PitchBook\'s per-seat model on a flat user base drove renewal from 108% to 103% and clustered cancellation complaints. Per-seat pricing taxes the exact behaviour an intelligence product needs — wide distribution of the intelligence.',
      ourPosition: 'We are pre-revenue here, so we can choose the meter deliberately rather than inherit a bad one. Meter on governed artifacts or agents, not seats.',
      weCanServe: 'yes',
    },
  ] as UnservedGap[],

  ourRead:
    'Two of the durable moat archetypes are already ours — DEPLOYABILITY (SourceOS, sovereign registry, on-device carry profiles, sealed tritrpc transport) and GOVERNED PROVENANCE (atlas/semantics, proof_envelope, model-governance-ledger, policy-fabric). Two are not: a live PERMISSIONS GRAPH (Glean\'s multi-year ACL mirroring) and LICENSED DATA (Quid, Bloomberg, AlphaSense, Perplexity Finance). So our defensible position is the Palantir/Primer axis — governed, sovereign, air-gapped, provenance-first — at a price far under £3M/yr, NOT the Glean/Perplexity axis of horizontal SaaS retrieval where we would fight an ACL moat we have not built and licences we do not hold. FEEDLY IS THE PROOF CASE: on ~$1.5M ever raised and zero proprietary collection, it beats a $2.65B-backed incumbent on trust by making every claim click back to source. Traceability is a cheaper moat than exclusivity — and a more durable one, because exclusivity expires with the contract while provenance compounds with the graph. That is the single most important finding in this study for us, because it says our thesis is not merely defensible, it is the cheapest defensible position available.',

  sourcing:
    'Palantir pricing is CONFIRMED from the public UK G-Cloud 14 price sheet — unusually hard numbers. Perplexity pricing is published. Glean, Hebbia and Quid publish no rate card; those seat prices are third-party estimates and flagged as such. Primer pricing is unavailable. Revenue/ARR figures are company-reported or third-party estimates. Hebbia\'s $13M ARR is a stale Jun-2024 disclosure with no 2026 update found.',
};
