from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlparse
from urllib.error import HTTPError, URLError
from html.parser import HTMLParser
import json, csv
import re

BASE = "https://socioprophet.com"
SEEDS = [
    "/",
    "/documentation/",
    "/organizations/",
    "/organizations/apply/",
    "/entity-analytics/",
    "/auth/",
    "/auth/connections/",
    "/academy/",
    "/map/",
]

OUT_JSON = Path("site_audit/rendered_link_audit.json")
OUT_CSV = Path("site_audit/rendered_link_audit.csv")
OUT_MD = Path("site_audit/rendered_link_summary.md")
OUT_JSON.parent.mkdir(parents=True, exist_ok=True)

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            d = dict(attrs)
            href = d.get("href")
            if href:
                self.links.append(href)

def fetch(url):
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=20) as r:
        return r.geturl(), r.read().decode("utf-8", errors="replace")

rows = []
seen = set()

for seed in SEEDS:
    url = urljoin(BASE, seed)
    final_url = ""
    html = ""
    notes = []
    status = 200
    try:
        final_url, html = fetch(url + f"?ts=rendered")
        parser = LinkParser()
        parser.feed(html)

        for href in parser.links:
            full = urljoin(final_url, href)
            parsed = urlparse(full)

            if parsed.scheme not in ("http", "https"):
                continue
            if parsed.netloc and parsed.netloc != "socioprophet.com":
                rows.append({
                    "page": url,
                    "href": href,
                    "resolved": full,
                    "kind": "off_domain_link"
                })
                continue

            if "/documentation/" in parsed.path and re.search(r"/documentation/[a-z]/[a-z0-9]", parsed.path):
                rows.append({
                    "page": url,
                    "href": href,
                    "resolved": full,
                    "kind": "split_slug_link"
                })

            if "socioprophet-web.web.app" in href or "firebase" in href.lower():
                rows.append({
                    "page": url,
                    "href": href,
                    "resolved": full,
                    "kind": "webapp_or_firebase_text"
                })

    except HTTPError as e:
        status = e.code
        notes.append(f"http_error={e.code}")
    except URLError as e:
        notes.append(f"url_error={e.reason}")
    except Exception as e:
        notes.append(f"error={type(e).__name__}:{e}")

OUT_JSON.write_text(json.dumps(rows, indent=2) + "\n")
with OUT_CSV.open("w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["page","href","resolved","kind"])
    writer.writeheader()
    writer.writerows(rows)

summary = []
summary.append("# Rendered link audit")
summary.append(f"- findings: {len(rows)}")
summary.append("")
for row in rows[:300]:
    summary.append(f"- {row['kind']} :: {row['page']} :: {row['href']} :: {row['resolved']}")
OUT_MD.write_text("\n".join(summary) + "\n")

print(f"wrote: {OUT_JSON}")
print(f"wrote: {OUT_CSV}")
print(f"wrote: {OUT_MD}")
print(f"findings={len(rows)}")
