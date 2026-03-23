import { defineConfig } from "vitepress";

const base = process.env.DOCS_BASE || "/";

export default defineConfig({
  head: [
    ["link", { rel: "icon", href: "/icon.png" }],
    ["script", { async: "", src: "https://www.googletagmanager.com/gtag/js?id=G-GL5Y2786Z6" }],
    ["script", {}, "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag(\"js\", new Date()); gtag(\"config\", \"G-GL5Y2786Z6\"); function spTrack(name, params){ try{ if(typeof gtag===\"function\") gtag(\"event\", name, params||{}); }catch(e){} }"],
  ],
  title: "SocioProphet",
  description: "SocioProphet documentation",
  base,
  cleanUrls: true,
  markdown: {
    math: true,
  },
  themeConfig: {
    logo: { light: "/icon.png", dark: "/icon.png" },
    nav: [
      { text: "Docs", link: "/" },
      { text: "Getting Started", link: "/guide/getting-started" },
      { text: "Organizations", link: "/guide/organizations-governance-and-institutional-safety" },
      { text: "Entity Analytics", link: "/guide/entity-analytics-reference" },
      { text: "Products", link: "/guide/products/overview" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Start Here",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Architecture", link: "/guide/architecture" },
            { text: "Canonical Platform Direction", link: "/guide/canonical-platform-direction" },
          ],
        },
        {
          text: "Institutional, Governance, and Safety",
          items: [
            { text: "Organizations Governance and Institutional Safety", link: "/guide/organizations-governance-and-institutional-safety" },
            { text: "Governed AI and Cybernetics", link: "/guide/governed-ai-and-cybernetics" },
            { text: "Agent Plane and Operator Workflows", link: "/guide/agent-plane-and-operator-workflows" },
            { text: "Authorized Cyberdefense and Simulation", link: "/guide/authorized-cyberdefense-and-simulation" },
            { text: "Deterministic AI and Mathematical Safety", link: "/guide/deterministic-ai-and-mathematical-safety" },
            { text: "Boundary-Centric Cyber Hypergraph", link: "/guide/boundary-centric-cyber-hypergraph" },
            { text: "Provenance, Promotion, and Reversibility", link: "/guide/provenance-promotion-and-reversibility" },
            { text: "Public vs Restricted Security Boundary", link: "/guide/public-vs-restricted-security-boundary" },
            { text: "Platform Human Protection and Safeguarding", link: "/guide/platform-human-protection-and-safeguarding" },
            { text: "Guardian Consent and Minor Access Model", link: "/guide/guardian-consent-and-minor-access-model" },
            { text: "Digital Trust and Capability Routing", link: "/guide/digital-trust-and-capability-routing" },
          ],
        },
        {
          text: "Auth and Capability Routing",
          items: [
            { text: "Auth and Connections", link: "/guide/auth-and-connections" },
            { text: "Provider Capability Routing", link: "/guide/provider-capability-routing" },
            { text: "Provider Safety and Capability Eligibility", link: "/guide/provider-safety-and-capability-eligibility" },
            { text: "Auth Recovery and Connection Health", link: "/guide/auth-recovery-and-connection-health" },
          ],
        },
        {
          text: "Entity Analytics",
          items: [
            { text: "Entity Analytics Reference", link: "/guide/entity-analytics-reference" },
            { text: "Worked Example: Michael Cross-Context", link: "/guide/worked-example-michael-cross-context" },
            { text: "Entity Analytics Overview", link: "/guide/entity-analytics-overview" },
            { text: "Identity Prime and Event-IR", link: "/guide/identity-prime-and-event-ir" },
            { text: "Entity Graph and Safe Linkage", link: "/guide/entity-graph-and-safe-linkage" },
            { text: "Policy-Constrained Merging and Unmerge", link: "/guide/policy-constrained-merging-and-unmerge" },
            { text: "Marketer-Safe Outputs and Segment Proofs", link: "/guide/marketer-safe-outputs-and-segment-proofs" },
          ],
        },
        {
          text: "Academy and Learning",
          items: [
            { text: "Academy Policy Index", link: "/guide/academy-policy-index" },
            { text: "Academy Safeguarding and Minor Protection", link: "/guide/academy-safeguarding-and-minor-protection" },
            { text: "Academy Interaction Contract", link: "/guide/academy-interaction-contract" },
            { text: "Academy Guardian Rights, Sensitive Reports, and Escalation", link: "/guide/academy-guardian-rights-sensitive-reports-and-escalation" },
            { text: "Operating Modes: Learning and Defense", link: "/guide/operating-modes-learning-and-defense" },
            { text: "23-Topic Canon", link: "/guide/twenty-three-topic-canon" },
          ],
        },
        {
          text: "Models and Theory",
          items: [
            { text: "Governed Cybernetic Stack", link: "/guide/governed-cybernetic-stack" },
            { text: "Semantic Vector Stack", link: "/guide/semantic-vector-stack" },
            { text: "Semantic Representation Ladder", link: "/guide/semantic-representation-ladder" },
            { text: "LSA / LSI / LDA Geometry", link: "/guide/lsa-lsi-lda-geometry" },
            { text: "Semantic Model Workstreams", link: "/guide/semantic-model-workstreams" },
            { text: "Hybrid Representation Builder", link: "/guide/hybrid-representation-builder" },
            { text: "Temporal Graph Evolution", link: "/guide/temporal-graph-evolution" },
          ],
        },
        {
          text: "Products",
          items: [
            { text: "Products Overview", link: "/guide/products/overview" },
            { text: "Product Surface Standard", link: "/guide/product-surface-standard" },
            { text: "Product Surface Maturity Matrix", link: "/guide/product-surface-maturity-matrix" },
          ],
        },
      ],
    },
  },
});
