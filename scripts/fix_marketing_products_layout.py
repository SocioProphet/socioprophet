#!/usr/bin/env python3
import re
from pathlib import Path

p = Path("marketing/public/index.html")
s = p.read_text("utf-8")

def find_section_containing_any(needles):
    """Return the first <section>...</section> containing any needle."""
    for needle in needles:
        m = re.search(r"(<section\b[^>]*>.*?" + re.escape(needle) + r".*?</section>)", s, flags=re.S)
        if m:
            return m.group(1)
    return None

# Heuristic needles (we accept multiple variants so edits don’t break it)
products_needles = [
    "Products by domain",
    "Each surface has a purpose, privilege boundary, and routing policy",
]
more_needles = [
    "More surfaces",
    "Mission, knowledge, and trust surfaces",
]
dup_needles = [
    "Product surfaces are organized by domain suffix",
]

products = find_section_containing_any(products_needles)
more = find_section_containing_any(more_needles)
dup = find_section_containing_any(dup_needles)

if products is None:
    raise SystemExit("ERROR: could not locate the Products section (no known needles found)")
if more is None:
    raise SystemExit("ERROR: could not locate the More surfaces section (no known needles found)")

# Remove redundant verbose Products section if present
if dup:
    s2 = s.replace(dup, "", 1)
else:
    s2 = s

# Rename Products header to 'Products' and force the subtitle sentence
prod_new = products
prod_new = re.sub(r'(<h2[^>]*>)(.*?)(</h2>)', r'\1Products\3', prod_new, count=1, flags=re.S)

prod_new = re.sub(
    r'(<h2[^>]*>\s*Products\s*</h2>\s*)(<p[^>]*>.*?</p>)',
    r'\1<p class="mt-2 text-slate-600">Each surface has a purpose, privilege boundary, and routing policy.</p>',
    prod_new,
    count=1,
    flags=re.S,
)

# Ensure ordering: Products section first, then More surfaces section.
# Remove both instances, then reinsert in correct order at the original products location.
s2 = s2.replace(products, "__SP_PRODUCTS__", 1).replace(more, "__SP_MORE__", 1)
s2 = s2.replace("__SP_PRODUCTS__", prod_new + "\n" + more, 1)
s2 = s2.replace("__SP_MORE__", "", 1)

p.write_text(s2, encoding="utf-8")
print("OK: Products merged (kept cards), redundant removed, More surfaces moved below.")
