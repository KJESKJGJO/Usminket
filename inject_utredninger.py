#!/usr/bin/env python3
"""
Injiserer «Sentrale utredninger og høringer»-boksen på alle 8 temasider.
Boksen settes rett før eksisterende «Siste saker om …»-section.
Idempotent — kjør flere ganger uten problem.
"""
import re
import json
import subprocess
from pathlib import Path

ROOT = Path("/home/user/workspace/usminket")

# Les data fra utredninger.js. Bruker Node til å eksportere JSON.
result = subprocess.run(
    ["node", "-e", f"console.log(JSON.stringify(require('{ROOT}/data/utredninger.js')))"],
    capture_output=True, text=True, check=True
)
UTREDNINGER = json.loads(result.stdout.strip())

# Marker som identifiserer vår boks slik at re-injisering blir idempotent
MARKER_START = "<!-- utredninger-start -->"
MARKER_END = "<!-- utredninger-end -->"


def build_box(tema_slug: str, data: dict) -> str:
    """Bygger HTML for utredninger-boksen for gitt tema."""
    items_html = []
    for it in data["items"]:
        items_html.append(f'''      <article class="utredning-item">
        <div class="utredning-item__meta">
          <span class="utredning-item__type">{it["type"]}</span>
          <span class="utredning-item__aar">{it["aar"]}</span>
        </div>
        <h3 class="utredning-item__title">
          <a href="{it["url"]}" target="_blank" rel="noopener">{it["tittel"]}</a>
        </h3>
        <div class="utredning-item__subtitle">{it["undertittel"]}</div>
        <p class="utredning-item__desc">{it["beskrivelse"]}</p>
      </article>''')

    items_joined = "\n".join(items_html)

    return f'''{MARKER_START}
<section class="section section--surface">
  <div class="wrap">
    <span class="section-eyebrow">Faglig grunnlag</span>
    <h2 class="section-title" style="margin-bottom: var(--space-6)">Sentrale utredninger og <em>høringer</em></h2>
    <p class="lede" style="max-width: 68ch; margin-bottom: var(--space-10); color: var(--muted);">
      {data["intro"]}
    </p>
    <div class="utredning-grid">
{items_joined}
    </div>
    <p class="utredning-note">
      NOU-er (Norges offentlige utredninger) er ekspertutredninger som legger det faglige grunnlaget for norsk politikk. Alle lenker fører til <a href="https://www.regjeringen.no" target="_blank" rel="noopener">regjeringen.no</a>.
    </p>
  </div>
</section>
{MARKER_END}'''


def inject(html_path: Path, tema_slug: str) -> bool:
    """Injiser eller oppdater boksen. Returnerer True hvis endret."""
    content = html_path.read_text(encoding="utf-8")
    data = UTREDNINGER.get(tema_slug)
    if not data:
        print(f"  ↷ {html_path.name}: ingen data for tema '{tema_slug}'")
        return False

    new_box = build_box(tema_slug, data)

    # Hvis markør finnes: erstatt eksisterende boks
    if MARKER_START in content:
        pattern = re.compile(
            re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END),
            re.DOTALL
        )
        new_content = pattern.sub(new_box, content)
        if new_content != content:
            html_path.write_text(new_content, encoding="utf-8")
            print(f"  ✓ {html_path.name}: oppdatert eksisterende boks")
            return True
        print(f"  = {html_path.name}: ingen endring")
        return False

    # Ellers: sett inn før «Siste saker om»-section
    marker = re.search(
        r'(<section class="section section--surface">\s*<div class="wrap">\s*<span class="section-eyebrow">Ferskt fra regjeringen\.no</span>)',
        content
    )
    if not marker:
        print(f"  ✗ {html_path.name}: fant ikke ankerpunkt for «Siste saker om»")
        return False

    insert_pos = marker.start()
    new_content = content[:insert_pos] + new_box + "\n\n" + content[insert_pos:]
    html_path.write_text(new_content, encoding="utf-8")
    print(f"  ✓ {html_path.name}: satt inn ny boks")
    return True


def main():
    temaer = {
        "skatt.html": "skatt",
        "velferd.html": "velferd",
        "arbeidsliv.html": "arbeidsliv",
        "klima.html": "klima",
        "innvandring.html": "innvandring",
        "justis.html": "justis",
        "distrikt.html": "distrikt",
        "samferdsel.html": "samferdsel",
    }
    endret = 0
    for filnavn, slug in temaer.items():
        p = ROOT / filnavn
        if not p.exists():
            print(f"  ✗ mangler: {filnavn}")
            continue
        if inject(p, slug):
            endret += 1
    print(f"\n{endret}/{len(temaer)} temasider oppdatert.")


if __name__ == "__main__":
    main()
