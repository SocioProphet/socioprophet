#!/usr/bin/env python3
from pathlib import Path
import json
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config" / "surfaces.json"
DOC_OUT = ROOT / "docs" / "guide" / "surface-inventory.md"
MARKETING_GRAPH = ROOT / "marketing" / "public" / "assets" / "surface-graph.json"
DOCS_GRAPH = ROOT / "docs" / "public" / "surface-graph.json"

surfaces = json.loads(CONFIG.read_text(encoding="utf-8"))

ids = [s["id"] for s in surfaces]
if len(ids) != len(set(ids)):
    raise SystemExit("Duplicate surface ids found in config/surfaces.json")

def yn(v):
    return "Yes" if v else "No"

def jaccard(a, b):
    A = set(a)
    B = set(b)
    inter = len(A & B)
    uni = len(A | B)
    return inter / uni if uni else 0.0

def vector_feature_set(s):
    vals = []
    vals.extend([f"norm:{x}" for x in s.get("normalized_topics", [])])
    vals.extend([f"topic:{x}" for x in s.get("topic_constituents", [])])
    vals.extend([f"aud:{x}" for x in s.get("audiences", [])])
    vals.extend([f"rel:{x}" for x in s.get("related_surfaces", [])])
    vals.append(f"category:{s.get('category','')}")
    vals.append(f"group:{s.get('graph_group','')}")
    overlay = s.get("investor_overlay", {}) or {}
    if overlay.get("lens"):
        vals.append(f"lens:{overlay['lens']}")
    vals.extend([f"driver:{x}" for x in overlay.get("value_drivers", [])])
    vals.extend([f"proxy:{x}" for x in overlay.get("economic_profit_proxy", [])])
    return [v for v in vals if v]

DOC_OUT.parent.mkdir(parents=True, exist_ok=True)
MARKETING_GRAPH.parent.mkdir(parents=True, exist_ok=True)
DOCS_GRAPH.parent.mkdir(parents=True, exist_ok=True)

lines = []
lines.append("# Surface Inventory")
lines.append("")
lines.append("> This file is generated from `config/surfaces.json`. Edit the JSON source, not this file.")
lines.append("")
lines.append("| Surface | Landing page | Survey / intake | Docs | Status | Next action |")
lines.append("|---|---:|---:|---:|---|---|")
for s in surfaces:
    lines.append(
        f"| {s['label']} | {yn(s.get('landing_page'))} | {yn(s.get('survey_page'))} | {yn(s.get('docs_path'))} | {s['status']} | {s['next_action']} |"
    )
lines.append("")
lines.append("## Details")
lines.append("")
for s in surfaces:
    lines.append(f"### {s['label']}")
    lines.append("")
    lines.append(f"- **Category:** {s['category']}")
    lines.append(f"- **Status:** {s['status']}")
    lines.append(f"- **Homepage visible:** {yn(s.get('homepage_visible'))}")
    lines.append(f"- **Audiences:** {', '.join(s.get('audiences', [])) or 'None'}")
    lines.append(f"- **Topics:** {', '.join(s.get('topic_constituents', [])) or 'None'}")
    lines.append(f"- **Normalized topics:** {', '.join(s.get('normalized_topics', [])) or 'None'}")
    overlay = s.get("investor_overlay", {}) or {}
    if overlay.get("lens"):
        lines.append(f"- **Investor lens:** {overlay.get('lens')}")
    if s.get("landing_page"):
        lines.append(f"- **Landing page:** `{s['landing_page']}`")
    if s.get("survey_page"):
        lines.append(f"- **Survey / intake:** `{s['survey_page']}`")
    if s.get("docs_path"):
        lines.append(f"- **Docs path:** `{s['docs_path']}`")
    lines.append(f"- **Description:** {s['description']}")
    lines.append(f"- **Next action:** {s['next_action']}")
    if s.get("related_surfaces"):
        lines.append(f"- **Related surfaces:** {', '.join(s['related_surfaces'])}")
    if s.get("related_sites"):
        lines.append(f"- **Related sites:** {', '.join(s['related_sites'])}")
    lines.append("")

