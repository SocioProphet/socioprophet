#!/usr/bin/env python3
import re
from pathlib import Path

p = Path("marketing/public/index.html")
s = p.read_text("utf-8")

def section_containing(text: str) -> str | None:
    m = re.search(r"(<section\b[^>]*>.*?" + re.escape(text) + r".*?</section>)", s, flags=re.S)
    return m.group(1) if m else None

# Stable anchors (less brittle than headings)
products = section_containing("Each surface has a purpose, privilege boundary, and routing policy.")
more = section_containing("Mission, knowledge, and trust surfaces—without clutter.")
redundant = section_containing("Product surfaces are organized by domain suffix.")

if products is None:
    raise SystemExit("ERROR: could not find primary products section (anchor sentence missing)")
if more is None:
    raise SystemExit("ERROR: could not find More surfaces section (anchor sentence missing)")

# Remove redundant verbose Products section if present
if redundant:
    s2 = s.replace(redundant, "", 1)
else:
    s2 = s

# Rename Products header and set subtitle
prod_new = products
prod_new = prod_new.replace("Products by domain", "Products", 1)
prod_new = re.sub(
    r'(<h2[^>]*>\s*Products\s*</h2>\s*)(<p[^>]*>.*?</p>)',
    r'\1<p class="mt-2 text-slate-600">Each surface has a purpose, privilege boundary, and routing policy.</p>',
    prod_new,
    count=1,
    flags=re.S,
)

# Reorder: Products then More
s2 = s2.replace(products, "__SP_PRODUCTS__", 1).replace(more, "__SP_MORE__", 1)
s2 = s2.replace("__SP_PRODUCTS__", prod_new + "\n" + more, 1)
s2 = s2.replace("__SP_MORE__", "", 1)

p.write_text(s2, encoding="utf-8")
print("OK: Products merged, redundant removed, More surfaces moved to bottom")
