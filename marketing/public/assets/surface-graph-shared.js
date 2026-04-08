
(function () {
  function colorFor(category) {
    switch (category) {
      case "deployment": return "#1d4ed8";
      case "technical": return "#7c3aed";
      case "trust":
      case "governance": return "#0f766e";
      case "learning": return "#2563eb";
      case "docs": return "#0f172a";
      default: return "#64748b";
    }
  }

  window.SocioProphetRenderSurfaceGraph = function renderSurfaceGraph(opts) {
    if (typeof d3 === "undefined") return;
    const el = document.getElementById(opts.elId);
    if (!el) return;

    const width = opts.width || 760;
    const height = opts.height || 420;
    const svg = d3.select(el);
    svg.selectAll("*").remove();

    const nodes = (opts.nodes || []).map(d => ({
      ...d,
      r: d.featured ? 30 : 21,
      x: d.x0,
      y: d.y0
    }));
    const links = (opts.links || []).map(d => ({ ...d }));

    const defs = svg.append("defs");
    const glow = defs.append("filter").attr("id", opts.glowId || "spNodeGlow");
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
      .attr("stroke-width", d => d.primary ? 2.5 : 1.4);

    const node = root.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (_, d) => { if (d.href) window.location.href = d.href; });

    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => colorFor(d.category))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", d => d.featured ? 4 : 3)
      .attr("filter", `url(#${opts.glowId || "spNodeGlow"})`);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.featured ? 5 : 4)
      .attr("font-family", "Inter, sans-serif")
      .attr("font-size", d => d.featured ? 15 : 12)
      .attr("font-weight", 700)
      .attr("fill", "#ffffff")
      .text(d => d.label);

    const note = root.append("g")
      .selectAll("text.note")
      .data(nodes)
      .join("text")
      .attr("class", "note")
      .attr("text-anchor", "middle")
      .attr("font-family", "Inter, sans-serif")
      .attr("font-size", 11)
      .attr("fill", "#475569")
      .text(d => d.note || "");

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(d => d.primary ? 128 : 92).strength(d => d.primary ? 1 : 0.55))
      .force("charge", d3.forceManyBody().strength(d => d.featured ? -1550 : -900))
      .force("x", d3.forceX(d => d.x0).strength(0.24))
      .force("y", d3.forceY(d => d.y0).strength(0.24))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.r + 24));

    function ticked() {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);

      note
        .attr("x", d => d.x)
        .attr("y", d => d.y + d.r + 18);
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

    node.call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));
    simulation.on("tick", ticked);
    ticked();
  };
})();
