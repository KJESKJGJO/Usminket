"""Bytter ut header + footer på alle eksisterende sider slik at de matcher det nye layoutet."""
import re
from pathlib import Path
from build_all import header_html, footer_html

BASE = Path("/home/user/workspace/usminket")

PAGES = {
    "index.html":       "index",
    "skatt.html":       "skatt",
    "velferd.html":     "velferd",
    "arbeidsliv.html":  "arbeidsliv",
    "klima.html":       "klima",
    "om.html":          "om",
    # (nye sider bruker allerede riktige header/footer)
    "innvandring.html": "innvandring",
    "justis.html":      "justis",
    "distrikt.html":    "distrikt",
    "samferdsel.html":  "samferdsel",
}

HEADER_RE = re.compile(r'<header class="site-header">.*?</header>', re.DOTALL)
FOOTER_RE = re.compile(r'<footer class="site-footer">.*?</footer>\s*(?:<script[^>]*></script>)?\s*</body>\s*</html>', re.DOTALL)

for page, active in PAGES.items():
    p = BASE / page
    if not p.exists():
        print(f"skip: {page}")
        continue
    src = p.read_text(encoding="utf-8")
    src, n_h = HEADER_RE.subn(header_html(active), src, count=1)
    src, n_f = FOOTER_RE.subn(footer_html(), src, count=1)
    p.write_text(src, encoding="utf-8")
    print(f"{page}: header={n_h}  footer={n_f}")
