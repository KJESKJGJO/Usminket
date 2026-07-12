"""Genererer alle temasider + oppdaterer footer/nav på tvers."""
from pathlib import Path

BASE = Path("/home/user/workspace/usminket")

THEMES = [
    ("skatt",       "01", "Fordeling",  "Skatt",       "Skatt: <em>hvem tjener på kuttene?</em>",              "hvem tjener på kuttene?"),
    ("velferd",     "02", "Fellesskap", "Velferd",     "Velferd: <em>fellesskap eller kommersialisering?</em>", "fellesskap eller kommersialisering?"),
    ("arbeidsliv",  "03", "Trygghet",   "Arbeidsliv",  "Arbeidsliv: <em>faste jobber eller løsere rammer?</em>", "faste jobber eller løsere rammer?"),
    ("klima",       "04", "Framtid",    "Klima",       "Klima: <em>omstilling eller status quo?</em>",         "omstilling eller status quo?"),
    ("innvandring", "05", "Ansvar",     "Innvandring", "Innvandring: <em>tall eller talemåter?</em>",          "tall eller talemåter?"),
    ("justis",      "06", "Rettsstat",  "Justis",      "Justis: <em>strengere straff, tryggere samfunn?</em>", "strengere straff, tryggere samfunn?"),
    ("distrikt",    "07", "Norge",      "Distrikt",    "Distrikt: <em>hvem eier hele landet?</em>",            "hvem eier hele landet?"),
    ("samferdsel",  "08", "Vei og vekk","Samferdsel",  "Samferdsel: <em>bomkrig eller helhet?</em>",           "bomkrig eller helhet?"),
]

def nav_html(active):
    theme_slugs = {t[0] for t in THEMES}
    is_theme = active in theme_slugs
    om_cls = ' class="is-active"' if active == "om" else ''
    home_cls = ' class="is-active"' if active == "index" else ''
    tema_cls = ' class="is-active"' if is_theme else ''
    # Full theme list — hidden on desktop, shown on mobile
    mobile_links = []
    for slug, _num, _sub, label, _h1, _sub_h1 in THEMES:
        cls = ' class="is-active"' if active == slug else ''
        mobile_links.append(f'      <a href="{slug}.html" data-mobile-only{cls}>{label}</a>')
    return f"""    <nav class="nav" data-nav aria-label="Hovedmeny">
      <a href="index.html"{home_cls}>Forside</a>
      <a href="index.html#tema" data-desktop-only{tema_cls}>Tema</a>
{chr(10).join(mobile_links)}
      <a href="om.html"{om_cls}>Om</a>
    </nav>"""

BRAND_SVG = """<svg class="brand__mark" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="22" r="14" fill="#C7302B"/>
        <path d="M17 7c1 3 5 4 6 1" stroke="#00843A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <text x="20" y="27" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="13" font-weight="700" font-style="italic" fill="#fff">Frp</text>
      </svg>"""

FOOTER_BRAND_SVG = BRAND_SVG.replace("brand__mark", "footer__brand__mark")

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

def footer_theme_links():
    """First 4 in first column, rest in second column."""
    col1 = [f'        <li><a href="{s}.html">{l}</a></li>' for s, _, _, l, _, _ in THEMES[:4]]
    col2 = [f'        <li><a href="{s}.html">{l}</a></li>' for s, _, _, l, _, _ in THEMES[4:]]
    return chr(10).join(col1), chr(10).join(col2)

def footer_html():
    col1, col2 = footer_theme_links()
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
      <h4>Om</h4>
      <ul>
        <li><a href="om.html">Om siden</a></li>
        <li><a href="om.html#metode">Metodikk</a></li>
        <li><a href="om.html#kontakt">Kontakt</a></li>
      </ul>
    </div>
  </div>
  <div class="footer__bottom">
    <span>© 2026 Usminket politikk · Redaksjonelt initiativ</span>
    <span>Utgitt for offentlig debatt — sitér gjerne med kildehenvisning.</span>
  </div>
</footer>

<script src="js/main.js"></script>
</body>
</html>"""

def theme_head(title, desc):
    return f"""<!doctype html>
