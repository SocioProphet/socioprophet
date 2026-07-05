# AI stack head-to-head: Azure · Google · AWS · IBM watsonx — and where WE stack up (2026)

Honest map of the four hyperscaler AI stacks vs our sovereign stack. Status legend for **Us**: ✅ match/beat · 🟡 partial/early · ❌ gap. The Big-4 cells note the flagship; assume GA unless marked.

## Master matrix
| Capability | Azure | Google | AWS | IBM watsonx | **Us** |
|---|---|---|---|---|---|
| **Frontier / first-party model** | GPT-5.5 (OpenAI) | Gemini 3.5 | Nova 2 | Granite 4.1 (owns IP) | ❌ broker only — no own frontier |
| **Model catalog** | Foundry 11,000+ | Model Garden 200+ | Bedrock + Marketplace 100+ | watsonx.ai + 3rd-party | 🟡 local store (tens) + frontier passthrough |
| **Inference routing / cross-vendor broker** | model-router (own catalog) | — | — | — | ✅✅ **router across frontier+neocloud+local — uniquely cross-vendor** |
| **Fine-tuning / customization** | SFT/DPO/RFT GA | Gemini SFT (LoRA) + distill | SageMaker + Nova Forge | InstructLab (SME-driven) | 🟡→❌ **TritFabric — VERIFY: reported doc-only, may not be wired** |
| **Managed training + MLOps + registry** | Azure ML (deep) | Vertex training/pipelines | SageMaker HyperPod | watsonx.ai | ❌ none (sidecars only) |
| **Agents: framework + runtime** | Agent Framework + Foundry Agent Svc | ADK + Agent Engine | Bedrock AgentCore (7 svcs GA) | Orchestrate (control plane) | 🟡 agent loop + agentplane; no managed runtime |
| **Multi-agent orchestration** | graph workflows GA | ADK graph runtime | supervisor + Strands | Agent Catalog + prebuilt | ❌ single-agent; real gap |
| **Agent interop (A2A / MCP)** | A2A+MCP | A2A (donated to LF) + MCP | A2A + MCP (Gateway) | A2A/LangGraph | 🟡 MCP stack + A2A bridges (have plumbing) |
| **RAG / vector / enterprise search** | AI Search + agentic retrieval | Vertex Search/RAG Engine/Vector 2.0 | Bedrock KB + Kendra + S3 Vectors + GraphRAG | watsonx.data (Milvus) | ✅ **graph-native (HellGraph+GDS) + HippoRAG + provenance — arguably ahead on grounding** |
| **Embeddings** | text-embed-3 + Cohere | Vertex embeddings | Titan/Cohere v4 | embedded | ✅ own Rust fastembed (local) |
| **Knowledge representation (graph)** | — | (Neptune-less) | Neptune GraphRAG | — | ✅✅ **graph-native knowledge layer + GDS (PageRank/Louvain) — beyond all** |
| **Speech STT/TTS + voice clone** | Custom/Personal Voice | Chirp 3 + Instant Clone (gated) | Nova 2 Sonic (s2s) | Watson STT/TTS | 🟡 local STT/TTS + **XTTS-v2 clone (self-serve, theirs is gated)** |
| **Vision / Document AI / OCR** | Content Understanding + Doc Intelligence | Document AI (Gemini-3) | Textract + BDA | Discovery | ❌ macOS-Vision OCR only (cross-platform gap) |
| **Translation / NLP services** | Translator + Language | Translation LLM + 189 langs | Translate/Comprehend | NLU | ❌ none (subsumed into LLM) |
| **Media gen (image/video)** | (via OpenAI) | Veo/Imagen + NotebookLM cinematic | Nova Canvas/Reel | — | 🟡 image-gen tool; **video = gap** |
| **Guardrails / groundedness** | Content Safety + Prompt Shields | Model Armor (GA) | Bedrock Guardrails + **Automated Reasoning (formal!)** | **Granite Guardian (benchmarked)** | 🟡 anti-hallucination by construction — **but no benchmark, no standalone service** |
| **AI governance / risk / EU AI Act** | Purview RAI | SCC AI Protection | (via Guardrails) | **watsonx.governance — Gartner MQ leader** | 🟡→❌ scope-d runtime gating; **no framework packs / compliance reports** |
| **Provenance / watermark** | — | SynthID (default-on) | — | — | 🟡 C2PA content-credentials |
| **AI infra / silicon** | Maia + ND GB200 | Ironwood TPU7x + A4 | Trainium3 + P6e-GB200 | (uses others) | ❌ no silicon — but **broker to cheapest GPU incl. neocloud** |
| **GPU economics / cost model** | per-seat/consumption | consumption + TPU | consumption + Trainium | per-token + license | ✅✅ **flat-cost + cross-vendor arbitrage (neocloud H100 ~$2 vs $3.7-5)** |
| **On-device / edge / sovereign runtime** | Foundry Local | (none real) | (none real) | OpenShift AI + **Sovereign Core (GA May'26)** | ✅ **most radically local per-node** (whole workbench on-device) |
| **Neural operators (FNO/scientific ML)** | ❌ | ❌ | ❌ | ❌ | ✅ uncontested (operator-sidecar) |
| **Sovereign anonymous-first / compulsion-resistant identity** | ❌ (Entra = correlation) | ❌ | ❌ | ❌ (named IAM) | ✅✅✅ **uncontested — nobody can follow** |

## Where we genuinely win (the consistent ✅ across all four)
1. **Cross-vendor inference + GPU brokering** — none of the Big-4 brokers *across* clouds (they're each one cloud). With neoclouds added, this is real cost arbitrage + no lock-in.
2. **Graph-native knowledge + RAG** — our HellGraph+GDS+HippoRAG grounding is ahead of even AWS GraphRAG / Vertex RAG on provenance + "central ideas"; far ahead of vector-only stacks.
3. **Compulsion-resistant, anonymous-first identity + governance tier** — the one capability all four *structurally cannot* build (their businesses depend on correlation/legibility). IBM's Sovereign Core gets close on sovereignty but stops at named-enterprise IAM.
4. **Radical on-device completeness + flat cost** — a whole sovereign AI workbench per node, flat-cost, on your own models.
5. **Neural operators** — uncontested niche.

## The honest gaps (consistent across all four reviews)
- **No first-party frontier model** — we broker; we own none (IBM/Amazon/Google own theirs).
- **Fine-tuning is the credibility gap** — **TritFabric was reported as doc-only (no `/api/tune`)**; needs verification + a real trainer. This is the keystone that turns our learning loop into *model improvement on your own data, on your hardware* — the thing the hyperscalers can't match on sovereignty.
- **No managed training / MLOps / model registry** — entire pillar absent.
- **Thin multi-agent orchestration** — single agent loop vs GA graph-workflow engines everywhere.
- **Cognitive-services breadth absent** — vision, translation, NLP, document-AI (we're macOS-OCR-only). RAG quality is bottlenecked by ingestion.
- **Governance is not "printable"** — IBM ships EU AI Act / ISO 42001 / NIST framework packs + auto risk-scoring + audit evidence and is the Gartner leader; we have runtime gating + an audit chain but **no compliance reports, no certs (SOC 2 / ISO 42001), no benchmarked guard model**.
- **The cloud broker provisions nothing yet** — it's a cost calculator + placement decision, not an executor. "Routes to cheapest neocloud" is advice, not action.
- **No benchmarked safety model** — Granite Guardian publishes RAG-groundedness numbers; our "anti-hallucination by construction" has no published benchmark.

## Strategic verdict
**IBM Sovereign Core (GA May 2026) validated — and partly occupied — the sovereign-AI lane.** The open ground left is the **adversarial tier IBM/Google/AWS/Azure cannot enter**: compulsion-resistance + anti-correlation + cross-vendor brokering. So:
1. **Don't chase breadth** (cognitive services, silicon, MLOps platform) — broker or skip.
2. **Move up to the adversarial governance tier** and **make governance printable** — framework-pack reports + at least SOC 2 Type II + a *public benchmark* of choir-grounding vs Granite Guardian (turn the architecture claim into a number).
3. **Make fine-tuning real** (TritFabric trainer + promote gate wired to the verifier loop) — sovereign model improvement is the wedge.
4. **Make the cloud mesh actually provision + prove it** (neocloud burst + beat-a-frontier-model-on-the-client's-own-tests at flat cost).
5. **Minimal multi-agent orchestration** + **cross-platform document understanding** (feeds our real strength, the graph).

## Top-5 build priorities (converged across all four audits)
1. Real fine-tuning loop (verify/build TritFabric trainer + `/api/tune`).
2. Governance evidence layer (EU AI Act / ISO 42001 reports) + public groundedness benchmark + SOC 2 path.
3. Cloud mesh: actual neocloud provisioning + the live "beats frontier on your tests, flat cost" proof.
4. Minimal multi-agent orchestration over the agent loop + federated-MCP.
5. Cross-platform Document/Content Understanding feeding the knowledge graph.
