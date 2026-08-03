// Per-app dossiers for the Competitive Intelligence surface.
// Each specimen's captured feature set (assessed), a per-step read of how well it
// runs the six-part machine, and the attack vectors — how we beat them.
// Keyed by slug = slugify(app.name). Merged with the base RankedApp on the detail page.

export type FeatureVerdict = 'moat' | 'copyable' | 'commodity' | 'gap';

export type CapturedFeature = {
  name: string;
  assessment: string;
  verdict: FeatureVerdict;
};

export type Dossier = {
  /** Per-step assessment aligned to machineSteps below (0-100). */
  machineScores: number[];
  features: CapturedFeature[];
  /** How we beat them — concrete attack vectors, tied to our estate where possible. */
  beatThem: string[];
};

/** Short labels for the six machine steps, index-aligned with Dossier.machineScores. */
export const machineSteps: string[] = [
  'Aha < 60s',
  'Paywall @ peak',
  'Surface colonized',
  'Retention',
  'Share loop',
  'Organic floor',
];

export const verdictLabel: Record<FeatureVerdict, string> = {
  moat: 'moat',
  copyable: 'copyable',
  commodity: 'commodity',
  gap: 'gap / opening',
};

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const dossiers: Record<string, Dossier> = {
  duolingo: {
    machineScores: [78, 72, 86, 98, 82, 86],
    features: [
      { name: 'Streak + Streak Freeze/Repair', assessment: 'Loss-aversion engine with engineered forgiveness so one miss does not cause abandonment; ~2x daily retention.', verdict: 'moat' },
      { name: 'Lifecycle notification system', assessment: 'Segments users, scores urgency, picks copy variants and delivery windows — orchestration, not blasts.', verdict: 'moat' },
      { name: 'Leagues / leaderboards', assessment: 'Social competition loop that adds a second retention axis beyond the streak.', verdict: 'copyable' },
      { name: 'Energy / hearts session cap', assessment: 'Mid-session friction that upsells Super; actively A/B-tested and causing live churn backlash.', verdict: 'gap' },
      { name: 'Mascot / brand virality', assessment: '"Death of Duo" campaign hit ~1.7B impressions — brand as growth channel.', verdict: 'moat' },
    ],
    beatThem: [
      'Adopt the forgiving-streak + calibrated-notification stack on our daily-use surfaces (cockpit, twin) — this is the transferable core.',
      'Attack the energy-cap backlash: a fair, uncapped free tier that still monetizes on depth reads as pro-user where they now read as punitive.',
      'Their job is single-domain (language). Our estate spans domains — a cross-domain streak (learning + health-twin + prophecy) has no direct competitor.',
    ],
  },
  grammarly: {
    machineScores: [88, 66, 96, 82, 40, 88],
    features: [
      { name: 'Install-once, appear-everywhere', assessment: 'One install yields keyboard + editor + browser extension — the reference surface-colonization play.', verdict: 'moat' },
      { name: 'Inline correction card', assessment: 'The locked premium rewrite is shown greyed in-context = paywall-as-demo at the moment of need.', verdict: 'copyable' },
      { name: 'Weekly Insights email', assessment: 'Re-engagement + activation ("more productive than 82% of users"); forces the extension-install event.', verdict: 'copyable' },
      { name: 'Tone / clarity rewrites', assessment: 'The paid tier; increasingly commodity as LLMs generalize.', verdict: 'commodity' },
      { name: 'Virality', assessment: 'Writing is private — no share loop. Growth is pure distribution + SEO.', verdict: 'gap' },
    ],
    beatThem: [
      'Our BearBrowser cockpit is already the OS surface Grammarly rents — we own the browser, so an inline assist can ride every page/field natively with lower friction.',
      'Beat the commodity-rewrite tier with governed, cited output (our evidence fabric) — trust as a visible primitive is a wedge they lack.',
      'They have no share loop; if our assist produces a postable artifact we add a growth axis they structurally cannot.',
    ],
  },
  photoroom: {
    machineScores: [96, 84, 78, 74, 82, 86],
    features: [
      { name: '1-second on-device cutout', assessment: 'Instant before/after on import; the aha is a rendered result, pre-paywall. Ran on-device via Core ML for speed/cost.', verdict: 'moat' },
      { name: 'Use-case-boundary paywall', assessment: 'Free but watermarked + no commercial use; gates exactly what a paying user needs. ~1-month payback.', verdict: 'copyable' },
      { name: 'Template grid (1,000+)', assessment: 'Reskin engine that turns a cutout into a finished listing; workflow lock-in for sellers.', verdict: 'copyable' },
      { name: 'Batch + Remove-Background API', assessment: 'Up-market expansion (Netflix/Shopify/Faire); data flywheel of 5B+ photos/yr.', verdict: 'moat' },
      { name: 'Onboarding permission prompts', assessment: 'Two back-to-back system prompts with no warm-up — a flagged drop-off risk.', verdict: 'gap' },
    ],
    beatThem: [
      'Copy the watermark-as-paywall-and-ad mechanic wholesale — it is the single most efficient monetization+virality primitive here.',
      'Attack the onboarding drop-off with warm-up screens before permissions (a known, unfixed weakness).',
      'They are seller-tooling; a twin/identity-aware image surface (health/space twins) is a job they do not touch.',
    ],
  },
  capcut: {
    machineScores: [92, 66, 84, 78, 96, 80],
    features: [
      { name: 'Trending template feed', assessment: 'Pick -> auto-fill -> export in <1 min, zero skill; refreshes with what is trending on TikTok now.', verdict: 'copyable' },
      { name: '"Try this template" deep link', assessment: 'Two-sided loop with TikTok — every video is a re-entry point. ByteDance owns both apps.', verdict: 'moat' },
      { name: 'Auto-captions + AI effects', assessment: 'Table-stakes creator tooling; increasingly commodity.', verdict: 'commodity' },
      { name: 'Watermark on export', assessment: 'Standard virality + Pro-upsell lever.', verdict: 'copyable' },
      { name: 'Pricing restructure (2026)', assessment: 'Pro pushed toward ~$19.99/mo — margin grab that opens a price flank.', verdict: 'gap' },
    ],
    beatThem: [
      'We cannot out-distribute a TikTok-owned app; do not fight on general short-form. Compete only where output ties to our data (prophecy explainers, twin timelines).',
      'Exploit the 2026 price hike: a cheaper/owned creator surface for our verticals peels off cost-sensitive users.',
      'Their template loop needs an owned social graph — pair any creator tool with our sociosphere, not a third-party feed.',
    ],
  },
  speechify: {
    machineScores: [86, 66, 90, 80, 58, 84],
    features: [
      { name: 'Auto-scroll read-along', assessment: 'Word-by-word highlight at 3-5x — makes pace itself the visible, addictive product.', verdict: 'copyable' },
      { name: 'Multi-surface capture', assessment: 'Chrome ext + share-sheet + OCR camera + floating player — owns every reader entry point.', verdict: 'moat' },
      { name: 'Premium neural voices', assessment: 'ElevenLabs-grade voices as the upsell; commodity as TTS models generalize.', verdict: 'commodity' },
      { name: 'Accessibility/education halo', assessment: '100k+ 5-star reviews + Apple Design Award — a review moat that compounds conversion.', verdict: 'moat' },
      { name: 'Share loop', assessment: 'Listening is private; weak virality, carried by distribution + SEO.', verdict: 'gap' },
    ],
    beatThem: [
      'The read-along + share-sheet-listen pattern maps directly onto SocioProphet news/feeds — field it there as an owned surface.',
      'Voice is now commodity; win on what we read (governed, cited prophecy/news) not the voice quality race.',
      'Add the share loop they lack: an audio-clip export of a read passage is postable where their private listening is not.',
    ],
  },
  perplexity: {
    machineScores: [92, 62, 80, 70, 84, 88],
    features: [
      { name: 'Inline citations', assessment: 'Renders receipts as a UI primitive — trust as product. The clearest transferable idea here.', verdict: 'copyable' },
      { name: 'Shareable answer pages', assessment: 'SEO-indexed, each answer is an organic-acquisition asset — its strongest loop.', verdict: 'moat' },
      { name: 'Comet AI browser', assessment: 'Surface land-grab + referral ($20/signup); capital-intensive, contested.', verdict: 'gap' },
      { name: 'Deep Research', assessment: 'Multi-step synthesis; commodity as frontier models add it natively.', verdict: 'commodity' },
      { name: 'Pro-Search daily cap', assessment: 'Upsell when you exhaust searches mid-task; opaque/adjusted cap.', verdict: 'copyable' },
    ],
    beatThem: [
      'Their citation UI is exactly our evidence/provenance fabric — we can render deeper warrants (source + reasoning trace), not just links.',
      'Beat them on grounded verticals (law, markets, economy) where our fixtures/ontology give defensible depth vs a general answer box.',
      'Their moat is shareable pages + a browser; our BearBrowser + sociosphere can host the same loop on owned rails.',
    ],
  },
  'cal-ai': {
    machineScores: [90, 96, 74, 66, 78, 76],
    features: [
      { name: '~30-step onboarding quiz', assessment: 'The quiz IS the paywall — builds sunk cost + branches to different walls. Best-in-class.', verdict: 'moat' },
      { name: 'Dynamic paywall (Superwall)', assessment: '400+ variants A/B-tested; annual anchor vs decoy weekly; geo/device pricing; 3x rev.', verdict: 'copyable' },
      { name: 'Photo -> macros', assessment: 'A 2-second aha; the CV/vision layer is commoditizing fast.', verdict: 'commodity' },
      { name: 'Daily rings dashboard', assessment: 'Glanceable retention hook; weaker than a true streak.', verdict: 'copyable' },
      { name: 'Retention', assessment: 'Calorie logging churns hard once novelty fades — the structural weakness.', verdict: 'gap' },
    ],
    beatThem: [
      'Steal the quiz-as-paywall + dynamic-pricing craft outright — it is the highest-ROI mechanic in this catalog and applies to any of our surfaces.',
      'Attack their retention gap: our Digital Health Twin is accumulating state (a reason to return) that a calorie logger cannot match.',
      'Vision-based logging is commodity; win on the twin context around it (trends, projections, before/after) not the scan itself.',
    ],
  },
  photomath: {
    machineScores: [96, 64, 82, 74, 60, 90],
    features: [
      { name: 'Camera-first scan', assessment: 'Viewfinder is the home screen; reads handwriting; aha in ~2s with no account.', verdict: 'copyable' },
      { name: 'Free step-by-step', assessment: 'Answer + basic steps free = retention core; the giveaway that builds the habit.', verdict: 'copyable' },
      { name: 'Animated tutorials (Plus)', assessment: 'Sells the explanation depth, not the answer — the paywall placement lesson.', verdict: 'moat' },
      { name: 'Homework-season SEO', assessment: 'Long-tail organic + seasonal spikes; compounding App Store rank.', verdict: 'copyable' },
      { name: 'Virality', assessment: 'One-sentence demo word-of-mouth only; no built-in share loop.', verdict: 'gap' },
    ],
    beatThem: [
      'The "give the answer free, sell the understanding" split is directly transferable to any of our reasoning surfaces.',
      'Now Google-owned and seasonal — a governed, always-on tutor tied to our academy/reasoning stack competes on depth + trust.',
      'Add explanation provenance (why each step is valid) — a differentiation their black-box steps lack.',
    ],
  },
  facetune: {
    machineScores: [86, 76, 72, 83, 88, 80],
    features: [
      { name: 'Press-and-hold before/after', assessment: 'Signature reveal — builds control-trust AND manufactures the shareable contrast in one gesture.', verdict: 'copyable' },
      { name: 'One-tap "perfect" preset', assessment: 'Instant wow before granular tools; the aha comes free.', verdict: 'copyable' },
      { name: 'Reshape / relight / AI retouch', assessment: 'Deep tool suite; retention via habitual pre-post editing.', verdict: 'moat' },
      { name: 'Save-limit free gate', assessment: 'Aggressive limit that pushes conversion; a churn/refund risk.', verdict: 'gap' },
      { name: 'Lifetime VIP option', assessment: 'Alternative to subscription fatigue; captures anti-sub buyers.', verdict: 'copyable' },
    ],
    beatThem: [
      'The press-and-hold before/after is the single best UI to steal for our twin surfaces (baseline vs projected state).',
      'Beauty-retouch carries ethics/authenticity baggage; a twin that shows honest projected states (health) sidesteps the reputational edge while keeping the reveal mechanic.',
      'Attack the save-limit friction with a fairer free tier that still gates commercial/AI depth.',
    ],
  },
  'otter-ai': {
    machineScores: [80, 66, 84, 82, 78, 66],
    features: [
      { name: 'OtterPilot auto-join bot', assessment: 'Appears in shared meetings on your behalf — self-distributing presence loop.', verdict: 'moat' },
      { name: 'Live streaming transcript', assessment: 'Real-time value; commodity as ASR generalizes.', verdict: 'commodity' },
      { name: 'Auto summary + action items', assessment: 'The retained artifact; increasingly table-stakes.', verdict: 'commodity' },
      { name: 'Shared transcript links', assessment: 'Non-users open shared notes -> funnel; a second growth axis.', verdict: 'copyable' },
      { name: 'Minute caps', assessment: 'Freemium wall; blunt vs value-metered alternatives.', verdict: 'gap' },
    ],
    beatThem: [
      'The bot-that-joins pattern is the transferable growth idea; pair it with Granola-style botless local capture to dodge the "creepy bot" objection.',
      'Transcription is commodity — win on governed evidence capture (our fabric) that turns a meeting into citable provenance, not just notes.',
      'Their surface is meetings; our reasoning/evidence fabric can capture any stream (calls, docs, feeds) under one provenance spine.',
    ],
  },
  shazam: {
    machineScores: [98, 30, 88, 70, 82, 84],
    features: [
      { name: 'One-tap identify', assessment: 'The purest aha-in-one-tap ever shipped; the whole app is one button.', verdict: 'copyable' },
      { name: 'Widget / Control Center / auto-Shazam', assessment: 'Colonizes every quick-trigger surface; background listening.', verdict: 'moat' },
      { name: 'Verb-ified brand', assessment: '"Shazam it" — organic word-of-mouth baked into language.', verdict: 'moat' },
      { name: 'Streaming handoff', assessment: 'Hands off to Apple Music/Spotify; indirect monetization only.', verdict: 'gap' },
      { name: 'Direct monetization', assessment: 'None — acquired by Apple as a funnel; not a standalone business.', verdict: 'gap' },
    ],
    beatThem: [
      'Steal the one-tap-collapse discipline for our capture surfaces — the magic must fire before any onboarding.',
      'Not a competitor commercially; the lesson is the ruthless simplicity, applied to our snip/capture flows.',
      'Where Shazam hands identity to a platform, our capture keeps it in our provenance spine — capture + ownership, not capture + handoff.',
    ],
  },
  'rocket-money': {
    machineScores: [82, 74, 66, 80, 70, 78],
    features: [
      { name: 'Subscription detection', assessment: 'Aha delivered as a finding on the user\'s own bank data — high trust.', verdict: 'copyable' },
      { name: 'One-tap cancel / concierge', assessment: 'Done-for-you fix; the gated action + 35-60% success fee.', verdict: 'moat' },
      { name: '"Found $X" framing', assessment: 'Concrete value proof that seeds SEO + referral.', verdict: 'copyable' },
      { name: 'PWYW pricing', assessment: 'Pay-what-you-want reduces price friction; unusual lever.', verdict: 'copyable' },
      { name: 'Fee/cancel complaints', assessment: 'Same pattern drives refund/cancel friction — reputational edge.', verdict: 'gap' },
    ],
    beatThem: [
      'The "aha on your own data, paywall the fix not the discovery" pattern maps onto any of our analysis surfaces (economy, markets).',
      'Attack the fee-model resentment with transparent, reversible fixes — trust is the wedge.',
      'Our economic-prophet/markets data can surface findings they cannot (forward-looking, not just past charges).',
    ],
  },
  granola: {
    machineScores: [84, 66, 78, 79, 80, 70],
    features: [
      { name: 'Botless local capture', assessment: 'Native system-audio, no bot in the meeting — sidesteps the privacy/creepy objection entirely.', verdict: 'moat' },
      { name: 'Augment-your-own-notes', assessment: 'Human writes the seed, AI grows it — augments the user artifact instead of replacing it.', verdict: 'copyable' },
      { name: '"Ask Granola" web note', assessment: 'Recipients query a shared note with zero install -> sign up.', verdict: 'copyable' },
      { name: 'Note-history cap', assessment: 'Gates the thing usage forces you into (history), not features.', verdict: 'copyable' },
      { name: 'No browser extension', assessment: 'Native-only; narrower surface footprint than Grammarly-class tools.', verdict: 'gap' },
    ],
    beatThem: [
      'Botless local capture is the pattern to adopt for our evidence fabric — capture without the trust cost.',
      'Their "augment the seed" model fits our human-in-the-loop reasoning; we add provenance they lack.',
      'Young ($1.5B, 2026) but narrow; a cross-surface capture (meetings + docs + feeds) under one spine out-scopes them.',
    ],
  },
  'things-bear': {
    machineScores: [82, 70, 74, 88, 30, 76],
    features: [
      { name: 'Craft-as-feature', assessment: 'Typography/interaction polish as the moat (Design Awards); hard to copy cheaply.', verdict: 'moat' },
      { name: 'Quick Entry / inline #tags', assessment: 'Frictionless capture; tags auto-file, removing folder tax.', verdict: 'copyable' },
      { name: 'Gate on sync (Bear)', assessment: 'Give away the whole app; charge for the thing usage forces (second device).', verdict: 'copyable' },
      { name: 'One-time buy (Things)', assessment: 'Converts on switching cost at trial expiry, not a feature wall.', verdict: 'copyable' },
      { name: 'No growth loop', assessment: 'Deliberately no referral/streaks/virality — caps reach.', verdict: 'gap' },
    ],
    beatThem: [
      'Adopt "gate on sync / accumulated investment" for any owned tool — high retention, low resentment.',
      'They deliberately forgo growth loops; we can match the craft AND add an owned share loop.',
      'Apple-only by design — our cross-platform + estate integration is a structural reach advantage.',
    ],
  },
  blinkist: {
    machineScores: [76, 74, 66, 70, 62, 84],
    features: [
      { name: 'Personalization quiz', assessment: 'Best-in-class interest quiz -> tailored shelf; doubles as the value pitch.', verdict: 'copyable' },
      { name: 'Daily pick', assessment: 'A reason to return; the retention hook for passive content.', verdict: 'copyable' },
      { name: 'Progress bars in onboarding', assessment: 'Certainty cues to prevent drop-off; small but effective.', verdict: 'copyable' },
      { name: '"[Book] summary" SEO', assessment: 'Thousands of programmatic pages = compounding organic floor.', verdict: 'moat' },
      { name: 'Passive content', assessment: 'No quizzes/streaks -> softer retention than active-learning apps.', verdict: 'gap' },
    ],
    beatThem: [
      'Reuse the quiz -> curated -> celebration -> wall onboarding shape on any content surface (news, academy).',
      'Attack the passive-retention gap with active recall (our reasoning/academy stack) on top of summaries.',
      'Their moat is SEO pages; our sociosphere + knowledge graph can host a richer, linked version.',
    ],
  },
  forest: {
    machineScores: [82, 66, 72, 84, 74, 70],
    features: [
      { name: 'Grow/kill a tree', assessment: 'Loss aversion attached to a living, cared-for object; sharper hook than a counter.', verdict: 'moat' },
      { name: 'Coins -> real trees', assessment: 'Bridges the virtual reward to a real-world consequence (2M+ planted) = shareable proof.', verdict: 'moat' },
      { name: 'Plant Together', assessment: 'Group tree dies if anyone quits — social accountability loop.', verdict: 'copyable' },
      { name: 'Focus dial + extension + Watch', assessment: 'Multi-surface presence for the core action.', verdict: 'copyable' },
      { name: 'Plus paywall', assessment: 'Gates species/redemption; mild, not a strong monetizer.', verdict: 'gap' },
    ],
    beatThem: [
      'Attach loss aversion to a living artifact — directly reusable for any of our habit/twin surfaces.',
      'The real-world-consequence bridge (a real tree) is a trust/virality primitive we can mirror with our estate\'s real assets.',
      'Narrow (focus only); a twin that spans focus + health + learning subsumes the job.',
    ],
  },
  snipd: {
    machineScores: [84, 64, 76, 74, 80, 66],
    features: [
      { name: 'One-tap snip', assessment: 'Headphone-button freezes an ephemeral moment into a durable object — the standout mechanic.', verdict: 'moat' },
      { name: 'AI chapters + show notes', assessment: 'Auto-structure of audio; commodity as models improve.', verdict: 'commodity' },
      { name: 'Snip -> Notion/Obsidian/Readwise', assessment: 'Export to second brain pulls in the PKM crowd.', verdict: 'copyable' },
      { name: 'Shareable snip cards', assessment: 'Audiogram + transcript = postable growth object.', verdict: 'copyable' },
      { name: 'Niche audience', assessment: 'Podcast power-users only — limited ceiling.', verdict: 'gap' },
    ],
    beatThem: [
      'The capture-the-fleeting-moment mechanic is the exact pattern for our evidence fabric — snip a claim/source into provenance.',
      'Broaden the stream: not just podcasts but any audio/video/feed under our spine out-scopes them.',
      'Their export feeds other apps; ours captures into an owned second brain (memory-mesh).',
    ],
  },
  remini: {
    machineScores: [86, 82, 74, 62, 88, 78],
    features: [
      { name: 'Before/after slider', assessment: 'Hero UI — instant, undeniable payoff in seconds.', verdict: 'copyable' },
      { name: 'Rotating novelty engine', assessment: 'Fresh viral feature every ~6-12 months from one engine; manufactures repeat waves.', verdict: 'moat' },
      { name: 'Social proof before paywall', assessment: 'Flashes "115M MAU" right before the wall — peak wow = the ask.', verdict: 'copyable' },
      { name: 'Fresh-model integrations', assessment: 'Nano Banana integration drove +175% installs; rides frontier releases.', verdict: 'copyable' },
      { name: 'Retention', assessment: 'Leans on the novelty treadmill; base enhance retains, novelties do not.', verdict: 'gap' },
    ],
    beatThem: [
      'Steal the social-proof-then-hard-paywall staging — engineered peak-desire monetization.',
      'Attack the retention gap: our twin gives accumulating state so we do not need a novelty treadmill to stay relevant.',
      'Their novelty waves are model-dependent; a governed, provenance-aware enhancement is a trust differentiator.',
    ],
  },
  cleo: {
    machineScores: [82, 78, 64, 74, 82, 66],
    features: [
      { name: 'Roast Mode', assessment: 'Personality whose output is inherently shareable — aha, retention, growth in one object.', verdict: 'moat' },
      { name: 'Cash advances', assessment: 'The real retention engine; subscription gated behind the advance need.', verdict: 'gap' },
      { name: 'Chat-first UI', assessment: 'Radical, but no menu fallback is the top complaint.', verdict: 'gap' },
      { name: 'TikTok roast screenshots', assessment: 'Campaigns drove +32% installs — the loop is the roast.', verdict: 'copyable' },
      { name: 'FTC $17M settlement (2025)', assessment: 'Misleading advance claims + hidden fees — a hard cautionary line.', verdict: 'gap' },
    ],
    beatThem: [
      'Steal the "give a boring task a shareable personality" idea — clean, without the advance/fee model that drew the FTC.',
      'Their dark-pattern edge is the opening: a transparent, governed money persona reads as trustworthy where they read as predatory.',
      'Pair a persona with our economic-prophet data for forward-looking roasts, not just past-spend guilt.',
    ],
  },
  'headshotpro-aragon': {
    machineScores: [70, 76, 60, 55, 66, 92],
    features: [
      { name: 'Outcome naming', assessment: 'Named after the deliverable ("headshots") + priced vs a photographer — SEO + positioning.', verdict: 'copyable' },
      { name: 'Speed as a price tier (Aragon)', assessment: 'Turns the wait (biggest UX weakness) into the paid axis.', verdict: 'copyable' },
      { name: 'Enterprise team packs', assessment: 'Land-and-expand into Fortune 500 team headshots = repeat B2B revenue.', verdict: 'moat' },
      { name: 'SEO moat', assessment: 'Ranks #1 for "professional headshots" via programmatic content.', verdict: 'moat' },
      { name: 'One-time / thin retention', assessment: 'Pay-per-pack; little reason to return.', verdict: 'gap' },
    ],
    beatThem: [
      'Copy outcome-naming + price-against-the-human-alternative for any of our generative surfaces.',
      'Attack the retention gap: tie headshots to an identity/twin surface that keeps a durable, updatable profile.',
      'Their moat is SEO; a twin-native identity image bundled into our estate has a built-in audience they must buy.',
    ],
  },
  'elevenlabs-reader': {
    machineScores: [86, 40, 82, 66, 62, 78],
    features: [
      { name: 'Best-in-class voices', assessment: 'The hook; leverages the parent voice moat. Voice quality is the whole pitch.', verdict: 'moat' },
      { name: 'Free consumer app', assessment: 'Given away as a living demo to seed the platform funnel — strategic, not a business.', verdict: 'copyable' },
      { name: 'Share-sheet import', assessment: 'Standard reader capture surface.', verdict: 'commodity' },
      { name: 'Multilingual + offline', assessment: 'Broad coverage; table-stakes for readers.', verdict: 'commodity' },
      { name: 'App-layer monetization', assessment: 'Deliberately none — funnel to platform tiers.', verdict: 'gap' },
    ],
    beatThem: [
      'The "give the flagship tech away as a consumer app" play is worth copying if we have a platform to funnel into (we do).',
      'Voice quality is their moat and a commodity elsewhere; we win on governed content, not voice.',
      'They monetize at the platform; we can monetize the reading surface itself on owned rails.',
    ],
  },
  'superwhisper-macwhisper': {
    machineScores: [88, 55, 78, 62, 40, 74],
    features: [
      { name: 'On-device / private', assessment: 'Local Whisper = privacy + no server cost; the anti-cloud wedge.', verdict: 'moat' },
      { name: 'Global hotkey dictation', assessment: 'System-wide dictation into any field; menu-bar presence.', verdict: 'copyable' },
      { name: 'One-time purchase', assessment: 'Anti-SaaS positioning against subscription incumbents.', verdict: 'copyable' },
      { name: 'Drag-file transcribe', assessment: 'Zero-account utility flow.', verdict: 'commodity' },
      { name: 'Indie distribution', assessment: 'HN/X only; no growth loop.', verdict: 'gap' },
    ],
    beatThem: [
      '"Local + one-time" is a positioning we can adopt for privacy-sensitive estate surfaces (sovereign stack alignment).',
      'On-device + provenance is a combination indie tools cannot match — private AND governed.',
      'They have no growth loop; an owned distribution (our estate) plus the same privacy wedge scales further.',
    ],
  },
  audiopen: {
    machineScores: [90, 60, 70, 60, 66, 62],
    features: [
      { name: 'One record button', assessment: 'Ruthless focus; the aha is instant and delightful.', verdict: 'copyable' },
      { name: 'Ramble -> clean text', assessment: 'Sells the transformation (mess -> clean), not the transcription. The core idea.', verdict: 'copyable' },
      { name: 'Custom styles', assessment: 'Output shaping; light differentiation.', verdict: 'commodity' },
      { name: 'Lifetime pricing', assessment: 'Low-friction, anti-sub; indie-friendly.', verdict: 'copyable' },
      { name: 'Indie scale', assessment: 'Build-in-public only; thin retention.', verdict: 'gap' },
    ],
    beatThem: [
      '"Sell the transformation not the transcription" is a framing to apply broadly — the gap between input and clean output is the product.',
      'Add memory: a rambling-note-to-structured-artifact that lands in our second brain out-retains a standalone tool.',
      'Small and indie; the mechanic is stealable, the business is not a threat.',
    ],
  },
  'instapaper-pocket': {
    machineScores: [80, 55, 82, 60, 55, 70],
    features: [
      { name: 'Share-sheet save', assessment: 'The cheapest, stickiest capture surface on mobile — own it.', verdict: 'copyable' },
      { name: 'Clean reader view', assessment: 'Distraction-free rendering; commodity now.', verdict: 'commodity' },
      { name: 'Speed-listen TTS', assessment: 'Listen-later mode; overlaps Speechify territory.', verdict: 'commodity' },
      { name: 'Curated newsletters', assessment: 'Recommendation email drove traffic/SEO (Pocket).', verdict: 'copyable' },
      { name: 'Standalone fragility', assessment: 'Pocket shut down 2025 — a pure read-later job is not a durable business.', verdict: 'gap' },
    ],
    beatThem: [
      'Own the share-sheet save as a capture surface into our feeds/second brain — but never as a standalone product.',
      'The cautionary lesson: bundle read-later into a deeper monetizable job (prophecy, evidence), not a lone feature.',
      'Pocket\'s death is the opening — a governed, owned read/listen-later inside SocioProphet has no incumbent.',
    ],
  },
  faceapp: {
    machineScores: [86, 74, 70, 48, 88, 72],
    features: [
      { name: 'Uncanny old-age filter', assessment: 'One emotionally-resonant transformation drove a global challenge (#FaceAppChallenge).', verdict: 'moat' },
      { name: 'Before/after tiles', assessment: 'Simple, shareable; the output is the ad.', verdict: 'copyable' },
      { name: 'Pro filter gating', assessment: 'Watermark/lock on free; standard monetization.', verdict: 'commodity' },
      { name: 'Server-side processing', assessment: 'Faces processed on servers -> the Russia data-privacy controversy. A standing trust liability.', verdict: 'gap' },
      { name: 'No retention layer', assessment: 'Novelty waves only; nothing to come back for.', verdict: 'gap' },
    ],
    beatThem: [
      'Engineer one emotionally-resonant transformation — but process on-device to preempt the trust liability that dogs them.',
      'Their privacy baggage is the opening: a sovereign, on-device face/twin transform reads as safe where they read as risky.',
      'Add the retention layer they lack via twin state.',
    ],
  },
  'lensa-magic-avatars': {
    machineScores: [78, 88, 60, 20, 90, 66],
    features: [
      { name: 'Self-idealizing output', assessment: 'Flattering avatars = a digital status symbol users want to post; the growth engine.', verdict: 'moat' },
      { name: 'Pay-before-preview wall', assessment: 'Hard paywall at peak desire, pre-preview — captured the whole spike.', verdict: 'copyable' },
      { name: 'Mobile-first moat', assessment: 'Beat web competitors to the mobile install wave.', verdict: 'copyable' },
      { name: 'No retention', assessment: '19.3M -> 1.4M installs in a month; a novelty rocket with no floor.', verdict: 'gap' },
      { name: 'Trust/legal exposure', assessment: 'Artist-training + NSFW + BIPA class action — reputational and legal liability.', verdict: 'gap' },
    ],
    beatThem: [
      'Steal the paywall-at-peak-wow mechanic, but pair it with a retention layer (twin) so it does not collapse.',
      'Their legal/ethics exposure (training data, biometrics) is exactly where a sovereign, consented, provenance-clean pipeline wins.',
      'Not a durable competitor — mine the monetization tactic, avoid the model.',
    ],
  },
  'epik-ai-yearbook': {
    machineScores: [66, 84, 58, 18, 90, 64],
    features: [
      { name: 'Gridable nostalgic pack', assessment: '~60 postable images per generation — a self-propagating social artifact.', verdict: 'moat' },
      { name: 'Pay-to-generate upfront', assessment: 'Charged before results; monetized the spike at peak desire.', verdict: 'copyable' },
      { name: 'Trend timing', assessment: 'Rode the Sept 2023 yearbook trend to #1; ephemeral.', verdict: 'copyable' },
      { name: 'Async wait', assessment: 'Minutes-to-hours delay; friction that only worked because payoff volume was huge.', verdict: 'gap' },
      { name: 'No retention', assessment: 'Pure novelty; nothing to return for.', verdict: 'gap' },
    ],
    beatThem: [
      'Package generative output as a themed, gridable, postable set — reusable idea for our creative surfaces.',
      'Have the revenue model live before going viral — the transferable discipline.',
      'A one-moment novelty; not a competitor, only a tactic.',
    ],
  },
  prisma: {
    machineScores: [82, 60, 62, 38, 84, 66],
    features: [
      { name: 'Neural style transfer', assessment: 'The original 2016 viral trick; now commodity.', verdict: 'commodity' },
      { name: 'Instant preview + carousel', assessment: 'Fast aha; pick a style, watch it transform.', verdict: 'copyable' },
      { name: 'Watermark virality', assessment: 'Styled photos posted to social drove ~70M installs.', verdict: 'copyable' },
      { name: 'Pivot to Lensa', assessment: 'Converted the team\'s expertise into a bigger monetizer when novelty faded.', verdict: 'copyable' },
      { name: 'No retention', assessment: 'Faded as the trend died — the original cautionary tale.', verdict: 'gap' },
    ],
    beatThem: [
      'The lesson is the pivot: convert a viral moment into a durable habit before the trend dies — do not ship a novelty as a business.',
      'Style transfer is fully commodity; any value must come from what it is attached to (identity, twin, provenance).',
      'Historical; mine the cautionary arc, not a live threat.',
    ],
  },
  'arc-search': {
    machineScores: [88, 10, 55, 25, 30, 40],
    features: [
      { name: 'Pinch-to-Summarize', assessment: 'A genuinely beloved gesture; delightful UX worth stealing.', verdict: 'copyable' },
      { name: '"Browse for Me"', assessment: 'Builds a summary page — novel, but often slower than tapping a link.', verdict: 'gap' },
      { name: 'No paywall / no capture', assessment: 'No monetization and no capture mechanism — the core failure.', verdict: 'gap' },
      { name: 'No growth loop', assessment: 'Press + novelty only; nothing self-propagating.', verdict: 'gap' },
      { name: 'Development halted', assessment: 'The Browser Company stopped Arc (May 2025) to pivot to Dia.', verdict: 'gap' },
    ],
    beatThem: [
      'Steal the gesture (pinch-to-summarize) for BearBrowser — but never skip steps 2-6 of the machine.',
      'The whole entry is a warning: a wow with no capture and no loop is not a business. Instrument monetization + a loop from day one.',
      'Their abandoned surface (a delightful AI browser) is exactly BearBrowser\'s opening — do it with the machine attached.',
    ],
  },
};