<html lang="nb">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title} — Usminket politikk</title>
  <meta name="description" content="{desc}" />
  <meta property="og:title" content="{title} — Usminket politikk" />
  <meta property="og:description" content="{desc}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="css/style.css" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='18' r='11' fill='%23C7302B'/%3E%3Cpath d='M14 6c1 2 4 3 5 1' stroke='%2300843A' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3Ctext x='16' y='23' text-anchor='middle' font-family='Georgia,serif' font-size='11' font-weight='700' font-style='italic' fill='%23fff'%3EFrp%3C/text%3E%3C/svg%3E" />
</head>
<body>
"""

def page_hero(eyebrow, h1, lead, crumb):
    return f"""
<div class="wrap">
  <nav class="crumb" aria-label="Brødsmulesti">
    <a href="index.html">Forside</a><span class="crumb__sep">/</span><span>{crumb}</span>
  </nav>
</div>

<section class="page-hero">
  <div class="wrap">
    <div class="page-hero__eyebrow">{eyebrow}</div>
    <h1 class="page-hero__title">{h1}</h1>
    <p class="page-hero__lead">{lead}</p>
  </div>
</section>
"""

def related_section(current):
    """Show 3 other themes — circular selection so each page shows different neighbours."""
    idx = next((i for i, t in enumerate(THEMES) if t[0] == current), 0)
    others = []
    for offset in (1, 2, 3):
        others.append(THEMES[(idx + offset) % len(THEMES)])
    cards = []
    for slug, num, _sub, label, _h1, _sub_h1 in others:
        cards.append(f'<a href="{slug}.html"><div class="related__label">{num}</div><div class="related__title">{label}</div></a>')
    return f"""
<section class="section section--surface">
  <div class="wrap">
    <span class="section-eyebrow">Andre tema</span>
    <h2 class="section-title" style="margin-bottom: var(--space-8)">Se resten av <em>gjennomgangen</em></h2>
    <div class="related">
      {chr(10).join('      ' + c for c in cards).strip()}
    </div>
  </div>
