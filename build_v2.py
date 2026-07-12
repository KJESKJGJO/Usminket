"""Utvidelse v2:
- Legger tema-nyhetsseksjon på hver temaside
- Bygger /budsjett.html (Ap regjering vs Frp alternativt 2026)
- Bygger /folk-flest.html (hvorfor Frp ikke er for folk flest)
- Oppdaterer nav med lenker til de to nye sidene (mobil), og tema-grid på index
"""
import re
from pathlib import Path

BASE = Path("/home/user/workspace/usminket")

# ---------- FELLES BYGGEBLOKKER ----------

BRAND_SVG = """<svg class="brand__mark" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="22" r="14" fill="#C7302B"/>
        <path d="M17 7c1 3 5 4 6 1" stroke="#00843A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <text x="20" y="27" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="13" font-weight="700" font-style="italic" fill="#fff">Frp</text>
      </svg>"""

FOOTER_BRAND_SVG = BRAND_SVG.replace("brand__mark", "footer__brand__mark")

THEMES = [
    ("skatt",       "01", "Skatt"),
    ("velferd",     "02", "Velferd"),
    ("arbeidsliv",  "03", "Arbeidsliv"),
    ("klima",       "04", "Klima"),
    ("innvandring", "05", "Innvandring"),
    ("justis",      "06", "Justis"),
    ("distrikt",    "07", "Distrikt"),
    ("samferdsel",  "08", "Samferdsel"),
]

EXTRA_PAGES = [
    ("budsjett",   "09", "Budsjett"),
    ("folk-flest", "10", "Folk flest"),
]

def nav_html(active):
    theme_slugs = {t[0] for t in THEMES}
    extra_slugs = {p[0] for p in EXTRA_PAGES}
    is_theme = active in theme_slugs
    is_extra = active in extra_slugs
    om_cls = ' class="is-active"' if active == "om" else ''
    home_cls = ' class="is-active"' if active == "index" else ''
    tema_cls = ' class="is-active"' if is_theme else ''
    analyse_cls = ' class="is-active"' if is_extra else ''

    mobile_links = []
    for slug, _num, label in THEMES:
        cls = ' class="is-active"' if active == slug else ''
        mobile_links.append(f'      <a href="{slug}.html" data-mobile-only{cls}>{label}</a>')
    for slug, _num, label in EXTRA_PAGES:
        cls = ' class="is-active"' if active == slug else ''
        mobile_links.append(f'      <a href="{slug}.html" data-mobile-only{cls}>{label}</a>')

    return f"""    <nav class="nav" data-nav aria-label="Hovedmeny">
      <a href="index.html"{home_cls}>Forside</a>
      <a href="index.html#tema" data-desktop-only{tema_cls}>Tema</a>
      <a href="budsjett.html" data-desktop-only{analyse_cls}>Analyser</a>
{chr(10).join(mobile_links)}
      <a href="om.html"{om_cls}>Om</a>
    </nav>"""

def header_html(active):
    return f"""<header class="site-header">
  <div class="site-header__inner">
    <a href="index.html" class="brand" aria-label="Usminket politikk — forside">
      {BRAND_SVG}
      <span class="brand__wordmark">Usminket <em>politikk</em></span>
    </a>
    <button class="nav-toggle" data-nav-toggle aria-label="Åpne meny" aria-expanded="false">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
{nav_html(active)}
  </div>
</header>"""

def footer_html():
    col1 = "\n".join(f'        <li><a href="{s}.html">{l}</a></li>' for s, _, l in THEMES[:4])
    col2 = "\n".join(f'        <li><a href="{s}.html">{l}</a></li>' for s, _, l in THEMES[4:])
    col3 = "\n".join(f'        <li><a href="{s}.html">{l}</a></li>' for s, _, l in EXTRA_PAGES)
    return f"""<footer class="site-footer">
  <div class="footer__grid">
    <div class="footer__brand">
      {FOOTER_BRAND_SVG}
      <div class="brand__wordmark">Usminket <em>politikk</em></div>
      <p class="footer__tagline">Kritisk. Saklig. Rettferdig. En redaksjonell vaktbikkje for norsk politisk debatt.</p>
    </div>
    <div class="footer__col">
      <h4>Tema (1–4)</h4>
      <ul>
{col1}
      </ul>
    </div>
    <div class="footer__col">
      <h4>Tema (5–8)</h4>
      <ul>
{col2}
      </ul>
    </div>
    <div class="footer__col">
      <h4>Analyser</h4>
      <ul>
{col3}
        <li><a href="om.html">Om siden</a></li>
      </ul>
    </div>
  </div>
  <div class="footer__legal">
    <p>Uavhengig redaksjonell vaktbikkje. Alle påstander er kildebelagt. Kritikk skal ramme politikk, ikke personer.</p>
    <p class="footer__meta">© Usminket politikk 2026 · Innlandet, Norge</p>
  </div>
</footer>"""

def replace_between(text, start_marker, end_marker, new_content):
    """Replace text between start_marker and end_marker (both inclusive)."""
    start = text.find(start_marker)
    end = text.find(end_marker, start)
    if start == -1 or end == -1:
        return text, False
    end += len(end_marker)
    return text[:start] + new_content + text[end:], True


