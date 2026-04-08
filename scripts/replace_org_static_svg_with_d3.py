from pathlib import Path
import re

org = Path("marketing/public/organizations/index.html")
text = org.read_text()

if 'src="https://cdn.jsdelivr.net/npm/d3@7"' not in text:
    text = text.replace(
        '<script src="https://cdn.tailwindcss.com"></script>',
        '<script src="https://cdn.tailwindcss.com"></script>\n    <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>',
        1,
    )

aside_html = """
<aside class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-xl font-semibold tracking-tight text-slate-950">Institutional Surface Graph</h2>
                <p class="mt-2 text-sm text-slate-600">
                  Organizations is the umbrella Surface linking Governance, Deterministic AI, the Agent Plane, Entity Analytics, and Authorized Cyberdefense into one institutional path.
                </p>
              </div>
              <a class="text-sm font-medium text-slate-700 hover:text-slate-950" href="/map/?mode=hybrid" target="_blank" rel="noopener">
                Open Map ↗
              </a>
            </div>

            <div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <svg id="orgGraph" viewBox="0 0 760 420" class="h-auto w-full" role="img" aria-label="Institutional Surface Graph"></svg>
            </div>

            <div class="mt-4 flex flex-wrap gap-2 text-sm">
              <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/organizations-governance-and-institutional-safety/">Institutional Governance</a>
              <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/deterministic-ai-and-mathematical-safety/">Deterministic AI</a>
              <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/agent-plane-and-operator-workflows/">Agent Plane</a>
              <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/organizations/apply/">Open Intake</a>
            </div>
          </aside>
""".strip()

text, n = re.subn(
    r'<aside class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">.*?</aside>',
    aside_html,
    text,
    flags=re.S,
    count=1,
)
if n != 1:
    raise SystemExit("FAILED: could not replace Organizations aside block")

text = re.sub(
    r'\n\s*<!-- organizations-institutional-graph -->.*?</script>\s*',
    '\n',
    text,
    flags=re.S,
)

graph_script = """
  <!-- organizations-institutional-graph -->
  <script>
    (function () {
      const el = document.getElementById("orgGraph");
      if (!el || typeof d3 === "undefined") return;

      const width = 760;
      const height = 420;
      const svg = d3.select(el);
      svg.selectAll("*").remove();

      const nodes = [
        { id: "organizations", label: "Organizations", note: "Institutional Surface", href: "/organizations/", category: "deployment", x0: 380, y0: 188, featured: true },
        { id: "deterministic-ai", label: "Deterministic AI", note: "bounded execution", href: "/documentation/deterministic-ai-and-mathematical-safety/", category: "governance", x0: 380, y0: 56 },
        { id: "governed-ai", label: "Governed AI", note: "control loops and proofs", href: "/documentation/governed-ai-and-cybernetics/", category: "governance", x0: 164, y0: 120 },
        { id: "agent-plane", label: "Agent Plane", note: "role-bounded workflows", href: "/documentation/agent-plane-and-operator-workflows/", category: "technical", x0: 596, y0: 120 },
        { id: "entity-analytics", label: "Entity Analytics", note: "Event-IR and proof artifacts", href: "/entity-analytics/", category: "technical", x0: 206, y0: 308 },
        { id: "authorized-cyberdefense", label: "Cyberdefense", note: "validation under Governance", href: "/documentation/authorized-cyberdefense-and-simulation/", category: "trust", x0: 554, y0: 308 },
        { id: "institutional-governance", label: "Governance", note: "institutional safety", href: "/documentation/organizations-governance-and-institutional-safety/", category: "trust", x0: 118, y0: 216 },
        { id: "intake", label: "Open Intake", note: "deployment path", href: "/organizations/apply/", category: "deployment", x0: 642, y0: 216 }
      ];

      const links = [
        { source: "organizations", target: "deterministic-ai", primary: true },
        { source: "organizations", target: "governed-ai", primary: true },
        { source: "organizations", target: "agent-plane", primary: true },
        { source: "organizations", target: "entity-analytics", primary: true },
        { source: "organizations", target: "authorized-cyberdefense", primary: true },
        { source: "organizations", target: "institutional-governance", primary: true },
        { source: "organizations", target: "intake", primary: true },
        { source: "deterministic-ai", target: "governed-ai", primary: false },
        { source: "deterministic-ai", target: "agent-plane", primary: false },
        { source: "institutional-governance", target: "authorized-cyberdefense", primary: false },
        { source: "entity-analytics", target: "authorized-cyberdefense", primary: false }
      ];

      const colorFor = (d) => {
        switch (d.category) {
          case "deployment": return "#1d4ed8";
          case "technical": return "#7c3aed";
          case "trust":
          case "governance": return "#0f766e";
          default: return "#475569";
        }
      };

      nodes.forEach((d) => {
        d.r = d.featured ? 30 : 21;
        d.x = d.x0;
        d.y = d.y0;
      });

      const defs = svg.append("defs");
      const glow = defs.append("filter").attr("id", "orgNodeGlow");
      glow.append("feGaussianBlur").attr("stdDeviation", 6).attr("result", "coloredBlur");
      const merge = glow.append("feMerge");
      merge.append("feMergeNode").attr("in", "coloredBlur");
      merge.append("feMergeNode").attr("in", "SourceGraphic");

      const root = svg.append("g");

      const link = root.append("g")
        .attr("fill", "none")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-opacity", 0.95)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", (d) => d.primary ? 2.5 : 1.4);

      const node = root.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("cursor", "pointer")
        .on("click", (_, d) => { window.location.href = d.href; });

      node.append("circle")
        .attr("r", (d) => d.r)
        .attr("fill", (d) => colorFor(d))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", (d) => d.featured ? 4 : 3)
        .attr("filter", "url(#orgNodeGlow)");

      node.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", (d) => d.featured ? 5 : 4)
        .attr("font-family", "Inter, sans-serif")
        .attr("font-size", (d) => d.featured ? 15 : 12)
        .attr("font-weight", 700)
        .attr("fill", "#ffffff")
        .text((d) => d.label);

      const note = root.append("g")
        .selectAll("text.note")
        .data(nodes)
        .join("text")
        .attr("class", "note")
        .attr("text-anchor", "middle")
        .attr("font-family", "Inter, sans-serif")
        .attr("font-size", 11)
        .attr("fill", "#475569")
        .text((d) => d.note);

      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d) => d.id).distance((d) => d.primary ? 130 : 94).strength((d) => d.primary ? 1 : 0.55))
        .force("charge", d3.forceManyBody().strength((d) => d.featured ? -1550 : -900))
        .force("x", d3.forceX((d) => d.x0).strength(0.24))
        .force("y", d3.forceY((d) => d.y0).strength(0.24))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius((d) => d.r + 24));

      function ticked() {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node.attr("transform", (d) => `translate(${d.x},${d.y})`);

        note
          .attr("x", (d) => d.x)
          .attr("y", (d) => d.y + d.r + 18);
      }

      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.18).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      node.call(
        d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

      simulation.on("tick", ticked);
      ticked();
    })();
  </script>
""".rstrip()

text = text.replace("</body>", graph_script + "\n</body>", 1)

org.write_text(text)
print(f"updated: {org}")
