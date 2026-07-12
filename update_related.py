"""Bytter ut related-section i eksisterende opprinnelige sider slik at hver side
peker til sine tre neste sirkulære naboer."""
import re
from pathlib import Path
from build_all import related_section

BASE = Path("/home/user/workspace/usminket")

PAGES = ["skatt", "velferd", "arbeidsliv", "klima"]

# Match hele <section class="section section--surface"><div class="wrap"><span class="section-eyebrow">Andre tema</span> ... </section>
RELATED_RE = re.compile(
    r'<section class="section section--surface">\s*<div class="wrap">\s*<span class="section-eyebrow">Andre tema</span>.*?</section>',
    re.DOTALL,
)

for slug in PAGES:
    p = BASE / f"{slug}.html"
    if not p.exists():
        print(f"skip: {slug}")
        continue
    src = p.read_text(encoding="utf-8")
    new_section = related_section(slug).strip()
    src2, n = RELATED_RE.subn(new_section, src, count=1)
    if n == 0:
        print(f"WARN: kunne ikke finne related-section i {slug}.html")
        continue
    p.write_text(src2, encoding="utf-8")
    print(f"{slug}.html: related updated (matched {n})")
