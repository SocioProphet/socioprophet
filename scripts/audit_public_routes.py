from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from urllib.parse import urljoin, urlparse
from html.parser import HTMLParser
import json, csv, ssl, re

ROOT = "https://socioprophet.com"
REPO = Path(".")
OUT_JSON = REPO / "site_audit" / "public_routes.json"
OUT_CSV = REPO / "site_audit" / "public_routes.csv"
OUT_MD = REPO / "site_audit" / "public_summary.md"

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.title = ""
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag.lower() == "a" and "href" in attrs:
            self.links.append(attrs["href"])
        if tag.lower() == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data

def marketing_url_from_index(path: Path) -> str:
    rel = path.relative_to(REPO / "marketing" / "public")
    if rel.as_posix() == "index.html":
        return ROOT + "/"
    return ROOT + "/" + rel.parent.as_posix().strip("/") + "/"

def docs_url_from_md(path: Path) -> str:
    rel = path.relative_to(REPO / "docs" / "guide").with_suffix("")
    return ROOT + "/documentation/" + rel.as_posix().strip("/") + "/"

targets = []

for p in sorted((REPO / "marketing" / "public").rglob("index.html")):
    targets.append({
        "source_kind": "marketing",
        "source_path": str(p.relative_to(REPO)),
        "url": marketing_url_from_index(p),
    })

targets.append({
    "source_kind": "docs-entry",
    "source_path": "docs/index.md",
    "url": ROOT + "/documentation/",
})

for p in sorted((REPO / "docs" / "guide").rglob("*.md")):
    targets.append({
        "source_kind": "docs-guide",
        "source_path": str(p.relative_to(REPO)),
        "url": docs_url_from_md(p),
    })

# dedupe by url
dedup = {}
for t in targets:
    dedup[t["url"]] = t
targets = list(dedup.values())

ctx = ssl.create_default_context()
rows = []

for t in targets:
    url = t["url"]
    row = {
        "source_kind": t["source_kind"],
        "source_path": t["source_path"],
        "url": url,
        "ok": False,
        "status": "",
        "final_url": "",
        "title": "",
        "link_count": 0,
        "webapp_link_count": 0,
        "firebase_link_count": 0,
        "contains_webapp_text": False,
        "contains_firebase_text": False,
        "notes": "",
    }
    try:
        req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(req, timeout=20, context=ctx) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            final_url = resp.geturl()
            parser = LinkParser()
            parser.feed(html)

            webapp_links = [x for x in parser.links if "web.app" in x]
            firebase_links = [x for x in parser.links if "firebase" in x]
            row.update({
                "ok": True,
                "status": getattr(resp, "status", 200),
                "final_url": final_url,
                "title": parser.title.strip(),
                "link_count": len(parser.links),
                "webapp_link_count": len(webapp_links),
                "firebase_link_count": len(firebase_links),
                "contains_webapp_text": ("web.app" in html),
                "contains_firebase_text": ("firebase" in html.lower()),
            })

            notes = []
            final_host = urlparse(final_url).netloc
            if final_host and final_host != "socioprophet.com":
                notes.append(f"final_host={final_host}")
            if row["webapp_link_count"]:
                notes.append("page_contains_webapp_links")
            if row["contains_webapp_text"]:
                notes.append("html_contains_webapp_text")
            if "http-equiv=\"refresh\"" in html.lower() and "web.app" in html:
                notes.append("meta_refresh_to_webapp")
            row["notes"] = ";".join(notes)
    except HTTPError as e:
        row["status"] = e.code
        row["notes"] = f"http_error={e.code}"
    except URLError as e:
        row["notes"] = f"url_error={e.reason}"
    except Exception as e:
        row["notes"] = f"error={type(e).__name__}:{e}"

    rows.append(row)

OUT_JSON.write_text(json.dumps(rows, indent=2) + "\n")

with OUT_CSV.open("w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)

total = len(rows)
ok = sum(1 for r in rows if r["ok"])
non_custom_final = [r for r in rows if r["ok"] and r["final_url"] and urlparse(r["final_url"]).netloc != "socioprophet.com"]
webapp_pages = [r for r in rows if r["webapp_link_count"] or r["contains_webapp_text"]]
broken = [r for r in rows if not r["ok"]]

summary = []
summary.append(f"# Public route audit\n")
summary.append(f"- total_routes: {total}")
summary.append(f"- ok_routes: {ok}")
summary.append(f"- broken_routes: {len(broken)}")
summary.append(f"- routes_with_non_custom_final_host: {len(non_custom_final)}")
summary.append(f"- routes_with_webapp_or_firebase_text_or_links: {len(webapp_pages)}\n")

summary.append("## Routes with non-custom final host")
for r in non_custom_final[:100]:
    summary.append(f"- {r['url']} -> {r['final_url']} ({r['notes']})")

summary.append("\n## Routes containing web.app / firebase references")
for r in webapp_pages[:200]:
    summary.append(f"- {r['url']} :: webapp_links={r['webapp_link_count']} :: notes={r['notes']}")

summary.append("\n## Broken routes")
for r in broken[:200]:
    summary.append(f"- {r['url']} :: {r['notes']}")

OUT_MD.write_text("\n".join(summary) + "\n")

print(f'wrote: {OUT_JSON}')
print(f'wrote: {OUT_CSV}')
print(f'wrote: {OUT_MD}')
print(f'total_routes={total}')
print(f'ok_routes={ok}')
print(f'broken_routes={len(broken)}')
print(f'non_custom_final_host={len(non_custom_final)}')
print(f'webapp_or_firebase_pages={len(webapp_pages)}')
