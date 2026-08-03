// Competitive Intelligence — "One-Trick Playbook"
// Fixture-backed teardown of single-feature consumer apps that monetize hard.
// Ranking dimension = "machine completeness": how fully each product executes the
// six-part commercial loop around its one trick (aha -> paywall-at-peak -> surface
// colonization -> forgiving retention -> share-loop-as-ad -> organic floor).
// Durable machines rank above flash-in-the-pan novelty spikes on purpose.
//
// Revenue/scale figures are third-party estimates (Sensor Tower, Appfigures,
// RevenueCat, Sacra, TechCrunch, Forbes) and were representative at research time
// (2026); prices vary by region, tier and promo. This is a research digest, not a
// live telemetry surface.

export type IntelCategory = 'voice' | 'photo' | 'productivity' | 'money';

export type MachineStep = {
  index: number;
  name: string;
  detail: string;
  exemplars: string;
};

export type RankedApp = {
  rank: number;
  name: string;
  category: IntelCategory;
  categoryLabel: string;
  trick: string;
  surfaces: string;
  paywall: string;
  growthLoop: string;
  metric: string;
  steal: string;
  /** 0-100 machine-completeness score (durability of the business, not size of a spike). */
  score: number;
  /** One-line rationale for the rank. */
  verdict: string;
  /** True for the deliberate counter-example (Arc Search). */
  counterExample?: boolean;
};

export type SurfaceMap = {
  surface: string;
  job: string;
  exemplars: string;
};

export type EconomicStat = {
  value: string;
  label: string;
  source: string;
};

export type EstateMapping = {
  pattern: string;
  target: string;
  detail: string;
  field: string;
};

export type ChecklistPhase = {
  index: number;
  title: string;
  tag: string;
  items: string[];
};

export type PatternLine = {
  good: string;
  bad: string;
};

export type CompetitiveIntelligenceState = {
  generatedAt: string;
  headline: string;
  lede: string;
  thesis: string;
  rankingBasis: string;
  machine: MachineStep[];
  apps: RankedApp[];
  surfaces: SurfaceMap[];
  economics: EconomicStat[];
  estateMappings: EstateMapping[];
  checklist: ChecklistPhase[];
  patterns: PatternLine[];
  patternRule: string;
  sourcing: string;
};