# ---------- STEG 1: Tema-nyhetsseksjon på hver temaside ----------

def tema_news_section(tema_slug):
    return f"""<section class="section section--surface">
  <div class="wrap">
    <span class="section-eyebrow">Ferskt fra regjeringen.no</span>
    <h2 class="section-title" style="margin-bottom: var(--space-8)">Siste saker om <em>{tema_slug}</em></h2>
    <p class="lede" style="max-width: 65ch; margin-bottom: var(--space-8); color: var(--muted);">
      Automatisk oppdaterte overskrifter fra <a href="https://www.regjeringen.no" target="_blank" rel="noopener" style="color: var(--red);">regjeringen.no</a> som handler om dette temaet. Vi filtrerer på nøkkelord, så listen kan være tom hvis regjeringen ikke har publisert noe på området nylig.
    </p>
    <div class="news" data-news data-tema="{tema_slug}" data-limit="3">
      <div class="news__loading" role="status" aria-live="polite">Henter siste saker …</div>
    </div>
    <div class="news__attribution">
      Kilde: <a href="https://www.regjeringen.no" target="_blank" rel="noopener">regjeringen.no</a> · aggregert via Google Nyheter · oppdateres hver 10. minutt
    </div>
  </div>
</section>

"""

def add_tema_news_to_page(slug):
    """Insert tema-news section just before the 'Andre tema' section."""
    path = BASE / f"{slug}.html"
    html = path.read_text(encoding="utf-8")

    # Avoid double-insertion
    if 'data-tema="' + slug + '"' in html:
        # Already present — ensure it's up to date
        # Strip existing tema news section (identified by data-tema attribute)
        pattern = re.compile(
            r'<section class="section section--surface">\s*<div class="wrap">\s*<span class="section-eyebrow">Ferskt fra regjeringen\.no</span>.*?</section>\s*',
            re.DOTALL,
        )
        html = pattern.sub("", html, count=1)

    # Insert right before "Andre tema" section
    marker_re = re.compile(r'(<section class="section section--surface">\s*<div class="wrap">\s*<span class="section-eyebrow">Andre tema)')
    new_section = tema_news_section(slug)
    new_html, n = marker_re.subn(new_section + r'\1', html, count=1)
    if n == 0:
        raise RuntimeError(f"Could not find 'Andre tema' marker in {slug}.html")
    path.write_text(new_html, encoding="utf-8")
    print(f"  {slug}.html: added tema-news section")


# ---------- STEG 2: /budsjett.html — Ap regjering vs Frp alternativ 2026 ----------

