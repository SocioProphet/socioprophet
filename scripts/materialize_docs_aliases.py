from pathlib import Path
from shutil import copy2
import re

repo = Path(".")
docs_root = repo / "marketing/public/documentation"
guide_root = docs_root / "guide"

if not docs_root.exists():
    raise SystemExit("FAILED: marketing/public/documentation does not exist.")
if not guide_root.exists():
    raise SystemExit("FAILED: marketing/public/documentation/guide does not exist. Run the docs build + close_docs_hybrid step first.")

count = 0

for html in sorted(guide_root.rglob("*.html")):
    rel = html.relative_to(guide_root).with_suffix("")
    alias_dir = docs_root / rel
    alias_dir.mkdir(parents=True, exist_ok=True)

    text = html.read_text()

    # Normalize obvious guide-prefixed same-domain links inside copied pages.
    text = text.replace('href="/documentation/guide/', 'href="/documentation/')
    text = text.replace('href="https://socioprophet.com/documentation/guide/', 'href="https://socioprophet.com/documentation/')
    text = text.replace('content="/documentation/guide/', 'content="/documentation/')
    text = text.replace('"/documentation/guide/', '"/documentation/')

    # Clean double slashes that may appear after replacement.
    text = re.sub(r'/documentation//+', '/documentation/', text)

    out = alias_dir / "index.html"
    out.write_text(text)
    count += 1

print(f"materialized_alias_pages={count}")