export const competitiveIntelligenceState: CompetitiveIntelligenceState = {
  generatedAt: '2026-08-03T00:00:00-04:00',
  headline: 'The One-Trick Playbook',
  lede:
    'A competitive teardown of 29 single-feature consumer apps (Speechify, Remini, PhotoRoom, Cal AI and kin). They each do one job — and run the identical money machine underneath. This surface catalogs the machine, ranks each specimen by how completely it runs it, and maps each trick onto our estate.',
  thesis:
    'The moat is never the trick. The trick is usually commodity — text-to-speech, background removal, transcription. The moat is the six-part commercial loop wrapped around it. Steal the loop, not the feature.',
  rankingBasis:
    'Ranked by machine completeness — durability of the business, not the size of a viral spike. Apps that colonized a permanent surface and retain (Duolingo, Grammarly, PhotoRoom) rank at the top; novelty rockets that spiked then collapsed with no retention layer (Lensa, EPIK, Prisma) rank at the bottom; Arc Search is included as the deliberate counter-example.',
  machine: [
    {
      index: 1,
      name: 'Value in 60 seconds',
      detail:
        'One real, personalized result on screen before you ask for anything — ideally before an account. Camera-first if the output is visual; a generated plan if the value is guidance.',
      exemplars: 'PhotoRoom, Remini, Shazam, AudioPen',
    },
    {
      index: 2,
      name: 'Paywall at peak motivation',
      detail:
        'The wall lands the instant the user most wants the thing — at export / watermark-removal, or at the end of a personalization quiz. Not at app intro.',
      exemplars: 'Cal AI, Lensa, EPIK',
    },
    {
      index: 3,
      name: 'Colonize an OS surface',
      detail:
        'Own the one place the job naturally occurs — share sheet, keyboard, widget, floating player, camera. Whoever holds the surface owns the muscle memory.',
      exemplars: 'Grammarly, Speechify, Otter',
    },
    {
      index: 4,
      name: 'Forgiving retention hooks',
      detail:
        'One job is easy to "finish", so bolt on accumulating state: streaks with freezes/repairs, a saved library, a daily reason to return.',
      exemplars: 'Duolingo (+14% D7 from streaks)',
    },
    {
      index: 5,
      name: 'A share loop that IS the ad',
      detail:
        'Engineer the output to be inherently postable. A removable watermark does virality and paywalling with the same mechanic.',
      exemplars: 'Remini, Facetune, CapCut',
    },
    {
      index: 6,
      name: 'An organic floor',
      detail:
        'ASO + programmatic SEO under everything, so paid UA only accelerates a funnel that already converts. Name the app after the deliverable.',
      exemplars: 'Photomath, HeadshotPro',
    },
  ],
  apps: [
    {
      rank: 1,
      name: 'Duolingo',
      category: 'productivity',
      categoryLabel: 'Productivity',
      trick: 'Bite-sized gamified language lessons — the studied archetype of retention.',
      surfaces: 'Widget (streak on home screen), notifications as a first-class surface, daily lesson loop.',
      paywall: 'Freemium (ad-supported) -> Super/Max (~$13-30/mo); energy caps free lessons mid-session.',
      growthLoop: 'Lifecycle-orchestrated notifications, leagues, shareable streak milestones, mascot virality.',
      metric: 'Streaks ~= 2x daily retention; +14% D7 from a streak wager.',
      steal:
        'A streak with built-in forgiveness (freezes/repairs) so one unavoidable miss does not cause total abandonment. Notifications calibrated to the habit lifecycle, not blast reminders.',
      score: 95,
      verdict: 'The retention archetype — the whole machine, with the strongest step-4 in the category.',
    },
    {
      rank: 2,
      name: 'Grammarly',
      category: 'productivity',
      categoryLabel: 'Productivity',
      trick: 'Fix your writing inline, inside every text field you already use.',
      surfaces: 'The reference "install once -> appear everywhere": keyboard + editor + browser extension from one install.',
      paywall: 'Freemium — basic corrections free; Premium gates tone, clarity rewrites, advanced suggestions.',
      growthLoop: 'Every corrected document is a silent demo; education + workplace ubiquity; heavy content SEO.',
      metric: 'The archetype of surface colonization.',
      steal:
        'One install, many contexts. The keyboard rides along in every other app — multiply the number of places your single feature can fire.',
      score: 94,
      verdict: 'Owns more OS surfaces than anyone; retention via workflow embedment. Weak virality caps it.',
    },
    {
      rank: 3,
      name: 'PhotoRoom',
      category: 'photo',
      categoryLabel: 'AI Photo',
      trick: 'Tap a photo -> the background vanishes in ~1 second, leaving a clean cutout for any new scene.',
      surfaces: 'Gallery import; instant before/after reveal on import; template grid; erase/restore brush; batch; API.',
      paywall: 'Soft/value-first — result free but watermarked + no commercial use. ~$90/yr. Wall = HD, watermark-free, batch.',
      growthLoop: 'Seller success -> social proof -> new sellers; watermark = free ad; consumer -> Shopify -> enterprise API.',
      metric: '$150M+ ARR (2026) - $500M valuation - ~1-month payback.',
      steal:
        'Put the paywall on the use-case boundary, not the result. Hobbyists stay free and market you; anyone making money self-selects into paying for commercial rights + watermark removal.',
      score: 92,
      verdict: 'All six steps, plus an up-market expansion loop and best-in-class payback.',
    },
    {
      rank: 4,
      name: 'CapCut',
      category: 'photo',
      categoryLabel: 'AI Photo',
      trick: 'Frictionless short-form video editing tuned for the TikTok feed.',
      surfaces: 'Trending Template feed (pick -> auto-fill -> export) + timeline Editor; share-sheet to TikTok.',
      paywall: 'Generous freemium; Pro historically ~$7.99/mo, $74.99/yr; a-la-carte asset IAPs.',
      growthLoop: 'Two-sided with TikTok: creators build templates -> post -> "Try this template" deep link -> viewers install.',
      metric: '~490M users - 1B+ installs - $100M+ consumer spend.',
      steal:
        'Make your output a growth surface — every export is both an ad (watermark) and a re-entry point (template deep link).',
      score: 90,
      verdict: 'The strongest share loop of the set (owned distribution via ByteDance/TikTok).',
    },
    {
      rank: 5,
      name: 'Speechify',
      category: 'voice',
      categoryLabel: 'Voice & Reading',
      trick: 'Turn any text — PDF, web, photo — into natural speech you consume hands-free at up to 5x.',
      surfaces: 'iOS/Android, Chrome extension ("listen to this page"), share-sheet import, OCR scan-and-listen, floating player.',
      paywall: 'Freemium; free capped at 1.5x + robotic voices. Premium ~$29/mo, ~60% off annual.',
      growthLoop: 'Accessibility/education halo (100k+ 5-star), extension distribution, Apple Design Award PR, student word-of-mouth.',
      metric: '~50M users - ~$17.6M rev (2025) - Apple Design Award 2025.',
      steal:
        'The auto-scrolling highlighted read-along makes pace itself the product — speed becomes a visible, addictive feature, not a buried setting.',
      score: 88,
      verdict: 'Multi-surface capture + a strong retention halo; category leader on the voice/reading axis.',
    },
    {
      rank: 6,
      name: 'Perplexity',
      category: 'productivity',
      categoryLabel: 'Productivity',
      trick: 'A cited, synthesized answer — not a page of blue links.',
      surfaces: 'Web answer box + mobile + extension + the Comet AI browser; shareable answer pages.',
      paywall: 'Free = capped Pro Searches/day; Pro $20/mo or $200/yr. Upsell when you exhaust Pro Searches mid-research.',
      growthLoop: 'SEO-indexed shareable answer pages + Comet referral (up to $20/signup) — its strongest loop.',
      metric: 'Citations as a trust primitive, rendered inline.',
      steal:
        'Make trust a visible UI primitive — render the receipts (inline citations) as part of the answer, not a footnote.',
      score: 86,
      verdict: 'Strong aha + shareable-page organic floor; retention still contested vs incumbents.',
    },
    {
      rank: 7,
      name: 'Cal AI',
      category: 'photo',
      categoryLabel: 'AI Photo',
      trick: 'Photograph your meal -> calories + macros, killing manual-logging friction.',
      surfaces: 'Camera-first; barcode + gallery + text describe; daily calorie/macro rings dashboard.',
      paywall: 'Hard wall after a ~30-step quiz; price invisible until then. ~$29.99/yr anchor vs decoy weekly; dynamic pricing.',
      growthLoop: 'Founder-led TikTok + micro-influencer UGC; "two teens built this" press narrative.',
      metric: '~$30M+ 2025 rev - 400+ paywall variants A/B\'d - 3x monthly rev.',
      steal:
        'The onboarding quiz IS the paywall. Personalize relentlessly, then hit a maximally-primed user with a dynamically-priced annual-vs-decoy-weekly wall. A/B the paywall as your #1 surface.',
      score: 85,
      verdict: 'Best-in-class paywall craft; retention is the open question for calorie apps.',
    },
    {
      rank: 8,
      name: 'Photomath',
      category: 'productivity',
      categoryLabel: 'Productivity',
      trick: 'Photograph a math problem -> answer + step-by-step worked solution.',
      surfaces: 'Camera-first with a live scan frame; on-screen math keyboard + history; no signup to start.',
      paywall: 'Soft. Basic answer/steps free; Plus $9.99/mo or $69.99/yr gates animated tutorials + textbook solutions.',
      growthLoop: 'Organic classroom word-of-mouth; seasonal school-calendar spikes; compounding App Store rank.',
      metric: '~$27.4M FY23 rev - ~85% recurring - acquired by Google.',
      steal:
        'Sell the explanation, give away the answer — commodity output is free bait; understanding is the paid tier.',
      score: 84,
      verdict: 'Durable recurring revenue on a pure organic floor; capped by seasonality.',
    },
    {
      rank: 9,
      name: 'Facetune',
      category: 'photo',
      categoryLabel: 'AI Photo',
      trick: 'One-tap selfie retouch — smooth skin, whiten teeth, reshape face/body.',
      surfaces: 'Gallery import; brush/tap tools; signature press-and-hold before/after compare; share-sheet to Instagram.',
      paywall: 'Freemium with a save-limit gate. 7-day trial -> ~$70-78/yr, or lifetime VIP. All AI/VIP tools gated.',
      growthLoop: 'Before/after transformation on IG/TikTok is the engine; the edited selfie IS the ad.',
      metric: '200M+ downloads - Lightricks suite valued ~$1.8B.',
      steal:
        'Bake your "wow delta" into a one-gesture reveal. Press-and-hold before/after builds trust ("I control this") and manufactures the exact shareable contrast that sells the app.',
      score: 83,
      verdict: 'Habitual pre-post editing gives real retention; a durable category incumbent.',
    },
    {
      rank: 10,
      name: 'Otter.ai',
      category: 'voice',
      categoryLabel: 'Voice & Reading',
      trick: 'Real-time meeting transcription + AI summary and action items, captured for you.',
      surfaces: 'Live streaming-transcript screen, "OtterPilot" bot that auto-joins Zoom/Meet/Teams, calendar integration.',
      paywall: 'Freemium with monthly minute caps; Pro/Business ~$10-20/user/mo unlock minutes, exports, summaries.',
      growthLoop: 'The bot appears in shared meetings, exposing every attendee; shared transcript links pull in non-users.',
      metric: 'Personal tool -> multiplayer via presence.',
      steal:
        'A bot that joins on your behalf turns a solo tool into a self-distributing one — presence in a shared space is the growth engine.',
      score: 82,
      verdict: 'Self-distributing presence loop; strong B2B retention offsets a narrow job.',
    },
    {
      rank: 11,
      name: 'Shazam',
      category: 'voice',
      categoryLabel: 'Voice & Reading',
      trick: 'Identify the song playing around you in seconds.',
      surfaces: 'One giant button; home/lock-screen widget, Control Center toggle, Siri, background auto-Shazam.',
      paywall: 'Free; acquired by Apple (~$400M, 2018), monetized indirectly via the Apple Music funnel.',
      growthLoop: 'Verb-ification of the brand ("Shazam it"), streaming handoff, social sharing of tags.',
      metric: 'Possibly the purest "aha in one tap" ever shipped.',
      steal:
        'Ruthless one-tap simplicity — the whole app collapses to a single button; the magic must land before the user does anything else.',
      score: 80,
      verdict: 'Perfect aha + surface ubiquity; direct monetization is the missing step.',
    },
    {
      rank: 12,
      name: 'Rocket Money',
      category: 'money',
      categoryLabel: 'Money',
      trick: 'Find wasted subscriptions & bills, then cancel them for you in one tap.',
      surfaces: 'Mobile-first; web dashboard + widget are Premium-gated.',
      paywall: 'Free tier shows the waste; one-tap cancel + concierge negotiation gated. PWYW $7-14/mo + 35-60% success fee.',
      growthLoop: 'Referral (1 free month each) + "found $X" SEO.',
      metric: 'Aha = a finding on the user\'s own data.',
      steal:
        'Deliver the aha as a finding on the user\'s own data; paywall the fix, not the discovery. (Caution: keep the fix reversible — the same pattern drives cancel/fee complaints.)',
      score: 80,
      verdict: 'Aha-on-your-own-data is a durable hook; fee model is the reputational edge.',
    },
    {
      rank: 13,
      name: 'Granola',
      category: 'productivity',
      categoryLabel: 'Productivity',
      trick: 'Botless local meeting capture — your sparse notes auto-enhanced after the call.',
      surfaces: 'Menu-bar/floating notepad, calendar auto-detect, Cmd+J in-meeting AI; no bot, no browser extension.',
      paywall: 'Free Basic (~25-note history cap); Business ~$14/user/mo. Gates note history.',
      growthLoop: 'Recipients open a shared "Ask Granola" web note and query it with zero install -> sign up.',
      metric: '$1.5B valuation (Mar 2026).',
      steal:
        'Augment the user\'s own artifact instead of replacing it — the human writes the seed, the AI grows it. It sidesteps the "creepy bot in my meeting" friction entirely.',
      score: 79,
      verdict: 'Privacy-first wedge + a zero-install share loop; young but well-shaped machine.',
    },
    {
      rank: 14,
      name: 'Things / Bear',
      category: 'productivity',
      categoryLabel: 'Productivity',
      trick: 'Craft-as-feature — beautiful frictionless GTD (Things) and tag-filed Markdown notes (Bear).',
      surfaces: 'Native, keyboard-first; global Quick Entry hotkey; inline #hashtags auto-file. No web/extension by design.',
      paywall: 'Things: one-time buy per platform ($9.99-49.99). Bear: gates sync, not features — $2.99/mo, $29.99/yr.',
      growthLoop: 'Apple Design Awards + editorial + "best notes/tasks app" SEO + ecosystem stickiness. No referral/streaks.',
      metric: 'Conversion on switching cost, not a feature wall.',
      steal:
        'Give away the whole experience; gate the one thing sustained usage forces you into (sync, a second device). Make trial-to-paid a function of accumulated investment.',
      score: 78,
      verdict: 'Deep retention via accumulated state; deliberately no growth loop caps reach.',
    },
    {
      rank: 15,
      name: 'Blinkist',
      category: 'productivity',
      categoryLabel: 'Productivity',
      trick: 'The key ideas of a nonfiction book in ~15 minutes ("blinks").',
      surfaces: 'Interest-quiz onboarding -> curated recommendation; daily pick; bookmarking as early switching-cost deposit.',
      paywall: 'Freemium (1 free blink/day) -> Premium ~$70-100/yr, 7-day trial.',
      growthLoop: 'Daily-pick habit, shareable highlights, thousands of "[Book] summary" SEO pages.',
      metric: 'Quiz -> curated value -> celebration -> wall.',
      steal:
        'Use a lightweight interest quiz to make the first recommendation feel personalized, then let a "daily pick" be the reason to return.',
      score: 77,
      verdict: 'Solid onboarding + SEO floor; passive content (no quizzes/streaks) softens retention.',
    },
    {
      rank: 16,
      name: 'Forest',
      category: 'money',
      categoryLabel: 'Focus',
      trick: 'Plant a virtual tree that grows while you focus — and dies if you leave the app.',
      surfaces: 'Mobile focus dial (10-120 min) + browser extension + Watch sync.',
      paywall: 'Free download; Forest Plus ~$5.99/mo (~$33-36/yr) adds species, 3x coins, real-tree redemption.',
      growthLoop: 'Coins -> real trees planted (2M+, via Trees for the Future) = shareable proof; "Plant Together" group tree.',
      metric: 'Loss aversion against a living, cared-for object.',
      steal:
        'Attach loss aversion to a living thing the user tends, then bridge the virtual reward to a real-world consequence (an actual planted tree).',
      score: 76,
      verdict: 'Loss-aversion retention + real-world proof loop; a narrow but sticky machine.',
    },
    {
      rank: 17,
      name: 'Snipd',
      category: 'voice',
      categoryLabel: 'Voice & Reading',
      trick: '"Shazam for podcast moments" — tap to snip the best bit -> AI transcript, summary, shareable clip.',
      surfaces: 'Podcast player with headphone-button one-tap snip, AI chapter/highlight feed, export to Notion/Obsidian/Readwise.',
      paywall: 'Free tier; Premium $9.99/mo or $5.99/mo annual gates auto-processing + quota.',
      growthLoop: 'Shareable snip cards (audiogram + transcript), PKM community, note-app integrations.',
      metric: 'Freezes an ephemeral stream into a durable artifact.',
      steal:
        'The "capture the fleeting moment" mechanic — one tap that turns an ephemeral stream into a durable, shareable, exportable object.',
      score: 74,
      verdict: 'Elegant capture mechanic + export loop; niche audience limits the ceiling.',
    },
    {
      rank: 18,
      name: 'Remini',
      category: 'photo',
      categoryLabel: 'AI Photo',
      trick: 'Restore/enhance a low-quality face photo into a crisp upgraded version — in one tap.',
      surfaces: 'Gallery import; before/after slider is the hero UI; Tinder-style swipeable result packs.',
      paywall: 'Aggressive, often hard. Weekly ~$4.99-9.99, annual ~$79.99; big social-proof stat flashed right before the wall.',
      growthLoop: 'Rotating novelty engine (AI Baby -> Headshots -> Yearbook -> Ghibli) manufactures a fresh wave every ~6-12 months.',
      metric: '#1 US App Store 7/11/23 - ~$90K->$567K/day spike - ~$93M run-rate.',
      steal:
        'Stage hard social proof immediately before a hard paywall, so peak "wow" and the ask are the same moment. Keep a useful base as the retention floor; rotate a fresh novelty on top.',
      score: 74,
      verdict: 'Huge revenue on a useful base, but leans on a novelty treadmill to stay relevant.',
    },
    {
      rank: 19,
      name: 'Cleo',
      category: 'money',
      categoryLabel: 'Money',
      trick: 'Budgeting-as-group-chat with an AI that roasts your spending.',
      surfaces: 'Radically chat-first (no menu fallback — its top complaint).',
      paywall: 'Subscription gated behind the cash-advance need — you feel broke, so you subscribe to unlock the advance. Plus $5.99/mo. FTC $17M settlement (2025).',
      growthLoop: 'TikTok roast screenshots (campaigns drove +32% installs).',
      metric: 'Retention, aha & growth in one shareable object.',
      steal:
        'Give a boring task a personality whose output is inherently shareable — the roast is the aha, the retention, and the growth loop at once. (The FTC line is the cautionary edge.)',
      score: 72,
      verdict: 'Personality-as-loop is clever, but the FTC settlement marks a dark-pattern edge.',
    },
    {
      rank: 20,
      name: 'HeadshotPro / Aragon',
      category: 'photo',
      categoryLabel: 'AI Photo',
      trick: '8-12 casual selfies -> 100+ studio-quality professional headshots.',
      surfaces: 'Web-only; upload with posing guidance -> wait -> pick from a grid. Aragon sells speed (15-45 min).',
      paywall: 'One-time pay-per-pack: $29-75; Teams from ~$39/person. No subscription. ~90%+ margin.',
      growthLoop: 'SEO moat (ranks #1 for "professional headshots"), build-in-public on X, enterprise team land-and-expand.',
      metric: 'HeadshotPro ~$300K/mo - Aragon $1M ARR in 4 months.',
      steal:
        'Sell the outcome, not the tool — name it after the deliverable, price against the human alternative (a photographer), and turn the biggest UX weakness (the wait) into a paid speed tier.',
      score: 71,
      verdict: 'Elite SEO floor + margin, but one-time purchase and thin retention cap durability.',
    },
    {
      rank: 21,
      name: 'ElevenLabs Reader',
      category: 'voice',
      categoryLabel: 'Voice & Reading',
      trick: 'Same job as Speechify, but led entirely by best-in-class voice quality from their own TTS models.',
      surfaces: 'iOS/Android Reader app, share-sheet import (PDF/epub/articles), library shelf, floating player.',
      paywall: 'Launched largely free to seed the funnel and showcase the models; monetization pushes to the platform tiers.',
      growthLoop: 'Voice quality is inherently shareable ("listen to this"); rides the parent brand\'s viral AI-voice reputation.',
      metric: 'Consumer app as a living demo of the platform.',
      steal:
        'Give the flagship capability away in a free consumer app — the app becomes the marketing for the platform underneath it.',
      score: 70,
      verdict: 'A strategic funnel, not a standalone business — deliberately unmonetized at the app layer.',
    },
    {
      rank: 22,
      name: 'Superwhisper / MacWhisper',
      category: 'voice',
      categoryLabel: 'Voice & Reading',
      trick: 'Fast, private, on-device transcription & system-wide dictation via local Whisper.',
      surfaces: 'Menu-bar app + global hotkey dictation into any text field; drag-file-to-transcribe.',
      paywall: 'Mostly one-time purchase (~$30 tiers); anti-SaaS positioning. Superwhisper mixes one-time + sub.',
      growthLoop: 'Indie/HN/X, "private alternative to cloud transcription" SEO, App Store.',
      metric: 'Local + one-time = the differentiator.',
      steal:
        '"Local & one-time payment" is itself a wedge against subscription incumbents for privacy-sensitive users.',
      score: 68,
      verdict: 'Great wedge + surface, but indie one-time model caps the growth loop.',
    },
    {
      rank: 23,
      name: 'AudioPen',
      category: 'voice',
      categoryLabel: 'Voice & Reading',
      trick: 'Speak a rambling voice note -> AI returns tidy, restructured, rewritten text.',
      surfaces: 'One giant record button (web-first PWA, zero bloat), notes list, share/export.',
      paywall: 'Generous free tier (short notes), then Prime ~$99/yr or lifetime. Indie, no enterprise sales.',
      growthLoop: 'Build-in-public on X, the shareable before/after screenshot, Product Hunt, writer word-of-mouth.',
      metric: 'One button - one wow - lifetime pricing.',
      steal:
        'Sell the transformation, not the transcription — the magic is the gap between the mess you said and the clean output.',
      score: 66,
      verdict: 'Beautifully focused aha; indie scale and light retention keep it mid-pack.',
    },
    {
      rank: 24,
      name: 'Instapaper / Pocket',
      category: 'voice',
      categoryLabel: 'Voice & Reading',
      trick: 'Save any article now; read — or listen — in a clean view later.',
      surfaces: 'Share-sheet save, browser extension/bookmarklet, distraction-free reader, speed-listen TTS mode.',
      paywall: 'Instapaper Premium ~$5.99/mo / ~$59/yr. Pocket rode Mozilla + sponsored content.',
      growthLoop: 'Share-sheet ubiquity, extensions, curated recommendation newsletters.',
      metric: 'Mozilla shut Pocket down in 2025.',
      steal:
        'The share-sheet "save" is the cheapest, stickiest capture surface on mobile — own it. Cautionary flip: a pure read-later feature is a fragile standalone business.',
      score: 55,
      verdict: 'Owns the best capture surface, but the standalone read-later job proved commercially fragile.',
    },
    {
      rank: 25,
      name: 'FaceApp',
      category: 'photo',
      categoryLabel: 'AI Photo',
      trick: 'Realistic face transformations — old-age, young, gender-swap, smile.',
      surfaces: 'Gallery/camera import; tap a transformation tile; before/after; share-sheet.',
      paywall: 'Freemium; FaceApp Pro ~$3.99-4.99/wk, ~$19.99-39.99/yr, or lifetime. Many pro filters watermarked/locked.',
      growthLoop: '#FaceAppChallenge (2019) — celebrities posting aged selfies drove massive installs.',
      metric: '500M+ downloads; overshadowed by a Russia data-privacy controversy.',
      steal:
        'Engineer one uncannily-good shareable transformation ("what will I look like old?"). But server-side processing of faces is a trust liability to preempt.',
      score: 48,
      verdict: 'Recurring novelty waves, but no retention layer and a standing trust liability.',
    },
    {
      rank: 26,
      name: 'Lensa (Magic Avatars)',
      category: 'photo',
      categoryLabel: 'AI Photo',
      trick: 'Turn 10-20 selfies into a pack of flattering, stylized AI portraits.',
      surfaces: 'Mobile-first, gallery batch upload; output = a downloadable, postable gallery grid.',
      paywall: 'Hard, pay-before-value. Sub gates the cheap packs; $3.99-7.99 per 50-200 avatars; 7-day trial auto-rolls to paid.',
      growthLoop: 'Output is self-idealizing -> users post it -> FOMO -> install. MKBHD post drove a 631% jump.',
      metric: '~$30.7M (Dec 2022) - ~$50-75M lifetime - then 19.3M->1.4M installs in a month.',
      steal:
        'Make the output the ad, and put the paywall at peak wow, pre-preview. Cautionary half: a novelty loop with no retention layer decays as fast as it spikes.',
      score: 42,
      verdict: 'Textbook viral+monetization spike with no step 3-6 — collapsed 92% in a month.',
    },
    {
      rank: 27,
      name: 'EPIK / AI Yearbook',
      category: 'photo',
      categoryLabel: 'AI Photo',
      trick: 'Upload selfies -> ~60 nostalgic \'90s high-school yearbook portraits of you.',
      surfaces: 'Gallery batch upload (8-12 selfies); async — wait then a downloadable 60-image pack.',
      paywall: 'Pay-per-pack, ~$5.99-9.99, charged before results. Hard pay-to-generate gate.',
      growthLoop: 'Sept 2023 trend: celebs/influencers post their grids -> nostalgia FOMO -> users pay -> post their own.',
      metric: '#1 US App Store (Sept 2023) - ~$15K->$340K/day - ~$1.7M in 2 weeks.',
      steal:
        'Match the paywall to your retention curve. Low retention -> charge at peak desire (before the result). Have the revenue model live before you go viral.',
      score: 40,
      verdict: 'Monetized the spike well, but a nostalgia novelty with no reason to return.',
    },
    {
      rank: 28,
      name: 'Prisma',
      category: 'photo',
      categoryLabel: 'AI Photo',
      trick: 'Apply neural art-style filters (Van Gogh, Munch) to a photo — the 2016 viral style-transfer app.',
      surfaces: 'Camera or gallery import; scrollable filter carousel; intensity slider; instant preview.',
      paywall: 'Freemium -> Prisma Premium (~$7.99/mo, ~$29.99/yr) for full styles + no watermark.',
      growthLoop: '2016 social-share explosion (~70M+ installs); watermark on free exports. Faded as novelty wore off.',
      metric: 'Prisma Labs later built Lensa — the far bigger monetizer.',
      steal:
        'A pure novelty trick spikes then decays — convert the viral moment into a durable habit or a pivot (Prisma -> Lensa) before the trend dies.',
      score: 38,
      verdict: 'The original cautionary tale: huge spike, no retention, survived only by pivoting.',
    },
    {
      rank: 29,
      name: 'Arc Search',
      category: 'productivity',
      categoryLabel: 'Counter-example',
      trick: '"Browse for Me" — one gesture builds a whole summary page for your query.',
      surfaces: 'Mobile gestures; the beloved Pinch-to-Summarize. Genuinely novel UX.',
      paywall: 'None — and no capture mechanism at all. That was the failure. A "custom page" was often slower than tapping a link.',
      growthLoop: 'Weak — press coverage + novelty only. The Browser Company halted Arc development (May 2025) to pivot to Dia.',
      metric: 'A wow moment is necessary but not sufficient.',
      steal:
        'A delightful gesture is worth stealing — but a wow with no capture mechanism and no growth loop is not a business. Steal the gesture; do not skip steps 2-6 of the machine.',
      score: 22,
      verdict: 'The deliberate counter-example: a beloved trick with none of the machine around it.',
      counterExample: true,
    },
  ],
  surfaces: [
    {
      surface: 'iOS Share Sheet extension',
      job: 'Act on content I am already looking at — send a page / PDF / photo / text into your app from any other app.',
      exemplars: 'Speechify, PhotoRoom, Instapaper',
    },
    {
      surface: 'Home / lock-screen widget',
      job: 'Glanceable status + one-tap re-entry; keeps the app mentally present.',
      exemplars: 'Duolingo (streak), Cal AI (calories left)',
    },
    {
      surface: 'Custom keyboard extension',
      job: 'Help me act inside every text field — the app rides along everywhere.',
      exemplars: 'Grammarly, AI-writing keyboards',
    },
    {
      surface: 'Browser extension / floating player',
      job: 'Cross-device continuity + desktop capture; dock or hide the overlay.',
      exemplars: 'Speechify, Grammarly',
    },
    {
      surface: 'Camera-first launch',
      job: 'Capture-to-result with zero navigation; the camera IS the home screen.',
      exemplars: 'PhotoRoom, Remini, Cal AI, Photomath',
    },
    {
      surface: 'Action Button / Siri Shortcuts',
      job: 'One physical/voice trigger for the core action, hands-free.',
      exemplars: 'Speechify, any capture app',
    },
    {
      surface: 'Menu-bar app (macOS)',
      job: 'Persistent desktop presence for a quick utility.',
      exemplars: 'Superwhisper, MacWhisper, Granola',
    },
    {
      surface: 'In-context bot (meeting / chat)',
      job: 'Show up in a shared space on the user\'s behalf — distribution built in.',
      exemplars: 'Otter (OtterPilot)',
    },
  ],
  economics: [
    { value: '10.7%', label: 'Hard-paywall conversion to paid at D35 (top quartile 20%) vs. 2.1% for freemium — a 5x advantage.', source: 'RevenueCat 2026' },
    { value: '82%', label: 'Of trial starts happen on Day 0. You effectively get one session to convert.', source: 'RevenueCat' },
    { value: '42.5%', label: 'Trial->paid for 17-32 day trials, vs 25.5% for <=4 days — longer trials convert better.', source: 'RevenueCat' },
    { value: '~76%', label: 'Of 642 subscription apps used at least one dark pattern; 67% used two or more.', source: 'FTC 2022' },
  ],
  estateMappings: [
    {
      pattern: 'Speechify / Instapaper -> share-sheet + floating player',
      target: 'SocioProphet news & feeds',
      detail:
        'A "listen to this" surface for prophecy/news content: share-sheet import + auto-scrolling read-along, so pace becomes a visible feature. The share-sheet "save/listen" is the cheapest capture surface on mobile.',
      field: 'share-sheet extension + floating player',
    },
    {
      pattern: 'Grammarly -> install once, appear everywhere',
      target: 'BearBrowser cockpit',
      detail:
        'The browser is already our OS surface. Ride along in every page and text field the way Grammarly does — one install yielding extension + overlay + action-button trigger, so the core capability fires in every context the user is already in.',
      field: 'extension + overlay + Action Button',
    },
    {
      pattern: 'Snipd -> capture the fleeting moment',
      target: 'Reasoning / evidence fabric',
      detail:
        'One-tap "snip" that freezes an ephemeral stream (a claim, a reasoning step, a source) into a durable, exportable evidence artifact — the same mechanic that turns a podcast moment into a second-brain card, pointed at our provenance spine.',
      field: 'one-tap capture -> durable artifact + export',
    },
    {
      pattern: 'Remini / Facetune -> before/after reveal',
      target: 'Digital Health Twin',
      detail:
        'A press-and-hold before/after that shows a projected or improved state vs. baseline. The reveal builds trust ("I control this") and manufactures the shareable contrast — while the twin\'s accumulating state is the retention floor a novelty app lacks.',
      field: 'before/after reveal + accumulating state',
    },
    {
      pattern: 'Shazam / Cal AI -> camera-first, one primary action',
      target: 'Twin Workshop / capture cockpit',
      detail:
        'Collapse the primary action to a single gesture — camera-first capture with a live frame, result before navigation. If retention is thin on any novelty feature, monetize the first result at peak desire rather than later.',
      field: 'one-gesture capture + result-first UI',
    },
    {
      pattern: 'Duolingo -> forgiving retention + lifecycle notifications',
      target: 'Any daily-use surface (cockpit, twin)',
      detail:
        'Where a surface wants daily return, add a streak with freezes/repairs and segmented, motivation-hooked notifications timed to the user\'s real day — not blast reminders. Accumulated state = switching cost.',
      field: 'streak-with-forgiveness + calibrated notifications',
    },
  ],
  checklist: [
    {
      index: 1,
      title: 'Nail the aha',
      tag: 'before anything monetary',
      items: [
        'One real, personalized result in <60s. Camera-first if visual; a generated plan if the value is guidance.',
        'Deliver that value before requiring an account wherever the platform allows.',
      ],
    },
    {
      index: 2,
      title: 'Onboarding as the sales pitch',
      tag: 'only if it earns its place',
      items: [
        'A question-based quiz only if answers demonstrably personalize the product and feed the paywall (goal branching, stat cards). Otherwise go straight to the result.',
        'Progress indication + effort-justification cues so the paywall feels earned, not intrusive.',
      ],
    },
    {
      index: 3,
      title: 'Monetize at peak motivation',
      tag: 'the money step',
      items: [
        'Place the wall right after the aha — end-of-onboarding for plan apps, at export/watermark-removal for tools.',
        'Default to a hard paywall or trial gate (5x conversion vs freemium); keep a free sliver only if you need it to seed watermark virality.',
        '7-day trial on a weekly plan, annual anchored, displayed per-week — with trial reminders and one-tap cancel.',
        'Add a reverse-trial exit-intent offer to recover paywall dismissals.',
      ],
    },
    {
      index: 4,
      title: 'Colonize a permanent surface',
      tag: 'own the muscle memory',
      items: [
        'Ship the one OS surface where the job occurs — share sheet, keyboard, widget, floating player, or Action Button. Grammarly\'s "install once -> keyboard + editor + extension" is the model.',
      ],
    },
    {
      index: 5,
      title: 'Retain',
      tag: 'one job is easy to finish',
      items: [
        'A streak with built-in forgiveness (freezes/repairs) or an equivalent accumulating-state hook (saved library).',
        'Lifecycle-orchestrated notifications — segmented, motivation-hooked, timed — not blast reminders.',
        'A daily reason to return — fresh content or a new capability drop.',
      ],
    },
    {
      index: 6,
      title: 'Loop for growth',
      tag: 'the output is the ad',
      items: [
        'A removable watermark on all shared output — virality and paywall trigger in one mechanic.',
        'Make the output worth posting (before/after framing) to seed the UGC loop.',
        'A double-sided referral — the easiest loop to instrument first.',
        'ASO + programmatic SEO as the always-on organic floor; use paid UA to learn what converts and feed it back.',
      ],
    },
  ],
  patterns: [
    {
      good: 'Reverse trial — genuinely gives a free week on exit; generous, not deceptive.',
      bad: 'Sneaking — auto-renewal you cannot disable at signup (the most common pattern found).',
    },
    {
      good: 'Honest anchoring — annual vs monthly side by side, when both prices are real and you actually charge them.',
      bad: 'Hidden charge disclosure — burying "you will be charged $X" behind tiny text or hover-overs.',
    },
    {
      good: 'Value stack + social proof — informative "here is what you unlock", not manipulative.',
      bad: 'Trial-to-silent-charge — no reminder + a hard-to-find cancel maze.',
    },
    {
      good: 'Trial reminders + one-tap cancel — the pro-consumer move that also cuts refunds and protects ratings.',
      bad: 'Fake urgency / scarcity — countdowns that reset, "1 left" that never depletes.',
    },
    {
      good: 'Personalization that is actually used — quiz answers that visibly change the product.',
      bad: 'Confirmshaming + interface interference — guilt-worded declines; a hidden, greyed, or delayed "X".',
    },
  ],
  patternRule:
    'The test: a pattern is legitimate if it works because the user understood the deal — and scammy if it works because they did not. The true price, the renewal, and the cancel path should each be one clear tap away.',
  sourcing:
    'Quantitative anchors: RevenueCat State of Subscription Apps (2026), PaywallPro 1,200-paywall study, FTC dark-patterns reports (2022/2024), Sacra, Appfigures, Sensor Tower, TechCrunch, Forbes. Per-app revenue and download figures are third-party estimates; prices vary by region, tier and promo and were representative at research time (2026). No app named "Sentify" was found — closest real names are Speechify and Snipd.',
};