BUDSJETT_ROWS = [
    # (kategori, ap_regjering, frp_alternativ, kilde-note)
    ("Personfradrag",
     "Økes fra 108 550 til 114 540 kr (+6 000)",
     "Økes til 127 850 kr (+19 300 fra 2025)",
     "Prop. 1 S 2025–2026; Frps alt.budsjett 2026"),
    ("Trygdeavgift lønn",
     "Reduseres fra 7,7 % til 7,6 % (–0,1 pp)",
     "Reduserer trinnskatt 2. trinn med 0,5 pp",
     "Bondelaget/Prop 1 S; Frps alt.budsjett"),
    ("Formuesskatt — bunnfradrag",
     "Økes fra 1,76 til 1,9 mill. kr",
     "Økes til 3 mill. kr (6 mill. for ektepar)",
     "Prop 1 S; Frps alt.budsjett"),
    ("Formuesskatt — sats",
     "Uendret (1,0 % / 1,1 % over 20,7 mill.)",
     "Reduseres til 0,8 %; verdsettelse aksjer til 50 %",
     "Prop 1 S; Frps alt.budsjett"),
    ("Foreldrefradrag",
     "Reduseres fra 25 000 til 15 000 kr (1. barn)",
     "Reverserer regjeringens kutt",
     "Bondelaget/Prop 1 S; Frps alt.budsjett"),
    ("Matmoms",
     "15 % (uendret)",
     "Halveres til 7,5 %",
     "Frps alt.budsjett 2026 (–9 mrd. proveny)"),
    ("Veibruksavgift drivstoff",
     "Følger prisvekst",
     "Halveres",
     "Frps alt.budsjett 2026"),
    ("CO₂-avgift",
     "Økes 14 % i 2026, mål 3 400 kr/tonn i 2035",
     "Sier nei til økningen; vil fase ut",
     "Ap budsjettforlik; Frps alt.budsjett"),
    ("Strømstøtte",
     "11,5 mrd. kr (Norgespris + strømstøtte)",
     "2 mrd. kr strømstøtte, mål 50 øre/kWh",
     "Prop 1 S; Frps alt.budsjett"),
    ("Barnehagepris",
     "Maks 1 200 kr/mnd; 700 kr i minst sentrale kommuner; gratis Finnmark/Nord-Troms",
     "Kutt i barnehagesatsinger nevnes ikke direkte, men kutter kontantstøtte og engangsstønad",
     "Ap-forlik; Frps alt.budsjett"),
    ("Kommune — frie inntekter",
     "+8,4 mrd. kr; 5,5 mrd. reelt handlingsrom",
     "+5,8 mrd. kr til kommuneøkonomi (netto anslag)",
     "Ap-forlik; Frps alt.budsjett"),
    ("Distrikt — gjeldsslette",
     "1,2 mrd. kr; 25 000 kr/år i utsatte kommuner",
     "Ingen tilsvarende ordning",
     "Ap-forlik"),
    ("Sykehus",
     "+3,8 mrd. kr drift + 7 mrd. i nye bygg; lån til 5 nye sykehus",
     "+5,1 mrd. til helse/sykehus/eldre; 1,2 mrd. øremerket private tjenester",
     "Ap-forlik; Frps alt.budsjett"),
    ("Eldreomsorg",
     "Sykehustall inkluderer eldre; ingen egen milliardsum",
     "+2 mrd. til eldreomsorg i kommunene; 440 mill. til 2 000 nye heldøgnsplasser",
     "Ap-forlik; Frps alt.budsjett"),
    ("Politi, justis, beredskap",
     "Økt grunnfinansiering; hurtigspor for unge; Svalbard-beredskap opp",
     "+1,9 mrd. til politi/justis; 1,2 mrd. til grunnbemanning; 250 mill. mot gjeng",
     "Ap-forlik; Frps alt.budsjett"),
    ("Samferdsel",
     "+1,5 mrd. NTP; +1,1 mrd. til fylkene for kollektiv; månedskort ned ~100 kr",
     "+6,7 mrd. til samferdsel; +1,4 mrd. til reduserte bomtakster",
     "Ap-forlik; Frps alt.budsjett"),
    ("Klima — Enova",
     "+700 mill. kr",
     "–1,5 mrd. kr; kutter Langskip",
     "Ap-forlik; Frps alt.budsjett + Altinget"),
    ("Innvandring/integrering",
     "Ingen store kutt; nye tiltak for kvinner i jobb (+23 mill.)",
     "–7,5 mrd. kr; –5 mrd. integreringstilskudd; –360 mill. norskopplæring; bosetter 13 500 færre",
     "Regjeringen.no; Frps alt.budsjett + Document.no"),
    ("Bistand",
     "1 % av BNI (56,6 mrd. kr)",
     "–15,8 mrd. kr; ned til 0,7 % av BNI",
     "Stortinget innst 002 S; Frps alt.budsjett"),
    ("Kirke og kultur",
     "Prioritering av kunst, kultur, museum, dans, musikk",
     "–5,7 mrd. kr; –3 mrd. NRK; –180 mill. kunstnerstipend",
     "Regjeringen.no; FriFagbevegelse"),
    ("Sum skatte-/avgiftskutt",
     "Netto ~4 mrd. (målrettet)",
     "53,7 mrd. (35,7 skatt + 16 avgift + 2 strøm)",
     "Prop 1 S; Frps alt.budsjett"),
    ("Oljepengebruk",
     "Innenfor handlingsregelen",
     "+15 mrd. kr utover regjeringens forslag",
     "Altinget; Frps alt.budsjett"),
]

def budsjett_rows_html():
    rows = []
    for kat, ap, frp, kilde in BUDSJETT_ROWS:
        rows.append(f"""      <tr>
        <th scope="row" class="cmp__cat">{kat}</th>
        <td class="cmp__ap"><span class="cmp__party">Ap-regjering</span>{ap}</td>
        <td class="cmp__frp"><span class="cmp__party">Frp alternativ</span>{frp}</td>
        <td class="cmp__kilde">{kilde}</td>
      </tr>""")
    return "\n".join(rows)


def page_shell(active, title, description, body):
    return f"""<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="{description}">
<title>{title} — Usminket politikk</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
{header_html(active)}
<main>
{body}
</main>
{footer_html()}
<script src="js/main.js"></script>
</body>
</html>
"""


