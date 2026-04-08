from pathlib import Path
import re

repo = Path(".")
home = repo / "marketing/public/index.html"
target = repo / "marketing/public/map/index.html"

home_html = home.read_text(encoding="utf-8")
map_html = target.read_text(encoding="utf-8")

header_m = re.search(r'(<header[\s\S]*?</header>)', home_html)
footer_ms = list(re.finditer(r'(<footer[\s\S]*?</footer>)', home_html))

if not header_m:
    raise SystemExit("Could not extract homepage header")
if not footer_ms:
    raise SystemExit("Could not extract homepage footer")

header = header_m.group(1)
footer = footer_ms[-1].group(1)

if re.search(r'<header[\s\S]*?</header>', map_html):
    map_html = re.sub(r'<header[\s\S]*?</header>', header, map_html, count=1)
else:
    map_html = re.sub(r'(<body[^>]*>)', r'\1\n' + header, map_html, count=1)

if re.search(r'<footer[\s\S]*?</footer>', map_html):
    map_html = re.sub(r'<footer[\s\S]*?</footer>', footer, map_html, count=1)
else:
    map_html = re.sub(r'(</body>)', footer + r'\n\1', map_html, count=1)

target.write_text(map_html, encoding="utf-8")
print(f"synced site frame into {target.as_posix()}")
