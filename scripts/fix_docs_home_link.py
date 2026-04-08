from pathlib import Path
import re
import sys

roots = [Path(p) for p in sys.argv[1:]] or [
    Path("docs/.vitepress/dist"),
    Path("docs/.vitepress/publish/documentation"),
    Path("marketing/public/documentation"),
]

pat = re.compile(r'(<div class="VPNavBarTitle[^>]*>.*?<a class="title" href=")([^"]+)(")', re.S)

changed = []
for root in roots:
    if not root.exists():
        continue
    for html in root.rglob("*.html"):
        s = html.read_text(encoding="utf-8")
        n, count = pat.subn(r'\1/\3', s, count=1)
        if count and n != s:
            html.write_text(n, encoding="utf-8")
            changed.append(html.as_posix())

print(f"patched {len(changed)} docs html files")
for item in changed[:120]:
    print(item)
if len(changed) > 120:
    print(f"... plus {len(changed) - 120} more")