def build_budsjett_page():
    body = f"""<section class="section hero-slim">
  <div class="wrap">
    <span class="section-eyebrow">Analyse · Budsjett 2026</span>
    <h1 class="hero__title">Statsbudsjett 2026: <em>Ap-regjering mot Frps alternativ</em></h1>
    <p class="lede">
      Regjeringen la fram statsbudsjettet for 2026 den 15. oktober 2025 (<a href="https://www.regjeringen.no/no/dokumenter/prop.-1-s-20252026/id3123694/" target="_blank" rel="noopener">Prop. 1 S 2025–2026</a>). Ap fikk flertall gjennom forlik med SV, Sp, Rødt og MDG. Frp la fram sitt alternative budsjett i november 2025 (<a href="https://www.frp.no/files/Alternativt-statsbudsjett/alternativt-statsbudsjett-2026-web.pdf" target="_blank" rel="noopener">frp.no</a>). Under følger en direkte sammenligning på 22 punkter — så du selv kan se hvor forskjellene ligger.
    </p>
  </div>
</section>

<section class="section section--surface">
  <div class="wrap">
    <div class="cmp-header">
      <div class="cmp-header__ap">
        <span class="cmp-header__label">Regjeringens budsjett</span>
        <h2>Ap-regjering + budsjettforlik</h2>
        <p>Vedtatt av Stortinget desember 2025. Trygg økonomisk styring, lavere prisvekst, målrettet skattelette til lave og middels inntekter, styrking av kommune, sykehus og distrikt.</p>
      </div>
      <div class="cmp-header__frp">
        <span class="cmp-header__label">Alternativt budsjett</span>
        <h2>Frps alternativ</h2>
        <p>53,7 milliarder i skatte- og avgiftskutt, finansiert av kutt i integrering, bistand og kultur, samt 15 mrd. i økt oljepengebruk. Utmerker seg ved svært store kutt i formuesskatt og matmoms.</p>
      </div>
    </div>

    <div class="cmp-table-wrap">
      <table class="cmp-table">
        <thead>
          <tr>
            <th scope="col">Post</th>
            <th scope="col">Ap-regjering</th>
            <th scope="col">Frp alternativ</th>
            <th scope="col">Kilde</th>
          </tr>
        </thead>
        <tbody>
{budsjett_rows_html()}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <span class="section-eyebrow">Hovedretning</span>
    <h2 class="section-title" style="margin-bottom: var(--space-6)">To ulike samfunnsmodeller</h2>
    <div class="two-col">
      <div>
        <h3 style="color: var(--red); font-family: var(--font-sans); text-transform: uppercase; letter-spacing: 0.14em; font-size: var(--text-sm)">Ap-regjeringens grep</h3>
        <p>Prioriterer <em>fellesskapsløsninger</em>: rimeligere barnehage, gratis SFO for de yngste, økt barnetrygd, gjeldsslette i distrikt, flere sykehjemsplasser og styrket kommuneøkonomi. Skattelette gis til lav- og middelinntekter gjennom økt personfradrag og redusert trygdeavgift, ikke gjennom formuesskatten. Klimaavgifter trappes opp for å nå målene i 2030 og 2035. Bistand holdes på 1 % av BNI.</p>
      </div>
      <div>
        <h3 style="color: var(--red); font-family: var(--font-sans); text-transform: uppercase; letter-spacing: 0.14em; font-size: var(--text-sm)">Frps hovedgrep</h3>
        <p>Prioriterer <em>lavere skatter og avgifter for alle</em>: 35,7 mrd. i skattekutt (personfradrag opp til 127 850 kr, formuesskattens bunnfradrag til 3 mill., verdsettelse aksjer 50 %) og 16 mrd. i avgiftskutt (halvert matmoms, halvert veibruksavgift, ingen CO₂-økning). Dekker inn ved å kutte 15,8 mrd. i bistand, 7,5 mrd. i innvandring/integrering, 5,7 mrd. i kirke/kultur (inkl. 3 mrd. i NRK) og ved å bruke 15 mrd. mer oljepenger enn regjeringen.</p>
      </div>
    </div>
  </div>
</section>

<section class="section section--surface">
  <div class="wrap">
    <span class="section-eyebrow">Kilder for hele sammenligningen</span>
    <h2 class="section-title" style="margin-bottom: var(--space-6)">Dokumentasjon</h2>
    <div class="prose">
      <ol style="line-height: 1.9; font-family: var(--font-sans); font-size: var(--text-sm); color: var(--muted);">
        <li>Regjeringen, Prop. 1 S (2025–2026) — Statsbudsjettet: <a href="https://www.regjeringen.no/no/dokumenter/prop.-1-s-20252026/id3123694/" target="_blank" rel="noopener">regjeringen.no</a></li>
        <li>Regjeringen, Statsbudsjettet 2026 — Statens inntekter og utgifter: <a href="https://www.regjeringen.no/no/statsbudsjett/2026/statsbudsjettet-2026-statens-inntekter-og-utgifter/id3123348/" target="_blank" rel="noopener">regjeringen.no</a></li>
        <li>Arbeiderpartiet, Flertall for statsbudsjett 2026 (budsjettforlik): <a href="https://www.arbeiderpartiet.no/aktuelt/flertall-for-statsbudsjett-2026-med-arbeiderpartiet-sv-sp-rodt-og-mdg/" target="_blank" rel="noopener">arbeiderpartiet.no</a></li>
        <li>Frp, Alternativt statsbudsjett 2026 (PDF): <a href="https://www.frp.no/files/Alternativt-statsbudsjett/alternativt-statsbudsjett-2026-web.pdf" target="_blank" rel="noopener">frp.no</a></li>
        <li>Altinget, «Frps alternative budsjett: Øker oljepengebruk med 15 milliarder»: <a href="https://www.altinget.no/artikkel/frps-alternative-budsjett-oeker-oljepengebruk-med-15-milliarder-fjerner-ikke-hele-formuesskatten" target="_blank" rel="noopener">altinget.no</a></li>
        <li>Norges Bondelag, «Statsbudsjett for 2026 – endringer på skatte- og avgiftsrettens område»: <a href="https://www.bondelaget.no/rjr/skatt-regnskap-og-trygd/fagartikler/skatt-og-avgift/statsbudsjett-for-2026-endringer-pa-skatte-og-avgiftsrettens-omrade" target="_blank" rel="noopener">bondelaget.no</a></li>
        <li>FriFagbevegelse (LO), «Frp vil kutte 5,7 milliarder på kultur»: <a href="https://frifagbevegelse.no/loaktuelt/frp-vil-kutte-57-milliarder-pa-kultur--ingen-menneskerett-a-vare-pa-statsbudsjettet-6.158.1123931.e273a54546" target="_blank" rel="noopener">frifagbevegelse.no</a></li>
      </ol>
    </div>
  </div>
</section>

<section class="section section--surface">
  <div class="wrap">
    <span class="section-eyebrow">Videre lesing</span>
    <h2 class="section-title" style="margin-bottom: var(--space-8)">Utdyp gjennomgangen</h2>
    <div class="related">
      <a href="folk-flest.html"><div class="related__label">10</div><div class="related__title">Folk flest</div></a>
      <a href="skatt.html"><div class="related__label">01</div><div class="related__title">Skatt</div></a>
      <a href="velferd.html"><div class="related__label">02</div><div class="related__title">Velferd</div></a>
    </div>
  </div>
</section>
"""
    html = page_shell(
        "budsjett",
        "Statsbudsjett 2026 — Ap-regjering mot Frps alternativ",
        "Direkte sammenligning av regjeringens statsbudsjett for 2026 og Fremskrittspartiets alternative budsjett på 22 punkter. Kildebelagt.",
        body,
    )
    (BASE / "budsjett.html").write_text(html, encoding="utf-8")
    print("  budsjett.html: built")


