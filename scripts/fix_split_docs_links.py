from pathlib import Path
import re

repo = Path(".")
targets = []
targets.extend((repo / "marketing/public").rglob("*.html"))
targets.extend((repo / "marketing/public/assets").glob("*.json"))
targets.extend((repo / "docs/public").glob("*.json"))
targets.extend((repo / "docs").rglob("*.md"))
targets.append(repo / "docs/.vitepress/config.ts")

# merge malformed /documentation/x/... links into /documentation/x...
# examples:
# /documentation/o/rganizations-governance... -> /documentation/organizations-governance...
# /documentation/p/roducts/ai/ -> /documentation/products/ai/
pat = re.compile(r'(/documentation/)([a-z])(/)([a-z0-9][^"\'\s<)]*)', re.I)

updated = 0
for p in targets:
    if not p.exists():
        continue
    text = p.read_text()
    original = text
    text = pat.sub(lambda m: f"{m.group(1)}{m.group(2)}{m.group(4)}", text)
    if text != original:
        p.write_text(text)
        print(f"updated: {p}")
        updated += 1

print(f"files_updated={updated}")
