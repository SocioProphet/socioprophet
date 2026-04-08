#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import json
import re

ROOT = Path(__file__).resolve().parent.parent
OUTDIR = ROOT / "artifacts" / "semantic"
OUTDIR.mkdir(parents=True, exist_ok=True)

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        if data and data.strip():
            self.parts.append(data.strip())

    def text(self) -> str:
        return " ".join(self.parts)

def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

def markdown_to_text(md: str) -> str:
    md = re.sub(r"```.*?```", " ", md, flags=re.S)
    md = re.sub(r"`([^`]+)`", r"\1", md)
    md = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", md)
    md = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", md)
    md = re.sub(r"^#{1,6}\s*", "", md, flags=re.M)
    md = re.sub(r"^[-*+]\s+", "", md, flags=re.M)
    md = md.replace("**", "").replace("__", "").replace("*", "").replace("_", "")
    return normalize(md)

def html_to_text(html: str) -> str:
    parser = TextExtractor()
    parser.feed(html)
    return normalize(parser.text())

def flatten(value):
    if value is None:
        return []
    if isinstance(value, list):
        out = []
        for item in value:
            out.extend(flatten(item))
        return out
    if isinstance(value, dict):
        out = []
        for item in value.values():
            out.extend(flatten(item))
        return out
    return [str(value)]

records = []

surfaces_path = ROOT / "config" / "surfaces.json"
data = json.loads(surfaces_path.read_text())

if isinstance(data, list):
    surfaces = data
elif isinstance(data, dict) and "surfaces" in data and isinstance(data["surfaces"], list):
    surfaces = data["surfaces"]
elif isinstance(data, dict) and all(isinstance(v, dict) for v in data.values()):
    surfaces = list(data.values())
else:
    raise SystemExit("unsupported config/surfaces.json shape")

for idx, surface in enumerate(surfaces):
    text_bits = []
    for key in ["id", "label", "category", "status", "description", "landing_page", "survey_page", "docs_path", "next_action"]:
        if key in surface and surface[key]:
            text_bits.append(str(surface[key]))
    for key in ["audiences", "topic_constituents", "normalized_topics", "related_surfaces", "related_sites", "graph_group", "investor_overlay"]:
        text_bits.extend(flatten(surface.get(key)))
    records.append({
        "id": f"surface:{surface.get('id', idx)}",
        "kind": "surface",
        "source_path": "config/surfaces.json",
        "title": surface.get("label") or surface.get("id") or f"surface-{idx}",
        "text": normalize(" ".join(text_bits)),
        "temporal_rank": surface.get("map_priority", idx),
        "category": surface.get("category"),
    })

for path in sorted((ROOT / "docs" / "guide").glob("*.md")):
    md = path.read_text()
    title = next((line.lstrip("# ").strip() for line in md.splitlines() if line.startswith("# ")), path.stem)
    records.append({
        "id": f"doc:{path.relative_to(ROOT).as_posix()}",
        "kind": "doc",
        "source_path": path.relative_to(ROOT).as_posix(),
        "title": title,
        "text": markdown_to_text(md),
        "temporal_rank": None,
        "category": "docs",
    })

for path in sorted((ROOT / "marketing" / "public").rglob("*.html")):
    html = path.read_text()
    title_match = re.search(r"<title>(.*?)</title>", html, flags=re.S | re.I)
    title = normalize(title_match.group(1)) if title_match else path.stem
    records.append({
        "id": f"page:{path.relative_to(ROOT).as_posix()}",
        "kind": "page",
        "source_path": path.relative_to(ROOT).as_posix(),
        "title": title,
        "text": html_to_text(html),
        "temporal_rank": None,
        "category": "marketing",
    })

jsonl_path = OUTDIR / "corpus.jsonl"
with jsonl_path.open("w") as f:
    for rec in records:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")

counts = Counter(rec["kind"] for rec in records)
manifest = {
    "record_count": len(records),
    "counts_by_kind": dict(counts),
    "nonempty_text_records": sum(1 for rec in records if rec["text"]),
    "approx_total_tokens": sum(len(rec["text"].split()) for rec in records),
    "output": str(jsonl_path.relative_to(ROOT)),
}
(OUTDIR / "corpus_manifest.json").write_text(json.dumps(manifest, indent=2))

print(f"wrote {jsonl_path.relative_to(ROOT)}")
print(json.dumps(manifest, indent=2))