# ---------- STEG 3: /folk-flest.html ----------

def build_folk_flest_page():
    body = """<section class="section hero-slim">
  <div class="wrap">
    <span class="section-eyebrow">Analyse · Folk flest</span>
    <h1 class="hero__title">Er Frp <em>for folk flest?</em></h1>
    <p class="lede">
      Frp har i tiår ført et image av å være arbeiderpartienes utfordrer om «vanlige folks» stemmer. Retorisk henvender partiet seg til «folk flest». Men når vi tester påstanden mot fordelingsprofilen i deres eget alternative statsbudsjett for 2026 og deres partiprogram for 2025–2029, blir bildet et annet. Denne siden går gjennom seks konkrete argumenter — med tall og kilder.
    </p>
  </div>
</section>

<section class="section section--surface">
  <div class="wrap">
    <span class="section-eyebrow">Argument 1</span>
    <h2 class="section-title">Formuesskattekuttet går til de 10 % rikeste</h2>
    <div class="prose">
      <p>Frp foreslår å heve bunnfradraget i formuesskatten fra 1,9 til 3 millioner kroner (6 mill. for ektepar), redusere satsen fra 1,0 til 0,8 prosent, og senke verdsettelsen på aksjer og driftsmidler til 50 prosent. Til sammen koster dette flere milliarder kroner i tapt proveny.</p>
      <p>Poenget: Formuesskatt betales kun av dem som eier mer enn 1,9 millioner i netto skattbar formue etter boligverdsettelse. Ifølge <a href="https://www.ssb.no/inntekt-og-forbruk/inntekt-og-formue/statistikk/inntekts-og-formuesstatistikk-for-husholdninger" target="_blank" rel="noopener">SSBs inntekts- og formuesstatistikk</a> er dette først og fremst husholdninger i den øvre delen av formuesfordelingen. En vanlig lønnsmottaker med normal bolig og pensjonssparing betaler lite eller ingen formuesskatt i utgangspunktet. Kuttet fordeler seg altså sterkt oppover i formuesfordelingen — det er ikke et «folk flest»-tiltak.</p>
    </div>
    <div class="stat-grid" style="margin-top: var(--space-8)">
      <div class="stat-block">
        <div class="stat-block__number">1 %</div>
        <div class="stat-block__label">Andel av husholdningene som eier omtrent en fjerdedel av all netto formue i Norge</div>
        <div class="stat-block__source">SSB inntekts- og formuesstatistikk</div>
      </div>
      <div class="stat-block">
        <div class="stat-block__number">1,9 → 3 mill.</div>
        <div class="stat-block__label">Frps forslag til nytt bunnfradrag — hever terskelen for hvem som betaler formuesskatt</div>
        <div class="stat-block__source">Frps alternative statsbudsjett 2026</div>
      </div>
      <div class="stat-block">
        <div class="stat-block__number">50 %</div>
        <div class="stat-block__label">Frps foreslåtte verdsettelse på aksjer og driftsmidler — gir størst utslag for dem med store aksjeporteføljer</div>
        <div class="stat-block__source">Frps alternative statsbudsjett 2026</div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <span class="section-eyebrow">Argument 2</span>
    <h2 class="section-title">Halvert matmoms — regressiv fordeling</h2>
    <div class="prose">
      <p>Frp foreslår å halvere matmomsen fra 15 til 7,5 prosent. Tiltaket koster om lag <strong>9 milliarder kroner</strong> i tapte inntekter.</p>
      <p>På overflaten lyder dette som et «folk flest»-tiltak — alle spiser, tross alt. Men når man ser på tallene, faller argumentet fra hverandre:</p>
      <ol>
        <li><strong>Andelen som brukes på mat</strong> er høyere i lavinntektshusholdninger, men den absolutte pengesummen som spares er mye høyere hos rike husholdninger som handler dyrere varer og oftere.</li>
        <li><strong>Effekten forutsetter at butikkene faktisk kutter prisene</strong>. Både Prisrådet og analytikere har påpekt at momskutt i næringer med begrenset konkurranse ofte havner hos leverandører og butikker, ikke hos forbrukerne.</li>
        <li><strong>9 milliarder kroner</strong> kunne finansiert 300 000 gratis barnehageplasser eller doblet den økte barnetrygden — begge deler er mer treffsikre for familier med dårlig råd.</li>
      </ol>
      <p>Konklusjon: Frps forslag er politisk salgbart, men det er ikke det mest treffsikre tiltaket for de som virkelig sliter med matbudsjettet.</p>
    </div>
  </div>
</section>

<section class="section section--surface">
  <div class="wrap">
    <span class="section-eyebrow">Argument 3</span>
    <h2 class="section-title">Kutt i AAP og trygdeytelser rammer syke</h2>
    <div class="prose">
      <p>I sitt alternative statsbudsjett foreslår Frp å likestille arbeidsavklaringspenger (AAP) og dagpenger på 62,4 prosent av inntekten opp til 6G — et kutt på 3,6 prosent for dem som allerede er ute av arbeidsmarkedet. Konsekvensen er ifølge <a href="https://frifagbevegelse.no/nyheter/slik-ville-hoyre-og-frp-styrt-norge-se-hva-de-bruker-pengene-pa-6.158.919012.cb80ec37c9" target="_blank" rel="noopener">FriFagbevegelse</a> at AAP-mottakere får rundt 9 000 kroner mindre å rutte med i året.</p>
      <p>AAP-mottakere er per definisjon mennesker som er syke, skadet eller under avklaring. Å kutte deres inntekt er ikke en «folk flest»-politikk — det er en politikk som rammer dem som er dårligst stilt i utgangspunktet.</p>
      <p>Samtidig kutter Frp 5 milliarder i integreringstilskudd og 360 millioner i norsk- og samfunnskunnskap for voksne innvandrere. Uansett hva man mener om innvandringsvolum, er dette ytelser som først og fremst går til familier med lav inntekt — ikke til «eliten».</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <span class="section-eyebrow">Argument 4</span>
    <h2 class="section-title">Kirke, kultur og NRK — 5,7 mrd. i kutt</h2>
    <div class="prose">
      <p>Frp foreslår 5,7 milliarder kroner i kutt i kirke- og kulturbudsjettet, inkludert 3 milliarder i kutt til NRK, 500 millioner til musikk- og scenekunstinstitusjoner, 180 millioner til kunstnerstipender og 20 millioner til garantiinntekter (<a href="https://frifagbevegelse.no/loaktuelt/frp-vil-kutte-57-milliarder-pa-kultur--ingen-menneskerett-a-vare-pa-statsbudsjettet-6.158.1123931.e273a54546" target="_blank" rel="noopener">FriFagbevegelse</a>).</p>
      <p>NRK er kanskje den viktigste demokratiske infrastrukturen i norsk offentlighet — gratis nyheter, kulturformidling og barne-tv til alle. Å halvere NRK-budsjettet er ikke en politikk som gir «folk flest» mer — det er en politikk som gir mer plass til kommersielle aktører som selger tilgang til den beste journalistikken bak betalingsmur.</p>
      <p>Bibliotek, teater, orkestre og distriktsmusikere er også tilbud som først og fremst brukes av dem som ikke har råd til betalte kulturopplevelser. Å kutte dem er å svekke tilbudet nettopp til dem med minst.</p>
    </div>
  </div>
</section>

<section class="section section--surface">
  <div class="wrap">
    <span class="section-eyebrow">Argument 5</span>
    <h2 class="section-title">Ingen «folk flest»-tanke om lønnstakerne</h2>
    <div class="prose">
      <p>Frp foreslår i sitt alternative budsjett å <em>fjerne fagforeningsfradraget</em> og erstatte det med økt personfradrag «som kommer alle til gode». Argumentet lyder demokratisk, men i praksis er dette et grep som svekker fagforeningenes økonomi og dermed norske arbeidstakeres kollektive forhandlingsposisjon.</p>
      <p>I norsk arbeidsliv er det tariffavtalene og fagforeningene som har sikret «folk flest» reallønnsvekst, ryddig arbeidstid, sykelønn og pensjon. Å svekke fagforeningene er ikke å styrke folk flest — det er å svekke det viktigste maktinstrumentet vanlige arbeidstakere har.</p>
      <p>Samtidig går Frp inn for mer bruk av innleie, sterkere adgang til midlertidige ansettelser og et mer «fleksibelt» arbeidsliv (partiprogrammet 2025–2029). Dette svekker forutsigbarheten for vanlige lønnstakere — og det er lavinntektsyrker som rammes hardest.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <span class="section-eyebrow">Argument 6</span>
    <h2 class="section-title">Regnestykket går ikke opp uten oljepenger</h2>
    <div class="prose">
      <p>Ifølge <a href="https://www.altinget.no/artikkel/frps-alternative-budsjett-oeker-oljepengebruk-med-15-milliarder-fjerner-ikke-hele-formuesskatten" target="_blank" rel="noopener">Altinget</a> øker Frps alternative budsjett oljepengebruken med 15 milliarder kroner utover regjeringens forslag. Dette er ikke en marginal justering — det er 15 milliarder ekstra ut av Statens pensjonsfond utland.</p>
      <p>Handlingsregelen ble innført nettopp for å hindre at kortsiktige skattekutt skulle spise av framtidas velferd. Når Frp finansierer skattekutt til dem som har mest ved å øke oljepengebruken, sender de i praksis regningen til fremtidige pensjonister, sykehuspasienter og skoleelever.</p>
      <p>Norges Bank og finansielle myndigheter har gjentatte ganger advart mot å tømme oljefondet for raskt. Frps budsjett aksepterer denne kritikken bare implisitt — ved å ikke svare på hvordan kuttene skal finansieres når oljealderen tar slutt.</p>
    </div>
    <blockquote class="pull-quote">
      <p>«Fremskrittspartiets alternative statsbudsjett viser at det er fullt mulig å prioritere annerledes uten å øke pengebruken dramatisk.»</p>
      <cite>— Frps eget alternative statsbudsjett 2026, s. 8</cite>
    </blockquote>
    <p class="prose">Sitatet er interessant fordi det er nettopp det motsatte av hva regnestykket viser: 15 milliarder ekstra i oljepengebruk <em>er</em> en dramatisk økning målt i norsk finanspolitisk kontekst. Retorikken og tallene stemmer ikke overens.</p>
  </div>
</section>

<section class="section section--surface">
  <div class="wrap">
    <span class="section-eyebrow">Konklusjon</span>
    <h2 class="section-title">Ord om <em>folk flest</em> — praksis for eierne</h2>
    <div class="prose">
      <p>Vår gjennomgang av Frps alternative statsbudsjett for 2026 og partiprogram 2025–2029 viser et konsistent mønster:</p>
      <ul>
        <li><strong>Skattekuttene er tyngst der formuen er størst</strong>, ikke der pengene trengs mest.</li>
        <li><strong>Kuttene rammer først dem som er syke, arbeidsledige, minoriteter eller kulturarbeidere</strong> — grupper med svak politisk stemme.</li>
        <li><strong>Fagforeningene svekkes systematisk</strong> gjennom fjernet skattefradrag og mer fleksibelt arbeidsliv.</li>
        <li><strong>Fellesgoder som NRK, bibliotek og distriktsmusikk kuttes</strong> — nettopp de tilbudene som gjør norsk kultur tilgjengelig for dem som ikke har råd til betalte alternativer.</li>
        <li><strong>Regningen sendes til fremtidas velferd</strong> gjennom 15 milliarder ekstra i oljepengebruk.</li>
      </ul>
      <p>Retorisk henvender Frp seg til «folk flest». Politisk fører de en politikk som prioriterer aksjeeiere, formuende og næringslivsinteresser fremfor lønnstakere, syke og trygdemottakere. Det er ikke det samme som å være for «folk flest» — det er en annen samfunnsmodell, som fortjener å bli diskutert med åpne kort.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <span class="section-eyebrow">Kilder</span>
    <h2 class="section-title" style="margin-bottom: var(--space-6)">Dokumentasjon</h2>
    <div class="prose">
      <ol style="line-height: 1.9; font-family: var(--font-sans); font-size: var(--text-sm); color: var(--muted);">
        <li>Frp, Alternativt statsbudsjett 2026 (PDF): <a href="https://www.frp.no/files/Alternativt-statsbudsjett/alternativt-statsbudsjett-2026-web.pdf" target="_blank" rel="noopener">frp.no</a></li>
        <li>Frp, Partiprogram 2025–2029: <a href="https://www.frp.no/files/Program/2025/FrP-Partiprogram-2025-2029.pdf" target="_blank" rel="noopener">frp.no</a></li>
        <li>SSB, Inntekts- og formuesstatistikk for husholdninger: <a href="https://www.ssb.no/inntekt-og-forbruk/inntekt-og-formue/statistikk/inntekts-og-formuesstatistikk-for-husholdninger" target="_blank" rel="noopener">ssb.no</a></li>
        <li>Altinget, «Frps alternative budsjett»: <a href="https://www.altinget.no/artikkel/frps-alternative-budsjett-oeker-oljepengebruk-med-15-milliarder-fjerner-ikke-hele-formuesskatten" target="_blank" rel="noopener">altinget.no</a></li>
        <li>FriFagbevegelse (LO), «Slik ville Høyre og Frp styrt Norge»: <a href="https://frifagbevegelse.no/nyheter/slik-ville-hoyre-og-frp-styrt-norge-se-hva-de-bruker-pengene-pa-6.158.919012.cb80ec37c9" target="_blank" rel="noopener">frifagbevegelse.no</a></li>
        <li>FriFagbevegelse, «Frp vil kutte 5,7 milliarder på kultur»: <a href="https://frifagbevegelse.no/loaktuelt/frp-vil-kutte-57-milliarder-pa-kultur--ingen-menneskerett-a-vare-pa-statsbudsjettet-6.158.1123931.e273a54546" target="_blank" rel="noopener">frifagbevegelse.no</a></li>
        <li>Regjeringen, Prop. 1 S (2025–2026): <a href="https://www.regjeringen.no/no/dokumenter/prop.-1-s-20252026/id3123694/" target="_blank" rel="noopener">regjeringen.no</a></li>
      </ol>
    </div>
  </div>
</section>

<section class="section section--surface">
  <div class="wrap">
    <span class="section-eyebrow">Videre lesing</span>
    <h2 class="section-title" style="margin-bottom: var(--space-8)">Sammenlign selv</h2>
    <div class="related">
      <a href="budsjett.html"><div class="related__label">09</div><div class="related__title">Budsjett 2026</div></a>
      <a href="skatt.html"><div class="related__label">01</div><div class="related__title">Skatt</div></a>
      <a href="velferd.html"><div class="related__label">02</div><div class="related__title">Velferd</div></a>
    </div>
  </div>
</section>
"""
    html = page_shell(
        "folk-flest",
        "Er Frp for folk flest? — Usminket politikk",
        "Analyse av Fremskrittspartiets alternative statsbudsjett 2026 og partiprogram 2025–2029: seks konkrete argumenter for hvorfor Frps politikk ikke tjener «folk flest».",
        body,
    )
    (BASE / "folk-flest.html").write_text(html, encoding="utf-8")
    print("  folk-flest.html: built")


