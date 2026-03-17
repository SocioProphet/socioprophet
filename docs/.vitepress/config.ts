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
      { text: "Architecture", link: "/guide/architecture" },
      { text: "Domain Surface", link: "/guide/domain-surface" },
      { text: "Products", link: "/guide/products/overview" },
    ],
    sidebar: {
      "/guide/": [
        { text: "Getting Started", link: "/guide/getting-started" },
        { text: "Architecture", link: "/guide/architecture" },
        { text: "Governed Cybernetic Stack", link: "/guide/governed-cybernetic-stack" },
        { text: "Semantic Vector Stack", link: "/guide/semantic-vector-stack" },
        { text: "Semantic Representation Ladder", link: "/guide/semantic-representation-ladder" },
        { text: "LSA / LSI / LDA Geometry", link: "/guide/lsa-lsi-lda-geometry" },
        { text: "Semantic Model Workstreams", link: "/guide/semantic-model-workstreams" },
        { text: "Hybrid Representation Builder", link: "/guide/hybrid-representation-builder" },
        { text: "Temporal Graph Evolution", link: "/guide/temporal-graph-evolution" },
        { text: "Auth and Connections", link: "/guide/auth-and-connections" },
        { text: "Provider Capability Routing", link: "/guide/provider-capability-routing" },
        { text: "Auth Recovery and Connection Health", link: "/guide/auth-recovery-and-connection-health" },
        { text: "Domain Surface", link: "/guide/domain-surface" },
        { text: "Products", link: "/guide/products/overview" },
        { text: "Platform Human Protection and Safeguarding", link: "/guide/platform-human-protection-and-safeguarding" },
        { text: "Guardian Consent and Minor Access Model", link: "/guide/guardian-consent-and-minor-access-model" },
        { text: "Academy Policy Index", link: "/guide/academy-policy-index" },
        { text: "Organizations Governance and Institutional Safety", link: "/guide/organizations-governance-and-institutional-safety" },
        { text: "Digital Trust and Capability Routing", link: "/guide/digital-trust-and-capability-routing" },
        { text: "Provider Safety and Capability Eligibility", link: "/guide/provider-safety-and-capability-eligibility" },
        { text: "Product Surface Standard", link: "/guide/product-surface-standard" },
        { text: "Product Surface Maturity Matrix", link: "/guide/product-surface-maturity-matrix" },
      ],
    },
  },
});
