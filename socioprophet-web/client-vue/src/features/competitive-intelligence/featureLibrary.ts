// Feature Library — the "galaxy": every feature observed across the 29 specimens,
// normalized into canonical feature-types, then aligned to REAL capability owners.
//
// Capability owners are grounded in an evidence scan of the estate (paths cited):
//   tritfabric  -> ~/dev/tritfabric  (package `tritfabric-atlas`): atlas/* + slate/*
//   tritrpc     -> ~/dev/tritrpc     (v1 codec, crypto profiles, mesh orchestration)
//   models      -> ~/dev/noetica-impair/src/noetica_impair/models/registry.py (real HF ids)
//                  ~/dev/sourceos-model-carry/examples/* (local carry profiles)
//                  ~/dev/Noetica/config/models.ts (chat roster)
// Nothing here is invented: where we have no owner, readiness is 'gap' and it says so.
//
// THE HEADLINE FINDING: our roster is strong on text / NLP / OCR / provenance /
// governance / routing, and has NO image, audio (TTS/ASR) or video generative model.
// So the text-and-trust specimens (Grammarly, Perplexity, Photomath, Blinkist) are
// genuinely beatable today; the media specimens (Remini, PhotoRoom, CapCut, Lensa)
// are NOT — not on their core trick — without acquiring new model capability.

/**
 * evidence   — users demonstrably want it (verbatim reviews, behavioral data, migrations).
 * hypothesis — our product judgment; no user-side signal found.
 * commercial — it works for the OPERATOR but users never asked for it. Naming this
 *              separately stops operator-side conversion data masquerading as demand.
 */
export type DemandBasis = 'evidence' | 'hypothesis' | 'commercial';

/** Strength of the demand evidence: A = behavioral/verbatim, B = mixed, C = thin. */
export type EvidenceGrade = 'A' | 'B' | 'C';
export type Readiness = 'have' | 'partial' | 'gap';
export type Modality = 'text' | 'image' | 'audio' | 'video' | 'cross' | 'none';
export type FeatureStance = 'moat' | 'copyable' | 'commodity' | 'opening';

export type CapabilityOwner = {
  kind: 'tritfabric' | 'tritrpc' | 'model' | 'estate' | 'none';
  name: string;
  /** Evidence path in the estate. Absent only when kind === 'none'. */
  path?: string;
};

export type FeatureType = {
  id: string;
  name: string;
  cluster: FeatureCluster;
  whatItIs: string;
  /** Specimen names that ship this feature. */
  shippedBy: string[];
  /** 0-100 — how much users actually want it. */
  demand: number;
  demandBasis: DemandBasis;
  demandNote: string;
  evidenceGrade?: EvidenceGrade;
  /** Who wants it, when demand splits by audience rather than being uniform. */
  demandSegment?: string;
  modality: Modality;
  owners: CapabilityOwner[];
  readiness: Readiness;
  gapNote: string;
  stance: FeatureStance;
  ourAngle: string;
};

export type FeatureCluster =
  | 'capture'
  | 'transform'
  | 'retention'
  | 'monetization'
  | 'distribution'
  | 'trust';

export const clusterLabel: Record<FeatureCluster, string> = {
  capture: 'Capture & aha',
  transform: 'The transform',
  retention: 'Retention',
  monetization: 'Monetization',
  distribution: 'Distribution',
  trust: 'Trust',
};

export const readinessLabel: Record<Readiness, string> = {
  have: 'have',
  partial: 'partial',
  gap: 'gap',
};

export const stanceLabel: Record<FeatureStance, string> = {
  moat: 'their moat',
  copyable: 'copyable',
  commodity: 'commodity',
  opening: 'our opening',
};

/**
 * Specimens referenced by the library that were researched but did NOT make the
 * ranked catalog. Declared explicitly so feature attribution stays honest and the
 * coverage test can distinguish "unranked but real" from "typo".
 */
export const unrankedSpecimens: string[] = ['Cleanup.pictures'];

/** Typed, capped lens set over the library. */
export type LensId = 'demand' | 'opportunity' | 'threat' | 'capability' | 'readiness' | 'cluster';

export type Lens = {
  id: LensId;
  label: string;
  question: string;
  /** How the lens pivots the same underlying rows. */
  pivot: string;
};

export const lenses: Lens[] = [
  { id: 'demand', label: 'Demand', question: 'What do people actually want most?', pivot: 'Every feature ranked by demand, evidence-backed first.' },
  { id: 'opportunity', label: 'Opportunity', question: 'Where do we win fastest?', pivot: 'High demand × we can build it today (have/partial). Sorted by opportunity score.' },
  { id: 'threat', label: 'Threat', question: 'What is hardest to beat?', pivot: 'Their moats and the features we cannot currently field, by demand.' },
  { id: 'capability', label: 'Capability', question: 'What does each module / model owe?', pivot: 'Grouped by capability owner — the tritfabric + foundation-model alignment view.' },
  { id: 'readiness', label: 'Readiness', question: 'What is the build backlog?', pivot: 'Grouped have / partial / gap.' },
  { id: 'cluster', label: 'Cluster', question: 'How does the machine decompose?', pivot: 'Grouped by the part of the loop the feature serves.' },
];