# ---------- STEG 4: Oppdater navigasjon på alle sider + tema-grid på index ----------

def replace_header_and_footer_on_all_pages():
    slugs = ["index"] + [t[0] for t in THEMES] + ["om", "budsjett", "folk-flest"]
    for slug in slugs:
        path = BASE / f"{slug}.html"
        if not path.exists():
            continue
        html = path.read_text(encoding="utf-8")

        # Replace <header ...>...</header>
        header_re = re.compile(r"<header class=\"site-header\">.*?</header>", re.DOTALL)
        new_header = header_html(slug)
        html, hcount = header_re.subn(new_header, html, count=1)

        # Replace <footer ...>...</footer>
        footer_re = re.compile(r"<footer class=\"site-footer\">.*?</footer>", re.DOTALL)
        new_footer = footer_html()
        html, fcount = footer_re.subn(new_footer, html, count=1)

        path.write_text(html, encoding="utf-8")
        print(f"  {slug}.html: header={hcount} footer={fcount}")


def update_index_theme_grid():
    """Add cards for the two new analysis pages to the theme grid on index.html."""
    path = BASE / "index.html"
    html = path.read_text(encoding="utf-8")

    # Look for the last theme card (samferdsel) and inject two analysis cards
    # after it. We use markers based on the samferdsel card.
    marker_start = '<a href="samferdsel.html" class="theme-card'
    idx = html.find(marker_start)
    if idx == -1:
        print("  index.html: samferdsel card not found, skipping grid update")
        return

    # Find the closing </a> after this
    end_a = html.find("</a>", idx)
    if end_a == -1:
        return
    end_a += len("</a>")

    # Check if analysis cards already there
    if 'href="budsjett.html" class="theme-card' in html:
        print("  index.html: analysis cards already present")
        return

    analysis_cards = """
        <a href="budsjett.html" class="theme-card theme-card--analysis reveal">
          <div class="theme-card__number">09</div>
          <div class="theme-card__eyebrow">Analyse</div>
          <h3 class="theme-card__title">Budsjett 2026</h3>
          <p class="theme-card__lede">Direkte sammenligning av Ap-regjeringens budsjett og Frps alternativ — 22 punkter, alle kildebelagte.</p>
          <span class="theme-card__cta">Se sammenligning →</span>
        </a>
        <a href="folk-flest.html" class="theme-card theme-card--analysis reveal">
          <div class="theme-card__number">10</div>
          <div class="theme-card__eyebrow">Analyse</div>
          <h3 class="theme-card__title">Er Frp for folk flest?</h3>
          <p class="theme-card__lede">Seks argumenter mot Frps «folk flest»-retorikk — bygget på deres eget budsjett og program.</p>
          <span class="theme-card__cta">Les gjennomgangen →</span>
        </a>"""

    html = html[:end_a] + analysis_cards + html[end_a:]
    path.write_text(html, encoding="utf-8")
    print("  index.html: added 2 analysis cards")


# ---------- MAIN ----------
if __name__ == "__main__":
    print("[1/4] Building analysis pages...")
    build_budsjett_page()
    build_folk_flest_page()

    print("\n[2/4] Adding tema-news sections to theme pages...")
    for slug, _, _ in THEMES:
        add_tema_news_to_page(slug)

    print("\n[3/4] Replacing header + footer on all pages...")
    replace_header_and_footer_on_all_pages()

    print("\n[4/4] Updating index tema-grid...")
    update_index_theme_grid()

    print("\nDone.")