</section>
"""

# ========================================================
# Innhold for hver av de fire NYE temasidene
# ========================================================

INNVANDRING_BODY = """
<section class="section">
  <div class="wrap">
    <span class="section-eyebrow">Sammenligning · Ap vs Frp</span>
    <h2 class="section-title reveal">Ansvar og integrering — <em>eller symbolpolitikk?</em></h2>
    <div class="comparison">
      <div class="compare-col compare-col--ap reveal">
        <div class="compare-col__label">Arbeiderpartiet</div>
        <div class="compare-col__party">Streng, men rettferdig praksis</div>
        <ul>
          <li>Regulert innvandring innenfor internasjonale forpliktelser og EØS.</li>
          <li>Tunge investeringer i integrering: norskopplæring, arbeidsdeltakelse, kvalifisering.</li>
          <li>Konsekvent politikk mot arbeidslivskriminalitet og sosial dumping.</li>
          <li>Ap-linjen: Norge tar sin del av ansvaret, men stiller krav om innsats fra alle.</li>
        </ul>
      </div>
      <div class="compare-col compare-col--frp reveal">
        <div class="compare-col__label">Fremskrittspartiet</div>
        <div class="compare-col__party">Dramatisk innstramming</div>
        <ul>
          <li>Vil stramme kraftig inn på asylantall og familiegjenforening.</li>
          <li>Sterkt kritisk til FN- og EØS-forpliktelser når de gir rettigheter.</li>
          <li>Ønsker fjerning eller kutt i støtteordninger til innvandrere.</li>
          <li>Argumentet: «Norge er fullt» og at innvandring er hovedårsaken til problemer.</li>
        </ul>
      </div>
    </div>

    <div class="stat-row reveal">
      <div class="stat">
        <div class="stat__num">≈ 1 av 5</div>
        <div class="stat__label">Norske innbyggere har innvandrerbakgrunn (innvandrere + norskfødte med innvandrerforeldre)</div>
        <div class="stat__source">Kilde: <a href="https://www.ssb.no/befolkning/innvandrere/statistikk/innvandrere-og-norskfodte-med-innvandrerforeldre" target="_blank" rel="noopener">SSB innvandrerstatistikk</a></div>
      </div>
      <div class="stat">
        <div class="stat__num">≈ 70 %</div>
        <div class="stat__label">Sysselsettingsgraden blant innvandrere fra Vest-Europa/EØS — sammenlignbart med norskfødte</div>
        <div class="stat__source">Kilde: <a href="https://www.ssb.no/arbeid-og-lonn/sysselsetting/statistikk/sysselsetting-blant-innvandrere-registerbasert" target="_blank" rel="noopener">SSB sysselsetting</a></div>
      </div>
      <div class="stat">
        <div class="stat__num">2/3</div>
        <div class="stat__label">Andelen norsk arbeidsinnvandring som kommer fra EØS-land — ikke fra asylsystemet</div>
        <div class="stat__source">Kilde: <a href="https://www.udi.no/statistikk-og-analyse/" target="_blank" rel="noopener">UDI statistikk og analyse</a></div>
      </div>
    </div>

    <div class="prose">
      <h3>Hva bildet faktisk er</h3>
      <p>Norsk innvandringspolitikk er strengere enn Frp ofte lar det virke som. Norge har en av Europas laveste andeler asylsøkere per innbygger, streng familiegjenforening, aktivitetskrav i introduksjonsprogrammet, og krav om selvforsørgelse for permanent oppholdstillatelse.</p>

      <h3>Hva Frp faktisk foreslår</h3>
      <p>Frp har foreslått konkrete kutt: sterkt reduserte kvoter for kvoteflyktninger, oppheving av introduksjonsstønad, fjerning eller reduksjon i barnetrygden for enkelte grupper, og innskrenkning i FN-konvensjoner. Programmet argumenterer for at innvandring har vært en «samfunnsmessig belastning».</p>

      <blockquote>
        «Innvandringsdebatten i Norge lider av tallblindhet. Det store bildet — at Norge trenger arbeidskraft, at EØS-innvandringen dominerer og at norsk asylpraksis er blant Europas strengeste — forsvinner bak enkeltsaker.»
        <cite>— Basert på sammenstillinger fra SSB, UDI og OECD International Migration Outlook</cite>
      </blockquote>

      <h3>Argumentet Frp bruker</h3>
      <p>«Innvandring koster Norge milliarder» — hentet fra bl.a. Brochmann-utvalgets langsiktige beregninger. Argumentet ignorerer at:</p>
      <ul>
        <li>Beregningene gjelder én bestemt gruppe (enkelte ikke-vestlige innvandrergrupper med lav sysselsetting), ikke innvandring som helhet.</li>
        <li>EØS-innvandring bidrar netto positivt til offentlige finanser.</li>
        <li>Kostnadsbildet bedres kraftig med økt sysselsetting — som er en integreringsutfordring, ikke et argument mot innvandring.</li>
      </ul>

      <h3>Konsekvens av Frps linje</h3>
      <p>Sterkt innstramming av flyktning- og familiegjenforeningspolitikken ville satt Norge på kollisjonskurs med FNs flyktningkonvensjon og Den europeiske menneskerettskonvensjonen. Samtidig ville kutt i introduksjonsprogrammet og norskopplæring gjort det motsatte av det som er hovedproblemet: <strong>å øke sysselsettingen blant de som allerede er her.</strong></p>
    </div>

    <div class="sources">
      <div class="sources__title">Kilder</div>
      <ol>
        <li>SSB, Innvandrerstatistikk, <a href="https://www.ssb.no/befolkning/innvandrere/statistikk/innvandrere-og-norskfodte-med-innvandrerforeldre" target="_blank" rel="noopener">ssb.no</a></li>
        <li>UDI, Statistikk og analyse, <a href="https://www.udi.no/statistikk-og-analyse/" target="_blank" rel="noopener">udi.no</a></li>
        <li>NOU 2017: 2, Integrasjon og tillit (Brochmann II), <a href="https://www.regjeringen.no/no/dokumenter/nou-2017-2/id2536701/" target="_blank" rel="noopener">regjeringen.no</a></li>
        <li>OECD International Migration Outlook, <a href="https://www.oecd.org/migration/international-migration-outlook-1999124x.htm" target="_blank" rel="noopener">oecd.org</a></li>
        <li>Frp, «Innvandring og integrering», <a href="https://www.frp.no/vi-mener" target="_blank" rel="noopener">frp.no/vi-mener</a></li>
      </ol>
    </div>
  </div>