/** Opportunity = demand weighted by whether we can actually build it now. */
export function opportunityScore(f: FeatureType): number {
  const readinessWeight = f.readiness === 'have' ? 1 : f.readiness === 'partial' ? 0.65 : 0.15;
  const stanceWeight = f.stance === 'opening' ? 1.15 : f.stance === 'copyable' ? 1 : f.stance === 'commodity' ? 0.8 : 0.6;
  return Math.round(f.demand * readinessWeight * stanceWeight);
}

// ---------------------------------------------------------------------------

export const featureLibrary: FeatureType[] = [
  // ------------------------------ CAPTURE ------------------------------
  {
    id: 'one-tap-capture',
    name: 'One-tap capture',
    cluster: 'capture',
    whatItIs: 'A single primary action that freezes an ephemeral moment into a durable object — no navigation before the magic.',
    shippedBy: ['Shazam', 'Snipd', 'AudioPen', 'Photomath', 'Cal AI'],
    demand: 92,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Shazam verb-ified the behaviour; Snipd users cite headphone-button snip as the reason they stay. Lowest-friction capture consistently wins reviews.',
    modality: 'cross',
    owners: [
      { kind: 'tritfabric', name: 'atlas/rpc/server', path: 'tritfabric/atlas/rpc/server.py' },
      { kind: 'estate', name: 'evidence-intake-kernel', path: '~/dev/evidence-intake-kernel' },
    ],
    readiness: 'have',
    gapNote: 'Capture plumbing exists; what is missing is a one-gesture client affordance on our surfaces.',
    stance: 'copyable',
    ourAngle: 'Point it at claims/sources: one tap freezes a reasoning step into governed provenance. Capture + ownership, where Shazam is capture + handoff.',
  },
  {
    id: 'camera-first-scan',
    name: 'Camera-first scan → structured result',
    cluster: 'capture',
    whatItIs: 'The viewfinder is the home screen; point at the world and get a parsed, structured answer in seconds.',
    shippedBy: ['Photomath', 'Cal AI', 'PhotoRoom', 'Remini'],
    demand: 88,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Photomath ~85% recurring revenue on a scan-first funnel; Cal AI built a ~$30M business on removing manual logging.',
    modality: 'image',
    owners: [
      { kind: 'tritfabric', name: 'slate/ocr (ocr_ensemble)', path: 'tritfabric/slate/ocr/ocr_ensemble.py' },
      { kind: 'tritfabric', name: 'slate/nlp (gliner_ner, rebel)', path: 'tritfabric/slate/nlp/' },
    ],
    readiness: 'partial',
    gapNote: 'OCR + entity/relation extraction are real. General scene/object vision is NOT in the roster — document capture works, food/object recognition does not.',
    stance: 'copyable',
    ourAngle: 'Own document-and-text scanning (where OCR+NER is genuinely ours), not general object recognition. Scan a contract/statement, not a plate of food.',
  },
  {
    id: 'share-sheet-capture',
    name: 'Share-sheet capture',
    cluster: 'capture',
    whatItIs: 'Act on content the user is already looking at — send any page, PDF, or clip into your app from any other app.',
    shippedBy: ['Speechify', 'Instapaper / Pocket', 'PhotoRoom', 'ElevenLabs Reader'],
    demand: 84,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'The cheapest, stickiest capture surface on mobile; every reader-class app converges on it. Pocket\'s shutdown showed the surface outlives the product.',
    modality: 'cross',
    owners: [{ kind: 'estate', name: 'socioprophet-web (client-vue)', path: 'socioprophet-web/client-vue' }],
    readiness: 'partial',
    gapNote: 'Web surface exists; a native iOS/Android share-sheet extension does not yet.',
    stance: 'opening',
    ourAngle: 'Own the save/listen share-sheet into our feeds + second brain — but bundled into a deeper job, never as a standalone read-later (Pocket died doing that).',
  },
  {
    id: 'before-after-reveal',
    name: 'Before/after reveal',
    cluster: 'capture',
    whatItIs: 'A one-gesture comparison (slider, press-and-hold) of input vs output — builds control-trust AND manufactures the shareable contrast.',
    shippedBy: ['Facetune', 'Remini', 'PhotoRoom', 'AudioPen'],
    demand: 86,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Remini\'s slider is its hero UI; Facetune\'s press-and-hold is its signature. The transformation delta is what users post.',
    modality: 'cross',
    owners: [{ kind: 'estate', name: 'client-vue (UI primitive)', path: 'socioprophet-web/client-vue/src/components' }],
    readiness: 'have',
    gapNote: 'Pure UI mechanic — no model dependency. We can field this immediately.',
    stance: 'copyable',
    ourAngle: 'Highest-ROI steal on the board: baseline vs projected state on the Digital Health Twin, or before/after on a governed diff. Zero model cost.',
  },
  {
    id: 'instant-value-no-signup',
    name: 'Instant value before signup',
    cluster: 'capture',
    whatItIs: 'Deliver a real, personalized result in under 60 seconds with no account wall.',
    shippedBy: ['Cleanup.pictures', 'Photomath', 'Perplexity', 'Shazam'],
    demand: 90,
    demandBasis: 'evidence',
    evidenceGrade: 'A',
    demandNote: '82% of trial starts happen on Day 0 (RevenueCat) — you get one session. Cleanup.pictures made no-signup its entire acquisition wedge.',
    modality: 'none',
    owners: [{ kind: 'estate', name: 'client-vue (DEV_AUTH_BYPASS pattern)', path: 'socioprophet-web/client-vue/src/main.ts' }],
    readiness: 'partial',
    gapNote: 'Our surfaces are auth-first by default; an anonymous first-value path needs deliberate design.',
    stance: 'opening',
    ourAngle: 'Our cockpit gates everything behind auth. One ungated demo path per surface would materially change top-of-funnel.',
  },

  // ------------------------------ TRANSFORM ------------------------------
  {
    id: 'read-along-tts',
    name: 'Read-along TTS (pace as product)',
    cluster: 'transform',
    whatItIs: 'Text spoken aloud at 3-5× with a synchronized word-by-word highlight that drags the eye along.',
    shippedBy: ['Speechify', 'ElevenLabs Reader', 'Instapaper / Pocket'],
    demand: 82,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Speechify: ~50M users, 100k+ 5-star reviews, Apple Design Award 2025 — accessibility/education demand is proven and durable.',
    modality: 'audio',
    owners: [{ kind: 'none', name: 'no TTS model in roster' }],
    readiness: 'gap',
    gapNote: 'HARD GAP. No text-to-speech model anywhere in the estate roster (noetica-impair, model-carry, Noetica chat roster are all text-in/text-out).',
    stance: 'commodity',
    ourAngle: 'Voice quality is now commodity and we cannot field it today. If we want the reading surface, acquire/route TTS — do not build. Win on WHAT is read (governed, cited content), not the voice.',
  },
  {
    id: 'speech-to-clean-text',
    name: 'Speech → clean structured text',
    cluster: 'transform',
    whatItIs: 'Ramble in; tidy, restructured, rewritten prose out. Sells the transformation, not the transcription.',
    shippedBy: ['AudioPen', 'Superwhisper / MacWhisper', 'Otter.ai', 'Granola'],
    demand: 85,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'AudioPen\'s before/after screenshot is its whole growth loop; Granola hit a $1.5B valuation on capture-then-enhance.',
    modality: 'audio',
    owners: [
      { kind: 'none', name: 'no ASR model in roster' },
      { kind: 'model', name: 'gemma-2-9b-it (cleanup stage)', path: 'noetica-impair/src/noetica_impair/models/registry.py' },
    ],
    readiness: 'partial',
    gapNote: 'The CLEANUP half is ours (text LLMs). The ASR half is a gap — no Whisper-class model in the roster. Half the pipeline is missing.',
    stance: 'copyable',
    ourAngle: 'Add a local ASR model and the rest of the pipeline already exists. Cheapest path to a whole product category we currently cannot serve.',
  },
  {
    id: 'cited-synthesis',
    name: 'Cited synthesis (answer, not links)',
    cluster: 'transform',
    whatItIs: 'A synthesized answer with inline numbered citations rendered as a first-class UI primitive.',
    shippedBy: ['Perplexity'],
    demand: 89,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Perplexity built a category on it; citations are the single most-cited reason users trust it over a raw chatbot.',
    modality: 'text',
    owners: [
      { kind: 'model', name: 'gemma-2-9b-it / Llama-3.1-8B', path: 'noetica-impair/src/noetica_impair/models/registry.py' },
      { kind: 'tritfabric', name: 'atlas/semantics (JSON-LD/RDF/SHACL)', path: 'tritfabric/atlas/semantics/' },
      { kind: 'estate', name: 'sherlock-search', path: '~/dev/sherlock-search' },
    ],
    readiness: 'have',
    gapNote: 'Models + semantics + search are all real. This is our strongest offensive position in the entire library.',
    stance: 'opening',
    ourAngle: 'We can render deeper warrants than Perplexity — source AND reasoning trace AND policy verdict, not just a footnote link. Beat them on grounded verticals (law, markets, economy) where our ontology gives defensible depth.',
  },
  {
    id: 'step-by-step-explanation',
    name: 'Step-by-step explanation',
    cluster: 'transform',
    whatItIs: 'Give the answer free; sell the worked reasoning that produces understanding.',
    shippedBy: ['Photomath'],
    demand: 80,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Photomath\'s free steps are its retention core; the paid tier is animated depth. ~$27.4M FY23, ~85% recurring.',
    modality: 'text',
    owners: [
      { kind: 'model', name: 'DeepSeek-R1-Distill-Llama-8B (reasoning)', path: 'noetica-impair/src/noetica_impair/models/registry.py' },
      { kind: 'estate', name: 'alexandrian-academy', path: '~/dev/alexandrian-academy' },
    ],
    readiness: 'have',
    gapNote: 'Reasoning-distilled models plus the academy stack are real.',
    stance: 'opening',
    ourAngle: 'Add explanation provenance — why each step is valid — which their black-box steps lack. Now Google-owned and seasonal; a governed always-on tutor competes on trust.',
  },
  {
    id: 'summarize-longform',
    name: 'Summarize long-form',
    cluster: 'transform',
    whatItIs: 'Compress a book, meeting, episode, or page into the few minutes that matter.',
    shippedBy: ['Blinkist', 'Snipd', 'Granola', 'Arc Search'],
    demand: 78,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Blinkist built an SEO empire on it; Arc Search proved the gesture is loved even when the business fails.',
    modality: 'text',
    owners: [
      { kind: 'model', name: 'llama3.2:3b (local) / gemma-2-9b-it', path: 'sourceos-model-carry/examples/local-model-profile.llama32-3b.json' },
      { kind: 'tritfabric', name: 'slate/serve/doc_graph', path: 'tritfabric/slate/serve/doc_graph.py' },
    ],
    readiness: 'have',
    gapNote: 'Fully ours, including on-device. Commodity capability though — differentiation must come from elsewhere.',
    stance: 'commodity',
    ourAngle: 'Summarization alone is not a business (Arc Search). Attach it to provenance + an accumulating library so the summary is citable and kept.',
  },
  {
    id: 'inline-writing-correction',
    name: 'Inline writing assist',
    cluster: 'transform',
    whatItIs: 'Corrections and rewrites surfaced in-place, inside whatever text field the user is already in.',
    shippedBy: ['Grammarly'],
    demand: 80,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Real without Grammarly\'s distribution — LanguageTool has 4M+ users as a free/OSS rival, and Apple shipped system-wide Writing Tools in iOS 18.1 (an OS vendor entering is revealed demand). But expert sentiment is hostile ("full LLM brainrot") and the moat is being taken by the OS for free.',
    modality: 'text',
    owners: [
      { kind: 'model', name: 'llama3.2:1b/3b (local, low-latency)', path: 'sourceos-model-carry/examples/local-model-profile.llama32-1b.json' },
      { kind: 'tritfabric', name: 'atlas/serve/router', path: 'tritfabric/atlas/serve/router.py' },
    ],
    readiness: 'have',
    gapNote: 'Local small models are exactly right for this latency profile.',
    stance: 'opening',
    ourAngle: 'BearBrowser IS the surface Grammarly rents. We can ride every page and field natively, with lower friction and governed/cited output they cannot match.',
  },
  {
    id: 'background-removal',
    name: 'Background removal / cutout',
    cluster: 'transform',
    whatItIs: 'One tap isolates the subject in ~1 second, on-device, leaving a clean composable cutout.',
    shippedBy: ['PhotoRoom'],
    demand: 83,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'PhotoRoom: $150M+ ARR, ~1-month payback, 5B+ photos/yr. Seller demand is proven and recurring.',
    modality: 'image',
    owners: [{ kind: 'none', name: 'no image segmentation model in roster' }],
    readiness: 'gap',
    gapNote: 'HARD GAP. No vision/segmentation model in the estate.',
    stance: 'moat',
    ourAngle: 'Do not fight PhotoRoom on cutouts. The transferable asset is their PAYWALL DESIGN (watermark + commercial rights), not the model.',
  },
  {
    id: 'object-erase-inpaint',
    name: 'Object erase / inpaint',
    cluster: 'transform',
    whatItIs: 'Brush over an unwanted object; AI reconstructs the background seamlessly.',
    shippedBy: ['Cleanup.pictures'],
    demand: 78,
    demandBasis: 'evidence',
    evidenceGrade: 'A',
    demandNote: 'Unprompted App Store verbatims ("Need to erase something small but annoying? This is the app for you", "BEST APP TO REMOVE RANDOM WATERMARKS"), and Google made Magic Eraser a Pixel headline then charged for it via Google One. Caveat: 1-star reviews are all quality failures, and it is now table stakes on every flagship — commoditizing fast.',
    modality: 'image',
    owners: [{ kind: 'none', name: 'no inpainting model in roster' }],
    readiness: 'gap',
    gapNote: 'HARD GAP. No diffusion/inpainting capability.',
    stance: 'moat',
    ourAngle: 'Not our fight. Steal only the pattern: no-signup first magic, gate on output resolution.',
  },
  {
    id: 'face-enhance-restore',
    name: 'Face enhance / restore',
    cluster: 'transform',
    whatItIs: 'Restore a low-quality face photo into a crisp, flattering upgrade.',
    shippedBy: ['Remini', 'FaceApp', 'Facetune'],
    demand: 81,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Remini ~$93M run-rate; repeated #1 App Store surges. Demand is real but novelty-cyclical.',
    modality: 'image',
    owners: [{ kind: 'none', name: 'no face/image generative model in roster' }],
    readiness: 'gap',
    gapNote: 'HARD GAP — and it carries biometric/consent liability (Lensa BIPA class action, FaceApp privacy backlash).',
    stance: 'moat',
    ourAngle: 'Avoid on both capability and liability grounds. Their privacy exposure is a differentiator we can claim rhetorically without shipping the feature.',
  },
  {
    id: 'avatar-pack-generation',
    name: 'Avatar / portrait pack generation',
    cluster: 'transform',
    whatItIs: 'Upload 8-20 selfies; get back dozens of stylized or studio-grade portraits.',
    shippedBy: ['Lensa (Magic Avatars)', 'EPIK / AI Yearbook', 'HeadshotPro / Aragon'],
    demand: 70,
    demandBasis: 'evidence',
    evidenceGrade: 'A',
    demandNote: 'Enormous but spiky: Lensa ~$30.7M in one month then a 92% collapse; EPIK #1 then gone. HeadshotPro\'s B2B slice is the durable part.',
    modality: 'image',
    owners: [{ kind: 'none', name: 'no image generative model in roster' }],
    readiness: 'gap',
    gapNote: 'HARD GAP, plus training-data provenance exposure (Lensa artist backlash).',
    stance: 'moat',
    ourAngle: 'Structurally the worst business in the catalog (no retention). Steal the pay-at-peak-desire timing; ignore the product.',
  },
  {
    id: 'template-video-assembly',
    name: 'Template-driven video assembly',
    cluster: 'transform',
    whatItIs: 'Pick a trending template, clips auto-fill to the beat, export in under a minute with zero skill.',
    shippedBy: ['CapCut'],
    demand: 85,
    demandBasis: 'evidence',
    evidenceGrade: 'A',
    demandNote: 'Best-evidenced item in the study: CapCut complaints are about being DENIED templates ("Won\'t let me use templates", "Half the app is locked behind a paywall") — protest at losing access beats praise as demand evidence. Users actively hunt templates via organic TikTok discovery surfaces.',
    modality: 'video',
    owners: [{ kind: 'none', name: 'no video model/pipeline in roster' }],
    readiness: 'gap',
    gapNote: 'HARD GAP.',
    stance: 'moat',
    ourAngle: 'Unwinnable without an owned social graph. Do not fight general short-form; the only viable version is output tied to our data (prophecy explainers, twin timelines).',
  },

  // ------------------------------ RETENTION ------------------------------
  {
    id: 'forgiving-streak',
    name: 'Forgiving streak',
    cluster: 'retention',
    whatItIs: 'A loss-aversion counter with engineered mercy — freezes and repairs — so one miss does not cause abandonment.',
    shippedBy: ['Duolingo', 'Forest'],
    demand: 88,
    demandBasis: 'evidence',
    evidenceGrade: 'A',
    demandNote: 'Streaks ≈ 2× daily retention; a streak wager alone gives +14% D7. The forgiveness mechanic is why it does not backfire.',
    modality: 'none',
    owners: [{ kind: 'estate', name: 'client-vue (state + notifications)', path: 'socioprophet-web/client-vue' }],
    readiness: 'have',
    gapNote: 'No model dependency. Pure product mechanic — buildable now.',
    stance: 'copyable',
    ourAngle: 'The single highest-leverage retention steal for any daily-use surface. Cross-domain (learning + twin + prophecy) has no direct competitor.',
  },
  {
    id: 'accumulating-library',
    name: 'Accumulating library (switching cost)',
    cluster: 'retention',
    whatItIs: 'The user\'s own stuff piles up — notes, snips, saved items — and becomes the reason they cannot leave.',
    shippedBy: ['Things / Bear', 'Snipd', 'Instapaper / Pocket', 'Granola'],
    demand: 84,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Bear/Things convert on accumulated investment rather than a feature wall; Granola gates note history for exactly this reason.',
    modality: 'none',
    owners: [
      { kind: 'estate', name: 'memory-mesh', path: '~/dev/memory-mesh' },
      { kind: 'tritfabric', name: 'atlas/registry', path: 'tritfabric/atlas/registry.py' },
    ],
    readiness: 'have',
    gapNote: 'Memory/second-brain substrate exists in the estate.',
    stance: 'opening',
    ourAngle: 'Our provenance spine makes the accumulated library citable, not just stored — a durable advantage over a plain notes app.',
  },
  {
    id: 'lifecycle-notifications',
    name: 'Lifecycle-orchestrated notifications',
    cluster: 'retention',
    whatItIs: 'Segmented, motivation-scored, time-window-optimized nudges — not blast reminders.',
    shippedBy: ['Duolingo', 'Remini'],
    demand: 72,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Duolingo scores urgency and picks copy variants per user; it is the reference implementation. Users tolerate it because it is calibrated.',
    modality: 'none',
    owners: [{ kind: 'tritfabric', name: 'atlas/policy (rules) ', path: 'tritfabric/atlas/policy.py' }],
    readiness: 'partial',
    gapNote: 'Policy/rules engine exists; per-user lifecycle scoring and a delivery scheduler do not.',
    stance: 'copyable',
    ourAngle: 'Calibrated, governed nudging fits our policy plane — and consent-bound notification is a trust differentiator versus growth-hack spam.',
  },
  {
    id: 'loss-aversion-object',
    name: 'Loss aversion on a living object',
    cluster: 'retention',
    whatItIs: 'Attach the streak to something the user tends and can kill — a tree, a garden — then bridge it to a real-world consequence.',
    shippedBy: ['Forest'],
    demand: 58,
    demandBasis: 'hypothesis',
    evidenceGrade: 'B',
    demandNote: 'The mechanic lands ("brutally merciless if you lose focus. I like it") but NO evidence users prefer a living object to a plain streak — and Duolingo\'s published streak-wager data (+14% D7) cuts the other way at vastly larger scale. Forest 2-star reviews show the punishment often does not even fire, and an uncredible loss kills the mechanic. Nobody ever REQUESTS a dying tree; they report the effect afterward.',
    modality: 'none',
    owners: [{ kind: 'estate', name: 'client-vue', path: 'socioprophet-web/client-vue' }],
    readiness: 'have',
    gapNote: 'Pure mechanic.',
    stance: 'copyable',
    ourAngle: 'The virtual→real bridge is the interesting half; our estate has real assets (compute, trees, grants) that could back a genuine consequence.',
  },
  {
    id: 'daily-fresh-content',
    name: 'Daily reason to return',
    cluster: 'retention',
    whatItIs: 'One fresh unit of value per day so a one-job app is never "finished".',
    shippedBy: ['Blinkist', 'Duolingo'],
    demand: 55,
    demandBasis: 'commercial',
    evidenceGrade: 'C',
    demandSegment: 'Operator-side. Wordle-style scarcity ~70; served daily pick ~40.',
    demandNote: 'OPERATOR demand, not user demand: the Daily Blink is described as "a top acquisition lever" built as a push campaign, and there is a documented user request to REMOVE it. Zero of ~50 recent Blinkist reviews mention it. The genuine user-side case is Wordle, where scarcity (one puzzle, no more) drives the ritual — a different mechanic from a served recommendation.',
    modality: 'text',
    owners: [{ kind: 'estate', name: 'socioprophet news/feeds', path: 'socioprophet-web/client-vue/src/pages/NewsFeed.vue' }],
    readiness: 'have',
    gapNote: 'We already run a feed surface — the content engine exists.',
    stance: 'copyable',
    ourAngle: 'Our feeds already generate daily content; wiring a personalized daily pick is near-zero marginal cost.',
  },

  // ------------------------------ MONETIZATION ------------------------------
  {
    id: 'quiz-as-paywall',
    name: 'Quiz-as-paywall',
    cluster: 'monetization',
    whatItIs: 'A long personalization quiz that builds sunk cost and branches users to different, primed paywalls.',
    shippedBy: ['Cal AI', 'Blinkist'],
    demand: 60,
    demandBasis: 'commercial',
    evidenceGrade: 'B',
    demandNote: 'Users do not "want" this — but it works: Cal AI 3×\'d monthly revenue with it. Demand here is commercial, not user-side.',
    modality: 'none',
    owners: [{ kind: 'estate', name: 'client-vue', path: 'socioprophet-web/client-vue' }],
    readiness: 'have',
    gapNote: 'Pure product/funnel mechanic.',
    stance: 'copyable',
    ourAngle: 'Highest-ROI monetization mechanic in the catalog. Only field it where the answers demonstrably personalize the product — otherwise it is theatre.',
  },
  {
    id: 'watermark-paywall-ad',
    name: 'Watermark as paywall + ad',
    cluster: 'monetization',
    whatItIs: 'One mechanic that simultaneously proves value, advertises to everyone who sees the output, and creates the friction that converts.',
    shippedBy: ['PhotoRoom', 'CapCut', 'Prisma', 'FaceApp'],
    demand: 62,
    demandBasis: 'commercial',
    evidenceGrade: 'B',
    demandNote: 'Commercially proven (PhotoRoom ~1-month payback). User-side demand is for its REMOVAL — which is the point.',
    modality: 'none',
    owners: [{ kind: 'estate', name: 'client-vue', path: 'socioprophet-web/client-vue' }],
    readiness: 'have',
    gapNote: 'Applies to any shareable artifact we generate — including charts, diagrams and reports.',
    stance: 'copyable',
    ourAngle: 'Most efficient monetization+virality primitive in the study. Attach to any exportable artifact our surfaces produce.',
  },
  {
    id: 'use-case-boundary-paywall',
    name: 'Use-case-boundary paywall',
    cluster: 'monetization',
    whatItIs: 'Show the magic free; gate exactly what a commercial user cannot live without (rights, HD, batch).',
    shippedBy: ['PhotoRoom', 'Photomath', 'Rocket Money'],
    demand: 66,
    demandBasis: 'commercial',
    evidenceGrade: 'B',
    demandNote: 'Hobbyists stay free and market you; earners self-select into paying. PhotoRoom\'s payback proves the split works.',
    modality: 'none',
    owners: [{ kind: 'tritfabric', name: 'atlas/policy (entitlements)', path: 'tritfabric/atlas/policy.py' }],
    readiness: 'have',
    gapNote: 'Policy engine can express entitlement boundaries directly.',
    stance: 'copyable',
    ourAngle: 'The most defensible paywall shape — it never hides the magic, so it does not read as predatory. Fits our governance posture.',
  },
  {
    id: 'gate-on-sync',
    name: 'Gate on accumulated investment',
    cluster: 'monetization',
    whatItIs: 'Give the whole experience away; charge for the thing sustained usage forces you into — sync, history, a second device.',
    shippedBy: ['Things / Bear', 'Granola'],
    demand: 73,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Bear\'s sync-only paywall is consistently praised in reviews as fair — rare for a subscription.',
    modality: 'none',
    owners: [{ kind: 'estate', name: 'memory-mesh / sync plane', path: '~/dev/memory-mesh' }],
    readiness: 'partial',
    gapNote: 'Memory substrate exists; a user-facing multi-device sync product does not.',
    stance: 'opening',
    ourAngle: 'Highest goodwill-per-dollar model here. Pairs naturally with our sovereign/on-device posture.',
  },
  {
    id: 'dynamic-paywall-ab',
    name: 'Dynamic paywall A/B',
    cluster: 'monetization',
    whatItIs: 'Treat the paywall as the #1 product surface — hundreds of variants, geo/device pricing, anchored annual vs decoy weekly.',
    shippedBy: ['Cal AI', 'Remini'],
    demand: 55,
    demandBasis: 'commercial',
    evidenceGrade: 'B',
    demandNote: 'Cal AI ran 400+ variants; 87% shown a wall → 57% start a transaction. Pure commercial demand.',
    modality: 'none',
    owners: [{ kind: 'none', name: 'no experimentation plane wired to pricing' }],
    readiness: 'gap',
    gapNote: 'We have an experiments surface but nothing wired to entitlements/pricing.',
    stance: 'copyable',
    ourAngle: 'Worth building only once we actually sell something. Keep it honest — the FTC line is thin here.',
  },

  // ------------------------------ DISTRIBUTION ------------------------------
  {
    id: 'os-surface-colonization',
    name: 'OS surface colonization',
    cluster: 'distribution',
    whatItIs: 'One install yields keyboard + editor + extension + widget, so the single feature fires in every context.',
    shippedBy: ['Grammarly', 'Speechify'],
    demand: 62,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandSegment: 'Demand is for COVERAGE (~85), not for installs. Colonization is the vendor\'s means, tolerated not wanted.',
    demandNote: 'Users want "works everywhere I already write" — but every surface is a permission tax. iOS warns full-access keyboards can "access, collect and transmit the data you type"; security guidance says avoid third-party keyboards; a 2019 iOS bug granted full access even when denied. Grammarly\'s own 1-star reviews carry that distrust ("why do we have to share our location?").',
    modality: 'none',
    owners: [{ kind: 'estate', name: 'BearBrowser', path: '~/dev/BearBrowser' }],
    readiness: 'partial',
    gapNote: 'We own a browser (a surface most competitors must rent) but have not shipped extension/keyboard/Action-Button surfaces.',
    stance: 'opening',
    ourAngle: 'Structural advantage: we OWN the browser. Grammarly rents it. This is the biggest asymmetry in the entire library.',
  },
  {
    id: 'in-context-bot',
    name: 'In-context bot / presence',
    cluster: 'distribution',
    whatItIs: 'The tool shows up in a shared space on the user\'s behalf, exposing every other participant to it.',
    shippedBy: ['Otter.ai'],
    demand: 64,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Self-distributing, but Granola\'s botless growth shows a real counter-demand for NOT having a bot in the room.',
    modality: 'none',
    owners: [{ kind: 'estate', name: 'agentplane', path: '~/dev/agentplane' }],
    readiness: 'partial',
    gapNote: 'Agent plane exists; meeting-platform integrations do not.',
    stance: 'copyable',
    ourAngle: 'Prefer the Granola shape — botless local capture. Same artifact, none of the trust cost.',
  },
  {
    id: 'zero-install-shared-artifact',
    name: 'Zero-install shared artifact',
    cluster: 'distribution',
    whatItIs: 'The output is a live web object a non-user can open and query, which converts them into a user.',
    shippedBy: ['Granola', 'Perplexity'],
    demand: 84,
    demandBasis: 'evidence',
    evidenceGrade: 'A',
    demandNote: 'Second-best-evidenced item: users report BEHAVIORAL REFUSAL, not annoyance — "I dont click on twitter links, since there is a login wall". Critically the wall suppresses the SHARER too: "makes me cautious to want to share links with other people" — the second-order effect that kills viral distribution. Loom, Adobe XD and HuggingChat show the same finding across independent domains.',
    modality: 'text',
    owners: [
      { kind: 'estate', name: 'client-vue + Artifact surface', path: 'socioprophet-web/client-vue' },
      { kind: 'tritfabric', name: 'atlas/http_api', path: 'tritfabric/atlas/http_api.py' },
    ],
    readiness: 'have',
    gapNote: 'We already publish shareable artifact pages.',
    stance: 'opening',
    ourAngle: 'A shared artifact that carries its provenance is strictly better than one that does not — and we can ship it today.',
  },
  {
    id: 'programmatic-seo-floor',
    name: 'Programmatic SEO floor',
    cluster: 'distribution',
    whatItIs: 'Thousands of generated pages, one per intent, compounding organic acquisition under everything else.',
    shippedBy: ['Blinkist', 'HeadshotPro / Aragon', 'Photomath', 'Perplexity'],
    demand: 40,
    demandBasis: 'commercial',
    evidenceGrade: 'C',
    demandSegment: 'User demand ~15 (nobody asks for these pages). Commercial viability now conditional ~50 and ERODING.',
    demandNote: 'Not a user-demand feature at all — and the channel is now adversarial. Google\'s March 2024 scaled-content-abuse policy explicitly names "generating many pages where the content is only slightly different… to manipulate rankings"; the Helpful Content update deindexed large template operations (one case: 50k city pages, 98% deindexed in 3 months). HeadshotPro\'s ~$300K/mo is real but the floor is shrinking.',
    modality: 'text',
    owners: [
      { kind: 'estate', name: 'socioprophet-web / domain portfolio', path: '~/dev/socioprophet-web' },
      { kind: 'model', name: 'llama3.2:3b (page generation)', path: 'sourceos-model-carry/examples/local-model-profile.llama32-3b.json' },
    ],
    readiness: 'partial',
    gapNote: 'We hold ~30 domains largely unwired (per the domain portfolio audit) — the substrate is idle.',
    stance: 'opening',
    ourAngle: 'REVISED DOWN: we own ~30 domains and can generate pages locally, but Google now actively penalizes exactly this. Do not treat it as dormant capital. The only defensible version is genuinely useful pages carrying provenance — which is a content strategy, not an SEO trick.',
  },
  {
    id: 'deep-link-template-loop',
    name: 'Deep-link re-entry loop',
    cluster: 'distribution',
    whatItIs: 'Every exported artifact carries a link that re-opens the tool with that recipe loaded.',
    shippedBy: ['CapCut'],
    demand: 60,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandSegment: 'Conditional: ~80 only if you own or are favoured by the source surface; ~60 generic.',
    demandNote: 'Genuine user pull exists — people SEARCH for template links, which is pull not push. But ByteDance owns both ends and the TikTok algorithm reportedly favours template videos. Strip out common ownership and the evidence for a generic "try this X" loop is thin. Do not generalize this mechanic.',
    modality: 'none',
    owners: [{ kind: 'estate', name: 'client-vue routing', path: 'socioprophet-web/client-vue/src/main.ts' }],
    readiness: 'have',
    gapNote: 'Routing supports it; nothing exports a re-entry link today.',
    stance: 'copyable',
    ourAngle: 'Cheap to add to any artifact we already export — turns every shared page into a funnel entry.',
  },

  // ------------------------------ TRUST ------------------------------
  {
    id: 'inline-citations',
    name: 'Inline citations / provenance',
    cluster: 'trust',
    whatItIs: 'Receipts rendered as part of the answer — source, and ideally the reasoning and policy verdict behind it.',
    shippedBy: ['Perplexity'],
    demand: 86,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'The most-cited reason users trust Perplexity over a bare chatbot; trust is the scarce good in AI products right now.',
    modality: 'text',
    owners: [
      { kind: 'tritfabric', name: 'atlas/semantics (JSON-LD/RDF/SHACL)', path: 'tritfabric/atlas/semantics/' },
      { kind: 'estate', name: 'evidence-intake-kernel / prophet-truth', path: '~/dev/prophet-truth' },
      { kind: 'tritrpc', name: 'proof_envelope / attestation_verifier', path: 'tritrpc/spec/orchestration/' },
    ],
    readiness: 'have',
    gapNote: 'Deepest capability we own. Provenance is the estate\'s core thesis.',
    stance: 'opening',
    ourAngle: 'THE flagship. Nobody in this catalog can render a warrant — source + reasoning trace + policy verdict + attestation. This is where we are structurally strongest.',
  },
  {
    id: 'on-device-privacy',
    name: 'On-device / local-first processing',
    cluster: 'trust',
    whatItIs: 'The work happens locally — no upload, no server-side retention, provable privacy.',
    shippedBy: ['Superwhisper / MacWhisper', 'PhotoRoom', 'Granola'],
    demand: 80,
    demandBasis: 'evidence',
    evidenceGrade: 'B',
    demandNote: 'Superwhisper sells on it; Granola grew on botless local capture; FaceApp and Lensa were punished for the opposite.',
    modality: 'cross',
    owners: [
      { kind: 'model', name: 'llama3.2:1b/3b (local carry)', path: 'sourceos-model-carry/examples/local-model-profile.llama32-1b.json' },
      { kind: 'tritrpc', name: 'v1 codec + AEAD (XChaCha20-Poly1305)', path: 'tritrpc/reference/tritrpc_v1.py' },
      { kind: 'tritfabric', name: 'atlas/security/aead', path: 'tritfabric/atlas/security/aead.py' },
    ],
    readiness: 'have',
    gapNote: 'On-device profiles + sealed transport are both real and governed.',
    stance: 'opening',
    ourAngle: 'Local + one-time + governed is a positioning incumbents structurally cannot copy without breaking their business model. Direct answer to the Lensa/FaceApp liability.',
  },
  {
    id: 'consent-provenance-pipeline',
    name: 'Consented, provenance-clean pipeline',
    cluster: 'trust',
    whatItIs: 'Training data and user inputs carry consent and license provenance end to end.',
    shippedBy: [],
    demand: 88,
    demandBasis: 'evidence',
    evidenceGrade: 'A',
    demandSegment: 'CREATOR + ENTERPRISE ~88 (grade A). Mass CONSUMER only ~45 (grade C) — do not blend them.',
    demandNote: 'Creator demand is behavioral and strong: Cara grew 40k→650k users in ONE WEEK rejecting Meta AI training; Spawning\'s opt-out registry passed 1B works; Adobe\'s ToS wording forced two rewrites in a month. Consumer demand is the privacy paradox — high stated concern (Pew: ~half more concerned than excited) but Lensa re-spiked to 12.6M downloads in 11 days in Dec 2025, so consumers did NOT durably punish it.',
    modality: 'cross',
    owners: [
      { kind: 'tritfabric', name: 'atlas/autonomy_gate + autopilot/promotion_controller', path: 'tritfabric/atlas/autopilot/promotion_controller.py' },
      { kind: 'estate', name: 'model-governance-ledger', path: '~/dev/model-governance-ledger' },
      { kind: 'estate', name: 'Lawful Learning invariants', path: '~/dev/policy-fabric' },
    ],
    readiness: 'have',
    gapNote: 'Governance ledger + promotion gates + lawful-learning invariants all exist (conformance is uneven across repos, per the audit).',
    stance: 'opening',
    ourAngle: 'An unoccupied square on the board. Zero specimens ship it, several bled for lacking it, and it is the thing our estate is actually built to do.',
  },
];
