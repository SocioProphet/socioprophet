import { defineConfig } from "vitepress";

const repo = (process.env.GITHUB_REPOSITORY || "socioprophet").split("/").pop() || "socioprophet";
const base = process.env.DOCS_BASE || "/" + repo + "/";

export default defineConfig({
  head: [["link", { rel: "icon", href: "/icon.png" }]],
  title: "SocioProphet",
  description: "SocioProphet documentation",
  base,
  cleanUrls: true,
  themeConfig: {
    logo: { light: "/icon.png", dark: "/icon.png" },
    nav: [
      { text: "Docs", link: "/" },
      { text: "Getting Started", link: "/guide/getting-started" },
      { text: "Architecture", link: "/guide/architecture" },
      { text: "Domain Surface", link: "/guide/domain-surface" },
        { text: "Products", link: "/guide/products/overview" },
      { text: "Products", link: "/guide/products/overview" }
    ],
    sidebar: {
      "/guide/": [
        { text: "Getting Started", link: "/guide/getting-started" },
        { text: "Architecture", link: "/guide/architecture" }
      ]
    }
  }
});