</section>
"""

JUSTIS_BODY = """
<section class="section">
  <div class="wrap">
    <span class="section-eyebrow">Sammenligning · Ap vs Frp</span>
    <h2 class="section-title reveal">Rettsstat og forebygging — <em>eller strenghetskonkurranse?</em></h2>
    <div class="comparison">
      <div class="compare-col compare-col--ap reveal">
        <div class="compare-col__label">Arbeiderpartiet</div>
        <div class="compare-col__party">Forebygging + rettsstat</div>
        <ul>
          <li>Nærpoliti med tilstedeværelse i distriktene — reversering av deler av politireformen.</li>
          <li>Kunnskapsbasert forebygging — SLT, ungdomsstraff, rus- og psykiatri.</li>
          <li>Sterk domstol og påtalemyndighet, rettssikkerhet som ufravikelig prinsipp.</li>
          <li>Ap-linjen: forebygging er billigere og mer effektivt enn straff etter faktum.</li>
        </ul>
      </div>
      <div class="compare-col compare-col--frp reveal">
        <div class="compare-col__label">Fremskrittspartiet</div>
        <div class="compare-col__party">Strengere straff, mer synlighet</div>
        <ul>
          <li>Vil ha lengre straffer, høyere minstestraff, strengere reaksjoner.</li>
          <li>Ønsker flere synlige politibetjenter — men typisk konsentrert i sentrale strøk.</li>
          <li>Kritisk til «myke» reaksjoner som ungdomsstraff og alternativ til fengsel.</li>
          <li>Argumentet: strenge straffer skremmer fra kriminalitet.</li>
        </ul>
      </div>
    </div>

    <div class="stat-row reveal">
      <div class="stat">
        <div class="stat__num">– 30 %</div>
        <div class="stat__label">Fall i anmeldte lovbrudd per innbygger i Norge siste tiår — historisk lavt nivå</div>
        <div class="stat__source">Kilde: <a href="https://www.ssb.no/sosiale-forhold-og-kriminalitet/kriminalitet-og-rettsvesen/statistikk/anmeldte-lovbrudd-og-offer" target="_blank" rel="noopener">SSB kriminalstatistikk</a></div>
      </div>
      <div class="stat">
        <div class="stat__num">Ca. 20 %</div>
        <div class="stat__label">Norsk tilbakefall til fengsel — blant lavest i Europa</div>
        <div class="stat__source">Kilde: <a href="https://www.kriminalomsorgen.no/" target="_blank" rel="noopener">Kriminalomsorgen</a></div>
      </div>
      <div class="stat">
        <div class="stat__num">3–4×</div>
        <div class="stat__label">Så mye høyere er tilbakefallet i USA — landet med verdens strengeste straffer</div>
        <div class="stat__source">Kilde: <a href="https://bjs.ojp.gov/library/publications/recidivism" target="_blank" rel="noopener">US Bureau of Justice Statistics</a></div>
      </div>
    </div>

    <div class="prose">
      <h3>Hva forskningen sier</h3>
      <p>Rettssosiologi og kriminologisk forskning gir et tydelig svar: <strong>oppdagelsesrisiko virker, straffelengde virker knapt.</strong> En potensiell lovbryter påvirkes mest av sannsynligheten for å bli tatt — ikke av hvor mange år han eller hun vil sitte inne dersom det skulle skje.</p>

      <h3>Hva Frp faktisk foreslår</h3>
      <p>Frp har over årene foreslått en rekke innstramminger: økte minstestraffer, strengere sanksjoner for gjengangere, fjerning eller innskrenking av flere alternative reaksjoner, større bruk av forvaring, og hjemsendelse av utenlandske fanger.</p>

      <blockquote>
        «Norsk kriminalpolitikk er ikke mild av naivitet. Den er utformet på grunnlag av forskning på hva som faktisk gir lavt tilbakefall og trygge samfunn. Det virker.»
        <cite>— Basert på nordisk kriminologisk forskning og Kriminalomsorgens tilbakefallsstatistikk</cite>
      </blockquote>

      <h3>Argumentet Frp bruker</h3>
      <p>«Strengere straff virker preventivt.» Empirisk grunnlag: begrenset. Land med strengest straffer — USA er det ekstreme eksempelet — har typisk høyest kriminalitet og høyest tilbakefall. Norsk tilbakefall er blant Europas laveste, nettopp fordi soningen kombineres med utdanning, rusbehandling og gradvis tilbakevending til samfunnet.</p>

      <h3>Konsekvens av Frps linje</h3>
      <p>Lengre straffer betyr flere fanger, høyere kostnader og — sannsynligvis — <strong>høyere</strong> tilbakefall, ikke lavere. Kuttet i rusbehandling og psykiatri i fengslene som Frp historisk har argumentert for, ville forsterket problemet. Nærpoliti-linjen — som Ap har fått gjennom viktige justeringer på — treffer bedre den faktiske hverdagskriminaliteten som folk møter.</p>
    </div>

    <div class="sources">
      <div class="sources__title">Kilder</div>
      <ol>
        <li>SSB, Kriminalstatistikk, <a href="https://www.ssb.no/sosiale-forhold-og-kriminalitet/kriminalitet-og-rettsvesen/statistikk/anmeldte-lovbrudd-og-offer" target="_blank" rel="noopener">ssb.no</a></li>
        <li>Kriminalomsorgen, årsrapport og tilbakefallsstatistikk, <a href="https://www.kriminalomsorgen.no/" target="_blank" rel="noopener">kriminalomsorgen.no</a></li>
        <li>Nasjonalt kunnskapssenter for helsetjenesten / Politihøgskolen — forebyggingsforskning</li>
        <li>US Bureau of Justice Statistics, Recidivism, <a href="https://bjs.ojp.gov/library/publications/recidivism" target="_blank" rel="noopener">bjs.ojp.gov</a></li>
        <li>Frp, «Justis og beredskap», <a href="https://www.frp.no/vi-mener" target="_blank" rel="noopener">frp.no/vi-mener</a></li>
      </ol>
    </div>
  </div>
