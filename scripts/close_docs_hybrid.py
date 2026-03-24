from pathlib import Path
from shutil import copy2, copytree, rmtree
import re

repo = Path(".")
dist = repo / "docs/.vitepress/dist"
if not dist.exists():
    raise SystemExit("FAILED: docs/.vitepress/dist is missing. Build docs first with DOCS_BASE=/documentation/.")

def reset_dir(path: Path) -> None:
    if path.exists():
        rmtree(path)
    path.mkdir(parents=True, exist_ok=True)

def copy_contents(src: Path, dst: Path) -> None:
    for item in src.iterdir():
        target = dst / item.name
        if item.is_dir():
            copytree(item, target)
        else:
            copy2(item, target)

def to_docs_path(path: str, anchor: str = "") -> str:
    p = path.strip().lstrip("/")
    if p.startswith("guide/"):
        p = p[len("guide/"):]
    p = p.rstrip("/")
    return f"/documentation/{p}/" + (anchor or "")

# 1) Publish real docs into the marketing site under /documentation/*
marketing_docs = repo / "marketing/public/documentation"
reset_dir(marketing_docs)
copy_contents(dist, marketing_docs)
print(f"published same-domain docs: {marketing_docs}")

# 2) Build a preview host payload so web.app can also serve /documentation/*
publish_root = repo / "docs/.vitepress/publish"
reset_dir(publish_root)
preview_docs = publish_root / "documentation"
preview_docs.mkdir(parents=True, exist_ok=True)
copy_contents(dist, preview_docs)
(publish_root / "index.html").write_text("""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=/documentation/">
    <title>Redirecting — SocioProphet Docs</title>
  </head>
  <body>
    <p><a href="/documentation/">Continue to documentation</a></p>
  </body>
</html>
""")
print(f"published preview docs: {publish_root}")

# 3) Point the docs Firebase target at the preview publish root
firebase_json = repo / "firebase.json"
fj = firebase_json.read_text()
old = '"public": "docs/.vitepress/dist"'
new = '"public": "docs/.vitepress/publish"'
if old in fj:
    fj = fj.replace(old, new, 1)
    firebase_json.write_text(fj)
    print(f"updated: {firebase_json}")

# 4) Rewrite marketing/docs payload links to real same-domain docs routes
targets = []
targets.extend((repo / "marketing/public").rglob("*.html"))
targets.extend((repo / "marketing/public/assets").glob("*.json"))
targets.extend((repo / "docs/public").glob("*.json"))

for p in targets:
    if str(p).startswith(str(marketing_docs)):
        continue

    text = p.read_text()
    original = text

    # retire dated public graph asset reference
    text = text.replace("/assets/surface-graph.20260323.json", "/assets/surface-graph.json")

    # map page JS that still prepends the old web.app docs host
    text = text.replace("`https://socioprophet-web.web.app${node.docs_path}`", "`${node.docs_path}`")
    text = text.replace("'https://socioprophet-web.web.app' + node.docs_path", "node.docs_path")

    # direct web.app guide links -> same-domain /documentation/*
    text = re.sub(
        r'https://socioprophet-web\.web\.app/guide/([^"#\s<]+?)/?(#[^"\s<]*)?',
        lambda m: to_docs_path(m.group(1), m.group(2) or ""),
        text,
    )

    # custom-domain absolute docs links -> root-relative same-domain docs paths
    text = re.sub(
        r'https://socioprophet\.com/documentation/([^"#\s<]+?)/?(#[^"\s<]*)?',
        lambda m: to_docs_path(m.group(1), m.group(2) or ""),
        text,
    )

    # stale /guide/* root-relative paths -> /documentation/*
    text = re.sub(
        r'"/guide/([^"]+)"',
        lambda m: f'"{to_docs_path(m.group(1))}"',
        text,
    )

    # graph payload docs_path values
    text = re.sub(
        r'"docs_path":\s*"/guide/([^"]+)"',
        lambda m: f'"docs_path": "{to_docs_path(m.group(1)).rstrip("/")}/"',
        text,
    )

    if text != original:
        p.write_text(text)
        print(f"updated links: {p}")

# 5) remove dated public graph artifacts
for stale in [
    repo / "marketing/public/assets/surface-graph.20260323.json",
    repo / "docs/public/surface-graph.20260323.json",
]:
    if stale.exists():
        stale.unlink()
        print(f"removed stale public asset: {stale}")
