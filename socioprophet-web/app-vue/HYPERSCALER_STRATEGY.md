# NeoCloud + the hyperscaler-competitor strategy

## 1. NeoCloud — assessed, now brokered
**Were neoclouds in the broker? No — that was a gap, now closed.** `cloud-broker.ts` now carries the GPU specialists —
**CoreWeave, Lambda, Nebius, Crusoe** — alongside the hyperscalers, Hetzner, and the local mesh.
- H100 brokers to a neocloud at **~$2.00/hr** (Nebius) vs hyperscaler A100 ~$3.7–5/hr — proven (`brokerCompute({gpu:{type:'H100'}})` → neocloud).
- `brokerCompute({providers: NEOCLOUDS})` restricts to neocloud-only supply; residency/exclude/spot all apply.
- Inference is *already* brokered separately (the router/`resolveProvider` lane: frontier + neocloud inference APIs +
  the local mesh). So we broker **both** raw GPU (per-hour) and inference (per-token), plus general cloud services.

## 2. Can this be a real hyperscaler competitor? — Yes, by BROKERING, not building
We are **not** going to pour billions into datacenters. The realistic — and stronger — position:
> The neoclouds + hyperscalers are **commodity GPU/compute supply**. We are the **sovereign intelligence + governance
> + identity control plane** and the **cross-vendor broker** on top. The "hyperscaler competitor" isn't another
> hyperscaler — it's the layer that makes all of them interchangeable and routes every workload to the cheapest
> compliant one, governed by scope-d, with the workspace + AI suite riding on top.

What that gets us, concretely (all already in code or one step away):
- **Cost arbitrage** — cheapest GPU across neocloud+hyperscaler+spot+local; `brokerSavings` quantifies it. Neoclouds
  alone cut GPU ~40–60% vs hyperscaler list.
- **No lock-in / sovereignty** — `selectVendor` honors data residency + exclude-vendor; one Helm chart, any cloud.
- **The control plane** — scope-d governs every placement (egress, residency, policy); `toAgentplanePlacement`
  emits an evidence-grade decision. *This* is the moat hyperscalers structurally can't offer: they want lock-in.
- **The suite on top** — Workspace/one (mail/knowledge/office/git/AI) is the demand that consumes the brokered supply.

The honest line: **we compete with Google Cloud the way Kayak competes with airlines** — not by owning planes, but by
being the sovereign, governed broker nobody else is incentivized to build.

## 3. Answers to the Google Workspace sheet (Have ✅ / Partial 🟡 / Gap ❌)
| Google line item | Our answer | Status |
|---|---|---|
| Cloud Identity (Free / Premium $7.20) | **Sovereign broker — anonymous-first, unlinkable. Strictly *better*: identity nobody can correlate.** | ✅✅ moat |
| Enterprise Data Regions ($2) | Broker residency selection — **cross-vendor**, not one cloud | ✅ better |
| AI Expanded Access ($24/seat) | The **choir** — sovereign models, **flat-cost** not per-seat AI | ✅ |
| More storage / 10TB bundles | Object storage, **brokered to cheapest vendor** (Hetzner $0.005/GB vs GCS $0.02) | ✅ cheaper |
| Colab Pro/Pro+ (notebook GPU) | **Compute broker → neocloud GPU** (cheaper); notebook UI = to build | 🟡 |
| Business/Enterprise suite + storage | Workspace/one suite (mail/cal/drive/docs/git/knowledge) — building, foundations in | 🟡 |
| Workspace Studio (automation) | **Flows** app (registry) + choir agents — planned | 🟡 |
| Gemini app & NotebookLM | Choir + **graph-native knowledge** (beats Notion); **audio overviews = gap** | 🟡 |
| Veo & Nano Banana (image/video gen) | `generate_image` exists; **video gen = gap** | 🟡 |
| AppSheet (no-code app builder) | Marketplace + SourceOS builder + MCP plugins (adjacent); true no-code builder = to build | 🟡 |
| Meet + Meet hardware | Jitsi / MatrixRTC; **certified hardware = gap** | 🟡 |
| Looker Studio (BI) | GDS analytics + charts/registry; **full BI/dashboards = gap** | 🟡 |
| Google Voice (telephony) | **Gap** — SIP/PSTN telephony not built (Matrix VoIP/Jitsi is the seam) | ❌ |
| Chrome Enterprise / ChromeOS / Android mgmt | **Gap** — device/browser MDM not built; our angle = Linux-first + MDM-*compartmentalization* (the inverse: resist MDM correlation) | ❌→differentiator |

**Net:** we have **stronger-than-Google answers** on identity, data residency, AI cost model, storage cost, and GPU
(via neocloud brokering). We're **partial** on the suite breadth, automation, BI, and media-gen. We have **real gaps**
on telephony and device/endpoint management — and on device management our thesis is deliberately the *opposite* of
Google's (compartmentalize, don't surveil). None of the gaps require becoming a hyperscaler; they're app/integration work.