</section>
"""

DISTRIKT_BODY = """
<section class="section">
  <div class="wrap">
    <span class="section-eyebrow">Sammenligning · Ap vs Frp</span>
    <h2 class="section-title reveal">Hele landet i bruk — <em>eller sentralisering?</em></h2>
    <div class="comparison">
      <div class="compare-col compare-col--ap reveal">
        <div class="compare-col__label">Arbeiderpartiet</div>
        <div class="compare-col__party">Aktiv distriktspolitikk</div>
        <ul>
          <li>Differensiert arbeidsgiveravgift, distriktsfradrag og tilrettelegging for næringsliv utenfor de store byene.</li>
          <li>Sterkt kommunetilskudd som utjevner mellom kommunene.</li>
          <li>Sats på industri i distriktene: batterier, havvind, prosessindustri.</li>
          <li>Ap-linjen: Norges styrke ligger i hele landet — økonomisk, kulturelt, sikkerhetspolitisk.</li>
        </ul>
      </div>
      <div class="compare-col compare-col--frp reveal">
        <div class="compare-col__label">Fremskrittspartiet</div>
        <div class="compare-col__party">Sentralisering under markedsvokabular</div>
        <ul>
          <li>Kritisk til «distriktssubsidier» — vil kutte i differensiert arbeidsgiveravgift.</li>
          <li>Vil samle offentlige tjenester i færre, større enheter.</li>
          <li>Foreslår kutt i kommunerammer og motsetter seg utjevningsordninger.</li>
          <li>Argumentet: markedet skal styre hvor folk bor.</li>
        </ul>
      </div>
    </div>

    <div class="stat-row reveal">
      <div class="stat">
        <div class="stat__num">≈ 40 %</div>
        <div class="stat__label">Andelen av norsk verdiskapning som skapes utenfor Oslo-området — det meste i distriktsnæringer (havbruk, energi, industri)</div>
        <div class="stat__source">Kilde: <a href="https://www.ssb.no/nasjonalregnskap-og-konjunkturer/statistikker/fnr" target="_blank" rel="noopener">SSB fylkesfordelt nasjonalregnskap</a></div>
      </div>
      <div class="stat">
        <div class="stat__num">21 mrd</div>
        <div class="stat__label">Kommunalt inntektsutjevning i 2024 — bærebjelken i at små kommuner kan drive skole, sykehjem og barnehage</div>
        <div class="stat__source">Kilde: <a href="https://www.regjeringen.no/no/tema/kommuner-og-regioner/kommuneokonomi/id1052/" target="_blank" rel="noopener">Kommunal- og distriktsdepartementet</a></div>
      </div>
      <div class="stat">
        <div class="stat__num">1000 mrd+</div>
        <div class="stat__label">Verdien av norsk sjømatnæring de neste tiårene — hovedsakelig langs distriktskysten</div>
        <div class="stat__source">Kilde: <a href="https://www.regjeringen.no/no/tema/mat-fiske-og-landbruk/fiskeri-og-havbruk/id1284/" target="_blank" rel="noopener">Nærings- og fiskeridept.</a></div>
      </div>
    </div>

    <div class="prose">
      <h3>Hva står på spill</h3>
      <p>Norsk distriktspolitikk er ikke veldedighet — det er økonomisk politikk. Verdiene skapes der oljen, gassen, fisken, kraften, mineralene og skogen er. Sentraliserer man tjenester og trekker ut støtteordninger, forvitrer den lokale kompetansen som verdiskapningen krever.</p>

      <h3>Hva Frp faktisk foreslår</h3>
      <p>Frp har over flere alternative statsbudsjetter foreslått kutt i differensiert arbeidsgiveravgift, redusert rammetilskudd til kommunene, mindre utjevning mellom kommuner, og strammere krav til sentralisering av offentlige tjenester. Partiet har vært en pådriver for kommunesammenslåing og for fjerning av regionale utviklingsvirkemidler.</p>

      <blockquote>
        «Distriktene finansierer store deler av Norge — gjennom kraft, fisk, industri og skog. Å svekke ordningene som gjør at folk kan bli boende der er ikke bare distriktspolitikk. Det er dårlig næringspolitikk.»
        <cite>— Basert på fylkesfordelt nasjonalregnskap og distriktsnæringsanalyser</cite>
      </blockquote>

      <h3>Argumentet Frp bruker</h3>
      <p>«Markedet skal bestemme hvor folk bor.» Argumentet later som at fravær av distriktspolitikk er nøytralt. Det er det ikke. Uten aktiv politikk konsentreres kapital, arbeidsplasser og tjenester i sentrale strøk. Det er ikke marked som virker — det er skalaeffekter og statlige beslutninger om lokalisering.</p>

      <h3>Konsekvens av Frps linje</h3>
      <p>Kutt i inntektsutjevning ville rammet små kommuner hardt: dårligere skole, færre sykehjemsplasser, lengre reisevei til lege. Kutt i arbeidsgiveravgift i sentrale strøk ville flyttet arbeidsplasser østover. Og reduksjon i lokal offentlig sektor kutter samtidig ut det som ofte er største arbeidsgiver i utkantkommuner.</p>
    </div>

    <div class="sources">
      <div class="sources__title">Kilder</div>
      <ol>
        <li>SSB, Fylkesfordelt nasjonalregnskap, <a href="https://www.ssb.no/nasjonalregnskap-og-konjunkturer/statistikker/fnr" target="_blank" rel="noopener">ssb.no</a></li>
        <li>Kommunal- og distriktsdept., <a href="https://www.regjeringen.no/no/tema/kommuner-og-regioner/kommuneokonomi/id1052/" target="_blank" rel="noopener">regjeringen.no</a></li>
        <li>Distriktssenteret, <a href="https://distriktssenteret.no/" target="_blank" rel="noopener">distriktssenteret.no</a></li>
        <li>Nærings- og fiskeridept., <a href="https://www.regjeringen.no/no/tema/mat-fiske-og-landbruk/fiskeri-og-havbruk/id1284/" target="_blank" rel="noopener">regjeringen.no</a></li>
        <li>Frp, «Kommuner og fylker», <a href="https://www.frp.no/vi-mener" target="_blank" rel="noopener">frp.no/vi-mener</a></li>
      </ol>
    </div>
  </div>
