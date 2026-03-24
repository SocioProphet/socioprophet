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
      { text: "Docs", link: "https://socioprophet.com/documentation/" },
      { text: "Getting Started", link: "https://socioprophet.com/documentation/getting-started/" },
      { text: "Organizations", link: "https://socioprophet.com/documentation/organizations-governance-and-institutional-safety/" },
      { text: "Entity Analytics", link: "https://socioprophet.com/documentation/entity-analytics-reference/" },
      { text: "Products", link: "https://socioprophet.com/documentation/products/overview/" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Start Here",
          items: [
            { text: "Getting Started", link: "https://socioprophet.com/documentation/getting-started/" },
            { text: "Architecture", link: "https://socioprophet.com/documentation/architecture/" },
            { text: "Canonical Platform Direction", link: "https://socioprophet.com/documentation/canonical-platform-direction/" },
          ],
        },
        {
          text: "Institutional, Governance, and Safety",
          items: [
            { text: "Organizations Governance and Institutional Safety", link: "https://socioprophet.com/documentation/organizations-governance-and-institutional-safety/" },
            { text: "Governed AI and Cybernetics", link: "https://socioprophet.com/documentation/governed-ai-and-cybernetics/" },
            { text: "Agent Plane and Operator Workflows", link: "https://socioprophet.com/documentation/agent-plane-and-operator-workflows/" },
            { text: "Authorized Cyberdefense and Simulation", link: "https://socioprophet.com/documentation/authorized-cyberdefense-and-simulation/" },
            { text: "Deterministic AI and Mathematical Safety", link: "https://socioprophet.com/documentation/deterministic-ai-and-mathematical-safety/" },
            { text: "Boundary-Centric Cyber Hypergraph", link: "https://socioprophet.com/documentation/boundary-centric-cyber-hypergraph/" },
            { text: "Provenance, Promotion, and Reversibility", link: "https://socioprophet.com/documentation/provenance-promotion-and-reversibility/" },
            { text: "Public vs Restricted Security Boundary", link: "https://socioprophet.com/documentation/public-vs-restricted-security-boundary/" },
            { text: "Platform Human Protection and Safeguarding", link: "https://socioprophet.com/documentation/platform-human-protection-and-safeguarding/" },
            { text: "Guardian Consent and Minor Access Model", link: "https://socioprophet.com/documentation/guardian-consent-and-minor-access-model/" },
            { text: "Digital Trust and Capability Routing", link: "https://socioprophet.com/documentation/digital-trust-and-capability-routing/" },
          ],
        },
        {
          text: "Auth and Capability Routing",
          items: [
            { text: "Auth and Connections", link: "https://socioprophet.com/documentation/auth-and-connections/" },
            { text: "Provider Capability Routing", link: "https://socioprophet.com/documentation/provider-capability-routing/" },
            { text: "Provider Safety and Capability Eligibility", link: "https://socioprophet.com/documentation/provider-safety-and-capability-eligibility/" },
            { text: "Auth Recovery and Connection Health", link: "https://socioprophet.com/documentation/auth-recovery-and-connection-health/" },
          ],
        },
        {
          text: "Entity Analytics",
          items: [
            { text: "Entity Analytics Reference", link: "https://socioprophet.com/documentation/entity-analytics-reference/" },
            { text: "Worked Example: Michael Cross-Context", link: "https://socioprophet.com/documentation/worked-example-michael-cross-context/" },
            { text: "Entity Analytics Overview", link: "https://socioprophet.com/documentation/entity-analytics-overview/" },
            { text: "Identity Prime and Event-IR", link: "https://socioprophet.com/documentation/identity-prime-and-event-ir/" },
            { text: "Entity Graph and Safe Linkage", link: "https://socioprophet.com/documentation/entity-graph-and-safe-linkage/" },
            { text: "Policy-Constrained Merging and Unmerge", link: "https://socioprophet.com/documentation/policy-constrained-merging-and-unmerge/" },
            { text: "Marketer-Safe Outputs and Segment Proofs", link: "https://socioprophet.com/documentation/marketer-safe-outputs-and-segment-proofs/" },
          ],
        },
        {
          text: "Academy and Learning",
          items: [
            { text: "Academy Policy Index", link: "https://socioprophet.com/documentation/academy-policy-index/" },
            { text: "Academy Safeguarding and Minor Protection", link: "https://socioprophet.com/documentation/academy-safeguarding-and-minor-protection/" },
            { text: "Academy Interaction Contract", link: "https://socioprophet.com/documentation/academy-interaction-contract/" },
            { text: "Academy Guardian Rights, Sensitive Reports, and Escalation", link: "https://socioprophet.com/documentation/academy-guardian-rights-sensitive-reports-and-escalation/" },
            { text: "Operating Modes: Learning and Defense", link: "https://socioprophet.com/documentation/operating-modes-learning-and-defense/" },
            { text: "23-Topic Canon", link: "https://socioprophet.com/documentation/twenty-three-topic-canon/" },
          ],
        },
        {
          text: "Models and Theory",
          items: [
            { text: "Governed Cybernetic Stack", link: "https://socioprophet.com/documentation/governed-cybernetic-stack/" },
            { text: "Semantic Vector Stack", link: "https://socioprophet.com/documentation/semantic-vector-stack/" },
            { text: "Semantic Representation Ladder", link: "https://socioprophet.com/documentation/semantic-representation-ladder/" },
            { text: "LSA / LSI / LDA Geometry", link: "https://socioprophet.com/documentation/lsa-lsi-lda-geometry/" },
            { text: "Semantic Model Workstreams", link: "https://socioprophet.com/documentation/semantic-model-workstreams/" },
            { text: "Hybrid Representation Builder", link: "https://socioprophet.com/documentation/hybrid-representation-builder/" },
            { text: "Temporal Graph Evolution", link: "https://socioprophet.com/documentation/temporal-graph-evolution/" },
          ],
        },
        {
          text: "Products",
          items: [
            { text: "Products Overview", link: "https://socioprophet.com/documentation/products/overview/" },
            { text: "Product Surface Standard", link: "https://socioprophet.com/documentation/product-surface-standard/" },
            { text: "Product Surface Maturity Matrix", link: "https://socioprophet.com/documentation/product-surface-maturity-matrix/" },
          ],
        },
      ],
    },
  },
});