DOC_OUT.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")

nodes = []
topic_nodes = {}
curated_links = []
constituent_links = []
seen_curated = set()

for s in surfaces:
    nodes.append({
        "id": s["id"],
        "type": "surface",
        "label": s["label"],
        "category": s["category"],
        "status": s["status"],
        "homepage_visible": s.get("homepage_visible", False),
        "graph_group": s.get("graph_group", "other"),
        "map_priority": s.get("map_priority", 999),
        "landing_page": s.get("landing_page"),
        "survey_page": s.get("survey_page"),
        "docs_path": s.get("docs_path"),
        "audiences": s.get("audiences", []),
        "topic_constituents": s.get("topic_constituents", []),
        "normalized_topics": s.get("normalized_topics", []),
        "related_surfaces": s.get("related_surfaces", []),
        "investor_overlay": s.get("investor_overlay", {}),
        "related_sites": s.get("related_sites", []),
        "description": s.get("description", "")
    })

    for topic in s.get("topic_constituents", []):
        tid = f"topic:{topic.lower().replace(' / ', '-').replace(' ', '-')}"
        if tid not in topic_nodes:
            topic_nodes[tid] = {
                "id": tid,
                "type": "topic",
                "label": topic,
                "category": "topic",
                "status": "derived",
                "homepage_visible": False,
                "graph_group": "topic",
                "map_priority": 1000,
                "landing_page": None,
                "survey_page": None,
                "docs_path": None,
                "audiences": [],
                "topic_constituents": [],
                "normalized_topics": [],
                "related_surfaces": [],
                "investor_overlay": {},
                "related_sites": [],
                "description": "Topic constituent derived from configured surfaces."
            }
        constituent_links.append({
            "source": s["id"],
            "target": tid,
            "type": "constituent"
        })

    for rel in s.get("related_surfaces", []):
        pair = tuple(sorted([s["id"], rel]))
        if pair not in seen_curated:
            seen_curated.add(pair)
            curated_links.append({
                "source": pair[0],
                "target": pair[1],
                "type": "curated"
            })

vector_links = []
for i, a in enumerate(surfaces):
    for b in surfaces[i + 1:]:
        score = round(jaccard(vector_feature_set(a), vector_feature_set(b)), 3)
        if score >= 0.12:
            vector_links.append({
                "source": a["id"],
                "target": b["id"],
                "type": "vector_similarity",
                "score": score
            })

graph = {
    "version": 1,
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "ui": {
        "modes": ["topology", "vector", "hybrid"],
        "default_mode": "topology",
        "similarity_threshold": 0.12,
        "supports": {
            "expandTopics": True,
            "collapseTopics": True,
            "showExternalSites": True,
            "showVectorSimilarity": True
        }
    },
    "nodes": sorted(nodes + list(topic_nodes.values()), key=lambda x: (x["type"] != "surface", x["map_priority"], x["label"])),
    "links": {
        "curated": curated_links,
        "constituent": constituent_links,
        "vector": vector_links
    }
}

payload = json.dumps(graph, indent=2) + "\n"
MARKETING_GRAPH.write_text(payload, encoding="utf-8")
DOCS_GRAPH.write_text(payload, encoding="utf-8")

print(f"Wrote {DOC_OUT}")
print(f"Wrote {MARKETING_GRAPH}")
print(f"Wrote {DOCS_GRAPH}")
print(f"Surface nodes: {len([n for n in graph['nodes'] if n['type']=='surface'])}")
print(f"Topic nodes: {len([n for n in graph['nodes'] if n['type']=='topic'])}")
print(f"Curated links: {len(graph['links']['curated'])}")
print(f"Constituent links: {len(graph['links']['constituent'])}")
print(f"Vector links: {len(graph['links']['vector'])}")