</section>
"""

SAMFERDSEL_BODY = """
<section class="section">
  <div class="wrap">
    <span class="section-eyebrow">Sammenligning · Ap vs Frp</span>
    <h2 class="section-title reveal">Helhet og fellesskap — <em>eller bomsjokk-populisme?</em></h2>
    <div class="comparison">
      <div class="compare-col compare-col--ap reveal">
        <div class="compare-col__label">Arbeiderpartiet</div>
        <div class="compare-col__party">Helhetlig transportplan</div>
        <ul>
          <li>Nasjonal transportplan med kombinasjon av vei, bane, kollektiv og gang/sykkel.</li>
          <li>Realistisk skattefinansiering + bomfinansiering der det er nødvendig.</li>
          <li>Storsatsing på jernbane og ferjer — bindeledd i hele landet.</li>
          <li>Ap-linjen: transport er infrastruktur, ikke ideologi.</li>
        </ul>
      </div>
      <div class="compare-col compare-col--frp reveal">
        <div class="compare-col__label">Fremskrittspartiet</div>
        <div class="compare-col__party">Vei først, alt annet siden</div>
        <ul>
          <li>Nesten alt fokus på vei — kritisk til jernbane og kollektiv der det ikke er «lønnsomt».</li>
          <li>Vil fjerne eller kutte bomringer og drivstoffavgifter.</li>
          <li>Kritisk til byvekstavtaler og krav om nullvekst i biltrafikk i storbyene.</li>
          <li>Argumentet: bilen er «frihet», bommer er skattlegging av vanlige folk.</li>
        </ul>
      </div>
    </div>

    <div class="stat-row reveal">
      <div class="stat">
        <div class="stat__num">1 200 mrd</div>
        <div class="stat__label">Nasjonal transportplan 2025–2036 — langsiktig satsing på vei, bane og kollektiv</div>
        <div class="stat__source">Kilde: <a href="https://www.regjeringen.no/no/tema/transport-og-kommunikasjon/nasjonal-transportplan/id2856180/" target="_blank" rel="noopener">Samferdselsdept., NTP 2025–2036</a></div>
      </div>
      <div class="stat">
        <div class="stat__num">≈ 60 %</div>
        <div class="stat__label">Andel av all persontransport i Oslo som skjer med kollektiv, sykkel eller til fots — mye takket være bompolitikk</div>
        <div class="stat__source">Kilde: <a href="https://www.ruter.no/" target="_blank" rel="noopener">Ruter</a>, byvekstavtaler</div>
      </div>
      <div class="stat">
        <div class="stat__num">≈ 20 mrd</div>
        <div class="stat__label">Årlig statlig kjøp av kollektivtransport, tog, bane, buss — som Frp ofte vil kutte</div>
        <div class="stat__source">Kilde: <a href="https://www.regjeringen.no/no/tema/transport-og-kommunikasjon/id555/" target="_blank" rel="noopener">Samferdselsdept.</a></div>
      </div>
    </div>

    <div class="prose">
      <h3>Hva står på spill</h3>
      <p>Samferdsel er kanskje det politikkområdet der Frps retorikk fungerer best mot enkeltsaker og dårligst i helhet. «Fjern bommene» er lett å si. Betydelig vanskeligere: hva skal erstatte dem, når vei koster hundrevis av milliarder å bygge og drifte?</p>

      <h3>Hva Frp faktisk foreslår</h3>
      <p>I alternative budsjetter og programmet: kraftige kutt i drivstoffavgifter, fjerning av bomringer eller sterk reduksjon, motstand mot byvekstavtaler, redusert satsing på jernbane, og kutt i statlig kollektivkjøp. Samtidig loves store veiinvesteringer — uten realistisk inndekning.</p>

      <blockquote>
        «Bilen er ikke fienden — men i storbyene er den kapasitetsbegrensingen. Uten kollektiv og byvekstavtaler stanser Oslo, Bergen, Trondheim og Stavanger opp — og bilistene med.»
        <cite>— Basert på TØI-analyser av byvekst og trafikkflyt</cite>
      </blockquote>

      <h3>Argumentet Frp bruker</h3>
      <p>«Bommer er urettferdig skattlegging av vanlige folk.» Halvsant. Bommer er brukerbetaling for veier som ellers ville tatt tiår å bygge fordi statskassen ikke kan finansiere alt samtidig. Kutter man bommene, må enten (1) veiene bygges ikke, (2) andre avgifter opp, eller (3) mer oljepenger inn. Ingen av delene passer inn i Frps øvrige politikk.</p>

      <h3>Konsekvens av Frps linje</h3>
      <p>Sterkt kutt i drivstoffavgifter + fjerning av bommer + mindre kollektiv = kraftig underdekning i samferdselsbudsjettet. Enten kutter man mye i veier, eller man tar det fra andre områder. Historisk har Frp forsøkt å hoppe over regnestykket ved å love både veier og skattekutt. Regningen kommer alltid til slutt.</p>
    </div>

    <div class="sources">
      <div class="sources__title">Kilder</div>
      <ol>
        <li>Samferdselsdepartementet, Nasjonal transportplan 2025–2036, <a href="https://www.regjeringen.no/no/tema/transport-og-kommunikasjon/nasjonal-transportplan/id2856180/" target="_blank" rel="noopener">regjeringen.no</a></li>
        <li>Statens vegvesen, <a href="https://www.vegvesen.no/" target="_blank" rel="noopener">vegvesen.no</a></li>
        <li>TØI (Transportøkonomisk institutt), <a href="https://www.toi.no/" target="_blank" rel="noopener">toi.no</a></li>
        <li>Ruter og byvekstavtaler, <a href="https://www.ruter.no/" target="_blank" rel="noopener">ruter.no</a></li>
        <li>Frp, «Samferdsel», <a href="https://www.frp.no/vi-mener" target="_blank" rel="noopener">frp.no/vi-mener</a></li>
      </ol>
    </div>
  </div>
</section>
"""

# Bodies for existing themes (unchanged) — keep in dict for regeneration convenience.
# We only regenerate the four NEW pages; existing pages keep their current bodies.
NEW_BODIES = {
    "innvandring": INNVANDRING_BODY,
    "justis":      JUSTIS_BODY,
    "distrikt":    DISTRIKT_BODY,
    "samferdsel":  SAMFERDSEL_BODY,
}

NEW_META = {
    "innvandring": (
        "Innvandring — tall eller talemåter?",
        "Frp vil stramme kraftig inn på innvandring. Vi ser på hva SSB, UDI og OECD faktisk viser om norsk innvandring og integrering.",
        "Streng, faktabasert innvandringspolitikk møter Frps retorikk. Vi ser på SSB, UDI og OECD-tallene som ofte forsvinner i debatten.",
    ),
    "justis": (
        "Justis — strengere straff, tryggere samfunn?",
        "Frp vil ha strengere straffer. Vi ser på hva kriminologisk forskning og Kriminalomsorgens tilbakefallsstatistikk viser.",
        "Norge har blant Europas laveste tilbakefall til fengsel. Frp vil ha strengere straffer. Vi ser på hva forskningen faktisk sier virker.",
    ),
    "distrikt": (
        "Distrikt — hvem eier hele landet?",
        "Frp er kritisk til distriktspolitikk og utjevningsordninger. Vi ser på hva som skaper verdiene i Norge og hvor.",
        "40 % av norsk verdiskapning skjer utenfor Oslo-området. Frp vil kutte i distriktsordninger. Vi ser på hva som ville skjedd.",
    ),
    "samferdsel": (
        "Samferdsel — bomkrig eller helhet?",
        "Frp vil fjerne bommer og drivstoffavgifter. Vi ser på Nasjonal transportplan og hva helheten faktisk krever.",
        "1 200 milliarder til vei, bane og kollektiv over 12 år. Frp vil kutte i bommer og kollektiv. Vi ser på regnestykket som må gå opp.",
    ),
}

for slug, num, sub, label, h1, sub_h1 in THEMES:
    if slug not in NEW_BODIES:
        continue
    title, desc, lead = NEW_META[slug]
    html_parts = [
        theme_head(title, desc),
        header_html(slug),
        "<main>",
        page_hero(f"{num} · {sub}", h1, lead, label),
        NEW_BODIES[slug],
        related_section(slug),
        "</main>",
        footer_html(),
    ]
    (BASE / f"{slug}.html").write_text("\n".join(html_parts), encoding="utf-8")
    print(f"Wrote {slug}.html")

print("Done — new theme pages")
